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
import { useThemeContext } from '../context/ThemeContext';

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
  const { currentThemeColor } = useThemeContext();

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
    // Simple redirection to landing page
    handleProfileMenuClose();
    navigate('/landing');
  };

  // Active route styling
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation" onClick={handleDrawerToggle}>
      <List>
        {navItems.map((item) => (
          <ListItem 
            button 
            component={Link} 
            to={item.path} 
            key={item.label}
            sx={{ 
              backgroundColor: isActive(item.path) ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              }
            }}
          >
            <ListItemText 
              primary={item.label} 
              primaryTypographyProps={{ 
                fontWeight: isActive(item.path) ? 'bold' : 'normal' 
              }}
            />
          </ListItem>
        ))}
        <Divider sx={{ my: 1 }} />
        <ListItem button onClick={handleLogout}>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="static" 
        sx={{ 
          backgroundColor: currentThemeColor || '#3c6e71',
          transition: 'background-color 0.3s ease'
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
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
              color: 'white', 
              textDecoration: 'none',
              fontWeight: 'bold'
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
                    color: 'white', 
                    mx: 1,
                    fontWeight: isActive(item.path) ? 'bold' : 'normal',
                    borderBottom: isActive(item.path) ? '2px solid white' : 'none',
                    borderRadius: 0,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#1d3e40' }}>
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
            >
              <MenuItem component={Link} to="/profile" onClick={handleProfileMenuClose}>
                My Profile
              </MenuItem>
              <MenuItem component={Link} to="/settings" onClick={handleProfileMenuClose}>
                Settings
              </MenuItem>
              <Divider />
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
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;