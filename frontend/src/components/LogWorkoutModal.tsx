import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Stack, Typography, TextField, IconButton, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
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
  const [form, setForm] = useState({ sets: '', reps: '', weight: '', duration: '', notes: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{open:boolean; msg:string; severity:'success'|'error'}>({open:false,msg:'',severity:'success'});

  const resetState = () => {
    setForm({ sets: '', reps: '', weight: '', duration: '', notes: '' });
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
    if (!form.sets) {
      setSnackbar({open:true,msg:'Enter number of sets',severity:'error'});
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
      await logExerciseDetail(logId!, {
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        set_number: parseInt(form.sets),
        reps_achieved: form.reps ? parseInt(form.reps) : undefined,
        weight_kg_used: form.weight ? parseFloat(form.weight) : undefined,
        duration_achieved_seconds: form.duration ? parseInt(form.duration) : undefined,
        notes: form.notes || undefined,
      }, token);
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

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#606c38ff', color: 'white' }}>
          {exercise ? `Log "${exercise.name}" Workout` : 'Log Workout'}
          <IconButton aria-label="close" onClick={handleClose} sx={{ position:'absolute', right:8, top:8, color:'#eee' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: '#fefae0' }}>
          <Stack spacing={2} mt={1}>
            <Typography variant="body2" color="#283618ff">Log your actual performance for this exercise</Typography>
            <TextField label="Sets Completed" name="sets" type="number" value={form.sets} onChange={handleChange} fullWidth InputProps={{ inputProps:{min:1} }} />
            <TextField label="Reps Achieved" name="reps" type="number" value={form.reps} onChange={handleChange} fullWidth InputProps={{ inputProps:{min:0} }} />
            <TextField label="Weight Used (kg)" name="weight" type="number" value={form.weight} onChange={handleChange} fullWidth InputProps={{ inputProps:{min:0, step:'0.25'} }} />
            <TextField label="Duration (seconds)" name="duration" type="number" value={form.duration} onChange={handleChange} fullWidth InputProps={{ inputProps:{min:0} }} />
            <TextField label="Notes" name="notes" value={form.notes} onChange={handleChange} fullWidth multiline rows={3} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ backgroundColor:'#fefae0', borderTop:'1px solid #dda15eff' }}>
          <Button onClick={handleClose} sx={{ color:'#bc6c25ff' }}>Cancel</Button>
          <Button variant="contained" startIcon={<FitnessCenterIcon />} onClick={handleSave} disabled={isSaving || !form.sets} sx={{ bgcolor:'#606c38ff', '&:hover':{ bgcolor:'#283618ff' } }}>
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