import React, { useState, useEffect } from 'react';
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
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    weight: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const { register, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      console.log('Signup Page: User already authenticated, navigating to /dashboard.');
      navigate('/dashboard');
    }
  }, [isAuthenticated, isAuthLoading, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setSubmitError("Passwords don't match.");
      return;
    }
    if (!agreeToTerms) {
      setSubmitError("You must agree to the terms of service and privacy policy.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      console.log('Signup Page: Attempting registration via context...');
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        weight: parseFloat(formData.weight),
      });
      console.log('Signup Page: Context registration reported success (auto-login).');
    } catch (err) {
      console.error('Signup Page: Context registration failed:', err);
      setSubmitError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || (!isAuthLoading && isAuthenticated)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px)',
        padding: 3,
        backgroundColor: '#f5f7fa'
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          width: '100%', 
          maxWidth: 550,
          borderRadius: 2
        }}
      >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#3c6e71' }}>
            Create Your Account
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Join Vitality Vista and start your fitness journey
          </Typography>
        </Box>

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="firstName"
                name="firstName"
                label="First Name"
                variant="outlined"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="lastName"
                name="lastName"
                label="Last Name"
                variant="outlined"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="weight"
                name="weight"
                label="Weight (kg)"
                variant="outlined"
                type="number"
                value={formData.weight}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                variant="outlined"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                disabled={isSubmitting}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="password"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
                helperText={
                  formData.password !== formData.confirmPassword && formData.confirmPassword !== '' 
                    ? "Passwords don't match" 
                    : ''
                }
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={agreeToTerms} 
                    onChange={() => setAgreeToTerms(!agreeToTerms)}
                    color="primary"
                    required
                    disabled={isSubmitting}
                  />
                }
                label={
                  <Typography variant="body2">
                    I agree to the{' '}
                    <Link 
                      component={RouterLink} 
                      to="/terms" 
                      sx={{ color: '#3c6e71' }}
                      tabIndex={isSubmitting ? -1 : 0}
                    >
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link 
                      component={RouterLink} 
                      to="/privacy" 
                      sx={{ color: '#3c6e71' }}
                      tabIndex={isSubmitting ? -1 : 0}
                    >
                      Privacy Policy
                    </Link>
                  </Typography>
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Button 
                type="submit" 
                fullWidth 
                variant="contained" 
                disabled={!agreeToTerms || formData.password !== formData.confirmPassword || isSubmitting}
                sx={{ 
                  py: 1.5, 
                  bgcolor: '#3c6e71',
                  '&:hover': {
                    bgcolor: '#2c5a5c'
                  },
                  position: 'relative'
                }}
              >
                {isSubmitting ? <CircularProgress size={24} sx={{ color: 'white', position: 'absolute' }} /> : 'Sign Up'}
              </Button>
            </Grid>

            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link 
                  component={RouterLink} 
                  to="/login"
                  sx={{ 
                    fontWeight: 'bold',
                    color: '#3c6e71',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                  tabIndex={isSubmitting ? -1 : 0}
                >
                  Log In
                </Link>
              </Typography>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default Signup;