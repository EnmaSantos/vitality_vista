// frontend/src/pages/Progress.tsx
import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useThemeContext, themeColors } from '../context/ThemeContext';
import { getProgressData, getExerciseProgress } from '../services/progressApi';

// Import Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`progress-tabpanel-${index}`}
      aria-labelledby={`progress-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const ProgressPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('week');
  const { setCurrentThemeColor } = useThemeContext();
  const [progressData, setProgressData] = useState<any>(null);
  const [exerciseData, setExerciseData] = useState<any>(null);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentThemeColor(themeColors.pakistanGreen);
    let isMounted = true;

    const fetchData = async () => {
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const response = await getProgressData(token, timeRange);
          if (isMounted) {
            setProgressData(response.data);
          }

          const exerciseResponse = await getExerciseProgress(token);
          if (isMounted) {
            setExerciseData(exerciseResponse.data);
            if (exerciseResponse.data.stats.length > 0) {
              setSelectedExercise(exerciseResponse.data.stats[0].exercise_name);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          setError(errorMessage || 'An unknown error occurred while fetching data.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [timeRange, setCurrentThemeColor]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value as string);
  };

  // Mock data for charts
  const mockChartData = {
    weight: [
      { date: '2023-01-01', value: 180 },
      { date: '2023-01-08', value: 178 },
      { date: '2023-01-15', value: 176 },
      { date: '2023-01-22', value: 175 },
      { date: '2023-01-29', value: 174 },
      { date: '2023-02-05', value: 173 },
    ],
    bodyFat: [
      { date: '2023-01-01', value: 22 },
      { date: '2023-01-15', value: 21.5 },
      { date: '2023-01-29', value: 21 },
      { date: '2023-02-05', value: 20.5 },
    ],
    calories: [
      { date: '2023-02-01', value: 2300 },
      { date: '2023-02-02', value: 2150 },
      { date: '2023-02-03', value: 2400 },
      { date: '2023-02-04', value: 2250 },
      { date: '2023-02-05', value: 2100 },
      { date: '2023-02-06', value: 2350 },
      { date: '2023-02-07', value: 2200 },
    ],
    workouts: [
      { date: '2023-02-01', duration: 45, type: 'Strength' },
      { date: '2023-02-03', duration: 30, type: 'Cardio' },
      { date: '2023-02-05', duration: 50, type: 'Strength' },
      { date: '2023-02-07', duration: 35, type: 'Cardio' },
    ]
  };

  // Chart options (can be customized further)
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Chart Title Placeholder', // Generic placeholder, will be overridden per chart
      },
    },
    scales: {
      x: {
        grid: {
          display: false // Hides X-axis grid lines
        }
      },
      y: {
        grid: {
          color: '#e0e0e0' // Light grey Y-axis grid lines
        }
      }
    }
  };

  return (
    <Box sx={{ padding: 3, backgroundColor: '#edf0e4', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#283618ff' }}>
        Progress Tracking
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, color: '#606c38ff' }}>
        Track your fitness journey and see your improvements over time.
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress size={40} sx={{ color: '#606c38ff' }} />
          <Typography sx={{ mt: 2, color: '#606c38ff' }}>Loading your progress data...</Typography>
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            '& .MuiAlert-icon': { color: '#d32f2f' },
            backgroundColor: '#ffebee',
            border: '1px solid #ffcdd2'
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>Unable to load progress data</Typography>
          {error}
          <Button
            variant="outlined"
            size="small"
            onClick={() => window.location.reload()}
            sx={{ mt: 1, color: '#d32f2f', borderColor: '#d32f2f' }}
          >
            Try Again
          </Button>
        </Alert>
      ) : progressData ? (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Metrics Summary Cards */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                borderTop: '4px solid #283618ff',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                },
                transition: 'all 0.2s ease-in-out'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography color="#606c38ff" gutterBottom sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      ⚖️ Current Weight
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" sx={{ color: '#283618ff', fontWeight: 'bold', mb: 1 }}>
                    {progressData.summary.currentWeight} lbs
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: progressData.summary.weightChange > 0 ? '#f57c00' : progressData.summary.weightChange < 0 ? '#388e3c' : '#606c38ff',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {progressData.summary.weightChange > 0 ? '📈' : progressData.summary.weightChange < 0 ? '📉' : '➡️'}
                    &nbsp;{Math.abs(progressData.summary.weightChange)} lbs since last period
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                borderTop: '4px solid #dda15e',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                },
                transition: 'all 0.2s ease-in-out'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography color="#606c38ff" gutterBottom sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      📊 Body Fat %
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" sx={{ color: '#283618ff', fontWeight: 'bold', mb: 1 }}>
                    {progressData.summary.bodyFatPercentage}%
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: progressData.summary.bodyFatChange > 0 ? '#f57c00' : progressData.summary.bodyFatChange < 0 ? '#388e3c' : '#606c38ff',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {progressData.summary.bodyFatChange > 0 ? '📈' : progressData.summary.bodyFatChange < 0 ? '📉' : '➡️'}
                    &nbsp;{Math.abs(progressData.summary.bodyFatChange)}% since last period
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                borderTop: '4px solid #bc6c25',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                },
                transition: 'all 0.2s ease-in-out'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography color="#606c38ff" gutterBottom sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      🔥 Avg. Daily Calories
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" sx={{ color: '#283618ff', fontWeight: 'bold', mb: 1 }}>
                    {progressData.summary.avgDailyCalories || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#606c38ff', fontWeight: 500 }}>
                    {timeRange === 'week' ? 'Past 7 days' : timeRange === 'month' ? 'Past 30 days' : `Past ${timeRange}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{
                borderTop: '4px solid #606c38',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                },
                transition: 'all 0.2s ease-in-out'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography color="#606c38ff" gutterBottom sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      💪 Workout Frequency
                    </Typography>
                  </Box>
                  <Typography variant="h4" component="div" sx={{ color: '#283618ff', fontWeight: 'bold', mb: 1 }}>
                    {progressData.summary.workoutFrequency || 0} <Typography component="span" variant="h6" sx={{ color: '#606c38ff' }}>times/week</Typography>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#606c38ff', fontWeight: 500 }}>
                    {progressData.summary.workoutFrequency >= 3 ? '🎯 Great consistency!' :
                      progressData.summary.workoutFrequency >= 1 ? '👍 Keep it up!' :
                        '📅 Start tracking workouts'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Progress Charts */}
          <Paper elevation={2} sx={{ mb: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="progress tracking tabs"
                centered
              >
                <Tab label="Body Metrics" />
                <Tab label="Nutrition" />
                <Tab label="Workouts" />
                <Tab label="Goals" />
                <Tab label="Exercise Performance" />
              </Tabs>
            </Box>

            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: '#283618ff', fontWeight: 600 }}>
                📈 Progress Charts
              </Typography>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel sx={{ color: '#606c38ff' }}>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  onChange={handleTimeRangeChange}
                  label="Time Range"
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#606c38ff' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#283618ff' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#283618ff' }
                  }}
                >
                  <MenuItem value="week">Last 7 Days</MenuItem>
                  <MenuItem value="month">Last 30 Days</MenuItem>
                  <MenuItem value="quarter">Last 90 Days</MenuItem>
                  <MenuItem value="year">Last Year</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Weight Trend
                  </Typography>
                  <Paper
                    sx={{
                      height: 300,
                      p: 2, // Added padding for the chart area
                      bgcolor: '#f5f5f5',
                      border: '1px solid #e0e0e0' // Changed from dashed to solid for a cleaner look
                    }}
                  >
                    {/* Specific options for this chart instance, overriding generic title */}
                    <Line
                      options={{
                        ...lineChartOptions,
                        plugins: {
                          ...lineChartOptions.plugins,
                          title: {
                            ...lineChartOptions.plugins.title,
                            text: 'Weight Trend',
                          },
                        },
                      }}
                      data={{
                        labels: progressData.charts.weight.labels,
                        datasets: [
                          {
                            label: 'Weight (lbs)',
                            data: progressData.charts.weight.data,
                            borderColor: themeColors.pakistanGreen,
                            backgroundColor: `${themeColors.pakistanGreen}66`,
                            tension: 0.1,
                          },
                        ],
                      }}
                    />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Body Fat Percentage
                  </Typography>
                  <Paper
                    sx={{
                      height: 300,
                      p: 2, // Added padding for the chart area
                      bgcolor: '#f5f5f5',
                      border: '1px solid #e0e0e0' // Changed from dashed to solid for a cleaner look
                    }}
                  >
                    <Line
                      options={{
                        ...lineChartOptions,
                        plugins: {
                          ...lineChartOptions.plugins,
                          title: {
                            ...lineChartOptions.plugins.title,
                            text: 'Body Fat Percentage',
                          },
                        },
                      }}
                      data={{
                        labels: progressData.charts.bodyFat.labels,
                        datasets: [
                          {
                            label: 'Body Fat (%)',
                            data: progressData.charts.bodyFat.data,
                            borderColor: themeColors.pakistanGreen,
                            backgroundColor: `${themeColors.pakistanGreen}66`,
                            tension: 0.1,
                          },
                        ],
                      }}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Daily Calorie Intake
                  </Typography>
                  <Paper
                    sx={{
                      height: 300,
                      p: 2, // Added padding for the chart area
                      bgcolor: '#f5f5f5',
                      border: '1px solid #e0e0e0' // Changed from dashed to solid for a cleaner look
                    }}
                  >
                    <Line
                      options={{
                        ...lineChartOptions,
                        plugins: {
                          ...lineChartOptions.plugins,
                          title: {
                            ...lineChartOptions.plugins.title,
                            text: 'Daily Calorie Intake',
                          },
                        },
                      }}
                      data={{
                        labels: progressData.charts.calories.labels,
                        datasets: [
                          {
                            label: 'Calories',
                            data: progressData.charts.calories.data,
                            borderColor: themeColors.pakistanGreen,
                            backgroundColor: `${themeColors.pakistanGreen}66`,
                            tension: 0.1,
                          },
                        ],
                      }}
                    />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Macronutrient Distribution
                  </Typography>
                  <Paper
                    sx={{
                      height: 300,
                      p: 2, // Added padding for the chart area
                      bgcolor: '#f5f5f5',
                      border: '1px solid #e0e0e0' // Changed from dashed to solid for a cleaner look
                    }}
                  >
                    <Line
                      options={{
                        ...lineChartOptions,
                        plugins: {
                          ...lineChartOptions.plugins,
                          title: {
                            ...lineChartOptions.plugins.title,
                            text: 'Macronutrient Distribution',
                          },
                        },
                      }}
                      data={{
                        labels: progressData.charts.macros.labels,
                        datasets: [
                          {
                            label: 'Protein (g)',
                            data: progressData.charts.macros.proteinData,
                            borderColor: themeColors.pakistanGreen,
                            backgroundColor: `${themeColors.pakistanGreen}66`,
                            tension: 0.1,
                          },
                          {
                            label: 'Carbs (g)',
                            data: progressData.charts.macros.carbsData,
                            borderColor: themeColors.earthYellow,
                            backgroundColor: `${themeColors.earthYellow}66`,
                            tension: 0.1,
                          },
                          {
                            label: 'Fat (g)',
                            data: progressData.charts.macros.fatData,
                            borderColor: themeColors.tigersEye,
                            backgroundColor: `${themeColors.tigersEye}66`,
                            tension: 0.1,
                          },
                        ],
                      }}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ color: '#283618ff' }}>
                  Workout Progress
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => window.location.href = '/workout-history'}
                  sx={{
                    color: '#606c38ff',
                    borderColor: '#606c38ff',
                    '&:hover': { bgcolor: 'rgba(96,108,56,0.05)' }
                  }}
                >
                  View Detailed History
                </Button>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Workout Duration
                  </Typography>
                  <Paper
                    sx={{
                      height: 300,
                      p: 2, // Added padding for the chart area
                      bgcolor: '#f5f5f5',
                      border: '1px solid #e0e0e0' // Changed from dashed to solid for a cleaner look
                    }}
                  >
                    <Line
                      options={{
                        ...lineChartOptions,
                        plugins: {
                          ...lineChartOptions.plugins,
                          title: {
                            ...lineChartOptions.plugins.title,
                            text: 'Workout Duration',
                          },
                        },
                      }}
                      data={{
                        labels: progressData.charts.workoutDuration.labels,
                        datasets: [
                          {
                            label: 'Duration (min)',
                            data: progressData.charts.workoutDuration.data,
                            borderColor: themeColors.pakistanGreen,
                            backgroundColor: `${themeColors.pakistanGreen}66`,
                            tension: 0.1,
                          },
                        ],
                      }}
                    />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Workout Types
                  </Typography>
                  <Paper
                    sx={{
                      height: 300,
                      p: 2, // Added padding for the chart area
                      bgcolor: '#f5f5f5',
                      border: '1px solid #e0e0e0' // Changed from dashed to solid for a cleaner look
                    }}
                  >
                    <Line
                      options={{
                        ...lineChartOptions,
                        plugins: {
                          ...lineChartOptions.plugins,
                          title: {
                            ...lineChartOptions.plugins.title,
                            text: 'Workout Types',
                          },
                        },
                      }}
                      data={{
                        labels: progressData.charts.workoutTypes.labels,
                        datasets: [
                          {
                            label: 'Strength',
                            data: progressData.charts.workoutTypes.strengthData,
                            borderColor: themeColors.pakistanGreen,
                            backgroundColor: `${themeColors.pakistanGreen}66`,
                            tension: 0.1,
                          },
                          {
                            label: 'Cardio',
                            data: progressData.charts.workoutTypes.cardioData,
                            borderColor: themeColors.earthYellow,
                            backgroundColor: `${themeColors.earthYellow}66`,
                            tension: 0.1,
                          },
                          {
                            label: 'Stretching',
                            data: progressData.charts.workoutTypes.stretchingData,
                            borderColor: themeColors.tigersEye,
                            backgroundColor: `${themeColors.tigersEye}66`,
                            tension: 0.1,
                          },
                        ],
                      }}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Goal Progress
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: '#f5f5f5',
                    }}
                  >
                    <Typography variant="subtitle1" gutterBottom>
                      Weight Goal: {progressData.goals.weight.target} lbs
                    </Typography>
                    <Box sx={{
                      width: '100%',
                      height: 20,
                      bgcolor: '#e0e0e0',
                      borderRadius: 5,
                      mb: 2
                    }}>
                      <Box sx={{
                        width: `${progressData.goals.weight.progress} %`,
                        height: '100%',
                        bgcolor: 'primary.main',
                        borderRadius: 5
                      }} />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {progressData.goals.weight.remaining} lbs to go! ({progressData.goals.weight.progress}% complete)
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Add New Goal
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControl fullWidth variant="outlined">
                          <InputLabel>Goal Type</InputLabel>
                          <Select
                            label="Goal Type"
                            value="weight"
                          >
                            <MenuItem value="weight">Weight</MenuItem>
                            <MenuItem value="bodyfat">Body Fat %</MenuItem>
                            <MenuItem value="exercise">Exercise Frequency</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Target Value</InputLabel>
                          <Select
                            label="Target Value"
                            value="165"
                          >
                            <MenuItem value="165">165 lbs</MenuItem>
                            <MenuItem value="160">160 lbs</MenuItem>
                            <MenuItem value="155">155 lbs</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <Button variant="contained" color="primary" fullWidth>
                          Set New Goal
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">Select Exercise</Typography>
                      <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Exercise</InputLabel>
                        <Select
                          value={selectedExercise}
                          onChange={(e) => setSelectedExercise(e.target.value as string)}
                          label="Exercise"
                        >
                          {exerciseData?.stats.map((stat: any) => (
                            <MenuItem key={stat.exercise_name} value={stat.exercise_name}>
                              {stat.exercise_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    {selectedExercise && exerciseData && (
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={3}>
                          <Card sx={{ bgcolor: '#f5f5f5' }}>
                            <CardContent>
                              <Typography color="textSecondary" gutterBottom>Max Weight (PR)</Typography>
                              <Typography variant="h4">
                                {exerciseData.stats.find((s: any) => s.exercise_name === selectedExercise)?.max_weight || 0} kg
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Card sx={{ bgcolor: '#f5f5f5' }}>
                            <CardContent>
                              <Typography color="textSecondary" gutterBottom>Max Reps</Typography>
                              <Typography variant="h4">
                                {exerciseData.stats.find((s: any) => s.exercise_name === selectedExercise)?.max_reps || 0}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Card sx={{ bgcolor: '#f5f5f5' }}>
                            <CardContent>
                              <Typography color="textSecondary" gutterBottom>Total Sessions</Typography>
                              <Typography variant="h4">
                                {exerciseData.stats.find((s: any) => s.exercise_name === selectedExercise)?.total_sessions || 0}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Card sx={{ bgcolor: '#f5f5f5' }}>
                            <CardContent>
                              <Typography color="textSecondary" gutterBottom>Last Performed</Typography>
                              <Typography variant="h6">
                                {new Date(exerciseData.stats.find((s: any) => s.exercise_name === selectedExercise)?.last_performed).toLocaleDateString()}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Performance History</Typography>
                  <Paper sx={{ height: 400, p: 2 }}>
                    {selectedExercise && exerciseData && exerciseData.history[selectedExercise] ? (
                      <Line
                        options={{
                          ...lineChartOptions,
                          plugins: {
                            ...lineChartOptions.plugins,
                            title: {
                              display: true,
                              text: `${selectedExercise} Progress`,
                            },
                          },
                        }}
                        data={{
                          labels: exerciseData.history[selectedExercise].map((h: any) => new Date(h.date).toLocaleDateString()),
                          datasets: [
                            {
                              label: 'Weight (kg)',
                              data: exerciseData.history[selectedExercise].map((h: any) => h.weight),
                              borderColor: themeColors.pakistanGreen,
                              backgroundColor: `${themeColors.pakistanGreen}66`,
                              tension: 0.1,
                              yAxisID: 'y',
                            },
                            {
                              label: 'Reps',
                              data: exerciseData.history[selectedExercise].map((h: any) => h.reps),
                              borderColor: themeColors.earthYellow,
                              backgroundColor: `${themeColors.earthYellow}66`,
                              tension: 0.1,
                              yAxisID: 'y1',
                            }
                          ],
                        }}
                      />
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography>No history data available for this exercise.</Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </>
      ) : (
        <Box sx={{ mt: 4, textAlign: 'center', py: 8 }}>
          <Typography variant="h5" sx={{ color: '#606c38ff', mb: 2 }}>
            📊 Start Your Fitness Journey!
          </Typography>
          <Typography variant="body1" sx={{ color: '#283618ff', mb: 3, maxWidth: 600, mx: 'auto' }}>
            Track your progress by logging workouts, meals, and body measurements.
            Your data will appear here as beautiful charts and insights.
          </Typography>
          <Grid container spacing={2} sx={{ maxWidth: 500, mx: 'auto' }}>
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                onClick={() => window.location.href = '/exercises'}
                sx={{
                  color: '#606c38ff',
                  borderColor: '#606c38ff',
                  '&:hover': { bgcolor: 'rgba(96,108,56,0.05)' }
                }}
              >
                💪 Log Workouts
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                onClick={() => window.location.href = '/food-log'}
                sx={{
                  color: '#606c38ff',
                  borderColor: '#606c38ff',
                  '&:hover': { bgcolor: 'rgba(96,108,56,0.05)' }
                }}
              >
                🍎 Track Food
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                onClick={() => window.location.href = '/profile'}
                sx={{
                  color: '#606c38ff',
                  borderColor: '#606c38ff',
                  '&:hover': { bgcolor: 'rgba(96,108,56,0.05)' }
                }}
              >
                📏 Body Metrics
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default ProgressPage;