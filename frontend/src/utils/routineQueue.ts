import type { PlanExercise } from '../api/workoutApi';
import type { Routine, RoutineExercise, RoutineFormat } from '../services/catalogApi';

function routineItemToPlanExercise(item: RoutineExercise, index: number): PlanExercise {
  if (!item.exercise) throw new Error(`Routine exercise ${item.sourceId} was not resolved.`);
  return {
    plan_exercise_id: -(index + 1),
    plan_id: 0,
    exercise_id: item.exercise.id,
    exercise_name: item.exercise.name,
    order_in_plan: index + 1,
    sets: item.sets ?? 1,
    reps: item.reps ?? undefined,
    duration_seconds: item.durationSeconds ?? undefined,
    duration_minutes: item.durationSeconds ? Math.max(1, Math.ceil(item.durationSeconds / 60)) : undefined,
    rest_period_seconds: item.restSeconds,
    phase: item.phase,
    notes: `${item.sideGuidance} ${item.notes}`,
  };
}

export function orderSessionQueue(exercises: PlanExercise[], format: RoutineFormat, rounds: number): PlanExercise[] {
  const sorted = [...exercises].sort((left, right) => left.order_in_plan - right.order_in_plan);
  if (format === 'straight_sets' || format === 'mobility_flow') return sorted;
  const warmup = sorted.filter((exercise) => (exercise.phase ?? 'work') === 'warmup');
  const work = sorted.filter((exercise) => (exercise.phase ?? 'work') === 'work');
  const cooldown = sorted.filter((exercise) => (exercise.phase ?? 'work') === 'cooldown');
  const repeatedWork = Array.from({ length: Math.max(1, rounds) }, (_unused, roundIndex) => (
    work.map((exercise) => ({
      ...exercise,
      plan_exercise_id: exercise.plan_exercise_id * 100 - roundIndex,
      sets: 1,
      notes: `Round ${roundIndex + 1} of ${rounds}. ${exercise.notes ?? ''}`.trim(),
    }))
  )).flat();
  return [...warmup, ...repeatedWork, ...cooldown].map((exercise, index) => ({ ...exercise, order_in_plan: index + 1 }));
}

export function buildRoutineSessionQueue(routine: Routine): PlanExercise[] {
  const exercises = routine.exercises.map(routineItemToPlanExercise);
  return orderSessionQueue(exercises, routine.format, routine.rounds);
}
