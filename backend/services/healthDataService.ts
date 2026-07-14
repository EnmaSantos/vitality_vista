import dbClient, { ensureConnection } from "./db.ts";
import {
  ExternalHealthDataSource,
  HealthMetric,
  ImportPreview,
  ImportPreviewRecord,
  IncomingHealthMeasurement,
} from "../models/healthMeasurement.model.ts";
import { createMeasurementFingerprint } from "./healthDataIdentity.ts";

const SUPPORTED_METRICS = new Set<HealthMetric>([
  "weight", "body_fat_percentage", "bmi", "muscle_mass",
  "body_water_percentage", "bone_mass", "visceral_fat",
  "basal_metabolic_rate", "steps", "active_calories", "distance",
  "exercise_minutes", "heart_rate", "blood_pressure_systolic",
  "blood_pressure_diastolic",
]);

const AGGREGATE_METRICS = new Set(["steps", "active_calories", "distance", "exercise_minutes"]);

const METRIC_UNITS: Record<string, string> = {
  weight: "kg",
  body_fat_percentage: "%",
  bmi: "count",
  muscle_mass: "kg",
  body_water_percentage: "%",
  bone_mass: "kg",
  visceral_fat: "count",
  basal_metabolic_rate: "kcal",
  steps: "count",
  active_calories: "kcal",
  distance: "km",
  exercise_minutes: "min",
  heart_rate: "bpm",
  blood_pressure_systolic: "mmhg",
  blood_pressure_diastolic: "mmhg",
};

const DUPLICATE_RULES: Record<string, { timeToleranceSeconds: number; valueTolerance: number }> = {
  weight: { timeToleranceSeconds: 120, valueTolerance: 0.05 },
  body_fat_percentage: { timeToleranceSeconds: 120, valueTolerance: 0.1 },
  bmi: { timeToleranceSeconds: 120, valueTolerance: 0.05 },
  muscle_mass: { timeToleranceSeconds: 120, valueTolerance: 0.05 },
  body_water_percentage: { timeToleranceSeconds: 120, valueTolerance: 0.1 },
  bone_mass: { timeToleranceSeconds: 120, valueTolerance: 0.05 },
  visceral_fat: { timeToleranceSeconds: 120, valueTolerance: 0.1 },
  basal_metabolic_rate: { timeToleranceSeconds: 120, valueTolerance: 1 },
  heart_rate: { timeToleranceSeconds: 60, valueTolerance: 1 },
  blood_pressure_systolic: { timeToleranceSeconds: 60, valueTolerance: 1 },
  blood_pressure_diastolic: { timeToleranceSeconds: 60, valueTolerance: 1 },
  steps: { timeToleranceSeconds: 0, valueTolerance: 0 },
  active_calories: { timeToleranceSeconds: 0, valueTolerance: 0.1 },
  distance: { timeToleranceSeconds: 0, valueTolerance: 0.001 },
  exercise_minutes: { timeToleranceSeconds: 0, valueTolerance: 0.1 },
};

interface ExistingMeasurement {
  id: string;
  metric: string;
  value: number | string;
  unit: string;
  recorded_at: string | Date;
  period_start: string | Date | null;
  period_end: string | Date | null;
  aggregation_type: string | null;
  source: string;
  fingerprint: string;
  duplicate_group_id: string | null;
  is_primary: boolean;
  measurement_kind: "direct" | "derived";
}

function normalizedTimestamp(value: string): string {
  return new Date(value).toISOString();
}

