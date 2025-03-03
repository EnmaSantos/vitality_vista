// frontend/src/pages/Exercises.tsx
import React, { useState } from 'react';
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

const ExercisesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');

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
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Exercise Library
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4 }}>
        Browse and discover exercises to add to your routine.
      </Typography>

      {/* Search and Filter Controls */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
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
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as string)}
                label="Category"
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
              color="primary"
              sx={{ height: '56px' }}
            >
              Filter
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Exercise List */}
      <Typography variant="h6" gutterBottom>
        {filteredExercises.length} Exercises Found
      </Typography>
      
      <Grid container spacing={2}>
        {filteredExercises.map((exercise) => (
          <Grid item xs={12} sm={6} md={4} key={exercise.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  {exercise.name}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {exercise.category.charAt(0).toUpperCase() + exercise.category.slice(1)} • {exercise.level.charAt(0).toUpperCase() + exercise.level.slice(1)}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2">
                  <strong>Target muscles:</strong> {exercise.muscles.join(', ')}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button size="small" variant="outlined" color="primary">
                    View Details
                  </Button>
                  <Button size="small" variant="text" color="primary" sx={{ ml: 1 }}>
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
            bgcolor: '#f5f5f5',
            border: '1px dashed #ccc' 
          }}
        >
          <Typography variant="h6">No exercises found</Typography>
          <Typography color="textSecondary">
            Try adjusting your search criteria or clear filters
          </Typography>
        </Paper>
      )}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          This page will be connected to the Exercise API to display real exercise data.
        </Typography>
      </Box>
    </Box>
  );
};

export default ExercisesPage;