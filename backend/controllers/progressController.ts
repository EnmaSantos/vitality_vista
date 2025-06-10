import { Context } from "../deps.ts";
import dbClient, { ensureConnection } from "../services/db.ts";
import { UserBodyMetricLogSchema } from "../models/userBodyMetricLog.model.ts";

// Consistent API Response Format
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Gets all metric logs for a specific metric type for the authenticated user.
 */
export async function getUserMetricLogsHandler(ctx: Context) {
  const response: ApiResponse<UserBodyMetricLogSchema[]> = { success: false };
  try {
    await ensureConnection();

    const userId = ctx.state.userId as string;
    if (!userId) {
      ctx.response.status = 401;
      response.error = "User not authenticated";
      ctx.response.body = response;
      return;
    }

    const metricType = ctx.params.metricType;
    if (!metricType || metricType.trim().length === 0) {
      ctx.response.status = 400;
      response.error = "Metric type is required";
      ctx.response.body = response;
      return;
    }

    console.log(`[progressController] Fetching metric logs for user: ${userId}, metric: ${metricType}`);

    const selectQuery = `
      SELECT log_id, user_id, metric_type, value, unit, TO_CHAR(log_date, 'YYYY-MM-DD') as log_date, notes, created_at, updated_at
      FROM user_body_metric_logs
      WHERE user_id = $1 AND metric_type = $2
      ORDER BY log_date ASC
    `; // Ordered ASC for charting (oldest to newest)

    const result = await dbClient.queryObject<UserBodyMetricLogSchema>(
      selectQuery,
      [userId, metricType]
    );

    response.success = true;
    response.data = result.rows;
    response.message = `Found ${result.rows.length} logs for metric type '${metricType}'`;
    ctx.response.status = 200;
    ctx.response.body = response;

  } catch (error) {
    console.error(`Error in getUserMetricLogsHandler (metric: ${ctx.params.metricType}):`, error);
    response.success = false;
    response.error = error instanceof Error ? error.message : "Unknown error occurred";
    ctx.response.status = 500;
    ctx.response.body = response;
  }
}

// TODO: Add handler for creating/logging a new body metric
// export async function logUserBodyMetricHandler(ctx: Context) { ... } 