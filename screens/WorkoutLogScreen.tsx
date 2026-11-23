import React, { useState, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { loadWorkouts } from '../storage';
import { Workout } from '../types';
import { colors, spacing, radius, typography, fonts, card, hitTarget, glow, textGlow } from '../theme';
import { NeonBackground, Corners, CutCorners } from '../components/Neon';

// ---- display helpers (read-only, no data changes) ----
const DAY = 24 * 60 * 60 * 1000;

function relativeDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(today) - startOf(d)) / DAY);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function workoutSummary(w: Workout) {
  const sets = w.exercises.reduce((n, e) => n + e.sets.length, 0);
  const volume = w.exercises.reduce(
    (v, e) => v + e.sets.reduce((s, set) => s + (set.reps || 0) * (set.weight || 0), 0),
    0
  );
  return { exercises: w.exercises.length, sets, volume };
}

function formatVolume(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return String(Math.round(v));
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export default function WorkoutLogScreen({ navigation }: any) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const insets = useSafeAreaInsets();

  // Reload on focus so a just-saved workout shows up immediately.
  useFocusEffect(
    useCallback(() => {
      loadWorkouts().then(setWorkouts);
    }, [])
  );

  const startNewWorkout = () => {
    const newWorkout: Workout = {
      id: Date.now().toString(),
      name: 'Workout ' + new Date().toLocaleDateString(),
      date: new Date().toISOString(),
      exercises: [],
    };
    navigation.navigate('LogWorkout', { workout: newWorkout, isNew: true });
  };

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * DAY;
    const thisWeek = workouts.filter(w => new Date(w.date).getTime() >= weekAgo);
    const weekVolume = thisWeek.reduce((v, w) => v + workoutSummary(w).volume, 0);
    return { week: thisWeek.length, total: workouts.length, weekVolume };
  }, [workouts]);

  const now = new Date();
  const stamp = `${now.getFullYear()}.${pad2(now.getMonth() + 1)}.${pad2(now.getDate())}`;
  const weekday = now.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();

  const header = (
    <View>
      {/* Title */}
      <View style={styles.greeting}>
        <Text style={typography.hud}>LOG // {weekday} · {stamp}</Text>
        <Text style={[typography.display, styles.title]}>Workout Log</Text>
        <Text style={styles.prompt}>
          <Text style={{ color: colors.magenta }}>&gt;</Text> every session you’ve saved
          <Text style={{ color: colors.accent }}>_</Text>
        </Text>
      </View>

      {/* Primary CTA — gradient, cut corners, glow */}
      <Pressable
        onPress={startNewWorkout}
        accessibilityRole="button"
        accessibilityLabel="Start new workout"
        style={({ pressed }) => [styles.ctaWrap, pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}
      >
        <LinearGradient
          colors={[colors.accent, '#7A7CFF', colors.magenta]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaEyebrow}>INIT SESSION // {pad2(stats.total + 1)}</Text>
            <Text style={styles.ctaTitle}>Start new workout</Text>
          </View>
          <View style={styles.ctaIcon}>
            <Ionicons name="play" size={22} color={colors.accent} />
          </View>
          <CutCorners size={16} />
        </LinearGradient>
      </Pressable>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatTile value={String(stats.week)} label="This week" color={colors.accent} />
        <StatTile value={formatVolume(stats.weekVolume)} label="Wk volume" color={colors.magenta} />
        <StatTile value={String(stats.total)} label="All time" color={colors.yellow} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={typography.hud}>// Recent logs</Text>
        <View style={styles.sectionRule} />
        {workouts.length > 0 && (
          <Text style={[typography.label, { color: colors.textMuted }]}>{pad2(workouts.length)} total</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <NeonBackground />
      <FlatList
        data={workouts.slice().reverse()}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={[
          styles.content,
          { paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
        renderItem={({ item, index }) => {
          const s = workoutSummary(item);
          return (
            <Pressable
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              onPress={() => navigation.navigate('LogWorkout', { workout: item })}
            >
              <View style={[styles.itemAccent, { backgroundColor: index === 0 ? colors.magenta : colors.accent }]} />
              <Text style={styles.itemIndex}>{pad2(index + 1)}</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={typography.heading} numberOfLines={1}>{item.name}</Text>
                <Text style={[typography.caption, { marginTop: 2 }]} numberOfLines={1}>
                  {relativeDay(item.date)} · {s.exercises} ex · {s.sets} sets
                </Text>
              </View>
              {s.volume > 0 && (
                <View style={styles.volume}>
                  <Text style={styles.volumeText}>{formatVolume(s.volume)}</Text>
                  <Text style={styles.volumeUnit}>VOL</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.accent} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Corners color={colors.magenta} />
            <Ionicons name="pulse" size={30} color={colors.magenta} style={{ marginBottom: spacing.sm }} />
            <Text style={[typography.title, { fontSize: 16 }]}>No data</Text>
            <Text style={[typography.caption, { textAlign: 'center', marginTop: spacing.xxs }]}>
              No workouts logged yet. Start your first session.
            </Text>
          </View>
        }
      />
    </View>
  );
}

function StatTile({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={[styles.stat, { borderColor: color + '55' }]}>
      <Corners color={color} size={8} />
      <Text style={[typography.stat, { color }, textGlow(color, 12)]}>{value}</Text>
      <Text style={[typography.label, { marginTop: spacing.xxs }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg },

  hudBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  hudLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  liveDot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.success, ...glow(colors.success, 8, 0.9) },

  greeting: { marginTop: spacing.xs, marginBottom: spacing.xl },
  title: { fontSize: 28, lineHeight: 36, marginTop: spacing.xs, ...textGlow(colors.accent, 14) },
  prompt: { fontFamily: fonts.mono, fontSize: 14, color: colors.textMuted, marginTop: spacing.xxs },

  ctaWrap: { ...glow(colors.accent, 24, 0.45) },
  cta: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.sm, overflow: 'hidden',
    paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, minHeight: 92,
  },
  ctaEyebrow: { fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 2, color: colors.onAccent, opacity: 0.7 },
  ctaTitle: {
    fontFamily: fonts.display, fontSize: 19, lineHeight: 24, letterSpacing: 0.8,
    textTransform: 'uppercase', color: colors.onAccent, marginTop: 4,
  },
  ctaIcon: {
    width: 52, height: 52, borderRadius: radius.sm, marginRight: spacing.xxs,
    backgroundColor: colors.onAccent, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(0,240,255,0.5)',
  },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  stat: { ...card, flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, backgroundColor: 'rgba(15,13,36,0.85)' },

  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  action: { ...card, flex: 1, padding: spacing.md, minHeight: hitTarget * 2.4, backgroundColor: 'rgba(15,13,36,0.85)' },
  actionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  actionIcon: {
    width: 40, height: 40, borderRadius: radius.sm, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  actionTitle: {
    fontFamily: fonts.displayMedium, fontSize: 15, letterSpacing: 1.2, textTransform: 'uppercase',
    color: colors.text, marginTop: spacing.sm,
  },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginTop: spacing.xxl, marginBottom: spacing.sm,
  },
  sectionRule: { flex: 1, height: 1, backgroundColor: colors.border },

  item: {
    ...card,
    backgroundColor: 'rgba(15,13,36,0.85)',
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm, paddingRight: spacing.sm, paddingLeft: spacing.md,
    minHeight: hitTarget + 16, overflow: 'hidden',
  },
  itemPressed: { backgroundColor: colors.surfaceAlt },
  itemAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  itemIndex: { fontFamily: fonts.monoBold, fontSize: 13, color: colors.textFaint, width: 22 },
  volume: { alignItems: 'flex-end' },
  volumeText: { fontFamily: fonts.monoBold, fontSize: 15, color: colors.yellow, ...textGlow(colors.yellow, 6) },
  volumeUnit: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.5, color: colors.textMuted },

  empty: { ...card, alignItems: 'center', padding: spacing.xl },
});
