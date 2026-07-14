import { strFromU8, unzipSync } from 'fflate';
import type { ExternalHealthDataSource, IncomingHealthMeasurement } from '../../services/healthDataApi';

export interface ParsedHealthExport {
  source: ExternalHealthDataSource;
  records: IncomingHealthMeasurement[];
  unsupportedRows: number;
  warnings: string[];
}

export interface HealthDataImporter {
  validate(file: File): Promise<void>;
  preview(file: File): Promise<ParsedHealthExport>;
  parse(file: File): Promise<ParsedHealthExport>;
}

const APPLE_TYPE_MAP: Record<string, { metric: string; aggregate?: boolean }> = {
  HKQuantityTypeIdentifierBodyMass: { metric: 'weight' },
  HKQuantityTypeIdentifierBodyFatPercentage: { metric: 'body_fat_percentage' },
  HKQuantityTypeIdentifierBodyMassIndex: { metric: 'bmi' },
  HKQuantityTypeIdentifierLeanBodyMass: { metric: 'muscle_mass' },
  HKQuantityTypeIdentifierStepCount: { metric: 'steps', aggregate: true },
  HKQuantityTypeIdentifierActiveEnergyBurned: { metric: 'active_calories', aggregate: true },
  HKQuantityTypeIdentifierDistanceWalkingRunning: { metric: 'distance', aggregate: true },
  HKQuantityTypeIdentifierAppleExerciseTime: { metric: 'exercise_minutes', aggregate: true },
  HKQuantityTypeIdentifierHeartRate: { metric: 'heart_rate' },
};

function parseAttributes(fragment: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const regex = /([\w:.-]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(fragment))) attributes[match[1]] = match[2];
  return attributes;
}

