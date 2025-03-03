// frontend/src/pages/Dashboard.tsx
import React from 'react';
import { Typography, Box, Paper, Grid, Card, CardContent } from '@mui/material';

const Dashboard: React.FC = () => {
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4 }}>
        Welcome to your fitness journey! Here's your daily summary.
      </Typography>

      <Grid container spacing={3}>
        {/* Daily Summary Card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Daily Summary
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Card variant="outlined" sx={{ bgcolor: '#f5f5f5' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Calories
                  </Typography>
                  <Typography variant="h5">
                    1,200 / 2,000 kcal
                  </Typography>
                </CardContent>
              </Card>
              
              <Card variant="outlined" sx={{ bgcolor: '#f5f5f5' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Activity
                  </Typography>
                  <Typography variant="h5">
                    25 min / 60 min
                  </Typography>
                </CardContent>
              </Card>
              
              <Card variant="outlined" sx={{ bgcolor: '#f5f5f5' }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Water
                  </Typography>
                  <Typography variant="h5">
                    4 / 8 glasses
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Paper>
        </Grid>

        {/* Weekly Progress Card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Weekly Progress
            </Typography>
            <Box sx={{ 
              height: '240px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: '#f5f5f5',
              border: '1px dashed #ccc',
              borderRadius: 1
            }}>
              <Typography color="textSecondary">
                Weekly progress charts will appear here
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Today's Plan Card */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Today's Plan
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Recommended Workout
                    </Typography>
                    <Typography variant="body1">
                      Upper Body Strength - 30 min
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Meal Suggestion
                    </Typography>
                    <Typography variant="body1">
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