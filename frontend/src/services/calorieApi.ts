// frontend/src/services/calorieApi.ts

import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface DailyCalorieSummary {
  date: string;
  calories_consumed: number;
  calories_burned: number;
  net_calories: number;
  food_breakdown: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snack: number;
  };
  exercise_breakdown: {
    strength: number;
    cardio: number;
    stretching: number;
  };
  macros: {
    protein_consumed: number;
    carbs_consumed: number;
    fat_consumed: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Get daily calorie summary for a specific date
 */
export async function getDailyCalorieSummary(
  date?: string,
  token?: string
): Promise<DailyCalorieSummary> {
  try {
    const dateParam = date || new Date().toISOString().split('T')[0];
    const url = `${API_BASE_URL}/api/progress/daily-calories?date=${dateParam}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch daily calorie summary: ${response.status}`);
    }

    const result: ApiResponse<DailyCalorieSummary> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get daily calorie summary');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching daily calorie summary:', error);
    throw error;
  }
}

/**
 * Get daily calorie summary using auth context
 */
export async function getDailyCalorieSummaryWithAuth(
  date?: string,
  auth?: ReturnType<typeof useAuth>
): Promise<DailyCalorieSummary> {
  if (!auth?.token) {
    throw new Error('Authentication token not found');
  }
  
  return getDailyCalorieSummary(date, auth.token);
} 