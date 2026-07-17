import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import BodyMap from '../../components/BodyMap';
import CatalogExerciseCard from '../../components/CatalogExerciseCard';
import RoutineCard from '../../components/RoutineCard';
import { BodyRegion, CatalogExerciseSummary, getBodyRegions, getCatalogExercises, getRoutines, Routine } from '../../services/catalogApi';

function BodyDiscovery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedRegion = searchParams.get('region') ?? '';
  const resultType = searchParams.get('result') === 'routines' ? 'routines' : 'exercises';
  const [regions, setRegions] = useState<BodyRegion[]>([]);
  const [exercises, setExercises] = useState<CatalogExerciseSummary[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    getBodyRegions().then(setRegions).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load body regions.'));
  }, []);

  useEffect(() => {
    if (!selectedRegion) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    const request = resultType === 'exercises'
      ? getCatalogExercises({ bodyRegion: selectedRegion, limit: 100 }).then((response) => {
        if (!cancelled) setExercises(response.items);
      })
      : getRoutines({ bodyRegion: selectedRegion, limit: 50 }).then((response) => {
        if (!cancelled) setRoutines(response.items);
      });
    request.catch((reason) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to load recommendations.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [resultType, selectedRegion]);

  const updateSelection = (region: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('region', region);
    if (!next.has('result')) next.set('result', 'exercises');
    setSearchParams(next);
  };

  const setResultType = (value: 'exercises' | 'routines') => {
    const next = new URLSearchParams(searchParams);
    next.set('result', value);
    setSearchParams(next);
  };

  const selectedLabel = regions.find((region) => region.id === selectedRegion)?.label ?? selectedRegion;
  const items = resultType === 'exercises' ? exercises : routines;

  return (
    <Box>
      <Typography variant="h4" component="h2">Choose an area to train or mobilize</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        Hover, focus, or tap an original Vitality Vista body region, then browse matching exercises or routines.
      </Typography>
      <BodyMap regions={regions} selectedRegion={selectedRegion} onSelect={updateSelection} />

      {selectedRegion && (
        <Box sx={{ mt: 4 }} aria-live="polite">
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={2} sx={{ mb: 2 }}>
            <Typography variant="h5" component="h2">{selectedLabel}</Typography>
            <Stack direction="row" gap={1}>
              <Button variant={resultType === 'exercises' ? 'contained' : 'outlined'} onClick={() => setResultType('exercises')}>Exercises</Button>
              <Button variant={resultType === 'routines' ? 'contained' : 'outlined'} onClick={() => setResultType('routines')}>Routines</Button>
            </Stack>
          </Stack>
          {error && <Alert severity="error">{error}</Alert>}
          {loading ? (
            <Box role="status" className="vv-catalog-loading"><CircularProgress /><Typography>Loading matches…</Typography></Box>
          ) : items.length === 0 ? (
            <Alert severity="info">No {resultType} match this region yet.</Alert>
          ) : (
            <Box className="vv-catalog-grid">
              {resultType === 'exercises'
                ? exercises.map((exercise) => <CatalogExerciseCard key={exercise.sourceId} exercise={exercise} />)
                : routines.map((routine) => <RoutineCard key={routine.slug} routine={routine} />)}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

export default BodyDiscovery;
