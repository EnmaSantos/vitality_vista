// frontend/src/pages/Login.tsx

import React, { useState, useEffect } from 'react'; // <-- Added useEffect
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Link,
  InputAdornment,
  IconButton,
  CircularProgress, // <-- Added for loading indicator
  Alert,            // <-- Added for error display
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext.tsx'; // <-- Import useAuth

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- Added: State for loading and errors ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // --- End Added ---

  // --- Added: Get login function and auth state from context ---
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth(); // Use isLoading from context for initial check
  // --- End Added ---

  const navigate = useNavigate();

  // --- Added: Effect to redirect if already logged in ---
  // Redirect if the user is already authenticated (and the context isn't still loading)
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      console.log('Login Page: User already authenticated, navigating to /dashboard.');
      navigate('/dashboard'); // Adjust target route if needed
    }
  }, [isAuthenticated, isAuthLoading, navigate]); // Dependencies
  // --- End Added ---

  // --- Modified: handleSubmit to call context login ---
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null); // Clear previous errors
    setIsLoading(true); // Set loading state FOR THIS ACTION

    try {
      console.log('Login Page: Attempting login via context...');
      // IMPORTANT: A 405 error (Method Not Allowed) means the HTTP method used for the login request
      // (e.g., GET, POST) is not supported by your backend API endpoint.
      // 1. Check your AuthContext.tsx: The `login` function (called below) makes the actual API call.
      //    Ensure it's using the POST method, which is standard for login.
      // 2. Check your Backend: Ensure the login API route (e.g., /api/auth/login) is configured
      //    to accept POST requests.
      await login(email, password); // <-- Call login function from AuthContext
      console.log('Login Page: Context login reported success.');
      // Navigation happens automatically via the useEffect above when isAuthenticated becomes true
      // Or you could navigate here explicitly: navigate('/dashboard');
    } catch (err) {
      console.error('Login Page: Context login failed:', err);
      // The login function in context re-throws the error
      setError(err instanceof Error ? err.message : 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false); // Reset loading state FOR THIS ACTION
    }
  };
  // --- End Modified ---

  // Don't render the form if the context is still loading its initial state
  // or if the user is already authenticated (and will be redirected shortly)
  if (isAuthLoading || (!isAuthLoading && isAuthenticated)) {
    return (
       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
         <CircularProgress />
       </Box>
    );
  }

  // Render the login form
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px)', // Adjust if needed
        padding: 3,
        backgroundColor: '#f5f7fa'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 4 },
          width: '100%',
          maxWidth: 450,
          borderRadius: 2
        }}
      >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#3c6e71' }}>
            Welcome Back
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Log in to track your fitness journey
          </Typography>
        </Box>

        {/* Display Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="email"
                label="Email Address"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading} // Disable field when submitting
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading} // Disable field when submitting
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={isLoading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  variant="body2"
                  sx={{ color: '#3c6e71' }}
                  tabIndex={isLoading ? -1 : 0}
                >
                  Forgot password?
                </Link>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading} // Disable button when submitting
                sx={{
                  py: 1.5,
                  bgcolor: '#3c6e71',
                  '&:hover': { bgcolor: '#2c5a5c' },
                  position: 'relative'
                }}
              >
                {/* Show spinner when loading */}
                {isLoading ? <CircularProgress size={24} sx={{ color: 'white', position: 'absolute' }}/> : 'Log In'}
              </Button>
            </Grid>

            <Grid item xs={12} sx={{ textAlign: 'center', mt: 1 }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/signup"
                  sx={{
                    fontWeight: 'bold',
                    color: '#3c6e71',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                  tabIndex={isLoading ? -1 : 0}
                >
                  Sign Up
                </Link>
              </Typography>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;