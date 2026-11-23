export interface Set {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: Set[];
}

export interface Workout {
  id: string;
  name: string;
  date: string; // ISO string
  exercises: Exercise[];
  notes?: string;
}

export interface RoutineExercise {
  name: string;
  defaultSets: number;
  /** Target reps per set. Optional so routines saved before this field existed still load. */
  defaultReps?: number;
}

export interface Routine {
  id: string;
  name: string;
  exercises: RoutineExercise[];
}

/** Weekday keys, Monday first. */
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_NAMES: Record<DayKey, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

/** Value for a day: a routine id, 'rest', or missing (not set up). */
export const REST = 'rest';
export type WeeklySchedule = Partial<Record<DayKey, string>>;

/** Today's key in local time (JS getDay() is 0 = Sunday). */
export function todayKey(d: Date = new Date()): DayKey {
  return DAY_KEYS[(d.getDay() + 6) % 7];
}
