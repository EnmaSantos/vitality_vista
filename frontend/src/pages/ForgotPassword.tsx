import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  Link,
  Alert
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Password reset requested for:', email);
    // In a real app, you would trigger a password reset here
    setSubmitted(true);
  };

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
          maxWidth: 450,
          borderRadius: 2
        }}
      >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#3c6e71' }}>
            Reset Password
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Enter your email to receive a password reset link
          </Typography>
        </Box>

        {submitted ? (
          <Box sx={{ mb: 3 }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              If an account exists with the email {email}, we've sent instructions to reset your password.
            </Alert>
            <Button 
              component={RouterLink} 
              to="/login" 
              fullWidth 
              variant="contained"
              sx={{ 
                py: 1.5, 
                bgcolor: '#3c6e71',
                '&:hover': {
                  bgcolor: '#2c5a5c'
                }
              }}
            >
              Return to Login
            </Button>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="email"
                  label="Email Address"
                  variant="outlined"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </Grid>

              <Grid item xs={12}>
                <Button 
                  type="submit" 
                  fullWidth 
                  variant="contained" 
                  sx={{ 
                    py: 1.5, 
                    bgcolor: '#3c6e71',
                    '&:hover': {
                      bgcolor: '#2c5a5c'
                    }
                  }}
                >
                  Send Reset Link
                </Button>
              </Grid>

              <Grid item xs={12} sx={{ textAlign: 'center' }}>
                <Typography variant="body2">
                  Remember your password?{' '}
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
                  >
                    Back to Login
                  </Link>
                </Typography>
              </Grid>
            </Grid>
          </form>
        )}
      </Paper>
    </Box>
  );
};

export default ForgotPassword;