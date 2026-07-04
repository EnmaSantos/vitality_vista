import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  clearStoredGitHubOAuthRequest,
  getStoredGitHubOAuthRequest,
} from '../services/githubOAuth';

const GitHubOAuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const { loginWithGitHub, isLoading: isAuthLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hasHandledCallbackRef = useRef(false);

  useEffect(() => {
    if (isAuthLoading || hasHandledCallbackRef.current) {
      return;
    }

    hasHandledCallbackRef.current = true;

    const completeGitHubLogin = async () => {
      const params = new URLSearchParams(location.search);
      const providerError = params.get('error');

      if (providerError) {
        clearStoredGitHubOAuthRequest();
        setError(params.get('error_description') || 'GitHub login was cancelled.');
        return;
      }

      const code = params.get('code');
      const state = params.get('state');
      const storedRequest = getStoredGitHubOAuthRequest();

      clearStoredGitHubOAuthRequest();

      if (!code || !state) {
        setError('GitHub did not return the information needed to complete login.');
        return;
      }

      if (!storedRequest) {
        setError('GitHub login session expired. Please try again.');
        return;
      }

      if (state !== storedRequest.state) {
        setError('GitHub login state did not match. Please try again.');
        return;
      }

      try {
        await loginWithGitHub({
          code,
          redirectUri: storedRequest.redirectUri,
          codeVerifier: storedRequest.codeVerifier,
        });
        navigate('/dashboard', { replace: true });
      } catch (loginError) {
        setError(loginError instanceof Error ? loginError.message : 'GitHub login failed.');
      }
    };

    completeGitHubLogin();
  }, [isAuthLoading, location.search, loginWithGitHub, navigate]);

  return (
    <Box
      sx={{
        alignItems: 'center',
        backgroundColor: 'var(--color-bg)',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: '1px solid rgba(96, 108, 56, 0.1)',
          borderRadius: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          maxWidth: 440,
          p: { xs: 3, sm: 5 },
          textAlign: 'center',
          width: '100%',
        }}
      >
        {error ? (
          <>
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}>
              {error}
            </Alert>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              sx={{
                bgcolor: 'var(--color-primary)',
                borderRadius: 3,
                fontWeight: 'bold',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'var(--color-primary-dark)',
                },
              }}
            >
              Back to Login
            </Button>
          </>
        ) : (
          <>
            <CircularProgress sx={{ color: 'var(--color-primary)', mb: 3 }} />
            <Typography
              component="h1"
              variant="h5"
              sx={{
                color: 'var(--color-primary-dark)',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 'bold',
              }}
            >
              Completing GitHub Sign In
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default GitHubOAuthCallback;
