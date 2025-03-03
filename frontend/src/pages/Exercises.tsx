import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useThemeContext, themeColors } from '../context/ThemeContext';

const ExercisesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const { setCurrentThemeColor } = useThemeContext();
  
  useEffect(() => {
    setCurrentThemeColor(themeColors.darkMossGreen);
  }, [setCurrentThemeColor]);

  // Mock exercise data - will be replaced with API data later
  const mockExercises = [
    { id: 1, name: 'Push-ups', category: 'strength', muscles: ['chest', 'triceps'], level: 'beginner' },
    { id: 2, name: 'Squats', category: 'strength', muscles: ['quads', 'glutes'], level: 'beginner' },
    { id: 3, name: 'Plank', category: 'core', muscles: ['abs', 'back'], level: 'beginner' },
    { id: 4, name: 'Jumping Jacks', category: 'cardio', muscles: ['full body'], level: 'beginner' },
  ];

  // Filter exercises based on search and category
  const filteredExercises = mockExercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === 'all' || exercise.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <Box sx={{ padding: 3, backgroundColor: '#edf0e9', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#283618ff' }}>
        Exercise Library
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, color: '#283618ff' }}>
        Browse and discover exercises to add to your routine.
      </Typography>

      {/* Search and Filter Controls */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderLeft: '4px solid #606c38ff' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#606c38ff' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#606c38ff',
                  },
                  '&:hover fieldset': {
                    borderColor: '#283618ff',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#283618ff',
                  },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel sx={{ color: '#606c38ff' }}>Category</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as string)}
                label="Category"
                sx={{
                  color: '#283618ff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#606c38ff',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#283618ff',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#283618ff',
                  },
                }}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="strength">Strength</MenuItem>
                <MenuItem value="cardio">Cardio</MenuItem>
                <MenuItem value="flexibility">Flexibility</MenuItem>
                <MenuItem value="core">Core</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              fullWidth 
              variant="contained" 
              sx={{ 
                height: '56px', 
                bgcolor: '#606c38ff',
                '&:hover': {
                  bgcolor: '#283618ff'
                }
              }}
            >
              Filter
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Exercise List */}
      <Typography variant="h6" gutterBottom sx={{ color: '#283618ff' }}>
        {filteredExercises.length} Exercises Found
      </Typography>
      
      <Grid container spacing={2}>
        {filteredExercises.map((exercise) => (
          <Grid item xs={12} sm={6} md={4} key={exercise.id}>
            <Card sx={{ borderTop: '3px solid #606c38ff' }}>
              <CardContent>
                <Typography variant="h6" component="div" sx={{ color: '#283618ff' }}>
                  {exercise.name}
                </Typography>
                <Typography sx={{ color: '#606c38ff' }} gutterBottom>
                  {exercise.category.charAt(0).toUpperCase() + exercise.category.slice(1)} • {exercise.level.charAt(0).toUpperCase() + exercise.level.slice(1)}
                </Typography>
                <Divider sx={{ my: 1, bgcolor: '#dda15eff' }} />
                <Typography variant="body2" sx={{ color: '#283618ff' }}>
                  <strong>Target muscles:</strong> {exercise.muscles.join(', ')}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button 
                    size="small" 
                    variant="outlined" 
                    sx={{ 
                      borderColor: '#606c38ff', 
                      color: '#606c38ff',
                      '&:hover': {
                        borderColor: '#283618ff',
                        backgroundColor: 'rgba(96, 108, 56, 0.1)',
                      }
                    }}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="small" 
                    variant="text" 
                    sx={{ 
                      ml: 1, 
                      color: '#606c38ff',
                      '&:hover': {
                        backgroundColor: 'rgba(96, 108, 56, 0.1)',
                      }
                    }}
                  >
                    Add to Workout
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty state */}
      {filteredExercises.length === 0 && (
        <Paper 
          sx={{ 
            p: 3, 
            textAlign: 'center',
            bgcolor: '#fefae0ff',
            border: '1px dashed #606c38ff' 
          }}
        >
          <Typography variant="h6" sx={{ color: '#283618ff' }}>No exercises found</Typography>
          <Typography sx={{ color: '#606c38ff' }}>
            Try adjusting your search criteria or clear filters
          </Typography>
        </Paper>
      )}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#606c38ff' }}>
          This page will be connected to the Exercise API to display real exercise data.
        </Typography>
      </Box>
    </Box>
  );
};

export default ExercisesPage;