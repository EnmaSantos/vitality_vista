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
  ListItemText,
  Stack,
  Snackbar
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon, FitnessCenter as FitnessCenterIcon, Add as AddIcon } from '@mui/icons-material';
import { useThemeContext, themeColors } from '../context/ThemeContext';
import { getAllExercises, searchExercisesByName, Exercise } from '../services/exerciseApi';
import { 
  getUserWorkoutPlans, 
  createWorkoutPlan, 
  addExerciseToWorkoutPlan, 
  WorkoutPlan, 
  CreateWorkoutPlanRequest,
  AddExerciseToPlanRequest 
} from '../services/workoutApi';
import { useAuth } from '../context/AuthContext';

const ITEMS_PER_PAGE = 9;

// Interface for the "Add to Workout" form data
interface AddToWorkoutFormState {
  sets: string; // Keep as string for input, parse on submit
  reps: string;
  weight: string;
  duration: string; // e.g., in minutes
  notes: string;
}

// Interface for new workout plan form
interface NewWorkoutPlanForm {
  name: string;
  description: string;
}

const ExercisesPage: React.FC = () => {
  console.log('--- ExercisesPage Component Rendered ---'); // <-- ADD THIS LINE

  // --- State Variables ---
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all'); // 'all' is still the default value
  const { setCurrentThemeColor } = useThemeContext();
  const { token } = useAuth(); // Get authentication token
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]); // <-- State for dynamic categories (NEW)

  // --- Added: State for Exercise Details Modal ---
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedExerciseForModal, setSelectedExerciseForModal] = useState<Exercise | null>(null);
  // --- End Added ---

  // --- Added: State for "Add to Workout" Modal ---
  const [isAddToWorkoutModalOpen, setIsAddToWorkoutModalOpen] = useState(false);
  const [exerciseToLog, setExerciseToLog] = useState<Exercise | null>(null);
  const [addToWorkoutForm, setAddToWorkoutForm] = useState<AddToWorkoutFormState>({
    sets: '',
    reps: '',
    weight: '',
    duration: '',
    notes: '',
  });

  // Workout plan related state
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | 'new' | ''>('');
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState<NewWorkoutPlanForm>({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Snackbar state for success/error messages
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });
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
    // Delay clearing to allow modal to close gracefully if "Add to workout" was clicked from here
    setTimeout(() => setSelectedExerciseForModal(null), 300);
  };
  // --- End Added ---

  // --- Added: Function to fetch workout plans ---
  const fetchWorkoutPlans = async () => {
    if (!token) return;
    
    setIsLoadingPlans(true);
    try {
      const plans = await getUserWorkoutPlans(token);
      setWorkoutPlans(plans);
    } catch (error) {
      console.error('Error fetching workout plans:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load workout plans',
        severity: 'error'
      });
    } finally {
      setIsLoadingPlans(false);
    }
  };

  // --- Added: Handlers for "Add to Workout" Modal ---
  const handleOpenAddToWorkoutModal = (exercise: Exercise) => {
    setExerciseToLog(exercise); // Store the exercise context
    // Reset form for the new exercise
    setAddToWorkoutForm({ sets: '', reps: '', weight: '', duration: '', notes: '' });
    setSelectedPlanId('');
    setNewPlanForm({ name: '', description: '' });
    setIsAddToWorkoutModalOpen(true);
    if (isDetailsModalOpen) handleCloseDetailsModal(); // Close details if open
    
    // Fetch workout plans when modal opens
    fetchWorkoutPlans();
  };

  const handleCloseAddToWorkoutModal = () => {
    setIsAddToWorkoutModalOpen(false);
    setExerciseToLog(null); // Clear the exercise context
  };

  const handleAddToWorkoutFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setAddToWorkoutForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNewPlanFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setNewPlanForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveWorkoutEntry = async () => {
    if (!token || !exerciseToLog) {
      setSnackbar({
        open: true,
        message: 'Authentication required',
        severity: 'error'
      });
      return;
    }

    setIsSaving(true);
    try {
      let finalPlanId: number;

      // Create new plan if "new" is selected
      if (selectedPlanId === 'new') {
        if (!newPlanForm.name.trim()) {
          setSnackbar({
            open: true,
            message: 'Workout plan name is required',
            severity: 'error'
          });
          setIsSaving(false);
          return;
        }
        
        console.log('Creating new workout plan:', newPlanForm);
        const newPlan = await createWorkoutPlan({
          name: newPlanForm.name.trim(),
          description: newPlanForm.description.trim() || undefined
        }, token);
        
        console.log('New plan created:', newPlan);
        
        if (!newPlan || !newPlan.plan_id) {
          throw new Error('Failed to create workout plan - invalid response');
        }
        
        finalPlanId = newPlan.plan_id;
        // Update the plans list with the new plan
        setWorkoutPlans(prev => [newPlan, ...prev]);
      } else if (typeof selectedPlanId === 'number') {
        finalPlanId = selectedPlanId;
      } else {
        setSnackbar({
          open: true,
          message: 'Please select a workout plan',
          severity: 'error'
        });
        setIsSaving(false);
        return;
      }

      console.log('Using plan ID:', finalPlanId);

      // Prepare exercise data
      const exerciseData: AddExerciseToPlanRequest = {
        exercise_id: exerciseToLog.id,
        exercise_name: exerciseToLog.name,
        sets: addToWorkoutForm.sets ? parseInt(addToWorkoutForm.sets) : undefined,
        reps: addToWorkoutForm.reps || undefined,
        weight_kg: addToWorkoutForm.weight ? parseFloat(addToWorkoutForm.weight) : undefined,
        duration_minutes: addToWorkoutForm.duration ? parseInt(addToWorkoutForm.duration) : undefined,
        notes: addToWorkoutForm.notes || undefined
      };

      console.log('Adding exercise to plan:', exerciseData);

      // Add exercise to plan
      const result = await addExerciseToWorkoutPlan(finalPlanId, exerciseData, token);
      
      console.log("Exercise added to workout plan:", result);
      
      setSnackbar({
        open: true,
        message: `${exerciseToLog.name} added to workout plan successfully!`,
        severity: 'success'
      });
      
      handleCloseAddToWorkoutModal();
      
    } catch (error) {
      console.error('Error saving workout entry:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to add exercise to workout plan',
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
                        <strong>Target:</strong> {exercise.primaryMuscles?.join(', ') || 'N/A'}
                      </Typography>
                      {exercise.equipment && (
                        <Typography variant="caption" display="block" sx={{ color: '#606c38ff', mt: 0.5 }}>
                          Equipment: {exercise.equipment}
                        </Typography>
                      )}
                      {exercise.images && exercise.images.length > 0 && (
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                          <img 
                            src={exercise.images[0].startsWith('http') ? exercise.images[0] : `${process.env.PUBLIC_URL}${exercise.images[0]}`} 
                            alt={exercise.name} 
                            style={{ 
                              maxWidth: '100%', 
                              height: 'auto', 
                              borderRadius: '4px',
                              maxHeight: '120px',
                              objectFit: 'cover'
                            }} 
                          />
                        </Box>
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
                        onClick={() => handleOpenAddToWorkoutModal(exercise)}
                        sx={{ ml: 1, color: '#606c38ff', '&:hover': { backgroundColor: 'rgba(96, 108, 56, 0.1)' } }}
                        startIcon={<FitnessCenterIcon />}
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
                  {selectedExerciseForModal.primaryMuscles?.join(', ') || 'N/A'}
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
              {selectedExerciseForModal.instructions?.map((instruction, index) => (
                <ListItem key={index} sx={{ display: 'list-item', listStyleType: 'decimal', pl: 1, color: '#283618ff' }}>
                  <ListItemText primary={instruction} />
                </ListItem>
              )) || (
                <ListItem sx={{ color: '#283618ff' }}>
                  <ListItemText primary="No instructions available" />
                </ListItem>
              )}
            </List>
          </DialogContent>
          <DialogActions sx={{ backgroundColor: '#fefae0', borderTop: '1px solid #dda15eff', p: '12px 16px' }}>
            <Button 
              onClick={() => selectedExerciseForModal && handleOpenAddToWorkoutModal(selectedExerciseForModal)}
              variant="contained"
              sx={{ bgcolor: '#606c38ff', '&:hover': { bgcolor: '#283618ff' } }}
              startIcon={<FitnessCenterIcon />}
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

      {/* --- Added: "Add to Workout" Modal --- */}
      {exerciseToLog && (
        <Dialog open={isAddToWorkoutModalOpen} onClose={handleCloseAddToWorkoutModal} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#606c38ff', color: 'white' }}>
            Add "{exerciseToLog.name}" to Workout
            <IconButton 
              aria-label="close" 
              onClick={handleCloseAddToWorkoutModal} 
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
            <Stack spacing={2} sx={{ mt: 1 }}>
              {/* Workout Plan Selection */}
              <FormControl fullWidth variant="outlined">
                <InputLabel>Select Workout Plan</InputLabel>
                <Select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value as number | 'new' | '')}
                  label="Select Workout Plan"
                  disabled={isLoadingPlans}
                >
                  <MenuItem value="">
                    <em>Choose a workout plan...</em>
                  </MenuItem>
                  {workoutPlans?.map((plan) => (
                    <MenuItem key={plan.plan_id} value={plan.plan_id}>
                      {plan.name}
                    </MenuItem>
                  ))}
                  <MenuItem value="new">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AddIcon sx={{ mr: 1 }} />
                      Create New Plan
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              {/* New Plan Form (shown when "new" is selected) */}
              {selectedPlanId === 'new' && (
                <>
                  <TextField 
                    label="New Plan Name" 
                    name="name"
                    value={newPlanForm.name} 
                    onChange={handleNewPlanFormChange} 
                    variant="outlined" 
                    fullWidth 
                    required
                  />
                  <TextField 
                    label="Plan Description (optional)" 
                    name="description"
                    value={newPlanForm.description} 
                    onChange={handleNewPlanFormChange} 
                    variant="outlined" 
                    fullWidth 
                    multiline 
                    rows={2} 
                  />
                </>
              )}

              <Divider />

              {/* Exercise Details */}
              <Typography variant="subtitle2" sx={{ color: '#283618ff', fontWeight: 'bold' }}>
                Exercise Details:
              </Typography>
              <TextField 
                label="Sets" 
                name="sets" 
                type="number" 
                value={addToWorkoutForm.sets} 
                onChange={handleAddToWorkoutFormChange} 
                variant="outlined" 
                fullWidth 
                InputProps={{ inputProps: { min: 0 } }} 
              />
              <TextField 
                label="Reps (e.g., 8-12, AMRAP)" 
                name="reps" 
                value={addToWorkoutForm.reps} 
                onChange={handleAddToWorkoutFormChange} 
                variant="outlined" 
                fullWidth 
              />
              <TextField 
                label="Weight (kg)" 
                name="weight" 
                type="number" 
                value={addToWorkoutForm.weight} 
                onChange={handleAddToWorkoutFormChange} 
                variant="outlined" 
                fullWidth 
                InputProps={{ inputProps: { min: 0, step: "0.25" } }} 
              />
              <TextField 
                label="Duration (minutes)" 
                name="duration" 
                type="number" 
                value={addToWorkoutForm.duration} 
                onChange={handleAddToWorkoutFormChange} 
                variant="outlined" 
                fullWidth 
                InputProps={{ inputProps: { min: 0 } }} 
              />
              <TextField 
                label="Notes" 
                name="notes" 
                value={addToWorkoutForm.notes} 
                onChange={handleAddToWorkoutFormChange} 
                variant="outlined" 
                fullWidth 
                multiline 
                rows={3} 
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ backgroundColor: '#fefae0', borderTop: '1px solid #dda15eff' }}>
            <Button onClick={handleCloseAddToWorkoutModal} sx={{ color: '#bc6c25ff' }}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveWorkoutEntry} 
              variant="contained" 
              sx={{ bgcolor: '#606c38ff', '&:hover': { bgcolor: '#283618ff' } }}
              disabled={isSaving || !selectedPlanId}
            >
              {isSaving ? <CircularProgress size={20} /> : 'Save to Plan'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {/* --- End Added --- */}

      {/* Snackbar for success/error messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExercisesPage;