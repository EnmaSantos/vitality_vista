import { ExternalHealthDataSource, IncomingHealthMeasurement } from "../models/healthMeasurement.model.ts";

function normalizedNumber(value: number): string {
  return Number(value.toFixed(6)).toString();
}

function normalizedTimestamp(value: string): string {
  return new Date(value).toISOString();
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createMeasurementFingerprint(
  userId: string,
  source: ExternalHealthDataSource | "manual",
  measurement: IncomingHealthMeasurement,
): Promise<string> {
  const identity = measurement.sourceRecordId
    ? [userId, source, measurement.sourceRecordId].join("|")
    : [
      userId,
      source,
      measurement.metric,
      normalizedTimestamp(measurement.recordedAt),
      normalizedNumber(measurement.value),
      measurement.unit.trim().toLowerCase(),
      measurement.periodStart ? normalizedTimestamp(measurement.periodStart) : "",
      measurement.periodEnd ? normalizedTimestamp(measurement.periodEnd) : "",
      measurement.aggregationType?.trim().toLowerCase() ?? "",
    ].join("|");
  return await sha256(identity);
}
