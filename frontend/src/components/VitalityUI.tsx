import React, { ReactNode } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => (
  <Stack
    component="header"
    direction={{ xs: 'column', sm: 'row' }}
    alignItems={{ xs: 'stretch', sm: 'flex-end' }}
    justifyContent="space-between"
    spacing={2.5}
    sx={{ mb: { xs: 3, md: 4 } }}
  >
    <Box>
      <Typography component="h1" className="vv-page-title">
        {title}
      </Typography>
      {subtitle && (
        <Typography className="vv-page-subtitle" sx={{ mt: 0.75 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {action}
  </Stack>
);

interface AppPanelProps {
  children: ReactNode;
  sx?: object;
}

export const AppPanel: React.FC<AppPanelProps> = ({ children, sx }) => (
  <Paper
    elevation={0}
    className="vv-panel"
    sx={{
      p: { xs: 2, sm: 2.6, md: 3 },
      ...sx,
    }}
  >
    {children}
  </Paper>
);

interface MetricCardProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  progress?: number;
  accent?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  detail,
  progress,
  accent = 'var(--vv-accent)',
}) => (
  <Card elevation={0} className="vv-kpi-card" sx={{ height: '100%' }}>
    <CardContent sx={{ p: { xs: 2.2, sm: 2.5 }, '&:last-child': { pb: { xs: 2.2, sm: 2.5 } } }}>
      <Typography
        sx={{
          color: 'var(--vv-muted)',
          fontSize: '0.72rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <Typography
        component="div"
        sx={{
          color: 'var(--vv-ink)',
          fontSize: 'clamp(1.65rem, 4vw, 2rem)',
          fontWeight: 850,
          lineHeight: 1.1,
          mt: 0.8,
        }}
      >
        {value}
      </Typography>
      {detail && (
        <Typography sx={{ color: accent, fontSize: '0.78rem', fontWeight: 700, mt: 0.5 }}>
          {detail}
        </Typography>
      )}
      {typeof progress === 'number' && (
        <Box
          sx={{
            bgcolor: 'var(--vv-surface-muted)',
            borderRadius: 999,
            height: 9,
            mt: 1.5,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              bgcolor: `linear-gradient(90deg, var(--vv-primary-2), ${accent})`,
              background: `linear-gradient(90deg, var(--vv-primary-2), ${accent})`,
              borderRadius: 999,
              height: '100%',
              transition: 'width 240ms ease',
              width: `${Math.min(Math.max(progress, 0), 100)}%`,
            }}
          />
        </Box>
      )}
    </CardContent>
  </Card>
);

interface MacroBarProps {
  label: string;
  value: string;
  percent: number;
  color?: string;
}

export const MacroBar: React.FC<MacroBarProps> = ({
  label,
  value,
  percent,
  color = 'var(--vv-primary-2)',
}) => (
  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
    <Typography sx={{ flex: '0 0 74px', color: 'var(--vv-muted)', fontSize: '0.82rem', fontWeight: 850 }}>
      {label}
    </Typography>
    <Box sx={{ flex: 1, bgcolor: 'var(--vv-surface-muted)', borderRadius: 999, height: 10, overflow: 'hidden' }}>
      <Box
        sx={{
          bgcolor: color,
          borderRadius: 999,
          height: '100%',
          width: `${Math.min(Math.max(percent, 0), 100)}%`,
        }}
      />
    </Box>
    <Typography sx={{ flex: '0 0 50px', color: 'var(--vv-muted)', fontSize: '0.82rem', fontWeight: 850, textAlign: 'right' }}>
      {value}
    </Typography>
  </Stack>
);

interface EmptyStateProps {
  children: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ children }) => (
  <Paper
    elevation={0}
    sx={{
      border: '1px dashed var(--vv-line-strong)',
      borderRadius: 3,
      bgcolor: 'var(--vv-surface-soft)',
      p: 3,
      textAlign: 'center',
    }}
  >
    <Typography sx={{ color: 'var(--vv-muted)', fontWeight: 600, lineHeight: 1.6 }}>
      {children}
    </Typography>
  </Paper>
);

export const compactPillButtonSx = {
  borderRadius: 999,
  px: 2,
  py: 0.8,
  minHeight: 38,
};

export const ActionButton: React.FC<React.ComponentProps<typeof Button>> = (props) => (
  <Button disableElevation {...props} sx={{ ...compactPillButtonSx, ...(props.sx || {}) }} />
);
