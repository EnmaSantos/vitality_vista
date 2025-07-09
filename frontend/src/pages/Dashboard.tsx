import React, { useEffect, useState, useCallback } from 'react';
import { Typography, Box, Paper, Grid, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import { useThemeContext, themeColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, UserProfileData } from '../services/profileApi';
import { getDailyCalorieSummaryWithAuth, DailyCalorieSummary } from '../services/calorieApi';

// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => new Date().toISOString().split('T')[0];

const Dashboard: React.FC = () => {
  const { setCurrentThemeColor } = useThemeContext();
  const auth = useAuth(); // Use the full auth context
  const { token } = auth;

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // State for unified calorie data
  const [dailyCalorieSummary, setDailyCalorieSummary] = useState<DailyCalorieSummary | null>(null);
  const [isLoadingCalories, setIsLoadingCalories] = useState(true);
  const [calorieError, setCalorieError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentThemeColor(themeColors.cornsilk);
  }, [setCurrentThemeColor]);

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
          
          const [foodLogData, workoutSummary] = await Promise.all([
            foodLogModule.getFoodLogEntriesAPI(todayStr, auth),
            workoutLogModule.getTodaysWorkoutSummary(auth.token!, profile?.weight_kg ? parseFloat(String(profile.weight_kg)) : 70)
          ]);
          
          // Calculate totals from separate API calls
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
          
          // Get calories burned from workout summary
          const totalCaloriesBurned = workoutSummary.success ? (workoutSummary.data?.totalCaloriesBurned || 0) : 0;
          const exerciseBreakdown = workoutSummary.success && workoutSummary.data ? {
            strength: workoutSummary.data.exerciseBreakdown.strength.calories,
            cardio: workoutSummary.data.exerciseBreakdown.cardio.calories,
            stretching: workoutSummary.data.exerciseBreakdown.stretching.calories
          } : { strength: 0, cardio: 0, stretching: 0 };
          
          // Create fallback summary structure
          const fallbackSummary = {
            calories_consumed: totalCaloriesConsumed,
            calories_burned: totalCaloriesBurned,
            net_calories: totalCaloriesConsumed - totalCaloriesBurned,
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
              snacks: totalCaloriesConsumed
            }
          };
          
          setDailyCalorieSummary(fallbackSummary);
          console.log("Dashboard: Fallback calorie summary created:", fallbackSummary);
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

  useEffect(() => {
    // Initial fetch when component mounts
    fetchDashboardProfile();
    fetchDailyCalorieSummary();
  }, [fetchDashboardProfile, fetchDailyCalorieSummary]);

  useEffect(() => {
    // Set up an event listener to re-fetch when the user navigates back to the page
    const handleFocus = () => {
      console.log("Dashboard focused, re-fetching data...");
      fetchDashboardProfile();
      fetchDailyCalorieSummary();
    };

    // 'focus' event is a good proxy for when a user returns to the tab/window
    window.addEventListener('focus', handleFocus);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchDashboardProfile, fetchDailyCalorieSummary]); // Dependencies for the initial fetch

  const displayTDEE = profile?.tdee !== null && profile?.tdee !== undefined ? Math.round(profile.tdee) : "N/A";
  const displayConsumed = isLoadingCalories ? "Loading..." : (dailyCalorieSummary?.calories_consumed || 0);
  const displayBurned = isLoadingCalories ? 0 : (dailyCalorieSummary?.calories_burned || 0);
  const netCalories = isLoadingCalories ? 0 : (dailyCalorieSummary?.net_calories || 0);
  const totalWorkoutTime = dailyCalorieSummary ? 
    (dailyCalorieSummary.exercise_breakdown.strength || 0) +
    (dailyCalorieSummary.exercise_breakdown.cardio || 0) +
    (dailyCalorieSummary.exercise_breakdown.stretching || 0) : 0;

  return (
    <Box sx={{ padding: 3, backgroundColor: '#fefae0ff', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#283618ff' }}>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, color: '#606c38ff' }}>
        Welcome to your fitness journey! Here's your daily summary.
      </Typography>

      {/* Display loading or error for profile fetching */}
      {(isLoadingProfile || isLoadingCalories) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
          <CircularProgress sx={{ color: '#606c38ff' }} />
          <Typography sx={{ ml: 2, color: '#606c38ff' }}>Loading dashboard data...</Typography>
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
          <Paper elevation={2} sx={{ p: 2, height: '100%', borderLeft: '4px solid #606c38ff' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#283618ff' }}>
              Daily Summary
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Card variant="outlined" sx={{ bgcolor: '#fefae0ff', borderColor: '#dda15eff' }}>
                <CardContent>
                  <Typography color="#606c38ff" gutterBottom>
                    Calories
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#283618ff' }}>
                    {typeof displayConsumed === 'number' 
                      ? `${Math.round(displayConsumed)} - ${Math.round(displayBurned)} = ${Math.round(netCalories)}` 
                      : displayConsumed
                    } kcal
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#bc6c25ff' }}>
                    {typeof displayConsumed === 'number' 
                      ? `Consumed - Burned = Net`
                      : 'Loading...'
                    }
                  </Typography>
                  {displayTDEE !== "N/A" && typeof displayConsumed === 'number' && (
                    <Typography variant="caption" display="block" sx={{ color: '#606c38ff' }}>
                      Target: {displayTDEE} kcal {netCalories < displayTDEE ? `(${Math.round(displayTDEE - netCalories)} remaining)` : '(goal met!)'}
                    </Typography>
                  )}
                  {displayTDEE === "N/A" && !isLoadingProfile && (
                     <Typography variant="caption" sx={{ color: '#bc6c25ff' }}>
                       Enter profile details (age, gender, height, weight, activity) to calculate TDEE.
                     </Typography>
                   )}
                </CardContent>
              </Card>
              
              {/* Display other macros */}
              <Card variant="outlined" sx={{ bgcolor: '#fefae0ff', borderColor: '#dda15eff' }}>
                <CardContent>
                  <Typography color="#606c38ff" gutterBottom>Protein</Typography>
                  <Typography variant="h5" sx={{ color: '#283618ff' }}>
                    {isLoadingCalories ? "..." : Math.round(dailyCalorieSummary?.macros.protein_consumed || 0)}g
                  </Typography>
                </CardContent>
              </Card>
              
              <Card variant="outlined" sx={{ bgcolor: '#fefae0ff', borderColor: '#dda15eff' }}>
                <CardContent>
                  <Typography color="#606c38ff" gutterBottom>Carbs</Typography>
                  <Typography variant="h5" sx={{ color: '#283618ff' }}>
                    {isLoadingCalories ? "..." : Math.round(dailyCalorieSummary?.macros.carbs_consumed || 0)}g
                  </Typography>
                </CardContent>
              </Card>
              
              <Card variant="outlined" sx={{ bgcolor: '#fefae0ff', borderColor: '#dda15eff' }}>
                <CardContent>
                  <Typography color="#606c38ff" gutterBottom>Fat</Typography>
                  <Typography variant="h5" sx={{ color: '#283618ff' }}>
                    {isLoadingCalories ? "..." : Math.round(dailyCalorieSummary?.macros.fat_consumed || 0)}g
                  </Typography>
                </CardContent>
              </Card>
              
              {/* Updated Activity Card with real data */}
              <Card variant="outlined" sx={{ bgcolor: '#fefae0ff', borderColor: '#dda15eff' }}>
                <CardContent>
                  <Typography color="#606c38ff" gutterBottom>Today's Activity</Typography>
                  <Typography variant="h5" sx={{ color: '#283618ff' }}>
                    {isLoadingCalories ? "Loading..." : dailyCalorieSummary 
                      ? `${Math.round(totalWorkoutTime)} min • ${Math.round(dailyCalorieSummary.calories_burned)} cal`
                      : "0 min • 0 cal"
                    }
                  </Typography>
                  {dailyCalorieSummary && dailyCalorieSummary.calories_burned > 0 && (
                    <Typography variant="caption" sx={{ color: '#606c38ff' }}>
                      Strength: {Math.round(dailyCalorieSummary.exercise_breakdown.strength)} cal • 
                      Cardio: {Math.round(dailyCalorieSummary.exercise_breakdown.cardio)} cal
                    </Typography>
                  )}
                </CardContent>
              </Card>
              
              <Card variant="outlined" sx={{ bgcolor: '#fefae0ff', borderColor: '#dda15eff' }}>
                <CardContent>
                  <Typography color="#606c38ff" gutterBottom>Water</Typography>
                  <Typography variant="h5" sx={{ color: '#283618ff' }}>-- / -- glasses</Typography>
                </CardContent>
              </Card>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%', borderLeft: '4px solid #606c38ff' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#283618ff' }}>
              Workout Breakdown
            </Typography>
            {isLoadingCalories ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress sx={{ color: '#606c38ff' }} />
              </Box>
            ) : dailyCalorieSummary && dailyCalorieSummary.calories_burned > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Card variant="outlined" sx={{ bgcolor: '#f0f8e8', borderColor: '#94e0b2' }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="subtitle2" color="#283618ff">💪 Strength Training</Typography>
                    <Typography variant="body2" sx={{ color: '#606c38ff' }}>
                      {Math.round(dailyCalorieSummary.exercise_breakdown.strength)} cal burned
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ bgcolor: '#e8f4f8', borderColor: '#7dd3fc' }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="subtitle2" color="#283618ff">🏃 Cardio</Typography>
                    <Typography variant="body2" sx={{ color: '#606c38ff' }}>
                      {Math.round(dailyCalorieSummary.exercise_breakdown.cardio)} cal burned
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ bgcolor: '#f8f4e8', borderColor: '#fbbf24' }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="subtitle2" color="#283618ff">🧘 Stretching</Typography>
                    <Typography variant="body2" sx={{ color: '#606c38ff' }}>
                      {Math.round(dailyCalorieSummary.exercise_breakdown.stretching)} cal burned
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
                bgcolor: '#fefae0ff',
                border: '1px dashed #dda15eff',
                borderRadius: 1
              }}>
                <Typography color="#606c38ff">
                  No workouts completed today. Start exercising to see your activity breakdown!
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2, borderLeft: '4px solid #606c38ff' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#283618ff' }}>
              Today's Plan
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderColor: '#dda15eff' }}>
                  <CardContent>
                    <Typography color="#606c38ff" gutterBottom>
                      Recommended Workout
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#283618ff' }}>
                      Upper Body Strength - 30 min {/* Placeholder */}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderColor: '#dda15eff' }}>
                  <CardContent>
                    <Typography color="#606c38ff" gutterBottom>
                      Meal Suggestion
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#283618ff' }}>
                      Mediterranean Salad with Grilled Chicken {/* Placeholder */}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;