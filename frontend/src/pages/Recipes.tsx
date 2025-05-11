// frontend/src/pages/RecipesPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Typography, Box, Paper, Grid, Card, CardContent, CardMedia,
  CardActions, TextField, InputAdornment, Button, Chip, FormControl,
  InputLabel, Select, MenuItem, Dialog, DialogContent, DialogTitle,
  DialogActions, Divider, List, ListItem, ListItemText, IconButton,
  CircularProgress, Alert, Pagination
} from '@mui/material';
import {
  Search as SearchIcon, AccessTime as TimeIcon, Restaurant as MealTypeIcon,
  Bookmark as BookmarkIcon, BookmarkBorder as BookmarkBorderIcon,
  AutoAwesome as FeaturedIcon, ErrorOutline as ErrorIcon
} from '@mui/icons-material';
import { useThemeContext, themeColors } from '../context/ThemeContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  getRecipeCalorieEstimate, RecipeCalorieEstimateData,
  getRecipesByCategory, RecipeSummary,
  searchRecipesByNameFromApi, // Expects to return array of MealDbFullMeal
  getRecipeDetailsById,     // Expects to return single MealDbFullMeal
  getFeaturedRecipes,       // Expects to return array of MealDbFullMeal
  MealDbFullMeal,           // Type for full meal details from API
  // ApiSingleRecipeResponse, // Type for getRecipeDetailsById response
} from '../services/recipeApi.ts';

// Interface for FULL recipe details used in the Dialog
interface FullRecipeDetails extends RecipeSummary { // Extends RecipeSummary for common base fields
  category?: string;
  area?: string;
  instructions?: string[];
  ingredients?: { name: string; measure: string }[];
  tags?: string[];
  youtubeUrl?: string;
  prepTime?: number; // These might be mocked or derived if not directly from API
  isFavorite?: boolean; // Managed locally or synced with backend
}

const ALL_CATEGORIES_VALUE = "ALL_CATEGORIES_SEARCH_MODE";
const FEATURED_RECIPES_MODE = "FEATURED_RECIPES_MODE"; // To represent initial featured load
const ITEMS_PER_PAGE = 6;

