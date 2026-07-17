import { useEffect, useState } from 'react';
import { Alert, Box, CircularProgress, FormControl, InputLabel, MenuItem, Pagination, Select, Stack, TextField, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import RoutineCard from '../../components/RoutineCard';
import { getRoutines, Routine } from '../../services/catalogApi';

function RoutineBrowser() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryKey = searchParams.toString();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getRoutines({
      search: searchParams.get('search') ?? undefined,
      difficulty: searchParams.get('difficulty') ?? undefined,
      format: searchParams.get('format') ?? undefined,
      maxDuration: Number(searchParams.get('maxDuration')) || undefined,
      page: Number(searchParams.get('page')) || 1,
      limit: 12,
    }).then((response) => {
      if (!cancelled) {
        setRoutines(response.items);
        setTotalPages(response.totalPages);
        setError(undefined);
      }
    }).catch((reason) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to load routines.');
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
      <Typography variant="h4" component="h2">50 original routines</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>Single-session routines built from the CC0 exercise catalog. No default weights are prescribed.</Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={2} sx={{ mb: 3 }}>
        <TextField label="Search routines" value={searchParams.get('search') ?? ''} onChange={(event) => setFilter('search', event.target.value)} fullWidth />
        <FormControl sx={{ minWidth: 170 }}><InputLabel>Difficulty</InputLabel><Select label="Difficulty" value={searchParams.get('difficulty') ?? ''} onChange={(event) => setFilter('difficulty', event.target.value)}><MenuItem value="">All</MenuItem><MenuItem value="beginner">Beginner</MenuItem><MenuItem value="intermediate">Intermediate</MenuItem><MenuItem value="advanced">Advanced</MenuItem></Select></FormControl>
        <FormControl sx={{ minWidth: 180 }}><InputLabel>Format</InputLabel><Select label="Format" value={searchParams.get('format') ?? ''} onChange={(event) => setFilter('format', event.target.value)}><MenuItem value="">All</MenuItem><MenuItem value="straight_sets">Straight sets</MenuItem><MenuItem value="circuit">Circuit</MenuItem><MenuItem value="interval">Interval</MenuItem><MenuItem value="mobility_flow">Mobility flow</MenuItem></Select></FormControl>
        <FormControl sx={{ minWidth: 150 }}><InputLabel>Max time</InputLabel><Select label="Max time" value={searchParams.get('maxDuration') ?? ''} onChange={(event) => setFilter('maxDuration', event.target.value)}><MenuItem value="">Any</MenuItem><MenuItem value="15">15 min</MenuItem><MenuItem value="30">30 min</MenuItem><MenuItem value="45">45 min</MenuItem></Select></FormControl>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <Box role="status" className="vv-catalog-loading"><CircularProgress /><Typography>Loading routines…</Typography></Box>
        : routines.length === 0 ? <Alert severity="info">No routines match these filters.</Alert>
          : <Box className="vv-catalog-grid">{routines.map((routine) => <RoutineCard key={routine.slug} routine={routine} />)}</Box>}
      {totalPages > 1 && <Pagination page={Number(searchParams.get('page')) || 1} count={totalPages} onChange={(_event, page) => setFilter('page', String(page))} sx={{ mt: 3 }} />}
    </Box>
  );
}

export default RoutineBrowser;
