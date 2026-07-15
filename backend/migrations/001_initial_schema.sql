CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  first_name TEXT,
  last_name TEXT,
  weight_kg NUMERIC(6, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ALTER COLUMN weight_kg DROP NOT NULL;

CREATE TABLE IF NOT EXISTS user_auth_identities (
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (provider, provider_user_id)
);
CREATE INDEX IF NOT EXISTS idx_user_auth_identities_user_id ON user_auth_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_auth_identities_email ON user_auth_identities(email);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  height_cm NUMERIC(6, 2),
  weight_kg NUMERIC(6, 2),
  gender TEXT,
  activity_level TEXT,
  fitness_goals TEXT,
  dietary_restrictions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workout_plans (
  plan_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans(user_id);

CREATE TABLE IF NOT EXISTS plan_exercises (
  plan_exercise_id SERIAL PRIMARY KEY,
  plan_id INTEGER NOT NULL REFERENCES workout_plans(plan_id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  order_in_plan INTEGER NOT NULL,
  sets INTEGER,
  reps VARCHAR(50),
  weight_kg NUMERIC(6, 2),
  duration_minutes INTEGER,
  rest_period_seconds INTEGER,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_plan_exercises_plan_id ON plan_exercises(plan_id);

CREATE TABLE IF NOT EXISTS workout_logs (
  log_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES workout_plans(plan_id) ON DELETE SET NULL,
  log_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, log_date DESC);

CREATE TABLE IF NOT EXISTS log_exercise_details (
  log_exercise_id SERIAL PRIMARY KEY,
  log_id INTEGER NOT NULL REFERENCES workout_logs(log_id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  order_in_log INTEGER NOT NULL,
  set_number INTEGER NOT NULL,
  reps_achieved INTEGER,
  weight_kg_used NUMERIC(6, 2),
  duration_achieved_seconds INTEGER,
  calories_burned INTEGER,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_log_exercise_details_log_id ON log_exercise_details(log_id);

CREATE TABLE IF NOT EXISTS food_log_entries (
  log_entry_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_date TIMESTAMPTZ NOT NULL,
  meal_type TEXT NOT NULL,
  fatsecret_food_id TEXT NOT NULL,
  fatsecret_serving_id TEXT NOT NULL,
  logged_serving_description TEXT NOT NULL,
  logged_quantity NUMERIC NOT NULL CHECK (logged_quantity > 0),
  calories_consumed NUMERIC NOT NULL,
  protein_consumed NUMERIC NOT NULL,
  fat_consumed NUMERIC NOT NULL,
  carbs_consumed NUMERIC NOT NULL,
  notes TEXT,
  food_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_food_log_entries_user_date ON food_log_entries(user_id, log_date DESC);

CREATE TABLE IF NOT EXISTS water_logs (
  log_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
  log_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, log_date DESC);

CREATE TABLE IF NOT EXISTS daily_goals (
  goal_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  goal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_daily_goals_user_date ON daily_goals(user_id, goal_date);

CREATE TABLE IF NOT EXISTS health_data_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  active_external_source TEXT CHECK (active_external_source IN ('apple_health', 'renpho')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS health_measurements (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  aggregation_type TEXT,
  source TEXT NOT NULL CHECK (source IN ('manual', 'apple_health', 'renpho')),
  source_record_id TEXT,
  fingerprint TEXT NOT NULL,
  duplicate_group_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'duplicate', 'conflict')),
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  imported_at TIMESTAMPTZ,
  notes TEXT,
  measurement_kind TEXT NOT NULL DEFAULT 'direct' CHECK (measurement_kind IN ('direct', 'derived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT health_measurements_aggregate_interval CHECK (
    metric NOT IN ('steps', 'active_calories', 'distance', 'exercise_minutes') OR
    (period_start IS NOT NULL AND period_end IS NOT NULL AND aggregation_type IS NOT NULL AND period_end > period_start)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS unique_health_measurement_fingerprint ON health_measurements(user_id, fingerprint);
CREATE INDEX IF NOT EXISTS idx_health_measurements_user_metric_time ON health_measurements(user_id, metric, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_measurements_user_source ON health_measurements(user_id, source);
CREATE INDEX IF NOT EXISTS idx_health_measurements_duplicate_group ON health_measurements(duplicate_group_id) WHERE duplicate_group_id IS NOT NULL;
