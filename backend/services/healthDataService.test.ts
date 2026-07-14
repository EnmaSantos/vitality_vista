import { createMeasurementFingerprint } from "./healthDataIdentity.ts";

const base = {
  metric: "weight",
  value: 84.006,
  unit: "kg",
  recordedAt: "2026-01-02T15:00:00.000Z",
};

Deno.test("fallback health measurement fingerprints are deterministic and value-sensitive", async () => {
  const first = await createMeasurementFingerprint("user-1", "renpho", base);
  const repeat = await createMeasurementFingerprint("user-1", "renpho", { ...base });
  const changed = await createMeasurementFingerprint("user-1", "renpho", { ...base, value: 84.106 });
  if (first !== repeat) throw new Error("Expected identical inputs to have the same fingerprint");
  if (first === changed) throw new Error("Expected a changed value to have a different fingerprint");
});

Deno.test("stable source IDs make re-import fingerprints independent of mutable fields", async () => {
  const first = await createMeasurementFingerprint("user-1", "apple_health", { ...base, sourceRecordId: "record-42" });
  const changed = await createMeasurementFingerprint("user-1", "apple_health", {
    ...base,
    sourceRecordId: "record-42",
    recordedAt: "2026-02-03T12:00:00.000Z",
    value: 90,
  });
  if (first !== changed) throw new Error("Expected a stable source record ID to control identity");
});

Deno.test("aggregate measurement intervals participate in fallback identity", async () => {
  const aggregate = {
    metric: "steps",
    value: 650,
    unit: "count",
    recordedAt: "2026-01-02T15:00:00.000Z",
    periodStart: "2026-01-02T15:00:00.000Z",
    periodEnd: "2026-01-02T16:00:00.000Z",
    aggregationType: "sum",
  };
  const first = await createMeasurementFingerprint("user-1", "apple_health", aggregate);
  const shifted = await createMeasurementFingerprint("user-1", "apple_health", {
    ...aggregate,
    periodEnd: "2026-01-02T17:00:00.000Z",
  });
  if (first === shifted) throw new Error("Expected a changed interval to have a different fingerprint");
});
