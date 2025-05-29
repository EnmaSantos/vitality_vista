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
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
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

  // --- Added: State for Exercise Details Modal ---
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedExerciseForModal, setSelectedExerciseForModal] = useState<Exercise | null>(null);
  // --- End Added ---

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

  // --- Added: Handlers for Details Modal ---
  const handleOpenDetailsModal = (exercise: Exercise) => {
    setSelectedExerciseForModal(exercise);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedExerciseForModal(null);
  };
  // --- End Added ---

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
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              label="Search Exercises"
              value={searchQuery}
              onChange={(e) => {
                const newQuery = e.target.value;
                console.log('Search input changed:', newQuery);
                setSearchQuery(newQuery);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#606c38ff' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined" disabled={isLoading || !!error}>
              <InputLabel sx={{ color: '#606c38ff' }}>Category</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as string)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
                {availableCategories.map((catName) => (
                  <MenuItem key={catName} value={catName}>
                    {catName.charAt(0).toUpperCase() + catName.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              sx={{
                color: '#606c38ff',
                borderColor: '#606c38ff',
                '&:hover': {
                  borderColor: '#283618ff',
                  backgroundColor: 'rgba(96, 108, 56, 0.05)'
                }
              }}
              fullWidth
            >
              Filter
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Conditional Rendering & Exercise List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress sx={{ color: '#606c38ff' }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>Error: {error}</Alert>
      ) : (
        <>
          <Typography variant="h6" sx={{ color: '#283618ff', mb: 2 }}>
            {filteredExercises.length} Exercises Found
          </Typography>
          <Grid container spacing={2}>
            {currentExercises.map((exercise) => {
              console.log('Rendering exercise:', exercise);
              return (
                <Grid item xs={12} sm={6} md={4} key={exercise.id || exercise.name}>
                  <Card sx={{ borderTop: '3px solid #606c38ff', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div" sx={{ color: '#283618ff' }}>
                        {exercise.name}
                      </Typography>
                      <Typography sx={{ color: '#606c38ff' }} gutterBottom>
                        {exercise.category?.charAt(0).toUpperCase() + (exercise.category?.slice(1) || '')}
                        {exercise.level && ` • ${exercise.level.charAt(0).toUpperCase() + exercise.level.slice(1)}`}
                      </Typography>
                      <Divider sx={{ my: 1, bgcolor: '#dda15eff' }} />
                      <Typography variant="body2" sx={{ color: '#283618ff' }}>
                        <strong>Target:</strong> {exercise.primaryMuscles?.join(', ')}
                      </Typography>
                      {exercise.equipment && (
                        <Typography variant="caption" display="block" sx={{ color: '#606c38ff', mt: 0.5 }}>
                          Equipment: {exercise.equipment}
                        </Typography>
                      )}
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0, mt: 'auto' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenDetailsModal(exercise)}
                        sx={{
                          borderColor: '#606c38ff',
                          color: '#606c38ff',
                          '&:hover': {
                            borderColor: '#283618ff',
                            backgroundColor: 'rgba(96, 108, 56, 0.1)'
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
                            backgroundColor: 'rgba(96, 108, 56, 0.1)'
                          }
                        }}
                      >
                        Add to Workout
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          {filteredExercises.length === 0 && (
            <Paper sx={{ p: 3, textAlign: 'center', mt: 3, borderTop: '3px solid #606c38ff' }}>
              <Typography variant="subtitle1" color="textSecondary">
                No exercises found matching your criteria.
              </Typography>
            </Paper>
          )}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                sx={{
                  '& .MuiPaginationItem-root': { color: '#606c38ff' },
                  '& .Mui-selected': {
                    backgroundColor: 'rgba(96, 108, 56, 0.2) !important',
                    color: '#283618ff'
                  }
                }}
              />
            </Box>
          )}
        </>
      )}

      {/* --- Added: Exercise Details Modal --- */}
      {selectedExerciseForModal && (
        <Dialog open={isDetailsModalOpen} onClose={handleCloseDetailsModal} maxWidth="md" fullWidth scroll="paper">
          <DialogTitle sx={{ backgroundColor: '#606c38ff', color: 'white', m: 0, p: 2 }}>
            {selectedExerciseForModal.name}
            <IconButton
              aria-label="close"
              onClick={handleCloseDetailsModal}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[300]
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ backgroundColor: '#fefae0' }}>
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12} md={selectedExerciseForModal.images && selectedExerciseForModal.images.length > 0 ? 6 : 12}>
                <Typography variant="subtitle1" gutterBottom sx={{ color: '#283618ff' }}>
                  <strong>Category:</strong> {selectedExerciseForModal.category}
                </Typography>
                <Typography variant="body1" gutterBottom sx={{ color: '#283618ff' }}>
                  <strong>Level:</strong> {selectedExerciseForModal.level}
                </Typography>
                {selectedExerciseForModal.force && (
                  <Typography variant="body1" gutterBottom sx={{ color: '#283618ff' }}>
                    <strong>Force:</strong> {selectedExerciseForModal.force}
                  </Typography>
                )}
                {selectedExerciseForModal.mechanic && (
                  <Typography variant="body1" gutterBottom sx={{ color: '#283618ff' }}>
                    <strong>Mechanic:</strong> {selectedExerciseForModal.mechanic}
                  </Typography>
                )}
                {selectedExerciseForModal.equipment && (
                  <Typography variant="body1" gutterBottom sx={{ color: '#283618ff' }}>
                    <strong>Equipment:</strong> {selectedExerciseForModal.equipment}
                  </Typography>
                )}
                
                <Divider sx={{ my: 2, borderColor: '#dda15eff' }} />
                
                <Typography variant="subtitle1" gutterBottom sx={{ color: '#283618ff' }}>
                  <strong>Primary Muscles:</strong>
                </Typography>
                <Typography variant="body2" paragraph sx={{ color: '#606c38ff' }}>
                  {selectedExerciseForModal.primaryMuscles.join(', ')}
                </Typography>
                
                {selectedExerciseForModal.secondaryMuscles && selectedExerciseForModal.secondaryMuscles.length > 0 && (
                  <>
                    <Typography variant="subtitle1" gutterBottom sx={{ color: '#283618ff' }}>
                      <strong>Secondary Muscles:</strong>
                    </Typography>
                    <Typography variant="body2" paragraph sx={{ color: '#606c38ff' }}>
                      {selectedExerciseForModal.secondaryMuscles.join(', ')}
                    </Typography>
                  </>
                )}
              </Grid>
              {selectedExerciseForModal.images && selectedExerciseForModal.images.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {selectedExerciseForModal.images.slice(0, 2).map((imgSrc, index) => (
                      <img 
                        key={index}
                        src={imgSrc.startsWith('http') ? imgSrc : `${process.env.PUBLIC_URL}${imgSrc}`}
                        alt={`${selectedExerciseForModal.name} - view ${index + 1}`} 
                        style={{
                          maxWidth: '100%',
                          height: 'auto',
                          borderRadius: '4px',
                          marginBottom: '10px',
                          border: '1px solid #dda15eff'
                        }} 
                      />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 2, borderColor: '#dda15eff' }} />

            <Typography variant="h6" gutterBottom sx={{ color: '#283618ff' }}>
              Instructions:
            </Typography>
            <List dense sx={{ pl: 2 }}>
              {selectedExerciseForModal.instructions.map((instruction, index) => (
                <ListItem key={index} sx={{ display: 'list-item', listStyleType: 'decimal', pl: 1, color: '#283618ff' }}>
                  <ListItemText primary={instruction} />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions sx={{ backgroundColor: '#fefae0', borderTop: '1px solid #dda15eff', p: '12px 16px' }}>
            <Button 
              onClick={() => {
                console.log("Add to workout clicked for:", selectedExerciseForModal?.name);
                handleCloseDetailsModal();
              }}
              variant="contained"
              sx={{ bgcolor: '#606c38ff', '&:hover': { bgcolor: '#283618ff' } }}
            >
              Add to Workout
            </Button>
            <Button onClick={handleCloseDetailsModal} sx={{ color: '#bc6c25ff' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {/* --- End Added --- */}
    </Box>
  );
};

export default ExercisesPage;