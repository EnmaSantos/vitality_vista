// frontend/src/services/progressApi.ts

import { API_BASE_URL } from "../config";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export async function getProgressData(token: string, timeRange: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/progress?timeRange=${timeRange}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Attempt to parse the error response from the body
      const errorResult = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      // Use the specific error message from the API if available, otherwise use a generic one
      throw new Error(errorResult.message || `API Error: ${response.status} ${response.statusText}`);
    }

    const result: ApiResponse = await response.json();

    // Additional check for application-level errors (e.g., success: false)
    if (!result.success) {
      throw new Error(result.error || result.message || 'An unexpected error occurred');
    }

    return result;
  } catch (error) {
    console.error('Error fetching progress data:', error);
    throw error;
  }
}

export async function getExerciseProgress(token: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/progress/exercises`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
      throw new Error(errorResult.message || `API Error: ${response.status} ${response.statusText}`);
    }

    const result: ApiResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || result.message || 'An unexpected error occurred');
    }

    return result;
  } catch (error) {
    console.error('Error fetching exercise progress:', error);
    throw error;
  }
}