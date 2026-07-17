import { Suspense } from 'react';
import { Box, CircularProgress, CssBaseline, Typography } from '@mui/material';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { muiTheme } from './muiTheme';
import Landing from './pages/Landing';
import { lazyPage } from './utils/lazyPage';
import './App.css';

const Dashboard = lazyPage('dashboard', () => import('./pages/Dashboard'));
const FoodLogPage = lazyPage('food-log', () => import('./pages/FoodLog'));
const ProgressPage = lazyPage('progress', () => import('./pages/Progress'));
const RecipesPage = lazyPage('recipes', () => import('./pages/Recipes'));
const Login = lazyPage('login', () => import('./pages/Login'));
const Signup = lazyPage('signup', () => import('./pages/Signup'));
const GitHubOAuthCallback = lazyPage('github-callback', () => import('./pages/GitHubOAuthCallback'));
const ForgotPassword = lazyPage('forgot-password', () => import('./pages/ForgotPassword'));
const ProfilePage = lazyPage('profile', () => import('./pages/ProfilePage'));
const MyPlans = lazyPage('my-plans', () => import('./pages/MyPlans'));
const WorkoutHistory = lazyPage('workout-history', () => import('./pages/WorkoutHistory'));
const WorkoutSession = lazyPage('workout-session', () => import('./pages/WorkoutSession'));
const DataSourcesPage = lazyPage('data-sources', () => import('./pages/DataSources'));
const WorkoutsHub = lazyPage('workouts-hub', () => import('./pages/WorkoutsHub'));
const RoutineDetail = lazyPage('routine-detail', () => import('./pages/RoutineDetail'));
const DeveloperApi = lazyPage('developer-api', () => import('./pages/DeveloperApi'));

function PageLoader() {
  return (
    <Box className="vv-page-loader" role="status" aria-live="polite">
      <CircularProgress size={28} thickness={4.5} />
      <Typography>Loading your workspace...</Typography>
    </Box>
  );
}

function AppLayout() {
  const location = useLocation();
  const noShellRoutes = ['/login', '/signup', '/forgot-password', '/landing', '/auth/github/callback', '/developers/api'];
  const hideShell = noShellRoutes.includes(location.pathname);

  const routes = (
    <RouteErrorBoundary key={location.pathname}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/github/callback" element={<GitHubOAuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/developers/api" element={<DeveloperApi />} />

        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/exercises" element={<Navigate to="/workouts/exercises" replace />} />
        <Route path="/workouts/routines/:slug" element={<ProtectedRoute><RoutineDetail /></ProtectedRoute>} />
        <Route path="/workouts/*" element={<ProtectedRoute><WorkoutsHub /></ProtectedRoute>} />
        <Route path="/food-log" element={<ProtectedRoute><FoodLogPage /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
        <Route path="/recipes" element={<ProtectedRoute><RecipesPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/data-sources" element={<ProtectedRoute><DataSourcesPage /></ProtectedRoute>} />
        <Route path="/my-plans" element={<ProtectedRoute><MyPlans /></ProtectedRoute>} />
        <Route path="/workout-history" element={<ProtectedRoute><WorkoutHistory /></ProtectedRoute>} />
        <Route path="/workout/session/:planId" element={<ProtectedRoute><WorkoutSession /></ProtectedRoute>} />
        <Route path="/workout/session/exercise/:exerciseId" element={<ProtectedRoute><WorkoutSession /></ProtectedRoute>} />
        <Route path="/workout/session/routine/:routineSlug" element={<ProtectedRoute><WorkoutSession /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
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
