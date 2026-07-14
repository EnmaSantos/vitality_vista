import { Context, RouterContext } from "../deps.ts";
import { ExternalHealthDataSource, IncomingHealthMeasurement } from "../models/healthMeasurement.model.ts";
import {
  confirmImport,
  createManualMeasurement,
  getActiveExternalSource,
  listMeasurements,
  previewImport,
  setActiveExternalSource,
  setPrimaryMeasurement,
} from "../services/healthDataService.ts";

function userIdFrom(ctx: Context): string | null {
  const userId = ctx.state.userId as string | undefined;
  if (!userId) {
    ctx.response.status = 401;
    ctx.response.body = { success: false, error: "User not authenticated" };
    return null;
  }
  return userId;
}

async function jsonBody<T>(ctx: Context): Promise<T> {
  if (!ctx.request.hasBody) throw new Error("Request body is required");
  return await ctx.request.body({ type: "json" }).value as T;
}

function isExternalSource(value: unknown): value is ExternalHealthDataSource {
  return value === "apple_health" || value === "renpho";
}

function fail(ctx: Context, error: unknown, status = 400) {
  ctx.response.status = status;
  ctx.response.body = { success: false, error: error instanceof Error ? error.message : "Unknown error" };
}

export async function getHealthDataProfileHandler(ctx: Context) {
  const userId = userIdFrom(ctx);
  if (!userId) return;
  try {
    ctx.response.body = { success: true, data: { activeExternalSource: await getActiveExternalSource(userId) } };
  } catch (error) {
    fail(ctx, error, 500);
  }
}

export async function updateHealthDataProfileHandler(ctx: Context) {
  const userId = userIdFrom(ctx);
  if (!userId) return;
  try {
    const { activeExternalSource } = await jsonBody<{ activeExternalSource: ExternalHealthDataSource | null }>(ctx);
    if (activeExternalSource !== null && !isExternalSource(activeExternalSource)) throw new Error("External source must be Apple Health, RENPHO, or null");
    const previous = await getActiveExternalSource(userId);
    await setActiveExternalSource(userId, activeExternalSource);
    ctx.response.body = { success: true, data: { activeExternalSource, previousExternalSource: previous } };
  } catch (error) {
    fail(ctx, error);
  }
}

export async function previewHealthImportHandler(ctx: Context) {
  const userId = userIdFrom(ctx);
  if (!userId) return;
  try {
    const body = await jsonBody<{ source: ExternalHealthDataSource; records: IncomingHealthMeasurement[] }>(ctx);
    if (!isExternalSource(body.source)) throw new Error("A valid external data source is required");
    if (!Array.isArray(body.records) || body.records.length === 0) throw new Error("The export did not contain any supported records");
    if (body.records.length > 10_000) throw new Error("Imports are limited to 10,000 records at a time");
    const currentSource = await getActiveExternalSource(userId);
    ctx.response.body = {
      success: true,
      data: await previewImport(userId, body.source, body.records),
      sourceSwitchRequired: Boolean(currentSource && currentSource !== body.source),
      currentSource,
    };
  } catch (error) {
    fail(ctx, error);
  }
}

export async function confirmHealthImportHandler(ctx: Context) {
  const userId = userIdFrom(ctx);
  if (!userId) return;
  try {
    const body = await jsonBody<{ source: ExternalHealthDataSource; records: IncomingHealthMeasurement[] }>(ctx);
    if (!isExternalSource(body.source)) throw new Error("A valid external data source is required");
    if (!Array.isArray(body.records) || body.records.length === 0) throw new Error("No records were provided for import");
    if (body.records.length > 10_000) throw new Error("Imports are limited to 10,000 records at a time");
    ctx.response.body = { success: true, data: await confirmImport(userId, body.source, body.records) };
  } catch (error) {
    fail(ctx, error);
  }
}

export async function createManualMeasurementHandler(ctx: Context) {
  const userId = userIdFrom(ctx);
  if (!userId) return;
  try {
    const input = await jsonBody<IncomingHealthMeasurement>(ctx);
    ctx.response.status = 201;
    ctx.response.body = { success: true, data: await createManualMeasurement(userId, input) };
  } catch (error) {
    fail(ctx, error);
  }
}

export async function listHealthMeasurementsHandler(ctx: Context) {
  const userId = userIdFrom(ctx);
  if (!userId) return;
  try {
    const source = ctx.request.url.searchParams.get("source");
    const metric = ctx.request.url.searchParams.get("metric");
    if (source && !["manual", "apple_health", "renpho"].includes(source)) throw new Error("Invalid source filter");
    ctx.response.body = { success: true, data: await listMeasurements(userId, source, metric) };
  } catch (error) {
    fail(ctx, error);
  }
}

export async function setPrimaryMeasurementHandler(ctx: RouterContext<any, any>) {
  const userId = userIdFrom(ctx);
  if (!userId) return;
  try {
    const measurementId = ctx.params.id;
    if (!measurementId) throw new Error("Measurement ID is required");
    ctx.response.body = { success: true, data: await setPrimaryMeasurement(userId, measurementId) };
  } catch (error) {
    fail(ctx, error);
  }
}
