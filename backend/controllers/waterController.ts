import { Context } from "../deps.ts";
import { RouterContext } from "../deps.ts";
import dbClient, { ensureConnection } from "../services/db.ts";

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// POST /api/water-logs
export async function logWaterHandler(ctx: RouterContext) {
    const response: ApiResponse = { success: false };
    try {
        const userId = ctx.state.userId as string;
        if (!userId) {
            ctx.response.status = 401;
            response.error = "User not authenticated";
            ctx.response.body = response;
            return;
        }

        const body = ctx.request.body();
        if (body.type !== "json") {
            ctx.response.status = 400;
            response.error = "Invalid request body";
            ctx.response.body = response;
            return;
        }
        const { amount_ml, date } = await body.value;

        if (!amount_ml || typeof amount_ml !== 'number') {
            ctx.response.status = 400;
            response.error = "Amount (ml) is required and must be a number";
            ctx.response.body = response;
            return;
        }

        const logDate = date ? new Date(date) : new Date();

        await ensureConnection();

        const insertQuery = `
      INSERT INTO water_logs (user_id, amount_ml, log_date)
      VALUES ($1, $2, $3)
      RETURNING log_id, amount_ml, log_date
    `;

        const result = await dbClient.queryObject(insertQuery, [userId, amount_ml, logDate]);

        response.success = true;
        response.data = result.rows[0];
        response.message = `Logged ${amount_ml}ml of water`;
        ctx.response.status = 201;
        ctx.response.body = response;

    } catch (error) {
        console.error("Error logging water:", error);
        ctx.response.status = 500;
        response.error = error instanceof Error ? error.message : "Unknown error";
        ctx.response.body = response;
    }
}

// GET /api/water-logs/daily?date=YYYY-MM-DD
export async function getDailyWaterHandler(ctx: RouterContext) {
    try {
        const userId = ctx.state.userId as string;
        if (!userId) {
            ctx.response.status = 401;
            ctx.response.body = { success: false, error: "User not authenticated" };
            return;
        }

        let targetDate = ctx.request.url.searchParams.get("date");
        if (!targetDate) {
            const today = new Date();
            targetDate = today.toISOString().split('T')[0];
        }

        // Ensure we are querying for the whole day in user's timezone if possible, 
        // but simplified: query by DATE(log_date)

        await ensureConnection();

        const query = `
      SELECT SUM(amount_ml) as total_ml
      FROM water_logs
      WHERE user_id = $1 AND DATE(log_date) = $2
    `;

        const result = await dbClient.queryObject<{ total_ml: number | null }>(query, [userId, targetDate]);
        const total = result.rows[0]?.total_ml || 0;

        ctx.response.status = 200;
        ctx.response.body = {
            success: true,
            data: { date: targetDate, total_ml: Number(total) },
        };

    } catch (error) {
        console.error("Error fetching daily water:", error);
        ctx.response.status = 500;
        ctx.response.body = { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}
