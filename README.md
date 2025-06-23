# Vitality Vista 🏋️‍♂️

A comprehensive fitness and nutrition tracking application that helps users manage their health journey through exercise planning, food logging, recipe discovery, and progress monitoring. Built with modern web technologies including React, TypeScript, Material UI, and Deno.

## 🎯 Project Overview

Vitality Vista is a full-stack fitness application that provides users with a complete ecosystem for managing their health and wellness. The app integrates exercise data, nutrition tracking, recipe discovery, and progress visualization to create a holistic fitness experience.

## ✨ Core Features

### 🏃‍♀️ **Exercise Management**
- **Exercise Library**: Browse and search through a comprehensive database of exercises
- **Workout Planning**: Create custom workout plans with exercises, sets, reps, and rest periods
- **Plan Management**: View, edit, and delete workout plans with full CRUD operations
- **Workout Logging**: Log completed workouts with detailed exercise tracking
- **Exercise Details**: View comprehensive exercise information including instructions and muscle groups

### 🍎 **Nutrition Tracking**
- **Food Logging**: Search and log foods using the FatSecret API integration
- **Daily Nutrition Summary**: Track calories, protein, carbs, and fat intake
- **Meal Organization**: Organize food entries by meal type (breakfast, lunch, dinner, snacks)
- **Nutritional Data**: Access detailed nutritional information for logged foods

### 🍳 **Recipe Discovery**
- **Recipe Search**: Search thousands of recipes using the FatSecret API
- **Recipe Categories**: Filter recipes by type and category
- **Detailed Recipe View**: View complete recipe information including ingredients, instructions, and nutritional breakdown
- **Recipe Integration**: Seamlessly add recipe ingredients to your food log

### 📊 **Progress Tracking**
- **Dashboard Overview**: Daily summary of nutrition and fitness metrics
- **Progress Visualization**: Charts and graphs for tracking weight, body composition, and fitness metrics
- **Goal Setting**: Set and track fitness and nutrition goals
- **Historical Data**: View trends and patterns over time

### 👤 **User Management**
- **User Authentication**: Secure login and registration system
- **Profile Management**: Store and manage personal information, fitness goals, and preferences
- **TDEE Calculation**: Automatic calculation of Total Daily Energy Expenditure based on profile data
- **Personalized Experience**: Customized dashboard and recommendations

## 🛠️ Technology Stack

### Frontend
- **React 18** with **TypeScript**: Modern, type-safe user interface
- **Material UI (MUI)**: Professional UI components and design system
- **React Router**: Client-side routing and navigation
- **Chart.js**: Data visualization and progress charts
- **Vite**: Fast development and optimized builds

### Backend
- **Deno**: Secure runtime for TypeScript/JavaScript
- **Oak**: Middleware framework for Deno
- **PostgreSQL**: Relational database for data persistence
- **JWT**: Secure authentication and authorization

### External APIs
- **FatSecret API**: Comprehensive recipe and nutrition database
- **Exercise Database API**: Extensive exercise library with detailed information

### Database Schema
The application uses a comprehensive PostgreSQL schema with the following main tables:
- `users`: User accounts and authentication
- `workout_plans`: Custom workout plans
- `plan_exercises`: Exercises within workout plans
- `workout_logs`: Completed workout sessions
- `log_exercise_details`: Detailed exercise performance data
- `food_log_entries`: Daily food logging records

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- Deno (v1.30+ recommended)
- PostgreSQL database
- Git

### Frontend Setup
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup
```bash
# Navigate to the backend directory
cd backend

# Set up environment variables (create .env file)
# Required: DATABASE_URL, JWT_SECRET, FATSECRET_API_KEY, FATSECRET_API_SECRET

# Run the Deno server
deno task start
```

The backend API will be available at `http://localhost:8000/api`

### Database Setup
```bash
# Import the database schema
psql -d your_database_name -f vitality_vista_schema.sql
```

