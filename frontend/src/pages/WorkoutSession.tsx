import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPlanExercises, PlanExercise, createWorkoutLog, deleteWorkoutLog, WorkoutLog, logExerciseDetails, LogExerciseDetailPayload } from '../api/workoutApi';
import { getExerciseById, Exercise } from '../services/exerciseApi';
import { ArrowBack as ArrowBackIcon, Close as CloseIcon, History as HistoryIcon, ListAlt as ListAltIcon, StopCircle as StopCircleIcon } from '@mui/icons-material';
import { Alert, Box, Typography, CircularProgress, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, TextField } from '@mui/material';
import Timer from '../components/Timer';
import ExerciseMedia from '../components/ExerciseMedia';

type SetData = {
    exercise_id: number;
    exercise_name: string;
    set_number: number;
    reps_achieved: number;
    weight_kg_used: number;
    duration_achieved_seconds: number;
};

const WorkoutSession = () => {
    const { planId, exerciseId } = useParams<{ planId?: string; exerciseId?: string }>();
    const { token } = useAuth();
    const navigate = useNavigate();

    const [exercises, setExercises] = useState<PlanExercise[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
    const [exerciseDetailsById, setExerciseDetailsById] = useState<Record<number, Exercise>>({});
    const [mediaLoading, setMediaLoading] = useState(false);
    const [currentSet, setCurrentSet] = useState<number>(1);
    const [workoutState, setWorkoutState] = useState<'idle' | 'active' | 'resting' | 'finished' | 'saving'>('idle');
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [endDialogOpen, setEndDialogOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [cancelDestination, setCancelDestination] = useState('/exercises');

    // State for logging
    const [workoutLog, setWorkoutLog] = useState<WorkoutLog | null>(null);
    const [completedSets, setCompletedSets] = useState<SetData[]>([]);
    const [currentReps, setCurrentReps] = useState<number | string>('');
    const [currentWeight, setCurrentWeight] = useState<number | string>('');

    // Timer states
    const [activeSetTime, setActiveSetTime] = useState(0);
    const activeSetIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [restTime, setRestTime] = useState(60);
    const [restTimeInput, setRestTimeInput] = useState<string>('60');

    // Effect to set initial rest time and form fields
    useEffect(() => {
        const currentExercise = exercises[currentExerciseIndex];
        if (currentExercise) {
            const restSeconds = currentExercise.rest_period_seconds || 60;
            setRestTime(restSeconds);
            setRestTimeInput(restSeconds.toString());
            setCurrentReps(currentExercise.reps || '');
            setCurrentWeight(currentExercise.weight_kg || '');
        }
    }, [currentExerciseIndex, currentSet, exercises]);

    // Helper function to convert Exercise to PlanExercise
    const convertExerciseToPlanExercise = (exercise: Exercise): PlanExercise => {
        return {
            plan_exercise_id: 0, // Not relevant for single exercise
            plan_id: 0, // Not relevant for single exercise
            exercise_id: exercise.id,
            exercise_name: exercise.name,
            order_in_plan: 1,
            sets: 3, // Default sets
            reps: "10", // Default reps
            weight_kg: undefined,
            duration_minutes: undefined,
            rest_period_seconds: 60, // Default rest
            notes: `Single exercise session: ${exercise.name}`
        };
    };

    useEffect(() => {
        const fetchExercises = async () => {
            if (!token) {
                setError("Authentication token not found.");
                setLoading(false);
                return;
            }

            if (planId) {
                try {
                    const response = await getPlanExercises(Number(planId), token);
                    if (response.success && response.data) {
                        setExercises(response.data);
                    } else {
                        setError(response.error || 'Failed to fetch plan exercises');
                    }
                } catch (err) {
                    setError('An unexpected error occurred while fetching exercises.');
                    console.error(err);
                }
            } else if (exerciseId) {
                try {
                    console.log("Fetching single exercise:", exerciseId);
                    const exerciseData = await getExerciseById(Number(exerciseId));
                    const planExercise = convertExerciseToPlanExercise(exerciseData);
                    setExerciseDetailsById({ [exerciseData.id]: exerciseData });
                    setExercises([planExercise]);
                } catch (err) {
                    setError('Failed to fetch exercise details.');
                    console.error(err);
                }
            } else {
                setError("No plan or exercise ID provided.");
                navigate('/my-plans');
            }
            setLoading(false);
        };

        fetchExercises();
    }, [planId, exerciseId, token, navigate]);

    useEffect(() => {
        const currentExercise = exercises[currentExerciseIndex];
        if (!currentExercise || exerciseDetailsById[currentExercise.exercise_id]) return;

        let cancelled = false;
        setMediaLoading(true);

        getExerciseById(currentExercise.exercise_id)
            .then((exercise) => {
                if (!cancelled) {
                    setExerciseDetailsById((current) => ({
                        ...current,
                        [exercise.id]: exercise,
                    }));
                }
            })
            .catch((mediaError) => {
                console.error('Failed to load exercise movement guide:', mediaError);
            })
            .finally(() => {
                if (!cancelled) setMediaLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [currentExerciseIndex, exerciseDetailsById, exercises]);

    useEffect(() => {
        if (workoutState === 'active') {
            activeSetIntervalRef.current = setInterval(() => {
                setActiveSetTime(prev => prev + 1);
            }, 1000);
        } else {
            if (activeSetIntervalRef.current) {
                clearInterval(activeSetIntervalRef.current);
            }
        }
        return () => {
            if (activeSetIntervalRef.current) {
                clearInterval(activeSetIntervalRef.current);
            }
        };
    }, [workoutState]);

    const handleStartWorkout = async () => {
        if (!token || exercises.length === 0) return;
        setWorkoutState('saving');
        try {
            const response = await createWorkoutLog({ 
                plan_id: planId ? Number(planId) : undefined, 
                workout_date: new Date().toISOString().split('T')[0] 
            }, token);

            if (response.success && response.data) {
                setWorkoutLog(response.data);
                setWorkoutState('active');
            } else {
                setError(response.error || 'Failed to create workout log.');
                setWorkoutState('idle');
            }
        } catch (err) {
            setError('An error occurred while starting workout.');
            setWorkoutState('idle');
        }
    };

    const handleFinishSet = () => {
        if (activeSetIntervalRef.current) clearInterval(activeSetIntervalRef.current);
        
        const currentExercise = exercises[currentExerciseIndex];
        const setData: SetData = {
            exercise_id: currentExercise.exercise_id,
            exercise_name: currentExercise.exercise_name,
            set_number: currentSet,
            reps_achieved: Number(currentReps),
            weight_kg_used: Number(currentWeight),
            duration_achieved_seconds: activeSetTime,
        };
        const updatedCompletedSets = [...completedSets, setData];
        setCompletedSets(updatedCompletedSets);

        if (currentSet < (currentExercise.sets || 1)) {
            setWorkoutState('resting');
        } else {
            if (currentExerciseIndex < exercises.length - 1) {
                setCurrentExerciseIndex(currentExerciseIndex + 1);
                setCurrentSet(1);
                setWorkoutState('active');
                setActiveSetTime(0);
            } else {
                finishWorkout(updatedCompletedSets);
            }
        }
    };

    const finishWorkout = async (setsToSave: SetData[] = completedSets) => {
        if (!token || !workoutLog) {
            setError("Cannot save workout: Log ID or token missing.");
            return;
        }
        setWorkoutState('saving');
        try {
            for (const set of setsToSave) {
                const payload: LogExerciseDetailPayload = { ...set };
                await logExerciseDetails(workoutLog.log_id, payload, token);
            }
            setWorkoutState('finished');
        } catch (err) {
            setError("Failed to save all workout details. Please check your workout history.");
            setWorkoutState('finished'); // Still finish UI-wise
        }
    };

    const handleStartNextSet = () => {
        setCurrentSet(currentSet + 1);
        setWorkoutState('active');
        setActiveSetTime(0);
    };

    const defaultExitDestination = planId ? '/my-plans' : '/exercises';
    const workoutIsInProgress = workoutState === 'active' || workoutState === 'resting';
    const navigationDisabled = workoutState === 'saving' || isCancelling;

    const handleNavigationRequest = (destination: string) => {
        if (workoutIsInProgress) {
            setCancelDestination(destination);
            setCancelError(null);
            setCancelDialogOpen(true);
            return;
        }

        navigate(destination);
    };

    const handleCancelWorkout = async () => {
        setIsCancelling(true);
        setCancelError(null);

        try {
            if (workoutLog) {
                const response = await deleteWorkoutLog(workoutLog.log_id, token);
                if (!response.success) {
                    throw new Error(response.error || 'Unable to cancel this workout.');
                }
            }

            if (activeSetIntervalRef.current) {
                clearInterval(activeSetIntervalRef.current);
            }
            navigate(cancelDestination, { replace: true });
        } catch (cancelWorkoutError) {
            setCancelError(cancelWorkoutError instanceof Error
                ? cancelWorkoutError.message
                : 'Unable to cancel this workout.');
        } finally {
            setIsCancelling(false);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
    };

    if (loading) {
        return (
            <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(defaultExitDestination)}
                >
                    {planId ? 'Back to My Plans' : 'Back to Exercises'}
                </Button>
                <Box role="status" sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ maxWidth: 760, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(defaultExitDestination)}
                    sx={{ mb: 3 }}
                >
                    {planId ? 'Back to My Plans' : 'Back to Exercises'}
                </Button>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    const currentExercise = exercises.length > 0 ? exercises[currentExerciseIndex] : null;
    const currentExerciseDetails = currentExercise
        ? exerciseDetailsById[currentExercise.exercise_id]
        : undefined;
    const currentExerciseMedia = currentExerciseDetails || (currentExercise ? {
        id: currentExercise.exercise_id,
        sourceId: String(currentExercise.exercise_id),
        name: currentExercise.exercise_name,
        category: 'exercise',
        bodyPart: 'exercise',
        equipment: 'workout equipment',
        target: 'movement guide',
        muscleGroup: 'movement guide',
        secondaryMuscles: [],
        instructions: [],
    } : null);

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, md: 3 }, py: 3 }}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.25}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                sx={{ mb: 3 }}
            >
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => handleNavigationRequest(defaultExitDestination)}
                    disabled={navigationDisabled}
                >
                    {planId ? 'Back to My Plans' : 'Back to Exercises'}
                </Button>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Button
                        startIcon={<ListAltIcon />}
                        onClick={() => handleNavigationRequest('/my-plans')}
                        disabled={navigationDisabled}
                    >
                        My Plans
                    </Button>
                    <Button
                        startIcon={<HistoryIcon />}
                        onClick={() => handleNavigationRequest('/workout-history')}
                        disabled={navigationDisabled}
                    >
                        History
                    </Button>
                    {workoutIsInProgress && (
                        <>
                            <Button
                                variant="outlined"
                                startIcon={<StopCircleIcon />}
                                onClick={() => setEndDialogOpen(true)}
                            >
                                End & Save
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<CloseIcon />}
                                onClick={() => {
                                    setCancelDestination(defaultExitDestination);
                                    setCancelDialogOpen(true);
                                }}
                            >
                                Cancel Workout
                            </Button>
                        </>
                    )}
                </Stack>
            </Stack>

            <Typography variant="h4" component="h1" gutterBottom>
                {exerciseId ? 'Single Exercise Workout' : 'Workout Session'}
            </Typography>

            {currentExerciseMedia && (
                <Box sx={{ maxWidth: 640, mb: 3, overflow: 'hidden', borderRadius: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.10)' }}>
                    <ExerciseMedia exercise={currentExerciseMedia} mode="animated" />
                    {mediaLoading && (
                        <Box role="status" sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25, bgcolor: 'background.paper' }}>
                            <CircularProgress size={18} />
                            <Typography variant="caption" color="text.secondary">
                                Loading movement guide...
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {workoutState === 'idle' && (
                <Button variant="contained" onClick={handleStartWorkout} disabled={exercises.length === 0}>
                    Start Workout
                </Button>
            )}

            {workoutState === 'finished' && (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography variant="h5" color="primary" gutterBottom>
                        Workout Finished! Well done!
                    </Typography>
                    <Button 
                        variant="contained" 
                        onClick={() => navigate('/workout-history')}
                        sx={{ mt: 2 }}
                    >
                        View Workout History
                    </Button>
                </Box>
            )}

            {currentExercise && (workoutState === 'active' || workoutState === 'resting') && (
                <Box>
                    <Typography variant="h5">{currentExercise.exercise_name}</Typography>
                    <Typography variant="h6">
                        Set {currentSet} of {currentExercise.sets || 1}
                    </Typography>
                    <Typography>Target Reps: {currentExercise.reps || 'N/A'}</Typography>
                    <Typography>Target Weight: {currentExercise.weight_kg ? `${currentExercise.weight_kg} kg` : 'N/A'}</Typography>
                    
                    <TextField
                        label="Reps Achieved"
                        type="number"
                        value={currentReps}
                        onChange={(e) => setCurrentReps(e.target.value)}
                        sx={{ mt: 2, mr: 2 }}
                    />
                    <TextField
                        label="Weight (kg)"
                        type="number"
                        value={currentWeight}
                        onChange={(e) => setCurrentWeight(e.target.value)}
                        sx={{ mt: 2 }}
                    />

                    {workoutState === 'active' && (
                        <Box sx={{ my: 2 }}>
                            <Typography variant="h4">{formatTime(activeSetTime)}</Typography>
                            <Typography variant="caption">Active Set Time</Typography>
                            <Button variant="contained" color="secondary" onClick={handleFinishSet} sx={{ mt: 2, display: 'block' }}>
                                Finish Set
                            </Button>
                        </Box>
                    )}

                    {workoutState === 'resting' && (
                        <Box sx={{ my: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography sx={{ mb: 2 }}>Time to rest!</Typography>
                            <TextField 
                                label="Rest time (seconds)"
                                type="number"
                                value={restTimeInput}
                                onChange={(e) => {
                                    const inputValue = e.target.value;
                                    setRestTimeInput(inputValue);
                                    
                                    // Only update actual restTime if the input is valid
                                    const numValue = Number(inputValue);
                                    if (inputValue !== '' && !isNaN(numValue) && numValue > 0) {
                                        setRestTime(numValue);
                                    }
                                }}
                                onBlur={() => {
                                    // If input is empty or invalid when focus is lost, reset to default
                                    if (restTimeInput === '' || Number(restTimeInput) <= 0 || isNaN(Number(restTimeInput))) {
                                        setRestTimeInput('60');
                                        setRestTime(60);
                                    }
                                }}
                                sx={{ mb: 2 }}
                                inputProps={{ min: 1 }}
                            />
                            <Timer duration={restTime} onFinish={handleStartNextSet} />
                        </Box>
                    )}
                </Box>
            )}

            {(workoutState === 'saving') && <CircularProgress />}

            <Dialog open={endDialogOpen} onClose={() => setEndDialogOpen(false)}>
                <DialogTitle>End this workout?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Completed sets will be saved to your workout history. The set currently in progress will not be included.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEndDialogOpen(false)}>
                        Keep Working Out
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setEndDialogOpen(false);
                            finishWorkout();
                        }}
                    >
                        End & Save Workout
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={cancelDialogOpen}
                onClose={isCancelling ? undefined : () => setCancelDialogOpen(false)}
            >
                <DialogTitle>Cancel this workout?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Your current session and unsaved sets will be discarded. This cannot be undone.
                    </DialogContentText>
                    {cancelError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {cancelError}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelDialogOpen(false)} disabled={isCancelling}>
                        Keep Working Out
                    </Button>
                    {cancelError && (
                        <Button color="warning" onClick={() => navigate(cancelDestination, { replace: true })}>
                            Exit Anyway
                        </Button>
                    )}
                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleCancelWorkout}
                        disabled={isCancelling}
                    >
                        {isCancelling ? 'Cancelling...' : 'Cancel Workout'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default WorkoutSession;
