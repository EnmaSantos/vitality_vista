import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getUserWorkoutPlans, 
  getPlanExercises, 
  WorkoutPlan, 
  PlanExercise, 
  deleteWorkoutPlan,
  removeExerciseFromPlan
} from '../api/workoutApi';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Button, List, ListItem, ListItemText, IconButton, Box, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LogWorkoutModal from '../components/LogWorkoutModal';
import { ExerciseDetail } from '../api/exercisesApi';

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
  const [selectedExerciseForLog, setSelectedExerciseForLog] = useState<ExerciseDetail | null>(null);
  const [currentPlanIdForLog, setCurrentPlanIdForLog] = useState<number | null>(null);

  // State for delete confirmation
  const [deletePlanModalOpen, setDeletePlanModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<WorkoutPlan | null>(null);
  const [removeExerciseModalOpen, setRemoveExerciseModalOpen] = useState(false);
  const [exerciseToRemove, setExerciseToRemove] = useState<{planId: number, planExerciseId: number, exerciseName: string} | null>(null);
  
  // TODO: Edit plan state (for future implementation)
  // const [editPlanModalOpen, setEditPlanModalOpen] = useState(false);
  // const [planToEdit, setPlanToEdit] = useState<WorkoutPlan | null>(null);

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
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching plans.');
      console.error(err);
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
    const exerciseDetailForModal: ExerciseDetail = {
        id: exercise.exercise_id, 
        name: exercise.exercise_name,
        description: exercise.notes || '', 
        category: 0, // Placeholder - this might need to come from PlanExercise if available or fetched
        equipment: [], // Placeholder - same as category
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
    if (!planToDelete || !token) { 
        setError("Cannot delete plan: Missing plan data or authentication token."); 
        setDeletePlanModalOpen(false);
        return; 
    }
    const response = await deleteWorkoutPlan(planToDelete.plan_id, token);
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
    if (!exerciseToRemove || !token) { 
        setError("Cannot remove exercise: Missing exercise data or authentication token.");
        setRemoveExerciseModalOpen(false);
        return; 
    }
    const { planId, planExerciseId } = exerciseToRemove;
    const response = await removeExerciseFromPlan(planId, planExerciseId, token);
    if (response.success) {
      fetchPlanExercisesForPlan(planId); 
    } else {
      setError(response.error || 'Failed to remove exercise from plan.');
    }
    setRemoveExerciseModalOpen(false);
    setExerciseToRemove(null);
  };
  
  // TODO: Placeholder for edit plan functionality
  // const handleOpenEditPlanModal = (plan: WorkoutPlan) => { 
  //   setPlanToEdit(plan); 
  //   setEditPlanModalOpen(true); 
  // };
  // const handleSaveEditedPlan = async (editedPlanData) => { /* ... API call ... */ };

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
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>
          Create a Plan
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center' }}>My Workout Plans</Typography>
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
                {/* Exercise count display - refined to show only when loaded */}
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
                    e.stopPropagation(); // Prevent accordion toggle
                    // handleOpenEditPlanModal(plan); // TODO: Implement edit functionality
                    alert('Edit functionality coming soon!');
                  }}
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={(e) => { 
                    e.stopPropagation(); // Prevent accordion toggle
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
                                <Button 
                                    variant="outlined" 
                                    size="small"
                                    onClick={() => handleLogWorkout(exercise, plan.plan_id)}
                                    sx={{ mr: 1 }}
                                >
                                    Log This Exercise
                                </Button>
                                <IconButton 
                                    edge="end" 
                                    aria-label="remove exercise"
                                    onClick={() => handleOpenRemoveExerciseModal(plan.plan_id, exercise.plan_exercise_id, exercise.exercise_name)}
                                >
                                    <DeleteIcon />
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

      {/* Log Workout Modal */}
      {selectedExerciseForLog && (
        <LogWorkoutModal
          open={logModalOpen}
          onClose={() => setLogModalOpen(false)}
          exercise={selectedExerciseForLog}
          planId={currentPlanIdForLog}
          token={token}
        />
      )}

      {/* Delete Plan Confirmation Modal */}
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

      {/* Remove Exercise from Plan Confirmation Modal */}
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

      {/* TODO: Edit Plan Modal (Future) */}
      {/* <Dialog open={editPlanModalOpen} onClose={() => setEditPlanModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Workout Plan</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Plan Name" type="text" fullWidth variant="standard" defaultValue={planToEdit?.name} />
          <TextField margin="dense" label="Description" type="text" fullWidth multiline rows={3} variant="standard" defaultValue={planToEdit?.description} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPlanModalOpen(false)}>Cancel</Button>
          <Button onClick={() => { /* handleSaveEditedPlan */ alert('Save edit coming soon!'); setEditPlanModalOpen(false); } }>Save</Button>
        </DialogActions>
      </Dialog> */}

    </Box>
  );
};

export default MyPlans; 