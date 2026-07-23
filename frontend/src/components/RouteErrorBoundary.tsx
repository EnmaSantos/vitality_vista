import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';

interface RouteErrorBoundaryProps {
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unable to render this page:', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <Box sx={{ maxWidth: 560, mx: 'auto', px: 3, py: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          This page could not be loaded
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          The app may have been updated while this tab was open. Reload to use the latest version.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reload page
          </Button>
          <Button variant="outlined" onClick={() => window.location.assign('/exercises')}>
            Back to exercises
          </Button>
        </Stack>
      </Box>
    );
  }
}

export default RouteErrorBoundary;
