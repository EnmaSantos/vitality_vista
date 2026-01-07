import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography, Box, Paper, Grid, Card, CardContent, CircularProgress, Alert,
  Button, TextField, List, ListItem, ListItemText, ListItemIcon, Checkbox,
  IconButton, Divider, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, UserProfileData } from '../services/profileApi';
import { getDailyCalorieSummaryWithAuth, DailyCalorieSummary } from '../services/calorieApi';
import { getDailyWaterAPI } from '../services/waterApi';
import { getDailyGoalsAPI, addGoalAPI, updateGoalAPI, deleteGoalAPI, DailyGoal } from '../services/goalsApi';

// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => new Date().toISOString().split('T')[0];

import { usePageTheme, themePalette } from '../hooks/usePageTheme';

const Dashboard: React.FC = () => {
  usePageTheme(themePalette.green);
  const auth = useAuth(); // Use the full auth context
  const { token, user } = auth;
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // State for unified calorie data
  const [dailyCalorieSummary, setDailyCalorieSummary] = useState<DailyCalorieSummary | null>(null);
  const [isLoadingCalories, setIsLoadingCalories] = useState(true);
  const [calorieError, setCalorieError] = useState<string | null>(null);

  // State for Water
  const [waterIntake, setWaterIntake] = useState<number>(0);
  const [isLoadingWater, setIsLoadingWater] = useState<boolean>(true);

  // State for Daily Planner
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [isLoadingGoals, setIsLoadingGoals] = useState<boolean>(true);



  const fetchDashboardProfile = useCallback(async () => {
    if (token) {
      setIsLoadingProfile(true);
      setProfileError(null);
      try {
        console.log("Dashboard: Fetching user profile for TDEE...");
        const userProfileData = await getUserProfile(token);
        setProfile(userProfileData);
        console.log("Dashboard: Profile data fetched:", userProfileData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load profile data for dashboard.";
        setProfileError(errorMessage);
        console.error("Dashboard: Error fetching profile:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    } else {
      setIsLoadingProfile(false);
      console.log("Dashboard: No token available to fetch profile.");
    }
  }, [token]);

  // Fetch daily calorie summary (food + exercise) with fallback
  const fetchDailyCalorieSummary = useCallback(async () => {
    if (auth.token) {
      setIsLoadingCalories(true);
      setCalorieError(null);
      try {
        const todayStr = getTodayDateString();
        console.log(`Dashboard: Fetching daily calorie summary for date: ${todayStr}`);

        try {
          // Try the new unified endpoint first
          const summary = await getDailyCalorieSummaryWithAuth(todayStr, auth);
          setDailyCalorieSummary(summary);
          console.log("Dashboard: Daily calorie summary fetched:", summary);
        } catch (unifiedEndpointError) {
          console.log("Dashboard: Unified endpoint failed, falling back to separate API calls");

          // Fallback to separate API calls for backward compatibility
          const [foodLogModule, workoutLogModule] = await Promise.all([
            import('../services/foodLogApi'),
            import('../services/workoutLogApi')
          ]);

          const userWeight = profile?.weight_kg ? parseFloat(String(profile.weight_kg)) : 70;
          console.log('Dashboard: User weight for calorie calculation:', userWeight, 'from profile weight_kg:', profile?.weight_kg);

          const [foodLogData, workoutSummary] = await Promise.all([
            foodLogModule.getFoodLogEntriesAPI(todayStr, auth),
            workoutLogModule.getTodaysWorkoutSummary(auth.token!, userWeight)
          ]);

          // Calculate totals from separate API calls with proper type conversion
          const totalCaloriesConsumed = foodLogData.reduce((sum, entry) =>
            sum + (parseFloat(String(entry.calories_consumed)) || 0), 0
          );
          const totalProtein = foodLogData.reduce((sum, entry) =>
            sum + (parseFloat(String(entry.protein_consumed)) || 0), 0
          );
          const totalCarbs = foodLogData.reduce((sum, entry) =>
            sum + (parseFloat(String(entry.carbs_consumed)) || 0), 0
          );
          const totalFat = foodLogData.reduce((sum, entry) =>
            sum + (parseFloat(String(entry.fat_consumed)) || 0), 0
          );

          // Get calories burned from workout summary with proper type conversion
          console.log('Dashboard: Workout summary response:', workoutSummary);
          const totalCaloriesBurned = workoutSummary.success ?
            parseFloat(String(workoutSummary.data?.totalCaloriesBurned)) || 0 : 0;
          const exerciseBreakdown = workoutSummary.success && workoutSummary.data ? {
            strength: parseFloat(String(workoutSummary.data.exerciseBreakdown.strength.calories)) || 0,
            cardio: parseFloat(String(workoutSummary.data.exerciseBreakdown.cardio.calories)) || 0,
            stretching: parseFloat(String(workoutSummary.data.exerciseBreakdown.stretching.calories)) || 0
          } : { strength: 0, cardio: 0, stretching: 0 };

          // Calculate net calories ensuring both values are numbers
          const netCalories = totalCaloriesConsumed - totalCaloriesBurned;

          // Create fallback summary structure
          const fallbackSummary = {
            date: todayStr,
            calories_consumed: totalCaloriesConsumed,
            calories_burned: totalCaloriesBurned,
            net_calories: netCalories,
            macros: {
              protein_consumed: totalProtein,
              carbs_consumed: totalCarbs,
              fat_consumed: totalFat
            },
            exercise_breakdown: exerciseBreakdown,
            food_breakdown: {
              breakfast: 0, // These would need more complex calculation
              lunch: 0,
              dinner: 0,
              snack: totalCaloriesConsumed
            }
          };

          setDailyCalorieSummary(fallbackSummary);
          console.log("Dashboard: Fallback calorie summary created:", fallbackSummary);
          console.log("Dashboard: Net calories calculation:", {
            consumed: totalCaloriesConsumed,
            burned: totalCaloriesBurned,
            net: netCalories
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load daily calorie summary.";
        setCalorieError(errorMessage);
        console.error("Dashboard: Error fetching calorie summary:", err);
      } finally {
        setIsLoadingCalories(false);
      }
    } else {
      setIsLoadingCalories(false);
      console.log("Dashboard: No token available to fetch calorie data.");
    }
  }, [auth, profile?.weight_kg]);

  // Fetch Water Data
  const fetchWaterData = useCallback(async () => {
    if (token) {
      setIsLoadingWater(true);
      try {
        const todayStr = getTodayDateString();
        const totalMl = await getDailyWaterAPI(todayStr, auth);
        setWaterIntake(totalMl || 0);
      } catch (error) {
        console.error("Dashboard: Error fetching water:", error);
        setWaterIntake(0);
      } finally {
        setIsLoadingWater(false);
      }
    }
  }, [token, auth]);

  // Planner: Load Goals from API
  const fetchDailyGoals = useCallback(async () => {
    if (token) {
      setIsLoadingGoals(true);
      try {
        const todayStr = getTodayDateString();
        const goals = await getDailyGoalsAPI(todayStr, token);
        setDailyGoals(goals);
      } catch (error) {
        console.error("Dashboard: Error fetching daily goals:", error);
      } finally {
        setIsLoadingGoals(false);
      }
    }
  }, [token]);

  const handleAddGoal = async () => {
    if (!newGoal.trim() || !token) return;
    try {
      const todayStr = getTodayDateString();
      const addedGoal = await addGoalAPI(newGoal, todayStr, token);
      setDailyGoals([...dailyGoals, addedGoal]);
      setNewGoal('');
    } catch (error) {
      console.error("Dashboard: Error adding goal:", error);
    }
  };

  const handleToggleGoal = async (id: number, currentCompleted: boolean) => {
    if (!token) return;
    // Optimistic update
    const originalGoals = [...dailyGoals];
    const updatedGoals = dailyGoals.map(g => g.goal_id === id ? { ...g, completed: !currentCompleted } : g);
    setDailyGoals(updatedGoals);

    try {
      await updateGoalAPI(id, { completed: !currentCompleted }, token);
    } catch (error) {
      console.error("Dashboard: Error toggling goal:", error);
      // Revert on error
      setDailyGoals(originalGoals);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (!token) return;
    // Optimistic update
    const originalGoals = [...dailyGoals];
    const updatedGoals = dailyGoals.filter(g => g.goal_id !== id);
    setDailyGoals(updatedGoals);

    try {
      await deleteGoalAPI(id, token);
    } catch (error) {
      console.error("Dashboard: Error deleting goal:", error);
      // Revert on error
      setDailyGoals(originalGoals);
    }
  };

  useEffect(() => {
    // Initial fetch when component mounts
    fetchDashboardProfile();
    fetchDailyCalorieSummary();
    fetchWaterData();
    fetchDailyGoals();
  }, [fetchDashboardProfile, fetchDailyCalorieSummary, fetchWaterData, fetchDailyGoals]);

  useEffect(() => {
    // Set up an event listener to re-fetch when the user navigates back to the page
    const handleFocus = () => {
      console.log("Dashboard focused, re-fetching data...");
      fetchDashboardProfile();
      fetchDailyCalorieSummary();
      fetchWaterData();
      fetchDailyGoals();
    };

    // 'focus' event is a good proxy for when a user returns to the tab/window
    window.addEventListener('focus', handleFocus);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchDashboardProfile, fetchDailyCalorieSummary, fetchWaterData]); // Dependencies for the initial fetch

  const displayTDEE = profile?.tdee !== null && profile?.tdee !== undefined ? Math.round(profile.tdee) : "N/A";
  const displayConsumed = isLoadingCalories ? "Loading..." : (parseFloat(String(dailyCalorieSummary?.calories_consumed)) || 0);
  const displayBurned = isLoadingCalories ? 0 : (parseFloat(String(dailyCalorieSummary?.calories_burned)) || 0);
  // Ensure net calories calculation uses proper number conversion
  const netCalories = isLoadingCalories ? 0 :
    (parseFloat(String(dailyCalorieSummary?.calories_consumed)) || 0) -
    (parseFloat(String(dailyCalorieSummary?.calories_burned)) || 0);
  const totalWorkoutTime = dailyCalorieSummary ?
    (parseFloat(String(dailyCalorieSummary.exercise_breakdown.strength)) || 0) +
    (parseFloat(String(dailyCalorieSummary.exercise_breakdown.cardio)) || 0) +
    (parseFloat(String(dailyCalorieSummary.exercise_breakdown.stretching)) || 0) : 0;

  return (
    <Box sx={{ padding: { xs: 2, md: 4 }, backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold', fontFamily: 'Outfit, sans-serif' }}>
          Dashboard
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'var(--color-secondary)', mt: 1 }}>
          Welcome to your fitness journey! Here's your daily summary.
        </Typography>
      </Box>

      {/* Display loading or error for profile fetching */}
      {(isLoadingProfile || isLoadingCalories) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
          <CircularProgress sx={{ color: 'var(--color-primary)' }} />
          <Typography sx={{ ml: 2, color: 'var(--color-primary)' }}>Loading dashboard data...</Typography>
        </Box>
      )}
      {profileError && !isLoadingProfile && (
        <Alert severity="error" sx={{ my: 2 }}>
          Could not load profile data: {profileError}
        </Alert>
      )}
      {calorieError && !isLoadingCalories && (
        <Alert severity="warning" sx={{ my: 2 }}>
          Could not load today's calorie data: {calorieError}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 4,
              bgcolor: 'white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ width: 4, height: 24, bgcolor: 'var(--color-secondary)', mr: 2, borderRadius: 2 }} />
              <Typography variant="h5" sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>
                Daily Summary
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Calories Card Main */}
              <Card elevation={0} sx={{ bgcolor: 'var(--color-bg)', borderRadius: 3, border: '1px solid rgba(96, 108, 56, 0.1)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle2" sx={{ color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold' }}>
                      Calories
                    </Typography>
                    <Typography variant="h4" sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>
                      {typeof displayConsumed === 'number'
                        ? Math.round(displayConsumed)
                        : displayConsumed
                      }
                      <Typography component="span" variant="body2" sx={{ color: 'var(--color-primary)', ml: 0.5 }}>kcal</Typography>
                    </Typography>
                  </Box>

                  {/* Progress Bar Visual */}
                  <Box sx={{ mt: 2, mb: 1, height: 8, bgcolor: 'rgba(96, 108, 56, 0.2)', borderRadius: 4, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        width: typeof displayConsumed === 'number' && displayTDEE !== "N/A"
                          ? `${Math.min((displayConsumed / Number(displayTDEE)) * 100, 100)}%`
                          : '0%',
                        height: '100%',
                        bgcolor: 'var(--color-secondary)',
                        transition: 'width 1s ease-in-out'
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: 'var(--color-primary)' }}>
                      Burned: {typeof displayBurned === 'number' ? Math.round(displayBurned) : 0}
                    </Typography>
                    {displayTDEE !== "N/A" && typeof displayConsumed === 'number' && (
                      <Typography variant="caption" sx={{ color: 'var(--color-primary)' }}>
                        Goal: {displayTDEE}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* Macros Row */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                {[
                  { label: 'Protein', value: dailyCalorieSummary?.macros.protein_consumed, color: '#606c38' },
                  { label: 'Carbs', value: dailyCalorieSummary?.macros.carbs_consumed, color: '#dda15e' },
                  { label: 'Fat', value: dailyCalorieSummary?.macros.fat_consumed, color: '#bc6c25' }
                ].map((macro) => (
                  <Card key={macro.label} elevation={0} sx={{ flex: 1, bgcolor: 'white', borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="caption" sx={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{macro.label}</Typography>
                      <Typography variant="h6" sx={{ color: 'var(--color-primary-dark)', mt: 0.5 }}>
                        {isLoadingCalories ? "-" : Math.round(parseFloat(String(macro.value)) || 0)}g
                      </Typography>
                      <Box sx={{ mt: 1, height: 4, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <Box sx={{ width: '60%', height: '100%', bgcolor: macro.color, borderRadius: 2 }} />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Water Card */}
              <Card elevation={0} sx={{ bgcolor: '#dcfce7', borderRadius: 3, border: 'none' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#166534', fontWeight: 'bold' }}>Water Intake</Typography>
                    <Typography variant="h5" sx={{ color: '#14532d', fontWeight: 'bold' }}>
                      {isLoadingWater ? "..." : waterIntake} <Typography component="span" variant="body2">/ 2500 ml</Typography>
                    </Typography>
                  </Box>
                  <LocalDrinkIcon sx={{ fontSize: 40, color: '#15803d', opacity: 0.8 }} />
                </CardContent>
              </Card>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 4,
              bgcolor: 'white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ width: 4, height: 24, bgcolor: 'var(--color-secondary)', mr: 2, borderRadius: 2 }} />
              <Typography variant="h5" sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>
                Workout Breakdown
              </Typography>
            </Box>

            {isLoadingCalories ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress sx={{ color: 'var(--color-primary)' }} />
              </Box>
            ) : dailyCalorieSummary && dailyCalorieSummary.calories_burned > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Card elevation={0} sx={{ bgcolor: '#f0fdf4', borderRadius: 3, border: '1px solid #bbf7d0' }}>
                  <CardContent sx={{ py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ p: 1, bgcolor: '#dcfce7', borderRadius: '50%', mr: 2 }}>
                        <Typography variant="h6">💪</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#166534', fontWeight: 'bold' }}>Strength Training</Typography>
                        <Typography variant="caption" sx={{ color: '#15803d' }}>Heavy lifting & resistance</Typography>
                      </Box>
                    </Box>
                    <Typography variant="h6" sx={{ color: '#14532d', fontWeight: 'bold' }}>
                      {Math.round(dailyCalorieSummary.exercise_breakdown.strength)}
                      <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>cal</Typography>
                    </Typography>
                  </CardContent>
                </Card>

                <Card elevation={0} sx={{ bgcolor: '#f0f9ff', borderRadius: 3, border: '1px solid #bae6fd' }}>
                  <CardContent sx={{ py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ p: 1, bgcolor: '#e0f2fe', borderRadius: '50%', mr: 2 }}>
                        <Typography variant="h6">🏃</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#0369a1', fontWeight: 'bold' }}>Cardio</Typography>
                        <Typography variant="caption" sx={{ color: '#0284c7' }}>Running, cycling, etc.</Typography>
                      </Box>
                    </Box>
                    <Typography variant="h6" sx={{ color: '#0c4a6e', fontWeight: 'bold' }}>
                      {Math.round(dailyCalorieSummary.exercise_breakdown.cardio)}
                      <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>cal</Typography>
                    </Typography>
                  </CardContent>
                </Card>

                <Card elevation={0} sx={{ bgcolor: '#fffbeb', borderRadius: 3, border: '1px solid #fde68a' }}>
                  <CardContent sx={{ py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ p: 1, bgcolor: '#fef3c7', borderRadius: '50%', mr: 2 }}>
                        <Typography variant="h6">🧘</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#b45309', fontWeight: 'bold' }}>Stretching</Typography>
                        <Typography variant="caption" sx={{ color: '#d97706' }}>Yoga & flexibility</Typography>
                      </Box>
                    </Box>
                    <Typography variant="h6" sx={{ color: '#78350f', fontWeight: 'bold' }}>
                      {Math.round(dailyCalorieSummary.exercise_breakdown.stretching)}
                      <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>cal</Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ) : (
              <Box sx={{
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'var(--color-bg)',
                border: '2px dashed var(--color-accent)',
                borderRadius: 3,
                p: 3,
                textAlign: 'center'
              }}>
                <Typography sx={{ color: 'var(--color-primary)' }}>
                  No workouts completed today. <br />Start exercising to see your activity breakdown!
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: 'white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ width: 4, height: 24, bgcolor: 'var(--color-secondary)', mr: 2, borderRadius: 2 }} />
              <Typography variant="h5" sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>
                Daily Planner
              </Typography>
            </Box>

            <Grid container spacing={4}>
              {/* Left Side: Quick Actions */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>Quick Actions</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { label: 'Log Food', icon: <RestaurantIcon />, action: () => navigate('/food-log') },
                    { label: 'Find Workout', icon: <FitnessCenterIcon />, action: () => navigate('/exercises') },
                    { label: 'Log Water', icon: <LocalDrinkIcon />, action: () => navigate('/food-log') }
                  ].map((action) => (
                    <Button
                      key={action.label}
                      variant="outlined"
                      startIcon={action.icon}
                      onClick={action.action}
                      sx={{
                        justifyContent: 'flex-start',
                        color: 'var(--color-primary-dark)',
                        borderColor: 'rgba(96, 108, 56, 0.3)',
                        borderRadius: 2,
                        py: 1.5,
                        '&:hover': {
                          borderColor: 'var(--color-primary)',
                          bgcolor: 'rgba(96, 108, 56, 0.05)'
                        }
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Box>
              </Grid>

              {/* Right Side: Daily Goals */}
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>Daily Goals</Typography>

                <Box sx={{ display: 'flex', mb: 3 }}>
                  <TextField
                    size="small"
                    placeholder="Add a goal for today..."
                    fullWidth
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'var(--color-bg)',
                        borderRadius: '8px 0 0 8px',
                        '& fieldset': { borderColor: 'rgba(96, 108, 56, 0.3)' },
                        '&:hover fieldset': { borderColor: 'var(--color-primary)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--color-primary)' }
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddGoal}
                    disableElevation
                    sx={{
                      ml: -1,
                      bgcolor: 'var(--color-primary)',
                      borderRadius: '0 8px 8px 0',
                      px: 3,
                      textTransform: 'none',
                      fontWeight: 'bold',
                      zIndex: 1,
                      '&:hover': { bgcolor: 'var(--color-primary-dark)' }
                    }}
                  >
                    Add
                  </Button>
                </Box>

                <List dense sx={{ bgcolor: 'rgba(96, 108, 56, 0.03)', borderRadius: 3, p: 1 }}>
                  {dailyGoals.length === 0 && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: 'var(--color-secondary)', fontStyle: 'italic' }}>
                        No goals set for today. Add one to get started!
                      </Typography>
                    </Box>
                  )}
                  {dailyGoals.map((goal) => (
                    <ListItem
                      key={goal.goal_id}
                      secondaryAction={
                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteGoal(goal.goal_id)} size="small">
                          <DeleteIcon fontSize="small" sx={{ color: '#ef4444', opacity: 0.7, '&:hover': { opacity: 1 } }} />
                        </IconButton>
                      }
                      disablePadding
                      sx={{
                        px: 2,
                        py: 0.5,
                        mb: 1,
                        bgcolor: 'white',
                        borderRadius: 2,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s',
                        '&:hover': { boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Checkbox
                          edge="start"
                          checked={goal.completed}
                          onChange={() => handleToggleGoal(goal.goal_id, goal.completed)}
                          icon={<RadioButtonUncheckedIcon />}
                          checkedIcon={<CheckCircleOutlineIcon />}
                          sx={{
                            color: 'var(--color-primary)',
                            '&.Mui-checked': { color: 'var(--color-primary)' }
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={goal.text}
                        primaryTypographyProps={{
                          sx: {
                            textDecoration: goal.completed ? 'line-through' : 'none',
                            color: goal.completed ? 'text.disabled' : 'var(--color-primary-dark)',
                            fontWeight: goal.completed ? 'normal' : '500'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;