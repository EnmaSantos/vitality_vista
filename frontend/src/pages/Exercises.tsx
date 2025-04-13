// frontend/src/pages/ExercisesPage.tsx (Modified)

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
  Divider,
  CircularProgress, // Import loading indicator
  Alert, // Import error display component
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useThemeContext, themeColors } from '../context/ThemeContext';
// Import the API service function and the Exercise type
import { getAllExercises, Exercise } from '../services/exerciseApi';

const ExercisesPage: React.FC = () => {
  // --- State Variables ---
  // Search and filter state (keep these)
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  // State for theme (keep this)
  const { setCurrentThemeColor } = useThemeContext();
  // State for API data, loading, and errors (NEW)
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Effects ---
  // Effect for setting theme color (keep this)
  useEffect(() => {
    setCurrentThemeColor(themeColors.darkMossGreen);
  }, [setCurrentThemeColor]);

  // Effect for fetching exercises data (NEW)
  useEffect(() => {
    const fetchExercises = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAllExercises(); // Call API service
        setExercises(data); // Store fetched data
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load exercises';
        setError(errorMessage);
        console.error("Error fetching exercises:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExercises();
  }, []); // Empty array ensures this runs only once on mount

  // --- Filtering Logic ---
  // Apply filtering to the fetched 'exercises' state
  const filteredExercises = exercises.filter(exercise => {
    // Ensure exercise.name is not null/undefined before calling toLowerCase
    const matchesSearch = exercise.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
    const matchesCategory = category === 'all' || exercise.category === category;
    return matchesSearch && matchesCategory;
  });

  // --- Render Logic ---

  return (
    <Box sx={{ padding: 3, backgroundColor: '#edf0e9', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#283618ff' }}>
        Exercise Library
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, color: '#283618ff' }}>
        Browse and discover exercises to add to your routine.
      </Typography>

      {/* Search and Filter Controls (Keep this section as is) */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderLeft: '4px solid #606c38ff' }}>
        {/* ... (Your existing Grid, TextField, Select, Button for filtering) ... */}
         <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#606c38ff' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ /* Your existing sx props */ }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel sx={{ color: '#606c38ff' }}>Category</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory((e.target as HTMLSelectElement).value)}
                label="Category"
                 sx={{ /* Your existing sx props */ }}
              >
                <MenuItem value="all">All Categories</MenuItem>
                <MenuItem value="strength">Strength</MenuItem>
                <MenuItem value="cardio">Cardio</MenuItem>
                <MenuItem value="flexibility">Flexibility</MenuItem>
                <MenuItem value="core">Core</MenuItem>
                 {/* Maybe add other categories from API later */}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              sx={{ /* Your existing sx props */ }}
            >
              Filter {/* This button might not be needed if filtering is instant */}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* --- Conditional Rendering for Loading/Error/Content (NEW) --- */}
      {isLoading ? (
        // Display a loading indicator (using MUI)
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress sx={{ color: '#606c38ff' }} />
        </Box>
      ) : error ? (
        // Display an error message (using MUI)
        <Alert severity="error" sx={{ mt: 2 }}>Error: {error}</Alert>
      ) : (
        // Display the filtered exercises list if no error and not loading
        <>
          <Typography variant="h6" gutterBottom sx={{ color: '#283618ff' }}>
            {filteredExercises.length} Exercises Found
          </Typography>

          <Grid container spacing={2}>
            {filteredExercises.map((exercise) => (
              <Grid item xs={12} sm={6} md={4} key={exercise.id}>
                {/* Use your existing Card structure */}
                <Card sx={{ borderTop: '3px solid #606c38ff' }}>
                  <CardContent>
                    <Typography variant="h6" component="div" sx={{ color: '#283618ff' }}>
                      {exercise.name}
                    </Typography>
                    <Typography sx={{ color: '#606c38ff' }} gutterBottom>
                      {/* Use data from the actual Exercise type */}
                      {exercise.category?.charAt(0).toUpperCase() + exercise.category?.slice(1)} • {exercise.level?.charAt(0).toUpperCase() + exercise.level?.slice(1)}
                    </Typography>
                    <Divider sx={{ my: 1, bgcolor: '#dda15eff' }} />
                    {/* Adjust field name from 'muscles' to 'primaryMuscles' based on Exercise type */}
                    <Typography variant="body2" sx={{ color: '#283618ff' }}>
                      <strong>Target muscles:</strong> {exercise.primaryMuscles?.join(', ')}
                    </Typography>
                    {/* Optionally display image */}
                     {exercise.images && exercise.images.length > 0 && (
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                         <img src={exercise.images[0]} alt={exercise.name} style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }} />
                        </Box>
                     )}
                    {/* Keep your action buttons */}
                    <Box sx={{ mt: 2 }}>
                       <Button
                         size="small"
                         variant="outlined"
                         sx={{ /* Your existing sx props */ }}
                       >
                         View Details
                       </Button>
                       <Button
                         size="small"
                         variant="text"
                         sx={{ /* Your existing sx props */ }}
                       >
                         Add to Workout
                       </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Empty state (only shown if not loading, no error, and filtered list is empty) */}
          {filteredExercises.length === 0 && (
            <Paper
              sx={{ /* Your existing sx props */ }}
            >
              <Typography variant="h6" sx={{ color: '#283618ff' }}>No exercises found</Typography>
              <Typography sx={{ color: '#606c38ff' }}>
                Try adjusting your search criteria or clear filters
              </Typography>
            </Paper>
          )}
        </>
      )}
      {/* Remove or comment out the temporary note below if you have one */}
      {/*
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#606c38ff' }}>
          This page will be connected to the Exercise API to display real exercise data.
        </Typography>
      </Box>
      */}
    </Box>
  );
};

export default ExercisesPage;