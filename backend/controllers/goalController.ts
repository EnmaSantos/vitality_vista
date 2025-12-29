import { Context } from "../deps.ts";
import dbClient from "../services/db.ts";
import { DailyGoalSchema, DAILY_GOALS_TABLE_NAME } from "../models/dailyGoal.model.ts";
import { getNumericDate } from "../deps.ts";

export const getDailyGoalsHandler = async (ctx: Context) => {
    try {
        const userId = ctx.state.userId as string;
        const date = ctx.request.url.searchParams.get("date");

        if (!date) {
            ctx.response.status = 400;
            ctx.response.body = { success: false, message: "Date parameter is required (YYYY-MM-DD)" };
            return;
        }

        const query = `
      SELECT goal_id, user_id, text, completed, goal_date, created_at
      FROM ${DAILY_GOALS_TABLE_NAME}
      WHERE user_id = $1 AND goal_date = $2::DATE
      ORDER BY created_at ASC;
    `;

        const result = await dbClient.queryObject<DailyGoalSchema>(query, [userId, date]);

        ctx.response.status = 200;
        ctx.response.body = {
            success: true,
            data: result.rows,
        };
    } catch (error) {
        console.error("Error fetching daily goals:", error);
        ctx.response.status = 500;
        ctx.response.body = {
            success: false,
            message: "Failed to fetch daily goals",
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
};

export const addGoalHandler = async (ctx: Context) => {
    try {
        const userId = ctx.state.userId as string;
        if (!ctx.request.hasBody) {
            ctx.response.status = 400;
            ctx.response.body = { success: false, message: "No data provided" };
            return;
        }

        const body = ctx.request.body({ type: "json" });
        const { text, date } = await body.value;

        if (!text || !date) {
            ctx.response.status = 400;
            ctx.response.body = { success: false, message: "Text and date are required" };
            return;
        }

        const query = `
      INSERT INTO ${DAILY_GOALS_TABLE_NAME} (user_id, text, goal_date)
      VALUES ($1, $2, $3::DATE)
      RETURNING goal_id, text, completed, goal_date;
    `;

        const result = await dbClient.queryObject<DailyGoalSchema>(query, [userId, text, date]);

        ctx.response.status = 201;
        ctx.response.body = {
            success: true,
            data: result.rows[0],
        };
    } catch (error) {
        console.error("Error adding daily goal:", error);
        ctx.response.status = 500;
        ctx.response.body = {
            success: false,
            message: "Failed to add daily goal",
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
};

export const updateGoalHandler = async (ctx: Context) => {
    try {
        // @ts-ignore: params exists on ctx strictly speaking in router context
        const goalId = ctx.params?.id;
        const userId = ctx.state.userId as string;

        if (!goalId) {
            ctx.response.status = 400;
            ctx.response.body = { success: false, message: "Goal ID is required" };
            return;
        }

        if (!ctx.request.hasBody) {
            ctx.response.status = 400;
            ctx.response.body = { success: false, message: "No data provided" };
            return;
        }

        const body = ctx.request.body({ type: "json" });
        const { completed, text } = await body.value;

        // Build dymamic query based on what's provided
        let query = `UPDATE ${DAILY_GOALS_TABLE_NAME} SET `;
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (completed !== undefined) {
            updates.push(`completed = $${paramIndex++}`);
            values.push(completed);
        }
        if (text !== undefined) {
            updates.push(`text = $${paramIndex++}`);
            values.push(text);
        }

        if (updates.length === 0) {
            ctx.response.status = 400;
            ctx.response.body = { success: false, message: "No fields to update" };
            return;
        }

        query += updates.join(", ");
        query += ` WHERE goal_id = $${paramIndex++} AND user_id = $${paramIndex++} RETURNING *`;
        values.push(goalId, userId);

        const result = await dbClient.queryObject<DailyGoalSchema>(query, values);

        if (result.rows.length === 0) {
            ctx.response.status = 404;
            ctx.response.body = { success: false, message: "Goal not found or access denied" };
            return;
        }

        ctx.response.status = 200;
        ctx.response.body = {
            success: true,
            data: result.rows[0],
        };

    } catch (error) {
        console.error("Error updating daily goal:", error);
        ctx.response.status = 500;
        ctx.response.body = {
            success: false,
            message: "Failed to update daily goal",
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
};

export const deleteGoalHandler = async (ctx: Context) => {
    try {
        // @ts-ignore
        const goalId = ctx.params?.id;
        const userId = ctx.state.userId as string;

        if (!goalId) {
            ctx.response.status = 400;
            ctx.response.body = { success: false, message: "Goal ID is required" };
            return;
        }

        const query = `
        DELETE FROM ${DAILY_GOALS_TABLE_NAME}
        WHERE goal_id = $1 AND user_id = $2
        RETURNING goal_id;
      `;

        const result = await dbClient.queryObject(query, [goalId, userId]);

        if (result.rows.length === 0) {
            ctx.response.status = 404;
            ctx.response.body = { success: false, message: "Goal not found or access denied" };
            return;
        }

        ctx.response.status = 200;
        ctx.response.body = {
            success: true,
            message: "Goal deleted successfully",
        };
    } catch (error) {
        console.error("Error deleting daily goal:", error);
        ctx.response.status = 500;
        ctx.response.body = {
            success: false,
            message: "Failed to delete daily goal",
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
};
