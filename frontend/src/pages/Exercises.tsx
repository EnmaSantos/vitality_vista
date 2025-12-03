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
import { Search as SearchIcon, Close as CloseIcon, FitnessCenter as FitnessCenterIcon, Add as AddIcon, PlayCircleOutline as PlayCircleOutlineIcon } from '@mui/icons-material';
import { useThemeContext, themeColors } from '../context/ThemeContext';
import { getAllExercises, searchExercisesByName, Exercise } from '../services/exerciseApi';
import { 
  getUserWorkoutPlans, 
  createWorkoutPlan, 
  addExerciseToPlan,
  WorkoutPlan, 
  CreateWorkoutPlanPayload,
  AddExerciseToPlanPayload 
} from '../api/workoutApi';
import { useAuth } from '../context/AuthContext';
import { createWorkoutLog, logExerciseDetail } from '../services/workoutLogApi';
import { useNavigate, useLocation } from 'react-router-dom';
import LogWorkoutModal from '../components/LogWorkoutModal';

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
  const [category, setCategory] = useState('all');
  const { setCurrentThemeColor } = useThemeContext();
  const { token } = useAuth();
  const [allExercises, setAllExercises] = useState<Exercise[]>([]); // Holds all exercises from API
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // --- Added: State for Exercise Details Modal ---
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedExerciseForModal, setSelectedExerciseForModal] = useState<Exercise | null>(null);
  // --- End Added ---

  // --- Added: State for "Add to Workout" Modal ---
  const [isAddToWorkoutModalOpen, setIsAddToWorkoutModalOpen] = useState(false);
  const [exerciseToLog, setExerciseToLog] = useState<Exercise | null>(null);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | 'new' | ''>('');
  const [newPlanForm, setNewPlanForm] = useState<NewWorkoutPlanForm>({
    name: '',
    description: ''
  });
  const [addToWorkoutForm, setAddToWorkoutForm] = useState<AddToWorkoutFormState>({
    sets: '',
    reps: '',
    weight: '',
    duration: '',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // --- Added: State for Log Workout Modal ---
  const [isLogWorkoutModalOpen, setIsLogWorkoutModalOpen] = useState(false);
  const [currentWorkoutLog, setCurrentWorkoutLog] = useState<number | null>(null);
  const [logWorkoutForm, setLogWorkoutForm] = useState({
    sets: '',
    reps: '',
    weight: '',
    duration: '',
    notes: ''
  });

  // Snackbar state for success/error messages
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // --- Create Workout Plan Modal State ---
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', description: '' });
  const [planExercises, setPlanExercises] = useState<Exercise[]>([]);
  const [planSearchQuery, setPlanSearchQuery] = useState('');
  const [planSearchResults, setPlanSearchResults] = useState<Exercise[]>([]);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const navigate = useNavigate();
  const location = useLocation(); // Get location object

  // --- Effects ---
  useEffect(() => {
    setCurrentThemeColor(themeColors.darkMossGreen);
  }, [setCurrentThemeColor]);

  // Effect to fetch all exercises once on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const exercisesData = await getAllExercises();
        setAllExercises(exercisesData);
        // Extract unique categories from the full list
        const uniqueCategories = Array.from(new Set(exercisesData.map(ex => ex.category).filter(Boolean) as string[])).sort();
        setAvailableCategories(uniqueCategories);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load exercises';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []); // Empty dependency array ensures this runs only once

  // Effect to automatically open Create Plan Modal if signaled by navigation state
  useEffect(() => {
    if (location.state?.openCreatePlanModal) {
      handleOpenCreatePlanModal();
      // Clear the state from history so modal doesn't reopen on refresh/back
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]); // Added navigate to dependency array

  // --- Client-Side Filtering Logic ---
  const filteredExercises = allExercises.filter(exercise => {
    const matchesCategory = category === 'all' || exercise.category === category;
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // --- Client-Side Pagination Calculations ---
  const totalPages = Math.ceil(filteredExercises.length / ITEMS_PER_PAGE);
  const currentExercises = filteredExercises.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  // --- Event Handlers ---
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Reset to page 1 when filters change
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
      const response = await getUserWorkoutPlans(token);
      if (response.success && response.data) {
        setWorkoutPlans(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch workout plans');
      }
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
    setExerciseToLog(null);
    setSelectedPlanId('');
    setNewPlanForm({ name: '', description: '' });
    setAddToWorkoutForm({ sets: '', reps: '', weight: '', duration: '', notes: '' });
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
        const newPlanResponse = await createWorkoutPlan({
          name: newPlanForm.name.trim(),
          description: newPlanForm.description.trim() || undefined
        }, token);
        
        console.log('New plan created:', newPlanResponse);
        
        if (!newPlanResponse.success || !newPlanResponse.data || !newPlanResponse.data.plan_id) {
          throw new Error(newPlanResponse.error || 'Failed to create workout plan - invalid response');
        }
        
        const newPlan = newPlanResponse.data;
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
      const exerciseData: AddExerciseToPlanPayload = {
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
      const result = await addExerciseToPlan(finalPlanId, exerciseData, token);
      
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

  const handleOpenLogWorkoutModal = (exercise: Exercise) => {
    setExerciseToLog(exercise);
    setIsLogWorkoutModalOpen(true);
    setLogWorkoutForm({ sets: '', reps: '', weight: '', duration: '', notes: '' });
  };

  const handleCloseLogWorkoutModal = () => {
    setIsLogWorkoutModalOpen(false);
    setExerciseToLog(null);
    setLogWorkoutForm({ sets: '', reps: '', weight: '', duration: '', notes: '' });
  };

  const handleSaveWorkoutLog = async () => {
    if (!token || !exerciseToLog) {
      setSnackbar({
        open: true,
        message: 'Authentication required',
        severity: 'error'
      });
      return;
    }

    if (!logWorkoutForm.sets) {
      setSnackbar({
        open: true,
        message: 'Please enter the number of sets',
        severity: 'error'
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // First, create a workout log if we don't have one
      if (!currentWorkoutLog) {
        const newLog = await createWorkoutLog({}, token);
        setCurrentWorkoutLog(newLog.log_id);
        
        // Log the exercise detail
        await logExerciseDetail(
          newLog.log_id,
          {
            exercise_id: exerciseToLog.id,
            exercise_name: exerciseToLog.name,
            set_number: parseInt(logWorkoutForm.sets),
            reps_achieved: logWorkoutForm.reps ? parseInt(logWorkoutForm.reps) : undefined,
            weight_kg_used: logWorkoutForm.weight ? parseFloat(logWorkoutForm.weight) : undefined,
            duration_achieved_seconds: logWorkoutForm.duration ? parseInt(logWorkoutForm.duration) * 60 : undefined, // Convert minutes to seconds
            notes: logWorkoutForm.notes || undefined
          },
          token
        );
      } else {
        // Use existing workout log
        await logExerciseDetail(
          currentWorkoutLog,
          {
            exercise_id: exerciseToLog.id,
            exercise_name: exerciseToLog.name,
            set_number: parseInt(logWorkoutForm.sets),
            reps_achieved: logWorkoutForm.reps ? parseInt(logWorkoutForm.reps) : undefined,
            weight_kg_used: logWorkoutForm.weight ? parseFloat(logWorkoutForm.weight) : undefined,
            duration_achieved_seconds: logWorkoutForm.duration ? parseInt(logWorkoutForm.duration) * 60 : undefined, // Convert minutes to seconds
            notes: logWorkoutForm.notes || undefined
          },
          token
        );
      }
      
      setSnackbar({
        open: true,
        message: `${exerciseToLog.name} logged successfully!`,
        severity: 'success'
      });
      
      handleCloseLogWorkoutModal();
      
    } catch (error) {
      console.error('Error logging workout:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to log workout',
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Handlers for Create Plan Modal ---
  const handleOpenCreatePlanModal = () => {
    setPlanForm({ name: '', description: '' });
    setPlanExercises([]);
    setPlanSearchQuery('');
    setPlanSearchResults([]);
    setIsCreatePlanModalOpen(true);
  };

  const handleCloseCreatePlanModal = () => {
    setIsCreatePlanModalOpen(false);
  };

  const handlePlanFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPlanForm(prev => ({ ...prev, [name]: value }));
  };

  const addExerciseToPlanList = (ex: Exercise) => {
    if (planExercises.find(pe => pe.id === ex.id)) return;
    setPlanExercises(prev => [...prev, ex]);
  };

  const removeExerciseFromPlanList = (id: number) => {
    setPlanExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const handleSaveNewPlan = async () => {
    if (!token) {
      setSnackbar({ open: true, message: 'Authentication required', severity: 'error' });
      return;
    }
    if (!planForm.name.trim()) {
      setSnackbar({ open: true, message: 'Plan name is required', severity: 'error' });
      return;
    }
    if (planExercises.length === 0) {
      setSnackbar({ open: true, message: 'Add at least one exercise', severity: 'error' });
      return;
    }
    setIsSavingPlan(true);
    try {
      const newPlanResponse = await createWorkoutPlan(
        { name: planForm.name.trim(), description: planForm.description.trim() || undefined }, 
        token
      );

      if (newPlanResponse && newPlanResponse.success && newPlanResponse.data) {
        const createdPlanId = newPlanResponse.data.plan_id;

        if (createdPlanId === undefined || createdPlanId === null) {
            console.error('Error saving plan: plan_id is missing from createWorkoutPlan response', newPlanResponse);
            setSnackbar({ open: true, message: 'Error: Could not get new plan ID.', severity: 'error' });
            setIsSavingPlan(false);
            return;
        }
        
        console.log(`Successfully created plan with ID: ${createdPlanId}. Now adding exercises.`);

        for (const ex of planExercises) {
          // Ensure you are passing all required fields for AddExerciseToPlanPayload if any
          // For now, just exercise_id and exercise_name as per previous structure
          const exercisePayload: AddExerciseToPlanPayload = {
            exercise_id: ex.id, 
            exercise_name: ex.name 
            // Populate other fields like sets, reps, notes if they are part of the modal 
            // and meant to be saved with the initial plan creation here.
            // This example assumes they are not, and only id/name are added initially.
          };
          const addExerciseResponse = await addExerciseToPlan(createdPlanId, exercisePayload, token);
          if (!addExerciseResponse.success) {
            console.error('Failed to add exercise to plan:', addExerciseResponse.error);
            // Continue with other exercises, or throw error if you want to stop
          }
        }
        setSnackbar({ open: true, message: 'Workout plan created!', severity: 'success' });
        handleCloseCreatePlanModal();
      } else {
        console.error('Error creating plan:', newPlanResponse?.error || 'Unknown error during plan creation');
        setSnackbar({ open: true, message: newPlanResponse?.error || 'Failed to create plan base', severity: 'error' });
      }
    } catch (err) {
      console.error('Error saving plan:', err);
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Failed to save plan', severity: 'error' });
    } finally {
      setIsSavingPlan(false);
    }
  };

  // --- Log before Render ---
  console.log('Filtered Exercises Count:', currentExercises.length); // <-- ADD THIS LOG
  console.log('Total Count from API:', allExercises.length);
  console.log('Current Page Exercises:', currentExercises); // <-- ADD THIS LOG

  // --- Render Logic ---
  return (
    <Box sx={{ padding: 3, backgroundColor: '#edf0e9', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#283618ff' }}> Exercise Library </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={()=>navigate('/workout-history')} sx={{ color:'#606c38ff', borderColor:'#606c38ff', '&:hover':{ bgcolor:'rgba(96,108,56,0.05)'} }}>View History</Button>
          <Button variant="outlined" onClick={()=>navigate('/my-plans')} sx={{ color:'#606c38ff', borderColor:'#606c38ff', '&:hover':{ bgcolor:'rgba(96,108,56,0.05)'} }}>View My Plans</Button>
          <Button variant="contained" onClick={handleOpenCreatePlanModal} sx={{ bgcolor: '#606c38ff', '&:hover': { bgcolor: '#283618ff' } }} startIcon={<AddIcon />}>Create Workout Plan</Button>
        </Box>
      </Box>
      <Typography variant="subtitle1" sx={{ mb: 4, color: '#283618ff' }}> Browse exercises to log workouts or build plans. </Typography>

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
            <FormControl fullWidth variant="outlined">
              <InputLabel id="category-select-label">Category</InputLabel>
              <Select
                labelId="category-select-label"
                id="category-select"
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value as string)}
                disabled={isLoading}
              >
                <MenuItem value="all">
                  <em>All Categories</em>
                </MenuItem>
                {availableCategories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
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
            {currentExercises.length} Exercises Found
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
                        variant="contained"
                        onClick={() => navigate(`/workout/session/exercise/${exercise.id}`)}
                        sx={{ 
                          ml: 1, 
                          backgroundColor: '#94e0b2',
                          color: '#101914',
                          '&:hover': { backgroundColor: '#7dd19a' }
                        }}
                        startIcon={<PlayCircleOutlineIcon />}
                      >
                        Start Workout
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleOpenLogWorkoutModal(exercise)}
                        sx={{ ml: 1, color: '#bc6c25ff', '&:hover': { backgroundColor: 'rgba(188, 108, 37, 0.1)' } }}
                        startIcon={<FitnessCenterIcon />}
                      >
                        Log Workout
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          {currentExercises.length === 0 && (
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

      <LogWorkoutModal
        open={isLogWorkoutModalOpen}
        exercise={exerciseToLog}
        token={token}
        onClose={handleCloseLogWorkoutModal}
      />

      {/* --- Create Workout Plan Modal --- */}
      {isCreatePlanModalOpen && (
        <Dialog open={isCreatePlanModalOpen} onClose={handleCloseCreatePlanModal} maxWidth="md" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#606c38ff', color: 'white' }}>
            Create Workout Plan
            <IconButton
              aria-label="close"
              onClick={handleCloseCreatePlanModal}
              sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[300] }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ backgroundColor: '#fefae0' }}>
            <Stack spacing={2}>
              <TextField label="Plan Name" name="name" value={planForm.name} onChange={handlePlanFormChange} fullWidth required />
              <TextField label="Description" name="description" value={planForm.description} onChange={handlePlanFormChange} fullWidth multiline rows={3} />
              <Divider />
              <TextField label="Search Exercises" value={planSearchQuery} onChange={(e)=>setPlanSearchQuery(e.target.value)} fullWidth InputProps={{ endAdornment: <SearchIcon /> }} />
              {/* Search results */}
              {planSearchResults.length > 0 && (
                <Paper variant="outlined" sx={{ maxHeight: 200, overflowY: 'auto' }}>
                  <List dense>
                    {planSearchResults.map(ex => (
                      <ListItem key={ex.id} button onClick={()=>addExerciseToPlanList(ex)}>
                        <ListItemText primary={ex.name} secondary={ex.category} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
              <Divider />
              <Typography variant="subtitle2">Selected Exercises ({planExercises.length})</Typography>
              {planExercises.length === 0 ? (
                <Typography variant="body2">No exercises added yet.</Typography>
              ) : (
                <Paper variant="outlined" sx={{ maxHeight: 200, overflowY: 'auto' }}>
                  <List dense>
                    {planExercises.map(ex => (
                      <ListItem key={ex.id} secondaryAction={<IconButton edge="end" onClick={()=>removeExerciseFromPlanList(ex.id)}><CloseIcon fontSize="small" /></IconButton>}>
                        <ListItemText primary={ex.name} secondary={ex.category} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ backgroundColor: '#fefae0', borderTop: '1px solid #dda15eff' }}>
            <Button onClick={handleCloseCreatePlanModal} sx={{ color: '#bc6c25ff' }}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveNewPlan} sx={{ bgcolor: '#606c38ff', '&:hover': { bgcolor: '#283618ff' } }} disabled={isSavingPlan || !planForm.name.trim() || planExercises.length===0}>
              {isSavingPlan ? 'Saving...' : 'Save Plan'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {/* --- End Create Plan Modal --- */}

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