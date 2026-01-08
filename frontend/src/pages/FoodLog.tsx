// frontend/src/pages/FoodLog.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Snackbar,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useAuth } from '../context/AuthContext';
import {
  NutritionData,
  NutritionServing,
  FoodLogEntry,
  CreateFoodLogEntryPayload,
  searchFoodsAPI,
  createFoodLogEntryAPI,
  getFoodLogEntriesAPI,
  deleteFoodLogEntryAPI,
} from '../services/foodLogApi';
import { getAvailableConversions, ConvertedOption } from '../utils/unitConversions';
import { logWaterAPI, getDailyWaterAPI } from '../services/waterApi';
import { LocalDrink as LocalDrinkIcon } from '@mui/icons-material';

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

import { usePageTheme, themePalette } from '../hooks/usePageTheme';

const FoodLog: React.FC = () => {
  usePageTheme(themePalette.darkGreen);
  const auth = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NutritionData[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedFoodForDialog, setSelectedFoodForDialog] = useState<NutritionData | null>(null);

  // Local Conversion State
  const [conversionOptions, setConversionOptions] = useState<ConvertedOption[]>([]);
  const [bridgeServingId, setBridgeServingId] = useState<string | null>(null);

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

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  // --- Water Tracking State ---
  const [dailyWater, setDailyWater] = useState(0);

  const fetchDailyWater = useCallback(async () => {
    if (!auth.token) return;
    try {
      const total = await getDailyWaterAPI(currentDate, auth);
      setDailyWater(total);
    } catch (err) {
      console.error("Failed to fetch water:", err);
    }
  }, [auth, currentDate]);

  useEffect(() => {
    fetchDailyWater();
  }, [fetchDailyWater]);

  const handleAddWater = async (amount: number) => {
    try {
      await logWaterAPI(amount, currentDate, auth);
      setDailyWater((prev) => prev + amount);
      setSnackbarMessage(`Added ${amount}ml of water`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage("Failed to log water");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      fetchDailyWater(); // Revert
    }
  };



  const fetchLoggedEntries = useCallback(async (date: string) => {
    if (!auth.token) return;

    setIsLoadingLog(true);
    setLogError(null);
    try {
      const entries = await getFoodLogEntriesAPI(date, auth);
      setLoggedEntries(entries);
    } catch (err) {
      setLogError(err instanceof Error ? err.message : "Failed to fetch logged entries.");
      setLoggedEntries([]);
    } finally {
      setIsLoadingLog(false);
    }
  }, [auth]);

  useEffect(() => {
    fetchLoggedEntries(currentDate);
  }, [currentDate, fetchLoggedEntries]);

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
    { id: 1, name: 'Oatmeal with Berries', calories: 320, protein: 12, carbs: 54, fat: 6, mealType: 'breakfast', time: '08:00' },
    { id: 2, name: 'Grilled Chicken Salad', calories: 450, protein: 40, carbs: 20, fat: 15, mealType: 'lunch', time: '13:00' },
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
    setFormDataForDialog((prev: Partial<CreateFoodLogEntryPayload>) => ({ ...prev, log_date: newDate }));
    fetchLoggedEntries(newDate);
  };

  const handleOpenLogDialog = (food: NutritionData) => {
    setSelectedFoodForDialog(food);

    // Check for local conversions
    let localOptions: ConvertedOption[] = [];
    let bridgeId: string | null = null;

    if (food.availableServings) {
      const result = getAvailableConversions(food.name, food.availableServings);
      localOptions = result.options;
      bridgeId = result.bridgeServingId;
    }

    setConversionOptions(localOptions);
    setBridgeServingId(bridgeId);

    // Initial form setup
    setFormDataForDialog({
      fatsecret_food_id: food.id,
      fatsecret_serving_id: food.servingId, // Default references serving
      reference_serving_description: food.servingSize,
      base_calories: food.calories,
      base_protein: food.protein,
      base_fat: food.fat,
      base_carbs: food.carbs,
      food_name: food.name,
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
    } else if (numericFields.includes(name) && (event.target as HTMLInputElement).type === 'number') {
      val = parseFloat(value) || 0;
    } else if (name === 'meal_type' && typeof value === 'string') {
      val = value;
    }

    setFormDataForDialog((prev: Partial<CreateFoodLogEntryPayload>) => ({
      ...prev,
      [name as string]: val,
    }));
  };

  const handleServingChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;

    if (!selectedFoodForDialog || !selectedFoodForDialog.availableServings) return;

    // Check if it's a virtual option (bridgeId|factor|label)
    if (value.includes('|')) {
      const [bId, factorStr, label] = value.split('|');
      const factor = parseFloat(factorStr);
      const bridge = selectedFoodForDialog.availableServings.find(s => s.servingId === bId);

      if (bridge) {
        setFormDataForDialog(prev => ({
          ...prev,
          fatsecret_serving_id: bId, // Still linked to the API serving ID for backend reference if needed
          reference_serving_description: label, // Show "1 cup" etc
          base_calories: bridge.calories * factor,
          base_protein: bridge.protein * factor,
          base_fat: bridge.fat * factor,
          base_carbs: bridge.carbs * factor,
        }));
      }
      return;
    }

    // Normal API serving
    const newServingId = value;
    const newServing = selectedFoodForDialog.availableServings.find(s => s.servingId === newServingId);

    if (newServing) {
      setFormDataForDialog(prev => ({
        ...prev,
        fatsecret_serving_id: newServing.servingId,
        reference_serving_description: newServing.servingSize,
        base_calories: newServing.calories,
        base_protein: newServing.protein,
        base_fat: newServing.fat,
        base_carbs: newServing.carbs,
      }));
    }
  };

  const handleSaveFoodLog = async () => {
    const isManualEntry = !selectedFoodForDialog;
    if (!isManualEntry && (!selectedFoodForDialog || !selectedFoodForDialog.name)) {
      setDialogError("Selected food is missing required details. Please re-select from search.");
      return;
    }
    if (!formDataForDialog.log_date) {
      setDialogError("Log date is not set.");
      return;
    }
    if (formDataForDialog.logged_quantity == null || Number(formDataForDialog.logged_quantity) < 0.5) {
      setDialogError("Quantity must be at least 0.5.");
      return;
    }
    if (!formDataForDialog.meal_type) {
      setDialogError("Meal type is required.");
      return;
    }
    if (isManualEntry && (
      !formDataForDialog.food_name ||
      formDataForDialog.base_calories === undefined ||
      formDataForDialog.base_protein === undefined ||
      formDataForDialog.base_carbs === undefined ||
      formDataForDialog.base_fat === undefined ||
      !formDataForDialog.reference_serving_description
    )) {
      setDialogError("For manual entry, please provide food name, reference serving description, and base nutritional values.");
      return;
    }

    const payload: CreateFoodLogEntryPayload = {
      fatsecret_food_id: selectedFoodForDialog ? selectedFoodForDialog.id : "",
      fatsecret_serving_id: selectedFoodForDialog ? selectedFoodForDialog.servingId : "",
      reference_serving_description: selectedFoodForDialog ? selectedFoodForDialog.servingSize : formDataForDialog.reference_serving_description || '',
      base_calories: selectedFoodForDialog ? selectedFoodForDialog.calories : formDataForDialog.base_calories || 0,
      base_protein: selectedFoodForDialog ? selectedFoodForDialog.protein : formDataForDialog.base_protein || 0,
      base_fat: selectedFoodForDialog ? selectedFoodForDialog.fat : formDataForDialog.base_fat || 0,
      base_carbs: selectedFoodForDialog ? selectedFoodForDialog.carbs : formDataForDialog.base_carbs || 0,
      food_name: selectedFoodForDialog ? selectedFoodForDialog.name : formDataForDialog.food_name || 'Manually Added Item',
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
      fetchLoggedEntries(currentDate);
      setSearchQuery('');
      setSearchResults([]);
      setSnackbarMessage("Food logged successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to log food entry.";
      setDialogError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
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

  const handleDeleteLogEntry = async (logEntryId: number) => {
    if (!auth.token) {
      setSnackbarMessage("Authentication token not found. Please log in.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    try {
      await deleteFoodLogEntryAPI(logEntryId, auth);
      fetchLoggedEntries(currentDate);
      setSnackbarMessage("Log entry deleted.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Failed to delete log entry:", err);
      setSnackbarMessage(err instanceof Error ? err.message : "Failed to delete entry.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const groupedEntries = useMemo(() => {
    return loggedEntries.reduce((acc, entry) => {
      const mealType = entry.meal_type;
      if (!acc[mealType]) {
        acc[mealType] = [];
      }
      acc[mealType].push(entry);
      return acc;
    }, {} as Record<string, FoodLogEntry[]>);
  }, [loggedEntries]);

  const dailyTotals = useMemo(() => {
    return loggedEntries.reduce((totals, entry) => {
      return {
        calories: totals.calories + (parseFloat(String(entry.calories_consumed)) || 0),
        protein: totals.protein + (parseFloat(String(entry.protein_consumed)) || 0),
        carbs: totals.carbs + (parseFloat(String(entry.carbs_consumed)) || 0),
        fat: totals.fat + (parseFloat(String(entry.fat_consumed)) || 0),
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [loggedEntries]);

  return (
    <Box sx={{ padding: { xs: 2, md: 4 }, backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold', fontFamily: 'Outfit, sans-serif' }}>
          Food Log
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'var(--color-secondary)', mt: 1 }}>
          Track your daily food intake and nutrition.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }} alignItems="center">
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
                bgcolor: 'white',
                borderRadius: 2,
                '& fieldset': { borderColor: 'rgba(96, 108, 56, 0.2)' },
                '&:hover fieldset': { borderColor: 'var(--color-primary)' },
                '&.Mui-focused fieldset': { borderColor: 'var(--color-primary)' },
              },
              '& .MuiInputLabel-root': { color: 'var(--color-primary)' }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={8} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleClickOpenManualAddDialog}
            disableElevation
            sx={{
              bgcolor: 'var(--color-primary)',
              color: 'white',
              fontWeight: 'bold',
              px: 3,
              py: 1.5,
              borderRadius: 2,
              '&:hover': { bgcolor: 'var(--color-primary-dark)' }
            }}
          >
            Add Manually
          </Button>
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 4,
          bgcolor: 'white',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>Search Food (FatSecret)</Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search for a food item (e.g., 'avocado toast')..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'var(--color-primary)' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'var(--color-bg)',
              borderRadius: 3,
              '& fieldset': { border: 'none' }, // Cleaner look
              '&:hover': { bgcolor: '#fbfbf0' },
              '&.Mui-focused': { bgcolor: '#fbfbf0', boxShadow: '0 0 0 2px var(--color-primary)' },
            }
          }}
        />
        {isLoadingSearch && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress sx={{ color: 'var(--color-primary)' }} /></Box>}
        {searchError && <Alert severity="error" sx={{ mb: 2 }}>{searchError}</Alert>}
        {!isLoadingSearch && searchResults.length > 0 && (
          <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto', borderRadius: 2, borderColor: 'rgba(96, 108, 56, 0.1)', bgcolor: 'var(--color-bg)', p: 1 }}>
            <List dense>
              {searchResults.map((food) => (
                <ListItem
                  key={food.id}
                  divider
                  sx={{ borderColor: 'rgba(96, 108, 56, 0.05)', borderRadius: 1, mb: 0.5, '&:hover': { bgcolor: 'rgba(96, 108, 56, 0.05)' } }}
                  secondaryAction={
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenLogDialog(food)}
                      sx={{
                        borderColor: 'var(--color-primary)',
                        color: 'var(--color-primary)',
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: 'var(--color-primary)',
                          color: 'white',
                          borderColor: 'var(--color-primary)'
                        }
                      }}
                    >
                      Log
                    </Button>
                  }
                >
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: '500', color: 'var(--color-primary-dark)' }}>{food.name}</Typography>}
                    secondary={`${food.brandName ? `${food.brandName} - ` : ''}${food.calories} ${food.calorieUnit || 'kcal'} per ${food.servingSize}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
        {!isLoadingSearch && searchQuery.trim() !== '' && searchResults.length === 0 && !searchError && (
          <Typography sx={{ my: 2, color: 'var(--color-secondary)', textAlign: 'center', fontStyle: 'italic' }}>No results found for "{searchQuery}".</Typography>
        )}
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 4,
          bgcolor: 'white',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>Daily Nutrition Summary</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Card elevation={0} sx={{ bgcolor: 'var(--color-bg)', borderRadius: 3, border: '1px solid rgba(96, 108, 56, 0.1)' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Calories</Typography>
                <Typography variant="h5" sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold', mt: 1 }}>{dailyTotals.calories.toFixed(0)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card elevation={0} sx={{ bgcolor: 'var(--color-bg)', borderRadius: 3, border: '1px solid rgba(96, 108, 56, 0.1)' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ color: '#606c38', fontWeight: 'bold' }}>Protein</Typography>
                <Typography variant="h5" sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold', mt: 1 }}>{dailyTotals.protein.toFixed(1)}g</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card elevation={0} sx={{ bgcolor: 'var(--color-bg)', borderRadius: 3, border: '1px solid rgba(96, 108, 56, 0.1)' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ color: '#dda15e', fontWeight: 'bold' }}>Carbs</Typography>
                <Typography variant="h5" sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold', mt: 1 }}>{dailyTotals.carbs.toFixed(1)}g</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card elevation={0} sx={{ bgcolor: 'var(--color-bg)', borderRadius: 3, border: '1px solid rgba(96, 108, 56, 0.1)' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ color: '#bc6c25', fontWeight: 'bold' }}>Fat</Typography>
                <Typography variant="h5" sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold', mt: 1 }}>{dailyTotals.fat.toFixed(1)}g</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Water Tracking Section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 4,
          bgcolor: '#effcf4', // Very light green/mint 
          border: '1px solid #dcfce7'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ p: 1, bgcolor: '#dcfce7', borderRadius: '50%', display: 'flex' }}>
              <LocalDrinkIcon sx={{ color: '#166534' }} />
            </Box>
            <Typography variant="h6" sx={{ color: '#14532d', fontWeight: 'bold' }}>Water Intake</Typography>
          </Box>
          <Typography variant="h5" sx={{ color: '#14532d', fontWeight: 'bold' }}>
            {dailyWater} <Typography component="span" variant="body2" sx={{ color: '#166534' }}>/ 2500 ml</Typography>
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="outlined"
              onClick={() => handleAddWater(250)}
              sx={{
                borderColor: '#166534',
                color: '#166534',
                bgcolor: 'white',
                borderRadius: 2,
                '&:hover': { bgcolor: '#dcfce7', borderColor: '#14532d' }
              }}
            >
              + 250ml
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              onClick={() => handleAddWater(500)}
              sx={{
                borderColor: '#166534',
                color: '#166534',
                bgcolor: 'white',
                borderRadius: 2,
                '&:hover': { bgcolor: '#dcfce7', borderColor: '#14532d' }
              }}
            >
              + 500ml
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              onClick={() => handleAddWater(1000)}
              sx={{
                borderColor: '#166534',
                color: '#166534',
                bgcolor: 'white',
                borderRadius: 2,
                '&:hover': { bgcolor: '#dcfce7', borderColor: '#14532d' }
              }}
            >
              + 1L
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {isLoadingLog && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress sx={{ color: 'var(--color-primary)' }} /></Box>}
      {logError && <Alert severity="error" sx={{ my: 2 }}>{logError}</Alert>}
      {!isLoadingLog && !logError && loggedEntries.length === 0 && (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', my: 2, bgcolor: 'white', borderRadius: 3, border: '1px dashed rgba(96, 108, 56, 0.3)' }}>
          <Typography sx={{ color: 'var(--color-secondary)' }}>No food logged for {currentDate}. Add some from the search above or add manually!</Typography>
        </Paper>
      )}
      {!isLoadingLog && !logError && loggedEntries.length > 0 && ['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => (
        (groupedEntries[mealType] && groupedEntries[mealType].length > 0) && (
          <Paper
            key={mealType}
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              bgcolor: 'white',
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
          >
            <Typography variant="h6" sx={{ textTransform: 'capitalize', color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>{mealType}</Typography>
            <Divider sx={{ my: 2, borderColor: 'rgba(96, 108, 56, 0.1)' }} />
            <List disablePadding>
              {groupedEntries[mealType].map((entry) => (
                <ListItem
                  key={entry.log_entry_id}
                  divider
                  sx={{
                    borderColor: 'rgba(96, 108, 56, 0.05)',
                    py: 2,
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <Grid container alignItems="center" spacing={1}>
                    <Grid item xs={12} sm={4} md={3}>
                      <ListItemText
                        primary={<Typography sx={{ fontWeight: '600', color: 'var(--color-primary-dark)' }}>{entry.food_name || "Unknown Food"}</Typography>}
                        secondary={<Typography variant="body2" sx={{ color: 'var(--color-secondary)' }}>{`${parseFloat(String(entry.logged_quantity)).toFixed(1)} x ${entry.logged_serving_description}`}</Typography>}
                      />
                    </Grid>
                    <Grid item xs={10} sm={6} md={7}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'space-around' }, alignItems: 'center', pl: { xs: 0, sm: 1 }, gap: { xs: 1, sm: 0.5 } }}>
                        <Typography variant="body2" sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold', minWidth: '70px', textAlign: 'right' }}>{(parseFloat(String(entry.calories_consumed)) || 0).toFixed(0)} kcal</Typography>
                        <Typography variant="body2" sx={{ color: '#606c38', minWidth: '60px', textAlign: 'right' }}>P: {parseFloat(String(entry.protein_consumed)).toFixed(1)}g</Typography>
                        <Typography variant="body2" sx={{ color: '#dda15e', minWidth: '60px', textAlign: 'right' }}>C: {parseFloat(String(entry.carbs_consumed)).toFixed(1)}g</Typography>
                        <Typography variant="body2" sx={{ color: '#bc6c25', minWidth: '60px', textAlign: 'right' }}>F: {parseFloat(String(entry.fat_consumed)).toFixed(1)}g</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={2} sm={2} md={2} sx={{ textAlign: 'right', pt: { xs: 1, md: 0 } }}>
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteLogEntry(entry.log_entry_id)}
                          size="small"
                          sx={{ color: '#ef4444', opacity: 0.6, '&:hover': { opacity: 1, bgcolor: '#fee2e2' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </Grid>
                  </Grid>
                </ListItem>
              ))}
            </List>
          </Paper>
        )
      ))}

      <Dialog
        open={openAddDialog}
        onClose={handleCloseAddDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: 'white', borderRadius: 3 } }}
      >
        <DialogTitle sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          Log "{selectedFoodForDialog?.name || (formDataForDialog.food_name || 'New Food Item')}"
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedFoodForDialog && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'var(--color-bg)', borderRadius: 2, border: '1px solid rgba(96, 108, 56, 0.1)' }}>
              <DialogContentText component="div" sx={{ color: 'var(--color-primary-dark)' }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--color-secondary)', mb: 0.5 }}>
                  Reference Serving
                </Typography>

                {selectedFoodForDialog.availableServings && selectedFoodForDialog.availableServings.length > 0 ? (
                  <FormControl fullWidth size="small" sx={{ mb: 1, mt: 0.5 }}>
                    <Select
                      value={
                        // If current description matches a conversion label, reconstruct the virtual value
                        // This is tricky because we don't store the virtual value in state.
                        // We check if the current 'reference_serving_description' matches one of our options.
                        conversionOptions.find(o => o.label === formDataForDialog.reference_serving_description)
                          ? `${bridgeServingId}|${conversionOptions.find(o => o.label === formDataForDialog.reference_serving_description)?.factor}|${formDataForDialog.reference_serving_description}`
                          : (formDataForDialog.fatsecret_serving_id || selectedFoodForDialog.servingId)
                      }
                      onChange={handleServingChange}
                      sx={{ bgcolor: 'white' }}
                    >
                      {/* Local Conversions (Priority) */}
                      {conversionOptions.length > 0 && [
                        <MenuItem disabled key="header-std" sx={{ opacity: 0.7, fontSize: '0.85rem', fontWeight: 'bold' }}>Standard Units</MenuItem>,
                        ...conversionOptions.map((opt) => (
                          <MenuItem key={opt.label} value={`${bridgeServingId}|${opt.factor}|${opt.label}`}>
                            {opt.label}
                          </MenuItem>
                        )),
                        <Divider key="div-std" />
                      ]}

                      {/* Original API Servings (Fallback/Extra) */}
                      {/* Only show if we don't have conversions OR if user wants to see them? 
                          Let's show them for completeness but maybe grouped. */}
                      {conversionOptions.length > 0 && <MenuItem disabled key="header-api" sx={{ opacity: 0.7, fontSize: '0.85rem', fontWeight: 'bold' }}>FatSecret Units</MenuItem>}

                      {selectedFoodForDialog.availableServings.map((serving) => (
                        <MenuItem key={serving.servingId} value={serving.servingId}>
                          {serving.servingSize} ({serving.calories} kcal)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {selectedFoodForDialog.servingSize} ({selectedFoodForDialog.calories} {selectedFoodForDialog.calorieUnit || 'kcal'})
                  </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <Typography variant="body2" sx={{ color: '#606c38' }}>
                    P: {selectedFoodForDialog.availableServings
                      ? (formDataForDialog.base_protein !== undefined ? formDataForDialog.base_protein : selectedFoodForDialog.protein)
                      : selectedFoodForDialog.protein}{selectedFoodForDialog.proteinUnit || 'g'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#dda15e' }}>
                    C: {selectedFoodForDialog.availableServings
                      ? (formDataForDialog.base_carbs !== undefined ? formDataForDialog.base_carbs : selectedFoodForDialog.carbs)
                      : selectedFoodForDialog.carbs}{selectedFoodForDialog.carbsUnit || 'g'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#bc6c25' }}>
                    F: {selectedFoodForDialog.availableServings
                      ? (formDataForDialog.base_fat !== undefined ? formDataForDialog.base_fat : selectedFoodForDialog.fat)
                      : selectedFoodForDialog.fat}{selectedFoodForDialog.fatUnit || 'g'}
                  </Typography>
                </Box>
              </DialogContentText>
            </Box>
          )}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {!selectedFoodForDialog && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Food Name"
                  name="food_name"
                  value={formDataForDialog.food_name || ''}
                  onChange={handleDialogFormChange}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '& fieldset': { borderColor: 'rgba(96, 108, 56, 0.3)' },
                      '&:hover fieldset': { borderColor: 'var(--color-primary)' },
                      '&.Mui-focused fieldset': { borderColor: 'var(--color-primary)' },
                    },
                    '& .MuiInputLabel-root': { color: 'var(--color-primary)' }
                  }}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Quantity (multiplier)" type="number" name="logged_quantity"
                value={formDataForDialog.logged_quantity} onChange={handleDialogFormChange}
                InputProps={{ inputProps: { min: 0.5, step: 0.5 } }} required autoFocus={!selectedFoodForDialog}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': { borderColor: 'rgba(96, 108, 56, 0.3)' },
                    '&:hover fieldset': { borderColor: 'var(--color-primary)' },
                    '&.Mui-focused fieldset': { borderColor: 'var(--color-primary)' },
                  },
                  '& .MuiInputLabel-root': { color: 'var(--color-primary)' }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': { borderColor: 'rgba(96, 108, 56, 0.3)' },
                    '&:hover fieldset': { borderColor: 'var(--color-primary)' },
                    '&.Mui-focused fieldset': { borderColor: 'var(--color-primary)' },
                  },
                  '& .MuiInputLabel-root': { color: 'var(--color-primary)' }
                }}
              >
                <InputLabel>Meal Type</InputLabel>
                <Select
                  name="meal_type" value={formDataForDialog.meal_type} label="Meal Type"
                  onChange={handleDialogFormChange}
                  MenuProps={{ PaperProps: { sx: { bgcolor: 'white' } } }}
                >
                  <MenuItem value="breakfast">Breakfast</MenuItem>
                  <MenuItem value="lunch">Lunch</MenuItem>
                  <MenuItem value="dinner">Dinner</MenuItem>
                  <MenuItem value="snack">Snack</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Log Date" type="date" name="log_date"
                value={formDataForDialog.log_date} onChange={handleDialogFormChange}
                InputLabelProps={{ shrink: true }} required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': { borderColor: 'rgba(96, 108, 56, 0.3)' },
                    '&:hover fieldset': { borderColor: 'var(--color-primary)' },
                    '&.Mui-focused fieldset': { borderColor: 'var(--color-primary)' },
                  },
                  '& .MuiInputLabel-root': { color: 'var(--color-primary)' }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Notes (Optional)" name="notes" value={formDataForDialog.notes}
                onChange={handleDialogFormChange} multiline rows={selectedFoodForDialog ? 2 : 3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '& fieldset': { borderColor: 'rgba(96, 108, 56, 0.3)' },
                    '&:hover fieldset': { borderColor: 'var(--color-primary)' },
                    '&.Mui-focused fieldset': { borderColor: 'var(--color-primary)' },
                  },
                  '& .MuiInputLabel-root': { color: 'var(--color-primary)' }
                }}
              />
            </Grid>
            {!selectedFoodForDialog && (
              <>
                <Grid item xs={12}><Typography variant="caption" sx={{ color: 'var(--color-secondary)' }}>Manually enter nutrition for the reference serving:</Typography></Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Reference Serving Description (e.g., 1 cup, 100g)" name="reference_serving_description" value={formDataForDialog.reference_serving_description || ''} onChange={handleDialogFormChange} required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(96, 108, 56, 0.3)' },
                        '&:hover fieldset': { borderColor: 'var(--color-primary)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--color-primary)' },
                      },
                      '& .MuiInputLabel-root': { color: 'var(--color-primary)' }
                    }} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField fullWidth label="Calories (base)" type="number" name="base_calories" value={formDataForDialog.base_calories} onChange={handleDialogFormChange} required InputProps={{ inputProps: { min: 0 } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(96, 108, 56, 0.3)' },
                        '&:hover fieldset': { borderColor: 'var(--color-primary)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--color-primary)' },
                      },
                      '& .MuiInputLabel-root': { color: 'var(--color-primary)' }
                    }} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField fullWidth label="Protein (g, base)" type="number" name="base_protein" value={formDataForDialog.base_protein} onChange={handleDialogFormChange} required InputProps={{ inputProps: { min: 0 } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(96, 108, 56, 0.3)' },
                        '&:hover fieldset': { borderColor: 'var(--color-primary)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--color-primary)' },
                      },
                      '& .MuiInputLabel-root': { color: 'var(--color-primary)' }
                    }} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField fullWidth label="Carbs (g, base)" type="number" name="base_carbs" value={formDataForDialog.base_carbs} onChange={handleDialogFormChange} required InputProps={{ inputProps: { min: 0 } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(96, 108, 56, 0.3)' },
                        '&:hover fieldset': { borderColor: 'var(--color-primary)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--color-primary)' },
                      },
                      '& .MuiInputLabel-root': { color: 'var(--color-primary)' }
                    }} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField fullWidth label="Fat (g, base)" type="number" name="base_fat" value={formDataForDialog.base_fat} onChange={handleDialogFormChange} required InputProps={{ inputProps: { min: 0 } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(96, 108, 56, 0.3)' },
                        '&:hover fieldset': { borderColor: 'var(--color-primary)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--color-primary)' },
                      },
                      '& .MuiInputLabel-root': { color: 'var(--color-primary)' }
                    }} InputLabelProps={{ shrink: true }} />
                </Grid>
              </>
            )}
          </Grid>
          {dialogError && <Alert severity="error" sx={{ mt: 2 }}>{dialogError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <Button onClick={handleCloseAddDialog} sx={{ color: 'var(--color-secondary)', fontWeight: 'bold' }}>Cancel</Button>
          <Button
            onClick={handleSaveFoodLog}
            variant="contained"
            disableElevation
            disabled={isSubmittingLog}
            sx={{
              bgcolor: 'var(--color-primary)',
              color: 'white',
              fontWeight: 'bold',
              px: 3,
              '&:hover': { bgcolor: 'var(--color-primary-dark)' }
            }}
          >
            {isSubmittingLog ? <CircularProgress size={24} sx={{ color: 'white' }} /> : "Save Log"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

    </Box>
  );
};

export default FoodLog;