Vitality Vista - TODO List (as of May 12, 2025)

High Priority:

Frontend Food Logging - Integration with FatSecret:

Task: Adapt or build the UI in FoodLogPage.tsx (or a similar new component) to allow users to search for foods using the FatSecret API (via your backend proxy).
Create frontend service functions (e.g., in frontend/src/services/foodApi.ts or recipeApi.ts) to call your backend endpoints that proxy to FatSecret's food search (if different from recipe search) and food/recipe lookup.
Implement search input, results display, and selection for food items.
When a food/recipe is selected, display its nutritional details (calories, macros, serving sizes) obtained from FatSecret.
Status: Was planned for USDA/TheMealDB; now needs to target FatSecret. RecipesPage.tsx has a good foundation for search/display that can be adapted.
Notes: FatSecret's food.get.v2 or similar might be needed for individual food items if their recipe search doesn't cover everything. Your nutritionService.ts already has searchFoodNutrition and getFoodNutritionById for this.
Backend Food Logging - CRUD Operations & Database:

Task: Implement backend CRUD endpoints and database tables for storing users' logged food/recipe entries.
Design/Refine DB Tables:
food_log_entries (or similar): to store entries for a specific date, user, and meal type (breakfast, lunch, etc.).
food_log_items (or similar): to link to food_log_entries and store details of the logged food/recipe (e.g., FatSecret food/recipe ID, quantity consumed, actual calories/macros logged if user can adjust). The original plan was for food_log_entries and food_log_items. This general structure can be adapted.
Implement Backend Endpoints:
POST /api/food-logs: Create a new food log entry.
GET /api/food-logs: Fetch logged entries for a user (e.g., by date).
PUT /api/food-logs/:entryId: Update a logged entry.
DELETE /api/food-logs/:entryId: Delete a logged entry.
Ensure these endpoints are protected by authMiddleware.
Status: Was planned for USDA/TheMealDB; database tables need to be confirmed/adjusted for FatSecret data (e.g., storing FatSecret IDs). CRUD endpoints need full implementation.
Frontend Display of Logged Food & Daily Summaries:

Task:
Allow users to select foods/recipes (from FatSecret search), enter quantities/servings, and save these as log entries via the new backend endpoints.
Display logged food items on the FoodLogPage.tsx.
Calculate and display daily summaries (total calories, macros) on the Dashboard.tsx and/or FoodLogPage.tsx based on logged entries.
Status: New frontend work, building upon the FatSecret integration.
Medium Priority:

Complete Workout Management - Backend & Frontend:

Backend:
Finish implementing detailed CRUD operations for workout plans (update, delete, get specific plan with exercises).
Implement CRUD operations for plan_exercises (add, update, remove exercises within a plan).
Implement CRUD operations for workout logging (workout_logs, log_exercise_details).
Status: Initial workout_plans table and basic create/get handlers exist. Significant backend logic for details and logging is pending.
Frontend:
Build UI for creating, viewing, updating, and deleting workout plans.
Build UI for adding/removing exercises from plans.
Build UI for logging completed workouts and their details (sets, reps, weight, duration).
Status: All frontend integration for workout management is pending.
User Profile & Basic Progress Metrics - Backend & Frontend:

Backend:
Implement endpoints for storing and retrieving user profile details (e.g., age, sex, height, current weight, goals).
Implement endpoints for basic progress metric logging (e.g., weight over time).
Status: Database tables for users exist, but fitness-specific fields and dedicated endpoints are pending.
Frontend:
Create user profile page for viewing and editing profile information.
Create settings page.
Begin implementing charts on the ProgressPage.tsx using a library like Recharts, connecting to the new backend data for weight, etc.
Status: Placeholder UI on ProgressPage.tsx exists. Profile/settings pages and actual chart implementation are pending.
Calculated Metrics (BMR/TDEE):

Task: Once user profile data (age, sex, height, weight, activity level) can be stored and retrieved, implement backend or frontend logic to calculate Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE).
Status: Pending profile feature completion.
Lower Priority (Can be addressed iteratively or later):

Refine Recipe Feature UX:

Consider adding features like saving favorite recipes to a user's profile (requires backend and DB changes).
Meal planning functionality using saved/searched recipes.
Status: Current recipe feature focuses on search and display.
Refine Exercise Feature UX:

Improve "View Details" for exercises.
Enhance the "Add to Workout" functionality once workout plans are more developed.
Status: Basic search and display are functional.
Testing:

Add unit tests for key frontend components and backend logic.
Set up end-to-end tests for major user flows (auth, food logging, workout planning).
Status: Currently pending.
UI/UX Enhancements:

Form validation across all input forms.
Consistent loading states and user-friendly error messages.
User onboarding/tutorials.
Status: Some basic error handling exists; comprehensive enhancements pending.
Deployment & Monitoring (Ongoing):

Continue to monitor deployed backend on Deno Deploy and frontend on Vercel.
Set up more robust logging.
Status: Basic deployment is operational.