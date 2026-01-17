// frontend/src/services/goalsApi.ts

import { API_BASE_URL } from "../config";

export interface DailyGoal {
    goal_id: number;
    text: string;
    completed: boolean;
    goal_date: string;
}

export async function getDailyGoalsAPI(date: string, token: string): Promise<DailyGoal[]> {
    const response = await fetch(`${API_BASE_URL}/goals?date=${date}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Error fetching goals: ${response.statusText}`);
    }
    const result = await response.json();
    return result.data;
}

export async function addGoalAPI(text: string, date: string, token: string): Promise<DailyGoal> {
    const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text, date }),
    });

    if (!response.ok) {
        throw new Error(`Error adding goal: ${response.statusText}`);
    }
    const result = await response.json();
    return result.data;
}

export async function updateGoalAPI(id: number, updates: { completed?: boolean, text?: string }, token: string): Promise<DailyGoal> {
    const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
    });

    if (!response.ok) {
        throw new Error(`Error updating goal: ${response.statusText}`);
    }
    const result = await response.json();
    return result.data;
}

export async function deleteGoalAPI(id: number, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Error deleting goal: ${response.statusText}`);
    }
}