function normalizeIncoming(input: IncomingHealthMeasurement): IncomingHealthMeasurement {
  const metric = input.metric.trim().toLowerCase();
  let value = input.value;
  let unit = input.unit.trim().toLowerCase();
  if (["weight", "muscle_mass", "bone_mass"].includes(metric) && ["lb", "lbs"].includes(unit)) {
    value /= 2.2046226218;
    unit = "kg";
  }
  if (metric === "distance" && ["mi", "mile", "miles"].includes(unit)) {
    value *= 1.609344;
    unit = "km";
  }
  const unitAliases: Record<string, string> = {
    percent: "%",
    unitless: "count",
    cal: "kcal",
    minute: "min",
    minutes: "min",
    "count/min": "bpm",
    "mm hg": "mmhg",
  };
  unit = unitAliases[unit] ?? unit;
  return {
    ...input,
    metric,
    value,
    unit,
    recordedAt: normalizedTimestamp(input.recordedAt),
    periodStart: input.periodStart ? normalizedTimestamp(input.periodStart) : undefined,
    periodEnd: input.periodEnd ? normalizedTimestamp(input.periodEnd) : undefined,
    aggregationType: input.aggregationType?.trim().toLowerCase(),
    measurementKind: input.measurementKind ?? "direct",
  };
}

function validateRecord(record: IncomingHealthMeasurement): string | null {
  if (!SUPPORTED_METRICS.has(record.metric as HealthMetric)) return `Unsupported measurement type: ${record.metric || "missing"}`;
  if (typeof record.value !== "number" || !Number.isFinite(record.value)) return "Measurement value must be a finite number";
  if (!record.unit?.trim()) return "Measurement unit is required";
  if (!record.recordedAt || Number.isNaN(new Date(record.recordedAt).getTime())) return "A valid recorded date and time is required";
  if (record.measurementKind && !["direct", "derived"].includes(record.measurementKind)) return "Measurement kind must be direct or derived";
  if (AGGREGATE_METRICS.has(record.metric)) {
    if (!record.periodStart || !record.periodEnd || !record.aggregationType) {
      return "Aggregate measurements require periodStart, periodEnd, and aggregationType";
    }
    if (Number.isNaN(new Date(record.periodStart).getTime()) || Number.isNaN(new Date(record.periodEnd).getTime())) {
      return "Aggregate measurement interval is invalid";
    }
    if (new Date(record.periodStart) >= new Date(record.periodEnd)) return "Aggregate measurement periodEnd must be after periodStart";
  }
  return null;
}

function validateNormalizedUnit(record: IncomingHealthMeasurement): string | null {
  const expected = METRIC_UNITS[record.metric];
  return expected && record.unit !== expected
    ? `${record.metric} measurements must use ${expected} (received ${record.unit})`
    : null;
}

function sameInstant(a: string | Date, b: string): boolean {
  return new Date(a).getTime() === new Date(b).getTime();
}

function isCandidate(existing: ExistingMeasurement, incoming: IncomingHealthMeasurement): boolean {
  if (existing.metric !== incoming.metric || existing.unit.toLowerCase() !== incoming.unit.toLowerCase()) return false;
  if (AGGREGATE_METRICS.has(incoming.metric)) {
    return Boolean(
      existing.period_start && existing.period_end && incoming.periodStart && incoming.periodEnd &&
      sameInstant(existing.period_start, incoming.periodStart) &&
      sameInstant(existing.period_end, incoming.periodEnd) &&
      (existing.aggregation_type ?? "") === (incoming.aggregationType ?? ""),
    );
  }
  const rule = DUPLICATE_RULES[incoming.metric] ?? { timeToleranceSeconds: 120, valueTolerance: 0 };
  return Math.abs(new Date(existing.recorded_at).getTime() - new Date(incoming.recordedAt).getTime()) <= rule.timeToleranceSeconds * 1000;
}

function valuesMatch(existing: ExistingMeasurement, incoming: IncomingHealthMeasurement): boolean {
  const rule = DUPLICATE_RULES[incoming.metric] ?? { timeToleranceSeconds: 120, valueTolerance: 0 };
  return Math.abs(Number(existing.value) - incoming.value) <= rule.valueTolerance;
}

