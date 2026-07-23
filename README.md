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
- Supports barcode lookup, manual entries, official food images, categories, allergens, and dietary preference metadata when returned by FatSecret.
- Logs calories, protein, carbs, fat, servings, meal type, notes, and date.
- Tracks water intake with quick-add amounts and daily totals.

### Workout Planning

- Lets users browse exercises and create reusable workout plans.
- Stores plan exercises with sets, reps, weight, duration, rest periods, and notes.
- Starts planned workout sessions or logs individual exercises.
- Keeps workout history for later review.

### Recipe Discovery

- Searches recipes and recipe categories through FatSecret recipe endpoints.
- Displays recipe images, details, ingredients, instructions, categories, filters, and nutrition information.
- Helps users find meal ideas that fit their routine before logging food choices.

### Progress Tracking

- Charts weight, body fat, calories, macros, workout frequency, goals, and exercise performance.
- Supports time range filters such as week, month, quarter, and year.
- Connects profile, nutrition, and workout data into longer-term progress views.
- Includes normalized manual, Apple Health, and RENPHO measurements in weight and body-fat trends.

### Account And Profile

- Provides registration, login, logout, and protected routes.
- Stores profile information used for personalization and TDEE calculations.
- Uses JWT-backed authentication for API access.
- Provides a Health Data Sources workspace for Apple Health XML/ZIP imports, RENPHO CSV imports, manual measurements, source filtering, duplicate previews, and conflict review.

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
- A pinned local snapshot of the CC0 Anatome exercise dataset
- A Cloudflare Worker for static exercise images and animated movement guides

## Project Structure

```text
.
|-- backend
|   |-- controllers
|   |-- data
|   |-- middleware
|   |-- models
|   |-- routes
|   |-- scripts
|   |-- services
|   `-- server.ts
|-- cloudflare
|   `-- exercise-media
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
- PostgreSQL database (or Docker Desktop)
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
docker compose up -d postgres
cd backend
cp .env.example .env
deno task migrate
deno task seed
deno task start
```

The backend defaults to `http://localhost:8000/api`.

### Deno Deploy

