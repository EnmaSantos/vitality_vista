export interface DailyGoalSchema {
    goal_id: number; // SERIAL PRIMARY KEY
    user_id: string; // UUID
    text: string;
    completed: boolean;
    goal_date: Date; // TIMESTAMP/DATE
    created_at: Date;
}

export const DAILY_GOALS_TABLE_NAME = "daily_goals";
