import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import InsightsIcon from '@mui/icons-material/Insights';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import WaterDropIcon from '@mui/icons-material/WaterDrop';

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'Services', href: '#services' },
  { label: 'Support', href: '#support' }
];

const featureCards = [
  {
    icon: <FitnessCenterIcon />,
    title: 'Plan workouts',
    description: 'Build routines, track sessions, and keep your exercise history in one place.'
  },
  {
    icon: <LocalDiningIcon />,
    title: 'Log meals',
    description: 'Record food, calories, and nutrition details without jumping between tools.'
  },
  {
    icon: <MenuBookIcon />,
    title: 'Find recipes',
    description: 'Search recipe ideas that make meal planning easier to keep up with.'
  },
  {
    icon: <InsightsIcon />,
    title: 'Watch progress',
    description: 'Review goals, trends, and body metrics so your next step is clear.'
  }
];

const serviceCards = [
  {
    icon: <MonitorHeartIcon />,
    title: 'Dashboard',
    description: 'A daily overview for goals, meals, hydration, and training activity.'
  },
  {
    icon: <FitnessCenterIcon />,
    title: 'Workout tools',
    description: 'Exercise browsing, saved plans, workout sessions, and workout history.'
  },
  {
    icon: <WaterDropIcon />,
    title: 'Wellness tracking',
    description: 'Progress logs and hydration habits designed around ordinary days.'
  }
];

