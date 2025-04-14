// frontend/src/pages/ExercisesPage.tsx (With Dynamic Categories - Client-Side)

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
  CircularProgress,
  Alert,
  Pagination
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useThemeContext, themeColors } from '../context/ThemeContext';
import { getAllExercises, searchExercisesByName, Exercise } from '../services/exerciseApi';

const ITEMS_PER_PAGE = 9;

const ExercisesPage: React.FC = () => {
  console.log('--- ExercisesPage Component Rendered ---'); // <-- ADD THIS LINE

  // --- State Variables ---
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all'); // 'all' is still the default value
  const { setCurrentThemeColor } = useThemeContext();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]); // <-- State for dynamic categories (NEW)

  // --- Effects ---
  useEffect(() => {
    setCurrentThemeColor(themeColors.darkMossGreen);
  }, [setCurrentThemeColor]);

  // Effect for fetching exercises data (MODIFIED for Search)
  useEffect(() => {
    console.log(`Effect triggered. Current searchQuery: "${searchQuery}"`); // <-- ADD THIS LOG

    const fetchExercises = async () => {
      setIsLoading(true);
      setError(null);
      // Don't reset page here, handle it in the separate effect based on query/category changing
      // setCurrentPage(1);
      setAvailableCategories([]); // Keep clearing categories on new fetch

      try {
        let data: Exercise[];
        if (searchQuery.trim() !== '') {
          // If there is a search query, use the search API
          console.log(`Fetching search results for: ${searchQuery}`);
          data = await searchExercisesByName(searchQuery);
        } else {
          // Otherwise, fetch all (or potentially fetch based on category if desired later)
          console.log('Fetching all exercises (no search query)');
          data = await getAllExercises();
        }

        console.log('API Result Data:', data); // <-- ADD THIS LOG
        setExercises(data); // Store fetched/searched data

        // Extract Unique Categories (Only run if data was fetched successfully)
        if (data && data.length > 0) {
          const allCategories = data.map(ex => ex.category).filter(Boolean) as string[];
          const uniqueCategories = Array.from(new Set(allCategories)).sort();
          // If searching, we might only want to show categories from the *search results*
          // or keep the full list - let's keep the full list for now when searchQuery is empty
          if (searchQuery.trim() === '') {
            setAvailableCategories(uniqueCategories);
          }
          // If searching, maybe don't update availableCategories, or update based on results?
          // For simplicity now, let's only update categories when fetching all.
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load exercises';
        setError(errorMessage);
        console.error("Error fetching exercises:", err);
      } finally {
        setIsLoading(false);
      }
    };

    // Optional: Add debouncing here later if needed to avoid API calls on every keystroke
    fetchExercises();

  }, [searchQuery]); // Re-run effect when searchQuery changes
  // Note: We removed category from dependencies here to simplify; fetching all then filtering by category client-side first might be okay.
  // Or, ideally, the backend API should support filtering by *both* search and category simultaneously.
  // --- Filtering Logic (MODIFIED) ---
  // Apply only category filtering client-side now
  const filteredExercises = exercises.filter(exercise => {
    const matchesCategory = category === 'all' || exercise.category === category;
    return matchesCategory;
  });
  // The search filtering is handled by the API call in useEffect when searchQuery is not empty

  // --- Pagination Calculations ---
  const totalPages = Math.ceil(filteredExercises.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentExercises = filteredExercises.slice(indexOfFirstItem, indexOfLastItem);

  // --- Event Handlers ---
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
      setCurrentPage(1);
  }, [searchQuery, category]);

  // --- Log before Render ---
  console.log('Filtered Exercises Count:', filteredExercises.length); // <-- ADD THIS LOG
  console.log('Current Page Exercises:', currentExercises); // <-- ADD THIS LOG

  // --- Render Logic ---
  return (
    <Box sx={{ padding: 3, backgroundColor: '#edf0e9', minHeight: '100vh' }}>
      {/* ... (Title Typography remains the same) ... */}
       <Typography variant="h4" gutterBottom sx={{ color: '#283618ff' }}> Exercise Library </Typography>
       <Typography variant="subtitle1" sx={{ mb: 4, color: '#283618ff' }}> Browse and discover exercises to add to your routine. </Typography>


      {/* Search and Filter Controls */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderLeft: '4px solid #606c38ff' }}>
         <Grid container spacing={2} alignItems="center">
           {/* TextField for Search (Keep as is) */}
           <Grid item xs={12} md={6}>
             <TextField
               fullWidth
               variant="outlined"
               label="Search Exercises"
               value={searchQuery}
               onChange={(e) => {
                 const newQuery = e.target.value;
                 console.log('Search input changed:', newQuery); // <-- ADD THIS LOG
                 setSearchQuery(newQuery);
               }}
               InputProps={{
                 startAdornment: (
                   <InputAdornment position="start">
                     <SearchIcon sx={{ color: '#606c38ff' }} />
                   </InputAdornment>
                 ),
                 sx: { /* Your existing sx props */ }
               }}
               sx={{ /* Your existing sx props */ }}
             />
           </Grid>

           {/* Select for Category (Modified options) */}
           <Grid item xs={12} md={4}>
             <FormControl fullWidth variant="outlined" disabled={isLoading || !!error}> {/* Disable while loading/error */}
               <InputLabel sx={{ color: '#606c38ff' }}>Category</InputLabel>
               <Select
                 value={category}
                 onChange={(e) => setCategory((e.target as HTMLSelectElement).value)}
                 label="Category"
                 sx={{ /* Your existing sx props */ }}
               >
                 {/* Static 'All' option */}
                 <MenuItem value="all">All Categories</MenuItem>
                 {/* Dynamic options from state (NEW) */}
                 {availableCategories.map((catName) => (
                   <MenuItem key={catName} value={catName}>
                     {/* Capitalize for display */}
                     {catName.charAt(0).toUpperCase() + catName.slice(1)}
                   </MenuItem>
                 ))}
               </Select>
             </FormControl>
           </Grid>
           {/* Filter Button (Keep as is, maybe repurpose/remove later) */}
           <Grid item xs={12} md={2}> <Button /* ... */ > Filter </Button> </Grid>
         </Grid>
      </Paper>

      {/* --- Conditional Rendering & Exercise List --- */}
      {/* ... (Loading, Error, Exercise Grid, Pagination remain the same as previous step) ... */}      {isLoading ? ( <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}> <CircularProgress sx={{ color: '#606c38ff' }} /> </Box>
       ) : error ? ( <Alert severity="error" sx={{ mt: 2 }}>Error: {error}</Alert>
       ) : ( <> <Typography variant="h6" /* ... */ > {filteredExercises.length} Exercises Found </Typography>               
          <Grid container spacing={2}>
            {currentExercises.map((exercise) => {
              console.log('Rendering exercise:', exercise); // Keep this log              // Now using the original Card component
              return (
                <Grid item xs={12} sm={6} md={4} key={exercise.id}>
                  <Card sx={{ borderTop: '3px solid #606c38ff' }}>
                    <CardContent>
                      <Typography variant="h6" component="div" sx={{ color: '#283618ff' }}>
                        {exercise.name}
                      </Typography>
                      <Typography sx={{ color: '#606c38ff' }} gutterBottom>
                        {exercise.category?.charAt(0).toUpperCase() + exercise.category?.slice(1)} • {exercise.level?.charAt(0).toUpperCase() + exercise.level?.slice(1)}
                      </Typography>
                      <Divider sx={{ my: 1, bgcolor: '#dda15eff' }} />
                      <Typography variant="body2" sx={{ color: '#283618ff' }}>
                        <strong>Target muscles:</strong> {exercise.primaryMuscles?.join(', ')}
                      </Typography>
                      {exercise.images && exercise.images.length > 0 && (
                         <Box sx={{ mt: 2, textAlign: 'center' }}>
                          <img src={exercise.images[0]} alt={exercise.name} style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }} />
                         </Box>
                      )}
                      <Box sx={{ mt: 2 }}>
                        <Button size="small" variant="outlined" sx={{ borderColor: '#606c38ff', color: '#606c38ff', '&:hover': { borderColor: '#283618ff', backgroundColor: 'rgba(96, 108, 56, 0.1)' } }}>
                          View Details
                        </Button>
                        <Button size="small" variant="text" sx={{ ml: 1, color: '#606c38ff', '&:hover': { backgroundColor: 'rgba(96, 108, 56, 0.1)' } }}>
                          Add to Workout
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );

            })}
          </Grid>
               {filteredExercises.length === 0 && ( <Paper sx={{ /* ... */ }} > {/* ... No exercises found message ... */} </Paper> )}
               {totalPages > 1 && ( <Box sx={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}> <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} /* ... sx props ... */ /> </Box> )}
           </>
       )}
    </Box>
  );
};

export default ExercisesPage;