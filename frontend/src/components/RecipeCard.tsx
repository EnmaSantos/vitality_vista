import React from 'react';

// Re-define the Recipe interface here or import it if defined globally
interface Recipe {
  id: number;
  name: string;
  category: string;
  description: string;
  calories: number;
}

interface RecipeCardProps {
  recipe: Recipe;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const cardStyle: React.CSSProperties = {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    width: '300px', // Fixed width for card consistency
    backgroundColor: '#fff'
  };

  const nameStyle: React.CSSProperties = {
    margin: '0 0 10px 0',
    fontSize: '1.2em',
    fontWeight: 'bold'
  };

  const detailStyle: React.CSSProperties = {
    margin: '5px 0',
    color: '#555'
  };


  return (
    <div style={cardStyle}>
      <h2 style={nameStyle}>{recipe.name}</h2>
      <p style={detailStyle}>Calories: {recipe.calories}</p>
      {/* We can add category and description back later if needed */}
      {/* <p style={detailStyle}><em>Category: {recipe.category}</em></p> */}
      {/* <p style={detailStyle}>{recipe.description}</p> */}
    </div>
  );
};

export default RecipeCard; 