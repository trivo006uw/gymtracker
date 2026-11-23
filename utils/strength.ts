import { Workout } from '../types';

/** Epley estimated one-rep max. */
export const epley = (weight: number, reps: number) => weight * (1 + reps / 30);

export interface ExerciseGain {
  name: string;
  first: number;      // best e1RM in the first logged session
  latest: number;     // best e1RM in the most recent session
  gainPct: number;    // (latest - first) / first * 100
  sessions: number;
}

export interface ExcludedExercise {
  name: string;
  reason: 'one session' | 'no gain' | 'no weight';
}

export interface StrengthReport {
  gains: ExerciseGain[];          // exercises with a positive gain, sorted desc
  excluded: ExcludedExercise[];
  averagePct: number | null;      // mean gain % over every exercise with ≥2 weighted sessions
  comparedCount: number;          // how many exercises went into averagePct
}

/**
 * For each exercise (matched by name, case-insensitive), take the best Epley e1RM
 * per workout, then compare the FIRST workout containing it with the MOST RECENT one.
 */
export function strengthReport(workouts: Workout[]): StrengthReport {
  const ordered = workouts.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const map = new Map<string, { name: string; bests: number[]; seen: number }>();

  for (const w of ordered) {
    for (const ex of w.exercises) {
      const key = ex.name.trim().toLowerCase();
      if (!key) continue;
      const best = ex.sets.reduce(
        (m, s) => (s.weight > 0 && s.reps > 0 ? Math.max(m, epley(s.weight, s.reps)) : m),
        0
      );
      const entry = map.get(key) || { name: ex.name.trim(), bests: [], seen: 0 };
      entry.seen += 1;
      if (best > 0) entry.bests.push(best);
      map.set(key, entry);
    }
  }

  const gains: ExerciseGain[] = [];
  const excluded: ExcludedExercise[] = [];
  const allPcts: number[] = [];

  map.forEach(({ name, bests, seen }) => {
    if (bests.length === 0) { excluded.push({ name, reason: seen > 1 ? 'no weight' : 'one session' }); return; }
    if (bests.length < 2) { excluded.push({ name, reason: 'one session' }); return; }
    const first = bests[0];
    const latest = bests[bests.length - 1];
    const gainPct = ((latest - first) / first) * 100;
    allPcts.push(gainPct);
    if (gainPct <= 0.05) { excluded.push({ name, reason: 'no gain' }); return; }
    gains.push({ name, first, latest, gainPct, sessions: bests.length });
  });

  gains.sort((a, b) => b.gainPct - a.gainPct);
  const averagePct = allPcts.length ? allPcts.reduce((a, b) => a + b, 0) / allPcts.length : null;
  return { gains, excluded, averagePct, comparedCount: allPcts.length };
}
