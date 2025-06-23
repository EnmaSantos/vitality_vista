import React, { useEffect, useState, useCallback } from 'react';
import { Typography, Box, Paper, Grid, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import { useThemeContext, themeColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, UserProfileData } from '../services/profileApi';
import { getFoodLogsForDate, LoggedFoodEntry } from '../services/foodLogApi';

// Helper to get today's date in YYYY-MM-DD format
const getTodayDateString = () => new Date().toISOString().split('T')[0];

const Dashboard: React.FC = () => {
  const { setCurrentThemeColor } = useThemeContext();
  const { token } = useAuth();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // State for food log data
  const [dailyFoodLogs, setDailyFoodLogs] = useState<LoggedFoodEntry[]>([]);
  const [isLoadingFoodLogs, setIsLoadingFoodLogs] = useState(true);
  const [foodLogError, setFoodLogError] = useState<string | null>(null);
  const [consumedCalories, setConsumedCalories] = useState(0);
  // Add states for other macros
  const [consumedProtein, setConsumedProtein] = useState(0);
  const [consumedCarbs, setConsumedCarbs] = useState(0);
  const [consumedFat, setConsumedFat] = useState(0);

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

  // Fetch food logs for today
  const fetchTodaysFoodLogs = useCallback(async () => {
    if (token) {
      setIsLoadingFoodLogs(true);
      setFoodLogError(null);
      try {
        const todayStr = getTodayDateString();
        console.log(`Dashboard: Fetching food logs for date: ${todayStr}`);
        const logs = await getFoodLogsForDate(todayStr, token);
        setDailyFoodLogs(logs);
        console.log("Dashboard: Today's food logs fetched:", logs);

        // Calculate totals
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        logs.forEach(log => {
          totalCalories += log.calories || 0;
          totalProtein += log.protein || 0;
          totalCarbs += log.carbohydrate || 0;
          totalFat += log.fat || 0;
        });
        setConsumedCalories(totalCalories);
        setConsumedProtein(totalProtein);
        setConsumedCarbs(totalCarbs);
        setConsumedFat(totalFat);

      } catch (err) {
        setFoodLogError(err instanceof Error ? err.message : "Failed to load today's food logs.");
        console.error("Dashboard: Error fetching food logs:", err);
      } finally {
        setIsLoadingFoodLogs(false);
      }
    } else {
      setIsLoadingFoodLogs(false);
      console.log("Dashboard: No token available to fetch food logs.");
    }
  }, [token]);

  useEffect(() => {
    // Initial fetch when component mounts
    fetchDashboardProfile();
    fetchTodaysFoodLogs();

    // Set up an event listener to re-fetch when the user navigates back to the page
    const handleFocus = () => {
      console.log("Dashboard focused, re-fetching data...");
      fetchDashboardProfile();
      fetchTodaysFoodLogs();
    };

    // 'focus' event is a good proxy for when a user returns to the tab/window
    window.addEventListener('focus', handleFocus);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchDashboardProfile, fetchTodaysFoodLogs]); // Dependencies for the initial fetch

  const displayTDEE = profile?.tdee !== null && profile?.tdee !== undefined ? profile.tdee : "N/A";
  const displayConsumed = isLoadingFoodLogs ? "Loading..." : consumedCalories;

  return (
    <Box sx={{ padding: 3, backgroundColor: '#fefae0ff', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#283618ff' }}>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, color: '#606c38ff' }}>
        Welcome to your fitness journey! Here's your daily summary.
      </Typography>

      {/* Display loading or error for profile fetching */}
      {(isLoadingProfile || isLoadingFoodLogs) && (
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
      {foodLogError && !isLoadingFoodLogs && (
        <Alert severity="warning" sx={{ my: 2 }}>
          Could not load today's food logs: {foodLogError}
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
                    {`${displayConsumed} / ${displayTDEE} kcal`}
                  </Typography>
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
                    {isLoadingFoodLogs ? "..." : Math.round(consumedProtein)}g
                  </Typography>
                </CardContent>
              </Card>
              
              <Card variant="outlined" sx={{ bgcolor: '#fefae0ff', borderColor: '#dda15eff' }}>
                <CardContent>
                  <Typography color="#606c38ff" gutterBottom>Carbs</Typography>
                  <Typography variant="h5" sx={{ color: '#283618ff' }}>
                    {isLoadingFoodLogs ? "..." : Math.round(consumedCarbs)}g
                  </Typography>
                </CardContent>
              </Card>
              
              <Card variant="outlined" sx={{ bgcolor: '#fefae0ff', borderColor: '#dda15eff' }}>
                <CardContent>
                  <Typography color="#606c38ff" gutterBottom>Fat</Typography>
                  <Typography variant="h5" sx={{ color: '#283618ff' }}>
                    {isLoadingFoodLogs ? "..." : Math.round(consumedFat)}g
                  </Typography>
                </CardContent>
              </Card>
              
              {/* Placeholders for Activity and Water */}
              <Card variant="outlined" sx={{ bgcolor: '#fefae0ff', borderColor: '#dda15eff' }}>
                <CardContent>
                  <Typography color="#606c38ff" gutterBottom>Activity</Typography>
                  <Typography variant="h5" sx={{ color: '#283618ff' }}>-- / -- min</Typography>
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
              Weekly Progress
            </Typography>
            <Box sx={{
              height: '240px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#fefae0ff',
              border: '1px dashed #dda15eff',
              borderRadius: 1
            }}>
              <Typography color="#606c38ff">
                Weekly progress charts will appear here
              </Typography>
            </Box>
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