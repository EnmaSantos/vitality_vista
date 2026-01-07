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
import { useThemeContext, themeColors } from '../context/ThemeContext';

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

import { usePageTheme, themePalette } from '../hooks/usePageTheme';

const Recipes: React.FC = () => {
  usePageTheme(themePalette.orange);
  // Theme context is no longer needed with CSS variables
  // const { setCurrentThemeColor } = useThemeContext();

  // Set theme color on component mount
  useEffect(() => {
    // setCurrentThemeColor(themeColors.tigersEye);
  }, []);

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
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'var(--color-bg)', minHeight: '100vh', pb: 8 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h3" sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold', fontFamily: 'Outfit, sans-serif' }}>
            Discover Recipes
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'var(--color-secondary)' }}>
            Find delicious and healthy meal ideas
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 4,
            bgcolor: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid rgba(96, 108, 56, 0.1)'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search recipes by name..."
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'var(--color-primary)' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 3,
                    bgcolor: 'var(--color-bg)',
                    '& fieldset': { borderColor: 'rgba(96, 108, 56, 0.2)' },
                    '&:hover fieldset': { borderColor: 'var(--color-primary) !important' },
                    '&.Mui-focused fieldset': { borderColor: 'var(--color-primary) !important' },
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel sx={{ color: 'var(--color-primary)' }}>Recipe Type</InputLabel>
                <Select
                  labelId="recipe-type-select-label"
                  value={selectedRecipeType}
                  label="Recipe Type"
                  onChange={handleCategoryChange}
                  sx={{
                    borderRadius: 3,
                    bgcolor: 'var(--color-bg)',
                    color: 'var(--color-primary-dark)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(96, 108, 56, 0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--color-primary)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--color-primary)' },
                    '& .MuiSvgIcon-root': { color: 'var(--color-primary)' }
                  }}
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
                  <Card
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      borderRadius: 4,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                      border: 'none',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="220"
                        image={recipe.recipe_image || 'https://via.placeholder.com/300x200.png?text=No+Image'}
                        alt={recipe.recipe_name}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          bgcolor: 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(4px)',
                          borderRadius: 2,
                          px: 1,
                          py: 0.5,
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          color: 'var(--color-primary-dark)'
                        }}
                      >
                        {recipe.recipe_nutrition?.calories || 'N/A'} kcal
                      </Box>
                    </Box>
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Typography
                        gutterBottom
                        variant="h6"
                        component="div"
                        sx={{
                          fontFamily: 'Outfit, sans-serif',
                          fontWeight: 600,
                          color: 'var(--color-primary-dark)',
                          mb: 1
                        }}
                      >
                        {recipe.recipe_name}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={getPrimaryRecipeType(recipe)}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(96, 108, 56, 0.1)',
                            color: 'var(--color-primary)',
                            fontWeight: 600,
                            borderRadius: 1
                          }}
                        />
                      </Box>

                      {recipe.recipe_description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            maxHeight: 60,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {recipe.recipe_description}
                        </Typography>
                      )}
                    </CardContent>
                    <Box sx={{ p: 3, pt: 0 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleOpenRecipe(recipe.recipe_id)}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          color: 'var(--color-primary)',
                          borderColor: 'var(--color-primary)',
                          '&:hover': {
                            borderColor: 'var(--color-primary-dark)',
                            bgcolor: 'rgba(96, 108, 56, 0.05)'
                          }
                        }}
                      >
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
        <Dialog
          open={openRecipeDialog}
          onClose={handleCloseRecipe}
          maxWidth="md"
          fullWidth
          scroll="paper"
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }
          }}
        >
          {isLoadingDetails && (
            <DialogContent sx={{ p: 5, textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress sx={{ color: 'var(--color-primary)' }} />
              <Typography sx={{ mt: 2, color: 'var(--color-secondary)' }}>Loading details...</Typography>
            </DialogContent>
          )}
          {!isLoadingDetails && detailsError && (
            <DialogContent sx={{ p: 3 }}>
              <Alert severity="error">{detailsError}</Alert>
              <DialogActions><Button onClick={handleCloseRecipe} sx={{ color: 'var(--color-primary)' }}>Close</Button></DialogActions>
            </DialogContent>
          )}
          {!isLoadingDetails && !detailsError && selectedRecipeDetails && (
            <>
              <DialogTitle sx={{ m: 0, p: 3, borderBottom: '1px solid rgba(0,0,0,0.05)', fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                {selectedRecipeDetails.recipe_name}
                <IconButton
                  aria-label="close"
                  onClick={handleCloseRecipe}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: 'var(--color-secondary)',
                    '&:hover': { color: 'var(--color-primary)' }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers sx={{ p: 4, borderColor: 'rgba(0,0,0,0.05)' }}>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={5}>
                    <CardMedia
                      component="img"
                      image={selectedRecipeDetails.recipe_images?.recipe_image?.[0] || 'https://via.placeholder.com/300x200.png?text=No+Image'}
                      alt={selectedRecipeDetails.recipe_name}
                      sx={{ borderRadius: 3, mb: 3, maxHeight: 350, objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    />

                    {/* Types & Categories */}
                    <Box sx={{ mb: 2 }}>
                      {selectedRecipeDetails.recipe_types?.recipe_type && (
                        <Box sx={{ mb: 1 }}>
                          {selectedRecipeDetails.recipe_types.recipe_type.map((type: string) => (
                            <Chip
                              key={type}
                              label={type}
                              size="small"
                              sx={{ mr: 0.5, mb: 0.5, bgcolor: 'rgba(96, 108, 56, 0.1)', color: 'var(--color-primary)', fontWeight: 600 }}
                            />
                          ))}
                        </Box>
                      )}
                      {selectedRecipeDetails.recipe_categories?.recipe_category && (
                        <Box>
                          {selectedRecipeDetails.recipe_categories.recipe_category.map((cat: any) => (
                            <Chip
                              key={cat.recipe_category_name}
                              label={cat.recipe_category_name}
                              size="small"
                              sx={{ mr: 0.5, mb: 0.5, bgcolor: 'var(--color-bg)', border: '1px solid rgba(0,0,0,0.05)' }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>

                    {/* Meta Info */}
                    <Box sx={{ p: 2, bgcolor: 'var(--color-bg)', borderRadius: 2, mb: 3 }}>
                      {selectedRecipeDetails.preparation_time_min && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Prep Time</Typography>
                          <Typography variant="body2" fontWeight="bold" color="var(--color-primary-dark)">{selectedRecipeDetails.preparation_time_min} min</Typography>
                        </Box>
                      )}
                      {selectedRecipeDetails.cooking_time_min && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Cook Time</Typography>
                          <Typography variant="body2" fontWeight="bold" color="var(--color-primary-dark)">{selectedRecipeDetails.cooking_time_min} min</Typography>
                        </Box>
                      )}
                      {selectedRecipeDetails.number_of_servings && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Servings</Typography>
                          <Typography variant="body2" fontWeight="bold" color="var(--color-primary-dark)">{selectedRecipeDetails.number_of_servings}</Typography>
                        </Box>
                      )}
                      {selectedRecipeDetails.rating && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">Rating</Typography>
                          <Typography variant="body2" fontWeight="bold" color="var(--color-accent)">{selectedRecipeDetails.rating}/5</Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Nutrition Card */}
                    {selectedRecipeDetails.serving_sizes?.serving && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          mb: 2,
                          bgcolor: 'white',
                          border: '1px solid rgba(221, 161, 94, 0.3)',
                          borderRadius: 3,
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <Box sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '4px',
                          height: '100%',
                          bgcolor: 'var(--color-accent)'
                        }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'var(--color-primary-dark)', mb: 2 }}>
                          Nutrition <span style={{ fontWeight: 'normal', fontSize: '0.85em', color: 'var(--color-secondary)' }}>(per {selectedRecipeDetails.serving_sizes.serving.serving_size || 'serving'})</span>
                        </Typography>

                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="h4" sx={{ color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>
                              {selectedRecipeDetails.serving_sizes.serving.calories}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Calories</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption">Protein</Typography>
                                <Typography variant="body2" fontWeight="bold">{selectedRecipeDetails.serving_sizes.serving.protein}g</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption">Carbs</Typography>
                                <Typography variant="body2" fontWeight="bold">{selectedRecipeDetails.serving_sizes.serving.carbohydrate}g</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption">Fat</Typography>
                                <Typography variant="body2" fontWeight="bold">{selectedRecipeDetails.serving_sizes.serving.fat}g</Typography>
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>
                    )}

                    {selectedRecipeDetails.recipe_description && (
                      <Typography variant="body2" color="text.secondary" paragraph sx={{ fontStyle: 'italic' }}>
                        {selectedRecipeDetails.recipe_description}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} md={7}>
                    {/* Ingredients */}
                    {selectedRecipeDetails?.ingredients?.ingredient && selectedRecipeDetails.ingredients.ingredient.length > 0 && (
                      <Box mb={4}>
                        <Typography variant="h6" sx={{ mb: 2, color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>Ingredients</Typography>
                        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                          <List dense disablePadding>
                            {selectedRecipeDetails?.ingredients?.ingredient.map((ing: any, index: number) => (
                              <ListItem
                                key={ing.food_id + index}
                                divider={index < (selectedRecipeDetails?.ingredients?.ingredient.length || 0) - 1}
                                sx={{ px: 3, py: 1.5, '&:hover': { bgcolor: 'var(--color-bg)' } }}
                              >
                                <Box sx={{ mr: 2, width: 6, height: 6, borderRadius: '50%', bgcolor: 'var(--color-accent)' }} />
                                <ListItemText
                                  primary={
                                    <Typography variant="body2" fontWeight="500" color="text.primary">
                                      {ing.ingredient_description}
                                    </Typography>
                                  }
                                  secondary={ing.food_name !== ing.ingredient_description ? `(${ing.food_name})` : null}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      </Box>
                    )}

                    {/* Instructions */}
                    {selectedRecipeDetails?.directions?.direction && selectedRecipeDetails.directions.direction.length > 0 && (
                      <Box>
                        <Typography variant="h6" sx={{ mb: 2, color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>Instructions</Typography>
                        <List disablePadding>
                          {selectedRecipeDetails?.directions?.direction.map((step: any, index: number) => (
                            <ListItem
                              key={step.direction_number}
                              disableGutters
                              sx={{
                                alignItems: 'flex-start',
                                mb: 2,
                                p: 2,
                                bgcolor: 'white',
                                borderRadius: 3,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                border: '1px solid rgba(0,0,0,0.02)'
                              }}
                            >
                              <Box
                                sx={{
                                  minWidth: 28,
                                  height: 28,
                                  borderRadius: '50%',
                                  bgcolor: 'var(--color-primary)',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold',
                                  fontSize: '0.85rem',
                                  mr: 2,
                                  mt: 0.25
                                }}
                              >
                                {step.direction_number}
                              </Box>
                              <ListItemText
                                primary={
                                  <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.6 }}>
                                    {step.direction_description}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ borderTop: '1px solid rgba(0,0,0,0.05)', p: 3, bgcolor: '#fafbf7' }}>
                <Button onClick={handleCloseRecipe} sx={{ color: 'var(--color-secondary)', fontWeight: 600 }}>Close</Button>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: 'var(--color-primary)',
                    color: 'white',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 'bold',
                    px: 3,
                    '&:hover': { bgcolor: 'var(--color-primary-dark)' }
                  }}
                >
                  Add to Meal Plan
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

      </Box>
    </Box>
  );
};

export default Recipes;
