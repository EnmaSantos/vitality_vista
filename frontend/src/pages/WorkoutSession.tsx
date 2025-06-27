import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPlanExercises, PlanExercise, createWorkoutLog, WorkoutLog, logExerciseDetails, LogExerciseDetailPayload } from '../api/workoutApi';
import { getExerciseById, Exercise } from '../services/exerciseApi';
import { Box, Typography, CircularProgress, List, ListItem, ListItemText, Button, TextField } from '@mui/material';
import Timer from '../components/Timer';

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
    const [currentSet, setCurrentSet] = useState<number>(1);
    const [workoutState, setWorkoutState] = useState<'idle' | 'active' | 'resting' | 'finished' | 'saving'>('idle');

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
            duration_minutes: exercise.duration_minutes || undefined,
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
        setCompletedSets(prev => [...prev, setData]);

        if (currentSet < (currentExercise.sets || 1)) {
            setWorkoutState('resting');
        } else {
            if (currentExerciseIndex < exercises.length - 1) {
                setCurrentExerciseIndex(currentExerciseIndex + 1);
                setCurrentSet(1);
                setWorkoutState('active');
                setActiveSetTime(0);
            } else {
                finishWorkout();
            }
        }
    };

    const finishWorkout = async () => {
        if (!token || !workoutLog) {
            setError("Cannot save workout: Log ID or token missing.");
            return;
        }
        setWorkoutState('saving');
        try {
            for (const set of completedSets) {
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

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Typography color="error" sx={{ mt: 4 }}>{error}</Typography>;
    }

    const currentExercise = exercises.length > 0 ? exercises[currentExerciseIndex] : null;

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                {exerciseId ? 'Single Exercise Workout' : 'Workout Session'}
            </Typography>

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
        </Box>
    );
};

export default WorkoutSession; 