import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { AppleHealthImporter, RenphoImporter } from './importers';

function file(parts: BlobPart[], name: string, type: string) {
  return new File(parts, name, { type });
}

const appleExport = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
  <Record type="HKQuantityTypeIdentifierBodyMass" sourceName="Scale" unit="lb" creationDate="2026-01-02 08:00:00 -0700" startDate="2026-01-02 08:00:00 -0700" endDate="2026-01-02 08:00:00 -0700" value="185.2"/>
  <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" creationDate="2026-01-02 09:00:00 -0700" startDate="2026-01-02 08:00:00 -0700" endDate="2026-01-02 09:00:00 -0700" value="650"/>
  <Record type="HKQuantityTypeIdentifierFlightsClimbed" sourceName="iPhone" unit="count" creationDate="2026-01-02 09:00:00 -0700" startDate="2026-01-02 08:00:00 -0700" endDate="2026-01-02 09:00:00 -0700" value="2"/>
</HealthData>`;

describe('AppleHealthImporter', () => {
  it('normalizes supported XML records and reports unsupported records', async () => {
    const result = await new AppleHealthImporter().parse(file([appleExport], 'export.xml', 'application/xml'));
    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toMatchObject({ metric: 'weight', unit: 'kg' });
    expect(result.records[0].value).toBeCloseTo(84.006, 2);
    expect(result.records[1]).toMatchObject({ metric: 'steps', aggregationType: 'sum', unit: 'count' });
    expect(result.unsupportedRows).toBe(1);
  });

  it('reads export.xml from the original Apple Health ZIP', async () => {
    const zipped = zipSync({ 'apple_health_export/export.xml': strToU8(appleExport) });
    const result = await new AppleHealthImporter().parse(file([zipped], 'export.zip', 'application/zip'));
    expect(result.records.map((record) => record.metric)).toEqual(['weight', 'steps']);
  });

  it('rejects unsupported and corrupted Apple Health files clearly', async () => {
    await expect(new AppleHealthImporter().parse(file(['not xml'], 'export.csv', 'text/csv')))
      .rejects.toThrow('export.xml file or the original export ZIP');
    await expect(new AppleHealthImporter().parse(file(['not a zip'], 'export.zip', 'application/zip')))
      .rejects.toThrow('corrupted or unreadable');
  });
});

describe('RenphoImporter', () => {
  it('maps common RENPHO columns into normalized measurements', async () => {
    const csv = [
      'Time of Measurement,Weight(lb),BMI,Body Fat(%),Muscle Mass(lb),Body Water(%),Visceral Fat,BMR(kcal)',
      '2026-01-02T08:01:12-07:00,185.2,25.1,18.4,142.6,55.2,8,1780',
    ].join('\n');
    const result = await new RenphoImporter().parse(file([csv], 'renpho.csv', 'text/csv'));
    expect(result.records).toHaveLength(7);
    expect(result.records.find((record) => record.metric === 'weight')).toMatchObject({ unit: 'kg' });
    expect(result.records.find((record) => record.metric === 'body_fat_percentage')).toMatchObject({ value: 18.4, unit: '%' });
    expect(result.records.every((record) => record.sourceRecordId?.startsWith('row-2-'))).toBe(true);
  });

  it('rejects exports without a measurement timestamp', async () => {
    const csv = 'Weight(lb),BMI\n185.2,25.1';
    await expect(new RenphoImporter().parse(file([csv], 'renpho.csv', 'text/csv')))
      .rejects.toThrow('measurement date/time column');
  });

  it('rejects an empty RENPHO export', async () => {
    await expect(new RenphoImporter().parse(file(['Time of Measurement,Weight(lb)'], 'renpho.csv', 'text/csv')))
      .rejects.toThrow('empty');
  });
});
