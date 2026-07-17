import { Alert, Box, Typography } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import WorkoutsNav from '../components/WorkoutsNav';
import BodyDiscovery from './workouts/BodyDiscovery';
import CatalogExerciseBrowser from './workouts/CatalogExerciseBrowser';
import RoutineBrowser from './workouts/RoutineBrowser';
import SportsBrowser from './workouts/SportsBrowser';
import Exercises from './Exercises';

function WorkoutsHub() {
  return (
    <Box className="vv-workouts-hub">
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="primary">Training hub</Typography>
        <Typography variant="h3" component="h1">Workouts</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>Discover a movement, follow a routine, or return to a plan you built.</Typography>
      </Box>
      <WorkoutsNav />
      <Alert severity="info" className="vv-wellness-notice" sx={{ mb: 3 }}>
        Mobility & Recovery routines are general education, not medical care. Stop if movement causes sharp or worsening discomfort. Injuries or persistent symptoms require qualified care.
      </Alert>
      <Routes>
        <Route index element={<Navigate to="body" replace />} />
        <Route path="body" element={<BodyDiscovery />} />
        <Route path="routines" element={<RoutineBrowser />} />
        <Route path="sports" element={<SportsBrowser />} />
        <Route path="exercises/plan-builder" element={<Exercises />} />
        <Route path="exercises" element={<CatalogExerciseBrowser />} />
        <Route path="*" element={<Navigate to="body" replace />} />
      </Routes>
    </Box>
  );
}

export default WorkoutsHub;