## 📱 Application Structure

### Main Pages
- **Dashboard**: Daily overview and quick access to key metrics
- **Exercises**: Browse and search exercise library, create workout plans
- **My Plans**: Manage existing workout plans and log workouts
- **Food Log**: Track daily nutrition and food intake
- **Recipes**: Discover and explore new recipes
- **Progress**: View charts and track fitness progress over time
- **Profile**: Manage personal information and settings

### Key Features by Page

#### Dashboard
- Daily calorie and macro tracking
- TDEE calculation and comparison
- Quick access to recent activities
- Personalized fitness summary

#### Exercises
- Search and filter exercises by category
- View detailed exercise information
- Add exercises to workout plans
- Log individual exercises or complete workouts

#### My Plans
- Create and manage workout plans
- Add/remove exercises from plans
- Edit exercise parameters (sets, reps, weight, etc.)
- Log completed workouts from plans

#### Food Log
- Search foods using FatSecret API
- Log foods with custom quantities
- Organize by meal type
- View daily nutritional totals

#### Recipes
- Search recipes by name or category
- View detailed recipe information
- Access nutritional data per serving
- Save favorite recipes (planned feature)

#### Progress
- Weight tracking over time
- Body composition monitoring
- Workout frequency and duration
- Customizable time ranges and metrics

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset

### Workout Management
- `GET /api/workout-plans` - Get user's workout plans
- `POST /api/workout-plans` - Create new workout plan
- `PUT /api/workout-plans/:id` - Update workout plan
- `DELETE /api/workout-plans/:id` - Delete workout plan
- `GET /api/workout-plans/:id/exercises` - Get exercises in plan
- `POST /api/workout-plans/:id/exercises` - Add exercise to plan

### Food Logging
- `GET /api/food-logs` - Get food log entries
- `POST /api/food-logs` - Create food log entry
- `PUT /api/food-logs/:id` - Update food log entry
- `DELETE /api/food-logs/:id` - Delete food log entry

### Recipe Integration
- `GET /api/fatsecret/recipes/search` - Search recipes
- `GET /api/fatsecret/recipes/:id` - Get recipe details
- `GET /api/fatsecret/recipes/types` - Get recipe categories

### User Profile
- `GET /api/users/me/profile` - Get user profile
- `PUT /api/users/me/profile` - Update user profile

## 🎨 Design System

The application uses a consistent color palette and design language:
- **Primary Colors**: Earth tones and natural greens
- **Typography**: Clean, readable fonts with proper hierarchy
- **Components**: Reusable Material UI components with custom theming
- **Responsive Design**: Mobile-first approach with responsive layouts

## 🔒 Security Features

- JWT-based authentication
- Protected API endpoints
- Input validation and sanitization
- Secure password handling
- CORS configuration for cross-origin requests

## 📈 Current Status

### ✅ Completed Features
- User authentication and registration
- Exercise library with search and filtering
- Workout plan creation and management
- Food logging with FatSecret API integration
- Recipe discovery and detailed viewing
- Progress tracking with charts
- User profile management
- Responsive design and mobile support

### 🚧 In Development
- Enhanced workout logging functionality
- Advanced progress analytics
- Recipe saving and meal planning
- Social features and community aspects
- Mobile app development

### 📋 Planned Features
- Barcode scanning for food items
- Wearable device integration
- Advanced analytics and insights
- Community features and challenges
- Meal planning and grocery lists

## 🤝 Contributing

This is a personal learning project, but contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👨‍💻 Developer

**Enmanuel De Los Santos Cruz** - [@EnmanueldelosS3](https://x.com/EnmanueldelosS3)

Project Link: [https://github.com/EnmaSantos/vitality_vista](https://github.com/EnmaSantos/vitality_vista)

---

*Vitality Vista is a comprehensive fitness tracking application designed to help users achieve their health and wellness goals through integrated exercise planning, nutrition tracking, and progress monitoring.*