const RecipesPage: React.FC = () => {
  const [searchQueryInput, setSearchQueryInput] = useState(''); // Text in the search bar
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState(''); // Query used for API global search
  const [currentCategoryOrMode, setCurrentCategoryOrMode] = useState<string>(FEATURED_RECIPES_MODE);

  const [masterRecipesList, setMasterRecipesList] = useState<RecipeSummary[]>([]); // Full list for current view
  const [paginatedRecipes, setPaginatedRecipes] = useState<RecipeSummary[]>([]); // Items for current page
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [listError, setListError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Dialog States
  const [openRecipeDialog, setOpenRecipeDialog] = useState(false);
  const [clickedRecipeSummaryForDialog, setClickedRecipeSummaryForDialog] = useState<RecipeSummary | null>(null);
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

  // --- Data Adapters ---
  const adaptMealDbFullToRecipeSummary = (meal: MealDbFullMeal): RecipeSummary => ({
    idMeal: meal.idMeal,
    strMeal: meal.strMeal,
    strMealThumb: meal.strMealThumb || '/api/placeholder/600/400', // Fallback image
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
      youtubeUrl: meal.strYoutube || undefined, prepTime: 30, // Example placeholder
      isFavorite: false, // Default
    };
  };

  // --- Data Fetching Logic for the Main List ---
  const loadRecipes = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    setMasterRecipesList([]);
    setCurrentPage(1);

    try {
      let apiResponse;
      let newMasterList: RecipeSummary[] = [];

      if (currentCategoryOrMode === FEATURED_RECIPES_MODE) {
        console.log("RecipesPage: Fetching featured recipes");
        apiResponse = await getFeaturedRecipes(); // Expects { success, data: MealDbFullMeal[] }
        if (apiResponse.success && apiResponse.data && Array.isArray(apiResponse.data)) {
          newMasterList = apiResponse.data.map(adaptMealDbFullToRecipeSummary);
        } else if (apiResponse.success && !apiResponse.data) {
          console.log("RecipesPage: Featured recipes returned no data.");
          // newMasterList remains empty
        } else {
          setListError(apiResponse.message || "Failed to load featured recipes.");
        }
      } else if (currentCategoryOrMode === ALL_CATEGORIES_VALUE && submittedSearchQuery.trim() !== "") {
        console.log(`RecipesPage: Global search for: "${submittedSearchQuery}"`);
        apiResponse = await searchRecipesByNameFromApi(submittedSearchQuery); // Expects { success, data: MealDbFullMeal[] }
        if (apiResponse.success && apiResponse.data && Array.isArray(apiResponse.data)) {
          newMasterList = apiResponse.data.map(adaptMealDbFullToRecipeSummary);
        } else if (apiResponse.success && !apiResponse.data) {
          console.log(`RecipesPage: Search for "${submittedSearchQuery}" returned no data.`);
          // newMasterList remains empty
        } else {
          setListError(apiResponse.message || `No results found for "${submittedSearchQuery}".`);
        }
      } else if (currentCategoryOrMode !== ALL_CATEGORIES_VALUE && currentCategoryOrMode !== FEATURED_RECIPES_MODE) { // Specific category
        console.log(`RecipesPage: Fetching recipes for category: ${currentCategoryOrMode}`);
        apiResponse = await getRecipesByCategory(currentCategoryOrMode); // Expects { success, data: RecipeSummary[] }
        if (apiResponse.success && apiResponse.data && Array.isArray(apiResponse.data)) {
          newMasterList = apiResponse.data;
        } else if (apiResponse.success && !apiResponse.data) {
          console.log(`RecipesPage: Category "${currentCategoryOrMode}" returned no data.`);
          // newMasterList remains empty
        } else {
          setListError(apiResponse.message || "Failed to load recipes for this category.");
        }
      } else {
        console.log("RecipesPage: No active search or category. Clearing list or show prompt.");
        newMasterList = []; // Clear list or show specific prompt message
      }
      setMasterRecipesList(newMasterList);
    } catch (err) {
      console.error("RecipesPage: Error in loadRecipes:", err);
      setListError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setMasterRecipesList([]);
    } finally {
      setIsLoadingList(false);
    }
  }, [currentCategoryOrMode, submittedSearchQuery]);

  // This useEffect triggers the main recipe list fetch
  useEffect(() => {
    loadRecipes(); // This is correctly calling the loadRecipes function defined above
  }, [loadRecipes]);

  // --- Client-side Filtering and Pagination Logic ---
  useEffect(() => {
    let listToPaginate = masterRecipesList;
    // If a specific category is selected AND there's a search query input, filter client-side
    if (currentCategoryOrMode !== ALL_CATEGORIES_VALUE &&
        currentCategoryOrMode !== FEATURED_RECIPES_MODE &&
        searchQueryInput.trim() !== "") {
      listToPaginate = masterRecipesList.filter(recipe =>
        recipe.strMeal.toLowerCase().includes(searchQueryInput.toLowerCase())
      );
    }

    setTotalPages(Math.ceil(listToPaginate.length / ITEMS_PER_PAGE));
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    setPaginatedRecipes(listToPaginate.slice(indexOfFirstItem, indexOfLastItem));

  }, [masterRecipesList, currentPage, searchQueryInput, currentCategoryOrMode]);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };


  // --- Dialog and Calorie Estimation ---
  const fetchFullRecipeDetailsForDialog = useCallback(async (recipeId: string) => {
    if (!recipeId) return;
    setIsLoadingDetails(true);
    setDetailsError(null);
    setSelectedRecipeDetails(null);
    try {
      const response = await getRecipeDetailsById(recipeId);
      if (response.success && response.data) {
        setSelectedRecipeDetails(adaptMealDbFullToFullRecipeDetails(response.data));
      } else {
        setDetailsError(response.message || "Full recipe details not found.");
      }
    } catch (err) {
      console.error("RecipesPage: Error fetching full recipe details for dialog:", err);
      setDetailsError(err instanceof Error ? err.message : "Failed to load recipe details.");
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  useEffect(() => { // For Calorie Estimation
    if (openRecipeDialog && selectedRecipeDetails && selectedRecipeDetails.idMeal && isAuthenticated && token) {
      console.log(`RecipesPage: Fetching calorie estimate for recipe ID: ${selectedRecipeDetails.idMeal}`);
      setIsEstimateLoading(true);
      setEstimateApiError(null);
      setCalorieEstimateData(null);
      getRecipeCalorieEstimate(selectedRecipeDetails.idMeal, token)
        .then(response => { /* ... set calorie data or error ... */
            if (response.success && response.data) { setCalorieEstimateData(response.data); }
            else { setEstimateApiError(response.message || "Failed to fetch calorie estimate."); }
        })
        .catch(err => { setEstimateApiError(err.message || "Error fetching calorie estimate."); })
        .finally(() => setIsEstimateLoading(false));
    }
  }, [openRecipeDialog, selectedRecipeDetails, isAuthenticated, token]);

  const handleOpenRecipe = (recipeSummary: RecipeSummary) => {
    setClickedRecipeSummaryForDialog(recipeSummary); // Keep this to show basic info while full loads
    setSelectedRecipeDetails(null);
    setCalorieEstimateData(null);
    setIsEstimateLoading(false);
    setEstimateApiError(null);
    setDetailsError(null); // Clear previous details error
    setOpenRecipeDialog(true);
    fetchFullRecipeDetailsForDialog(recipeSummary.idMeal);
  };

  const handleCloseRecipe = () => {
    setOpenRecipeDialog(false);
    setClickedRecipeSummaryForDialog(null);
    setSelectedRecipeDetails(null);
    setCalorieEstimateData(null);
  };

  const toggleFavorite = (id: string) => { /* ... placeholder ... */ console.log(`Toggle fav: ${id}`); };

  const handleSearchSubmit = (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    setCurrentCategoryOrMode(ALL_CATEGORIES_VALUE); // Switch to global search mode
    setSubmittedSearchQuery(searchQueryInput);     // Set the query that triggers API call
    setCurrentPage(1); // Reset to first page for new search
  };

  const handleCategoryChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newCategory = event.target.value as string;
    setCurrentCategoryOrMode(newCategory);
    setSearchQueryInput('');       // Clear visual search input text
    setSubmittedSearchQuery(''); // Clear submitted search query
    setCurrentPage(1);
  };

  // Determine current title based on mode
  let pageTitle = "Featured Recipes";
  if (currentCategoryOrMode === ALL_CATEGORIES_VALUE && submittedSearchQuery) {
    pageTitle = `Search Results for "${submittedSearchQuery}"`;
  } else if (currentCategoryOrMode === ALL_CATEGORIES_VALUE && !submittedSearchQuery) {
    pageTitle = "Search All Recipes";
  } else if (currentCategoryOrMode !== FEATURED_RECIPES_MODE) {
    pageTitle = `Recipes from "${currentCategoryOrMode}"`;
  }

  return (
    <Box sx={{ padding: 3, backgroundColor: '#fff8f0', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#283618ff' }}>
        {pageTitle}
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, color: '#606c38ff' }}>
        Discover delicious and nutritious recipes.
      </Typography>

      {/* Search and Filters Paper */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: '#fefae0ff', borderLeft: '4px solid #bc6c25ff' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <form onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder={currentCategoryOrMode === ALL_CATEGORIES_VALUE || currentCategoryOrMode === FEATURED_RECIPES_MODE ? "Search all recipes by name..." : `Filter within "${currentCategoryOrMode}"...`}
                value={searchQueryInput}
                onChange={(e) => setSearchQueryInput(e.target.value)}
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#606c38ff' }} /></InputAdornment>),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton type="submit" edge="end" aria-label="Search recipes">
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </form>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel sx={{ color: '#606c38ff' }}>View</InputLabel>
              <Select
                value={currentCategoryOrMode}
                onChange={handleCategoryChange}
                label="View"
              >
                <MenuItem value={FEATURED_RECIPES_MODE}><FeaturedIcon sx={{mr:1, fontSize:'1.2rem'}} />Featured Recipes</MenuItem>
                <MenuItem value={ALL_CATEGORIES_VALUE}>All (Global Search)</MenuItem>
                <MenuItem value="Seafood">Seafood</MenuItem>
                <MenuItem value="Dessert">Dessert</MenuItem>
                <MenuItem value="Chicken">Chicken</MenuItem>
                <MenuItem value="Beef">Beef</MenuItem>
                <MenuItem value="Vegetarian">Vegetarian</MenuItem>
                <MenuItem value="Pasta">Pasta</MenuItem>
                <MenuItem value="Starter">Starter</MenuItem>
                <MenuItem value="Breakfast">Breakfast</MenuItem>
                {/* TODO: Populate more categories dynamically */}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading/Error/Empty State for Recipe List */}
      {isLoadingList && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
          <CircularProgress /> <Typography sx={{ ml: 2 }}>Loading recipes...</Typography>
        </Box>
      )}
      {!isLoadingList && listError && (
        <Alert severity="error" sx={{ my: 2 }}>{listError}</Alert>
      )}
      {!isLoadingList && !listError && paginatedRecipes.length === 0 && (
         <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fefae0ff', border: '1px dashed #bc6c25ff' }}>
          <Typography variant="h6" sx={{ color: '#283618ff' }}>No recipes found.</Typography>
          <Typography sx={{ color: '#606c38ff' }}>
            {currentCategoryOrMode === ALL_CATEGORIES_VALUE && !submittedSearchQuery
              ? "Enter a search term above to find recipes globally."
              : currentCategoryOrMode === FEATURED_RECIPES_MODE ? "No featured recipes available at the moment. Try selecting a category or searching."
              : "Try a different search term or category."}
          </Typography>
        </Paper>
      )}

      {/* Recipe Cards Grid - maps over paginatedRecipes */}
      {!isLoadingList && !listError && paginatedRecipes.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ color: '#283618ff', mt: 2 }}>
            Showing {paginatedRecipes.length} of {masterRecipesList.length} recipes
            {currentCategoryOrMode === ALL_CATEGORIES_VALUE && submittedSearchQuery ? ` for "${submittedSearchQuery}"`
            : (currentCategoryOrMode !== FEATURED_RECIPES_MODE && currentCategoryOrMode !== ALL_CATEGORIES_VALUE) ? ` in "${currentCategoryOrMode}"`
            : ''}
             {totalPages > 1 ? ` (Page ${currentPage} of ${totalPages})` : ''}
          </Typography>
          <Grid container spacing={3}>
            {paginatedRecipes.map((recipeSummary) => (
              <Grid item xs={12} sm={6} md={4} key={recipeSummary.idMeal}>
                <Card sx={{ transition: 'transform 0.3s ease', '&:hover': { transform: 'translateY(-5px)', boxShadow: 3 }, borderTop: '4px solid #bc6c25ff', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <CardMedia
                    component="img"
                    height="180"
                    image={recipeSummary.strMealThumb}
                    alt={recipeSummary.strMeal}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: {xs: 50, sm: 70} }}>
                      <Typography variant="h6" component="div" gutterBottom sx={{ color: '#283618ff', fontSize: '1.1rem' }}>
                        {recipeSummary.strMeal}
                      </Typography>
                      <IconButton onClick={() => console.log('Favorite for', recipeSummary.idMeal)} size="small">
                        <BookmarkBorderIcon sx={{ color: '#dda15eff' }} />
                      </IconButton>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ mt: 'auto' }}>
                    <Button size="small" variant="contained" onClick={() => handleOpenRecipe(recipeSummary)} fullWidth sx={{ bgcolor: '#bc6c25ff', '&:hover': { bgcolor: '#a55b20' } }}>
                      View Recipe
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* --- Recipe Detail Dialog --- */}
      <Dialog open={openRecipeDialog} onClose={handleCloseRecipe} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: '#fff8f0' } }}>
         {(isLoadingDetails || (openRecipeDialog && !selectedRecipeDetails && !detailsError)) && (
          <DialogContent sx={{ p: 3, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress /> <Typography sx={{ mt: 2 }}>Loading recipe details...</Typography>
          </DialogContent>
        )}
        {detailsError && !isLoadingDetails && (
          <DialogContent sx={{ p: 3 }}>
            <Alert severity="error">Error loading recipe details: {detailsError}</Alert>
            <DialogActions><Button onClick={handleCloseRecipe}>Close</Button></DialogActions>
          </DialogContent>
        )}
        {!isLoadingDetails && !detailsError && selectedRecipeDetails && (
          <>
            <DialogTitle sx={{ color: '#283618ff', borderBottom: '1px solid #dda15eff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {selectedRecipeDetails.strMeal}
                <IconButton onClick={() => toggleFavorite(selectedRecipeDetails.idMeal)} sx={{ color: selectedRecipeDetails.isFavorite ? '#bc6c25ff' : '#dda15eff' }}>
                  {selectedRecipeDetails.isFavorite ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: '#dda15eff' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={5}>
                  <CardMedia component="img" image={selectedRecipeDetails.strMealThumb} alt={selectedRecipeDetails.strMeal} sx={{ borderRadius: 1, mb: 2, maxHeight: 300, objectFit: 'cover' }}/>
                  {selectedRecipeDetails.prepTime && <Paper sx={{ p: 1, textAlign: 'center', bgcolor: '#fefae0ff', mb: 1 }}><TimeIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} /> Prep: {selectedRecipeDetails.prepTime} min</Paper>}
                  {selectedRecipeDetails.category && <Paper sx={{ p: 1, textAlign: 'center', bgcolor: '#fefae0ff', mb: 1 }}><MealTypeIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} /> Category: {selectedRecipeDetails.category}</Paper>}
                  <Paper sx={{ p: 1, textAlign: 'center', bgcolor: '#fefae0ff', mb: 2 }}>
                    <Typography variant="body2" color="#606c38ff">Est. Calories</Typography>
                    {isEstimateLoading && <CircularProgress size={20} sx={{ mt: 0.5 }} />}
                    {estimateApiError && !isEstimateLoading && <Typography color="error" variant="caption" sx={{ mt: 0.5, display: 'block' }}>{estimateApiError}</Typography>}
                    {calorieEstimateData && !isEstimateLoading && !estimateApiError && ( <Typography variant="h6" sx={{ color: '#bc6c25ff', mt: 0.5 }}>{calorieEstimateData.estimatedTotalCalories} kcal</Typography> )}
                    {!isAuthenticated && !isEstimateLoading && !estimateApiError && ( <Typography variant="caption" color="textSecondary" sx={{mt: 0.5, display: 'block'}}>Login to view.</Typography> )}
                    {calorieEstimateData && !isEstimateLoading && !estimateApiError && ( <Typography variant="caption" color="textSecondary" sx={{mt: 0.5, display: 'block'}}>(Automated estimate)</Typography> )}
                  </Paper>
                  {selectedRecipeDetails.tags && selectedRecipeDetails.tags.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ color: '#283618ff', fontWeight:'bold' }}>Tags</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selectedRecipeDetails.tags.map((tag) => ( <Chip key={tag} label={tag} size="small" sx={{ textTransform: 'capitalize', bgcolor: '#fefae0ff', color: '#606c38ff' }}/> ))}
                      </Box>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={7}>
                  <Typography variant="subtitle1" gutterBottom sx={{ color: '#283618ff', fontWeight:'bold' }}>Ingredients</Typography>
                  <List dense sx={{ maxHeight: 200, overflow: 'auto', mb:2, border: '1px solid #dda15eff', borderRadius: 1, bgcolor: '#fffefa', p:0 }}>
                    {calorieEstimateData?.ingredients && calorieEstimateData.ingredients.length > 0
                      ? calorieEstimateData.ingredients.map((ing, index) => (
                          <ListItem key={`${ing.ingredient}-${index}`} dense divider={index < calorieEstimateData.ingredients.length -1} sx={{ borderColor: '#fefae0ff', py: 0.25 }}>
                            <ListItemText 
                              primary={`${ing.measure} ${ing.ingredient}`}
                              secondary={`(${ing.status})${ing.calculatedCalories ? ` ~${ing.calculatedCalories.toFixed(0)} kcal.` : '.'}${ing.parsedMeasureInfo?.parseNotes && ing.parsedMeasureInfo.parseNotes.length > 0 ? ` Notes: ${ing.parsedMeasureInfo.parseNotes.join(' ')}` : ''}${ing.error ? ` Error: ${ing.error}`: ''}`}
                              primaryTypographyProps={{ variant: 'body2', color: '#283618ff' }}
                              secondaryTypographyProps={{ variant: 'caption', style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }}/>
                          </ListItem>
                        ))
                      : selectedRecipeDetails.ingredients?.map((ingredient, index) => (
                          <ListItem key={index} dense divider={index < selectedRecipeDetails.ingredients.length - 1} sx={{ borderColor: '#fefae0ff', py: 0.25 }}>
                            <ListItemText primary={`${ingredient.measure} ${ingredient.name}`} sx={{ color: '#283618ff' }} primaryTypographyProps={{ variant: 'body2' }}/>
                          </ListItem>
                        ))
                    }
                  </List>
                  <Typography variant="subtitle1" gutterBottom sx={{ color: '#283618ff', fontWeight:'bold', mt:1 }}>Instructions</Typography>
                  <List dense sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #dda15eff', borderRadius: 1, bgcolor: '#fffefa', p:0 }}>
                    {selectedRecipeDetails.instructions?.map((instruction, index) => (
                      <ListItem key={index} dense divider={index < selectedRecipeDetails.instructions.length - 1} sx={{ borderColor: '#fefae0ff', py: 0.25, alignItems: 'flex-start' }}>
                        <ListItemText primary={`${index + 1}. ${instruction}`} sx={{ color: '#283618ff' }} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid #dda15eff', px:3, py:2 }}>
              <Button onClick={handleCloseRecipe} sx={{ color: '#606c38ff' }}>Close</Button>
              <Button variant="contained" sx={{ bgcolor: '#bc6c25ff', '&:hover': { bgcolor: '#a55b20' } }}>Add to Meal Plan</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#606c38ff' }}>
          Recipes powered by TheMealDB.
        </Typography>
      </Box>
    </Box>
  );
};

export default RecipesPage;