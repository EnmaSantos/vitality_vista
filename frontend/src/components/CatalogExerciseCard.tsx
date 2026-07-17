import { Button, Card, CardActions, CardContent, Chip, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import type { CatalogExerciseSummary } from '../services/catalogApi';
import ExerciseMedia from './ExerciseMedia';

interface CatalogExerciseCardProps {
  exercise: CatalogExerciseSummary;
}

function CatalogExerciseCard({ exercise }: CatalogExerciseCardProps) {
  return (
    <Card variant="outlined" className="vv-exercise-card">
      <ExerciseMedia exercise={exercise} compact />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h3">{exercise.name}</Typography>
        <Stack direction="row" useFlexGap flexWrap="wrap" gap={0.75} sx={{ mt: 1.5 }}>
          <Chip label={exercise.bodyPart} size="small" color="primary" />
          <Chip label={exercise.equipment} size="small" variant="outlined" />
          {exercise.recommendation?.difficulty && <Chip label={exercise.recommendation.difficulty} size="small" variant="outlined" />}
          {exercise.recommendation?.sportTags.map((sport) => <Chip key={sport} label={sport} size="small" color="secondary" />)}
        </Stack>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button component={Link} to={`/workout/session/exercise/${exercise.id}`} variant="contained">
          Log exercise
        </Button>
      </CardActions>
    </Card>
  );
}

export default CatalogExerciseCard;
