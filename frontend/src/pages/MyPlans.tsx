import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getUserWorkoutPlans, 
  getPlanExercises, 
  WorkoutPlan, 
  PlanExercise, 
  deleteWorkoutPlan,
  removeExerciseFromPlan,
  updatePlanExercise,
  UpdatePlanExerciseData
} from '../api/workoutApi';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Button, List, ListItem, ListItemText, IconButton, Box, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Stack } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import LogWorkoutModal from '../components/LogWorkoutModal';

// Placeholder for ExerciseDetail until exercisesApi.ts is created/fixed
// This interface should ideally match the Exercise type expected by LogWorkoutModal
interface ExerciseForModal {
  id: number;
  name: string;
  description: string;
  category: string; // Changed from number to string
  equipment: string; // Changed from number[] to string
  language: number; // Changed from optional to required
  muscles: number[]; // Changed from optional to required
  muscles_secondary: number[]; // Changed from optional to required
  force: string; // Changed from string | null to string
  level: string; // Changed from string | null to string
  mechanic: string; // Changed from string | null to string
  primaryMuscles: string[]; // Changed from optional to required
  secondaryMuscles: string[]; // Changed from optional to required
  creation_date: string; // Changed from optional to required
  uuid: string; // Changed from optional to required
  variations: number; // Changed from optional to required
  license_author: string; // Changed from optional to required
  license: number; // Changed from optional to required
  // Added based on new linter errors
  instructions: string[]; // Changed from string to string[]
  images: string[]; // Changed from { image: string; is_main: boolean; }[] to string[]
  calories_per_hour: number; // Changed from optional to required
  duration_minutes: number; // Changed from optional to required
  total_calories: number; // Changed from optional to required
}