function previewAsExisting(record: ImportPreviewRecord, source: ExternalHealthDataSource): ExistingMeasurement {
  return {
    id: `preview:${record.index}`,
    metric: record.metric,
    value: record.value,
    unit: record.unit,
    recorded_at: record.recordedAt,
    period_start: record.periodStart ?? null,
    period_end: record.periodEnd ?? null,
    aggregation_type: record.aggregationType ?? null,
    source,
    fingerprint: record.fingerprint ?? "",
    duplicate_group_id: record.duplicateGroupId ?? null,
    is_primary: true,
    measurement_kind: record.measurementKind ?? "direct",
  };
}

function precedence(source: string, measurementKind: "direct" | "derived" | undefined): number {
  if (source === "manual") return 3;
  return measurementKind === "derived" ? 1 : 2;
}

export async function getActiveExternalSource(userId: string): Promise<ExternalHealthDataSource | null> {
  await ensureConnection();
  const result = await dbClient.queryObject<{ active_external_source: ExternalHealthDataSource | null }>(
    `SELECT active_external_source FROM health_data_profiles WHERE user_id = $1`, [userId],
  );
  return result.rows[0]?.active_external_source ?? null;
}

export async function setActiveExternalSource(userId: string, source: ExternalHealthDataSource | null): Promise<void> {
  await ensureConnection();
  await dbClient.queryArray(
    `INSERT INTO health_data_profiles (user_id, active_external_source)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET active_external_source = EXCLUDED.active_external_source, updated_at = CURRENT_TIMESTAMP`,
    [userId, source],
  );
}

async function existingMeasurements(
  userId: string,
  records: IncomingHealthMeasurement[],
  source: ExternalHealthDataSource | "manual",
): Promise<ExistingMeasurement[]> {
  if (records.length === 0) return [];
  const metrics = [...new Set(records.map((record) => record.metric))];
  const timestamps = records.map((record) => new Date(record.recordedAt).getTime());
  const min = new Date(Math.min(...timestamps) - 3_600_000).toISOString();
  const max = new Date(Math.max(...timestamps) + 3_600_000).toISOString();
  const sourceRecordIds = records.map((record) => record.sourceRecordId).filter((id): id is string => Boolean(id));
  const result = await dbClient.queryObject<ExistingMeasurement>(
    `SELECT id, metric, value, unit, recorded_at, period_start, period_end, aggregation_type,
            source, fingerprint, duplicate_group_id, is_primary, measurement_kind
     FROM health_measurements
     WHERE user_id = $1 AND metric = ANY($2::text[])
       AND (
         recorded_at BETWEEN $3 AND $4
         OR (period_start IS NOT NULL AND period_end IS NOT NULL AND period_start <= $4 AND period_end >= $3)
         OR (source = $5 AND source_record_id = ANY($6::text[]))
       )`,
    [userId, metrics, min, max, source, sourceRecordIds],
  );
  return result.rows;
}

