import { ReactNode } from 'react';
import {
  CheckCircleOutline as CheckCircleOutlineIcon,
  MonitorHeart as MonitorHeartIcon,
} from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
}

const benefits = [
  'Meals, hydration, and activity together',
  'Progress that is easy to understand',
  'A calmer daily health routine',
] as const;

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Stack
      component={Link}
      to="/landing"
      direction="row"
      alignItems="center"
      spacing={1.25}
      className={`vv-auth-brand${compact ? ' is-compact' : ''}`}
    >
      <Box className="vv-auth-brand-mark">
        <MonitorHeartIcon fontSize="small" />
      </Box>
      <Typography component="span">Vitality Vista</Typography>
    </Stack>
  );
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Box className="vv-auth-page">
      <Box component="aside" className="vv-auth-story">
        <Brand />
        <Box className="vv-auth-story-copy">
          <Typography className="vv-auth-eyebrow">Your health, in one clear view</Typography>
          <Typography component="h2">
            Build routines that feel sustainable—not overwhelming.
          </Typography>
          <Typography className="vv-auth-story-description">
            Turn everyday choices into a useful picture of your energy, movement, and progress.
          </Typography>
          <Stack spacing={1.4} className="vv-auth-benefits">
            {benefits.map((benefit) => (
              <Stack key={benefit} direction="row" alignItems="center" spacing={1.2}>
                <CheckCircleOutlineIcon fontSize="small" />
                <Typography>{benefit}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
        <Typography className="vv-auth-story-footer">Private by design · Built for real life</Typography>
      </Box>

      <Box component="section" className="vv-auth-form-side">
        <Box className="vv-auth-mobile-brand">
          <Brand compact />
        </Box>
        {children}
      </Box>
    </Box>
  );
}
