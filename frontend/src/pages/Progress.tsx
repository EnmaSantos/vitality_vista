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
  Button
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useThemeContext, themeColors } from '../context/ThemeContext';

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
  
  useEffect(() => {
    setCurrentThemeColor(themeColors.pakistanGreen);
  }, [setCurrentThemeColor]);

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

  // Placeholder data for Weight Trend chart
  const weightTrendData = {
    labels: [], // Will be populated with dates
    datasets: [
      {
        label: 'Weight (lbs)',
        data: [], // Will be populated with weight values
        borderColor: themeColors.pakistanGreen, 
        backgroundColor: `${themeColors.pakistanGreen}66`, // Added alpha for ~40% transparency
        tension: 0.1,
      },
    ],
  };

  return (
    <Box sx={{ padding: 3, backgroundColor: '#edf0e4', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#283618ff' }}>
        Progress Tracking
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, color: '#606c38ff' }}>
        Track your fitness journey and see your improvements over time.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Metrics Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderTop: '4px solid #283618ff' }}>
            <CardContent>
              <Typography color="#606c38ff" gutterBottom>
                Current Weight
              </Typography>
              <Typography variant="h4" component="div" sx={{ color: '#283618ff' }}>
                N/A 
              </Typography>
              <Typography color="primary" variant="body2" sx={{ color: '#606c38ff' }}>
                Loading...
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderTop: '4px solid #283618ff' }}>
            <CardContent>
              <Typography color="#606c38ff" gutterBottom>
                Body Fat %
              </Typography>
              <Typography variant="h4" component="div" sx={{ color: '#283618ff' }}>
                N/A
              </Typography>
              <Typography color="primary" variant="body2" sx={{ color: '#606c38ff' }}>
                Loading...
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderTop: '4px solid #283618ff' }}>
            <CardContent>
              <Typography color="#606c38ff" gutterBottom>
                Avg. Daily Calories
              </Typography>
              <Typography variant="h4" component="div" sx={{ color: '#283618ff' }}>
                N/A
              </Typography>
              <Typography color="primary" variant="body2" sx={{ color: '#606c38ff' }}>
                Loading...
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderTop: '4px solid #283618ff' }}>
            <CardContent>
              <Typography color="#606c38ff" gutterBottom>
                Workout Frequency
              </Typography>
              <Typography variant="h4" component="div" sx={{ color: '#283618ff' }}>
                N/A
              </Typography>
              <Typography color="primary" variant="body2" sx={{ color: '#606c38ff' }}>
                Loading...
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
          </Tabs>
        </Box>

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={handleTimeRangeChange}
              label="Time Range"
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
                  data={weightTrendData} 
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
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  border: '1px dashed #ccc'
                }}
              >
                <Typography color="textSecondary">
                  Body fat chart will appear here
                </Typography>
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
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  border: '1px dashed #ccc'
                }}
              >
                <Typography color="textSecondary">
                  Calorie chart will appear here
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Macronutrient Distribution
              </Typography>
              <Paper 
                sx={{ 
                  height: 300, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  border: '1px dashed #ccc'
                }}
              >
                <Typography color="textSecondary">
                  Macronutrient chart will appear here
                </Typography>
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
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  border: '1px dashed #ccc'
                }}
              >
                <Typography color="textSecondary">
                  Workout duration chart will appear here
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Workout Types
              </Typography>
              <Paper 
                sx={{ 
                  height: 300, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  bgcolor: '#f5f5f5',
                  border: '1px dashed #ccc'
                }}
              >
                <Typography color="textSecondary">
                  Workout types chart will appear here
                </Typography>
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
                  Weight Goal: 165 lbs
                </Typography>
                <Box sx={{ 
                  width: '100%', 
                  height: 20, 
                  bgcolor: '#e0e0e0',
                  borderRadius: 5,
                  mb: 2
                }}>
                  <Box sx={{ 
                    width: '50%', 
                    height: '100%', 
                    bgcolor: 'primary.main',
                    borderRadius: 5
                  }}/>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  8 lbs to go! (50% complete)
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
      </Paper>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          In the future, this page will display actual progress data from your tracking.
        </Typography>
      </Box>
    </Box>
  );
};

export default ProgressPage;