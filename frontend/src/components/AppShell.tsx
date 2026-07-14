import { CSSProperties, ReactNode, useState } from 'react';
import {
  AccountCircle as AccountCircleIcon,
  FitnessCenter as FitnessCenterIcon,
  Insights as InsightsIcon,
  LocalDining as LocalDiningIcon,
  Logout as LogoutIcon,
  MenuBook as MenuBookIcon,
  MonitorHeart as MonitorHeartIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPageThemeForPath, getThemeVariables, themePalette, usePageTheme } from '../hooks/usePageTheme';

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  {
    path: '/',
    label: 'Home',
    desktopLabel: 'Dashboard',
    icon: <MonitorHeartIcon fontSize="small" />,
    match: ['/', '/dashboard'],
    color: themePalette.dashboard.navColor,
    activeColor: themePalette.dashboard.navActive,
    tint: themePalette.dashboard.navTint,
  },
  {
    path: '/food-log',
    label: 'Food',
    desktopLabel: 'Food log',
    icon: <LocalDiningIcon fontSize="small" />,
    match: ['/food-log'],
    color: themePalette.foodLog.navColor,
    activeColor: themePalette.foodLog.navActive,
    tint: themePalette.foodLog.navTint,
  },
  {
    path: '/exercises',
    label: 'Train',
    desktopLabel: 'Workouts',
    icon: <FitnessCenterIcon fontSize="small" />,
    match: ['/exercises', '/my-plans', '/workout-history', '/workout/session'],
    color: themePalette.workouts.navColor,
    activeColor: themePalette.workouts.navActive,
    tint: themePalette.workouts.navTint,
  },
  {
    path: '/recipes',
    label: 'Recipes',
    desktopLabel: 'Recipes',
    icon: <MenuBookIcon fontSize="small" />,
    match: ['/recipes'],
    color: themePalette.recipes.navColor,
    activeColor: themePalette.recipes.navActive,
    tint: themePalette.recipes.navTint,
  },
  {
    path: '/progress',
    label: 'Progress',
    desktopLabel: 'Progress',
    icon: <InsightsIcon fontSize="small" />,
    match: ['/progress'],
    color: themePalette.progress.navColor,
    activeColor: themePalette.progress.navActive,
    tint: themePalette.progress.navTint,
  },
] as const;

function isNavActive(pathname: string, matches: readonly string[]) {
  return matches.some((match) => (
    match === '/'
      ? pathname === '/' || pathname === '/dashboard'
      : pathname === match || pathname.startsWith(`${match}/`)
  ));
}

function AppShell({ children }: AppShellProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const pageTheme = getPageThemeForPath(location.pathname);

  usePageTheme(pageTheme);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/landing');
  };

  const primaryNavigation = (
    <Stack component="nav" spacing={0.75} aria-label="Primary workspace navigation">
      {navItems.map((item) => {
        const active = isNavActive(location.pathname, item.match);

        return (
          <Box
            key={item.path}
            component={Link}
            to={item.path}
            className={`vv-shell-nav-item${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            style={{
              '--vv-nav-color': item.color,
              '--vv-nav-active': item.activeColor,
              '--vv-nav-tint': item.tint,
            } as CSSProperties}
          >
            <Box className="vv-shell-nav-icon" aria-hidden="true">
              {item.icon}
            </Box>
            <Typography component="span">{item.desktopLabel}</Typography>
          </Box>
        );
      })}
    </Stack>
  );

  return (
    <Box className="vv-app-shell" style={getThemeVariables(pageTheme) as CSSProperties}>
      <Box className="vv-shell-window">
        <Box component="header" className="vv-shell-topbar">
          <Stack direction="row" alignItems="center" spacing={1.25} className="vv-shell-brand">
            <Box className="vv-shell-brand-mark">
              <MonitorHeartIcon fontSize="small" />
            </Box>
            <Typography component={Link} to="/" className="vv-shell-brand-name">
              Vitality Vista
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1} className="vv-shell-context">
            <Box className="vv-shell-context-dot" aria-hidden="true" />
            <Box>
              <Typography className="vv-shell-context-label">Current space</Typography>
              <Typography className="vv-shell-context-name">{pageTheme.name}</Typography>
            </Box>
          </Stack>

          <IconButton
            aria-label="Open account menu"
            aria-controls={anchorEl ? 'vv-account-menu' : undefined}
            aria-expanded={anchorEl ? 'true' : undefined}
            aria-haspopup="menu"
            onClick={(event) => setAnchorEl(event.currentTarget)}
            className="vv-account-button"
          >
            <AccountCircleIcon />
          </IconButton>

          <Menu
            id="vv-account-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{ className: 'vv-menu-paper' }}
          >
            <MenuItem component={Link} to="/profile" onClick={() => setAnchorEl(null)}>
              <SettingsIcon fontSize="small" />
              Profile & settings
            </MenuItem>
            <MenuItem component={Link} to="/profile/data-sources" onClick={() => setAnchorEl(null)}>
              <MonitorHeartIcon fontSize="small" />
              Health data sources
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" />
              Log out
            </MenuItem>
          </Menu>
        </Box>

        <Box className="vv-shell-body">
          <Box component="aside" className="vv-shell-rail">
            <Typography className="vv-shell-rail-title">Health workspace</Typography>
            {primaryNavigation}

            <Box className="vv-shell-rail-note">
              <Typography className="vv-shell-rail-note-kicker">Small steps, daily</Typography>
              <Typography>Log one choice now to make today’s picture clearer.</Typography>
            </Box>
          </Box>

          <Box component="main" className="vv-shell-content" id="main-content">
            {children}
          </Box>
        </Box>
      </Box>

      <Paper component="nav" elevation={0} className="vv-mobile-nav" aria-label="Mobile workspace navigation">
        {navItems.map((item) => {
          const active = isNavActive(location.pathname, item.match);

          return (
            <Box
              key={item.path}
              component={Link}
              to={item.path}
              className={`vv-mobile-nav-item${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              style={{
                '--vv-nav-active': item.activeColor,
                '--vv-nav-tint': item.tint,
              } as CSSProperties}
            >
              <Box className="vv-mobile-nav-icon" aria-hidden="true">{item.icon}</Box>
              <Typography component="span">{item.label}</Typography>
            </Box>
          );
        })}
      </Paper>
    </Box>
  );
}

export default AppShell;
