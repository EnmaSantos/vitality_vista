// frontend/src/pages/Recipes.tsx
import React, { useState } from 'react';
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
  IconButton
} from '@mui/material';
import { 
  Search as SearchIcon,
  AccessTime as TimeIcon,
  LocalFireDepartment as CalorieIcon,
  Restaurant as MealTypeIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon
} from '@mui/icons-material';

interface Recipe {
  id: number;
  title: string;
  imageUrl: string;
  prepTime: number;
  calories: number;
  mealType: string;
  dietType: string[];
  isFavorite: boolean;
  ingredients: string[];
  instructions: string[];
}

const RecipesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mealType, setMealType] = useState('all');
  const [dietType, setDietType] = useState('all');
  const [openRecipeDialog, setOpenRecipeDialog] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Mock recipe data - will be replaced with API data later
  const mockRecipes: Recipe[] = [
    {
      id: 1,
      title: 'Greek Yogurt Parfait with Berries',
      imageUrl: '/api/placeholder/600/400',
      prepTime: 10,
      calories: 320,
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
    },
    {
      id: 2,
      title: 'Grilled Chicken with Quinoa and Vegetables',
      imageUrl: '/api/placeholder/600/400',
      prepTime: 25,
      calories: 450,
      mealType: 'lunch',
      dietType: ['high-protein', 'gluten-free'],
      isFavorite: false,
      ingredients: [
        '4 oz grilled chicken breast',
        '1/2 cup cooked quinoa',
        '1 cup mixed vegetables',
        '1 tbsp olive oil',
        'Salt and pepper to taste'
      ],
      instructions: [
        'Season chicken breast with salt and pepper',
        'Grill chicken until cooked through, about 6-7 minutes per side',
        'Cook quinoa according to package instructions',
        'Sauté mixed vegetables in olive oil until tender',
        'Plate quinoa, top with vegetables and sliced chicken'
      ]
    },
    {
      id: 3,
      title: 'Salmon with Roasted Sweet Potatoes',
      imageUrl: '/api/placeholder/600/400',
      prepTime: 35,
      calories: 520,
      mealType: 'dinner',
      dietType: ['high-protein', 'gluten-free'],
      isFavorite: true,
      ingredients: [
        '5 oz salmon fillet',
        '1 medium sweet potato, cubed',
        '1 tbsp olive oil',
        '1 tsp garlic powder',
        'Fresh herbs (dill, parsley)',
        'Lemon wedges',
        'Salt and pepper to taste'
      ],
      instructions: [
        'Preheat oven to 425°F',
        'Toss sweet potato cubes with olive oil, garlic powder, salt and pepper',
        'Roast sweet potatoes for 15 minutes',
        'Season salmon with salt, pepper, and herbs',
        'Add salmon to the baking sheet and roast for an additional 12-15 minutes',
        'Serve with lemon wedges'
      ]
    },
    {
      id: 4,
      title: 'Protein Smoothie',
      imageUrl: '/api/placeholder/600/400',
      prepTime: 5,
      calories: 280,
      mealType: 'snack',
      dietType: ['vegetarian', 'high-protein'],
      isFavorite: false,
      ingredients: [
        '1 scoop protein powder',
        '1 banana',
        '1 cup almond milk',
        '1 tbsp peanut butter',
        '1/2 cup ice cubes'
      ],
      instructions: [
        'Add all ingredients to a blender',
        'Blend until smooth and creamy',
        'Pour into a glass and serve immediately'
      ]
    }
  ];

  // Filter recipes based on search, meal type, and diet type
  const filteredRecipes = mockRecipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMealType = mealType === 'all' || recipe.mealType === mealType;
    const matchesDietType = dietType === 'all' || recipe.dietType.includes(dietType);
    return matchesSearch && matchesMealType && matchesDietType;
  });

  const handleOpenRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setOpenRecipeDialog(true);
  };

  const handleCloseRecipe = () => {
    setOpenRecipeDialog(false);
  };

  const toggleFavorite = (id: number) => {
    // In a real app, this would update state and/or make an API call
    console.log(`Toggled favorite status for recipe ${id}`);
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Healthy Recipes
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4 }}>
        Discover delicious and nutritious recipes for your fitness journey.
      </Typography>

      {/* Search and Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
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
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Meal Type</InputLabel>
              <Select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as string)}
                label="Meal Type"
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
              <InputLabel>Diet Type</InputLabel>
              <Select
                value={dietType}
                onChange={(e) => setDietType(e.target.value as string)}
                label="Diet Type"
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

      {/* Recipe Cards */}
      <Typography variant="h6" gutterBottom>
        {filteredRecipes.length} Recipes Found
      </Typography>
      
      <Grid container spacing={3}>
        {filteredRecipes.map((recipe) => (
          <Grid item xs={12} sm={6} md={4} key={recipe.id}>
            <Card>
              <CardMedia
                component="img"
                height="180"
                image={recipe.imageUrl}
                alt={recipe.title}
              />
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6" component="div" gutterBottom>
                    {recipe.title}
                  </Typography>
                  <IconButton 
                    onClick={() => toggleFavorite(recipe.id)}
                    color="primary"
                    size="small"
                  >
                    {recipe.isFavorite ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  </IconButton>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {recipe.prepTime} min
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalorieIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {recipe.calories} kcal
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MealTypeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
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
                      sx={{ textTransform: 'capitalize' }}
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
                >
                  View Recipe
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty state */}
      {filteredRecipes.length === 0 && (
        <Paper 
          sx={{ 
            p: 3, 
            textAlign: 'center',
            bgcolor: '#f5f5f5',
            border: '1px dashed #ccc' 
          }}
        >
          <Typography variant="h6">No recipes found</Typography>
          <Typography color="textSecondary">
            Try adjusting your search criteria or clear filters
          </Typography>
        </Paper>
      )}

      {/* Recipe Detail Dialog */}
      <Dialog
        open={openRecipeDialog}
        onClose={handleCloseRecipe}
        maxWidth="md"
        fullWidth
      >
        {selectedRecipe && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {selectedRecipe.title}
                <IconButton 
                  onClick={() => toggleFavorite(selectedRecipe.id)}
                  color="primary"
                >
                  {selectedRecipe.isFavorite ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <CardMedia
                    component="img"
                    image={selectedRecipe.imageUrl}
                    alt={selectedRecipe.title}
                    sx={{ borderRadius: 1, mb: 2 }}
                  />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Recipe Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Paper sx={{ p: 1, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">Prep Time</Typography>
                          <Typography variant="body1">{selectedRecipe.prepTime} min</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={4}>
                        <Paper sx={{ p: 1, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">Calories</Typography>
                          <Typography variant="body1">{selectedRecipe.calories} kcal</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={4}>
                        <Paper sx={{ p: 1, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">Meal Type</Typography>
                          <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                            {selectedRecipe.mealType}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Diet Types
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selectedRecipe.dietType.map((diet) => (
                        <Chip 
                          key={diet} 
                          label={diet} 
                          sx={{ textTransform: 'capitalize' }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Ingredients
                  </Typography>
                  <List>
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <ListItem key={index} divider={index < selectedRecipe.ingredients.length - 1}>
                        <ListItemText primary={ingredient} />
                      </ListItem>
                    ))}
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" gutterBottom>
                    Instructions
                  </Typography>
                  <List>
                    {selectedRecipe.instructions.map((instruction, index) => (
                      <ListItem key={index} divider={index < selectedRecipe.instructions.length - 1}>
                        <ListItemText 
                          primary={`${index + 1}. ${instruction}`} 
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseRecipe}>Close</Button>
              <Button variant="contained" color="primary">
                Add to Meal Plan
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          This page will be connected to TheMealDB API to display real recipe data.
        </Typography>
      </Box>
    </Box>
  );
};

export default RecipesPage;