export async function previewImport(
  userId: string,
  source: ExternalHealthDataSource,
  records: IncomingHealthMeasurement[],
): Promise<ImportPreview> {
  await ensureConnection();
  const existing = await existingMeasurements(userId, records, source);
  const fingerprints = new Set(existing.map((record) => record.fingerprint));
  const previewRecords: ImportPreviewRecord[] = [];

  for (let index = 0; index < records.length; index += 1) {
    const input = records[index];
    const issue = validateRecord(input);
    if (issue) {
      previewRecords.push({ ...input, index, status: "invalid", issue });
      continue;
    }
    const normalized = normalizeIncoming(input);
    const unitIssue = validateNormalizedUnit(normalized);
    if (unitIssue) {
      previewRecords.push({ ...normalized, index, status: "invalid", issue: unitIssue });
      continue;
    }
    const fingerprint = await createMeasurementFingerprint(userId, source, normalized);
    if (fingerprints.has(fingerprint)) {
      previewRecords.push({ ...normalized, index, fingerprint, status: "exact_duplicate" });
      continue;
    }
    fingerprints.add(fingerprint);
    const existingCandidate = existing
      .filter((record) => isCandidate(record, normalized))
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))[0];
    const priorPreview = previewRecords
      .filter((record) =>
        record.status !== "invalid" && record.status !== "exact_duplicate" && record.status !== "likely_duplicate" &&
        isCandidate(previewAsExisting(record, source), normalized)
      )
      .sort((a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)))[0];
    const candidate = existingCandidate ?? (priorPreview ? previewAsExisting(priorPreview, source) : undefined);
    if (candidate) {
      const likely = valuesMatch(candidate, normalized);
      const groupId = likely ? undefined : candidate.duplicate_group_id ?? crypto.randomUUID();
      const incomingIsPrimary = !likely && precedence(source, normalized.measurementKind) > precedence(candidate.source, candidate.measurement_kind);
      if (!likely && priorPreview && !existingCandidate) {
        priorPreview.status = "conflict";
        priorPreview.duplicateGroupId = groupId;
        priorPreview.isPrimary = !incomingIsPrimary;
      }
      previewRecords.push({
        ...normalized,
        index,
        fingerprint,
        status: likely ? "likely_duplicate" : "conflict",
        existingMeasurementId: existingCandidate?.id,
        duplicateGroupId: groupId,
        isPrimary: likely ? undefined : incomingIsPrimary,
      });
    } else {
      previewRecords.push({ ...normalized, index, fingerprint, status: "new" });
    }
  }

  const summary = { new: 0, exact_duplicate: 0, likely_duplicate: 0, conflict: 0, invalid: 0 };
  for (const record of previewRecords) summary[record.status] += 1;
  const validDates = previewRecords.filter((record) => record.status !== "invalid").map((record) => record.recordedAt).sort();
  return {
    source,
    summary,
    totalRecords: records.length,
    dateRange: validDates.length ? { start: validDates[0], end: validDates[validDates.length - 1] } : null,
    measurementTypes: [...new Set(previewRecords.filter((record) => record.status !== "invalid").map((record) => record.metric))].sort(),
    records: previewRecords,
  };
}

export async function confirmImport(userId: string, source: ExternalHealthDataSource, records: IncomingHealthMeasurement[]) {
  const preview = await previewImport(userId, source, records);
  let imported = 0;
  let skipped = 0;
  let conflicts = 0;

  for (const record of preview.records) {
    if (record.status === "invalid" || record.status === "exact_duplicate" || record.status === "likely_duplicate") {
      skipped += 1;
      continue;
    }
    const isPrimary = record.status !== "conflict" ? true : Boolean(record.isPrimary);
    const insertResult = await dbClient.queryObject<{ id: string }>(
      `INSERT INTO health_measurements (
        id, user_id, metric, value, unit, recorded_at, period_start, period_end,
        aggregation_type, source, source_record_id, fingerprint, duplicate_group_id,
        status, is_primary, imported_at, notes, measurement_kind
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,CURRENT_TIMESTAMP,$16,$17)
      ON CONFLICT (user_id, fingerprint) DO NOTHING RETURNING id`,
      [crypto.randomUUID(), userId, record.metric, record.value, record.unit, record.recordedAt,
        record.periodStart ?? null, record.periodEnd ?? null, record.aggregationType ?? null,
        source, record.sourceRecordId ?? null, record.fingerprint, record.duplicateGroupId ?? null,
        record.status === "conflict" ? "conflict" : "active", isPrimary, record.notes ?? null,
        record.measurementKind ?? "direct"],
    );
    if (insertResult.rows.length) {
      if (record.status === "conflict" && record.existingMeasurementId && record.duplicateGroupId) {
        await dbClient.queryArray(
          `UPDATE health_measurements SET duplicate_group_id = $1, status = 'conflict', is_primary = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3`,
          [record.duplicateGroupId, record.existingMeasurementId, userId, !record.isPrimary],
        );
      }
      imported += 1;
      if (record.status === "conflict") conflicts += 1;
    } else {
      skipped += 1;
    }
  }
  await setActiveExternalSource(userId, source);
  return { preview, imported, skipped, conflicts, activeExternalSource: source };
}

