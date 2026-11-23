import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { loadWorkouts } from '../storage';
import { Workout } from '../types';
import { colors, spacing, radius, typography, fonts, card, glow, textGlow } from '../theme';
import { NeonBackground, Corners } from '../components/Neon';

const pad2 = (n: number) => String(n).padStart(2, '0');

export default function ProgressScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadWorkouts().then(setWorkouts);
  }, []);

  // Simple summary for now – charts can be added with a library later
  const totalWorkouts = workouts.length;
  const uniqueExercises = new Set(
    workouts.flatMap(w => w.exercises.map(e => e.name))
  ).size;

  const recentCount = Math.min(workouts.length, 5);

  const header = (
    <View>
      <Text style={typography.hud}>MOD.02 // TELEMETRY</Text>
      <Text style={[typography.title, styles.title]}>At a glance</Text>
      <Text style={[typography.caption, { marginTop: spacing.xxs }]}>Everything you’ve logged so far.</Text>

      <View style={styles.statsRow}>
        <StatPanel icon="flame" value={totalWorkouts} label="Workouts logged" color={colors.magenta} />
        <StatPanel icon="barbell" value={uniqueExercises} label="Unique exercises" color={colors.accent} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={typography.hud}>// Recent activity</Text>
        <View style={styles.sectionRule} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <NeonBackground />
      <FlatList
        data={workouts.slice().reverse().slice(0, 5)}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        renderItem={({ item, index }) => {
          const tint = index === 0 ? colors.magenta : colors.accent;
          return (
            <View style={styles.item}>
              <View style={styles.rail}>
                <View
                  style={[
                    styles.line,
                    index === 0 && { top: 26 },
                    index === recentCount - 1 && { bottom: undefined, height: 26 },
                  ]}
                />
                <View style={[styles.dot, { backgroundColor: tint }, glow(tint, 10, 0.9)]} />
              </View>
              <View style={[styles.itemBody, index === 0 && { borderColor: colors.magenta + '66' }]}>
                {index === 0 && <Corners color={colors.magenta} size={8} />}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={typography.heading} numberOfLines={1}>{item.name}</Text>
                  <Text style={[typography.caption, { marginTop: 2 }]} numberOfLines={1}>
                    {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.exCount}>{pad2(item.exercises.length)}</Text>
                  <Text style={styles.exUnit}>EX</Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Corners color={colors.magenta} />
            <Ionicons name="stats-chart" size={28} color={colors.magenta} style={{ marginBottom: spacing.sm }} />
            <Text style={[typography.title, { fontSize: 16 }]}>No signal</Text>
            <Text style={[typography.caption, { textAlign: 'center', marginTop: spacing.xxs }]}>
              Log some workouts to see progress!
            </Text>
          </View>
        }
      />
    </View>
  );
}

function StatPanel({ icon, value, label, color }: {
  icon: keyof typeof Ionicons.glyphMap; value: number; label: string; color: string;
}) {
  return (
    <View style={[styles.card, { borderColor: color + '66' }, glow(color, 16, 0.25)]}>
      <Corners color={color} />
      <View style={styles.cardTop}>
        <Ionicons name={icon} size={20} color={color} />
        <View style={[styles.cardTick, { backgroundColor: color }]} />
      </View>
      <Text style={[styles.stat, { color }, textGlow(color, 14)]}>{pad2(value)}</Text>
      <Text style={typography.label} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const panel = 'rgba(15,13,36,0.88)';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { marginTop: spacing.xs, ...textGlow(colors.accent, 12) },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  card: { ...card, backgroundColor: panel, flex: 1, padding: spacing.md, minHeight: 150, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTick: { width: 18, height: 3 },
  stat: { fontFamily: fonts.monoBold, fontSize: 44, lineHeight: 50, marginTop: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xxl, marginBottom: spacing.sm },
  sectionRule: { flex: 1, height: 1, backgroundColor: colors.border },

  item: { flexDirection: 'row', alignItems: 'stretch' },
  rail: { width: 24, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: radius.pill, marginTop: 21 },
  line: { position: 'absolute', top: 0, bottom: 0, left: 11, width: 2, backgroundColor: 'rgba(0,240,255,0.3)' },
  itemBody: {
    ...card, backgroundColor: panel, flex: 1, minWidth: 0, marginLeft: spacing.xs, marginBottom: spacing.xs,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  exCount: { fontFamily: fonts.monoBold, fontSize: 16, color: colors.yellow, ...textGlow(colors.yellow, 6) },
  exUnit: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.5, color: colors.textMuted },
  empty: { ...card, backgroundColor: panel, alignItems: 'center', padding: spacing.xl },
});
