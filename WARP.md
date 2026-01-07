# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Quick Development Commands

### Backend (Deno)
```bash
# Start the backend server
cd backend && deno task start

# Run database setup script
cd backend && deno run --allow-net --allow-env --allow-read scripts/run_setup.ts

# Test backend endpoints
curl http://localhost:8000/api/auth/register
```

### Frontend (React + TypeScript + Vite)
```bash
# Start development server
cd frontend && npm run dev

# Build for production
cd frontend && npm run build

# Preview production build
cd frontend && npm run preview

# Install new dependencies
cd frontend && npm install [package-name]
```

### Testing
The project currently uses Vitest as indicated in package.json but test files are not yet implemented. When adding tests:
- Frontend tests should follow the pattern `*.test.ts` or `*.spec.ts`
- Use `npm run test` in the frontend directory

## Architecture Overview

### Full-Stack Structure
- **Backend**: Deno + Oak framework serving REST API on port 8000
- **Frontend**: React + TypeScript + Vite serving on port 3000/5173
- **Database**: PostgreSQL with manual schema management
- **External APIs**: FatSecret API for nutrition/recipes, Exercise Database API

### Backend Architecture (`/backend`)
```
controllers/     # Request handlers for each domain (auth, food, workout, etc.)
middleware/      # Authentication and request processing
models/          # TypeScript interfaces for data models
routes/          # Route definitions organized by feature
services/        # Business logic and external API integrations
scripts/         # Database setup and maintenance scripts
```

Key backend patterns:
- Controllers handle HTTP requests/responses
- Services contain business logic and external API calls
- Models define TypeScript interfaces
- Authentication uses JWT tokens with middleware protection
- Database queries use raw SQL with the postgres client

### Frontend Architecture (`/frontend/src`)
```
components/      # Reusable React components
context/         # React Context for auth and theme state
pages/           # Main application pages/routes
services/        # API client functions for backend communication
hooks/           # Custom React hooks
```

Key frontend patterns:
- Context providers for global state (AuthContext, ThemeContext)
- API services organized by domain (authApi, foodLogApi, workoutApi, etc.)
- Material-UI components with custom theming
- React Router for navigation

### Database Schema
Core tables include:
- `users` - User authentication and basic info
- `user_profiles` - Extended user fitness data
- `workout_plans`, `plan_exercises` - Workout planning system
- `workout_logs`, `log_exercise_details` - Workout tracking
- `food_log_entries` - Nutrition logging
- `water_logs` - Hydration tracking
- `daily_goals` - User goal management

## Development Guidelines

### API Integration Patterns
- **FatSecret API**: Nutrition and recipe data via proxy endpoints at `/api/fatsecret/`
- **Exercise Database**: Exercise information and instructions
- All external API calls are proxied through the backend to avoid CORS issues
- API keys are managed via environment variables on the backend

### Authentication Flow
1. User registers/logs in via `/api/auth/register` or `/api/auth/login`
2. Backend returns JWT token stored in frontend localStorage
3. Protected routes use `authMiddleware` on backend and `ProtectedRoute` component on frontend
4. Frontend includes token in Authorization header for protected requests

### Database Operations
- Raw SQL queries using the postgres client
- No ORM - direct database interaction through services/db.ts
- Database setup handled by scripts in `/backend/scripts/`
- Schema changes require manual migration scripts

### State Management
- Authentication state managed via AuthContext
- Theme preferences via ThemeContext  
- Component-level state with React hooks
- API state management through service functions

### Environment Configuration
Backend requires these environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Token signing secret
- `FATSECRET_API_KEY` - FatSecret API credentials
- `FATSECRET_API_SECRET` - FatSecret API credentials
- `PORT` - Server port (defaults to 8000)

## Common Development Tasks

### Adding a New API Endpoint
1. Create controller function in `/backend/controllers/`
2. Add route definition in appropriate `/backend/routes/` file
3. Update router imports in `server.ts` if needed
4. Create corresponding API client function in `/frontend/src/services/`

### Adding a New Page
1. Create component in `/frontend/src/pages/`
2. Add route to `/frontend/src/App.tsx`
3. Update navigation in `/frontend/src/components/Navbar.tsx`
4. Export from `/frontend/src/pages/index.ts`

### Database Changes
1. Create SQL script in `/backend/scripts/`
2. Run script manually or add to setup route
3. Update TypeScript interfaces in `/backend/models/`
4. Update service functions to use new schema

### Working with External APIs
- FatSecret integration is in `/backend/services/nutritionService.ts`
- Exercise API integration patterns in existing controllers
- Always proxy external API calls through backend routes
- Handle API rate limiting and error responses appropriately

## Project Status Notes

### Completed Features
- User authentication and JWT-based authorization
- Exercise library with search and filtering
- Basic workout plan creation
- Recipe search via FatSecret API
- Water intake logging
- Daily goals system
- Progress tracking foundations

### In Development (refer to todo_as_of_5_12_2-25.md)
- Food logging with FatSecret integration
- Complete workout management system
- User profile and progress metrics
- Enhanced nutrition tracking

### Deployment
- Backend: Deployed on Deno Deploy
- Frontend: Deployed on Vercel  
- CORS configured for production domains
- Environment variables managed through deployment platforms

## Code Patterns to Follow

### Error Handling
- Backend: Use try/catch with proper HTTP status codes
- Frontend: Display user-friendly error messages via Material-UI components
- Log errors appropriately for debugging

### TypeScript Usage
- Strict typing for API requests/responses
- Interface definitions in model files
- Proper typing for React components and hooks

### Security Considerations
- Never expose API keys in frontend code
- Validate and sanitize all user inputs
- Use parameterized queries to prevent SQL injection
- Implement proper CORS configuration

This project follows a clear separation of concerns between frontend and backend, with comprehensive API integration and a focus on fitness and nutrition tracking functionality.