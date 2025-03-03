// frontend/src/components/Navbar.tsx
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
  useTheme
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { useThemeContext, themeColors } from '../context/ThemeContext';

// Navigation items - path and label pairs
const navItems = [
  { path: '/', label: 'Dashboard', color: themeColors.cornsilk },
  { path: '/exercises', label: 'Exercises', color: themeColors.darkMossGreen },
  { path: '/food-log', label: 'Food Log', color: themeColors.earthYellow },
  { path: '/progress', label: 'Progress', color: themeColors.pakistanGreen },
  { path: '/recipes', label: 'Recipes', color: themeColors.tigersEye },
];

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const { currentThemeColor } = useThemeContext();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Active route styling
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Determine text color based on the current theme color
  const getTextColor = (color: string) => {
    // Use darker text when navbar background is light (cornsilk)
    return color === themeColors.cornsilk ? '#283618ff' : '#fefae0ff';
  };

  const textColor = getTextColor(currentThemeColor);

  const drawer = (
    <Box sx={{ width: 250, backgroundColor: '#fefae0ff' }} role="presentation" onClick={handleDrawerToggle}>
      <List>
        {navItems.map((item) => (
          <ListItem 
            button 
            component={Link} 
            to={item.path} 
            key={item.label}
            sx={{ 
              backgroundColor: isActive(item.path) ? 'rgba(188, 108, 37, 0.15)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(188, 108, 37, 0.08)',
              }
            }}
          >
            <ListItemText 
              primary={item.label} 
              primaryTypographyProps={{ 
                fontWeight: isActive(item.path) ? 'bold' : 'normal',
                color: isActive(item.path) ? item.color : '#283618ff'
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: currentThemeColor }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, color: textColor }}
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
              color: textColor, 
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
                    color: textColor, 
                    mx: 1,
                    fontWeight: isActive(item.path) ? 'bold' : 'normal',
                    borderBottom: isActive(item.path) ? `2px solid ${currentThemeColor === themeColors.cornsilk ? '#bc6c25ff' : '#dda15eff'}` : 'none',
                    borderRadius: 0,
                    '&:hover': {
                      backgroundColor: currentThemeColor === themeColors.cornsilk ? 'rgba(188, 108, 37, 0.1)' : 'rgba(221, 161, 94, 0.2)',
                    }
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}
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