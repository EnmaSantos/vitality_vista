import React from 'react';
import { Typography, Box, Button, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Landing: React.FC = () => {
  return (
    <Box
      className="h-screen w-full relative flex items-center justify-center"
      sx={{
        overflow: 'hidden', // Add this to prevent scrolling
        position: 'fixed', // Add this to fix the page in place
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        "&::before": {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url("/assets/images/background-1.jpg")',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(0.2em) brightness(0.7)',
          transform: 'scale(1.02)', // Using transform instead of scale for better browser support
          zIndex: 1
        }
      }}
    >
      <Container maxWidth="md" className="text-center z-10">
        <Typography 
          variant="h1" 
          component="h1" 
          sx={{ 
            fontSize: { xs: '3rem', md: '4.5rem' }, 
            fontWeight: 'bold',
            color: 'white',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            mb: 2
          }}
        >
          Vitality Vista
        </Typography>
        
        <Typography 
          variant="h4" 
          component="h2" 
          sx={{ 
            fontSize: { xs: '1.5rem', md: '2rem' },
            color: 'white',
            textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
            mb: 6 
          }}
        >
          Where Your Health Journey Begins
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
          <Button 
            component={RouterLink} 
            to="/login" 
            variant="contained" 
            size="large"
            sx={{ 
              bgcolor: '#3c6e71', 
              px: 4, 
              py: 1.5,
              fontSize: '1.1rem',
              '&:hover': {
                bgcolor: '#2c5a5c'
              }
            }}
          >
            Log In
          </Button>
          
          <Button 
            component={RouterLink} 
            to="/signup" 
            variant="outlined" 
            size="large"
            sx={{ 
              borderColor: 'white', 
              color: 'white', 
              px: 4, 
              py: 1.5,
              fontSize: '1.1rem',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Sign Up
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Landing;