// frontend/src/pages/FoodLog.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
  MenuItem,
  CircularProgress,
  Alert,
  InputAdornment,
  DialogContentText,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useThemeContext, themeColors } from '../context/ThemeContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  NutritionData,
  FoodLogEntry,
  CreateFoodLogEntryPayload,
  searchFoodsAPI,
  createFoodLogEntryAPI,
} from '../services/foodLogApi.ts';

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced;
}

interface CurrentFoodEntry {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: string;
  time: string;
}

const FoodLog: React.FC = () => {
  const { setCurrentThemeColor } = useThemeContext();
  const auth = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NutritionData[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedFoodForDialog, setSelectedFoodForDialog] = useState<NutritionData | null>(null);
  const [formDataForDialog, setFormDataForDialog] = useState<Partial<CreateFoodLogEntryPayload>>({
    logged_quantity: 1.0,
    meal_type: 'breakfast',
    log_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loggedEntries, setLoggedEntries] = useState<FoodLogEntry[]>([]);
  const [isLoadingLog, setIsLoadingLog] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentThemeColor(themeColors.earthYellow);
  }, [setCurrentThemeColor]);

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!auth.token) {
        setSearchError("Authentication token not found. Please log in.");
        setIsLoadingSearch(false);
        return;
      }
      if (query.trim() === '') {
        setSearchResults([]);
        setSearchError(null);
        setIsLoadingSearch(false);
        return;
      }
      setIsLoadingSearch(true);
      setSearchError(null);
      try {
        const results = await searchFoodsAPI(query, auth);
        setSearchResults(results);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : 'Failed to search foods');
        setSearchResults([]);
      } finally {
        setIsLoadingSearch(false);
      }
    }, 500),
    [auth]
  );

  useEffect(() => {
    if (searchQuery.trim() !== '') {
        debouncedSearch(searchQuery);
    } else {
        setSearchResults([]);
        setIsLoadingSearch(false);
        setSearchError(null);
    }
  }, [searchQuery, debouncedSearch]);

  const [foodEntries_mock, setFoodEntries_mock] = useState<CurrentFoodEntry[]>([
    { id: 1, name: 'Oatmeal with Berries', calories: 320, protein: 12, carbs: 54, fat: 6, mealType: 'breakfast', time: '08:00'  },
    { id: 2, name: 'Grilled Chicken Salad', calories: 450, protein: 40, carbs: 20, fat: 15, mealType: 'lunch', time: '13:00'  },
  ]);
  const handleDeleteFood_mock = (id: number) => {
    setFoodEntries_mock(foodEntries_mock.filter(entry => entry.id !== id));
  };
  const groupedEntries_mock = foodEntries_mock.reduce((acc, entry) => {
    const mealType = entry.mealType;
    if (!acc[mealType]) { acc[mealType] = []; }
    acc[mealType].push(entry);
    return acc;
  }, {} as Record<string, CurrentFoodEntry[]>);
  const dailyTotals_mock = foodEntries_mock.reduce((totals, entry) => ({
    calories: totals.calories + entry.calories, protein: totals.protein + entry.protein,
    carbs: totals.carbs + entry.carbs, fat: totals.fat + entry.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value;
    setCurrentDate(newDate);
    setFormDataForDialog(prev => ({ ...prev, log_date: newDate }));
  };

  const handleOpenLogDialog = (food: NutritionData) => {
    setSelectedFoodForDialog(food); 
    setFormDataForDialog({ 
      fatsecret_food_id: food.id,
      fatsecret_serving_id: food.servingId, 
      reference_serving_description: food.servingSize,
      base_calories: food.calories,
      base_protein: food.protein,
      base_fat: food.fat,
      base_carbs: food.carbs,
      logged_quantity: 1.0,
      meal_type: formDataForDialog.meal_type || 'breakfast',
      log_date: currentDate, 
      notes: ''
    });
    setDialogError(null); 
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setSelectedFoodForDialog(null); 
    setDialogError(null);
  };

  const handleDialogFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = event.target;
    const numericFields = ['logged_quantity', 'base_calories', 'base_protein', 'base_carbs', 'base_fat'];
    
    let val: string | number = value;
    if (name === 'logged_quantity') {
      val = value === '' ? '' : (parseFloat(value) || 0);
    } else if (numericFields.includes(name) && (event.target as HTMLInputElement).type === 'number'){
      val = parseFloat(value) || 0;
    } else if (name === 'meal_type' && typeof value === 'string') {
        val = value;
    }

    setFormDataForDialog((prev: Partial<CreateFoodLogEntryPayload>) => ({
      ...prev,
      [name as string]: val,
    }));
  };

  const handleSaveFoodLog = async () => {
    if (!selectedFoodForDialog || !formDataForDialog.log_date) {
      setDialogError("Selected food is missing or log date is not set. Please select a food from search results.");
      return;
    }
    if (formDataForDialog.logged_quantity == null || Number(formDataForDialog.logged_quantity) <= 0) {
        setDialogError("Quantity must be a positive number.");
        return;
    }
    if (!formDataForDialog.meal_type) {
        setDialogError("Meal type is required.");
        return;
    }

    const payload: CreateFoodLogEntryPayload = {
      fatsecret_food_id: selectedFoodForDialog.id,
      fatsecret_serving_id: selectedFoodForDialog.servingId,
      reference_serving_description: selectedFoodForDialog.servingSize,
      base_calories: selectedFoodForDialog.calories,
      base_protein: selectedFoodForDialog.protein,
      base_fat: selectedFoodForDialog.fat,
      base_carbs: selectedFoodForDialog.carbs,
      logged_quantity: Number(formDataForDialog.logged_quantity),
      meal_type: formDataForDialog.meal_type,
      log_date: formDataForDialog.log_date,
      notes: formDataForDialog.notes || '',
    };

    setIsSubmittingLog(true);
    setDialogError(null);
    try {
      await createFoodLogEntryAPI(payload, auth);
      handleCloseAddDialog();
      console.log("Food logged successfully! Refresh will be implemented in Task 9.");
      setSearchQuery(''); 
      setSearchResults([]);
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : "Failed to log food entry.");
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const handleClickOpenManualAddDialog = () => {
    setSelectedFoodForDialog(null);
    setFormDataForDialog({
      reference_serving_description: '',
      base_calories: 0,
      base_protein: 0,
      base_carbs: 0,
      base_fat: 0,
      logged_quantity: 1.0,
      meal_type: formDataForDialog.meal_type || 'breakfast',
      log_date: currentDate,
      notes: ''
    });
    setDialogError(null);
    setOpenAddDialog(true);
  };

  return (
    <Box sx={{ padding: 3, backgroundColor: '#fff9e6', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#283618ff' }}>
        Food Log
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, color: '#606c38ff' }}>
        Track your daily food intake and nutrition.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="Date"
            type="date"
            value={currentDate}
            onChange={handleDateChange}
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#dda15eff' },
                '&:hover fieldset': { borderColor: '#bc6c25ff' },
                '&.Mui-focused fieldset': { borderColor: '#bc6c25ff' },
              },
              '& .MuiInputLabel-root': { color: '#606c38ff' }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={8} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleClickOpenManualAddDialog}
            sx={{ bgcolor: '#dda15eff', '&:hover': { bgcolor: '#bc6c25ff' } }}
          >
            Add Manually
          </Button>
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Search Food (FatSecret)</Typography>
        <TextField
          fullWidth
          variant="outlined"
          label="Search for a food item..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#dda15eff' },
                '&:hover fieldset': { borderColor: '#bc6c25ff' },
                '&.Mui-focused fieldset': { borderColor: '#bc6c25ff' },
            },
            '& .MuiInputLabel-root': { color: '#606c38ff' }
          }}
        />
        {isLoadingSearch && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress sx={{color: '#bc6c25ff'}}/></Box>}
        {searchError && <Alert severity="error" sx={{ mb: 2 }}>{searchError}</Alert>}
        {!isLoadingSearch && searchResults.length > 0 && (
          <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', borderColor: '#dda15eff' }}>
            <List dense>
              {searchResults.map((food) => (
                <ListItem
                  key={food.id}
                  divider
                  secondaryAction={
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenLogDialog(food)}
                      sx={{
                        borderColor: '#bc6c25ff',
                        color: '#bc6c25ff',
                        '&:hover': {
                            borderColor: '#a05a2c',
                            backgroundColor: 'rgba(188, 108, 37, 0.04)'
                        }
                      }}
                    >
                      Log
                    </Button>
                  }
                >
                  <ListItemText
                    primary={food.name}
                    secondary={`${food.brandName ? `${food.brandName} - ` : ''}${food.calories} ${food.calorieUnit || 'kcal'} per ${food.servingSize}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
        {!isLoadingSearch && searchQuery.trim() !== '' && searchResults.length === 0 && !searchError && (
          <Typography sx={{my: 2, color: '#606c38ff'}}>No results found for "{searchQuery}".</Typography>
        )}
      </Paper>

      <Paper elevation={2} sx={{ p: 2, mb: 3, backgroundColor: '#fefae0' }}>
        <Typography variant="h6" gutterBottom sx={{color: '#283618ff'}}> Daily Nutrition Summary </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}><Card sx={{ bgcolor: '#faf0e0' }}><CardContent>
            <Typography variant="subtitle2" color="textSecondary">Calories</Typography>
            <Typography variant="h5" sx={{color: '#bc6c25ff'}}>{dailyTotals_mock.calories}</Typography>
          </CardContent></Card></Grid>
           <Grid item xs={6} sm={3}><Card sx={{ bgcolor: '#faf0e0' }}><CardContent>
            <Typography variant="subtitle2" color="textSecondary">Protein</Typography>
            <Typography variant="h5" sx={{color: '#bc6c25ff'}}>{dailyTotals_mock.protein}g</Typography>
          </CardContent></Card></Grid>
          <Grid item xs={6} sm={3}><Card sx={{ bgcolor: '#faf0e0' }}><CardContent>
            <Typography variant="subtitle2" color="textSecondary">Carbs</Typography>
            <Typography variant="h5" sx={{color: '#bc6c25ff'}}>{dailyTotals_mock.carbs}g</Typography>
          </CardContent></Card></Grid>
          <Grid item xs={6} sm={3}><Card sx={{ bgcolor: '#faf0e0' }}><CardContent>
            <Typography variant="subtitle2" color="textSecondary">Fat</Typography>
            <Typography variant="h5" sx={{color: '#bc6c25ff'}}>{dailyTotals_mock.fat}g</Typography>
          </CardContent></Card></Grid>
        </Grid>
      </Paper>

      {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => (
        <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: '#fefae0' }} key={mealType}>
          <Typography variant="h6" sx={{ textTransform: 'capitalize', color: '#283618ff' }}>{mealType}</Typography>
          <Divider sx={{ my: 1, borderColor: '#dda15eff' }} />
          {groupedEntries_mock[mealType] && groupedEntries_mock[mealType].length > 0 ? (
            <List>
              {groupedEntries_mock[mealType].map((entry) => (
                <ListItem key={entry.id} divider sx={{borderColor: 'rgba(221, 161, 94, 0.5)'}}>
                  <Grid container alignItems="center">
                    <Grid item xs={12} sm={4} md={3}><ListItemText primary={<Typography sx={{fontWeight: '500', color: '#606c38ff'}}>{entry.name}</Typography>} secondary={`${entry.time}`} /></Grid>
                    <Grid item xs={12} sm={8} md={7}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: {xs: 'flex-start', sm: 'space-around'}, alignItems: 'center', pl: {xs:0, sm:1}, gap: {xs: 1, sm: 0.5} }}>
                          <Typography variant="body2" sx={{color: '#bc6c25ff'}}> {entry.calories} kcal</Typography>
                          <Typography variant="body2" sx={{color: '#606c38ff'}}>P: {entry.protein}g</Typography>
                          <Typography variant="body2" sx={{color: '#606c38ff'}}>C: {entry.carbs}g</Typography>
                          <Typography variant="body2" sx={{color: '#606c38ff'}}>F: {entry.fat}g</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={2} sx={{pt: {xs:1, md:0}}}>
                        <ListItemSecondaryAction>
                            <IconButton edge="end" aria-label="edit" size="small" sx={{color: '#606c38ff', '&:hover': {color: '#283618ff'}}}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteFood_mock(entry.id)} size="small" sx={{color: '#bc6c25ff', '&:hover': {color: '#a05a2c'}}}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </Grid>
                  </Grid>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="textSecondary" sx={{ py: 2, textAlign: 'center', color: '#606c38ff' }}>
              No {mealType} entries yet. Add some food!
            </Typography>
          )}
        </Paper>
      ))}

      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth
        PaperProps={{ sx: { backgroundColor: '#fff9e6' } }}
      >
        <DialogTitle sx={{color: '#283618ff'}}>Log "{selectedFoodForDialog?.name || 'Food Item'}"</DialogTitle>
        <DialogContent>
          {selectedFoodForDialog && (
            <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#fefae0', borderRadius: 1, border: '1px solid #dda15eff' }}>
              <DialogContentText component="div" sx={{color: '#606c38ff'}}>
                <strong>Reference:</strong> {selectedFoodForDialog.servingSize} ({selectedFoodForDialog.calories} {selectedFoodForDialog.calorieUnit || 'kcal'})
                <br />
                <strong>Nutrition per reference:</strong>
                P: {selectedFoodForDialog.protein}{selectedFoodForDialog.proteinUnit || 'g'},
                C: {selectedFoodForDialog.carbs}{selectedFoodForDialog.carbsUnit || 'g'},
                F: {selectedFoodForDialog.fat}{selectedFoodForDialog.fatUnit || 'g'}
              </DialogContentText>
            </Box>
          )}

          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity (multiplier)"
                type="number"
                name="logged_quantity"
                value={formDataForDialog.logged_quantity}
                onChange={handleDialogFormChange}
                InputProps={{ inputProps: { min: 1, step: 1 } }} 
                required
                autoFocus 
                sx={{
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#dda15eff' },
                        '&:hover fieldset': { borderColor: '#bc6c25ff' },
                        '&.Mui-focused fieldset': { borderColor: '#bc6c25ff' },
                    },
                    '& .MuiInputLabel-root': { color: '#606c38ff' }
                }}
              />
            </Grid>
             <Grid item xs={12} sm={6}>
              <FormControl fullWidth required
                sx={{
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#dda15eff' },
                        '&:hover fieldset': { borderColor: '#bc6c25ff' },
                        '&.Mui-focused fieldset': { borderColor: '#bc6c25ff' },
                    },
                    '& .MuiInputLabel-root': { color: '#606c38ff' }
                }}
              >
                <InputLabel>Meal Type</InputLabel>
                <Select
                  name="meal_type"
                  value={formDataForDialog.meal_type}
                  label="Meal Type"
                  onChange={handleDialogFormChange}
                  MenuProps={{ PaperProps: { sx: { backgroundColor: '#fff9e6' } }}}
                >
                  <MenuItem value="breakfast" sx={{color: '#283618ff'}}>Breakfast</MenuItem>
                  <MenuItem value="lunch" sx={{color: '#283618ff'}}>Lunch</MenuItem>
                  <MenuItem value="dinner" sx={{color: '#283618ff'}}>Dinner</MenuItem>
                  <MenuItem value="snack" sx={{color: '#283618ff'}}>Snack</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Log Date"
                type="date"
                name="log_date"
                value={formDataForDialog.log_date}
                onChange={handleDialogFormChange}
                InputLabelProps={{ shrink: true }}
                required
                sx={{
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#dda15eff' },
                        '&:hover fieldset': { borderColor: '#bc6c25ff' },
                        '&.Mui-focused fieldset': { borderColor: '#bc6c25ff' },
                    },
                    '& .MuiInputLabel-root': { color: '#606c38ff' }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                name="notes"
                value={formDataForDialog.notes}
                onChange={handleDialogFormChange}
                multiline
                rows={3}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#dda15eff' },
                        '&:hover fieldset': { borderColor: '#bc6c25ff' },
                        '&.Mui-focused fieldset': { borderColor: '#bc6c25ff' },
                    },
                    '& .MuiInputLabel-root': { color: '#606c38ff' }
                }}
              />
            </Grid>
            {!selectedFoodForDialog && (
              <>
                <Grid item xs={12}><Typography variant="caption" sx={{color: '#606c38ff'}}>Manually enter nutrition for the reference serving:</Typography></Grid>
                <Grid item xs={12}>
                    <TextField fullWidth label="Reference Serving Description (e.g., 1 cup, 100g)" name="reference_serving_description" value={formDataForDialog.reference_serving_description || ''} onChange={handleDialogFormChange} 
                        sx={{ /* styles */ }} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <TextField fullWidth label="Calories (base)" type="number" name="base_calories" value={formDataForDialog.base_calories} onChange={handleDialogFormChange} 
                        sx={{ /* styles */ }} InputLabelProps={{ shrink: true }}/>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <TextField fullWidth label="Protein (g, base)" type="number" name="base_protein" value={formDataForDialog.base_protein} onChange={handleDialogFormChange} 
                        sx={{ /* styles */ }} InputLabelProps={{ shrink: true }}/>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <TextField fullWidth label="Carbs (g, base)" type="number" name="base_carbs" value={formDataForDialog.base_carbs} onChange={handleDialogFormChange} 
                        sx={{ /* styles */ }} InputLabelProps={{ shrink: true }}/>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <TextField fullWidth label="Fat (g, base)" type="number" name="base_fat" value={formDataForDialog.base_fat} onChange={handleDialogFormChange} 
                        sx={{ /* styles */ }} InputLabelProps={{ shrink: true }}/>
                </Grid>
              </>
            )}
          </Grid>
          {dialogError && <Alert severity="error" sx={{ mt: 2 }}>{dialogError}</Alert>}
        </DialogContent>
        <DialogActions sx={{padding: '16px 24px'}}>
          <Button onClick={handleCloseAddDialog} sx={{color: '#606c38ff', '&:hover': {backgroundColor: 'rgba(188, 108, 37, 0.08)'}}}>Cancel</Button>
          <Button onClick={handleSaveFoodLog} variant="contained" disabled={isSubmittingLog} sx={{bgcolor: '#dda15eff', '&:hover': {bgcolor: '#bc6c25ff'}}}>
            {isSubmittingLog ? <CircularProgress size={24} sx={{color: 'white'}} /> : "Save Log"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FoodLog;