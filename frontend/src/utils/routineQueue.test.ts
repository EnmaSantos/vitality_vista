import { describe, expect, it } from 'vitest';
import type { PlanExercise } from '../api/workoutApi';
import { orderSessionQueue } from './routineQueue';

function movement(id: number, phase: PlanExercise['phase'], sets = 1): PlanExercise {
  return {
    plan_exercise_id: id,
    plan_id: 1,
    exercise_id: id,
    exercise_name: `Movement ${id}`,
    order_in_plan: id,
    phase,
    sets,
    rest_period_seconds: 15,
  };
}

describe('routine session queue ordering', () => {
  const movements = [movement(1, 'warmup'), movement(2, 'work', 3), movement(3, 'work', 3), movement(4, 'cooldown')];

  it('keeps straight sets together before moving forward', () => {
    const queue = orderSessionQueue(movements, 'straight_sets', 3);
    expect(queue.map((item) => item.exercise_id)).toEqual([1, 2, 3, 4]);
    expect(queue[1].sets).toBe(3);
  });

  it('runs warm-up once, repeats work by round, then cools down once for circuits', () => {
    const queue = orderSessionQueue(movements, 'circuit', 3);
    expect(queue.map((item) => item.exercise_id)).toEqual([1, 2, 3, 2, 3, 2, 3, 4]);
    expect(queue.filter((item) => item.phase === 'warmup')).toHaveLength(1);
    expect(queue.filter((item) => item.phase === 'cooldown')).toHaveLength(1);
    expect(queue.filter((item) => item.phase === 'work').every((item) => item.sets === 1)).toBe(true);
  });

  it('uses circuit ordering for interval sessions', () => {
    const queue = orderSessionQueue(movements, 'interval', 2);
    expect(queue.map((item) => item.exercise_id)).toEqual([1, 2, 3, 2, 3, 4]);
  });

  it('keeps a mobility flow as one ordered sequence', () => {
    const queue = orderSessionQueue(movements, 'mobility_flow', 1);
    expect(queue.map((item) => item.exercise_id)).toEqual([1, 2, 3, 4]);
  });
});
