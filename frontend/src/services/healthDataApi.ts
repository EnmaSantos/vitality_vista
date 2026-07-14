import { API_BASE_URL } from '../config';

export type HealthDataSource = 'manual' | 'apple_health' | 'renpho';
export type ExternalHealthDataSource = Exclude<HealthDataSource, 'manual'>;
export type ImportRecordStatus = 'new' | 'exact_duplicate' | 'likely_duplicate' | 'conflict' | 'invalid';

export interface IncomingHealthMeasurement {
  metric: string;
  value: number;
  unit: string;
  recordedAt: string;
  sourceRecordId?: string;
  periodStart?: string;
  periodEnd?: string;
  aggregationType?: string;
  notes?: string;
  measurementKind?: 'direct' | 'derived';
}

export interface HealthMeasurement extends IncomingHealthMeasurement {
  id: string;
  source: HealthDataSource;
  status: 'active' | 'duplicate' | 'conflict';
  isPrimary: boolean;
  duplicateGroupId?: string;
  importedAt?: string;
}

export interface ImportPreview {
  source: ExternalHealthDataSource;
  summary: Record<ImportRecordStatus, number>;
  totalRecords: number;
  dateRange: { start: string; end: string } | null;
  measurementTypes: string[];
  records: Array<IncomingHealthMeasurement & { index: number; status: ImportRecordStatus; issue?: string }>;
}

async function request<T>(token: string, path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/health-data${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options?.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success) throw new Error(result.error || result.message || `Health data request failed (${response.status})`);
  return result.data as T;
}

export const getHealthDataProfile = (token: string) =>
  request<{ activeExternalSource: ExternalHealthDataSource | null }>(token, '/profile');

export const updateHealthDataProfile = (token: string, activeExternalSource: ExternalHealthDataSource | null) =>
  request<{ activeExternalSource: ExternalHealthDataSource | null }>(token, '/profile', {
    method: 'PUT', body: JSON.stringify({ activeExternalSource }),
  });

export const previewHealthImport = (token: string, source: ExternalHealthDataSource, records: IncomingHealthMeasurement[]) =>
  request<ImportPreview>(token, '/imports/preview', { method: 'POST', body: JSON.stringify({ source, records }) });

export const confirmHealthImport = (token: string, source: ExternalHealthDataSource, records: IncomingHealthMeasurement[]) =>
  request<{ imported: number; skipped: number; conflicts: number; activeExternalSource: ExternalHealthDataSource }>(
    token, '/imports/confirm', { method: 'POST', body: JSON.stringify({ source, records }) },
  );

export const createManualMeasurement = (token: string, record: IncomingHealthMeasurement) =>
  request<{ id: string }>(token, '/measurements', { method: 'POST', body: JSON.stringify(record) });

export const getHealthMeasurements = (token: string, source?: HealthDataSource | '') =>
  request<HealthMeasurement[]>(token, `/measurements${source ? `?source=${source}` : ''}`);

export const setPrimaryHealthMeasurement = (token: string, measurementId: string) =>
  request<Array<{ id: string; is_primary: boolean }>>(token, `/measurements/${measurementId}/primary`, { method: 'PATCH' });