function isoDate(value: string): string {
  const normalized = value.replace(/ ([+-]\d{4})$/, ' $1').replace(/ ([+-]\d{2})(\d{2})$/, ' $1:$2');
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid date: ${value}`);
  return parsed.toISOString();
}

function normalize(metric: string, value: number, unit: string): { value: number; unit: string } {
  const normalizedUnit = unit.trim().toLowerCase();
  if ((metric === 'weight' || metric === 'muscle_mass' || metric === 'bone_mass') && ['lb', 'lbs'].includes(normalizedUnit)) {
    return { value: value / 2.2046226218, unit: 'kg' };
  }
  if (metric === 'distance' && ['mi', 'mile', 'miles'].includes(normalizedUnit)) {
    return { value: value * 1.609344, unit: 'km' };
  }
  const canonical: Record<string, string> = {
    count: metric === 'steps' ? 'count' : normalizedUnit,
    kcal: 'kcal',
    cal: 'kcal',
    '%': '%',
    kg: 'kg',
    bpm: 'bpm',
    min: 'min',
  };
  return { value, unit: canonical[normalizedUnit] ?? normalizedUnit };
}

async function appleXmlFrom(file: File): Promise<string> {
  if (file.name.toLowerCase().endsWith('.zip')) {
    let files: Record<string, Uint8Array>;
    try {
      files = unzipSync(new Uint8Array(await file.arrayBuffer()));
    } catch {
      throw new Error('The Apple Health ZIP is corrupted or unreadable.');
    }
    const exportName = Object.keys(files).find((name) => /(^|\/)export\.xml$/i.test(name));
    if (!exportName) throw new Error('The ZIP does not contain Apple Health export.xml.');
    return strFromU8(files[exportName]);
  }
  return await file.text();
}

export class AppleHealthImporter implements HealthDataImporter {
  async validate(file: File) {
    if (!/\.(xml|zip)$/i.test(file.name)) throw new Error('Apple Health imports must be an export.xml file or the original export ZIP.');
  }

  async parse(file: File): Promise<ParsedHealthExport> {
    await this.validate(file);
    const xml = await appleXmlFrom(file);
    if (!xml.includes('<HealthData') && !xml.includes('<Record')) throw new Error('This does not appear to be an Apple Health export.');
    const records: IncomingHealthMeasurement[] = [];
    let unsupportedRows = 0;
    const recordRegex = /<Record\s+([^>]*?)(?:\/?>)/g;
    let match: RegExpExecArray | null;
    while ((match = recordRegex.exec(xml))) {
      const attrs = parseAttributes(match[1]);
      const mapping = APPLE_TYPE_MAP[attrs.type];
      if (!mapping) {
        unsupportedRows += 1;
        continue;
      }
      const rawValue = Number(attrs.value);
      if (!Number.isFinite(rawValue) || !attrs.unit || !attrs.startDate) {
        unsupportedRows += 1;
        continue;
      }
      try {
        const measurement = normalize(mapping.metric, rawValue, attrs.unit);
        records.push({
          metric: mapping.metric,
          value: measurement.value,
          unit: measurement.unit,
          recordedAt: isoDate(attrs.startDate),
          periodStart: mapping.aggregate ? isoDate(attrs.startDate) : undefined,
          periodEnd: mapping.aggregate ? isoDate(attrs.endDate || attrs.startDate) : undefined,
          aggregationType: mapping.aggregate ? 'sum' : undefined,
          measurementKind: mapping.metric === 'bmi' ? 'derived' : 'direct',
        });
      } catch {
        unsupportedRows += 1;
      }
    }
    if (!records.length) throw new Error('No supported measurements were found in this Apple Health export.');
    return {
      source: 'apple_health',
      records,
      unsupportedRows,
      warnings: unsupportedRows ? [`${unsupportedRows} unsupported Apple Health records will be ignored.`] : [],
    };
  }

  async preview(file: File) {
    return await this.parse(file);
  }
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i += 1; } else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(value.trim()); value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(value.trim()); value = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else value += char;
  }
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

const RENPHO_COLUMNS: Array<{ aliases: string[]; metric: string; defaultUnit: string }> = [
  { aliases: ['weight', 'body weight'], metric: 'weight', defaultUnit: 'kg' },
  { aliases: ['bmi'], metric: 'bmi', defaultUnit: 'count' },
  { aliases: ['body fat', 'body fat percentage', 'body fat rate'], metric: 'body_fat_percentage', defaultUnit: '%' },
  { aliases: ['muscle mass'], metric: 'muscle_mass', defaultUnit: 'kg' },
  { aliases: ['body water', 'water'], metric: 'body_water_percentage', defaultUnit: '%' },
  { aliases: ['bone mass'], metric: 'bone_mass', defaultUnit: 'kg' },
  { aliases: ['visceral fat'], metric: 'visceral_fat', defaultUnit: 'count' },
  { aliases: ['bmr', 'basal metabolic rate'], metric: 'basal_metabolic_rate', defaultUnit: 'kcal' },
];

function headerInfo(header: string): { name: string; unit?: string } {
  const unit = header.match(/\(([^)]+)\)|\[([^\]]+)\]/)?.slice(1).find(Boolean);
  return { name: header.replace(/\s*[([][^)\]]+[)\]]\s*/g, '').trim().toLowerCase(), unit: unit?.toLowerCase() };
}

export class RenphoImporter implements HealthDataImporter {
  async validate(file: File) {
    if (!/\.csv$/i.test(file.name)) throw new Error('RENPHO imports must be a CSV export.');
  }

  async parse(file: File): Promise<ParsedHealthExport> {
    await this.validate(file);
    const rows = parseCsv(await file.text());
    if (rows.length < 2) throw new Error('The RENPHO CSV is empty.');
    const headers = rows[0].map(headerInfo);
    const dateIndex = headers.findIndex(({ name }) => ['time of measurement', 'measurement time', 'date', 'time', 'timestamp'].includes(name));
    if (dateIndex < 0) throw new Error('The RENPHO CSV is missing a measurement date/time column.');
    const mapped = headers.map(({ name, unit }, index) => {
      const definition = RENPHO_COLUMNS.find((column) => column.aliases.includes(name));
      return definition ? { ...definition, index, unit: unit ?? definition.defaultUnit } : null;
    }).filter((value): value is NonNullable<typeof value> => Boolean(value));
    if (!mapped.length) throw new Error('The RENPHO CSV does not contain supported body-composition columns.');

    const records: IncomingHealthMeasurement[] = [];
    let unsupportedRows = 0;
    rows.slice(1).forEach((row, rowIndex) => {
      const date = new Date(row[dateIndex]);
      if (Number.isNaN(date.getTime())) { unsupportedRows += 1; return; }
      let found = false;
      mapped.forEach((column) => {
        const raw = Number(row[column.index]?.replace(/[^\d.+-]/g, ''));
        if (!Number.isFinite(raw)) return;
        const measurement = normalize(column.metric, raw, column.unit);
        records.push({
          metric: column.metric,
          value: measurement.value,
          unit: measurement.unit,
          recordedAt: date.toISOString(),
          sourceRecordId: `row-${rowIndex + 2}-${column.metric}-${date.toISOString()}`,
          measurementKind: column.metric === 'weight' ? 'direct' : 'derived',
        });
        found = true;
      });
      if (!found) unsupportedRows += 1;
    });
    if (!records.length) throw new Error('No supported measurements were found in the RENPHO CSV.');
    return {
      source: 'renpho', records, unsupportedRows,
      warnings: unsupportedRows ? [`${unsupportedRows} empty or invalid RENPHO rows will be ignored.`] : [],
    };
  }

  async preview(file: File) {
    return await this.parse(file);
  }
}

export function importerFor(source: ExternalHealthDataSource): HealthDataImporter {
  return source === 'apple_health' ? new AppleHealthImporter() : new RenphoImporter();
}
