import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { loadRoutines, saveRoutines, loadSchedule, saveSchedule, loadWorkouts } from '../storage';
import { Routine, Workout, WeeklySchedule, DayKey, DAY_KEYS, REST, todayKey } from '../types';
import { colors, spacing, radius, typography, fonts, card, input, hitTarget, glow, textGlow } from '../theme';
import { NeonBackground, Corners } from '../components/Neon';
import { workoutFromRoutine } from '../utils/routineWorkout';

const pad2 = (n: number) => String(n).padStart(2, '0');
const panel = 'rgba(15,13,36,0.88)';
const tintFor = (i: number) => (i % 2 === 0 ? colors.accent : colors.magenta);

export default function RoutinesScreen({ navigation }: any) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [history, setHistory] = useState<Workout[]>([]);
  const [newName, setNewName] = useState('');
  const [editingDay, setEditingDay] = useState<DayKey | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('3');
  const [exReps, setExReps] = useState('8');
  const insets = useSafeAreaInsets();
  const today = todayKey();

  useFocusEffect(
    useCallback(() => {
      loadRoutines().then(setRoutines);
      loadSchedule().then(setSchedule);
      loadWorkouts().then(setHistory);
    }, [])
  );

  const persistRoutines = async (updated: Routine[]) => {
    setRoutines(updated);
    await saveRoutines(updated);
  };

  const addRoutine = async () => {
    if (!newName.trim()) return;
    const routine: Routine = { id: Date.now().toString(), name: newName.trim(), exercises: [] };
    await persistRoutines([...routines, routine]);
    setNewName('');
    setExpandedId(routine.id); // open it so exercises can be added right away
  };

  const assignDay = async (day: DayKey, value: string | undefined) => {
    const updated = { ...schedule };
    if (value === undefined) delete updated[day];
    else updated[day] = value;
    setSchedule(updated);
    setEditingDay(null);
    await saveSchedule(updated);
  };

  const addExercise = async (routineId: string) => {
    const name = exName.trim();
    if (!name) return;
    const sets = Math.max(1, Math.min(20, parseInt(exSets, 10) || 3));
    const reps = Math.max(1, Math.min(100, parseInt(exReps, 10) || 8));
    await persistRoutines(
      routines.map(r => (r.id === routineId ? { ...r, exercises: [...r.exercises, { name, defaultSets: sets, defaultReps: reps }] } : r))
    );
    setExName('');
  };

  const removeExercise = async (routineId: string, idx: number) => {
    await persistRoutines(
      routines.map(r => (r.id === routineId ? { ...r, exercises: r.exercises.filter((_, i) => i !== idx) } : r))
    );
  };

  const startFromRoutine = (routine: Routine) => {
    navigation.navigate('LogWorkout', { workout: workoutFromRoutine(routine, history), isNew: true });
  };

  const dayLabel = (value: string | undefined) => {
    if (!value) return { text: 'Unassigned', color: colors.textFaint };
    if (value === REST) return { text: 'Rest', color: colors.magenta };
    const idx = routines.findIndex(r => r.id === value);
    if (idx < 0) return { text: 'Unassigned', color: colors.textFaint };
    return { text: routines[idx].name, color: colors.accent };
  };

  const header = (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={typography.hud}>MOD.01 // TEMPLATES</Text>
      <Text style={[typography.title, styles.title]}>Workout Routines</Text>
      <Text style={[typography.caption, { marginTop: spacing.xxs }]}>
        Plan your week, then build each routine’s exercises.
      </Text>

      {/* ---------- WEEK SCHEDULE ---------- */}
      <View style={styles.sectionHeader}>
        <Text style={typography.hud}>// Week schedule</Text>
        <View style={styles.sectionRule} />
      </View>
      <View style={styles.schedule}>
        <Corners color={colors.yellow} size={8} />
        {DAY_KEYS.map((day, i) => {
          const lbl = dayLabel(schedule[day]);
          const isToday = day === today;
          const open = editingDay === day;
          return (
            <View key={day} style={i > 0 && styles.dayBorder}>
              <Pressable
                onPress={() => setEditingDay(open ? null : day)}
                style={({ pressed }) => [styles.dayRow, isToday && styles.dayRowToday, pressed && { backgroundColor: colors.surfaceAlt }]}
                accessibilityRole="button"
                accessibilityLabel={`${day} schedule`}
              >
                <Text style={[styles.dayKey, isToday && { color: colors.accent }]}>{day.toUpperCase()}</Text>
                {isToday && <Text style={styles.todayTag}>TODAY</Text>}
                <Text style={[styles.dayValue, { color: lbl.color }, lbl.color === colors.accent && textGlow(colors.accent, 6)]} numberOfLines={1}>
                  {lbl.text}
                </Text>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
              </Pressable>
              {open && (
                <View style={styles.chips}>
                  {routines.map(r => (
                    <Chip key={r.id} label={r.name} active={schedule[day] === r.id} color={colors.accent} onPress={() => assignDay(day, r.id)} />
                  ))}
                  <Chip label="Rest" active={schedule[day] === REST} color={colors.magenta} onPress={() => assignDay(day, REST)} />
                  <Chip label="Clear" active={false} color={colors.textMuted} onPress={() => assignDay(day, undefined)} />
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* ---------- CREATE ---------- */}
      <View style={styles.row}>
        <TextInput
          style={[input, { flex: 1, minWidth: 0 }]}
          value={newName}
          onChangeText={setNewName}
          placeholder="New routine name"
          placeholderTextColor={colors.placeholder}
          onSubmitEditing={addRoutine}
          returnKeyType="done"
        />
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { backgroundColor: colors.accentPressed }]}
          onPress={addRoutine}
          accessibilityRole="button"
          accessibilityLabel="Create routine"
        >
          <Ionicons name="add" size={20} color={colors.onAccent} />
          <Text style={styles.addBtnText}>Create</Text>
        </Pressable>
      </View>
      <View style={styles.sectionHeader}>
        <Text style={typography.hud}>// Loaded</Text>
        <View style={styles.sectionRule} />
        <Text style={typography.label}>{pad2(routines.length)} {routines.length === 1 ? 'routine' : 'routines'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <NeonBackground />
      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item, index }) => {
          const totalSets = item.exercises.reduce((n, e) => n + (e.defaultSets || 0), 0);
          const preview = item.exercises.map(e => e.name).join(' · ');
          const tint = tintFor(index);
          const open = expandedId === item.id;
          const days = DAY_KEYS.filter(d => schedule[d] === item.id).map(d => d.toUpperCase()).join(' ');
          return (
            <View style={[styles.item, { borderColor: tint + '44' }]}>
              <Corners color={tint} size={8} />
              <View style={styles.itemTop}>
                <Pressable
                  style={styles.itemMain}
                  onPress={() => setExpandedId(open ? null : item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                >
                  <View style={[styles.itemIcon, { borderColor: tint, backgroundColor: tint + '1F' }]}>
                    <Text style={[styles.itemCode, { color: tint }, textGlow(tint, 6)]}>R{pad2(index + 1)}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={typography.heading} numberOfLines={1}>{item.name}</Text>
                    <Text style={[typography.caption, { marginTop: 2 }]} numberOfLines={1}>
                      <Text style={{ color: colors.yellow }}>{item.exercises.length}</Text> exercises
                      {totalSets ? <> · <Text style={{ color: colors.yellow }}>{totalSets}</Text> sets</> : null}
                    </Text>
                    {!open && preview.length > 0 && (
                      <Text style={[typography.caption, styles.preview]} numberOfLines={1}>{preview}</Text>
                    )}
                    {days ? (
                      <Text style={[styles.days, { color: tint }]} numberOfLines={1}>▸ {days}</Text>
                    ) : null}
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => startFromRoutine(item)}
                  style={({ pressed }) => [styles.playBtn, { borderColor: tint }, glow(tint, 10, 0.4), pressed && { backgroundColor: tint + '33' }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Start ${item.name}`}
                >
                  <Ionicons name="play" size={18} color={tint} />
                </Pressable>
              </View>

              {open && (
                <View style={styles.editor}>
                  {item.exercises.length === 0 && (
                    <Text style={[typography.caption, { marginBottom: spacing.xs }]}>No exercises yet — add the first one.</Text>
                  )}
                  {item.exercises.map((ex, i) => (
                    <View key={i} style={styles.exRow}>
                      <Text style={styles.exIdx}>{pad2(i + 1)}</Text>
                      <Text style={[typography.bodyStrong, { flex: 1, minWidth: 0 }]} numberOfLines={1}>{ex.name}</Text>
                      <Text style={styles.exScheme}>{ex.defaultSets} × {ex.defaultReps ?? '—'}</Text>
                      <Pressable
                        onPress={() => removeExercise(item.id, i)}
                        style={styles.removeBtn}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${ex.name}`}
                      >
                        <Ionicons name="close" size={18} color={colors.danger} />
                      </Pressable>
                    </View>
                  ))}
                  <TextInput
                    style={[input, { marginTop: spacing.xs }]}
                    value={exName}
                    onChangeText={setExName}
                    placeholder="Exercise name (e.g. Bench Press)"
                    placeholderTextColor={colors.placeholder}
                  />
                  <View style={styles.exForm}>
                    <View style={styles.numField}>
                      <Text style={typography.label}>Sets</Text>
                      <TextInput style={[input, styles.numInput]} keyboardType="numeric" value={exSets} onChangeText={setExSets} />
                    </View>
                    <View style={styles.numField}>
                      <Text style={typography.label}>Reps</Text>
                      <TextInput style={[input, styles.numInput]} keyboardType="numeric" value={exReps} onChangeText={setExReps} />
                    </View>
                    <Pressable
                      onPress={() => addExercise(item.id)}
                      style={({ pressed }) => [styles.addExBtn, pressed && { backgroundColor: colors.accentSoft }]}
                      accessibilityRole="button"
                    >
                      <Ionicons name="add" size={18} color={colors.accent} />
                      <Text style={styles.addExText}>Add exercise</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Corners color={colors.magenta} />
            <Ionicons name="pulse" size={30} color={colors.magenta} style={{ marginBottom: spacing.sm }} />
            <Text style={[typography.title, { fontSize: 16 }]}>No routines</Text>
            <Text style={[typography.caption, { textAlign: 'center', marginTop: spacing.xxs }]}>
              Create one above, like “Push Day” or “Leg Day”.
            </Text>
          </View>
        }
      />
    </View>
  );
}

function Chip({ label, active, color, onPress }: { label: string; active: boolean; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { borderColor: color },
        active && { backgroundColor: color },
        pressed && !active && { backgroundColor: color + '22' },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipText, { color: active ? colors.onAccent : color }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { marginTop: spacing.xs, ...textGlow(colors.accent, 12) },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: colors.accent, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, height: hitTarget,
    ...glow(colors.accent, 14, 0.5),
  },
  addBtnText: { fontFamily: fonts.displayMedium, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: colors.onAccent },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xl, marginBottom: spacing.sm },
  sectionRule: { flex: 1, height: 1, backgroundColor: colors.border },

  schedule: { ...card, backgroundColor: panel, borderColor: colors.yellow + '44', paddingVertical: spacing.xxs },
  dayBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: hitTarget, paddingHorizontal: spacing.md },
  dayRowToday: { backgroundColor: 'rgba(0,240,255,0.07)' },
  dayKey: { fontFamily: fonts.monoBold, fontSize: 13, letterSpacing: 1.5, color: colors.textMuted, width: 40 },
  todayTag: {
    fontFamily: fonts.monoBold, fontSize: 9, letterSpacing: 1, color: colors.onAccent, backgroundColor: colors.accent,
    paddingHorizontal: 5, paddingVertical: 2, overflow: 'hidden',
  },
  dayValue: { flex: 1, minWidth: 0, textAlign: 'right', fontFamily: fonts.bodyBold, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  chip: { minHeight: hitTarget - 8, paddingHorizontal: spacing.md, borderWidth: 1, borderRadius: radius.sm, justifyContent: 'center' },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 15 },

  item: { ...card, backgroundColor: panel, padding: spacing.md },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: hitTarget },
  itemIcon: { width: 46, height: 46, borderRadius: radius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  itemCode: { fontFamily: fonts.monoBold, fontSize: 13, letterSpacing: 0.5 },
  preview: { marginTop: 4, color: colors.placeholder, fontSize: 11 },
  days: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 1.5, marginTop: 4 },
  playBtn: {
    width: hitTarget, height: hitTarget, borderRadius: radius.sm,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)',
  },

  editor: { marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
  exIdx: { fontFamily: fonts.monoBold, fontSize: 11, color: colors.magenta, width: 20 },
  exScheme: { fontFamily: fonts.monoBold, fontSize: 14, color: colors.yellow },
  removeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  exForm: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, marginTop: spacing.xs },
  numField: { width: 64, gap: 4 },
  numInput: { paddingHorizontal: spacing.sm, textAlign: 'center', fontFamily: fonts.monoBold },
  addExBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    minHeight: hitTarget, borderWidth: 1, borderColor: colors.accent + '88', borderStyle: 'dashed', borderRadius: radius.sm,
  },
  addExText: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', color: colors.accent },
  empty: { ...card, backgroundColor: panel, alignItems: 'center', padding: spacing.xl },
});
