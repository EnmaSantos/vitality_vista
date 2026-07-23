import { Button, Stack } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

const destinations = [
  { path: '/workouts/body', label: 'Body Map' },
  { path: '/workouts/routines', label: 'Routines' },
  { path: '/workouts/sports', label: 'Sports' },
  { path: '/workouts/exercises', label: 'Exercises' },
  { path: '/my-plans', label: 'My Plans' },
  { path: '/workout-history', label: 'History' },
] as const;

function WorkoutsNav() {
  const { pathname } = useLocation();
  return (
    <Stack component="nav" direction="row" useFlexGap flexWrap="wrap" gap={1} aria-label="Workout sections" sx={{ mb: 3 }}>
      {destinations.map((destination) => {
        const active = pathname === destination.path || pathname.startsWith(`${destination.path}/`);
        return (
          <Button
            key={destination.path}
            component={Link}
            to={destination.path}
            variant={active ? 'contained' : 'outlined'}
            aria-current={active ? 'page' : undefined}
            sx={{ minHeight: 44 }}
          >
            {destination.label}
          </Button>
        );
      })}
    </Stack>
  );
}

export default WorkoutsNav;
