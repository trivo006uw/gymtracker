import { Workout, Routine, WeeklySchedule, DAY_KEYS } from '../types';
import { loadWorkouts, loadRoutines, loadSchedule, saveWorkouts, saveRoutines, saveSchedule } from '../storage';

export const BACKUP_VERSION = 1;
export const BACKUP_APP = 'GymTracker';

export type GymBackup = {
  version: typeof BACKUP_VERSION;
  app: typeof BACKUP_APP;
  exportedAt: string;
  workouts: Workout[];
  routines: Routine[];
  schedule: WeeklySchedule;
  // Raw AsyncStorage keys, so a backup file also stands alone as a key dump.
  '@gymtracker_workouts': Workout[];
  '@gymtracker_routines': Routine[];
  '@gymtracker_schedule': WeeklySchedule;
};

function asArray<T>(value: unknown): T[] | null {
  return Array.isArray(value) ? (value as T[]) : null;
}

function asSchedule(value: unknown): WeeklySchedule | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const clean: WeeklySchedule = {};
  for (const k of DAY_KEYS) if (typeof raw[k] === 'string') clean[k] = raw[k] as string;
  return clean;
}

/** Build a JSON-serialisable backup of all three storage keys. */
export async function createBackup(): Promise<GymBackup> {
  const [workouts, routines, schedule] = await Promise.all([
    loadWorkouts(),
    loadRoutines(),
    loadSchedule(),
  ]);
  return {
    version: BACKUP_VERSION,
    app: BACKUP_APP,
    exportedAt: new Date().toISOString(),
    workouts,
    routines,
    schedule,
    '@gymtracker_workouts': workouts,
    '@gymtracker_routines': routines,
    '@gymtracker_schedule': schedule,
  };
}

/**
 * Accept either the structured backup format or a raw key dump.
 * Returns a normalised payload, or a reason the file is not a GymTracker backup.
 */
export function parseBackup(raw: unknown): { ok: true; data: { workouts: Workout[]; routines: Routine[]; schedule: WeeklySchedule } } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'This file is not a GymTracker backup.' };
  }
  const obj = raw as Record<string, unknown>;
  const workouts = asArray<Workout>(obj.workouts) ?? asArray<Workout>(obj['@gymtracker_workouts']);
  const routines = asArray<Routine>(obj.routines) ?? asArray<Routine>(obj['@gymtracker_routines']);
  const schedule = asSchedule(obj.schedule) ?? asSchedule(obj['@gymtracker_schedule']);

  if (!workouts || !routines || !schedule) {
    return { ok: false, error: 'This file is missing workouts, routines, or the weekly schedule.' };
  }
  return { ok: true, data: { workouts, routines, schedule } };
}

/** Overwrite all three storage keys with a validated backup. */
export async function restoreBackup(data: { workouts: Workout[]; routines: Routine[]; schedule: WeeklySchedule }): Promise<void> {
  await Promise.all([
    saveWorkouts(data.workouts),
    saveRoutines(data.routines),
    saveSchedule(data.schedule),
  ]);
}

export function backupFilename(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `gymtracker-backup-${y}-${m}-${d}.json`;
}

/** Download or share a JSON file on the web. Returns 'shared', 'downloaded', or 'cancelled'. */
export async function downloadOrShareJson(filename: string, payload: unknown): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const text = JSON.stringify(payload, null, 2);
  const blob = new Blob([text], { type: 'application/json' });
  const file = new File([blob], filename, { type: 'application/json' });
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;

  if (nav && typeof nav.share === 'function' && typeof nav.canShare === 'function') {
    try {
      if (nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: 'GymTracker backup' });
        return 'shared';
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return 'cancelled';
      // Fall through to a direct download if share is refused.
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

/** Open a file picker and parse the chosen JSON file. */
export function pickJsonFile(): Promise<unknown | null> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('File import is only available in the web app.'));
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';
    const cleanup = () => {
      input.remove();
    };
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      cleanup();
      if (!file) {
        resolve(null);
        return;
      }
      try {
        const text = await file.text();
        resolve(JSON.parse(text));
      } catch {
        reject(new Error('Could not read that file as JSON.'));
      }
    });
    // If the user cancels the picker, there is often no change event.
    // Resolve null on the next focus as a best-effort cancel.
    const onFocus = () => {
      window.removeEventListener('focus', onFocus);
      setTimeout(() => {
        if (!input.files?.length) {
          cleanup();
          resolve(null);
        }
      }, 500);
    };
    window.addEventListener('focus', onFocus);
    document.body.appendChild(input);
    input.click();
  });
}
