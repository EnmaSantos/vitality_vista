import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserWorkoutPlans, WorkoutPlan, getPlanExercises, PlanExercise } from '../services/workoutApi';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, CircularProgress, List, ListItem, ListItemText } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const MyPlans: React.FC = () => {
  const { token } = useAuth();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | false>(false);
  const [planExercises, setPlanExercises] = useState<Record<number, PlanExercise[]>>({});

  useEffect(() => {
    const fetch = async () => {
      if (!token) return;
      try {
        const p = await getUserWorkoutPlans(token);
        setPlans(p);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [token]);

  const handleChange = (planId: number) => async (_: any, isExpanded: boolean) => {
    setExpanded(isExpanded ? planId : false);
    if (isExpanded && !planExercises[planId] && token) {
      try {
        const ex = await getPlanExercises(planId, token);
        setPlanExercises(prev => ({ ...prev, [planId]: ex }));
      } catch (err) { console.error(err); }
    }
  };

  if (loading) return (<Box sx={{ p:4, textAlign:'center' }}><CircularProgress /></Box>);

  return (
    <Box sx={{ p:4 }}>
      <Typography variant="h4" gutterBottom>My Workout Plans</Typography>
      {plans.length === 0 && <Typography>No plans yet.</Typography>}
      {plans.map(plan => (
        <Accordion key={plan.plan_id} expanded={expanded===plan.plan_id} onChange={handleChange(plan.plan_id)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ flexGrow:1 }}>{plan.name}</Typography>
            <Typography variant="caption">{planExercises[plan.plan_id]?.length ?? 0} exercises</Typography>
          </AccordionSummary>
          <AccordionDetails>
            { !planExercises[plan.plan_id] ? <CircularProgress size={20}/> : (
              planExercises[plan.plan_id].length === 0 ? <Typography>No exercises in this plan.</Typography> : (
                <List dense>
                  {planExercises[plan.plan_id].map(ex => (
                    <ListItem key={ex.plan_exercise_id}>
                      <ListItemText primary={ex.exercise_name} />
                    </ListItem>
                  ))}
                </List>
              )
            ) }
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default MyPlans; 