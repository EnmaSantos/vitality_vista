import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  useMediaQuery,
  useTheme,
  Avatar,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Navigation items - path and label pairs
const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/exercises', label: 'Exercises' },
  { path: '/food-log', label: 'Food Log' },
  { path: '/progress', label: 'Progress' },
  { path: '/recipes', label: 'Recipes' },
];

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/landing');
  };

  // Active route styling
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/dashboard') return true;
    return location.pathname === path;
  };

  const drawer = (
    <Box sx={{ width: 250, bgcolor: 'var(--color-bg)', height: '100%' }} role="presentation" onClick={handleDrawerToggle}>
      <List>
        {navItems.map((item) => (
          <ListItem
            button
            component={Link}
            to={item.path}
            key={item.label}
            sx={{
              backgroundColor: isActive(item.path) ? 'rgba(96, 108, 56, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(96, 108, 56, 0.05)',
              }
            }}
          >
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontWeight: isActive(item.path) ? 'bold' : 'normal',
                color: 'var(--color-primary-dark)'
              }}
            />
          </ListItem>
        ))}
        <Divider sx={{ my: 1, borderColor: 'var(--color-primary)' }} />
        <ListItem button onClick={handleLogout}>
          <ListItemText primary="Logout" primaryTypographyProps={{ color: 'var(--color-primary-dark)' }} />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: 'var(--color-bg)',
          borderBottom: '1px solid rgba(96, 108, 56, 0.2)',
          color: 'var(--color-primary-dark)'
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, color: 'var(--color-primary-dark)' }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              color: 'var(--color-primary-dark)',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontFamily: 'Outfit, sans-serif'
            }}
          >
            Vitality Vista
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex' }}>
              {navItems.map((item) => (
                <Button
                  component={Link}
                  to={item.path}
                  key={item.label}
                  sx={{
                    color: 'var(--color-primary-dark)',
                    mx: 1,
                    fontWeight: isActive(item.path) ? 'bold' : 'normal',
                    borderBottom: isActive(item.path) ? '2px solid var(--color-primary)' : '2px solid transparent',
                    borderRadius: 0,
                    '&:hover': {
                      backgroundColor: 'rgba(96, 108, 56, 0.05)',
                    }
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* User profile menu */}
          <Box sx={{ ml: 2, display: 'flex', gap: 2 }}>
            <IconButton
              edge="end"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              sx={{ color: 'var(--color-primary-dark)' }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'var(--color-primary)' }}>
                <AccountCircleIcon />
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              PaperProps={{
                sx: {
                  bgcolor: 'var(--color-bg)',
                  color: 'var(--color-primary-dark)',
                  border: '1px solid var(--color-primary)',
                }
              }}
            >
              <MenuItem component={Link} to="/profile" onClick={handleProfileMenuClose}>
                My Profile
              </MenuItem>

              <Divider sx={{ borderColor: 'rgba(96, 108, 56, 0.2)' }} />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250, bgcolor: 'var(--color-bg)' },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;