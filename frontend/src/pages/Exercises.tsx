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
  Snackbar,
  Chip
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

import { usePageTheme, themePalette } from '../hooks/usePageTheme';

const ExercisesPage: React.FC = () => {
  usePageTheme(themePalette.orange);
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
  // Theme context is managed globally now
  useEffect(() => {
    // setCurrentThemeColor(themeColors.darkMossGreen);
  }, []);

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
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'var(--color-bg)', minHeight: '100vh', pb: 8 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold', fontFamily: 'Outfit, sans-serif', mb: 1 }}>
              Exercise Library
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'var(--color-secondary)' }}>
              Browse exercises to log workouts or build plans
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/workout-history')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                color: 'var(--color-primary)',
                borderColor: 'var(--color-primary)',
                '&:hover': {
                  bgcolor: 'rgba(96,108,56,0.05)',
                  borderColor: 'var(--color-primary-dark)'
                }
              }}
            >
              View History
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/my-plans')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                color: 'var(--color-primary)',
                borderColor: 'var(--color-primary)',
                '&:hover': {
                  bgcolor: 'rgba(96,108,56,0.05)',
                  borderColor: 'var(--color-primary-dark)'
                }
              }}
            >
              View My Plans
            </Button>
            <Button
              variant="contained"
              onClick={handleOpenCreatePlanModal}
              startIcon={<AddIcon />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                bgcolor: 'var(--color-primary)',
                color: 'white',
                '&:hover': { bgcolor: 'var(--color-primary-dark)' }
              }}
            >
              Create Workout Plan
            </Button>
          </Box>
        </Box>

        {/* Search and Filter Controls */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 4,
            bgcolor: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid rgba(96, 108, 56, 0.1)'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search Exercises..."
                value={searchQuery}
                onChange={(e) => {
                  const newQuery = e.target.value;
                  setSearchQuery(newQuery);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'var(--color-primary)' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 3,
                    bgcolor: 'var(--color-bg)',
                    '& fieldset': { borderColor: 'rgba(96, 108, 56, 0.2)' },
                    '&:hover fieldset': { borderColor: 'var(--color-primary) !important' },
                    '&.Mui-focused fieldset': { borderColor: 'var(--color-primary) !important' },
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="category-select-label" sx={{ color: 'var(--color-primary)' }}>Category</InputLabel>
                <Select
                  labelId="category-select-label"
                  id="category-select"
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value as string)}
                  disabled={isLoading}
                  sx={{
                    borderRadius: 3,
                    bgcolor: 'var(--color-bg)',
                    color: 'var(--color-primary-dark)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(96, 108, 56, 0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--color-primary)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--color-primary)' },
                    '& .MuiSvgIcon-root': { color: 'var(--color-primary)' }
                  }}
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
            <Typography variant="h6" sx={{ color: 'var(--color-primary-dark)', mb: 2, fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>
              {currentExercises.length} Exercises Found
            </Typography>
            <Grid container spacing={3}>
              {currentExercises.map((exercise) => {
                return (
                  <Grid item xs={12} sm={6} md={4} key={exercise.id || exercise.name}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        border: 'none',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" component="div" sx={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontFamily: 'Outfit, sans-serif', lineHeight: 1.2 }}>
                            {exercise.name}
                          </Typography>
                          <Chip
                            label={exercise.level || 'General'}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(96, 108, 56, 0.1)',
                              color: 'var(--color-primary)',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              height: 24
                            }}
                          />
                        </Box>

                        <Typography variant="body2" sx={{ color: 'var(--color-secondary)', mb: 2, textTransform: 'capitalize' }}>
                          {exercise.category}
                        </Typography>

                        <Divider sx={{ my: 1.5, borderColor: 'rgba(0,0,0,0.05)' }} />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            <strong style={{ color: 'var(--color-primary-dark)' }}>Target:</strong> {exercise.primaryMuscles?.join(', ') || 'N/A'}
                          </Typography>
                          {exercise.equipment && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              <strong style={{ color: 'var(--color-primary-dark)' }}>Equipment:</strong> {exercise.equipment}
                            </Typography>
                          )}
                        </Box>

                        {exercise.images && exercise.images.length > 0 && (
                          <Box
                            sx={{
                              mt: 2,
                              borderRadius: 2,
                              overflow: 'hidden',
                              height: 140,
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              bgcolor: 'var(--color-bg)'
                            }}
                          >
                            <img
                              src={exercise.images[0].startsWith('http') ? exercise.images[0] : `${process.env.PUBLIC_URL}${exercise.images[0]}`}
                              alt={exercise.name}
                              style={{
                                maxWidth: '100%',
                                height: '100%',
                                objectFit: 'contain'
                              }}
                            />
                          </Box>
                        )}
                      </CardContent>

                      <Box sx={{ p: 3, pt: 0, mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => navigate(`/workout/session/exercise/${exercise.id}`)}
                          fullWidth
                          sx={{
                            bgcolor: 'var(--color-primary)',
                            color: 'white',
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 'bold',
                            '&:hover': { bgcolor: 'var(--color-primary-dark)' }
                          }}
                          startIcon={<PlayCircleOutlineIcon />}
                        >
                          Start Workout
                        </Button>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenDetailsModal(exercise)}
                            fullWidth
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600,
                              borderColor: 'var(--color-primary)',
                              color: 'var(--color-primary)',
                              '&:hover': {
                                borderColor: 'var(--color-primary-dark)',
                                backgroundColor: 'rgba(96, 108, 56, 0.05)'
                              }
                            }}
                          >
                            Details
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleOpenLogWorkoutModal(exercise)}
                            fullWidth
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600,
                              color: 'var(--color-accent)',
                              '&:hover': { backgroundColor: 'rgba(188, 108, 37, 0.1)' }
                            }}
                            startIcon={<FitnessCenterIcon />}
                          >
                            Log
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
            {currentExercises.length === 0 && (
              <Paper sx={{ p: 4, textAlign: 'center', mt: 3, borderRadius: 4, bgcolor: 'white', boxShadow: 'none', border: '1px dashed rgba(0,0,0,0.1)' }}>
                <Typography variant="subtitle1" color="textSecondary">
                  No exercises found matching your criteria.
                </Typography>
              </Paper>
            )}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', padding: '40px 0 20px' }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  sx={{
                    '& .MuiPaginationItem-root': { color: 'var(--color-primary)' },
                    '& .Mui-selected': {
                      backgroundColor: 'rgba(96, 108, 56, 0.1) !important',
                      color: 'var(--color-primary-dark)',
                      fontWeight: 'bold'
                    }
                  }}
                />
              </Box>
            )}  </>
        )}

        {/* --- Added: Exercise Details Modal --- */}
        {selectedExerciseForModal && (
          <Dialog
            open={isDetailsModalOpen}
            onClose={handleCloseDetailsModal}
            maxWidth="md"
            fullWidth
            scroll="paper"
            PaperProps={{
              sx: {
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }
            }}
          >
            <DialogTitle sx={{ m: 0, p: 3, borderBottom: '1px solid rgba(0,0,0,0.05)', fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
              {selectedExerciseForModal.name}
              <IconButton
                aria-label="close"
                onClick={handleCloseDetailsModal}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: 'var(--color-secondary)',
                  '&:hover': { color: 'var(--color-primary)' }
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 4, borderColor: 'rgba(0,0,0,0.05)' }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={selectedExerciseForModal.images && selectedExerciseForModal.images.length > 0 ? 6 : 12}>
                  <Box sx={{ mb: 3 }}>
                    <Chip
                      label={selectedExerciseForModal.category}
                      sx={{
                        bgcolor: 'var(--color-primary)',
                        color: 'white',
                        fontWeight: 600,
                        mr: 1
                      }}
                    />
                    <Chip
                      label={selectedExerciseForModal.level}
                      variant="outlined"
                      sx={{
                        borderColor: 'var(--color-primary)',
                        color: 'var(--color-primary)',
                        fontWeight: 600
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'var(--color-bg)', borderRadius: 3 }}>
                      <Typography variant="caption" sx={{ color: 'var(--color-secondary)', display: 'block', mb: 0.5 }}>Force</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--color-primary-dark)', textTransform: 'capitalize' }}>
                        {selectedExerciseForModal.force || '-'}
                      </Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'var(--color-bg)', borderRadius: 3 }}>
                      <Typography variant="caption" sx={{ color: 'var(--color-secondary)', display: 'block', mb: 0.5 }}>Mechanic</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--color-primary-dark)', textTransform: 'capitalize' }}>
                        {selectedExerciseForModal.mechanic || '-'}
                      </Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'var(--color-bg)', borderRadius: 3 }}>
                      <Typography variant="caption" sx={{ color: 'var(--color-secondary)', display: 'block', mb: 0.5 }}>Equipment</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--color-primary-dark)', textTransform: 'capitalize' }}>
                        {selectedExerciseForModal.equipment || '-'}
                      </Typography>
                    </Paper>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ color: 'var(--color-secondary)', mb: 1 }}>Primary Muscles</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedExerciseForModal.primaryMuscles?.map(muscle => (
                        <Chip key={muscle} label={muscle} size="small" sx={{ bgcolor: 'rgba(96, 108, 56, 0.1)', color: 'var(--color-primary-dark)' }} />
                      ))}
                    </Box>
                  </Box>

                  {selectedExerciseForModal.secondaryMuscles && selectedExerciseForModal.secondaryMuscles.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ color: 'var(--color-secondary)', mb: 1 }}>Secondary Muscles</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedExerciseForModal.secondaryMuscles.map(muscle => (
                          <Chip key={muscle} label={muscle} size="small" variant="outlined" sx={{ borderColor: 'rgba(96, 108, 56, 0.2)', color: 'var(--color-secondary)' }} />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Grid>

                {selectedExerciseForModal.images && selectedExerciseForModal.images.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {selectedExerciseForModal.images.slice(0, 2).map((imgSrc, index) => (
                        <Box
                          key={index}
                          sx={{
                            borderRadius: 4,
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            border: '1px solid rgba(0,0,0,0.05)'
                          }}
                        >
                          <img
                            src={imgSrc.startsWith('http') ? imgSrc : `${process.env.PUBLIC_URL}${imgSrc}`}
                            alt={`${selectedExerciseForModal.name} - view ${index + 1}`}
                            style={{
                              width: '100%',
                              height: 'auto',
                              display: 'block'
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>

              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>Instructions</Typography>
                <List disablePadding>
                  {selectedExerciseForModal.instructions?.map((instruction, index) => (
                    <ListItem
                      key={index}
                      disableGutters
                      sx={{
                        alignItems: 'flex-start',
                        mb: 2,
                        p: 2,
                        bgcolor: 'var(--color-bg)',
                        borderRadius: 3
                      }}
                    >
                      <Box
                        sx={{
                          minWidth: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: 'var(--color-primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          mr: 2,
                          mt: 0.25
                        }}
                      >
                        {index + 1}
                      </Box>
                      <ListItemText
                        primary={<Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.6 }}>{instruction}</Typography>}
                      />
                    </ListItem>
                  )) || (
                      <Typography color="text.secondary">No instructions available.</Typography>
                    )}
                </List>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <Button
                onClick={handleCloseDetailsModal}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  color: 'var(--color-primary)',
                  borderColor: 'var(--color-primary)',
                  '&:hover': { borderColor: 'var(--color-primary-dark)', bgcolor: 'rgba(96, 108, 56, 0.05)' }
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
        )}
        {/* --- End Added --- */}

        {/* --- Added: "Add to Workout" Modal --- */}
        {exerciseToLog && (
          <Dialog
            open={isAddToWorkoutModalOpen}
            onClose={handleCloseAddToWorkoutModal}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }
            }}
          >
            <DialogTitle sx={{ m: 0, p: 3, borderBottom: '1px solid rgba(0,0,0,0.05)', fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
              Add "{exerciseToLog.name}" to Workout
              <IconButton
                aria-label="close"
                onClick={handleCloseAddToWorkoutModal}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: 'var(--color-secondary)',
                  '&:hover': { color: 'var(--color-primary)' }
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 4, borderColor: 'rgba(0,0,0,0.05)' }}>
              <Stack spacing={3}>
                {/* Workout Plan Selection */}
                <FormControl fullWidth variant="outlined">
                  <InputLabel sx={{ color: 'var(--color-primary)' }}>Select Workout Plan</InputLabel>
                  <Select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value as number | 'new' | '')}
                    label="Select Workout Plan"
                    disabled={isLoadingPlans}
                    sx={{ borderRadius: 2 }}
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
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'var(--color-primary)' }}>
                        <AddIcon sx={{ mr: 1, fontSize: 20 }} />
                        Create New Plan
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                {/* New Plan Form (shown when "new" is selected) */}
                {selectedPlanId === 'new' && (
                  <Box sx={{ p: 2, bgcolor: 'var(--color-bg)', borderRadius: 2 }}>
                    <TextField
                      label="New Plan Name"
                      name="name"
                      value={newPlanForm.name}
                      onChange={handleNewPlanFormChange}
                      variant="outlined"
                      fullWidth
                      required
                      sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Box>
                )}

                <Divider />

                {/* Exercise Details */}
                <Typography variant="subtitle2" sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>
                  Exercise Details
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Sets"
                    name="sets"
                    type="number"
                    value={addToWorkoutForm.sets}
                    onChange={handleAddToWorkoutFormChange}
                    variant="outlined"
                    fullWidth
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <TextField
                    label="Reps"
                    name="reps"
                    value={addToWorkoutForm.reps}
                    onChange={handleAddToWorkoutFormChange}
                    variant="outlined"
                    fullWidth
                    placeholder="e.g. 8-12"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <TextField
                    label="Duration (min)"
                    name="duration"
                    type="number"
                    value={addToWorkoutForm.duration}
                    onChange={handleAddToWorkoutFormChange}
                    variant="outlined"
                    fullWidth
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>

                <TextField
                  label="Notes"
                  name="notes"
                  value={addToWorkoutForm.notes}
                  onChange={handleAddToWorkoutFormChange}
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={3}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <Button onClick={handleCloseAddToWorkoutModal} sx={{ color: 'var(--color-secondary)' }}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveWorkoutEntry}
                variant="contained"
                sx={{
                  bgcolor: 'var(--color-primary)',
                  color: 'white',
                  borderRadius: 2,
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: 'var(--color-primary-dark)' }
                }}
                disabled={isSaving || !selectedPlanId}
              >
                {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Save to Plan'}
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
          <Dialog
            open={isCreatePlanModalOpen}
            onClose={handleCloseCreatePlanModal}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 4,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }
            }}
          >
            <DialogTitle sx={{ m: 0, p: 3, borderBottom: '1px solid rgba(0,0,0,0.05)', fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
              Create Workout Plan
              <IconButton
                aria-label="close"
                onClick={handleCloseCreatePlanModal}
                sx={{ position: 'absolute', right: 8, top: 8, color: 'var(--color-secondary)' }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 4, borderColor: 'rgba(0,0,0,0.05)' }}>
              <Stack spacing={3}>
                <TextField
                  label="Plan Name"
                  name="name"
                  value={planForm.name}
                  onChange={handlePlanFormChange}
                  fullWidth
                  required
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  label="Description"
                  name="description"
                  value={planForm.description}
                  onChange={handlePlanFormChange}
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Divider />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>Add Exercises</Typography>
                <TextField
                  label="Search Exercises"
                  value={planSearchQuery}
                  onChange={(e) => setPlanSearchQuery(e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: <SearchIcon sx={{ color: 'var(--color-secondary)' }} />,
                    sx: { borderRadius: 2 }
                  }}
                />

                {planSearchResults.length > 0 && (
                  <Paper variant="outlined" sx={{ maxHeight: 200, overflowY: 'auto', borderRadius: 2 }}>
                    <List dense>
                      {planSearchResults.map(ex => (
                        <ListItem key={ex.id} button onClick={() => addExerciseToPlanList(ex)}>
                          <ListItemText primary={ex.name} secondary={ex.category} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}

                {/* Selected Exercises */}
                <Paper variant="outlined" sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
                  <Box sx={{ p: 2, bgcolor: 'var(--color-bg)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Selected Exercises ({planExercises.length})
                    </Typography>
                  </Box>
                  {planExercises.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">No exercises added yet.</Typography>
                    </Box>
                  ) : (
                    <List dense sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      {planExercises.map((ex, index) => (
                        <ListItem
                          key={`${ex.id}-${index}`}
                          divider={index !== planExercises.length - 1}
                          secondaryAction={<IconButton edge="end" onClick={() => removeExerciseFromPlanList(ex.id)}><CloseIcon fontSize="small" /></IconButton>}
                        >
                          <ListItemText primary={ex.name} secondary={ex.category} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Paper>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <Button onClick={handleCloseCreatePlanModal} sx={{ color: 'var(--color-secondary)' }}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleSaveNewPlan}
                sx={{
                  bgcolor: 'var(--color-primary)',
                  color: 'white',
                  borderRadius: 2,
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: 'var(--color-primary-dark)' }
                }}
                disabled={isSavingPlan || !planForm.name.trim() || planExercises.length === 0}
              >
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
    </Box>
  );
};

export default ExercisesPage;