// frontend/src/pages/FoodLog.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
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
  Stack,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Restaurant as RestaurantIcon,
  UploadFile as UploadFileIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useAuth } from '../context/AuthContext';
import {
  NutritionData,
  NutritionServing,
  FoodLogEntry,
  CreateFoodLogEntryPayload,
  FoodAttributeFlag,
  searchFoodsAPI,
  findFoodByBarcodeAPI,
  getFoodDetailsAPI,
  createFoodLogEntryAPI,
  getFoodLogEntriesAPI,
  deleteFoodLogEntryAPI,
} from '../services/foodLogApi';
import { getAvailableConversions, ConvertedOption } from '../utils/unitConversions';
import {
  getCameraErrorMessage,
  isSupportedBarcodeInput,
  normalizeBarcodeInput,
  scanBarcodeImage,
  startBarcodeCamera,
} from '../utils/barcodeScanner';
import type {
  BarcodeScannerControls,
  ScannedBarcode,
} from '../utils/barcodeScanner';
import { logWaterAPI, getDailyWaterAPI } from '../services/waterApi';
import { AppPanel, EmptyState, MacroBar, MetricCard, PageHeader } from '../components/VitalityUI';

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
  const auth = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NutritionData[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [detectedMode, setDetectedMode] = useState<'text' | 'barcode' | null>(null);

  // Camera scanner state
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'starting' | 'scanning'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraControlsRef = useRef<BarcodeScannerControls | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraSessionRef = useRef(0);
  const cameraAbortControllerRef = useRef<AbortController | null>(null);
  const [isScanningBarcodeImage, setIsScanningBarcodeImage] = useState(false);

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
  const [foodDetailsById, setFoodDetailsById] = useState<Record<string, NutritionData>>({});
  const [isLoadingLog, setIsLoadingLog] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  // --- Water Tracking State ---
  const [dailyWater, setDailyWater] = useState(0);
  const [waterUnit, setWaterUnit] = useState<'ml' | 'oz'>('ml');

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

  const handleAddWater = async (amount: number, isOz: boolean = false) => {
    const amountInMl = isOz ? Math.round(amount * 29.5735) : amount;
    try {
      await logWaterAPI(amountInMl, currentDate, auth);
      setDailyWater((prev) => prev + amountInMl);
      const displayAmount = isOz ? `${amount} oz` : `${amount}ml`;
      setSnackbarMessage(`Added ${displayAmount} of water`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage("Failed to log water");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      fetchDailyWater(); // Revert
    }
  };
  const lookupBarcode = useCallback(async (barcodeValue: string) => {
    if (!auth.token) {
      setSearchError("Authentication token not found. Please log in.");
      return;
    }

    const normalizedBarcode = normalizeBarcodeInput(barcodeValue);
    if (normalizedBarcode.length !== 13) {
      setSearchError("Enter or scan a UPC-A, EAN-13, EAN-8, or GTIN-13 barcode.");
      return;
    }

    setIsLoadingSearch(true);
    setSearchError(null);
    try {
      const food = await findFoodByBarcodeAPI(normalizedBarcode, auth);
      setSearchResults([food]);
      setSearchQuery(normalizedBarcode);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Failed to find food by barcode.");
      setSearchResults([]);
    } finally {
      setIsLoadingSearch(false);
    }
  }, [auth]);

  const handleBarcodeImageScan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsLoadingSearch(true);
    setIsScanningBarcodeImage(true);
    setSearchError(null);
    setSearchResults([]);
    setDetectedMode(null);

    try {
      const barcode = await scanBarcodeImage(file);
      setIsScanningBarcodeImage(false);
      setDetectedMode('barcode');
      await lookupBarcode(normalizeBarcodeInput(barcode.text, barcode.format));
    } catch (err) {
      setSearchError(
        err instanceof Error
          ? err.message
          : 'The barcode photo could not be scanned. Try a clearer photo or enter the number manually.',
      );
      setSearchResults([]);
    } finally {
      setIsScanningBarcodeImage(false);
      setIsLoadingSearch(false);
    }
  };

  // --- Live Camera Scanner ---
  const stopCameraScanner = useCallback(() => {
    cameraSessionRef.current += 1;
    cameraAbortControllerRef.current?.abort();
    cameraAbortControllerRef.current = null;
    cameraControlsRef.current?.stop();
    cameraControlsRef.current = null;
    setCameraStatus('idle');
  }, []);

  const startCameraScanner = useCallback(async () => {
    stopCameraScanner();
    const session = cameraSessionRef.current;
    const videoElement = cameraVideoRef.current;

    if (!videoElement) {
      setCameraStatus('idle');
      setCameraError('The camera preview could not be initialized. Close the scanner and try again.');
      return;
    }

    const abortController = new AbortController();
    cameraAbortControllerRef.current = abortController;

    setCameraStatus('starting');
    setCameraError(null);

    try {
      const controls = await startBarcodeCamera(
        videoElement,
        (barcode: ScannedBarcode, activeControls) => {
          if (cameraSessionRef.current !== session) return;

          cameraSessionRef.current += 1;
          cameraAbortControllerRef.current = null;
          activeControls.stop();
          cameraControlsRef.current = null;
          setCameraStatus('idle');
          setCameraDialogOpen(false);
          setDetectedMode('barcode');
          void lookupBarcode(normalizeBarcodeInput(barcode.text, barcode.format));
        },
        (error) => {
          if (cameraSessionRef.current !== session) return;
          stopCameraScanner();
          setCameraError(getCameraErrorMessage(error));
        },
        abortController.signal,
      );

      if (cameraSessionRef.current !== session) {
        controls.stop();
        return;
      }

      cameraControlsRef.current = controls;
      setCameraStatus('scanning');
    } catch (err) {
      if (cameraSessionRef.current !== session) return;
      if (cameraAbortControllerRef.current === abortController) {
        cameraAbortControllerRef.current = null;
      }
      setCameraStatus('idle');
      setCameraError(getCameraErrorMessage(err));
    }
  }, [lookupBarcode, stopCameraScanner]);

  const handleCloseCameraDialog = useCallback(() => {
    stopCameraScanner();
    setCameraDialogOpen(false);
  }, [stopCameraScanner]);

  const handleOpenCameraDialog = () => {
    setCameraStatus('starting');
    setCameraError(null);
    setCameraDialogOpen(true);
  };

  const handleCameraDialogEntered = useCallback(() => {
    if (cameraDialogOpen) void startCameraScanner();
  }, [cameraDialogOpen, startCameraScanner]);

  // The dialog uses a transition, so its video ref can be unavailable during
  // the parent's open-state effect. Start only after the preview is mounted.
  useEffect(() => () => stopCameraScanner(), [stopCameraScanner]);


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

  useEffect(() => {
    if (!auth.token || loggedEntries.length === 0) return;

    const foodIdsToLoad = Array.from(new Set(
      loggedEntries
        .map((entry) => entry.fatsecret_food_id)
        .filter((foodId): foodId is string => Boolean(foodId && !foodDetailsById[foodId]))
    ));

    if (foodIdsToLoad.length === 0) return;

    let cancelled = false;
    Promise.all(
      foodIdsToLoad.map(async (foodId) => {
        try {
          const details = await getFoodDetailsAPI(foodId, auth);
          return details ? [foodId, details] as const : null;
        } catch (error) {
          console.warn(`Could not hydrate food metadata for ${foodId}:`, error);
          return null;
        }
      })
    ).then((details) => {
      if (cancelled) return;
      const nextDetails = details.reduce((acc, detail) => {
        if (detail) acc[detail[0]] = detail[1];
        return acc;
      }, {} as Record<string, NutritionData>);

      if (Object.keys(nextDetails).length > 0) {
        setFoodDetailsById((previous) => ({ ...previous, ...nextDetails }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [auth.token, loggedEntries, foodDetailsById]);

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!auth.token) {
        setSearchError("Authentication token not found. Please log in.");
        setIsLoadingSearch(false);
        return;
      }
      const trimmed = query.trim();
      if (trimmed === '') {
        setSearchResults([]);
        setSearchError(null);
        setIsLoadingSearch(false);
        setDetectedMode(null);
        return;
      }

      // Auto-detect barcode pattern
      if (isSupportedBarcodeInput(trimmed)) {
        setDetectedMode('barcode');
        await lookupBarcode(trimmed);
        return;
      }

      setDetectedMode('text');
      if (trimmed.length < 2) {
        setSearchResults([]);
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
    }, 300),
    [auth, lookupBarcode]
  );

  useEffect(() => {
    if (searchQuery.trim() !== '') {
      setIsLoadingSearch(true);
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
      setIsLoadingSearch(false);
      setSearchError(null);
      setDetectedMode(null);
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
      fatsecret_serving_id: selectedFoodForDialog ? (formDataForDialog.fatsecret_serving_id || selectedFoodForDialog.servingId) : "",
      reference_serving_description: selectedFoodForDialog ? (formDataForDialog.reference_serving_description || selectedFoodForDialog.servingSize) : formDataForDialog.reference_serving_description || '',
      base_calories: selectedFoodForDialog ? (formDataForDialog.base_calories ?? selectedFoodForDialog.calories) : formDataForDialog.base_calories || 0,
      base_protein: selectedFoodForDialog ? (formDataForDialog.base_protein ?? selectedFoodForDialog.protein) : formDataForDialog.base_protein || 0,
      base_fat: selectedFoodForDialog ? (formDataForDialog.base_fat ?? selectedFoodForDialog.fat) : formDataForDialog.base_fat || 0,
      base_carbs: selectedFoodForDialog ? (formDataForDialog.base_carbs ?? selectedFoodForDialog.carbs) : formDataForDialog.base_carbs || 0,
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

  const getAttributeNames = (
    attributes: FoodAttributeFlag[] | undefined,
    status: FoodAttributeFlag['status']
  ) => attributes?.filter((attribute) => attribute.status === status).map((attribute) => attribute.name) ?? [];

  const renderFoodMetadataChips = (food: NutritionData | undefined | null, limit = 5) => {
    if (!food) return null;

    const positivePreferences = getAttributeNames(food.dietaryPreferences, 'contains');
    const presentAllergens = getAttributeNames(food.allergens, 'contains');
    const metadataItems = [
      ...(food.isGeneric ? ['Generic'] : ['Brand']),
      ...(food.foodSubCategories ?? []).slice(0, 2),
      ...positivePreferences.slice(0, 2),
      ...presentAllergens.slice(0, 1).map((name) => `Contains ${name}`),
    ].slice(0, limit);

    if (metadataItems.length === 0) return null;

    return (
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 0.75 }}>
        {metadataItems.map((item) => (
          <Chip
            key={item}
            label={item}
            size="small"
            sx={{
              height: 22,
              borderRadius: 1,
              bgcolor: item.startsWith('Contains') ? 'rgba(190, 62, 52, 0.1)' : 'var(--vv-surface-muted)',
              color: item.startsWith('Contains') ? '#9f2d24' : 'var(--vv-primary-2)',
              fontWeight: 800,
              fontSize: '0.72rem',
            }}
          />
        ))}
      </Stack>
    );
  };

  const renderFoodAttributeSummary = (food: NutritionData) => {
    const presentAllergens = getAttributeNames(food.allergens, 'contains');
    const freeAllergens = getAttributeNames(food.allergens, 'free');
    const unknownAllergens = getAttributeNames(food.allergens, 'unknown');
    const positivePreferences = getAttributeNames(food.dietaryPreferences, 'contains');
    const negativePreferences = getAttributeNames(food.dietaryPreferences, 'free');

    const hasAllergenData = presentAllergens.length > 0
      || freeAllergens.length > 0
      || unknownAllergens.length > 0;
    const hasPreferenceData = positivePreferences.length > 0 || negativePreferences.length > 0;

    if (!hasAllergenData && !hasPreferenceData) return null;

    return (
      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'white', borderRadius: 2, border: '1px solid rgba(182, 214, 204, 0.34)' }}>
        <Typography variant="subtitle2" sx={{ color: 'var(--color-primary-dark)', fontWeight: 900, mb: 1 }}>
          Allergens and dietary preferences
        </Typography>

        {positivePreferences.length > 0 && (
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
            {positivePreferences.map((preference) => (
              <Chip key={preference} label={preference} size="small" sx={{ bgcolor: 'rgba(182, 214, 204, 0.34)', color: 'var(--color-primary-dark)', fontWeight: 800 }} />
            ))}
          </Stack>
        )}
        {positivePreferences.length === 0 && hasPreferenceData && (
          <Typography variant="body2" sx={{ color: 'var(--color-secondary)', mb: 0.75 }}>
            No dietary preferences are marked as present.
          </Typography>
        )}

        {negativePreferences.length > 0 && (
          <Typography variant="caption" sx={{ display: 'block', color: 'var(--color-secondary)', mb: hasAllergenData ? 1 : 0 }}>
            Not marked: {negativePreferences.join(', ')}
          </Typography>
        )}

        {hasAllergenData && (
          presentAllergens.length > 0 ? (
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
              {presentAllergens.map((allergen) => (
                <Chip key={allergen} label={`Contains ${allergen}`} size="small" sx={{ bgcolor: 'rgba(190, 62, 52, 0.1)', color: '#9f2d24', fontWeight: 800 }} />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" sx={{ color: 'var(--color-secondary)', mb: 0.75 }}>
              No listed allergens are marked as present.
            </Typography>
          )
        )}

        {freeAllergens.length > 0 && (
          <Typography variant="caption" sx={{ display: 'block', color: 'var(--color-secondary)' }}>
            Marked free: {freeAllergens.join(', ')}
          </Typography>
        )}
        {unknownAllergens.length > 0 && (
          <Typography variant="caption" sx={{ display: 'block', color: 'var(--color-secondary)' }}>
            Unknown: {unknownAllergens.join(', ')}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Box className="vv-page">
      <PageHeader
        title="Food and water log"
        subtitle="Search foods, scan barcodes, review nutrition details, and track water."
        action={(
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, gap: 1.5 }}>
          <TextField
            label="Date"
            type="date"
            value={currentDate}
            onChange={handleDateChange}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{
              width: { xs: '100%', sm: 170 },
              '& .MuiOutlinedInput-root': {
                bgcolor: 'var(--vv-surface)',
              },
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleClickOpenManualAddDialog}
            disableElevation
            sx={{
              minHeight: 40,
              px: 2.5,
            }}
          >
            Manual entry
          </Button>
          </Box>
        )}
      />

      <Grid container spacing={2.4} sx={{ mb: 3 }} alignItems="stretch">
        <Grid item xs={12} lg={7}>
          <AppPanel sx={{ height: '100%' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search food by name or enter barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'var(--vv-primary)' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {searchQuery && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                          setDetectedMode(null);
                        }}
                        aria-label="clear search"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}
                  </InputAdornment>
                )
              }}
              sx={{
                mb: 1.5,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'var(--vv-surface)',
                  '& fieldset': { borderColor: 'var(--vv-line)' },
                }
              }}
            />

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{ mb: 1.5 }}
            >
              <Button
                variant="outlined"
                size="small"
                startIcon={<QrCodeScannerIcon />}
                onClick={handleOpenCameraDialog}
                aria-label="Scan a product barcode with the camera"
                sx={{ justifyContent: 'flex-start' }}
              >
                Scan with camera
              </Button>
              <Button
                variant="outlined"
                size="small"
                component="label"
                startIcon={<UploadFileIcon />}
                disabled={isScanningBarcodeImage}
                aria-label="Upload a photo containing a product barcode"
                sx={{ justifyContent: 'flex-start' }}
              >
                {isScanningBarcodeImage ? 'Scanning photo…' : 'Upload barcode photo'}
                <input
                  hidden
                  accept="image/*"
                  type="file"
                  onChange={handleBarcodeImageScan}
                />
              </Button>
            </Stack>

            {isScanningBarcodeImage && (
              <Typography
                variant="caption"
                role="status"
                aria-live="polite"
                sx={{ display: 'block', color: 'var(--vv-muted)', mb: 1.5 }}
              >
                Checking the uploaded image for a UPC or EAN barcode…
              </Typography>
            )}

            {detectedMode === 'barcode' && isLoadingSearch && !isScanningBarcodeImage && (
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label="Barcode Detected" 
                  size="small" 
                  sx={{ 
                    height: 20, 
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    bgcolor: 'rgba(47, 70, 29, 0.1)',
                    color: 'var(--vv-primary)',
                  }} 
                />
                <Typography variant="caption" sx={{ color: 'var(--vv-muted)' }}>
                  Looking up code via database...
                </Typography>
              </Box>
            )}

            {searchError && <Alert severity="error" sx={{ mb: 2 }}>{searchError}</Alert>}

            {isLoadingSearch && !isScanningBarcodeImage && (
              <Paper variant="outlined" sx={{ borderRadius: 2, borderColor: 'var(--vv-line)', bgcolor: 'var(--vv-surface-soft)', p: 1 }}>
                <List dense>
                  {[1, 2, 3].map((n) => (
                    <ListItem key={n} divider={n !== 3} sx={{ borderColor: 'var(--vv-line)', py: 1.5 }}>
                      <ListItemAvatar>
                        <Skeleton variant="rounded" width={48} height={48} sx={{ mr: 1 }} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Skeleton variant="text" width="60%" height={24} />}
                        secondary={<Skeleton variant="text" width="40%" height={20} />}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {!isLoadingSearch && searchResults.length > 0 && (
              <Paper variant="outlined" sx={{ maxHeight: 330, overflow: 'auto', borderRadius: 2, borderColor: 'var(--vv-line)', bgcolor: 'var(--vv-surface-soft)', p: 1 }}>
                <List dense>
                  {searchResults.map((food) => (
                    <ListItem
                      key={food.id}
                      divider
                      sx={{ borderColor: 'var(--vv-line)', borderRadius: 1, mb: 0.5, '&:hover': { bgcolor: 'rgba(47, 70, 29, 0.05)' } }}
                      secondaryAction={
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleOpenLogDialog(food)}
                          sx={{
                            borderColor: 'var(--vv-primary)',
                            color: 'var(--vv-primary)',
                            borderRadius: 2,
                            '&:hover': {
                              bgcolor: 'var(--vv-primary)',
                              color: 'white',
                              borderColor: 'var(--vv-primary)'
                            }
                          }}
                        >
                          Log
                        </Button>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar
                          variant="rounded"
                          src={food.imageUrl || undefined}
                          alt={food.name}
                          title={food.imageSource ? `Photo from ${food.imageSource}` : undefined}
                          sx={{ 
                            width: 48, 
                            height: 48, 
                            mr: 1, 
                            bgcolor: 'var(--vv-surface-muted)',
                            color: 'var(--vv-primary-2)'
                          }}
                        >
                          <RestaurantIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={(
                          <Box sx={{ pr: 1 }}>
                            <Typography sx={{ fontWeight: '700', color: 'var(--vv-ink)' }}>{food.name}</Typography>
                            {renderFoodMetadataChips(food)}
                          </Box>
                        )}
                        secondary={(
                          <Typography variant="body2" sx={{ color: 'var(--vv-muted)', mt: 0.5 }}>
                            {food.brandName ? `${food.brandName} - ` : ''}{food.calories} {food.calorieUnit || 'kcal'} per {food.servingSize}
                          </Typography>
                        )}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
            {!isLoadingSearch && searchQuery.trim() !== '' && searchResults.length === 0 && !searchError && (
              <Typography sx={{ my: 2, color: 'var(--vv-muted)', textAlign: 'center', fontStyle: 'italic' }}>No results found for "{searchQuery}".</Typography>
            )}
          </AppPanel>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Stack spacing={2.4} sx={{ height: '100%' }}>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <MetricCard label="Calories" value={dailyTotals.calories.toFixed(0)} detail="logged today" progress={Math.min(dailyTotals.calories / 22, 100)} />
              </Grid>
              <Grid item xs={6}>
                <MetricCard
                  label="Water"
                  value={waterUnit === 'ml' ? `${(dailyWater / 1000).toFixed(2)} L` : `${(dailyWater / 29.5735).toFixed(1)} oz`}
                  detail="+ quick add"
                  progress={Math.min((dailyWater / 2500) * 100, 100)}
                  accent="var(--vv-accent-2)"
                />
              </Grid>
            </Grid>
            <AppPanel sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ color: 'var(--vv-ink)', fontWeight: 950, mb: 2 }}>
                Logged today
              </Typography>
              {loggedEntries.length > 0 ? (
                <Stack spacing={1.4} sx={{ mb: 2.5 }}>
                  {loggedEntries.slice(0, 3).map((entry) => (
                    <Box key={entry.log_entry_id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, borderBottom: '1px solid var(--vv-line)', pb: 1.2 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: 'var(--vv-ink)', fontWeight: 850, lineHeight: 1.1 }}>
                          {entry.food_name || 'Unknown food'}
                        </Typography>
                        <Typography sx={{ color: 'var(--vv-muted)', fontSize: '0.82rem', fontWeight: 750 }}>
                          {entry.meal_type}
                        </Typography>
                      </Box>
                      <Box sx={{ alignSelf: 'center', bgcolor: 'var(--vv-surface-muted)', borderRadius: 999, px: 1.3, py: 0.6 }}>
                        <Typography sx={{ color: 'var(--vv-primary-2)', fontSize: '0.78rem', fontWeight: 950 }}>
                          {(parseFloat(String(entry.calories_consumed)) || 0).toFixed(0)} cal
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <EmptyState>No food logged for {currentDate}.</EmptyState>
              )}

              <Stack spacing={1.1} sx={{ my: 2.4 }}>
                <MacroBar label="Protein" value={`${dailyTotals.protein.toFixed(0)}g`} percent={Math.min((dailyTotals.protein / 140) * 100, 100)} color="var(--vv-primary-2)" />
                <MacroBar label="Carbs" value={`${dailyTotals.carbs.toFixed(0)}g`} percent={Math.min((dailyTotals.carbs / 220) * 100, 100)} color="var(--vv-accent)" />
                <MacroBar label="Fat" value={`${dailyTotals.fat.toFixed(0)}g`} percent={Math.min((dailyTotals.fat / 75) * 100, 100)} color="var(--vv-accent-2)" />
              </Stack>

              <Divider sx={{ my: 2.5, borderColor: 'var(--vv-line)' }} />

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography sx={{ color: 'var(--vv-ink)', fontWeight: 850, fontSize: '0.95rem' }}>
                  Water intake
                </Typography>
                <ToggleButtonGroup
                  value={waterUnit}
                  exclusive
                  onChange={(_e, val) => val && setWaterUnit(val)}
                  size="small"
                  sx={{
                    height: 28,
                    '& .MuiToggleButton-root': {
                      py: 0,
                      px: 1.5,
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'none',
                      color: 'var(--vv-muted)',
                      borderColor: 'var(--vv-line)',
                      '&.Mui-selected': {
                        color: 'var(--vv-primary)',
                        bgcolor: 'var(--vv-surface-muted)',
                        borderColor: 'var(--vv-line-strong)',
                      }
                    }
                  }}
                >
                  <ToggleButton value="ml">ml</ToggleButton>
                  <ToggleButton value="oz">oz</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {waterUnit === 'ml' ? (
                  [250, 500, 750].map((amount) => (
                    <Button
                      key={amount}
                      variant="outlined"
                      onClick={() => handleAddWater(amount, false)}
                      sx={{
                        borderColor: 'var(--vv-line-strong)',
                        color: 'var(--vv-primary-2)',
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 800,
                        '&:hover': {
                          borderColor: 'var(--vv-primary-2)',
                          bgcolor: 'var(--vv-surface-soft)',
                        }
                      }}
                    >
                      + {amount}ml
                    </Button>
                  ))
                ) : (
                  [8, 12, 16, 24].map((amount) => (
                    <Button
                      key={amount}
                      variant="outlined"
                      onClick={() => handleAddWater(amount, true)}
                      sx={{
                        borderColor: 'var(--vv-line-strong)',
                        color: 'var(--vv-primary-2)',
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 800,
                        '&:hover': {
                          borderColor: 'var(--vv-primary-2)',
                          bgcolor: 'var(--vv-surface-soft)',
                        }
                      }}
                    >
                      + {amount} oz
                    </Button>
                  ))
                )}
              </Box>
            </AppPanel>
          </Stack>
        </Grid>
      </Grid>

      {isLoadingLog && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress sx={{ color: 'var(--color-primary)' }} /></Box>}
      {logError && <Alert severity="error" sx={{ my: 2 }}>{logError}</Alert>}
      {!isLoadingLog && !logError && loggedEntries.length === 0 && (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', my: 2, bgcolor: 'white', borderRadius: 3, border: '1px dashed rgba(13, 93, 86, 0.28)' }}>
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
            <Divider sx={{ my: 2, borderColor: 'rgba(182, 214, 204, 0.30)' }} />
            <List disablePadding>
              {groupedEntries[mealType].map((entry) => {
                const entryFoodDetails = foodDetailsById[entry.fatsecret_food_id];

                return (
                  <ListItem
                    key={entry.log_entry_id}
                    divider
                    sx={{
                      borderColor: 'rgba(182, 214, 204, 0.22)',
                      py: 2,
                      '&:last-child': { borderBottom: 'none' }
                    }}
                  >
                    <Grid container alignItems="center" spacing={1}>
                      <Grid item xs={12} sm={4} md={3}>
                        <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                          {entryFoodDetails?.imageUrl && (
                            <Avatar
                              variant="rounded"
                              src={entryFoodDetails.imageUrl}
                              alt={entry.food_name || 'Food'}
                              sx={{ width: 44, height: 44, bgcolor: 'var(--color-bg)', flexShrink: 0 }}
                            />
                          )}
                          <ListItemText
                            primary={<Typography sx={{ fontWeight: '600', color: 'var(--color-primary-dark)' }}>{entry.food_name || "Unknown Food"}</Typography>}
                            secondary={(
                              <Box>
                                <Typography variant="body2" sx={{ color: 'var(--color-secondary)' }}>
                                  {`${parseFloat(String(entry.logged_quantity)).toFixed(1)} x ${entry.logged_serving_description}`}
                                </Typography>
                                {renderFoodMetadataChips(entryFoodDetails, 4)}
                              </Box>
                            )}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={10} sm={6} md={7}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'space-around' }, alignItems: 'center', pl: { xs: 0, sm: 1 }, gap: { xs: 1, sm: 0.5 } }}>
                          <Typography variant="body2" sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold', minWidth: '70px', textAlign: 'right' }}>{(parseFloat(String(entry.calories_consumed)) || 0).toFixed(0)} kcal</Typography>
                          <Typography variant="body2" sx={{ color: '#0c8346', minWidth: '60px', textAlign: 'right' }}>P: {parseFloat(String(entry.protein_consumed)).toFixed(1)}g</Typography>
                          <Typography variant="body2" sx={{ color: '#b6d6cc', minWidth: '60px', textAlign: 'right' }}>C: {parseFloat(String(entry.carbs_consumed)).toFixed(1)}g</Typography>
                          <Typography variant="body2" sx={{ color: '#806443', minWidth: '60px', textAlign: 'right' }}>F: {parseFloat(String(entry.fat_consumed)).toFixed(1)}g</Typography>
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
                );
              })}
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
            <Box sx={{ mb: 3, p: 2, bgcolor: 'var(--color-bg)', borderRadius: 2, border: '1px solid rgba(182, 214, 204, 0.30)' }}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 2 }}>
                {selectedFoodForDialog.imageUrl && (
                  <Avatar
                    variant="rounded"
                    src={selectedFoodForDialog.imageUrl}
                    alt={selectedFoodForDialog.name}
                    sx={{ width: 64, height: 64, bgcolor: 'white', border: '1px solid rgba(182, 214, 204, 0.34)' }}
                  />
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: 'var(--color-primary-dark)', fontWeight: 900, lineHeight: 1.15 }}>
                    {selectedFoodForDialog.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--color-secondary)', mt: 0.25 }}>
                    {selectedFoodForDialog.brandName || (selectedFoodForDialog.isGeneric ? 'Generic food' : 'Brand food')}
                  </Typography>
                  {renderFoodMetadataChips(selectedFoodForDialog, 6)}
                </Box>
              </Box>
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
                  <Typography variant="body2" sx={{ color: '#0c8346' }}>
                    P: {selectedFoodForDialog.availableServings
                      ? (formDataForDialog.base_protein !== undefined ? formDataForDialog.base_protein : selectedFoodForDialog.protein)
                      : selectedFoodForDialog.protein}{selectedFoodForDialog.proteinUnit || 'g'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#b6d6cc' }}>
                    C: {selectedFoodForDialog.availableServings
                      ? (formDataForDialog.base_carbs !== undefined ? formDataForDialog.base_carbs : selectedFoodForDialog.carbs)
                      : selectedFoodForDialog.carbs}{selectedFoodForDialog.carbsUnit || 'g'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#806443' }}>
                    F: {selectedFoodForDialog.availableServings
                      ? (formDataForDialog.base_fat !== undefined ? formDataForDialog.base_fat : selectedFoodForDialog.fat)
                      : selectedFoodForDialog.fat}{selectedFoodForDialog.fatUnit || 'g'}
                  </Typography>
                </Box>
              </DialogContentText>
              {renderFoodAttributeSummary(selectedFoodForDialog)}
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
                      '& fieldset': { borderColor: 'rgba(13, 93, 86, 0.28)' },
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
                    '& fieldset': { borderColor: 'rgba(13, 93, 86, 0.28)' },
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
                    '& fieldset': { borderColor: 'rgba(13, 93, 86, 0.28)' },
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
                    '& fieldset': { borderColor: 'rgba(13, 93, 86, 0.28)' },
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
                    '& fieldset': { borderColor: 'rgba(13, 93, 86, 0.28)' },
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
                        '& fieldset': { borderColor: 'rgba(13, 93, 86, 0.28)' },
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
                        '& fieldset': { borderColor: 'rgba(13, 93, 86, 0.28)' },
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
                        '& fieldset': { borderColor: 'rgba(13, 93, 86, 0.28)' },
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
                        '& fieldset': { borderColor: 'rgba(13, 93, 86, 0.28)' },
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
                        '& fieldset': { borderColor: 'rgba(13, 93, 86, 0.28)' },
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

      {/* Live Camera Scanner Dialog */}
      <Dialog
        open={cameraDialogOpen}
        onClose={handleCloseCameraDialog}
        TransitionProps={{ onEntered: handleCameraDialogEntered }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { bgcolor: 'white', borderRadius: 3 } }}
      >
        <DialogTitle sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Scan Barcode</span>
          <IconButton onClick={handleCloseCameraDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2, textAlign: 'center', pb: 3 }}>
          <DialogContentText sx={{ mb: 2 }}>
            Align the product barcode within the frame to scan.
          </DialogContentText>
          <Box 
            sx={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: 320, 
              aspectRatio: '1.5',
              margin: '0 auto', 
              borderRadius: 2,
              overflow: 'hidden',
              border: '2px solid var(--vv-primary)',
              bgcolor: 'black'
            }}
          >
            <Box
              component="video"
              ref={cameraVideoRef}
              autoPlay
              muted
              playsInline
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {cameraStatus === 'starting' && (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', bgcolor: 'rgba(0, 0, 0, 0.58)', gap: 1 }}>
                <CircularProgress color="inherit" size={32} />
                <Typography variant="body2">Starting camera...</Typography>
              </Box>
            )}
            {cameraStatus === 'scanning' && (
              <Box
                aria-hidden="true"
                sx={{
                  position: 'absolute',
                  inset: '22% 9%',
                  border: '2px solid white',
                  borderRadius: 1.5,
                  boxShadow: '0 0 0 999px rgba(0, 0, 0, 0.18)',
                }}
              />
            )}
          </Box>
          {cameraStatus === 'scanning' && (
            <Typography variant="caption" role="status" aria-live="polite" sx={{ display: 'block', mt: 1.25, color: 'var(--vv-muted)' }}>
              Camera is active and looking for a UPC or EAN barcode…
            </Typography>
          )}
          {cameraError && (
            <Alert
              severity="error"
              sx={{ mt: 2, textAlign: 'left' }}
              action={(
                <Button color="inherit" size="small" onClick={() => void startCameraScanner()}>
                  Retry
                </Button>
              )}
            >
              {cameraError}
            </Alert>
          )}
        </DialogContent>
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
