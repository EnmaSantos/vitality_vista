# Vitality Vista

Vitality Vista is a full-stack fitness and nutrition tracker for everyday health routines. It gives users one place to plan workouts, log food and water, discover recipes, manage goals, and review progress over time.

The landing page and this README now focus on actual app capabilities instead of a generic feature pitch. Screenshots are stored in `frontend/public/screenshots` and use representative demo data to show the workflows already implemented in the app.

## Product Screenshots

| Daily dashboard | Food and water log |
| --- | --- |
| ![Dashboard showing calories, hydration, goals, and TDEE balance](frontend/public/screenshots/dashboard.png) | ![Food log showing lookup modes, search results, macros, meals, and water tracking](frontend/public/screenshots/food.png) |

| Workout planning | Recipe discovery |
| --- | --- |
| ![Workout plans showing exercises, logging controls, history, and session preview](frontend/public/screenshots/workouts.png) | ![Recipe discovery showing recipe details, ingredients, nutrition, and categories](frontend/public/screenshots/recipes.png) |

| Progress analytics |
| --- |
| ![Progress analytics showing body metrics, calories, workout frequency, and trend charts](frontend/public/screenshots/progress.png) |

## What The App Can Do

### Daily Dashboard

- Summarizes calories consumed, calories burned, net calories, and hydration.
- Shows TDEE context from the user profile.
- Tracks daily goals with completion states.
- Pulls together food, workout, water, and goal data into one check-in view.

### Food And Water Logging

- Searches foods through the FatSecret-backed food lookup flow.
- Supports meal text analysis, barcode lookup, image recognition, and manual entries.
- Logs calories, protein, carbs, fat, servings, meal type, notes, and date.
- Tracks water intake with quick-add amounts and daily totals.

### Workout Planning

- Lets users browse exercises and create reusable workout plans.
- Stores plan exercises with sets, reps, weight, duration, rest periods, and notes.
- Starts planned workout sessions or logs individual exercises.
- Keeps workout history for later review.

### Recipe Discovery

- Searches recipes and recipe categories through FatSecret recipe endpoints.
- Displays recipe details, ingredients, instructions, and nutrition information.
- Helps users find meal ideas that fit their routine before logging food choices.

### Progress Tracking

- Charts weight, body fat, calories, macros, workout frequency, goals, and exercise performance.
- Supports time range filters such as week, month, quarter, and year.
- Connects profile, nutrition, and workout data into longer-term progress views.

### Account And Profile

- Provides registration, login, logout, and protected routes.
- Stores profile information used for personalization and TDEE calculations.
- Uses JWT-backed authentication for API access.

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- Material UI
- React Router
- Chart.js and react-chartjs-2
- Tailwind base utilities

### Backend

- Deno
- Oak
- PostgreSQL
- JWT authentication
- FatSecret API integration

## Project Structure

```text
.
|-- backend
|   |-- controllers
|   |-- middleware
|   |-- models
|   |-- routes
|   |-- scripts
|   |-- services
|   `-- server.ts
|-- frontend
|   |-- public
|   |   `-- screenshots
|   |-- src
|   |   |-- api
|   |   |-- components
|   |   |-- context
|   |   |-- hooks
|   |   |-- pages
|   |   `-- services
|   `-- vite.config.ts
`-- README.md
```

## Getting Started

### Prerequisites

- Node.js 16 or newer
- npm
- Deno 1.30 or newer
- PostgreSQL database
- Google OAuth Web client ID for Sign in with Google
- GitHub OAuth App client ID and secret for Sign in with GitHub
- FatSecret API credentials

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`.

To point the frontend at a different API server, set:

```bash
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
VITE_GITHUB_CLIENT_ID=your-github-oauth-app-client-id
```

### Backend

```bash
cd backend
deno task start
```

The backend defaults to `http://localhost:8000/api`.

Create a backend `.env` file with the values your local environment needs:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/vitality_vista
JWT_SECRET=replace-with-a-secret
GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
GITHUB_CLIENT_ID=your-github-oauth-app-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-app-client-secret
FATSECRET_CLIENT_ID=replace-with-fatsecret-client-id
FATSECRET_CLIENT_SECRET=replace-with-fatsecret-client-secret
```

### GitHub Login

Create a GitHub OAuth App with these production settings:

- Homepage URL: `https://vitality-vista.enmasantos.dev`
- Authorization callback URL: `https://vitality-vista.enmasantos.dev/auth/github/callback`

The app requests `read:user user:email` so the backend can read the GitHub profile and a verified email address before issuing the app JWT. GitHub OAuth Apps allow one callback URL per app, so use a second local OAuth App for development with callback URL `http://localhost:3000/auth/github/callback`.

The repo includes `backend/scripts/run_setup.ts` for the Google auth identity table, nullable Google-only user fields, water logs, and daily goals tables. Run it after the base user/profile/workout/food schema exists:

```bash
cd backend
deno run --allow-net --allow-env --allow-read scripts/run_setup.ts
```

## Main Routes

### Frontend Pages

- `/landing` - public product landing page with screenshots
- `/login` - sign in
- `/signup` - create account
- `/dashboard` - daily health overview
- `/exercises` - exercise browsing and plan creation
- `/my-plans` - saved workout plans
- `/workout-history` - completed workouts
- `/food-log` - food and water logging
- `/recipes` - recipe discovery
- `/progress` - charts and analytics
- `/profile` - profile and preference management

### Backend API Areas

- `/api/auth` - registration, login, logout, token verification, password reset
- `/api/workout-plans` - workout plan and exercise management
- `/api/food-logs` - food log CRUD
- `/api/water-logs` - hydration logging
- `/api/goals` - daily goals
- `/api/fatsecret/foods` - FatSecret food proxy
- `/api/fatsecret/recipes` - recipe search and details
- `/api/users/me/profile` - profile management
- `/api/progress` - progress analytics

## Current Status

Implemented:

- Authentication and protected routes
- Dashboard summaries
- Food lookup and food logging
- Water logging
- Daily goals
- Exercise browsing and workout plan management
- Workout sessions and history
- Recipe discovery
- Progress charts
- Profile management and TDEE-related data
- Responsive landing page with screenshot-led capability sections

Planned or still evolving:

- More advanced workout analytics
- Recipe saving and meal planning
- Broader device or wearable integrations
- More complete database setup documentation

## Developer

Enmanuel De Los Santos Cruz - [@EnmanueldelosS3](https://x.com/EnmanueldelosS3)

Project link: [https://github.com/EnmaSantos/vitality_vista](https://github.com/EnmaSantos/vitality_vista)
