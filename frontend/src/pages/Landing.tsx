import React from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Stack,
  Typography
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import InsightsIcon from '@mui/icons-material/Insights';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';

const navItems = [
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Screenshots', href: '#screenshots' },
  { label: 'Support', href: '#support' }
];

const capabilityStats = [
  { value: '5', label: 'connected workspaces' },
  { value: '4', label: 'food lookup modes' },
  { value: '1', label: 'daily health dashboard' }
];

const capabilities = [
  {
    icon: <MonitorHeartIcon />,
    eyebrow: 'Daily dashboard',
    title: 'Start with the day in front of you',
    description:
      'The dashboard brings calorie balance, burned calories, hydration, TDEE, and daily goals into one place so the next action is obvious.',
    image: '/screenshots/dashboard.png',
    alt: 'Vitality Vista dashboard screenshot showing calories, water, goals, and TDEE balance.',
    bullets: ['Net calorie summary', 'Water intake progress', 'Daily goal checklist']
  },
  {
    icon: <LocalDiningIcon />,
    eyebrow: 'Food and hydration',
    title: 'Log nutrition without bouncing between tools',
    description:
      'Food Log supports normal search, barcode lookup, manual entries, official food images, category metadata, macro totals, and quick water logging.',
    image: '/screenshots/food.png',
    alt: 'Vitality Vista food log screenshot showing food search results, macros, logged meals, and water tracking.',
    bullets: ['Food search and serving details', 'Barcode lookup and manual entries', 'Allergen and dietary metadata']
  },
  {
    icon: <FitnessCenterIcon />,
    eyebrow: 'Workout planning',
    title: 'Build plans and turn them into sessions',
    description:
      'Create workout plans from the exercise library, edit sets and reps, start a planned session, or log individual movements into workout history.',
    image: '/screenshots/workouts.png',
    alt: 'Vitality Vista workout plan screenshot showing a strength plan, exercise rows, session preview, and history controls.',
    bullets: ['Reusable workout plans', 'Sets, reps, weight, rest, and notes', 'Session logging and workout history']
  },
  {
    icon: <MenuBookIcon />,
    eyebrow: 'Recipe discovery',
    title: 'Find meals that fit the routine',
    description:
      'Recipe search helps users browse meal ideas, inspect ingredients, compare categories, and review nutrition details before adding food choices.',
    image: '/screenshots/recipes.png',
    alt: 'Vitality Vista recipes screenshot showing recipe discovery, ingredients, nutrition details, and category filters.',
    bullets: ['Recipe search and categories', 'Ingredient and instruction review', 'Nutrition per serving']
  },
  {
    icon: <InsightsIcon />,
    eyebrow: 'Progress analytics',
    title: 'See whether the habits are working',
    description:
      'Progress tracking rolls body metrics, calorie trends, workout frequency, goals, and exercise performance into charts with flexible time ranges.',
    image: '/screenshots/progress.png',
    alt: 'Vitality Vista progress screenshot showing weight, body fat, calories, workout frequency, and trend charts.',
    bullets: ['Weight and body composition charts', 'Nutrition and macro trends', 'Workout consistency summaries']
  }
];

