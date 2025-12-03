import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Stack, Typography, TextField, IconButton, Button, CircularProgress, Snackbar, Alert, Box, Checkbox, FormControlLabel } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { Exercise } from '../services/exerciseApi';
import { createWorkoutLog, logExerciseDetail } from '../services/workoutLogApi';

interface LogWorkoutModalProps {
  open: boolean;
  exercise: Exercise | null;
  token: string | null;
  onClose: () => void;
  onLogged?: () => void;
}

const LogWorkoutModal: React.FC<LogWorkoutModalProps> = ({ open, exercise, token, onClose, onLogged }) => {
  const [currentWorkoutLog, setCurrentWorkoutLog] = useState<number | null>(null);
  const [form, setForm] = useState({ 
    sets: '', 
    reps: '', 
    weight: '', 
    duration: '', 
    distance: '', 
    intensity: '', 
    heartRate: '',
    pace: '',
    calories: '',
    notes: '' 
  });
  const [useBodyWeight, setUseBodyWeight] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{open:boolean; msg:string; severity:'success'|'error'}>({open:false,msg:'',severity:'success'});

  // Enhanced function to determine exercise type with better cardio detection
  const getExerciseType = (category: string | undefined, exerciseName: string | undefined): 'strength' | 'cardio' | 'stretching' => {
    if (!category && !exerciseName) return 'strength';
    
    const cat = category?.toLowerCase() || '';
    const name = exerciseName?.toLowerCase() || '';
    
    // More specific cardio detection
    if (cat.includes('cardio') || cat.includes('cardiovascular') || 
        name.includes('run') || name.includes('jog') || name.includes('cycle') || 
        name.includes('bike') || name.includes('swim') || name.includes('row') ||
        name.includes('walk') || name.includes('treadmill') || name.includes('elliptical') ||
        name.includes('jump') || name.includes('hiit') || name.includes('interval')) {
      return 'cardio';
    }
    
    if (cat.includes('stretch') || cat.includes('flexibility') || cat.includes('yoga') ||
        name.includes('stretch') || name.includes('yoga') || name.includes('mobility')) {
      return 'stretching';
    }
    
    return 'strength';
  };

  // Get specific cardio type for better calorie calculation
  const getCardioSubType = (exerciseName: string | undefined): string => {
    if (!exerciseName) return 'general';
    
    const name = exerciseName.toLowerCase();
    if (name.includes('run') || name.includes('jog')) return 'running';
    if (name.includes('cycle') || name.includes('bike')) return 'cycling';
    if (name.includes('swim')) return 'swimming';
    if (name.includes('walk')) return 'walking';
    if (name.includes('row')) return 'rowing';
    if (name.includes('hiit') || name.includes('interval')) return 'hiit';
    if (name.includes('elliptical')) return 'elliptical';
    
    return 'general';
  };

  const exerciseType = exercise ? getExerciseType(exercise.category, exercise.name) : 'strength';
  const cardioSubType = exerciseType === 'cardio' ? getCardioSubType(exercise?.name) : '';

  const resetState = () => {
    setForm({ 
      sets: '', 
      reps: '', 
      weight: '', 
      duration: '', 
      distance: '', 
      intensity: '', 
      heartRate: '',
      pace: '',
      calories: '',
      notes: '' 
    });
    setCurrentWorkoutLog(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!token || !exercise) {
      setSnackbar({open:true,msg:'Authentication required',severity:'error'});
      return;
    }

    // Different validation based on exercise type
    if (exerciseType === 'strength' && !form.sets) {
      setSnackbar({open:true,msg:'Enter number of sets',severity:'error'});
      return;
    }
    if ((exerciseType === 'cardio' || exerciseType === 'stretching') && !form.duration) {
      setSnackbar({open:true,msg:'Enter duration for this exercise',severity:'error'});
      return;
    }

    setIsSaving(true);
    try {
      let logId = currentWorkoutLog;
      if (!logId) {
        const newLog = await createWorkoutLog({}, token);
        logId = newLog.log_id;
        setCurrentWorkoutLog(logId);
      }

      // Build payload based on exercise type
      const payload: any = {
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        duration_achieved_seconds: form.duration ? parseInt(form.duration) * 60 : undefined, // Convert minutes to seconds
        notes: form.notes || undefined,
      };

      if (exerciseType === 'strength') {
        payload.set_number = parseInt(form.sets);
        payload.reps_achieved = form.reps ? parseInt(form.reps) : undefined;
        payload.weight_kg_used = form.weight ? parseFloat(form.weight) : undefined;
        payload.use_body_weight = useBodyWeight;
      } else {
        // For cardio and stretching, use set_number = 1 since they're typically single sessions
        payload.set_number = 1;
        
        // Enhanced cardio metrics handling
        if (exerciseType === 'cardio') {
          const cardioMetrics: string[] = [];
          
          if (form.distance) {
            cardioMetrics.push(`Distance: ${form.distance} km`);
          }
          if (form.pace) {
            cardioMetrics.push(`Pace: ${form.pace} min/km`);
          }
          if (form.heartRate) {
            cardioMetrics.push(`Heart Rate: ${form.heartRate} bpm`);
          }
          if (form.calories) {
            cardioMetrics.push(`Calories (manual): ${form.calories} cal`);
          }
          if (form.intensity) {
            cardioMetrics.push(`Intensity: ${form.intensity}/10`);
          }
          
          // Add cardio type info
          cardioMetrics.push(`Type: ${cardioSubType}`);
          
          if (cardioMetrics.length > 0) {
            const cardioNote = cardioMetrics.join('\n');
            payload.notes = payload.notes ? `${payload.notes}\n${cardioNote}` : cardioNote;
          }
        } else if (exerciseType === 'stretching' && form.intensity) {
          // Add intensity info for stretching
          const intensityNote = `Intensity: ${form.intensity}/10`;
          payload.notes = payload.notes ? `${payload.notes}\n${intensityNote}` : intensityNote;
        }
      }

      await logExerciseDetail(logId!, payload, token);
      setSnackbar({open:true,msg:`${exercise.name} logged!`,severity:'success'});
      onLogged && onLogged();
      handleClose();
    } catch (err:any) {
      console.error('log workout error', err);
      setSnackbar({open:true,msg: err?.message || 'Failed to log workout',severity:'error'});
    } finally {
      setIsSaving(false);
    }
  };

  const renderFormFields = () => {
    switch (exerciseType) {
      case 'cardio':
        return (
          <>
            <Typography variant="body2" color="#283618ff">
              Log your {cardioSubType} session details
            </Typography>
            <TextField 
              label="Duration (minutes)" 
              name="duration" 
              type="number" 
              value={form.duration} 
              onChange={handleChange} 
              fullWidth 
              required
              InputProps={{ inputProps:{min:1} }}
              helperText="How long did you exercise?"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField 
                label="Distance (km)" 
                name="distance" 
                type="number" 
                value={form.distance} 
                onChange={handleChange} 
                sx={{ flex: 1 }}
                InputProps={{ inputProps:{min:0, step:'0.1'} }}
                helperText="Distance covered"
              />
              <TextField 
                label="Pace (min/km)" 
                name="pace" 
                type="number" 
                value={form.pace} 
                onChange={handleChange} 
                sx={{ flex: 1 }}
                InputProps={{ inputProps:{min:0, step:'0.1'} }}
                helperText="Average pace"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField 
                label="Heart Rate (bpm)" 
                name="heartRate" 
                type="number" 
                value={form.heartRate} 
                onChange={handleChange} 
                sx={{ flex: 1 }}
                InputProps={{ inputProps:{min:40, max:220} }}
                helperText="Average heart rate"
              />
              <TextField 
                label="Intensity (1-10)" 
                name="intensity" 
                type="number" 
                value={form.intensity} 
                onChange={handleChange} 
                sx={{ flex: 1 }}
                InputProps={{ inputProps:{min:1, max:10} }}
                helperText="Effort level"
              />
            </Box>
            <TextField 
              label="Calories Burned (optional)" 
              name="calories" 
              type="number" 
              value={form.calories} 
              onChange={handleChange} 
              fullWidth 
              InputProps={{ inputProps:{min:1} }}
              helperText="Manual calorie input (if known from device)"
            />
            <TextField 
              label="Notes" 
              name="notes" 
              value={form.notes} 
              onChange={handleChange} 
              fullWidth 
              multiline 
              rows={2}
              helperText="Route, weather, equipment, how you felt, etc."
            />
          </>
        );

      case 'stretching':
        return (
          <>
            <Typography variant="body2" color="#283618ff">Log your stretching session</Typography>
            <TextField 
              label="Duration (minutes)" 
              name="duration" 
              type="number" 
              value={form.duration} 
              onChange={handleChange} 
              fullWidth 
              InputProps={{ inputProps:{min:1} }}
              helperText="Total stretching time"
            />
            <TextField 
              label="Intensity (1-10) - Optional" 
              name="intensity" 
              type="number" 
              value={form.intensity} 
              onChange={handleChange} 
              fullWidth 
              InputProps={{ inputProps:{min:1, max:10} }}
              helperText="How deep/intense was the stretch?"
            />
            <TextField 
              label="Notes" 
              name="notes" 
              value={form.notes} 
              onChange={handleChange} 
              fullWidth 
              multiline 
              rows={3}
              helperText="Areas stretched, flexibility improvements, etc."
            />
          </>
        );

      default: // strength
        return (
          <>
            <Typography variant="body2" color="#283618ff">Log your actual performance for this exercise</Typography>
            <TextField 
              label="Sets Completed" 
              name="sets" 
              type="number" 
              value={form.sets} 
              onChange={handleChange} 
              fullWidth 
              InputProps={{ inputProps:{min:1} }} 
            />
            <TextField 
              label="Reps Achieved" 
              name="reps" 
              type="number" 
              value={form.reps} 
              onChange={handleChange} 
              fullWidth 
              InputProps={{ inputProps:{min:0} }} 
            />
            <TextField 
              label="Weight Used (kg)" 
              name="weight" 
              type="number" 
              value={form.weight} 
              onChange={handleChange} 
              fullWidth 
              InputProps={{ inputProps:{min:0, step:'0.25'} }} 
            />
            <FormControlLabel
              control={<Checkbox checked={useBodyWeight} onChange={(e) => setUseBodyWeight(e.target.checked)} name="useBodyWeight" />}
              label="Use Body Weight"
            />
            <TextField 
              label="Duration (minutes) - Optional" 
              name="duration" 
              type="number" 
              value={form.duration} 
              onChange={handleChange} 
              fullWidth 
              InputProps={{ inputProps:{min:0} }}
              helperText="Time spent on this exercise (optional)"
            />
            <TextField 
              label="Notes" 
              name="notes" 
              value={form.notes} 
              onChange={handleChange} 
              fullWidth 
              multiline 
              rows={3} 
            />
          </>
        );
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#606c38ff', color: 'white' }}>
          {exercise ? `Log "${exercise.name}" Workout` : 'Log Workout'}
          {exercise && (
            <Typography variant="caption" display="block" sx={{ color: '#e0e0e0', mt: 0.5 }}>
              {exercise.category} • {exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)} Exercise
            </Typography>
          )}
          <IconButton aria-label="close" onClick={handleClose} sx={{ position:'absolute', right:8, top:8, color:'#eee' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: '#fefae0' }}>
          <Stack spacing={2} mt={1}>
            {renderFormFields()}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ backgroundColor:'#fefae0', borderTop:'1px solid #dda15eff' }}>
          <Button onClick={handleClose} sx={{ color:'#bc6c25ff' }}>Cancel</Button>
          <Button 
            variant="contained" 
            startIcon={<FitnessCenterIcon />} 
            onClick={handleSave} 
            disabled={isSaving || (exerciseType === 'strength' && !form.sets) || ((exerciseType === 'cardio' || exerciseType === 'stretching') && !form.duration)} 
            sx={{ bgcolor:'#606c38ff', '&:hover':{ bgcolor:'#283618ff' } }}
          >
            {isSaving ? <CircularProgress size={20} /> : 'Save Workout'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={()=>setSnackbar(prev=>({...prev,open:false}))} anchorOrigin={{ vertical:'bottom', horizontal:'left' }}>
        <Alert onClose={()=>setSnackbar(prev=>({...prev,open:false}))} severity={snackbar.severity} sx={{ width:'100%' }}>{snackbar.msg}</Alert>
      </Snackbar>
    </>
  );
};

export default LogWorkoutModal; 