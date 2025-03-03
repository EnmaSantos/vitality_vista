// frontend/src/pages/FoodLog.tsx
import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  TextField,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useThemeContext, themeColors } from '../context/ThemeContext';

interface FoodEntry {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: string;
  time: string;
}

const FoodLogPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [newFood, setNewFood] = useState<Partial<FoodEntry>>({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    mealType: 'breakfast',
    time: '08:00'
  });
  const { setCurrentThemeColor } = useThemeContext();
  
  useEffect(() => {
    setCurrentThemeColor(themeColors.earthYellow);
  }, [setCurrentThemeColor]);

  // Mock food log data
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([
    { 
      id: 1, 
      name: 'Oatmeal with Berries', 
      calories: 320, 
      protein: 12, 
      carbs: 54, 
      fat: 6, 
      mealType: 'breakfast',
      time: '08:00' 
    },
    { 
      id: 2, 
      name: 'Grilled Chicken Salad', 
      calories: 450, 
      protein: 40, 
      carbs: 20, 
      fat: 15, 
      mealType: 'lunch',
      time: '13:00' 
    },
    { 
      id: 3, 
      name: 'Protein Shake', 
      calories: 180, 
      protein: 25, 
      carbs: 10, 
      fat: 3, 
      mealType: 'snack',
      time: '16:30' 
    }
  ]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(event.target.value);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = event.target;
    setNewFood(prevFood => ({
      ...prevFood,
      [name]: value,
    }));
  };

  const handleAddFood = () => {
    const newEntry: FoodEntry = {
      ...newFood as FoodEntry,
      id: Date.now()
    };
    setFoodEntries([...foodEntries, newEntry]);
    setNewFood({
      name: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      mealType: 'breakfast',
      time: '08:00'
    });
    handleClose();
  };

  const handleDeleteFood = (id: number) => {
    setFoodEntries(foodEntries.filter(entry => entry.id !== id));
  };

  // Group food entries by meal type
  const groupedEntries = foodEntries.reduce((acc, entry) => {
    const mealType = entry.mealType;
    if (!acc[mealType]) {
      acc[mealType] = [];
    }
    acc[mealType].push(entry);
    return acc;
  }, {} as Record<string, FoodEntry[]>);

  // Calculate daily totals
  const dailyTotals = foodEntries.reduce((totals, entry) => {
    return {
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fat: totals.fat + entry.fat
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <Box sx={{ padding: 3, backgroundColor: '#fff9e6', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#283618ff' }}>
        Food Log
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, color: '#606c38ff' }}>
        Track your daily food intake and nutrition.
      </Typography>
      
      {/* Date selection and add food button */}
      <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="Date"
            type="date"
            value={currentDate}
            onChange={handleDateChange}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#dda15eff',
                },
                '&:hover fieldset': {
                  borderColor: '#bc6c25ff',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#bc6c25ff',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#606c38ff',
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={8} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleClickOpen}
            sx={{ 
              bgcolor: '#dda15eff', 
              '&:hover': { 
                bgcolor: '#bc6c25ff' 
              } 
            }}
          >
            Add Food
          </Button>
        </Grid>
      </Grid>

      {/* Daily nutrition summary */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Daily Nutrition Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: '#f5f5f5' }}>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary">
                  Calories
                </Typography>
                <Typography variant="h5">
                  {dailyTotals.calories}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: '#f5f5f5' }}>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary">
                  Protein
                </Typography>
                <Typography variant="h5">
                  {dailyTotals.protein}g
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: '#f5f5f5' }}>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary">
                  Carbs
                </Typography>
                <Typography variant="h5">
                  {dailyTotals.carbs}g
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card sx={{ bgcolor: '#f5f5f5' }}>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary">
                  Fat
                </Typography>
                <Typography variant="h5">
                  {dailyTotals.fat}g
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Food entries by meal type */}
      {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => (
        <Paper elevation={1} sx={{ p: 2, mb: 2 }} key={mealType}>
          <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
            {mealType}
          </Typography>
          <Divider sx={{ my: 1 }} />
          
          {groupedEntries[mealType] && groupedEntries[mealType].length > 0 ? (
            <List>
              {groupedEntries[mealType].map((entry) => (
                <ListItem key={entry.id} divider>
                  <Grid container alignItems="center">
                    <Grid item xs={6} md={4}>
                      <ListItemText 
                        primary={entry.name} 
                        secondary={`${entry.time}`} 
                      />
                    </Grid>
                    <Grid item xs={6} md={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', pr: { xs: 2, md: 0 } }}>
                        <Typography variant="body2">
                          {entry.calories} kcal
                        </Typography>
                        <Typography variant="body2">
                          P: {entry.protein}g
                        </Typography>
                        <Typography variant="body2">
                          C: {entry.carbs}g
                        </Typography>
                        <Typography variant="body2">
                          F: {entry.fat}g
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="edit" size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="delete" 
                          onClick={() => handleDeleteFood(entry.id)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </Grid>
                  </Grid>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
              No {mealType} entries yet. Add some food!
            </Typography>
          )}
        </Paper>
      ))}

      {/* Add Food Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Food Entry</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Food Name"
                name="name"
                value={newFood.name}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Meal Type</InputLabel>
                <Select
                  name="mealType"
                  value={newFood.mealType}
                  label="Meal Type"
                  onChange={handleInputChange}
                >
                  <MenuItem value="breakfast">Breakfast</MenuItem>
                  <MenuItem value="lunch">Lunch</MenuItem>
                  <MenuItem value="dinner">Dinner</MenuItem>
                  <MenuItem value="snack">Snack</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Time"
                type="time"
                name="time"
                value={newFood.time}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Calories"
                type="number"
                name="calories"
                value={newFood.calories}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth
                label="Protein (g)"
                type="number"
                name="protein"
                value={newFood.protein}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth
                label="Carbs (g)"
                type="number"
                name="carbs"
                value={newFood.carbs}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={4} sm={2}>
              <TextField
                fullWidth
                label="Fat (g)"
                type="number"
                name="fat"
                value={newFood.fat}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAddFood} variant="contained" color="primary">
            Add Food
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FoodLogPage;