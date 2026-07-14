export interface UserBodyMetricLogSchema {
  log_id: number | string;
  user_id: string;
  metric_type: string; // e.g., 'weight', 'body_fat_percentage'
  value: number;
  unit: string; // e.g., 'kg', 'lbs', '%'
  log_date: string; // Or Date, depending on how it's retrieved and used
  notes?: string | null;
  created_at: string; // Or Date
  updated_at: string; // Or Date
  source?: "manual" | "apple_health" | "renpho";
  status?: "active" | "duplicate" | "conflict";
  is_primary?: boolean;
}