const Landing: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f7faf7',
        color: '#1f2a24',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflowX: 'hidden'
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
                  flex: '0 0 auto',
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
              <Typography
                component="p"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1rem', sm: '1.05rem' },
                  whiteSpace: 'nowrap'
                }}
              >
                Vitality Vista
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
                  minWidth: { xs: 96, sm: 128 },
                  px: { xs: 1.5, sm: 2 },
                  py: 1,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#243f2e',
                    boxShadow: 'none'
                  }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Get started
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Start
                </Box>
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Box
        component="section"
        sx={{
          minHeight: { xs: 530, md: 560 },
          display: 'flex',
          alignItems: 'center',
          backgroundImage:
            'linear-gradient(90deg, rgba(18, 30, 22, 0.94) 0%, rgba(18, 30, 22, 0.82) 42%, rgba(18, 30, 22, 0.18) 100%), url("/screenshots/dashboard.png")',
          backgroundPosition: { xs: '62% center', md: 'center right' },
          backgroundSize: 'cover'
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 670, py: { xs: 8, md: 10 } }}>
            <Chip
              label="Real app workflows, from meals to metrics"
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
                fontSize: { xs: '2.85rem', sm: '4rem', md: '5rem' },
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: 0,
                mb: 2
              }}
            >
              Vitality Vista
            </Typography>
            <Typography
              sx={{
                color: '#eef7f0',
                fontSize: { xs: '1.05rem', md: '1.25rem' },
                lineHeight: 1.7,
                maxWidth: 610,
                mb: 4
              }}
            >
              A practical health companion for planning workouts, logging food and water,
              finding recipes, and tracking progress from a single dashboard.
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
                href="#screenshots"
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
                View screenshots
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Box component="section" id="capabilities" sx={{ scrollMarginTop: 96, py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={6}>
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
                Built around the health work users actually repeat
              </Typography>
              <Typography sx={{ color: '#53635a', fontSize: '1rem', lineHeight: 1.7 }}>
                The app is organized around everyday loops: check the dashboard,
                pick a workout, log food and water, browse recipes, then review progress.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Grid container spacing={1.5}>
                {capabilityStats.map((stat) => (
                  <Grid item xs={12} sm={4} key={stat.label}>
                    <Box
                      sx={{
                        height: '100%',
                        border: '1px solid #d9e5dc',
                        borderRadius: 2,
                        bgcolor: '#ffffff',
                        p: 2.5
                      }}
                    >
                      <Typography sx={{ color: '#31533d', fontSize: '2rem', fontWeight: 900 }}>
                        {stat.value}
                      </Typography>
                      <Typography sx={{ color: '#5c6b62', fontWeight: 800, lineHeight: 1.4 }}>
                        {stat.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box
        component="section"
        id="screenshots"
        sx={{
          scrollMarginTop: 96,
          bgcolor: '#ffffff',
          borderTop: '1px solid #dce7df',
          borderBottom: '1px solid #dce7df'
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
          <Stack spacing={{ xs: 5, md: 7 }}>
            {capabilities.map((capability, index) => (
              <Box
                component="article"
                key={capability.title}
                sx={{
                  borderTop: index === 0 ? 'none' : '1px solid #e3ece6',
                  pt: index === 0 ? 0 : { xs: 5, md: 7 }
                }}
              >
                <Grid container spacing={{ xs: 3, md: 5 }} alignItems="center">
                  <Grid
                    item
                    xs={12}
                    md={5}
                    sx={{ order: { xs: 1, md: index % 2 === 0 ? 1 : 2 } }}
                  >
                    <Stack spacing={2.25}>
                      <Stack direction="row" alignItems="center" spacing={1.25}>
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            display: 'grid',
                            placeItems: 'center',
                            borderRadius: 2,
                            bgcolor: '#e7f4ec',
                            color: '#31533d'
                          }}
                          aria-hidden="true"
                        >
                          {capability.icon}
                        </Box>
                        <Typography
                          sx={{
                            color: '#b45f2a',
                            fontSize: '0.82rem',
                            fontWeight: 900,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase'
                          }}
                        >
                          {capability.eyebrow}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="h2"
                        sx={{
                          color: '#19271f',
                          fontSize: { xs: '1.75rem', md: '2.35rem' },
                          fontWeight: 900,
                          lineHeight: 1.12,
                          letterSpacing: 0
                        }}
                      >
                        {capability.title}
                      </Typography>
                      <Typography sx={{ color: '#53635a', fontSize: '1rem', lineHeight: 1.7 }}>
                        {capability.description}
                      </Typography>
                      <Box
                        component="ul"
                        sx={{
                          display: 'grid',
                          gap: 1,
                          listStyle: 'none',
                          m: 0,
                          p: 0
                        }}
                      >
                        {capability.bullets.map((bullet) => (
                          <Box
                            component="li"
                            key={bullet}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              color: '#2d4033',
                              fontWeight: 800
                            }}
                          >
                            <CheckCircleOutlineIcon sx={{ color: '#8fb08f', fontSize: 18 }} />
                            {bullet}
                          </Box>
                        ))}
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    md={7}
                    sx={{ order: { xs: 2, md: index % 2 === 0 ? 2 : 1 } }}
                  >
                    <Box
                      component="img"
                      src={capability.image}
                      alt={capability.alt}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      sx={{
                        display: 'block',
                        width: '100%',
                        border: '1px solid #d8e3d7',
                        borderRadius: 2,
                        boxShadow: '0 22px 58px rgba(31, 42, 36, 0.14)'
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      <Box
        component="section"
        id="support"
        sx={{
          scrollMarginTop: 96,
          bgcolor: '#e9f5ef',
          borderBottom: '1px solid #d2e4d9'
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 5, md: 6 } }}>
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
        </Container>
      </Box>

      <Box component="footer" sx={{ borderTop: '1px solid #dce7df', py: 4 }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Typography sx={{ color: '#53635a', fontSize: '0.95rem' }}>
              (c) 2026 Vitality Vista
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