const Landing: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f7faf7',
        color: '#1f2a24',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'rgba(247, 250, 247, 0.94)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #dce7df'
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ minHeight: 72, gap: 2 }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 2,
                  bgcolor: '#31533d',
                  color: '#ffffff'
                }}
                aria-hidden="true"
              >
                <MonitorHeartIcon fontSize="small" />
              </Box>
              <Typography component="p" sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
                vitalitivista
              </Typography>
            </Stack>

            <Stack
              component="nav"
              direction="row"
              alignItems="center"
              spacing={{ xs: 1, sm: 2 }}
              sx={{
                display: { xs: 'none', md: 'flex' },
                '& a': {
                  color: '#355044',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  textDecoration: 'none'
                },
                '& a:hover': {
                  color: '#0f5132'
                }
              }}
              aria-label="Landing page navigation"
            >
              {navItems.map((item) => (
                <Box component="a" href={item.href} key={item.href}>
                  {item.label}
                </Box>
              ))}
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Button
                component={RouterLink}
                to="/login"
                sx={{
                  color: '#31533d',
                  fontWeight: 800,
                  textTransform: 'none',
                  display: { xs: 'none', sm: 'inline-flex' }
                }}
              >
                Sign in
              </Button>
              <Button
                component={RouterLink}
                to="/signup"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  bgcolor: '#31533d',
                  borderRadius: 2,
                  boxShadow: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  px: 2,
                  py: 1,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#243f2e',
                    boxShadow: 'none'
                  }
                }}
              >
                Get started
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Box
        component="section"
        sx={{
          minHeight: { xs: 500, md: 520 },
          display: 'flex',
          alignItems: 'center',
          backgroundImage:
            'linear-gradient(90deg, rgba(21, 35, 27, 0.86) 0%, rgba(21, 35, 27, 0.62) 45%, rgba(21, 35, 27, 0.2) 100%), url("https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1800&q=80")',
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 680, py: { xs: 8, md: 10 } }}>
            <Chip
              label="Fitness, food, hydration, and progress"
              sx={{
                bgcolor: '#d9f2e4',
                color: '#1c4a31',
                fontWeight: 800,
                mb: 2.5
              }}
            />
            <Typography
              variant="h1"
              sx={{
                color: '#ffffff',
                fontSize: { xs: '3rem', sm: '4rem', md: '5rem' },
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: 0,
                mb: 2
              }}
            >
              vitalitivista
            </Typography>
            <Typography
              sx={{
                color: '#eef7f0',
                fontSize: { xs: '1.05rem', md: '1.25rem' },
                lineHeight: 1.7,
                maxWidth: 600,
                mb: 4
              }}
            >
              A practical health companion for planning workouts, logging meals,
              tracking water, saving recipes, and seeing progress without the clutter.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                component={RouterLink}
                to="/signup"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  alignSelf: { xs: 'stretch', sm: 'flex-start' },
                  bgcolor: '#8bd8a8',
                  borderRadius: 2,
                  boxShadow: 'none',
                  color: '#102017',
                  fontWeight: 900,
                  px: 3,
                  py: 1.25,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#79c796',
                    boxShadow: 'none'
                  }
                }}
              >
                Create account
              </Button>
              <Button
                component="a"
                href="#features"
                variant="outlined"
                sx={{
                  alignSelf: { xs: 'stretch', sm: 'flex-start' },
                  borderColor: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: 2,
                  color: '#ffffff',
                  fontWeight: 800,
                  px: 3,
                  py: 1.25,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#ffffff',
                    bgcolor: 'rgba(255, 255, 255, 0.12)'
                  }
                }}
              >
                View features
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Box component="section" id="features" sx={{ scrollMarginTop: 96 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'flex-end' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box sx={{ maxWidth: 680 }}>
              <Typography
                variant="h2"
                sx={{
                  color: '#19271f',
                  fontSize: { xs: '2rem', md: '2.75rem' },
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: 0,
                  mb: 1.5
                }}
              >
                Everything you need for the next healthy choice
              </Typography>
              <Typography sx={{ color: '#53635a', fontSize: '1rem', lineHeight: 1.7 }}>
                Stay focused on daily basics: choose a workout, log meals,
                track hydration, save recipe ideas, and review your progress.
              </Typography>
            </Box>
            <Button
              component={RouterLink}
              to="/signup"
              endIcon={<ArrowForwardIcon />}
              sx={{
                color: '#31533d',
                fontWeight: 900,
                textTransform: 'none'
              }}
            >
              Start tracking
            </Button>
          </Stack>

          <Grid container spacing={2}>
            {featureCards.map((feature) => (
              <Grid item xs={12} sm={6} md={3} key={feature.title}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    border: '1px solid #d9e5dc',
                    borderRadius: 2,
                    bgcolor: '#ffffff'
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 2,
                        bgcolor: '#e7f4ec',
                        color: '#31533d',
                        mb: 2
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography sx={{ fontWeight: 900, mb: 1 }}>{feature.title}</Typography>
                    <Typography sx={{ color: '#5c6b62', fontSize: '0.92rem', lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box component="section" id="services" sx={{ scrollMarginTop: 96, py: { xs: 6, md: 8 } }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={5}>
              <Typography
                variant="h2"
                sx={{
                  color: '#19271f',
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: 0,
                  mb: 2
                }}
              >
                Core tools for steady routines
              </Typography>
              <Typography sx={{ color: '#53635a', lineHeight: 1.7, mb: 3 }}>
                Each area supports a real part of the app, from daily check-ins
                to longer-term workout and nutrition habits.
              </Typography>
              <Button
                component={RouterLink}
                to="/signup"
                variant="contained"
                sx={{
                  bgcolor: '#31533d',
                  borderRadius: 2,
                  boxShadow: 'none',
                  fontWeight: 900,
                  px: 2.5,
                  py: 1.15,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#243f2e',
                    boxShadow: 'none'
                  }
                }}
              >
                Create your account
              </Button>
            </Grid>
            <Grid item xs={12} md={7}>
              <Grid container spacing={2}>
                {serviceCards.map((service) => (
                  <Grid item xs={12} sm={4} key={service.title}>
                    <Card
                      elevation={0}
                      sx={{
                        height: '100%',
                        borderRadius: 2,
                        border: '1px solid #dbe6df',
                        bgcolor: '#ffffff'
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ color: '#b45f2a', mb: 1.5 }}>{service.icon}</Box>
                        <Typography sx={{ fontWeight: 900, mb: 1 }}>{service.title}</Typography>
                        <Typography sx={{ color: '#5c6b62', fontSize: '0.92rem', lineHeight: 1.6 }}>
                          {service.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Box>

        <Box
          component="section"
          id="support"
          sx={{
            scrollMarginTop: 96,
            bgcolor: '#e9f5ef',
            border: '1px solid #d2e4d9',
            borderRadius: 2,
            p: { xs: 3, md: 4 }
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography
                variant="h2"
                sx={{
                  color: '#19271f',
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                  fontWeight: 900,
                  lineHeight: 1.2,
                  letterSpacing: 0,
                  mb: 1
                }}
              >
                Need help or want to report something?
              </Typography>
              <Typography sx={{ color: '#53635a', lineHeight: 1.7 }}>
                For bugs, questions, and feature ideas, open a note in the
                project issue tracker so it can be reviewed and followed up.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack spacing={1.5} alignItems={{ xs: 'stretch', md: 'flex-end' }}>
                <Button
                  component="a"
                  href="https://github.com/EnmaSantos/vitality_vista/issues"
                  target="_blank"
                  rel="noreferrer"
                  variant="contained"
                  sx={{
                    bgcolor: '#b45f2a',
                    borderRadius: 2,
                    boxShadow: 'none',
                    fontWeight: 900,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: '#91491e',
                      boxShadow: 'none'
                    }
                  }}
                >
                  Contact us
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: '#31533d',
                    fontWeight: 900,
                    textTransform: 'none'
                  }}
                >
                  Sign in instead
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>

      <Box component="footer" sx={{ borderTop: '1px solid #dce7df', py: 4 }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Typography sx={{ color: '#53635a', fontSize: '0.95rem' }}>
              (c) 2026 vitalitivista
            </Typography>
            <Stack
              direction="row"
              spacing={2}
              sx={{
                flexWrap: 'wrap',
                rowGap: 1,
                '& a': {
                  color: '#31533d',
                  fontWeight: 800,
                  textDecoration: 'none'
                },
                '& a:hover': {
                  color: '#0f5132'
                }
              }}
            >
              {navItems.map((item) => (
                <Box component="a" href={item.href} key={item.href}>
                  {item.label}
                </Box>
              ))}
              <Box
                component="a"
                href="https://github.com/EnmaSantos/vitality_vista/issues"
                target="_blank"
                rel="noreferrer"
              >
                Contact
              </Box>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;
