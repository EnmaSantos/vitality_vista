import React, { ReactNode, useState } from 'react';
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  FitnessCenter as FitnessCenterIcon,
  Insights as InsightsIcon,
  LocalDining as LocalDiningIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  MonitorHeart as MonitorHeartIcon,
  MenuBook as MenuBookIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: <MonitorHeartIcon fontSize="small" />,
    match: ['/', '/dashboard'],
    color: '#64743a',
    activeColor: '#40512e',
    tint: 'rgba(100, 116, 58, 0.16)',
  },
  {
    path: '/food-log',
    label: 'Food Log',
    icon: <LocalDiningIcon fontSize="small" />,
    match: ['/food-log'],
    color: '#d99a47',
    activeColor: '#7d5529',
    tint: 'rgba(217, 154, 71, 0.18)',
  },
  {
    path: '/exercises',
    label: 'Workouts',
    icon: <FitnessCenterIcon fontSize="small" />,
    match: ['/exercises', '/my-plans', '/workout-history', '/workout/session'],
    color: '#2f461d',
    activeColor: '#2f461d',
    tint: 'rgba(47, 70, 29, 0.14)',
  },
  {
    path: '/recipes',
    label: 'Recipes',
    icon: <MenuBookIcon fontSize="small" />,
    match: ['/recipes'],
    color: '#c66a1e',
    activeColor: '#79400f',
    tint: 'rgba(198, 106, 30, 0.17)',
  },
  {
    path: '/progress',
    label: 'Progress',
    icon: <InsightsIcon fontSize="small" />,
    match: ['/progress'],
    color: '#69754d',
    activeColor: '#4d5932',
    tint: 'rgba(105, 117, 77, 0.17)',
  },
];

const isNavActive = (pathname: string, matches: string[]) => {
  return matches.some((match) => (
    match === '/'
      ? pathname === '/' || pathname === '/dashboard'
      : pathname === match || pathname.startsWith(`${match}/`)
  ));
};

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/landing');
  };

  const rail = (
    <Box className="vv-shell-rail">
      <Typography className="vv-shell-rail-title">Workspace</Typography>
      <Stack component="nav" spacing={0.75} aria-label="Primary workspace navigation">
        {navItems.map((item) => {
          const active = isNavActive(location.pathname, item.match);
          return (
            <Box
              key={item.path}
              component={Link}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`vv-shell-nav-item${active ? ' is-active' : ''}`}
              style={{
                '--vv-nav-color': item.color,
                '--vv-nav-active': item.activeColor,
                '--vv-nav-tint': item.tint,
              } as React.CSSProperties}
            >
              <Box className="vv-shell-nav-icon" aria-hidden="true">
                {item.icon}
              </Box>
              <Typography component="span">{item.label}</Typography>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );

  return (
    <Box className="vv-app-shell">
      <Box className="vv-shell-window">
        <Box className="vv-shell-topbar">
          <Stack direction="row" alignItems="center" spacing={1.25} className="vv-window-dots" aria-hidden="true">
            <Box />
            <Box />
            <Box />
          </Stack>

          {!isDesktop && (
            <IconButton
              aria-label="Open workspace navigation"
              onClick={() => setMobileOpen(true)}
              sx={{ color: 'var(--vv-ink)', mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Stack direction="row" alignItems="center" spacing={1.25} className="vv-shell-brand">
            <Box className="vv-shell-brand-mark">
              <MonitorHeartIcon fontSize="small" />
            </Box>
            <Typography component={Link} to="/" className="vv-shell-brand-name">
              Vitality Vista
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1.5 }} className="vv-shell-actions">
            <Box component={Link} to="/profile" className="vv-shell-action-link">
              Profile
            </Box>
            <Box component={Link} to="/profile" className="vv-shell-action-link">
              Settings
            </Box>
            <Button
              type="button"
              aria-label="Log out"
              onClick={handleLogout}
              startIcon={<LogoutIcon fontSize="small" />}
              className="vv-shell-logout-button"
            >
              <Box component="span" className="vv-shell-logout-label">
                Log out
              </Box>
            </Button>
            <IconButton
              aria-label="Account menu"
              onClick={(event) => setAnchorEl(event.currentTarget)}
              sx={{ color: 'var(--vv-ink)', display: { xs: 'inline-flex', sm: 'none' } }}
            >
              <AccountCircleIcon />
            </IconButton>
          </Stack>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{ className: 'vv-menu-paper' }}
          >
            <MenuItem component={Link} to="/profile" onClick={() => setAnchorEl(null)}>
              <SettingsIcon fontSize="small" style={{ marginRight: 8 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" style={{ marginRight: 8 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>

        <Box className="vv-shell-body">
          {isDesktop && rail}
          <Box component="main" className="vv-shell-content">
            {children}
          </Box>
        </Box>
      </Box>

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ className: 'vv-mobile-drawer' }}
      >
        {rail}
      </Drawer>
    </Box>
  );
};

export default AppShell;
