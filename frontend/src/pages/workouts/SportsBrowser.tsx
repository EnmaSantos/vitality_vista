import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import CatalogExerciseCard from '../../components/CatalogExerciseCard';
import RoutineCard from '../../components/RoutineCard';
import { CatalogExerciseSummary, getCatalogExercises, getRoutines, getSports, Routine, Sport } from '../../services/catalogApi';

function SportsBrowser() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSport = searchParams.get('sport') ?? '';
  const [sports, setSports] = useState<Sport[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<CatalogExerciseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    getSports().then((items) => {
      setSports(items);
      if (!selectedSport && items[0]) setSearchParams({ sport: items[0].id }, { replace: true });
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load sports.'));
  }, []);

  useEffect(() => {
    if (!selectedSport) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getRoutines({ sport: selectedSport, limit: 50 }),
      getCatalogExercises({ sport: selectedSport, limit: 100 }),
    ]).then(([routineResponse, exerciseResponse]) => {
      if (!cancelled) {
        setRoutines(routineResponse.items);
        setExercises(exerciseResponse.items);
        setError(undefined);
      }
    }).catch((reason) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to load sports recommendations.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedSport]);

  return (
    <Box>
      <Typography variant="h4" component="h2">Exercises recommended for sports</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>General fitness support for recreational activity—not sport coaching or injury prevention.</Typography>
      <Stack direction="row" useFlexGap flexWrap="wrap" gap={1} sx={{ my: 3 }} aria-label="Choose a sport">
        {sports.map((sport) => <Button key={sport.id} variant={selectedSport === sport.id ? 'contained' : 'outlined'} aria-pressed={selectedSport === sport.id} onClick={() => setSearchParams({ sport: sport.id })} sx={{ minHeight: 44 }}>{sport.label}</Button>)}
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <Box role="status" className="vv-catalog-loading"><CircularProgress /><Typography>Loading recommendations…</Typography></Box> : (
        <>
          <Typography variant="h5" component="h3" sx={{ mb: 2 }}>Routine</Typography>
          <Box className="vv-catalog-grid">{routines.map((routine) => <RoutineCard key={routine.slug} routine={routine} />)}</Box>
          <Typography variant="h5" component="h3" sx={{ mt: 4, mb: 2 }}>Curated exercises</Typography>
          <Box className="vv-catalog-grid">{exercises.map((exercise) => <CatalogExerciseCard key={exercise.sourceId} exercise={exercise} />)}</Box>
        </>
      )}
    </Box>
  );
}

export default SportsBrowser;