The backend is configured for the new Deno Deploy platform at
[`console.deno.com`](https://console.deno.com/). Deploy Classic projects are not
transferred automatically, so create a new organization and app, connect this
repository, and use the repository root as the app directory. The root
[`deno.jsonc`](deno.jsonc) configures the dynamic runtime to start
`backend/server.ts`.

Set the backend variables from `backend/.env.example` in the new app's
Production environment, then deploy from the repository root with the new CLI:

```bash
deno deploy --org <new-organization-slug> --app <new-app-slug> --prod
```

Use `deno deploy` instead of the retired `deployctl` command. Configure the
custom domain on the new app and update DNS after the first successful
deployment.

Migrations are applied in filename order and recorded in the `schema_migrations`
table. Re-running `deno task migrate` is safe: previously applied versions are
skipped. To undo a schema change, add a new forward migration that reverses it;
do not edit a migration that may already have run in another environment.

Create a backend `.env` file with the values your local environment needs:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/vitality_vista
JWT_SECRET=replace-with-at-least-32-random-characters
GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
GITHUB_CLIENT_ID=your-github-oauth-app-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-app-client-secret
FATSECRET_CLIENT_ID=replace-with-fatsecret-client-id
FATSECRET_CLIENT_SECRET=replace-with-fatsecret-client-secret
EXERCISE_MEDIA_BASE_URL=https://vitality-exercise-media.enmasantos.workers.dev
```

### Exercise Dataset

Exercise browsing is served locally by the backend from a normalized snapshot of
[`Rippy1911/anatome`](https://github.com/Rippy1911/anatome), so searches and
details do not depend on a third-party exercise API. The snapshot contains 873
exercises with instruction steps, categories, equipment, and muscle data.

To refresh the snapshot from a reviewed upstream commit, pass its full commit SHA:

```bash
cd backend
deno run --allow-net=raw.githubusercontent.com --allow-write=data scripts/sync_exercise_dataset.ts <commit-sha>
```

Exercise metadata, JPGs, and derived GIFs are CC0-1.0 public-domain material
originating from `yuhonas/free-exercise-db`. Anatome's Worker code is
Apache-2.0. The retained notice is at `backend/data/ANATOME-NOTICE.txt`.

For production, deploy the media-only Worker and point the backend at its origin:

```bash
cd cloudflare/exercise-media
npm install
npm run check
npm run deploy
```

The deploy preparation script downloads and validates the 873 GIFs from the
pinned Anatome commit. After deployment, set `EXERCISE_MEDIA_BASE_URL` to the
Worker URL and redeploy the backend. Static exercise cards use the JPG route;
hovered/selected cards and active workouts use the GIF route.

### GitHub Login

Create a GitHub OAuth App with these production settings:

- Homepage URL: `https://vitalityvista.enmasantos.dev`
- Authorization callback URL: `https://vitalityvista.enmasantos.dev/auth/github/callback`

The app requests `read:user user:email` so the backend can read the GitHub profile and a verified email address before issuing the app JWT. GitHub OAuth Apps allow one callback URL per app, so use a second local OAuth App for development with callback URL `http://localhost:3000/auth/github/callback`.

The checked-in baseline migration creates the complete application schema,
including auth identities, workouts, nutrition logs, goals, and normalized
health measurements. `deno task seed` creates an idempotent local demo user;
override `DEMO_EMAIL` and `DEMO_PASSWORD` in `.env` if desired.

## Main Routes

### Frontend Pages

- `/landing` - public product landing page with screenshots
- `/login` - sign in
- `/signup` - create account
- `/dashboard` - daily health overview
- `/workouts` - interactive body discovery and the training hub
- `/workouts/routines` - 50 original single-session routines
- `/workouts/sports` - explicitly curated recreational sports-support recommendations
- `/workouts/exercises` - public-catalog exercise browsing (`/exercises` redirects here)
- `/workouts/exercises/plan-builder` - custom exercise plan creation
- `/developers/api` - public API documentation generated from the OpenAPI contract
- `/my-plans` - saved workout plans
- `/workout-history` - completed workouts
- `/food-log` - food and water logging
- `/recipes` - recipe discovery
- `/progress` - charts and analytics
- `/profile` - profile and preference management
- `/profile/data-sources` - manual measurements and Apple Health/RENPHO import management

### Backend API Areas

- `/api/auth` - registration, login, logout, token verification, password reset
- `/api/workout-plans` - workout plan and exercise management
- `/api/exercises` - local exercise search, filtering, metadata, and details
- `/api/v1` - unauthenticated, versioned read API for exercises, routines, body regions, sports, metadata, and OpenAPI
- `/api/workout-plans/from-routine/:slug` - authenticated routine-to-plan cloning
- `/api/food-logs` - food log CRUD
- `/api/water-logs` - hydration logging
- `/api/goals` - daily goals
- `/api/fatsecret/foods` - FatSecret food proxy
- `/api/fatsecret/recipes` - recipe search and details
- `/api/users/me/profile` - profile management
- `/api/progress` - progress analytics
- `/api/health-data` - source settings, normalized measurements, import previews/confirmation, and conflict resolution

## Current Status

Implemented:

- Authentication and protected routes
- Dashboard summaries
- Food lookup and food logging
- Water logging
- Daily goals
- Exercise browsing and workout plan management
- An original CC BY 4.0 catalog of 50 routines and original accessible front/back body-map artwork
- Direct routine sessions with straight-set, circuit, interval, and mobility-flow ordering
- Public cached catalog API with ETags, read CORS, and per-instance rate limiting
- Workout sessions and history
- Recipe discovery
- Progress charts
- Profile management and TDEE-related data
- Manual, Apple Health, and RENPHO health-data imports with duplicate/conflict handling
- Responsive landing page with screenshot-led capability sections

Planned or still evolving:

- More advanced workout analytics
- Recipe saving and meal planning
- Additional device or wearable integrations beyond Apple Health and RENPHO
- More complete database setup documentation

## Routine Catalog Licensing

The original routine catalog, curated body-region mappings, and original body-map artwork are licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) with attribution to **Vitality Vista / Enma Santos**. This does not change the license of the rest of the repository. The 873-exercise catalog and exercise media are separately sourced from the pinned Anatome snapshot under CC0; complete machine-readable provenance is returned by `GET /api/v1/meta` and stored in `backend/data/routines.metadata.json`.

## Developer

Enmanuel De Los Santos Cruz - [@EnmanueldelosS3](https://x.com/EnmanueldelosS3)

Project link: [https://github.com/EnmaSantos/vitality_vista](https://github.com/EnmaSantos/vitality_vista)
