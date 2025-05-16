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
  InputAdornment
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

const FoodLogPage: React.FC = () => {
  const { setCurrentThemeColor } = useThemeContext();
  const auth = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NutritionData[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newFoodForm, setNewFoodForm] = useState<Partial<CreateFoodLogEntryPayload>>({
    reference_serving_description: '',
    base_calories: 0,
    base_protein: 0,
    base_carbs: 0,
    base_fat: 0,
    logged_quantity: 1,
    meal_type: 'breakfast',
    log_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

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
    setCurrentDate(event.target.value);
    setNewFoodForm((prev: Partial<CreateFoodLogEntryPayload>) => ({ ...prev, log_date: event.target.value }));
  };

  const handleClickOpenAddDialog = () => {
    setNewFoodForm({
        reference_serving_description: '',
        base_calories: 0,
        base_protein: 0,
        base_carbs: 0,
        base_fat: 0,
        logged_quantity: 1,
        meal_type: 'breakfast',
        log_date: currentDate,
        notes: ''
    });
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  const handleDialogInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = event.target;
    const parsedValue = (event.target as HTMLInputElement).type === 'number' && name !== 'logged_quantity'
                       ? parseFloat(value) || 0 
                       : (name === 'logged_quantity' ? (parseFloat(value) || 1) : value) ;

    setNewFoodForm((prevFood: Partial<CreateFoodLogEntryPayload>) => ({
      ...prevFood,
      [name as string]: parsedValue,
    }));
  };
  
  const handleDialogSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setNewFoodForm((prevFood: Partial<CreateFoodLogEntryPayload>) => ({
        ...prevFood,
        [name as string]: value,
    }));
  };

  const handleSaveFoodLog = () => {
    console.log("Saving food log:", newFoodForm);
    handleCloseAddDialog();
  };

  return (
    <Box sx={{ padding: 3, backgroundColor: '#fff9e6', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#283618ff' }}>
        Food Log
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, color: '#606c38ff' }}>
        Track your daily food intake and nutrition.
      </Typography>

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
                      onClick={() => {
                        console.log("Selected:", food);
                      }}
                      sx={{
                        borderColor: '#bc6c25ff',
                        color: '#bc6c25ff',
                        '&:hover': {
                            borderColor: '#a05a2c',
                            backgroundColor: 'rgba(188, 108, 37, 0.04)'
                        }
                      }}
                    >
                      Select
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
            onClick={handleClickOpenAddDialog}
            sx={{ bgcolor: '#dda15eff', '&:hover': { bgcolor: '#bc6c25ff' } }}
          >
            Add Food Entry
          </Button>
        </Grid>
      </Grid>

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
        <DialogTitle sx={{color: '#283618ff'}}>Add Food Entry</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Food Name (Manual Entry)"
                name="reference_serving_description"
                value={newFoodForm.reference_serving_description} 
                onChange={handleDialogInputChange}
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
            <Grid item xs={6}>
              <FormControl fullWidth 
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
                  value={newFoodForm.meal_type}
                  label="Meal Type"
                  onChange={handleDialogSelectChange}
                  MenuProps={{ PaperProps: { sx: { backgroundColor: '#fff9e6' } }}}
                >
                  <MenuItem value="breakfast" sx={{color: '#283618ff'}}>Breakfast</MenuItem>
                  <MenuItem value="lunch" sx={{color: '#283618ff'}}>Lunch</MenuItem>
                  <MenuItem value="dinner" sx={{color: '#283618ff'}}>Dinner</MenuItem>
                  <MenuItem value="snack" sx={{color: '#283618ff'}}>Snack</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Log Date"
                type="date"
                name="log_date"
                value={newFoodForm.log_date}
                onChange={handleDialogInputChange}
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                name="logged_quantity"
                value={newFoodForm.logged_quantity}
                onChange={handleDialogInputChange}
                InputProps={{ inputProps: { min: 0.1, step: 0.1 } }}
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
            <Grid item xs={6} sm={3}>
                <TextField fullWidth label="Calories (base)" type="number" name="base_calories" value={newFoodForm.base_calories} onChange={handleDialogInputChange} 
                    sx={{ /* styles */ }} InputLabelProps={{ shrink: true }}/>
            </Grid>
            <Grid item xs={6} sm={3}>
                <TextField fullWidth label="Protein (g, base)" type="number" name="base_protein" value={newFoodForm.base_protein} onChange={handleDialogInputChange} 
                    sx={{ /* styles */ }} InputLabelProps={{ shrink: true }}/>
            </Grid>
            <Grid item xs={6} sm={3}>
                <TextField fullWidth label="Carbs (g, base)" type="number" name="base_carbs" value={newFoodForm.base_carbs} onChange={handleDialogInputChange} 
                    sx={{ /* styles */ }} InputLabelProps={{ shrink: true }}/>
            </Grid>
            <Grid item xs={6} sm={3}>
                <TextField fullWidth label="Fat (g, base)" type="number" name="base_fat" value={newFoodForm.base_fat} onChange={handleDialogInputChange} 
                    sx={{ /* styles */ }} InputLabelProps={{ shrink: true }}/>
            </Grid>
            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label="Notes (Optional)"
                    name="notes"
                    value={newFoodForm.notes}
                    onChange={handleDialogInputChange}
                    multiline
                    rows={2}
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
          </Grid>
        </DialogContent>
        <DialogActions sx={{padding: '16px 24px'}}>
          <Button onClick={handleCloseAddDialog} sx={{color: '#606c38ff', '&:hover': {backgroundColor: 'rgba(188, 108, 37, 0.08)'}}}>Cancel</Button>
          <Button onClick={handleSaveFoodLog} variant="contained" sx={{bgcolor: '#dda15eff', '&:hover': {bgcolor: '#bc6c25ff'}}}>
            Save Log
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FoodLogPage; 