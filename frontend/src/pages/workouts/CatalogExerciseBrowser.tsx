import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Pagination, Stack, TextField, Typography } from '@mui/material';
import { Link, useSearchParams } from 'react-router-dom';
import CatalogExerciseCard from '../../components/CatalogExerciseCard';
import { CatalogExerciseSummary, getCatalogExercises } from '../../services/catalogApi';

function CatalogExerciseBrowser() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryKey = searchParams.toString();
  const [exercises, setExercises] = useState<CatalogExerciseSummary[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCatalogExercises({
      search: searchParams.get('search') ?? undefined,
      equipment: searchParams.get('equipment') ?? undefined,
      muscle: searchParams.get('muscle') ?? undefined,
      page: Number(searchParams.get('page')) || 1,
      limit: 24,
    }).then((response) => {
      if (!cancelled) {
        setExercises(response.items);
        setTotalPages(response.totalPages);
        setError(undefined);
      }
    }).catch((reason) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to load exercises.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [queryKey]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={2}>
        <Box><Typography variant="h4" component="h2">Exercise library</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Browse 873 CC0 exercises. Images stay still until you hover, focus, or click them.</Typography></Box>
        <Button component={Link} to="/workouts/exercises/plan-builder" variant="outlined">Open plan builder</Button>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={2} sx={{ my: 3 }}>
        <TextField label="Search exercises" value={searchParams.get('search') ?? ''} onChange={(event) => setFilter('search', event.target.value)} fullWidth />
        <TextField label="Equipment" value={searchParams.get('equipment') ?? ''} onChange={(event) => setFilter('equipment', event.target.value)} />
        <TextField label="Muscle" value={searchParams.get('muscle') ?? ''} onChange={(event) => setFilter('muscle', event.target.value)} />
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <Box role="status" className="vv-catalog-loading"><CircularProgress /><Typography>Loading exercises…</Typography></Box>
        : exercises.length === 0 ? <Alert severity="info">No exercises match these filters.</Alert>
          : <Box className="vv-catalog-grid">{exercises.map((exercise) => <CatalogExerciseCard key={exercise.sourceId} exercise={exercise} />)}</Box>}
      {totalPages > 1 && <Pagination page={Number(searchParams.get('page')) || 1} count={totalPages} onChange={(_event, page) => setFilter('page', String(page))} sx={{ mt: 3 }} />}
    </Box>
  );
}

export default CatalogExerciseBrowser;
