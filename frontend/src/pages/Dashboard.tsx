import React, { useEffect } from 'react';
import { Typography, Box, Paper, Grid, Card, CardContent } from '@mui/material';
import { useThemeContext, themeColors } from '../context/ThemeContext';

const Dashboard: React.FC = () => {
  const { setCurrentThemeColor } = useThemeContext();
  
  useEffect(() => {
    setCurrentThemeColor(themeColors.cornsilk);
  }, [setCurrentThemeColor]);

  return (
    <Box sx={{ padding: 3, backgroundColor: '#fefae0ff', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#283618ff' }}>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, color: '#606c38ff' }}>
        Welcome to your fitness journey! Here's your daily summary.
      </Typography>

      <Grid container spacing={3}>
        {/* Daily Summary Card */}
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
                    1,200 / 2,000 kcal
                  </Typography>
                </CardContent>
              </Card>
              
              <Card variant="outlined" sx={{ bgcolor: '#fefae0ff', borderColor: '#dda15eff' }}>
                <CardContent>
                  <Typography color="#606c38ff" gutterBottom>
                    Activity
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#283618ff' }}>
                    25 min / 60 min
                  </Typography>
                </CardContent>
              </Card>
              
              <Card variant="outlined" sx={{ bgcolor: '#fefae0ff', borderColor: '#dda15eff' }}>
                <CardContent>
                  <Typography color="#606c38ff" gutterBottom>
                    Water
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#283618ff' }}>
                    4 / 8 glasses
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Paper>
        </Grid>

        {/* Weekly Progress Card */}
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

        {/* Today's Plan Card */}
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
                      Upper Body Strength - 30 min
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
                      Mediterranean Salad with Grilled Chicken
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