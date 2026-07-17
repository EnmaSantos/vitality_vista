import { AccessTime as AccessTimeIcon, FitnessCenter as FitnessCenterIcon } from '@mui/icons-material';
import { Box, Button, Card, CardActions, CardContent, Chip, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import type { Routine } from '../services/catalogApi';

interface RoutineCardProps {
  routine: Routine;
}

function RoutineCard({ routine }: RoutineCardProps) {
  return (
    <Card variant="outlined" className="vv-routine-card">
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Typography variant="h6" component="h3">{routine.name}</Typography>
          {routine.wellness && <Chip label="Mobility & Recovery" size="small" color="success" />}
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>{routine.summary}</Typography>
        <Stack direction="row" useFlexGap flexWrap="wrap" gap={0.75}>
          <Chip label={routine.difficulty} size="small" sx={{ textTransform: 'capitalize' }} />
          <Chip icon={<AccessTimeIcon />} label={`${routine.estimatedDurationMinutes} min`} size="small" />
          <Chip label={routine.format.replace(/_/g, ' ')} size="small" sx={{ textTransform: 'capitalize' }} />
          {routine.goals.slice(0, 2).map((goal) => <Chip key={goal} label={goal} size="small" variant="outlined" />)}
          {routine.equipment.map((item) => <Chip key={item} label={item} size="small" variant="outlined" />)}
          {routine.bodyRegions.slice(0, 3).map((region) => <Chip key={region} label={region} size="small" color="primary" variant="outlined" />)}
          {routine.sports.map((sport) => <Chip key={sport} label={sport} size="small" color="secondary" />)}
        </Stack>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button component={Link} to={`/workouts/routines/${routine.slug}`} startIcon={<FitnessCenterIcon />}>
          View routine
        </Button>
      </CardActions>
    </Card>
  );
}

export default RoutineCard;
