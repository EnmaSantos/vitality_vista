import { useEffect, useState } from 'react';
import { Add as AddIcon, ArrowBack as ArrowBackIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import { Alert, Box, Button, Chip, CircularProgress, Divider, Paper, Snackbar, Stack, Typography } from '@mui/material';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cloneRoutineToPlan } from '../api/workoutApi';
import ExerciseMedia from '../components/ExerciseMedia';
import WorkoutsNav from '../components/WorkoutsNav';
import { useAuth } from '../context/AuthContext';
import { getRoutine, Routine } from '../services/catalogApi';

const phaseLabels = { warmup: 'Warm-up', work: 'Work', cooldown: 'Cool-down' } as const;

function RoutineDetail() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [routine, setRoutine] = useState<Routine>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getRoutine(slug).then((result) => { if (!cancelled) setRoutine(result); })
      .catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to load routine.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  const addToPlans = async () => {
    if (!routine) return;
    setAdding(true);
    const response = await cloneRoutineToPlan(routine.slug, token);
    setAdding(false);
    if (response.success) {
      setMessage('Added an editable copy to My Plans.');
    } else {
      setMessage(response.error ?? 'Unable to add this routine.');
    }
  };

  if (loading) return <Box role="status" className="vv-catalog-loading"><CircularProgress /><Typography>Loading routine…</Typography></Box>;
  if (error || !routine) return <Box><Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/workouts/routines')}>Back to routines</Button><Alert severity="error" sx={{ mt: 2 }}>{error ?? 'Routine not found.'}</Alert></Box>;

  return (
    <Box className="vv-workouts-hub">
      <WorkoutsNav />
      <Button component={Link} to="/workouts/routines" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>Back to routines</Button>
      <Typography variant="overline" color="primary">{routine.difficulty} · {routine.format.replace(/_/g, ' ')}</Typography>
      <Typography variant="h3" component="h1">{routine.name}</Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mt: 1, maxWidth: 800 }}>{routine.summary}</Typography>
      <Stack direction="row" useFlexGap flexWrap="wrap" gap={1} sx={{ my: 2 }}>
        <Chip label={`${routine.estimatedDurationMinutes} minutes`} />
        <Chip label={`${routine.rounds} ${routine.rounds === 1 ? 'round' : 'rounds'}`} />
        {routine.goals.map((goal) => <Chip key={goal} label={goal} color="primary" variant="outlined" />)}
        {routine.bodyRegions.map((region) => <Chip key={region} label={region} variant="outlined" />)}
        {routine.sports.map((sport) => <Chip key={sport} label={sport} color="secondary" />)}
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} sx={{ mb: 4 }}>
        <Button component={Link} to={`/workout/session/routine/${routine.slug}`} variant="contained" size="large" startIcon={<PlayArrowIcon />}>Start Routine</Button>
        <Button variant="outlined" size="large" startIcon={<AddIcon />} onClick={addToPlans} disabled={adding}>{adding ? 'Adding…' : 'Add to My Plans'}</Button>
      </Stack>

      {routine.wellness && <Alert severity="info" sx={{ mb: 3 }}>This Mobility & Recovery routine is general education, not medical care. Stop if movement causes sharp or worsening discomfort. For injuries or persistent symptoms, seek qualified care.</Alert>}

      {(['warmup', 'work', 'cooldown'] as const).map((phase) => {
        const phaseExercises = routine.exercises.filter((item) => item.phase === phase);
        if (phaseExercises.length === 0) return null;
        return (
          <Box key={phase} sx={{ mb: 4 }}>
            <Typography variant="h4" component="h2" sx={{ mb: 2 }}>{phaseLabels[phase]}</Typography>
            <Stack spacing={2}>
              {phaseExercises.map((item) => (
                <Paper key={`${phase}-${item.order}-${item.sourceId}`} variant="outlined" className="vv-routine-movement">
                  {item.exercise && <Box className="vv-routine-movement-media"><ExerciseMedia exercise={item.exercise} compact /></Box>}
                  <Box sx={{ p: 2.5, flex: 1 }}>
                    <Typography variant="h6" component="h3">{item.order}. {item.exercise?.name ?? item.sourceId}</Typography>
                    <Typography sx={{ mt: 1 }}>{item.sets ? `${item.sets} sets` : routine.rounds > 1 && phase === 'work' ? `${routine.rounds} rounds` : 'Once'}{item.reps ? ` · ${item.reps} reps` : ''}{item.durationSeconds ? ` · ${item.durationSeconds} seconds` : ''} · {item.restSeconds} seconds rest</Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography color="text.secondary">{item.sideGuidance} {item.notes}</Typography>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Box>
        );
      })}
      <Typography variant="caption" color="text.secondary">Routine catalog © Vitality Vista / Enma Santos — CC BY 4.0. Exercise catalog: Anatome / Free Exercise DB — CC0.</Typography>
      <Snackbar open={Boolean(message)} autoHideDuration={5000} onClose={() => setMessage(undefined)} message={message} />
    </Box>
  );
}

export default RoutineDetail;
