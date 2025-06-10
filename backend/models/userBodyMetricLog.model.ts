export interface UserBodyMetricLogSchema {
  log_id: number;
  user_id: string;
  metric_type: string; // e.g., 'weight', 'body_fat_percentage'
  value: number;
  unit: string; // e.g., 'kg', 'lbs', '%'
  log_date: string; // Or Date, depending on how it's retrieved and used
  notes?: string | null;
  created_at: string; // Or Date
  updated_at: string; // Or Date
} 