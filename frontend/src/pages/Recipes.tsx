import { useState, useEffect, useCallback } from 'react';
import {
  Typography, Box, Paper, Grid, Card, CardContent, CardMedia,
  TextField, InputAdornment, Button, Chip, FormControl,
  InputLabel, Select, MenuItem, Pagination, CircularProgress, Alert,
  SelectChangeEvent,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  List, ListItem, ListItemText, Divider
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';

// Import FatSecret types and functions
import {
    FatSecretRecipeSummary, // Use this for the cards
    FatSecretRecipeDetail, // Use this for the dialog
    FatSecretServingDetail,
    FatSecretIngredientDetail,
    searchRecipesFromFatSecret,
    getFatSecretRecipeDetailsById,
    getFatSecretRecipeTypes,
    ApiFatSecretSearchResponse, // Import response types if needed for direct handling
    ApiFatSecretGetRecipeResponse,
    ApiFatSecretRecipeTypesResponse
} from '../services/recipeApi';

const ITEMS_PER_PAGE = 9; // Adjust as needed, max 50 per FatSecret API
const ALL_CATEGORIES_VALUE = "ALL";

const Recipes: React.FC = () => {
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedRecipeType, setSelectedRecipeType] = useState<string>(ALL_CATEGORIES_VALUE);
  const [availableRecipeTypes, setAvailableRecipeTypes] = useState<string[]>([ALL_CATEGORIES_VALUE]);

  // Recipe List State
  const [recipes, setRecipes] = useState<FatSecretRecipeSummary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1); // FatSecret uses 0-based index, adjust in API call
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Dialog State
  const [openRecipeDialog, setOpenRecipeDialog] = useState(false);
  const [selectedRecipeIdForDialog, setSelectedRecipeIdForDialog] = useState<string | null>(null);
  const [selectedRecipeDetails, setSelectedRecipeDetails] = useState<FatSecretRecipeDetail | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Fetch available recipe types on mount
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        console.log("Fetching recipe types...");
        const response = await getFatSecretRecipeTypes();
        console.log("Recipe types response:", response);
        
        if (response.success && response.data) {
          // Handle both possible response structures - first check recipes.recipe_type
          let recipeTypes: string[] = [];
          if (response.data.recipes?.recipe_type) {
            recipeTypes = response.data.recipes.recipe_type;
          } 
          // Fallback to recipe_types.recipe_type if available
          else if (response.data.recipe_types?.recipe_type) {
            recipeTypes = response.data.recipe_types.recipe_type;
          }
          
          if (recipeTypes.length > 0) {
            console.log("Found recipe types:", recipeTypes);
            setAvailableRecipeTypes([ALL_CATEGORIES_VALUE, ...recipeTypes]);
          } else {
            console.error("Failed to fetch recipe types: Empty recipe types array");
          }
        } else {
          console.error("Failed to fetch recipe types:", response.message);
          // Keep default [ALL_CATEGORIES_VALUE]
        }
      } catch (error) {
        console.error("Error fetching recipe types:", error);
      }
    };
    fetchTypes();
  }, []);

  // Fetch recipes when search, filter, or page changes
  const fetchRecipes = useCallback(async () => {
    setIsLoadingList(true);
    setListError(null);
    setRecipes([]); // Clear previous results

    const params = {
        search_expression: debouncedSearchQuery || undefined,
        recipe_types: selectedRecipeType === ALL_CATEGORIES_VALUE ? undefined : selectedRecipeType,
        page_number: currentPage - 1, // API is 0-based
        max_results: ITEMS_PER_PAGE, // <--- This uses the ITEMS_PER_PAGE constant
    };

    try {
        const response = await searchRecipesFromFatSecret(params);
        if (response.success && response.data && response.data.recipes) {
            const recipesData = response.data.recipes;
            setRecipes(recipesData.recipe || []);
            const total = parseInt(recipesData.total_results || '0', 10);
            setTotalResults(total);
            setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));
            if (total === 0) {
              setListError('No recipes found matching your criteria.');
            }
        } else {
            setListError(response.message || "Failed to fetch recipes.");
            setTotalResults(0);
            setTotalPages(0);
        }
    } catch (error) {
        console.error("Error fetching recipes:", error);
        setListError(error instanceof Error ? error.message : "An unexpected error occurred.");
        setTotalResults(0);
        setTotalPages(0);
    } finally {
        setIsLoadingList(false);
    }
  }, [debouncedSearchQuery, selectedRecipeType, currentPage]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  // Fetch full recipe details when dialog opens
  useEffect(() => {
    if (selectedRecipeIdForDialog && openRecipeDialog) {
      const fetchDetails = async () => {
        setIsLoadingDetails(true);
        setDetailsError(null);
        setSelectedRecipeDetails(null); // Clear previous details
        try {
          const response = await getFatSecretRecipeDetailsById(selectedRecipeIdForDialog);
          if (response.success && response.data?.recipe) {
            setSelectedRecipeDetails(response.data.recipe);
          } else {
            setDetailsError(response.message || "Failed to load recipe details.");
          }
        } catch (error) {
          console.error("Error fetching recipe details:", error);
          setDetailsError(error instanceof Error ? error.message : "An unexpected error occurred.");
        } finally {
          setIsLoadingDetails(false);
        }
      };
      fetchDetails();
    }
  }, [selectedRecipeIdForDialog, openRecipeDialog]);

  // Handlers
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset page on new search query
  };

  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    setSelectedRecipeType(event.target.value as string);
    setCurrentPage(1); // Reset page on category change
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const handleOpenRecipe = (recipeId: string) => {
    setSelectedRecipeIdForDialog(recipeId);
    setOpenRecipeDialog(true);
  };

  const handleCloseRecipe = () => {
    setOpenRecipeDialog(false);
    setSelectedRecipeIdForDialog(null);
    setSelectedRecipeDetails(null); // Clear details on close
    setDetailsError(null);
  };

  // Helper to get primary recipe type for chip display
  const getPrimaryRecipeType = (recipe: FatSecretRecipeSummary): string => {
      return recipe.recipe_types?.recipe_type?.[0] || 'Unknown';
  }

  return (
    <Box sx={{ padding: 3, backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#333' }}>
        Discover Recipes (FatSecret)
      </Typography>

      <Paper elevation={2} sx={{ p: 2, mb: 3, backgroundColor: '#fff' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search recipes by name..."
              value={searchQuery} // Controlled by instant input
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Recipe Type</InputLabel>
              <Select
                labelId="recipe-type-select-label"
                value={selectedRecipeType}
                label="Recipe Type"
                onChange={handleCategoryChange}
              >
                {availableRecipeTypes.map((type: string) => (
                  <MenuItem key={type} value={type}>
                    {type === ALL_CATEGORIES_VALUE ? 'All Types' : type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {isLoadingList && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
          <CircularProgress /> <Typography sx={{ ml: 2 }}>Loading recipes...</Typography>
        </Box>
      )}
      {!isLoadingList && listError && (
        <Alert severity="warning" sx={{ my: 2 }}>{listError}</Alert>
      )}
      {!isLoadingList && !listError && recipes.length === 0 && (
         <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#fff' }}>
          <Typography variant="h6">Ready to search.</Typography>
          <Typography>Enter a search term or select a type.</Typography>
        </Paper>
      )}

      {!isLoadingList && !listError && recipes.length > 0 && (
        <>
         <Typography variant="body2" sx={{ mb: 2 }}>
           Showing {recipes.length} of {totalResults} results {totalPages > 1 ? ` (Page ${currentPage} of ${totalPages})` : ''}
         </Typography>
          <Grid container spacing={3}>
            {recipes.map((recipe) => (
              <Grid item xs={12} sm={6} md={4} key={recipe.recipe_id}>
                <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.03)'} }}>
                  <CardMedia
                    component="img"
                    height="200"
                    // Use recipe_image, provide fallback
                    image={recipe.recipe_image || 'https://via.placeholder.com/300x200.png?text=No+Image'}
                    alt={recipe.recipe_name}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div">
                      {recipe.recipe_name}
                    </Typography>
                    {/* Display primary recipe type */}
                    <Chip label={getPrimaryRecipeType(recipe)} size="small" sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {/* Access calories from recipe_nutrition */} 
                      Calories: {recipe.recipe_nutrition?.calories || 'N/A'}
                    </Typography>
                    {/* Use recipe_description */} 
                    {recipe.recipe_description && (
                       <Typography variant="body2" color="text.secondary" sx={{mt: 1, maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis'}}>
                         {recipe.recipe_description}
                       </Typography>
                    )}
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                     {/* Pass recipe_id to handler */}
                     <Button size="small" variant="contained" fullWidth onClick={() => handleOpenRecipe(recipe.recipe_id)}>
                       View Recipe
                     </Button>
                   </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
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
      <Dialog open={openRecipeDialog} onClose={handleCloseRecipe} maxWidth="md" fullWidth scroll="paper">
        {isLoadingDetails && (
             <DialogContent sx={{ p: 3, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                 <CircularProgress /> <Typography sx={{ mt: 2 }}>Loading details...</Typography>
             </DialogContent>
        )}
        {!isLoadingDetails && detailsError && (
            <DialogContent sx={{ p: 3 }}>
                 <Alert severity="error">{detailsError}</Alert>
                 <DialogActions><Button onClick={handleCloseRecipe}>Close</Button></DialogActions>
            </DialogContent>
        )}
        {!isLoadingDetails && !detailsError && selectedRecipeDetails && (
          <>
            <DialogTitle sx={{ m: 0, p: 2, borderBottom: '1px solid #eee' }}>
              {selectedRecipeDetails.recipe_name}
              <IconButton
                aria-label="close"
                onClick={handleCloseRecipe}
                sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers={true}>
              <Grid container spacing={3}> {/* Increased spacing */}
                <Grid item xs={12} md={5}>
                  <CardMedia
                    component="img"
                    // Use first image from recipe_images array if available, then fallback to recipe_image from summary (if we had it), or placeholder
                    image={selectedRecipeDetails.recipe_images?.recipe_image?.[0] || 'https://via.placeholder.com/300x200.png?text=No+Image'}
                    alt={selectedRecipeDetails.recipe_name}
                    sx={{ borderRadius: 1, mb: 2, maxHeight: 350, objectFit: 'cover' }}
                  />
                  {/* Display Types & Categories if they exist */}
                  {selectedRecipeDetails.recipe_types?.recipe_type && (
                     <Box mb={1}><Typography variant="subtitle2">Types:</Typography>
                       {selectedRecipeDetails.recipe_types.recipe_type.map((type: string) => <Chip key={type} label={type} size="small" sx={{ mr: 0.5, mb: 0.5}} />)}
                     </Box>
                  )}
                   {selectedRecipeDetails.recipe_categories?.recipe_category && (
                     <Box mb={1}><Typography variant="subtitle2">Categories:</Typography>
                       {selectedRecipeDetails.recipe_categories.recipe_category.map((cat: any, index: number) => <Chip key={cat.recipe_category_name} label={cat.recipe_category_name} size="small" sx={{ mr: 0.5, mb: 0.5}} />)}
                     </Box>
                  )}
                  {/* Display Time & Rating */} 
                  {selectedRecipeDetails.preparation_time_min && <Typography variant="body2" sx={{mb: 0.5}}>Prep Time: {selectedRecipeDetails.preparation_time_min} min</Typography>}
                  {selectedRecipeDetails.cooking_time_min && <Typography variant="body2" sx={{mb: 0.5}}>Cook Time: {selectedRecipeDetails.cooking_time_min} min</Typography>}
                  {selectedRecipeDetails.number_of_servings && <Typography variant="body2" sx={{mb: 0.5}}>Servings: {selectedRecipeDetails.number_of_servings}</Typography>}
                  {selectedRecipeDetails.rating && <Typography variant="body2" sx={{mb: 1}}>Rating: {selectedRecipeDetails.rating}/5</Typography>}

                  {/* Display Nutrition from serving_sizes.serving */} 
                  {selectedRecipeDetails.serving_sizes?.serving && (
                    <Paper variant="outlined" sx={{p: 1.5, mb: 2}}>
                        <Typography variant="subtitle1" gutterBottom>Nutrition (per {selectedRecipeDetails.serving_sizes.serving.serving_size || 'serving'})</Typography>
                        <Typography variant="body2">Calories: <strong>{selectedRecipeDetails.serving_sizes.serving.calories}</strong> kcal</Typography>
                        <Typography variant="body2">Carbs: {selectedRecipeDetails.serving_sizes.serving.carbohydrate}g</Typography>
                        <Typography variant="body2">Protein: {selectedRecipeDetails.serving_sizes.serving.protein}g</Typography>
                        <Typography variant="body2">Fat: {selectedRecipeDetails.serving_sizes.serving.fat}g</Typography>
                        {/* Add other optional nutrients here */}
                        {selectedRecipeDetails.serving_sizes.serving.fiber && <Typography variant="caption" display="block">Fiber: {selectedRecipeDetails.serving_sizes.serving.fiber}g</Typography>}
                        {selectedRecipeDetails.serving_sizes.serving.sugar && <Typography variant="caption" display="block">Sugar: {selectedRecipeDetails.serving_sizes.serving.sugar}g</Typography>}
                        {selectedRecipeDetails.serving_sizes.serving.sodium && <Typography variant="caption" display="block">Sodium: {selectedRecipeDetails.serving_sizes.serving.sodium}mg</Typography>}
                    </Paper>
                  )}
                  {selectedRecipeDetails.recipe_description && (
                    <Typography variant="body2" color="text.secondary" paragraph>
                       {selectedRecipeDetails.recipe_description}
                    </Typography>
                   )}
                </Grid>
                <Grid item xs={12} md={7}>
                    {/* Display Ingredients from ingredients.ingredient */}
                    {selectedRecipeDetails?.ingredients?.ingredient && selectedRecipeDetails.ingredients.ingredient.length > 0 && (
                      <Box mb={3}>
                        <Typography variant="h6" gutterBottom>Ingredients</Typography>
                        <List dense disablePadding>
                          {selectedRecipeDetails?.ingredients?.ingredient.map((ing: any, index: number) => (
                            <ListItem key={ing.food_id + index} disableGutters divider={index < (selectedRecipeDetails?.ingredients?.ingredient.length || 0) -1}>
                              <ListItemText primary={ing.ingredient_description} secondary={`(${ing.food_name})`} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                    {/* Display Directions from directions.direction */} 
                    {selectedRecipeDetails?.directions?.direction && selectedRecipeDetails.directions.direction.length > 0 && (
                      <Box>
                         <Typography variant="h6" gutterBottom>Instructions</Typography>
                         <List dense disablePadding>
                           {selectedRecipeDetails?.directions?.direction.map((step: any, index: number) => (
                             <ListItem key={step.direction_number} disableGutters divider={index < (selectedRecipeDetails?.directions?.direction.length || 0) - 1} sx={{alignItems: 'flex-start'}}>
                               <ListItemText primary={`${step.direction_number}. ${step.direction_description}`} />
                             </ListItem>
                           ))}
                         </List>
                      </Box>
                    )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid #eee', p: '8px 16px' }}>
              <Button onClick={handleCloseRecipe}>Close</Button>
              <Button variant="contained">Add to Meal Plan</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

    </Box>
  );
};

export default Recipes;
