ALTER TABLE workout_plans
  ADD COLUMN IF NOT EXISTS source_routine_slug VARCHAR(160),
  ADD COLUMN IF NOT EXISTS source_routine_version VARCHAR(40),
  ADD COLUMN IF NOT EXISTS session_format VARCHAR(32) NOT NULL DEFAULT 'straight_sets',
  ADD COLUMN IF NOT EXISTS rounds INTEGER NOT NULL DEFAULT 1;

ALTER TABLE workout_plans
  DROP CONSTRAINT IF EXISTS workout_plans_session_format_check,
  ADD CONSTRAINT workout_plans_session_format_check
    CHECK (session_format IN ('straight_sets', 'circuit', 'interval', 'mobility_flow')),
  DROP CONSTRAINT IF EXISTS workout_plans_rounds_check,
  ADD CONSTRAINT workout_plans_rounds_check CHECK (rounds > 0);

ALTER TABLE plan_exercises
  ADD COLUMN IF NOT EXISTS phase VARCHAR(16) NOT NULL DEFAULT 'work',
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

ALTER TABLE plan_exercises
  DROP CONSTRAINT IF EXISTS plan_exercises_phase_check,
  ADD CONSTRAINT plan_exercises_phase_check CHECK (phase IN ('warmup', 'work', 'cooldown')),
  DROP CONSTRAINT IF EXISTS plan_exercises_duration_seconds_check,
  ADD CONSTRAINT plan_exercises_duration_seconds_check CHECK (duration_seconds IS NULL OR duration_seconds >= 0);

ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS routine_slug VARCHAR(160),
  ADD COLUMN IF NOT EXISTS routine_version VARCHAR(40),
  ADD COLUMN IF NOT EXISTS routine_name_snapshot VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_workout_plans_source_routine
  ON workout_plans(source_routine_slug, source_routine_version);

CREATE INDEX IF NOT EXISTS idx_workout_logs_routine_slug
  ON workout_logs(routine_slug);
