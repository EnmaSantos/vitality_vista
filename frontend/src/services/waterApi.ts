// frontend/src/services/waterApi.ts

import { API_BASE_URL } from "../config";

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

interface WaterLogResponse {
    date: string;
    total_ml: number;
}

export async function logWaterAPI(amount_ml: number, date: string, auth: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/water-logs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ amount_ml, date }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Error ${response.status}`);
    }
    return response.json();
}

export async function getDailyWaterAPI(date: string, auth: any): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/water-logs/daily?date=${date}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${auth.token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Error ${response.status}`);
    }
    const result = await response.json();
    return result.data.total_ml;
}
