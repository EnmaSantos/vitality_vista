// frontend/src/pages/Recipes.tsx
import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  CardMedia,
  CardActions,
  TextField,
  InputAdornment,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon,
  AccessTime as TimeIcon,
  LocalFireDepartment as CalorieIcon,
  Restaurant as MealTypeIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon
} from '@mui/icons-material';
import { useThemeContext, themeColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  getRecipeCalorieEstimate, 
  RecipeCalorieEstimateData
} from '../services/recipeApi';

interface Recipe {
  id: string;
  title: string;
  imageUrl: string;
  prepTime: number;
  mealType: string;
  dietType: string[];
  isFavorite: boolean;
  ingredients: string[];
  instructions: string[];
}

const RecipesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mealTypeFilter, setMealTypeFilter] = useState('all');
  const [dietTypeFilter, setDietTypeFilter] = useState('all');
  const [openRecipeDialog, setOpenRecipeDialog] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [calorieEstimateData, setCalorieEstimateData] = useState<RecipeCalorieEstimateData | null>(null);
  const [isEstimateLoading, setIsEstimateLoading] = useState<boolean>(false);
  const [estimateApiError, setEstimateApiError] = useState<string | null>(null);

  const { setCurrentThemeColor } = useThemeContext();
  const { token, isAuthenticated } = useAuth();
  
  useEffect(() => {
    setCurrentThemeColor(themeColors.tigersEye);
  }, [setCurrentThemeColor]);

  const mockRecipes: Recipe[] = [
    {
      id: "52775",
      title: 'Vegan Lasagna',
      imageUrl: '/api/placeholder/600/400',
      prepTime: 45,
      mealType: 'dinner',
      dietType: ['vegan', 'vegetarian'],
      isFavorite: false,
      ingredients: ["green red lentils", "Carrots", "onion", "zucchini", "coriander", "spinach", "lasagne sheets", "vegan butter", "flour", "soya milk", "mustard", "vinegar"],
      instructions: ["Cook lentils.", "Saute vegetables.", "Make bechamel.", "Assemble and bake."]
    },
    {
      id: "52771",
      title: 'Spicy Arrabiata Penne',
      imageUrl: '/api/placeholder/600/400',
      prepTime: 20,
      mealType: 'dinner',
      dietType: [],
      isFavorite: true,
      ingredients: ["penne rigate", "olive oil", "garlic", "chopped tomatoes", "red chile flakes", "italian seasoning", "basil", "Parmigiano-Reggiano"],
      instructions: ["Cook pasta.", "Make sauce.", "Combine and serve."]
    },
    {
      id: "1",
      title: 'Greek Yogurt Parfait with Berries',
      imageUrl: '/api/placeholder/600/400',
      prepTime: 10,
      mealType: 'breakfast',
      dietType: ['vegetarian', 'high-protein'],
      isFavorite: true,
      ingredients: [
        '1 cup Greek yogurt',
        '1/2 cup mixed berries',
        '1 tbsp honey',
        '2 tbsp granola'
      ],
      instructions: [
        'Add half of the yogurt to a glass or bowl',
        'Top with half of the berries and granola',
        'Repeat layers with remaining ingredients',
        'Drizzle with honey and serve immediately'
      ]
    }
  ];

  const filteredRecipes = mockRecipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMealType = mealTypeFilter === 'all' || recipe.mealType === mealTypeFilter;
    const matchesDietType = dietTypeFilter === 'all' || recipe.dietType.includes(dietTypeFilter);
    return matchesSearch && matchesMealType && matchesDietType;
  });

  const handleOpenRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setCalorieEstimateData(null);
    setIsEstimateLoading(false);
    setEstimateApiError(null);
    setOpenRecipeDialog(true);
  };

  const handleCloseRecipe = () => {
    setOpenRecipeDialog(false);
    setSelectedRecipe(null);
  };

  const toggleFavorite = (id: string) => {
    console.log(`Toggled favorite status for recipe ${id}`);
    if (selectedRecipe && selectedRecipe.id === id) {
      setSelectedRecipe(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    }
  };

  useEffect(() => {
    if (openRecipeDialog && selectedRecipe && selectedRecipe.id && isAuthenticated && token) {
      console.log(`Fetching calorie estimate for recipe ID: ${selectedRecipe.id}`);
      setIsEstimateLoading(true);
      setEstimateApiError(null);
      setCalorieEstimateData(null);

      getRecipeCalorieEstimate(selectedRecipe.id, token)
        .then(response => {
          if (response.success && response.data) {
            setCalorieEstimateData(response.data);
          } else {
            setEstimateApiError(response.message || "Failed to fetch calorie estimate.");
          }
        })
        .catch(err => {
          console.error("Error in getRecipeCalorieEstimate call:", err);
          setEstimateApiError(err.message || "An unexpected error occurred.");
        })
        .finally(() => {
          setIsEstimateLoading(false);
        });
    }
  }, [openRecipeDialog, selectedRecipe, isAuthenticated, token]);

  return (
    <Box sx={{ padding: 3, backgroundColor: '#fff8f0', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#283618ff' }}>
        Healthy Recipes
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, color: '#606c38ff' }}>
        Discover delicious and nutritious recipes for your fitness journey.
      </Typography>

      <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: '#fefae0ff', borderLeft: '4px solid #bc6c25ff' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#606c38ff' }} />
                  </InputAdornment>
                ),
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
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel sx={{ color: '#606c38ff' }}>Meal Type</InputLabel>
              <Select
                value={mealTypeFilter}
                onChange={(e) => setMealTypeFilter(e.target.value as string)}
                label="Meal Type"
                sx={{
                  color: '#283618ff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#dda15eff',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#bc6c25ff',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#bc6c25ff',
                  },
                }}
              >
                <MenuItem value="all">All Meals</MenuItem>
                <MenuItem value="breakfast">Breakfast</MenuItem>
                <MenuItem value="lunch">Lunch</MenuItem>
                <MenuItem value="dinner">Dinner</MenuItem>
                <MenuItem value="snack">Snacks</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel sx={{ color: '#606c38ff' }}>Diet Type</InputLabel>
              <Select
                value={dietTypeFilter}
                onChange={(e) => setDietTypeFilter(e.target.value as string)}
                label="Diet Type"
                sx={{
                  color: '#283618ff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#dda15eff',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#bc6c25ff',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#bc6c25ff',
                  },
                }}
              >
                <MenuItem value="all">All Diets</MenuItem>
                <MenuItem value="vegetarian">Vegetarian</MenuItem>
                <MenuItem value="vegan">Vegan</MenuItem>
                <MenuItem value="gluten-free">Gluten-Free</MenuItem>
                <MenuItem value="keto">Keto</MenuItem>
                <MenuItem value="high-protein">High Protein</MenuItem>
                <MenuItem value="low-carb">Low Carb</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h6" gutterBottom sx={{ color: '#283618ff' }}>
        {filteredRecipes.length} Recipes Found
      </Typography>
      
      <Grid container spacing={3}>
        {filteredRecipes.map((recipe) => (
          <Grid item xs={12} sm={6} md={4} key={recipe.id}>
            <Card sx={{ 
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 3
              },
              borderTop: '4px solid #bc6c25ff'
            }}>
              <CardMedia
                component="img"
                height="180"
                image={recipe.imageUrl}
                alt={recipe.title}
              />
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" component="div" gutterBottom sx={{ color: '#283618ff' }}>
                    {recipe.title}
                  </Typography>
                  <IconButton 
                    onClick={() => toggleFavorite(recipe.id)}
                    size="small"
                    sx={{ color: recipe.isFavorite ? '#bc6c25ff' : '#dda15eff' }}
                  >
                    {recipe.isFavorite ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  </IconButton>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TimeIcon fontSize="small" sx={{ mr: 0.5, color: '#606c38ff' }} />
                    <Typography variant="body2" color="#606c38ff">
                      {recipe.prepTime} min
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MealTypeIcon fontSize="small" sx={{ mr: 0.5, color: '#606c38ff' }} />
                    <Typography variant="body2" color="#606c38ff" sx={{ textTransform: 'capitalize' }}>
                      {recipe.mealType}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {recipe.dietType.map((diet) => (
                    <Chip 
                      key={diet} 
                      label={diet} 
                      size="small" 
                      sx={{ 
                        textTransform: 'capitalize',
                        bgcolor: '#fefae0ff',
                        color: '#606c38ff',
                        borderColor: '#dda15eff',
                        '&:hover': {
                          bgcolor: '#fefae0dd'
                        }
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  variant="contained" 
                  onClick={() => handleOpenRecipe(recipe)}
                  fullWidth
                  sx={{ 
                    bgcolor: '#bc6c25ff', 
                    '&:hover': { 
                      bgcolor: '#a55b20' 
                    } 
                  }}
                >
                  View Recipe
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredRecipes.length === 0 && (
        <Paper 
          sx={{ 
            p: 3, 
            textAlign: 'center',
            bgcolor: '#fefae0ff',
            border: '1px dashed #bc6c25ff' 
          }}
        >
          <Typography variant="h6" sx={{ color: '#283618ff' }}>No recipes found</Typography>
          <Typography sx={{ color: '#606c38ff' }}>
            Try adjusting your search criteria or clear filters
          </Typography>
        </Paper>
      )}

      <Dialog
        open={openRecipeDialog}
        onClose={handleCloseRecipe}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#fff8f0',
          }
        }}
      >
        {selectedRecipe && (
          <>
            <DialogTitle sx={{ color: '#283618ff', borderBottom: '1px solid #dda15eff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {selectedRecipe.title}
                <IconButton 
                  onClick={() => toggleFavorite(selectedRecipe.id)}
                  sx={{ color: selectedRecipe.isFavorite ? '#bc6c25ff' : '#dda15eff' }}
                >
                  {selectedRecipe.isFavorite ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: '#dda15eff' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <CardMedia
                    component="img"
                    image={selectedRecipe.imageUrl}
                    alt={selectedRecipe.title}
                    sx={{ borderRadius: 1, mb: 2 }}
                  />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#283618ff' }}>
                      Recipe Details
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6} sm={4}>
                        <Paper sx={{ p: 1, textAlign: 'center', bgcolor: '#fefae0ff', height: '100%' }}>
                          <Typography variant="body2" color="#606c38ff">Prep Time</Typography>
                          <Typography variant="body1" sx={{ color: '#283618ff' }}>{selectedRecipe.prepTime} min</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <Paper sx={{ p: 1, textAlign: 'center', bgcolor: '#fefae0ff', height: '100%' }}>
                          <Typography variant="body2" color="#606c38ff">Meal Type</Typography>
                          <Typography variant="body1" sx={{ color: '#283618ff', textTransform: 'capitalize' }}>
                            {selectedRecipe.mealType}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 1, textAlign: 'center', bgcolor: '#fefae0ff', height: '100%' }}>
                          <Typography variant="body2" color="#606c38ff">Est. Calories</Typography>
                          {isEstimateLoading && <CircularProgress size={20} sx={{ mt: 0.5 }} />}
                          {estimateApiError && !isEstimateLoading && <Typography color="error" variant="caption" sx={{ mt: 0.5, display: 'block' }}>Error: {estimateApiError}</Typography>}
                          {calorieEstimateData && !isEstimateLoading && !estimateApiError && (
                            <Typography variant="h6" sx={{ color: '#bc6c25ff', mt: 0.5 }}>
                              {calorieEstimateData.estimatedTotalCalories} kcal
                            </Typography>
                          )}
                          {!isAuthenticated && !isEstimateLoading && (
                              <Typography variant="caption" color="textSecondary" sx={{mt: 0.5, display: 'block'}}>
                                  Login to view.
                              </Typography>
                          )}
                          {calorieEstimateData && !isEstimateLoading && !estimateApiError && (
                              <Typography variant="caption" color="textSecondary" sx={{mt: 0.5, display: 'block'}}>
                                  (Automated estimate)
                              </Typography>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: '#283618ff' }}>
                      Diet Types
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selectedRecipe.dietType.map((diet) => (
                        <Chip 
                          key={diet} 
                          label={diet} 
                          sx={{ 
                            textTransform: 'capitalize',
                            bgcolor: '#fefae0ff',
                            color: '#606c38ff',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#283618ff' }}>
                    Ingredients
                  </Typography>
                  <List dense>
                    {calorieEstimateData?.ingredients && calorieEstimateData.ingredients.length > 0
                      ? calorieEstimateData.ingredients.map((ing, index) => (
                          <ListItem key={`${ing.ingredient}-${index}`} divider={index < calorieEstimateData.ingredients.length -1} sx={{ borderColor: '#dda15eff', py: 0.5 }}>
                            <ListItemText 
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                              primary={`${ing.measure} ${ing.ingredient}`} 
                              secondary={`Status: ${ing.status}${ing.calculatedCalories ? ` (${ing.calculatedCalories.toFixed(0)} kcal)` : ''}${ing.parsedMeasureInfo?.parseNotes && ing.parsedMeasureInfo.parseNotes.length > 0 ? ` Notes: ${ing.parsedMeasureInfo.parseNotes.join(', ')}` : ''}`}
                              sx={{ color: '#283618ff' }}
                            />
                          </ListItem>
                        ))
                      : selectedRecipe.ingredients.map((ingredient, index) => (
                          <ListItem key={index} divider={index < selectedRecipe.ingredients.length - 1} sx={{ borderColor: '#dda15eff', py: 0.5 }}>
                            <ListItemText primary={ingredient} sx={{ color: '#283618ff' }} primaryTypographyProps={{ variant: 'body2' }}/>
                          </ListItem>
                        ))
                    }
                  </List>

                  <Divider sx={{ my: 2, bgcolor: '#dda15eff' }} />

                  <Typography variant="h6" gutterBottom sx={{ color: '#283618ff' }}>
                    Instructions
                  </Typography>
                  <List dense>
                    {selectedRecipe.instructions.map((instruction, index) => (
                      <ListItem key={index} divider={index < selectedRecipe.instructions.length - 1} sx={{ borderColor: '#dda15eff', py: 0.5 }}>
                        <ListItemText 
                          primary={`${index + 1}. ${instruction}`}
                          sx={{ color: '#283618ff' }} 
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid #dda15eff' }}>
              <Button onClick={handleCloseRecipe} sx={{ color: '#606c38ff' }}>Close</Button>
              <Button 
                variant="contained" 
                sx={{ 
                  bgcolor: '#bc6c25ff', 
                  '&:hover': { bgcolor: '#a55b20' }
                }}
              >
                Add to Meal Plan
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#606c38ff' }}>
          This page will be connected to TheMealDB API to display real recipe data.
        </Typography>
      </Box>
    </Box>
  );
};

export default RecipesPage;