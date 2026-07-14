export type HealthDataSource = "manual" | "apple_health" | "renpho";
export type ExternalHealthDataSource = Exclude<HealthDataSource, "manual">;

export type HealthMetric =
  | "weight"
  | "body_fat_percentage"
  | "bmi"
  | "muscle_mass"
  | "body_water_percentage"
  | "bone_mass"
  | "visceral_fat"
  | "basal_metabolic_rate"
  | "steps"
  | "active_calories"
  | "distance"
  | "exercise_minutes"
  | "heart_rate"
  | "blood_pressure_systolic"
  | "blood_pressure_diastolic";

export type ImportRecordStatus =
  | "new"
  | "exact_duplicate"
  | "likely_duplicate"
  | "conflict"
  | "invalid";

export type MeasurementKind = "direct" | "derived";

export interface IncomingHealthMeasurement {
  metric: HealthMetric | string;
  value: number;
  unit: string;
  recordedAt: string;
  sourceRecordId?: string;
  periodStart?: string;
  periodEnd?: string;
  aggregationType?: string;
  notes?: string;
  measurementKind?: MeasurementKind;
}

export interface HealthMeasurement extends IncomingHealthMeasurement {
  id: string;
  userId: string;
  source: HealthDataSource;
  fingerprint: string;
  duplicateGroupId?: string;
  status: "active" | "duplicate" | "conflict";
  isPrimary: boolean;
  importedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImportPreviewRecord extends IncomingHealthMeasurement {
  index: number;
  status: ImportRecordStatus;
  fingerprint?: string;
  issue?: string;
  existingMeasurementId?: string;
  duplicateGroupId?: string;
  isPrimary?: boolean;
}

export interface ImportPreview {
  source: ExternalHealthDataSource;
  summary: Record<ImportRecordStatus, number>;
  totalRecords: number;
  dateRange: { start: string; end: string } | null;
  measurementTypes: string[];
  records: ImportPreviewRecord[];
}