const MyPlans: React.FC = () => {
  const { token } = useAuth();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [expandedPlan, setExpandedPlan] = useState<number | false>(false);
  const [planExercises, setPlanExercises] = useState<Record<number, PlanExercise[]>>({});
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
  const [loadingExercises, setLoadingExercises] = useState<Record<number, boolean>>({}); 
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // State for LogWorkoutModal
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedExerciseForLog, setSelectedExerciseForLog] = useState<ExerciseForModal | null>(null);
  const [currentPlanIdForLog, setCurrentPlanIdForLog] = useState<number | null>(null);

  // State for delete confirmation
  const [deletePlanModalOpen, setDeletePlanModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<WorkoutPlan | null>(null);
  const [removeExerciseModalOpen, setRemoveExerciseModalOpen] = useState(false);
  const [exerciseToRemove, setExerciseToRemove] = useState<{planId: number, planExerciseId: number, exerciseName: string} | null>(null);
  
  // --- State for Edit Exercise Modal ---
  const [editExerciseModalOpen, setEditExerciseModalOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<PlanExercise | null>(null);
  const [editExerciseForm, setEditExerciseForm] = useState<UpdatePlanExerciseData>({});
  const [isUpdatingExercise, setIsUpdatingExercise] = useState(false);
  
  const fetchUserPlans = useCallback(async () => {
    if (!token) { setError("Authentication token not found."); setLoadingPlans(false); return; }
    setLoadingPlans(true);
    setError(null);
    try {
      const response = await getUserWorkoutPlans(token);
      if (response.success && response.data) {
        setPlans(response.data);
      } else {
        setError(response.error || 'Failed to fetch workout plans');
        setPlans([]); // Ensure plans is empty on error too
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching plans.');
      console.error(err);
      setPlans([]); // Ensure plans is empty on error
    }
    setLoadingPlans(false);
  }, [token]);

  useEffect(() => {
    fetchUserPlans();
  }, [fetchUserPlans]);

  const handleAccordionChange = (planId: number) => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedPlan(isExpanded ? planId : false);
    if (isExpanded && !planExercises[planId] && !loadingExercises[planId]) {
      fetchPlanExercisesForPlan(planId);
    }
  };

  const fetchPlanExercisesForPlan = async (planId: number) => {
    if (!token) { setError(`Cannot fetch exercises for plan ${planId}: Authentication token not found.`); return; }
    setLoadingExercises(prev => ({ ...prev, [planId]: true }));
    try {
      const response = await getPlanExercises(planId, token);
      if (response.success && response.data) {
        setPlanExercises(prev => ({ ...prev, [planId]: response.data! }));
      } else {
        setError(response.error || `Failed to fetch exercises for plan ${planId}`);
        setPlanExercises(prev => ({ ...prev, [planId]: [] })); 
      }
    } catch (err) {
      setError(`An unexpected error occurred while fetching exercises for plan ${planId}`);
      console.error(err);
      setPlanExercises(prev => ({ ...prev, [planId]: [] }));
    }
    setLoadingExercises(prev => ({ ...prev, [planId]: false }));
  };

  const handleLogWorkout = (exercise: PlanExercise, planId: number) => {
    const exerciseDetailForModal: ExerciseForModal = {
        id: exercise.exercise_id, 
        name: exercise.exercise_name,
        description: exercise.notes || 'Exercise from plan',
        category: 'Unknown Category', // Changed to a placeholder string
        equipment: 'various',
        language: 2,
        muscles: [],
        muscles_secondary: [],
        force: 'unknown',
        level: 'any',
        mechanic: 'unknown',
        primaryMuscles: [], 
        secondaryMuscles: [],
        creation_date: new Date().toISOString().split('T')[0],
        uuid: 'placeholder-uuid-' + exercise.exercise_id,
        variations: 0,
        license_author: 'Placeholder Author',
        license: 1,
        // Added based on new linter errors
        instructions: ["Perform as per plan."],
        images: [], // Set to an empty array of strings
        calories_per_hour: 0, 
        duration_minutes: exercise.duration_minutes || 0,
        total_calories: 0,
    };
    setSelectedExerciseForLog(exerciseDetailForModal);
    setCurrentPlanIdForLog(planId);
    setLogModalOpen(true);
  };

  const handleOpenDeletePlanModal = (plan: WorkoutPlan) => {
    setPlanToDelete(plan);
    setDeletePlanModalOpen(true);
  };

  const handleConfirmDeletePlan = async () => {
    if (!planToDelete) { 
        setError("Cannot delete plan: Missing plan data."); 
        setDeletePlanModalOpen(false);
        return; 
    }
    const response = await deleteWorkoutPlan(planToDelete.plan_id);
    if (response.success) {
      setPlans(prevPlans => prevPlans.filter(p => p.plan_id !== planToDelete.plan_id));
      setPlanExercises(prevExercises => {
        const newExercises = { ...prevExercises };
        delete newExercises[planToDelete.plan_id];
        return newExercises;
      });
      if (expandedPlan === planToDelete.plan_id) {
        setExpandedPlan(false);
      }
    } else {
      setError(response.error || 'Failed to delete plan.');
    }
    setDeletePlanModalOpen(false);
    setPlanToDelete(null);
  };

  const handleOpenRemoveExerciseModal = (planId: number, planExerciseId: number, exerciseName: string) => {
    setExerciseToRemove({ planId, planExerciseId, exerciseName });
    setRemoveExerciseModalOpen(true);
  };

  const handleConfirmRemoveExercise = async () => {
    if (!exerciseToRemove) { 
        setError("Cannot remove exercise: Missing exercise data.");
        setRemoveExerciseModalOpen(false);
        return; 
    }
    const { planId, planExerciseId } = exerciseToRemove;
    const response = await removeExerciseFromPlan(planId, planExerciseId);
    if (response.success) {
      fetchPlanExercisesForPlan(planId); 
    } else {
      setError(response.error || 'Failed to remove exercise from plan.');
    }
    setRemoveExerciseModalOpen(false);
    setExerciseToRemove(null);
  };

  // --- Handlers for Edit Exercise Modal ---
  const handleOpenEditExerciseModal = (exercise: PlanExercise) => {
    setExerciseToEdit(exercise);
    setEditExerciseForm({
      sets: exercise.sets,
      reps: exercise.reps,
      weight_kg: exercise.weight_kg,
      duration_minutes: exercise.duration_minutes,
      rest_period_seconds: exercise.rest_period_seconds,
      notes: exercise.notes
    });
    setEditExerciseModalOpen(true);
  };

  const handleEditExerciseFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setEditExerciseForm(prev => ({
      ...prev,
      // Convert to number if the field is numeric, otherwise keep as string
      [name]: (name === 'sets' || name === 'weight_kg' || name === 'duration_minutes' || name === 'rest_period_seconds') && value !== '' ? Number(value) : value
    }));
  };

  const handleConfirmUpdateExercise = async () => {
    if (!exerciseToEdit || !token) {
      setError("Cannot update exercise: Missing data or token.");
      return;
    }
    setIsUpdatingExercise(true);
    setError(null);
    try {
      // Create the payload, ensuring undefined is not sent for empty optional fields
      const payload: UpdatePlanExerciseData = {};
      if (editExerciseForm.sets !== undefined && editExerciseForm.sets !== null) payload.sets = Number(editExerciseForm.sets) || undefined;
      if (editExerciseForm.reps !== undefined && editExerciseForm.reps !== null) payload.reps = String(editExerciseForm.reps) || undefined;
      if (editExerciseForm.weight_kg !== undefined && editExerciseForm.weight_kg !== null) payload.weight_kg = Number(editExerciseForm.weight_kg) || undefined;
      if (editExerciseForm.duration_minutes !== undefined && editExerciseForm.duration_minutes !== null) payload.duration_minutes = Number(editExerciseForm.duration_minutes) || undefined;
      if (editExerciseForm.rest_period_seconds !== undefined && editExerciseForm.rest_period_seconds !== null) payload.rest_period_seconds = Number(editExerciseForm.rest_period_seconds) || undefined;
      if (editExerciseForm.notes !== undefined && editExerciseForm.notes !== null) payload.notes = String(editExerciseForm.notes) || undefined;

      const response = await updatePlanExercise(exerciseToEdit.plan_id, exerciseToEdit.plan_exercise_id, payload);
      if (response.success) {
        fetchPlanExercisesForPlan(exerciseToEdit.plan_id); // Refresh exercises for the current plan
        setEditExerciseModalOpen(false);
        setExerciseToEdit(null);
      } else {
        setError(response.error || response.message || 'Failed to update exercise.');
      }
    } catch (err) {
      setError('An unexpected error occurred while updating the exercise.');
      console.error(err);
    }
    setIsUpdatingExercise(false);
  };
  
  const handleNavigateToCreatePlan = () => {
    navigate('/exercises', { state: { openCreatePlanModal: true } });
  };
  
  if (loadingPlans) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Typography color="error" sx={{ textAlign: 'center', mt: 4 }}>Error: {error}</Typography>;
  }

  if (plans.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6">No workout plans created yet.</Typography>
        <Typography variant="subtitle1" sx={{ mb: 2, color: 'text.secondary' }}>
          Let's create your first one!
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={handleNavigateToCreatePlan}>
          Create Your First Plan
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', padding: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
        <Typography variant="h4" gutterBottom sx={{ textAlign: 'left', flexGrow: 1 }}>
            My Workout Plans
        </Typography>
        <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />} 
            onClick={handleNavigateToCreatePlan}
        >
            Create New Plan
        </Button>
      </Box>
      {plans.map((plan) => (
        <Accordion 
          key={plan.plan_id} 
          expanded={expandedPlan === plan.plan_id} 
          onChange={handleAccordionChange(plan.plan_id)}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Typography variant="h6">{plan.name}</Typography>
              <Box>
                {planExercises[plan.plan_id] && planExercises[plan.plan_id].length > 0 && (
                    <Typography variant="caption" sx={{ mr: 2 }}>
                        {planExercises[plan.plan_id].length} exercise(s)
                    </Typography>
                )}
                {planExercises[plan.plan_id] && planExercises[plan.plan_id].length === 0 && expandedPlan === plan.plan_id && !loadingExercises[plan.plan_id] && (
                    <Typography variant="caption" sx={{ mr: 2 }}>
                        No exercises in this plan.
                    </Typography>
                )}
                {loadingExercises[plan.plan_id] && expandedPlan === plan.plan_id && (
                    <CircularProgress size={20} sx={{ mr: 2 }} />
                )}
                <IconButton 
                  size="small" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    alert('Plan Edit functionality coming soon!'); // Placeholder for Plan Edit
                  }}
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleOpenDeletePlanModal(plan);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {loadingExercises[plan.plan_id] && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
            {!loadingExercises[plan.plan_id] && planExercises[plan.plan_id] && (
              <List>
                {planExercises[plan.plan_id].length > 0 ? (
                  planExercises[plan.plan_id].map((exercise) => (
                    <ListItem 
                        key={exercise.plan_exercise_id} 
                        divider
                        secondaryAction={
                            <Box>
                                <IconButton 
                                    edge="end" 
                                    aria-label="edit exercise"
                                    onClick={() => handleOpenEditExerciseModal(exercise)} // Open edit modal
                                    sx={{ mr: 0.5 }}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <Button 
                                    variant="outlined" 
                                    size="small"
                                    onClick={() => handleLogWorkout(exercise, plan.plan_id)}
                                    sx={{ mr: 0.5 }}
                                >
                                    Log
                                </Button>
                                <IconButton 
                                    edge="end" 
                                    aria-label="remove exercise"
                                    onClick={() => handleOpenRemoveExerciseModal(plan.plan_id, exercise.plan_exercise_id, exercise.exercise_name)}
                                >
                                    <DeleteIcon fontSize="small"/>
                                </IconButton>
                            </Box>
                        }
                    >
                      <ListItemText 
                        primary={exercise.exercise_name} 
                        secondary={
                          <>
                            {exercise.sets && `Sets: ${exercise.sets}`}{exercise.reps && `, Reps: ${exercise.reps}`}
                            {exercise.weight_kg && `, Weight: ${exercise.weight_kg}kg`}
                            {exercise.duration_minutes && `, Duration: ${exercise.duration_minutes}min`}
                            {exercise.notes && <Typography variant="body2" color="textSecondary">Notes: {exercise.notes}</Typography>}
                          </>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography sx={{ textAlign: 'center', my: 2 }}>No exercises added to this plan yet.</Typography>
                )}
              </List>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      {selectedExerciseForLog && (
        <LogWorkoutModal
          open={logModalOpen}
          onClose={() => setLogModalOpen(false)}
          exercise={selectedExerciseForLog}
          token={token}
          // planId={currentPlanIdForLog} // Pass if needed
        />
      )}

      <Dialog open={deletePlanModalOpen} onClose={() => setDeletePlanModalOpen(false)}>
        <DialogTitle>Delete Workout Plan</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the plan "{planToDelete?.name}"? This action cannot be undone and will also remove all exercises associated with this plan.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletePlanModalOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDeletePlan} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={removeExerciseModalOpen} onClose={() => setRemoveExerciseModalOpen(false)}>
        <DialogTitle>Remove Exercise</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove "{exerciseToRemove?.exerciseName}" from this plan?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveExerciseModalOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmRemoveExercise} color="error">Remove</Button>
        </DialogActions>
      </Dialog>

      {/* --- Edit Exercise Modal --- */}
      {exerciseToEdit && (
        <Dialog open={editExerciseModalOpen} onClose={() => setEditExerciseModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Exercise: {exerciseToEdit.exercise_name}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField 
                label="Sets" 
                name="sets" 
                type="number" 
                value={editExerciseForm.sets ?? ''} 
                onChange={handleEditExerciseFormChange} 
                variant="outlined" 
                fullWidth 
                InputProps={{ inputProps: { min: 0 } }} 
              />
              <TextField 
                label="Reps (e.g., 8-12, AMRAP)" 
                name="reps" 
                value={editExerciseForm.reps ?? ''} 
                onChange={handleEditExerciseFormChange} 
                variant="outlined" 
                fullWidth 
              />
              <TextField 
                label="Weight (kg)" 
                name="weight_kg" 
                type="number" 
                value={editExerciseForm.weight_kg ?? ''} 
                onChange={handleEditExerciseFormChange} 
                variant="outlined" 
                fullWidth 
                InputProps={{ inputProps: { min: 0, step: "0.25" } }} 
              />
              <TextField 
                label="Duration (minutes)" 
                name="duration_minutes" 
                type="number" 
                value={editExerciseForm.duration_minutes ?? ''} 
                onChange={handleEditExerciseFormChange} 
                variant="outlined" 
                fullWidth 
                InputProps={{ inputProps: { min: 0 } }} 
              />
              <TextField 
                label="Rest Period (seconds)" 
                name="rest_period_seconds" 
                type="number" 
                value={editExerciseForm.rest_period_seconds ?? ''} 
                onChange={handleEditExerciseFormChange} 
                variant="outlined" 
                fullWidth 
                InputProps={{ inputProps: { min: 0 } }} 
              />
              <TextField
                label="Notes"
                name="notes"
                multiline
                rows={3}
                value={editExerciseForm.notes ?? ''}
                onChange={handleEditExerciseFormChange}
                variant="outlined"
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditExerciseModalOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmUpdateExercise} color="primary" disabled={isUpdatingExercise}>
              {isUpdatingExercise ? <CircularProgress size={24} /> : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

    </Box>
  );
};

export default MyPlans; 