// frontend/src/pages/RecipesPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Box, Paper, Grid, Card, CardContent, CardMedia,
  CardActions, TextField, InputAdornment, Button, Chip, FormControl,
  InputLabel, Select, MenuItem, Dialog, DialogContent, DialogTitle,
  DialogActions, Divider, List, ListItem, ListItemText, IconButton,
  CircularProgress, Alert, Pagination // <-- Import Pagination
} from '@mui/material';
import {
  Search as SearchIcon, AccessTime as TimeIcon, Restaurant as MealTypeIcon,
  Bookmark as BookmarkIcon, BookmarkBorder as BookmarkBorderIcon,
  AutoAwesome as FeaturedIcon // Example for featured
} from '@mui/icons-material';
import { useThemeContext, themeColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  getRecipeCalorieEstimate, RecipeCalorieEstimateData,
  getRecipesByCategory, RecipeSummary,
  searchRecipesByNameFromApi, MealDbFullMeal,
  getRecipeDetailsById,
  getFeaturedRecipes // <-- Import service for featured recipes
} from '../services/recipeApi';

// Interface for FULL recipe details used in the Dialog
interface FullRecipeDetails extends RecipeSummary {
  category?: string;
  area?: string;
  instructions?: string[];
  ingredients?: { name: string; measure: string }[];
  tags?: string[];
  youtubeUrl?: string;
  prepTime?: number;
  isFavorite?: boolean;
}

const ALL_CATEGORIES_VALUE = "ALL_CATEGORIES_SEARCH_MODE";
const FEATURED_RECIPES_MODE = "FEATURED_RECIPES_MODE";
const ITEMS_PER_PAGE = 6; // For pagination

const RecipesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [currentCategory, setCurrentCategory] = useState(FEATURED_RECIPES_MODE); // Start with featured

  // masterList holds all items for current view (category or search), pre-pagination
  const [masterRecipesList, setMasterRecipesList] = useState<RecipeSummary[]>([]);
  // recipesToDisplay holds the paginated subset of masterRecipesList
  const [recipesToDisplay, setRecipesToDisplay] = useState<RecipeSummary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [listError, setListError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Dialog States
  const [openRecipeDialog, setOpenRecipeDialog] = useState(false);
  const [clickedRecipeSummary, setClickedRecipeSummary] = useState<RecipeSummary | null>(null);
  const [selectedRecipeDetails, setSelectedRecipeDetails] = useState<FullRecipeDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Calorie Estimation States
  const [calorieEstimateData, setCalorieEstimateData] = useState<RecipeCalorieEstimateData | null>(null);
  const [isEstimateLoading, setIsEstimateLoading] = useState<boolean>(false);
  const [estimateApiError, setEstimateApiError] = useState<string | null>(null);

  const { setCurrentThemeColor } = useThemeContext();
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    setCurrentThemeColor(themeColors.tigersEye);
  }, [setCurrentThemeColor]);

  const adaptMealDbFullToRecipeSummary = (meal: MealDbFullMeal): RecipeSummary => ({
    idMeal: meal.idMeal,
    strMeal: meal.strMeal,
    strMealThumb: meal.strMealThumb || '/api/placeholder/600/400',
  });

  const adaptMealDbFullToFullRecipeDetails = (meal: MealDbFullMeal): FullRecipeDetails => {
    const ingredientsList: { name: string; measure: string }[] = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}` as keyof MealDbFullMeal] as string | null;
      const measure = meal[`strMeasure${i}` as keyof MealDbFullMeal] as string | null;
      if (ingredient && ingredient.trim() !== "") {
        ingredientsList.push({ name: ingredient.trim(), measure: (measure || "").trim() });
      } else { break; }
    }
    return {
      idMeal: meal.idMeal, strMeal: meal.strMeal, strMealThumb: meal.strMealThumb || '/api/placeholder/600/400',
      category: meal.strCategory || undefined, area: meal.strArea || undefined,
      instructions: meal.strInstructions?.split(/\r?\n/).filter((line: string) => line.trim() !== "") || [],
      ingredients: ingredientsList, tags: meal.strTags?.split(',').map((t: string) => t.trim()) || [],
      youtubeUrl: meal.strYoutube || undefined, prepTime: 30, isFavorite: false,
    };
  };

  const fetchAndSetRecipes = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    setMasterRecipesList([]);
    setCurrentPage(1); // Reset to first page on new data load

    try {
      let apiResponse;
      let newMasterList: RecipeSummary[] = [];

      if (currentCategory === FEATURED_RECIPES_MODE && !activeSearchQuery) {
        console.log("RecipesPage: Fetching featured recipes");
        apiResponse = await getFeaturedRecipes(); // Expects { success: boolean, data: MealDbFullMeal[] }
        if (apiResponse.success && apiResponse.data) {
          newMasterList = apiResponse.data.map(adaptMealDbFullToRecipeSummary);
        } else {
          setListError(apiResponse.message || "Failed to load featured recipes.");
        }
      } else if (currentCategory === ALL_CATEGORIES_VALUE && activeSearchQuery.trim() !== "") {
        console.log(`RecipesPage: Global search for: "${activeSearchQuery}"`);
        apiResponse = await searchRecipesByNameFromApi(activeSearchQuery); // Expects { success: boolean, data: MealDbFullMeal[] }
        if (apiResponse.success && apiResponse.data) {
          newMasterList = apiResponse.data.map(adaptMealDbFullToRecipeSummary);
        } else {
          setListError(apiResponse.message || `No results found for "${activeSearchQuery}".`);
        }
      } else if (currentCategory !== ALL_CATEGORIES_VALUE && currentCategory !== FEATURED_RECIPES_MODE) {
        console.log(`RecipesPage: Fetching recipes for category: ${currentCategory}`);
        apiResponse = await getRecipesByCategory(currentCategory); // Expects { success: boolean, data: RecipeSummary[] }
        if (apiResponse.success && apiResponse.data) {
          newMasterList = apiResponse.data;
        } else {
          setListError(apiResponse.message || "Failed to load recipes for this category.");
        }
      } else {
        // Default state e.g. "ALL_CATEGORIES_VALUE" but no search query
        console.log("RecipesPage: Please select a category or enter a search term.");
      }
      setMasterRecipesList(newMasterList);
      setTotalPages(Math.ceil(newMasterList.length / ITEMS_PER_PAGE));

    } catch (err) { /* ... error handling ... */ }
    finally { setIsLoadingList(false); }
  }, [currentCategory, activeSearchQuery]);

  useEffect(() => {
    fetchAndSetRecipes();
  }, [fetchAndSetRecipes]);

  // Update recipesToDisplay when masterRecipesList or currentPage changes
  useEffect(() => {
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    setRecipesToDisplay(masterRecipesList.slice(indexOfFirstItem, indexOfLastItem));
  }, [masterRecipesList, currentPage]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  // --- Dialog and Calorie Estimation Logic (largely unchanged) ---
  const fetchFullRecipeDetailsForDialog = useCallback(async (recipeId: string) => { /* ... as before ... */ }, []);
  useEffect(() => { /* ... calorie estimate useEffect ... */ }, [openRecipeDialog, selectedRecipeDetails, isAuthenticated, token]);
  const handleOpenRecipe = (recipeSummary: RecipeSummary) => { /* ... as before ... */ };
  const handleCloseRecipe = () => { /* ... as before ... */ };
  const toggleFavorite = (id: string) => { /* ... as before ... */ };

  const handleSearchSubmit = (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    setCurrentCategory(ALL_CATEGORIES_VALUE); // Switch to global search mode
    setActiveSearchQuery(searchQuery); // This triggers the fetchAndSetRecipes effect
    setCurrentPage(1); // Reset to first page for new search
  };

  const handleCategoryChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newCategory = event.target.value as string;
    setCurrentCategory(newCategory);
    setSearchQuery(''); // Clear search input
    setActiveSearchQuery(''); // Clear active search query
    setDisplayMode(newCategory === ALL_CATEGORIES_VALUE || newCategory === FEATURED_RECIPES_MODE ? newCategory : 'category'); // Set display mode
    setCurrentPage(1); // Reset to first page
    // fetchAndSetRecipes will be called by its useEffect
  };
  
  // Helper to set display mode, though fetchAndSetRecipes largely manages this via currentCategory
  const [displayMode, setDisplayMode] = useState<'featured' | 'category' | 'search'>(FEATURED_RECIPES_MODE);
   useEffect(() => {
    if (currentCategory === FEATURED_RECIPES_MODE && !activeSearchQuery) {
      setDisplayMode('featured');
    } else if (currentCategory === ALL_CATEGORIES_VALUE && activeSearchQuery) {
      setDisplayMode('search');
    } else if (currentCategory !== ALL_CATEGORIES_VALUE && currentCategory !== FEATURED_RECIPES_MODE) {
      setDisplayMode('category');
    }
  }, [currentCategory, activeSearchQuery]);


  return (
    <Box sx={{ padding: 3, backgroundColor: '#fff8f0', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#283618ff' }}>
        {displayMode === 'search' ? `Search Results for "${activeSearchQuery}"`
          : displayMode === 'category' ? `Recipes from "${currentCategory}"`
          : 'Featured Recipes'}
      </Typography>
      {/* ... Subtitle ... */}

      <Paper /* ... Search and Filters Paper ... */ >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <form onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search all recipes by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{ /* ... search icon and submit button ... */
                  startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#606c38ff' }} /></InputAdornment>),
                  endAdornment: (<InputAdornment position="end"><IconButton type="submit" edge="end"><SearchIcon /></IconButton></InputAdornment>)
                }}
              />
            </form>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel sx={{ color: '#606c38ff' }}>View</InputLabel>
              <Select
                value={currentCategory} // This will now also represent mode
                onChange={handleCategoryChange}
                label="View"
              >
                <MenuItem value={FEATURED_RECIPES_MODE}>Featured Recipes</MenuItem>
                <MenuItem value={ALL_CATEGORIES_VALUE}>All (Global Search)</MenuItem>
                <MenuItem value="Seafood">Seafood</MenuItem>
                <MenuItem value="Dessert">Dessert</MenuItem>
                <MenuItem value="Chicken">Chicken</MenuItem>
                {/* ... other categories ... */}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading/Error/Empty State for Recipe List */}
      {isLoadingList && ( /* ... Loading UI ... */ )}
      {!isLoadingList && listError && ( /* ... Error UI ... */ )}
      {!isLoadingList && !listError && recipesToDisplay.length === 0 && (
         <Paper sx={{ /* ... empty state styles ... */ }}>
          <Typography variant="h6" sx={{ color: '#283618ff' }}>No recipes found.</Typography>
          <Typography sx={{ color: '#606c38ff' }}>
            {currentCategory === ALL_CATEGORIES_VALUE && !activeSearchQuery
              ? "Enter a search term above to find recipes."
              : currentCategory === FEATURED_RECIPES_MODE ? "No featured recipes available at the moment."
              : "Try a different category or search term."}
          </Typography>
        </Paper>
      )}

      {/* Recipe Cards Grid - maps over recipesToDisplay */}
      {!isLoadingList && !listError && recipesToDisplay.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ color: '#283618ff', mt: 2 }}>
            Showing {recipesToDisplay.length} of {masterRecipesList.length} recipes
            {displayMode === 'search' && activeSearchQuery ? ` for "${activeSearchQuery}"`
            : displayMode === 'category' ? ` in "${currentCategory}"`
            : ''}
          </Typography>
          <Grid container spacing={3}>
            {recipesToDisplay.map((recipeSummary) => (
              // ... Recipe Card JSX as before, using recipeSummary ...
              <Grid item xs={12} sm={6} md={4} key={recipeSummary.idMeal}>
                {/* ... Card structure ... using recipeSummary.strMeal, recipeSummary.strMealThumb ... */}
                <Button size="small" onClick={() => handleOpenRecipe(recipeSummary)} /* ... */>View Recipe</Button>
              </Grid>
            ))}
          </Grid>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary" // Or your theme color
              />
            </Box>
          )}
        </>
      )}

      {/* --- Recipe Detail Dialog (remains structurally similar) --- */}
      {/* ... (Dialog code, using selectedRecipeDetails and calorieEstimateData) ... */}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#606c38ff' }}>
          Recipes powered by TheMealDB.
        </Typography>
      </Box>
    </Box>
  );
};

export default RecipesPage;