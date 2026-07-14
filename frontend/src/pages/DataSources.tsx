import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Apple as AppleIcon,
  CloudUpload as CloudUploadIcon,
  DeleteOutline as DisconnectIcon,
  EditNote as ManualIcon,
  MonitorWeight as ScaleIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { importerFor, ParsedHealthExport } from '../features/healthData/importers';
import {
  confirmHealthImport,
  createManualMeasurement,
  ExternalHealthDataSource,
  getHealthDataProfile,
  getHealthMeasurements,
  HealthDataSource,
  HealthMeasurement,
  ImportPreview,
  previewHealthImport,
  updateHealthDataProfile,
  setPrimaryHealthMeasurement,
} from '../services/healthDataApi';

const SOURCE_LABELS: Record<HealthDataSource, string> = {
  manual: 'Manual', apple_health: 'Apple Health', renpho: 'RENPHO',
};

const METRICS = [
  ['weight', 'Weight', 'kg'],
  ['body_fat_percentage', 'Body fat', '%'],
  ['bmi', 'BMI', 'count'],
  ['muscle_mass', 'Muscle mass', 'kg'],
  ['body_water_percentage', 'Body water', '%'],
  ['bone_mass', 'Bone mass', 'kg'],
  ['visceral_fat', 'Visceral fat', 'count'],
  ['basal_metabolic_rate', 'Basal metabolic rate', 'kcal'],
  ['heart_rate', 'Heart rate', 'bpm'],
] as const;

const metricLabel = (metric: string) => METRICS.find(([value]) => value === metric)?.[1] ?? metric.replace(/_/g, ' ');
const sourceColor = (source: HealthDataSource): 'default' | 'primary' | 'secondary' =>
  source === 'manual' ? 'default' : source === 'apple_health' ? 'primary' : 'secondary';

function localDateTimeValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function DataSourcesPage() {
  const { token } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const [activeSource, setActiveSource] = useState<ExternalHealthDataSource | null>(null);
  const [selectedSource, setSelectedSource] = useState<ExternalHealthDataSource>('apple_health');
  const [parsed, setParsed] = useState<ParsedHealthExport | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [history, setHistory] = useState<HealthMeasurement[]>([]);
  const [sourceFilter, setSourceFilter] = useState<HealthDataSource | ''>('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [manual, setManual] = useState({ metric: 'weight', value: '', unit: 'kg', recordedAt: localDateTimeValue(), notes: '' });

  const refresh = useCallback(async () => {
    if (!token) return;
    const [profile, measurements] = await Promise.all([
      getHealthDataProfile(token), getHealthMeasurements(token, sourceFilter),
    ]);
    setActiveSource(profile.activeExternalSource);
    if (profile.activeExternalSource) setSelectedSource(profile.activeExternalSource);
    setHistory(measurements);
  }, [token, sourceFilter]);

  useEffect(() => {
    setLoading(true);
    refresh().catch((caught) => setError(caught instanceof Error ? caught.message : 'Could not load health data.'))
      .finally(() => setLoading(false));
  }, [refresh]);

  const switchRequired = Boolean(activeSource && activeSource !== selectedSource);
  const acceptedFileTypes = selectedSource === 'apple_health' ? '.xml,.zip,application/xml,application/zip' : '.csv,text/csv';

  const handleSourceChange = (source: ExternalHealthDataSource) => {
    setSelectedSource(source);
    setParsed(null);
    setPreview(null);
    setError(null);
    if (fileInput.current) fileInput.current.value = '';
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;
    setWorking(true);
    setError(null);
    setNotice(null);
    setPreview(null);
    try {
      const result = await importerFor(selectedSource).preview(file);
      setParsed(result);
      setPreview(await previewHealthImport(token, selectedSource, result.records));
    } catch (caught) {
      setParsed(null);
      setError(caught instanceof Error ? caught.message : 'The export could not be read.');
    } finally {
      setWorking(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!token || !parsed) return;
    setWorking(true);
    setError(null);
    try {
      const result = await confirmHealthImport(token, selectedSource, parsed.records);
      setNotice(`${result.imported} measurements imported, ${result.skipped} skipped, and ${result.conflicts} flagged for review.`);
      setConfirmOpen(false);
      setParsed(null);
      setPreview(null);
      if (fileInput.current) fileInput.current.value = '';
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The import could not be completed.');
    } finally {
      setWorking(false);
    }
  };

  const handleDisconnect = async () => {
    if (!token) return;
    setWorking(true);
    setError(null);
    try {
      await updateHealthDataProfile(token, null);
      setActiveSource(null);
      setDisconnectOpen(false);
      setNotice('External source disconnected. Previously imported measurements remain in your history.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The source could not be disconnected.');
    } finally {
      setWorking(false);
    }
  };

  const handleManualMetric = (metric: string) => {
    const definition = METRICS.find(([value]) => value === metric);
    setManual((current) => ({ ...current, metric, unit: definition?.[2] ?? current.unit }));
  };

  const handleManualSubmit = async () => {
    if (!token) return;
    const value = Number(manual.value);
    if (!Number.isFinite(value)) { setError('Enter a valid measurement value.'); return; }
    setWorking(true);
    setError(null);
    try {
      await createManualMeasurement(token, {
        metric: manual.metric, value, unit: manual.unit,
        recordedAt: new Date(manual.recordedAt).toISOString(), notes: manual.notes || undefined,
      });
      setManual((current) => ({ ...current, value: '', notes: '', recordedAt: localDateTimeValue() }));
      setNotice('Manual measurement added.');
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The measurement could not be saved.');
    } finally {
      setWorking(false);
    }
  };

  const handleMakePrimary = async (measurementId: string) => {
    if (!token) return;
    setWorking(true);
    setError(null);
    try {
      await setPrimaryHealthMeasurement(token, measurementId);
      setNotice('Primary measurement updated. Both conflicting records remain in history.');
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The primary measurement could not be updated.');
    } finally {
      setWorking(false);
    }
  };

  const invalidExamples = preview?.records.filter((record) => record.status === 'invalid').slice(0, 5) ?? [];

  if (loading) return <Box sx={{ display: 'grid', minHeight: 420, placeItems: 'center' }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack spacing={1} mb={4}>
        <Typography variant="overline" color="primary" fontWeight={800}>Profile & settings</Typography>
        <Typography variant="h3" fontWeight={800}>Health data sources</Typography>
        <Typography color="text.secondary" maxWidth={760}>
          Bring manual measurements, Apple Health, or RENPHO into one history. Only one external source can be active; manual entries are always available.
        </Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} mb={3}>
              <Box>
                <Typography variant="h5" fontWeight={750}>External source</Typography>
                <Typography variant="body2" color="text.secondary">Choose a source, then upload its export for a safe preview.</Typography>
              </Box>
              {activeSource ? <Chip label={`Active: ${SOURCE_LABELS[activeSource]}`} color="success" /> : <Chip label="No source connected" />}
            </Stack>

            <Grid container spacing={2}>
              {(['apple_health', 'renpho'] as const).map((source) => (
                <Grid item xs={12} sm={6} key={source}>
                  <Paper
                    component="button"
                    type="button"
                    onClick={() => handleSourceChange(source)}
                    variant="outlined"
                    sx={{
                      width: '100%', p: 2.5, textAlign: 'left', cursor: 'pointer', borderRadius: 2,
                      borderWidth: selectedSource === source ? 2 : 1,
                      borderColor: selectedSource === source ? 'primary.main' : 'divider', bgcolor: 'background.paper',
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {source === 'apple_health' ? <AppleIcon /> : <ScaleIcon />}
                      <Box><Typography fontWeight={750}>{SOURCE_LABELS[source]}</Typography><Typography variant="caption" color="text.secondary">{source === 'apple_health' ? 'XML or original ZIP' : 'CSV export'}</Typography></Box>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {switchRequired && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {SOURCE_LABELS[activeSource!]} is active. Confirming this import will disconnect it and activate {SOURCE_LABELS[selectedSource]}. Existing records will remain.
              </Alert>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mt={3}>
              <Button component="label" variant="contained" startIcon={<CloudUploadIcon />} disabled={working}>
                Choose export file
                <input ref={fileInput} hidden type="file" accept={acceptedFileTypes} onChange={handleFile} />
              </Button>
              {activeSource && <Button color="error" startIcon={<DisconnectIcon />} onClick={() => setDisconnectOpen(true)}>Disconnect current source</Button>}
            </Stack>
            {working && <Stack direction="row" spacing={1} mt={2} alignItems="center"><CircularProgress size={18} /><Typography variant="body2">Checking records…</Typography></Stack>}

            {preview && parsed && (
              <Box mt={3}>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="h6" fontWeight={750}>Import preview</Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {preview.totalRecords} supported measurements · {preview.dateRange ? `${new Date(preview.dateRange.start).toLocaleDateString()}–${new Date(preview.dateRange.end).toLocaleDateString()}` : 'No valid date range'}
                </Typography>
                <Grid container spacing={1.5}>
                  {([
                    ['New', preview.summary.new, 'success'],
                    ['Exact duplicates', preview.summary.exact_duplicate, 'default'],
                    ['Likely duplicates', preview.summary.likely_duplicate, 'warning'],
                    ['Conflicts', preview.summary.conflict, 'error'],
                    ['Invalid', preview.summary.invalid, 'default'],
                  ] as const).map(([label, count, color]) => (
                    <Grid item xs={6} sm key={label}><Chip label={`${count} ${label}`} color={color} variant={count ? 'filled' : 'outlined'} sx={{ width: '100%' }} /></Grid>
                  ))}
                </Grid>
                <Typography variant="body2" mt={2}><strong>Types:</strong> {preview.measurementTypes.map(metricLabel).join(', ')}</Typography>
                {parsed.warnings.map((warning) => <Alert key={warning} severity="info" sx={{ mt: 1 }}>{warning}</Alert>)}
                {invalidExamples.map((record) => <Alert key={record.index} severity="warning" sx={{ mt: 1 }}>Row {record.index + 1}: {record.issue}</Alert>)}
                <Alert severity="info" sx={{ mt: 2 }}>Exact and likely duplicates are skipped. Conflicting values are preserved together and flagged for review.</Alert>
                <Button variant="contained" sx={{ mt: 2 }} disabled={working || preview.summary.new + preview.summary.conflict === 0} onClick={() => setConfirmOpen(true)}>Review and confirm import</Button>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={2}><ManualIcon color="primary" /><Box><Typography variant="h5" fontWeight={750}>Manual entry</Typography><Typography variant="body2" color="text.secondary">Available with any external source.</Typography></Box></Stack>
            <Stack spacing={2}>
              <FormControl fullWidth><InputLabel>Measurement</InputLabel><Select label="Measurement" value={manual.metric} onChange={(event) => handleManualMetric(event.target.value)}>{METRICS.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</Select></FormControl>
              <Stack direction="row" spacing={1.5}>
                <TextField fullWidth type="number" label="Value" value={manual.value} onChange={(event) => setManual((current) => ({ ...current, value: event.target.value }))} inputProps={{ step: 'any' }} />
                <TextField sx={{ width: 125 }} label="Unit" value={manual.unit} onChange={(event) => setManual((current) => ({ ...current, unit: event.target.value }))} />
              </Stack>
              <TextField type="datetime-local" label="Recorded at" value={manual.recordedAt} onChange={(event) => setManual((current) => ({ ...current, recordedAt: event.target.value }))} InputLabelProps={{ shrink: true }} />
              <TextField label="Notes (optional)" value={manual.notes} onChange={(event) => setManual((current) => ({ ...current, notes: event.target.value }))} multiline minRows={2} />
              <Button variant="outlined" onClick={handleManualSubmit} disabled={working || !manual.value}>Add measurement</Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} mb={2}>
              <Box><Typography variant="h5" fontWeight={750}>Measurement history</Typography><Typography variant="body2" color="text.secondary">Origins and conflicts remain visible for every record.</Typography></Box>
              <FormControl size="small" sx={{ minWidth: 180 }}><InputLabel>Source</InputLabel><Select label="Source" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as HealthDataSource | '')}><MenuItem value="">All sources</MenuItem>{Object.entries(SOURCE_LABELS).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</Select></FormControl>
            </Stack>
            <Divider />
            {history.length === 0 ? <Typography color="text.secondary" py={4} textAlign="center">No measurements match this filter.</Typography> : (
              <Stack divider={<Divider flexItem />}>
                {history.map((measurement) => (
                  <Stack key={measurement.id} direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1.5} py={2}>
                    <Box><Typography fontWeight={700} textTransform="capitalize">{metricLabel(measurement.metric)}</Typography><Typography variant="body2" color="text.secondary">{new Date(measurement.recordedAt).toLocaleString()}{measurement.notes ? ` · ${measurement.notes}` : ''}</Typography></Box>
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap"><Typography fontWeight={800}>{Number(measurement.value).toLocaleString(undefined, { maximumFractionDigits: 2 })} {measurement.unit}</Typography><Chip size="small" color={sourceColor(measurement.source)} label={SOURCE_LABELS[measurement.source]} />{measurement.status === 'conflict' && <Chip size="small" color="warning" label={measurement.isPrimary ? 'Conflict · primary' : 'Conflict'} />}{measurement.status === 'conflict' && !measurement.isPrimary && <Button size="small" disabled={working} onClick={() => handleMakePrimary(measurement.id)}>Make primary</Button>}</Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={confirmOpen} onClose={() => !working && setConfirmOpen(false)}>
        <DialogTitle>Confirm {SOURCE_LABELS[selectedSource]} import?</DialogTitle>
        <DialogContent><DialogContentText>{switchRequired ? `${SOURCE_LABELS[activeSource!]} will be disconnected. ` : ''}{preview?.summary.new ?? 0} new measurements and {preview?.summary.conflict ?? 0} conflicts will be saved. Existing imported records will not be deleted.</DialogContentText></DialogContent>
        <DialogActions><Button onClick={() => setConfirmOpen(false)} disabled={working}>Cancel</Button><Button variant="contained" onClick={handleConfirmImport} disabled={working}>Confirm import</Button></DialogActions>
      </Dialog>

      <Dialog open={disconnectOpen} onClose={() => !working && setDisconnectOpen(false)}>
        <DialogTitle>Disconnect {activeSource ? SOURCE_LABELS[activeSource] : 'source'}?</DialogTitle>
        <DialogContent><DialogContentText>Previously imported measurements will remain in history. You can reconnect this source or switch later.</DialogContentText></DialogContent>
        <DialogActions><Button onClick={() => setDisconnectOpen(false)} disabled={working}>Cancel</Button><Button color="error" onClick={handleDisconnect} disabled={working}>Disconnect</Button></DialogActions>
      </Dialog>
    </Container>
  );
}
