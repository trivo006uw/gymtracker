import { Routine, Workout, Exercise } from '../types';

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Build a new (unsaved) Workout from a routine: one exercise per routine entry,
 * `defaultSets` sets each, reps = defaultReps. Weights are prefilled from the most
 * recent logged session of the same exercise (matching set index), if any.
 */
export function workoutFromRoutine(routine: Routine, history: Workout[] = []): Workout {
  const stamp = Date.now();
  const sorted = history.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastSets = (name: string) => {
    for (const w of sorted) {
      const ex = w.exercises.find(e => norm(e.name) === norm(name));
      if (ex && ex.sets.length) return ex.sets;
    }
    return [];
  };

  const exercises: Exercise[] = routine.exercises.map((re, i) => {
    const prev = lastSets(re.name);
    const count = Math.max(1, re.defaultSets || 1);
    return {
      id: `${stamp}-${i}`,
      name: re.name,
      sets: Array.from({ length: count }).map((_, j) => ({
        id: `${stamp}-${i}-${j}`,
        reps: re.defaultReps || prev[j]?.reps || prev[prev.length - 1]?.reps || 0,
        weight: prev[j]?.weight ?? prev[prev.length - 1]?.weight ?? 0,
        completed: false,
      })),
    };
  });

  return {
    id: stamp.toString(),
    name: routine.name,
    date: new Date().toISOString(),
    exercises,
  };
}
