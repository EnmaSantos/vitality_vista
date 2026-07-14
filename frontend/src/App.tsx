import { lazy, Suspense } from 'react';
import { Box, CircularProgress, CssBaseline, Typography } from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import { muiTheme } from './muiTheme';
import './App.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ExercisesPage = lazy(() => import('./pages/Exercises'));
const FoodLogPage = lazy(() => import('./pages/FoodLog'));
const ProgressPage = lazy(() => import('./pages/Progress'));
const RecipesPage = lazy(() => import('./pages/Recipes'));
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const GitHubOAuthCallback = lazy(() => import('./pages/GitHubOAuthCallback'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MyPlans = lazy(() => import('./pages/MyPlans'));
const WorkoutHistory = lazy(() => import('./pages/WorkoutHistory'));
const WorkoutSession = lazy(() => import('./pages/WorkoutSession'));
const DataSourcesPage = lazy(() => import('./pages/DataSources'));

function PageLoader() {
  return (
    <Box className="vv-page-loader" role="status" aria-live="polite">
      <CircularProgress size={28} thickness={4.5} />
      <Typography>Loading your workspace…</Typography>
    </Box>
  );
}

function AppLayout() {
  const location = useLocation();
  const noShellRoutes = ['/login', '/signup', '/forgot-password', '/landing', '/auth/github/callback'];
  const hideShell = noShellRoutes.includes(location.pathname);

  const routes = (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/github/callback" element={<GitHubOAuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/exercises" element={<ProtectedRoute><ExercisesPage /></ProtectedRoute>} />
        <Route path="/food-log" element={<ProtectedRoute><FoodLogPage /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
        <Route path="/recipes" element={<ProtectedRoute><RecipesPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/data-sources" element={<ProtectedRoute><DataSourcesPage /></ProtectedRoute>} />
        <Route path="/my-plans" element={<ProtectedRoute><MyPlans /></ProtectedRoute>} />
        <Route path="/workout-history" element={<ProtectedRoute><WorkoutHistory /></ProtectedRoute>} />
        <Route path="/workout/session/:planId" element={<ProtectedRoute><WorkoutSession /></ProtectedRoute>} />
        <Route path="/workout/session/exercise/:exerciseId" element={<ProtectedRoute><WorkoutSession /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </Suspense>
  );

  return hideShell ? <main className="vv-public-main">{routes}</main> : <AppShell>{routes}</AppShell>;
}

function App() {
  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    </MuiThemeProvider>
  );
}

export default App;
