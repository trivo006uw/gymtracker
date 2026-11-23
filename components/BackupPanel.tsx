import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout, Routine } from '../types';
import { colors, spacing, radius, typography, fonts, card, hitTarget, glow, textGlow } from '../theme';
import { Corners } from './Neon';
import {
  createBackup, parseBackup, restoreBackup, backupFilename,
  downloadOrShareJson, pickJsonFile,
} from '../utils/backup';

const panel = 'rgba(15,13,36,0.88)';

type Props = {
  workouts: Workout[];
  routines: Routine[];
  onRestored: () => void;
};

export default function BackupPanel({ workouts, routines, onRestored }: Props) {
  const [pending, setPending] = useState<{ workouts: Workout[]; routines: Routine[]; schedule: any } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const onExport = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const backup = await createBackup();
      const result = await downloadOrShareJson(backupFilename(), backup);
      if (result === 'shared') showToast('Backup shared');
      else if (result === 'downloaded') showToast('Backup downloaded');
    } catch (err: any) {
      setError(err?.message || 'Could not export your backup.');
    } finally {
      setBusy(false);
    }
  };

  const onImport = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const raw = await pickJsonFile();
      if (raw == null) return;
      const parsed = parseBackup(raw);
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
      setPending(parsed.data);
    } catch (err: any) {
      setError(err?.message || 'Could not import that file.');
    } finally {
      setBusy(false);
    }
  };

  const confirmRestore = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      await restoreBackup(pending);
      setPending(null);
      onRestored();
      showToast('Backup restored');
    } catch (err: any) {
      setError(err?.message || 'Could not restore that backup.');
    } finally {
      setBusy(false);
    }
  };

  const workoutLabel = workouts.length === 1 ? 'workout' : 'workouts';
  const routineLabel = routines.length === 1 ? 'routine' : 'routines';

  return (
    <View style={[styles.panel, glow(colors.accent, 14, 0.18)]}>
      <Corners color={colors.yellow} size={10} />
      <Text style={[typography.title, { fontSize: 16 }]}>Export / import</Text>
      <Text style={[typography.caption, { marginTop: spacing.xs }]}>
        Save a copy of your workouts, routines, and weekly plan, or restore one on this phone.
        Data stays on the device — this file is your backup.
      </Text>
      <Text style={[typography.label, { color: colors.yellow, marginTop: spacing.sm }]}>
        {workouts.length} {workoutLabel} · {routines.length} {routineLabel}
      </Text>

      <View style={styles.row}>
        <Pressable
          onPress={onExport}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Export backup"
          style={({ pressed }) => [
            styles.btn, styles.btnPrimary,
            glow(colors.accent, 16, 0.4),
            pressed && { opacity: 0.85 },
            busy && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="download-outline" size={18} color={colors.onAccent} />
          <Text style={styles.btnPrimaryText} numberOfLines={1}>Export</Text>
        </Pressable>
        <Pressable
          onPress={onImport}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Import backup"
          style={({ pressed }) => [
            styles.btn, styles.btnGhost,
            pressed && { backgroundColor: colors.magentaSoft },
            busy && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="cloud-upload-outline" size={18} color={colors.magenta} />
          <Text style={styles.btnGhostText} numberOfLines={1}>Import</Text>
        </Pressable>
      </View>

      {toast ? (
        <View style={[styles.toast, glow(colors.success, 12, 0.45)]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={[typography.caption, { color: colors.success }]}>{toast}</Text>
        </View>
      ) : null}
      {error ? (
        <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.sm }]}>{error}</Text>
      ) : null}

      <Modal visible={!!pending} transparent animationType="fade" onRequestClose={() => setPending(null)}>
        <View style={styles.overlay}>
          <View style={[styles.dialog, glow(colors.magenta, 22, 0.28)]}>
            <Corners color={colors.magenta} size={12} />
            <Text style={typography.hud}>Restore // Confirm</Text>
            <Text style={[typography.title, { fontSize: 18, marginTop: spacing.sm }]}>
              Replace data on this device?
            </Text>
            <Text style={[typography.caption, { marginTop: spacing.sm }]}>
              This overwrites your workouts, routines, and weekly schedule with the backup file.
              It cannot be undone unless you export a copy first.
            </Text>
            {pending ? (
              <Text style={[typography.label, { color: colors.yellow, marginTop: spacing.md }]}>
                {pending.workouts.length} {pending.workouts.length === 1 ? 'workout' : 'workouts'} ·{' '}
                {pending.routines.length} {pending.routines.length === 1 ? 'routine' : 'routines'}
              </Text>
            ) : null}
            <View style={styles.row}>
              <Pressable
                onPress={() => setPending(null)}
                accessibilityRole="button"
                accessibilityLabel="Cancel restore"
                style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && { backgroundColor: colors.surfaceAlt }]}
              >
                <Text style={[styles.btnGhostText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmRestore}
                accessibilityRole="button"
                accessibilityLabel="Restore backup"
                style={({ pressed }) => [styles.btn, styles.btnDanger, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.btnPrimaryText}>Restore backup</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { ...card, backgroundColor: panel, borderColor: colors.yellow + '44', padding: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btn: {
    flex: 1, minHeight: hitTarget, paddingHorizontal: spacing.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    borderRadius: radius.sm, overflow: 'hidden',
  },
  btnPrimary: { backgroundColor: colors.accent },
  btnPrimaryText: {
    fontFamily: fonts.displayMedium, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase',
    color: colors.onAccent,
  },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.magenta },
  btnGhostText: {
    fontFamily: fonts.displayMedium, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase',
    color: colors.magenta,
  },
  btnDanger: { backgroundColor: colors.magenta, borderWidth: 0 },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderWidth: 1, borderColor: colors.success + '66', borderRadius: radius.sm,
    backgroundColor: 'rgba(57,255,136,0.08)',
  },
  overlay: {
    flex: 1, backgroundColor: 'rgba(3,3,10,0.82)',
    alignItems: 'center', justifyContent: 'center', padding: spacing.lg,
  },
  dialog: {
    ...card, width: '100%', maxWidth: 360, backgroundColor: colors.surface,
    borderColor: colors.magenta + '66', padding: spacing.lg,
  },
});