export async function createManualMeasurement(userId: string, input: IncomingHealthMeasurement) {
  const issue = validateRecord(input);
  if (issue) throw new Error(issue);
  await ensureConnection();
  const normalized = normalizeIncoming(input);
  const unitIssue = validateNormalizedUnit(normalized);
  if (unitIssue) throw new Error(unitIssue);
  const fingerprint = await createMeasurementFingerprint(userId, "manual", normalized);
  const existing = await existingMeasurements(userId, [normalized], "manual");
  if (existing.some((record) => record.fingerprint === fingerprint)) throw new Error("This manual measurement already exists");
  const candidate = existing
    .filter((record) => isCandidate(record, normalized))
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))[0];
  if (candidate && valuesMatch(candidate, normalized)) throw new Error("A matching measurement already exists at this time");
  const duplicateGroupId = candidate ? candidate.duplicate_group_id ?? crypto.randomUUID() : null;
  const result = await dbClient.queryObject<{ id: string }>(
    `INSERT INTO health_measurements (
      id, user_id, metric, value, unit, recorded_at, period_start, period_end,
      aggregation_type, source, fingerprint, duplicate_group_id, status, is_primary, notes, measurement_kind
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'manual',$10,$11,$12,TRUE,$13,'direct')
    ON CONFLICT (user_id, fingerprint) DO NOTHING RETURNING id`,
    [crypto.randomUUID(), userId, normalized.metric, normalized.value, normalized.unit, normalized.recordedAt,
      normalized.periodStart ?? null, normalized.periodEnd ?? null, normalized.aggregationType ?? null, fingerprint,
      duplicateGroupId, candidate ? "conflict" : "active", normalized.notes ?? null],
  );
  if (!result.rows.length) throw new Error("This manual measurement already exists");
  if (candidate && duplicateGroupId) {
    await dbClient.queryArray(
      `UPDATE health_measurements
       SET duplicate_group_id = $1, status = 'conflict', is_primary = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3`,
      [duplicateGroupId, candidate.id, userId],
    );
  }
  return result.rows[0];
}

export async function listMeasurements(userId: string, source?: string | null, metric?: string | null) {
  await ensureConnection();
  const result = await dbClient.queryObject(
    `SELECT id, metric, value, unit, recorded_at AS "recordedAt", period_start AS "periodStart",
            period_end AS "periodEnd", aggregation_type AS "aggregationType", source,
            source_record_id AS "sourceRecordId", duplicate_group_id AS "duplicateGroupId",
            status, is_primary AS "isPrimary", imported_at AS "importedAt", notes,
            measurement_kind AS "measurementKind"
     FROM health_measurements
     WHERE user_id = $1 AND ($2::text IS NULL OR source = $2) AND ($3::text IS NULL OR metric = $3)
     ORDER BY recorded_at DESC LIMIT 500`,
    [userId, source ?? null, metric ?? null],
  );
  return result.rows;
}

export async function setPrimaryMeasurement(userId: string, measurementId: string) {
  await ensureConnection();
  const result = await dbClient.queryObject<{ id: string; is_primary: boolean }>(
    `WITH target AS (
       SELECT duplicate_group_id FROM health_measurements
       WHERE id = $2 AND user_id = $1 AND duplicate_group_id IS NOT NULL
     )
     UPDATE health_measurements AS measurement
     SET is_primary = (measurement.id = $2), updated_at = CURRENT_TIMESTAMP
     FROM target
     WHERE measurement.user_id = $1 AND measurement.duplicate_group_id = target.duplicate_group_id
     RETURNING measurement.id, measurement.is_primary`,
    [userId, measurementId],
  );
  if (!result.rows.length) throw new Error("Conflict group not found");
  return result.rows;
}
