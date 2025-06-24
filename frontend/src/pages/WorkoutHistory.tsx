import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FitnessCenter as FitnessCenterIcon,
  Schedule as ScheduleIcon,
  Notes as NotesIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useThemeContext, themeColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getUserWorkoutLogs, getWorkoutLogDetails, WorkoutLog, LogExerciseDetail } from '../services/workoutLogApi';
import { format, formatDistanceToNow } from 'date-fns';

// Helper interface to group exercises by name
interface ExerciseGroup {
  exerciseName: string;
  exerciseId: number;
  sets: LogExerciseDetail[];
}

const WorkoutHistory: React.FC = () => {
  const { setCurrentThemeColor } = useThemeContext();
  const { token } = useAuth();
  
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [exerciseDetails, setExerciseDetails] = useState<Record<number, LogExerciseDetail[]>>({});
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<number | false>(false);

  useEffect(() => {
    setCurrentThemeColor(themeColors.darkMossGreen);
  }, [setCurrentThemeColor]);

  const fetchWorkoutLogs = async () => {
    if (!token) {
      setError('Authentication required');
      setLoadingLogs(false);
      return;
    }

    try {
      setLoadingLogs(true);
      setError(null);
      const logs = await getUserWorkoutLogs(token);
      setWorkoutLogs(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workout history');
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchExerciseDetails = async (logId: number) => {
    if (!token || exerciseDetails[logId] || loadingDetails[logId]) return;

    try {
      setLoadingDetails(prev => ({ ...prev, [logId]: true }));
      const details = await getWorkoutLogDetails(logId, token);
      setExerciseDetails(prev => ({ ...prev, [logId]: details }));
    } catch (err) {
      console.error('Failed to fetch exercise details:', err);
    } finally {
      setLoadingDetails(prev => ({ ...prev, [logId]: false }));
    }
  };

  const handleAccordionChange = (logId: number) => (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedLog(isExpanded ? logId : false);
    if (isExpanded) {
      fetchExerciseDetails(logId);
    }
  };

  const groupExercisesByName = (details: LogExerciseDetail[]): ExerciseGroup[] => {
    const groups: Record<string, ExerciseGroup> = {};
    
    details.forEach(detail => {
      if (!groups[detail.exercise_name]) {
        groups[detail.exercise_name] = {
          exerciseName: detail.exercise_name,
          exerciseId: detail.exercise_id,
          sets: []
        };
      }
      groups[detail.exercise_name].sets.push(detail);
    });

    return Object.values(groups);
  };

  const formatWorkoutDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      formatted: format(date, 'MMMM d, yyyy'),
      time: format(date, 'h:mm a'),
      relative: formatDistanceToNow(date, { addSuffix: true })
    };
  };

  const getWorkoutStats = (details: LogExerciseDetail[]) => {
    const exerciseCount = new Set(details.map(d => d.exercise_name)).size;
    const totalSets = details.length;
    const totalWeight = details.reduce((sum, d) => sum + (d.weight_kg_used || 0), 0);
    
    return {
      exerciseCount,
      totalSets,
      totalWeight: totalWeight > 0 ? totalWeight : null
    };
  };

  useEffect(() => {
    fetchWorkoutLogs();
  }, [token]);

  if (loadingLogs) {
    return (
      <Box sx={{ padding: 3, backgroundColor: '#edf0e9', minHeight: '100vh' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress sx={{ color: '#606c38ff' }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3, backgroundColor: '#edf0e9', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ color: '#283618ff' }}>
            Workout History
          </Typography>
          <Typography variant="subtitle1" sx={{ color: '#606c38ff' }}>
            Review your past workouts and track your progress over time.
          </Typography>
        </Box>
        <Tooltip title="Refresh history">
          <IconButton 
            onClick={fetchWorkoutLogs}
            sx={{ color: '#606c38ff' }}
            disabled={loadingLogs}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Summary Stats */}
      {workoutLogs.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderTop: '3px solid #606c38ff' }}>
              <CardContent>
                <Typography color="#606c38ff" gutterBottom>
                  Total Workouts
                </Typography>
                <Typography variant="h4" sx={{ color: '#283618ff' }}>
                  {workoutLogs.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderTop: '3px solid #606c38ff' }}>
              <CardContent>
                <Typography color="#606c38ff" gutterBottom>
                  This Month
                </Typography>
                <Typography variant="h4" sx={{ color: '#283618ff' }}>
                  {workoutLogs.filter(log => {
                    const logDate = new Date(log.log_date);
                    const now = new Date();
                    return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
                  }).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderTop: '3px solid #606c38ff' }}>
              <CardContent>
                <Typography color="#606c38ff" gutterBottom>
                  Average Duration
                </Typography>
                <Typography variant="h4" sx={{ color: '#283618ff' }}>
                  {Math.round(
                    workoutLogs
                      .filter(log => log.duration_minutes)
                      .reduce((sum, log) => sum + (log.duration_minutes || 0), 0) /
                    workoutLogs.filter(log => log.duration_minutes).length || 0
                  )}m
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderTop: '3px solid #606c38ff' }}>
              <CardContent>
                <Typography color="#606c38ff" gutterBottom>
                  Last Workout
                </Typography>
                <Typography variant="h4" sx={{ color: '#283618ff' }}>
                  {workoutLogs.length > 0 
                    ? formatWorkoutDate(workoutLogs[0].log_date).relative
                    : 'N/A'
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Workout History List */}
      {workoutLogs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderTop: '3px solid #606c38ff' }}>
          <FitnessCenterIcon sx={{ fontSize: 48, color: '#606c38ff', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#283618ff', mb: 1 }}>
            No workout history yet
          </Typography>
          <Typography color="#606c38ff">
            Start logging your workouts to see your progress here.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {workoutLogs.map((log) => {
            const dateInfo = formatWorkoutDate(log.log_date);
            const details = exerciseDetails[log.log_id] || [];
            const stats = details.length > 0 ? getWorkoutStats(details) : null;
            const exerciseGroups = details.length > 0 ? groupExercisesByName(details) : [];

            return (
              <Accordion
                key={log.log_id}
                expanded={expandedLog === log.log_id}
                onChange={handleAccordionChange(log.log_id)}
                sx={{ 
                  mb: 1,
                  borderTop: '2px solid #606c38ff',
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: '#606c38ff' }} />}
                  sx={{ 
                    bgcolor: '#f9fbf7',
                    '&:hover': { bgcolor: '#f0f4ec' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                    <FitnessCenterIcon sx={{ color: '#606c38ff' }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ color: '#283618ff' }}>
                        {log.plan_name || `Workout ${log.log_id}`}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ color: '#606c38ff' }}>
                          {dateInfo.formatted} at {dateInfo.time}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888' }}>
                          • {dateInfo.relative}
                        </Typography>
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      {log.duration_minutes && (
                        <Chip 
                          icon={<ScheduleIcon />}
                          label={`${log.duration_minutes}m`}
                          size="small"
                          sx={{ bgcolor: '#e8f5e8', color: '#606c38ff' }}
                        />
                      )}
                      {stats && (
                        <Chip 
                          label={`${stats.exerciseCount} exercises`}
                          size="small"
                          sx={{ bgcolor: '#e8f5e8', color: '#606c38ff' }}
                        />
                      )}
                    </Stack>
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails sx={{ bgcolor: '#fefae0', p: 3 }}>
                  {loadingDetails[log.log_id] ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} sx={{ color: '#606c38ff' }} />
                    </Box>
                  ) : exerciseGroups.length > 0 ? (
                    <Box>
                      {/* Workout Summary */}
                      {stats && (
                        <Box sx={{ mb: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ color: '#283618ff', mb: 1 }}>
                            Workout Summary
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="#606c38ff">
                                Exercises: <strong>{stats.exerciseCount}</strong>
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="#606c38ff">
                                Total Sets: <strong>{stats.totalSets}</strong>
                              </Typography>
                            </Grid>
                            {stats.totalWeight && (
                              <Grid item xs={4}>
                                <Typography variant="body2" color="#606c38ff">
                                  Total Weight: <strong>{stats.totalWeight.toFixed(1)} kg</strong>
                                </Typography>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      )}

                      {/* Exercise Details */}
                      <Typography variant="subtitle2" sx={{ color: '#283618ff', mb: 2 }}>
                        Exercises Performed
                      </Typography>
                      {exerciseGroups.map((group, index) => (
                        <Box key={group.exerciseName} sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ color: '#606c38ff', mb: 1 }}>
                            {group.exerciseName}
                          </Typography>
                          <Grid container spacing={1}>
                            {group.sets.map((set, setIndex) => (
                              <Grid item xs={12} sm={6} md={4} key={set.log_exercise_id}>
                                <Paper sx={{ p: 1.5, bgcolor: '#fff', border: '1px solid #e0e0e0' }}>
                                  <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold' }}>
                                    Set {set.set_number}
                                  </Typography>
                                  <Stack direction="row" spacing={1} mt={0.5}>
                                    {set.reps_achieved && (
                                      <Chip 
                                        label={`${set.reps_achieved} reps`}
                                        size="small"
                                        variant="outlined"
                                      />
                                    )}
                                    {set.weight_kg_used && (
                                      <Chip 
                                        label={`${set.weight_kg_used} kg`}
                                        size="small"
                                        variant="outlined"
                                      />
                                    )}
                                    {set.duration_achieved_seconds && (
                                      <Chip 
                                        label={`${Math.floor(set.duration_achieved_seconds / 60)}:${(set.duration_achieved_seconds % 60).toString().padStart(2, '0')}`}
                                        size="small"
                                        variant="outlined"
                                      />
                                    )}
                                  </Stack>
                                  {set.notes && (
                                    <Typography variant="caption" sx={{ color: '#666', mt: 1, display: 'block' }}>
                                      {set.notes}
                                    </Typography>
                                  )}
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                          {index < exerciseGroups.length - 1 && <Divider sx={{ mt: 2 }} />}
                        </Box>
                      ))}

                      {/* Workout Notes */}
                      {log.notes && (
                        <Box sx={{ mt: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                            <NotesIcon sx={{ fontSize: 16, color: '#606c38ff' }} />
                            <Typography variant="subtitle2" sx={{ color: '#283618ff' }}>
                              Workout Notes
                            </Typography>
                          </Stack>
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            {log.notes}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Typography color="#666" sx={{ textAlign: 'center', py: 2 }}>
                      No exercise details available for this workout.
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default WorkoutHistory; 