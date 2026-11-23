import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout, Routine, WeeklySchedule, DAY_KEYS } from './types';

const WORKOUTS_KEY = '@gymtracker_workouts';
const ROUTINES_KEY = '@gymtracker_routines';
const SCHEDULE_KEY = '@gymtracker_schedule';

export async function saveWorkouts(workouts: Workout[]): Promise<void> {
  await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
}

export async function loadWorkouts(): Promise<Workout[]> {
  const data = await AsyncStorage.getItem(WORKOUTS_KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveRoutines(routines: Routine[]): Promise<void> {
  await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
}

export async function loadRoutines(): Promise<Routine[]> {
  const data = await AsyncStorage.getItem(ROUTINES_KEY);
  const parsed: Routine[] = data ? JSON.parse(data) : [];
  // Older saves may lack an exercises array; normalise so the UI can rely on it.
  return parsed.map(r => ({ ...r, exercises: Array.isArray(r.exercises) ? r.exercises : [] }));
}

export async function saveSchedule(schedule: WeeklySchedule): Promise<void> {
  await AsyncStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
}

/** Weekly schedule. Missing key or bad data → empty schedule (every day unassigned). */
export async function loadSchedule(): Promise<WeeklySchedule> {
  try {
    const data = await AsyncStorage.getItem(SCHEDULE_KEY);
    if (!data) return {};
    const raw = JSON.parse(data);
    const clean: WeeklySchedule = {};
    for (const k of DAY_KEYS) if (typeof raw?.[k] === 'string') clean[k] = raw[k];
    return clean;
  } catch {
    return {};
  }
}
