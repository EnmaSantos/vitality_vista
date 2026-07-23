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
  UpdatePlanExerciseData,
  updateWorkoutPlan,
  UpdateWorkoutPlanPayload,
} from '../api/workoutApi';
import { Accordion, AccordionSummary, AccordionDetails, Alert, Typography, Button, List, ListItem, ListItemText, IconButton, Box, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Stack } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import LogWorkoutModal from '../components/LogWorkoutModal';
import { ExerciseSummary } from '../services/exerciseApi';

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
  const [selectedExerciseForLog, setSelectedExerciseForLog] = useState<ExerciseSummary | null>(null);

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
  
  // --- State for Edit Plan Modal ---
  const [editPlanModalOpen, setEditPlanModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<WorkoutPlan | null>(null);
  const [editPlanForm, setEditPlanForm] = useState<UpdateWorkoutPlanPayload>({ name: '', description: '' });
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  
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
    } finally {
      setLoadingPlans(false);
    }
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

  const handleLogWorkout = (exercise: PlanExercise) => {
    const exerciseDetailForModal: ExerciseSummary = {
      id: exercise.exercise_id,
      sourceId: String(exercise.exercise_id),
      name: exercise.exercise_name,
      category: 'planned exercise',
      bodyPart: 'not available',
      equipment: 'various',
      target: 'not available',
      muscleGroup: 'not available',
      secondaryMuscles: [],
    };
    setSelectedExerciseForLog(exerciseDetailForModal);
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

  // --- Handlers for Edit Plan Modal ---
  const handleOpenEditPlanModal = (plan: WorkoutPlan) => {
    setPlanToEdit(plan);
    setEditPlanForm({
      name: plan.name,
      description: plan.description || ''
    });
    setEditPlanModalOpen(true);
  };

  const handleCloseEditPlanModal = () => {
    setEditPlanModalOpen(false);
    setPlanToEdit(null);
    setEditPlanForm({ name: '', description: '' });
  };

  const handleEditPlanFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setEditPlanForm(prev => ({ ...prev, [name]: value }));
  };

  const handleConfirmUpdatePlan = async () => {
    if (!planToEdit || !token) {
      setError("Cannot update plan: Missing data or token.");
      return;
    }
    setIsUpdatingPlan(true);
    setError(null);

    try {
      const response = await updateWorkoutPlan(planToEdit.plan_id, editPlanForm, token);
      if (response.success && response.data) {
        setPlans(prevPlans => prevPlans.map(p => p.plan_id === response.data!.plan_id ? response.data! : p));
        handleCloseEditPlanModal();
      } else {
        setError(response.error || 'Failed to update plan.');
      }
    } catch (err) {
      setError('An unexpected error occurred while updating the plan.');
      console.error(err);
    } finally {
      setIsUpdatingPlan(false);
    }
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
    navigate('/workouts/exercises/plan-builder', { state: { openCreatePlanModal: true } });
  };

  const workoutNavigation = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      justifyContent="space-between"
      sx={{ mb: 3 }}
    >
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/workouts/exercises')}
      >
        Exercise Library
      </Button>
      <Button
        startIcon={<HistoryIcon />}
        onClick={() => navigate('/workout-history')}
      >
        Workout History
      </Button>
    </Stack>
  );
  
  if (loadingPlans) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', px: 2, py: 5 }}>
        {workoutNavigation}
        <Typography variant="h4" component="h1" gutterBottom>
          My Workout Plans
        </Typography>
        <Box role="status" aria-live="polite" sx={{ mt: 5, textAlign: 'center' }}>
          <CircularProgress size={32} />
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Loading your workout plans...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, py: 5 }}>
        {workoutNavigation}
        <Typography variant="h4" component="h1" gutterBottom>
          My Workout Plans
        </Typography>
        <Alert
          severity="error"
          action={(
            <Button color="inherit" size="small" onClick={fetchUserPlans}>
              Try again
            </Button>
          )}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (plans.length === 0) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, py: 5, textAlign: 'center' }}>
        {workoutNavigation}
        <Typography variant="h4" component="h1" gutterBottom>
          My Workout Plans
        </Typography>
        <Box sx={{ mt: 4, p: { xs: 3, sm: 5 }, border: 1, borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="h6">No workout plans yet</Typography>
          <Typography sx={{ mt: 1, mb: 3, color: 'text.secondary' }}>
            Build your first plan from the exercise library, then return here to start it.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
            <Button variant="contained" onClick={handleNavigateToCreatePlan}>
              Create Your First Plan
            </Button>
            <Button variant="outlined" onClick={() => navigate('/workouts/exercises')}>
              Browse Exercises
            </Button>
          </Stack>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', padding: 2 }}>
      {workoutNavigation}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
        <Typography variant="h4" gutterBottom sx={{ textAlign: 'left', flexGrow: 1 }}>
            My Workout Plans
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />} 
              onClick={handleNavigateToCreatePlan}
          >
              Create New Plan
          </Button>
        </Box>
      </Box>
      <Box sx={{ my: 4 }}>
        {loadingPlans ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : plans.length === 0 ? (
          <Typography>You haven't created any workout plans yet.</Typography>
        ) : (
          plans.map(plan => (
            <Accordion key={plan.plan_id} expanded={expandedPlan === plan.plan_id} onChange={handleAccordionChange(plan.plan_id)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`plan-${plan.plan_id}-content`} id={`plan-${plan.plan_id}-header`}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography sx={{ flexGrow: 1, fontWeight: 'medium' }}>{plan.name}</Typography>
                  <IconButton 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleOpenEditPlanModal(plan);
                    }} 
                    aria-label="edit plan"
                  >
                      <EditIcon />
                  </IconButton>
                  <IconButton onClick={(e) => { e.stopPropagation(); handleOpenDeletePlanModal(plan); }} aria-label="delete plan">
                    <DeleteIcon />
                  </IconButton>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<PlayCircleOutlineIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/workout/session/${plan.plan_id}`);
                    }}
                    sx={{ ml: 2, borderRadius: '20px' }}
                  >
                    Start Plan
                  </Button>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {plan.description || 'No description for this plan.'}
                </Typography>
                {loadingExercises[plan.plan_id] && <CircularProgress />}
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
                                        onClick={() => handleLogWorkout(exercise)}
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
          ))
        )}
      </Box>

      {selectedExerciseForLog && (
        <LogWorkoutModal
          open={logModalOpen}
          onClose={() => setLogModalOpen(false)}
          exercise={selectedExerciseForLog}
          token={token}
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

      {/* Edit Plan Modal */}
      <Dialog open={editPlanModalOpen} onClose={handleCloseEditPlanModal}>
        <DialogTitle>Edit Workout Plan</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Update the name and description of your workout plan.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            name="name"
            label="Plan Name"
            type="text"
            fullWidth
            variant="standard"
            value={editPlanForm.name}
            onChange={handleEditPlanFormChange}
          />
          <TextField
            margin="dense"
            id="description"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="standard"
            value={editPlanForm.description}
            onChange={handleEditPlanFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditPlanModal}>Cancel</Button>
          <Button onClick={handleConfirmUpdatePlan} disabled={isUpdatingPlan}>
            {isUpdatingPlan ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Exercise Modal */}
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
