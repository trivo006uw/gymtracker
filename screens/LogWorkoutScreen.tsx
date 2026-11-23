import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { saveWorkouts, loadWorkouts } from '../storage';
import { Workout, Exercise, Set } from '../types';
import { colors, spacing, radius, typography, fonts, card, input, hitTarget, glow, textGlow } from '../theme';
import { NeonBackground, Corners, CutCorners } from '../components/Neon';

const pad2 = (n: number) => String(n).padStart(2, '0');

export default function LogWorkoutScreen({ route, navigation }: any) {
  const { workout: initialWorkout, isNew } = route.params || {};
  const [workout, setWorkout] = useState<Workout>(initialWorkout || {
    id: Date.now().toString(),
    name: 'New Workout',
    date: new Date().toISOString(),
    exercises: [],
  });
  const [newExerciseName, setNewExerciseName] = useState('');
  const insets = useSafeAreaInsets();

  const addExercise = () => {
    if (!newExerciseName.trim()) return;
    const exercise: Exercise = {
      id: Date.now().toString(),
      name: newExerciseName.trim(),
      sets: [{ id: Date.now().toString(), reps: 0, weight: 0, completed: false }],
    };
    setWorkout({ ...workout, exercises: [...workout.exercises, exercise] });
    setNewExerciseName('');
  };

  const updateSet = (exId: string, setId: string, field: 'reps' | 'weight', value: string) => {
    const num = parseFloat(value) || 0;
    setWorkout({
      ...workout,
      exercises: workout.exercises.map(ex =>
        ex.id === exId
          ? { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: num } : s) }
          : ex
      ),
    });
  };

  const addSet = (exId: string) => {
    setWorkout({
      ...workout,
      exercises: workout.exercises.map(ex =>
        ex.id === exId
          ? { ...ex, sets: [...ex.sets, { id: Date.now().toString(), reps: 0, weight: 0, completed: false }] }
          : ex
      ),
    });
  };

  const saveWorkout = async () => {
    const all = await loadWorkouts();
    const updated = isNew || !all.find(w => w.id === workout.id)
      ? [...all, workout]
      : all.map(w => w.id === workout.id ? workout : w);
    await saveWorkouts(updated);
    Alert.alert('Saved!', 'Workout saved.');
    navigation.goBack();
  };

  const totalSets = workout.exercises.reduce((n, e) => n + e.sets.length, 0);
  const dateLabel = new Date(workout.date).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  const header = (
    <View style={{ marginBottom: spacing.lg }}>
      <View style={styles.hudBar}>
        <Text style={typography.hud}>SESSION // {dateLabel}</Text>
        <Text style={[typography.label, { color: colors.yellow }]}>
          {pad2(workout.exercises.length)} EX · {pad2(totalSets)} SETS
        </Text>
      </View>
      <TextInput
        style={styles.nameInput}
        value={workout.name}
        onChangeText={(name) => setWorkout({ ...workout, name })}
        placeholder="Workout name"
        placeholderTextColor={colors.placeholder}
      />
      <View style={styles.nameRule} />

      <View style={styles.addRow}>
        <TextInput
          style={[input, styles.addInput]}
          value={newExerciseName}
          onChangeText={setNewExerciseName}
          placeholder="Add exercise (e.g. Bench Press)"
          placeholderTextColor={colors.placeholder}
          onSubmitEditing={addExercise}
          returnKeyType="done"
        />
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { backgroundColor: colors.accentPressed }]}
          onPress={addExercise}
          accessibilityRole="button"
          accessibilityLabel="Add exercise"
        >
          <Ionicons name="add" size={20} color={colors.onAccent} />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <NeonBackground />
      <FlatList
        data={workout.exercises}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item, index }) => (
          <View style={styles.exercise}>
            <Corners color={colors.accent} />
            <View style={styles.exHeader}>
              <Text style={styles.exCode}>EX.{pad2(index + 1)}</Text>
              <Text style={[typography.heading, { flex: 1, minWidth: 0 }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[typography.label, { color: colors.yellow }]}>{item.sets.length} sets</Text>
            </View>

            <View style={styles.colHeader}>
              <Text style={[typography.label, styles.setCol]}>Set</Text>
              <Text style={[typography.label, styles.fieldCol]}>Reps</Text>
              <Text style={[typography.label, styles.fieldCol]}>Weight</Text>
            </View>

            {item.sets.map((set, idx) => (
              <View key={set.id} style={styles.setRow}>
                <View style={styles.setCol}>
                  <View style={styles.setBadge}>
                    <Text style={styles.setBadgeText}>{pad2(idx + 1)}</Text>
                  </View>
                </View>
                <TextInput
                  style={[input, styles.smallInput]}
                  keyboardType="numeric"
                  placeholder="Reps"
                  placeholderTextColor={colors.placeholder}
                  value={set.reps ? String(set.reps) : ''}
                  onChangeText={(v) => updateSet(item.id, set.id, 'reps', v)}
                />
                <TextInput
                  style={[input, styles.smallInput]}
                  keyboardType="numeric"
                  placeholder="Weight"
                  placeholderTextColor={colors.placeholder}
                  value={set.weight ? String(set.weight) : ''}
                  onChangeText={(v) => updateSet(item.id, set.id, 'weight', v)}
                />
              </View>
            ))}

            <Pressable
              onPress={() => addSet(item.id)}
              style={({ pressed }) => [styles.addSetBtn, pressed && { backgroundColor: colors.accentSoft }]}
              accessibilityRole="button"
            >
              <Ionicons name="add" size={18} color={colors.accent} />
              <Text style={styles.addSet}>Add Set</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Corners color={colors.magenta} />
            <Ionicons name="pulse" size={30} color={colors.magenta} style={{ marginBottom: spacing.sm }} />
            <Text style={[typography.title, { fontSize: 16 }]}>No exercises</Text>
            <Text style={[typography.caption, { textAlign: 'center', marginTop: spacing.xxs }]}>
              Add your first exercise above to start logging sets.
            </Text>
          </View>
        }
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          onPress={saveWorkout}
          accessibilityRole="button"
          accessibilityLabel="Save workout"
          style={({ pressed }) => [glow(colors.accent, 22, 0.45), pressed && { opacity: 0.85 }]}
        >
          <LinearGradient
            colors={[colors.accent, '#7A7CFF', colors.magenta]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveButton}
          >
            <Ionicons name="checkmark" size={22} color={colors.onAccent} />
            <Text style={styles.saveText}>Save Workout</Text>
            <CutCorners size={12} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const panel = 'rgba(15,13,36,0.88)';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl },

  hudBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.xs },
  nameInput: {
    fontFamily: fonts.bodyBold, fontSize: 28, lineHeight: 34, color: colors.text,
    paddingVertical: spacing.xs, paddingHorizontal: 0, marginTop: spacing.xs,
    ...textGlow(colors.accent, 10),
  },
  nameRule: { height: 1, backgroundColor: colors.accent, opacity: 0.6, ...glow(colors.accent, 8, 0.8) },

  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg },
  addInput: { flex: 1, minWidth: 0 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: colors.accent, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, height: hitTarget,
    ...glow(colors.accent, 14, 0.5),
  },
  addBtnText: { fontFamily: fonts.displayMedium, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: colors.onAccent },

  exercise: { ...card, backgroundColor: panel, borderColor: 'rgba(0,240,255,0.25)', padding: spacing.md },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  exCode: {
    fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 1, color: colors.magenta,
    borderWidth: 1, borderColor: colors.magenta + '88', paddingHorizontal: 6, paddingVertical: 3,
    ...textGlow(colors.magenta, 6),
  },

  colHeader: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  setCol: { width: 36, alignItems: 'center', textAlign: 'center' },
  fieldCol: { flex: 1, minWidth: 0, paddingLeft: spacing.xxs },

  setRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  setBadge: {
    width: 32, height: 32, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.accent + '77',
    backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center',
  },
  setBadgeText: { fontFamily: fonts.monoBold, fontSize: 12, color: colors.accent },
  // flex:1 + minWidth:0 + width:0 lets both inputs share the row instead of overflowing the card
  smallInput: {
    flex: 1, minWidth: 0, width: 0, minHeight: hitTarget, paddingHorizontal: spacing.sm,
    fontFamily: fonts.monoBold, fontSize: 16,
  },

  addSetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xxs,
    marginTop: spacing.xxs, minHeight: hitTarget, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.accent + '66', borderStyle: 'dashed',
  },
  addSet: { fontFamily: fonts.monoBold, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.accent },

  empty: { ...card, backgroundColor: panel, alignItems: 'center', padding: spacing.xl },

  footer: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm,
    backgroundColor: 'rgba(7,6,15,0.94)', borderTopWidth: 1, borderTopColor: colors.magenta + '55',
  },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    borderRadius: radius.sm, minHeight: 56, overflow: 'hidden',
  },
  saveText: { fontFamily: fonts.display, fontSize: 16, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.onAccent },
});
