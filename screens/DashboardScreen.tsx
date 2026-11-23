import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { loadWorkouts, loadRoutines, loadSchedule } from '../storage';
import { Workout, Routine, WeeklySchedule, REST, todayKey, DAY_NAMES } from '../types';
import { colors, spacing, radius, typography, fonts, card, hitTarget, glow, textGlow } from '../theme';
import { NeonBackground, Corners, CutCorners } from '../components/Neon';
import StrengthDonut from '../components/StrengthDonut';
import BackupPanel from '../components/BackupPanel';
import { strengthReport } from '../utils/strength';
import { workoutFromRoutine } from '../utils/routineWorkout';

const pad2 = (n: number) => String(n).padStart(2, '0');
const panel = 'rgba(15,13,36,0.88)';

export default function DashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const reload = useCallback(() => {
    return Promise.all([loadWorkouts(), loadRoutines(), loadSchedule()]).then(([w, r, s]) => {
      setWorkouts(w); setRoutines(r); setSchedule(s); setLoaded(true);
    });
  }, []);

  // Reload whenever the dashboard comes back into focus (e.g. after saving a workout).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([loadWorkouts(), loadRoutines(), loadSchedule()]).then(([w, r, s]) => {
        if (!active) return;
        setWorkouts(w); setRoutines(r); setSchedule(s); setLoaded(true);
      });
      return () => { active = false; };
    }, [])
  );

  const now = new Date();
  const dayKey = todayKey(now);
  const assigned = schedule[dayKey];
  const todayRoutine = assigned && assigned !== REST ? routines.find(r => r.id === assigned) : undefined;
  const isRest = assigned === REST;
  const report = useMemo(() => strengthReport(workouts), [workouts]);

  const stamp = `${now.getFullYear()}.${pad2(now.getMonth() + 1)}.${pad2(now.getDate())}`;
  const totalSets = todayRoutine?.exercises.reduce((n, e) => n + (e.defaultSets || 0), 0) ?? 0;

  const startNewWorkout = () => {
    const newWorkout: Workout = {
      id: Date.now().toString(),
      name: 'Workout ' + new Date().toLocaleDateString(),
      date: new Date().toISOString(),
      exercises: [],
    };
    navigation.navigate('LogWorkout', { workout: newWorkout, isNew: true });
  };

  const startToday = () => {
    if (!todayRoutine) return;
    navigation.navigate('LogWorkout', { workout: workoutFromRoutine(todayRoutine, workouts), isNew: true });
  };

  return (
    <View style={styles.container}>
      <NeonBackground />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxl },
        ]}
      >
        {/* HUD status bar */}
        <View style={styles.hudBar}>
          <View style={styles.hudLeft}>
            <View style={styles.liveDot} />
            <Text style={typography.hud}>SYS // ONLINE</Text>
          </View>
          <Text style={typography.label}>{stamp}</Text>
        </View>

        <Text style={[typography.display, styles.title]}>Dashboard</Text>

        {/* ---------- TODAY ---------- */}
        <View style={[styles.today, glow(colors.accent, 18, 0.22)]}>
          <Corners color={colors.accent} size={12} />
          <View style={styles.todayTop}>
            <Text style={typography.hud}>Today // {DAY_NAMES[dayKey]}</Text>
            {todayRoutine && <Text style={[typography.label, { color: colors.yellow }]}>Scheduled</Text>}
          </View>

          {!loaded ? null : todayRoutine ? (
            <>
              <Text style={styles.routineName} numberOfLines={2}>{todayRoutine.name}</Text>
              <Text style={[typography.caption, { marginTop: spacing.xxs }]}>
                <Text style={{ color: colors.yellow }}>{todayRoutine.exercises.length}</Text> exercises ·{' '}
                <Text style={{ color: colors.yellow }}>{totalSets}</Text> sets
              </Text>

              {todayRoutine.exercises.length > 0 && (
                <Pressable
                  onPress={() => setExpanded(e => !e)}
                  style={({ pressed }) => [styles.toggle, pressed && { backgroundColor: colors.accentSoft }]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                >
                  <Text style={styles.toggleText}>{expanded ? 'Hide exercises' : 'See all exercises'}</Text>
                  <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.accent} />
                </Pressable>
              )}

              {expanded && (
                <View style={styles.exList}>
                  {todayRoutine.exercises.map((ex, i) => (
                    <View key={i} style={[styles.exRow, i > 0 && styles.exRowBorder]}>
                      <Text style={styles.exIndex}>{pad2(i + 1)}</Text>
                      <Text style={[typography.bodyStrong, { flex: 1, minWidth: 0 }]} numberOfLines={1}>{ex.name}</Text>
                      <Text style={styles.exScheme}>
                        {ex.defaultSets} × {ex.defaultReps ? ex.defaultReps : '—'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <Pressable
                onPress={startToday}
                accessibilityRole="button"
                accessibilityLabel="Start this workout"
                style={({ pressed }) => [{ marginTop: spacing.md }, glow(colors.accent, 22, 0.45), pressed && { opacity: 0.85 }]}
              >
                <LinearGradient
                  colors={[colors.accent, '#7A7CFF', colors.magenta]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cta}
                >
                  <Ionicons name="play" size={20} color={colors.onAccent} />
                  <Text style={styles.ctaText}>Start this workout</Text>
                  <CutCorners size={12} color={colors.surface} />
                </LinearGradient>
              </Pressable>
            </>
          ) : isRest ? (
            <View style={styles.stateBox}>
              <Ionicons name="moon" size={30} color={colors.magenta} style={textGlow(colors.magenta, 10)} />
              <Text style={[styles.routineName, { color: colors.magenta, textAlign: 'center' }]}>Rest day</Text>
              <Text style={[typography.caption, { textAlign: 'center' }]}>
                Recovery is training too. Want to move anyway? Use Quick start below.
              </Text>
            </View>
          ) : (
            <View style={styles.stateBox}>
              <Ionicons name="calendar-outline" size={30} color={colors.yellow} />
              <Text style={[typography.title, { fontSize: 16, textAlign: 'center' }]}>No plan for today</Text>
              <Text style={[typography.caption, { textAlign: 'center' }]}>
                {assigned ? 'The routine for today was removed.' : 'Assign a routine to each day of your week.'}
              </Text>
              <Pressable
                onPress={() => navigation.navigate('Routines')}
                style={({ pressed }) => [styles.outlineBtn, pressed && { backgroundColor: colors.accentSoft }]}
                accessibilityRole="button"
              >
                <Ionicons name="calendar" size={18} color={colors.accent} />
                <Text style={styles.toggleText}>Set up my week</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* ---------- QUICK ACTIONS ---------- */}
        <View style={styles.grid}>
          <Tile icon="flash" code="QS" title="Quick start" sub="Blank workout" color={colors.yellow} onPress={startNewWorkout} />
          <Tile icon="time" code="LOG" title="Workout Log" sub={`${workouts.length} ${workouts.length === 1 ? "session" : "sessions"}`} color={colors.accent} onPress={() => navigation.navigate('WorkoutLog')} />
          <Tile icon="list" code="MOD.01" title="Routines" sub="Plan & week" color={colors.magenta} onPress={() => navigation.navigate('Routines')} />
          <Tile icon="stats-chart" code="MOD.02" title="Progress" sub="Telemetry" color={colors.success} onPress={() => navigation.navigate('Progress')} />
        </View>

        {/* ---------- STRENGTH ---------- */}
        <View style={styles.sectionHeader}>
          <Text style={typography.hud}>// Strength gain</Text>
          <View style={styles.sectionRule} />
        </View>
        <View style={styles.chartPanel}>
          <Corners color={colors.magenta} size={10} />
          <Text style={[typography.caption, { marginBottom: spacing.sm }]}>
            Best estimated 1RM now vs. your first session{report.comparedCount ? ` · ${report.comparedCount} lifts` : ''}
          </Text>
          <StrengthDonut report={report} size={300} />
        </View>

        {/* ---------- BACKUP ---------- */}
        <View style={styles.sectionHeader}>
          <Text style={typography.hud}>// Data backup</Text>
          <View style={styles.sectionRule} />
        </View>
        <BackupPanel workouts={workouts} routines={routines} onRestored={reload} />
      </ScrollView>
    </View>
  );
}

function Tile({ icon, code, title, sub, color, onPress }: {
  icon: keyof typeof Ionicons.glyphMap; code: string; title: string; sub: string; color: string; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.tile, { borderColor: color + '66' }, pressed && { backgroundColor: colors.surfaceAlt }]}
    >
      <Corners color={color} size={8} />
      <View style={styles.tileTop}>
        <View style={[styles.tileIcon, { borderColor: color, backgroundColor: color + '1F' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={[typography.label, { color: colors.textFaint, fontSize: 10 }]}>{code}</Text>
      </View>
      <Text style={[styles.tileTitle, textGlow(color, 8)]} numberOfLines={1}>{title}</Text>
      <Text style={[typography.caption, { fontSize: 11 }]} numberOfLines={1}>{sub}</Text>
    </Pressable>
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
  title: { fontSize: 28, lineHeight: 36, marginTop: spacing.lg, marginBottom: spacing.md, ...textGlow(colors.accent, 14) },

  today: { ...card, backgroundColor: colors.surface, borderColor: colors.accent + '55', padding: spacing.lg },
  todayTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routineName: {
    fontFamily: fonts.display, fontSize: 26, lineHeight: 32, letterSpacing: 1, textTransform: 'uppercase',
    color: colors.text, marginTop: spacing.sm, ...textGlow(colors.accent, 12),
  },
  toggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.md, minHeight: hitTarget, paddingHorizontal: spacing.md,
    borderWidth: 1, borderColor: colors.accent + '55', borderRadius: radius.sm,
  },
  toggleText: { fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.accent },
  exList: { marginTop: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: 'rgba(0,0,0,0.25)' },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, minHeight: 44 },
  exRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  exIndex: { fontFamily: fonts.monoBold, fontSize: 11, color: colors.magenta, width: 20 },
  exScheme: { fontFamily: fonts.monoBold, fontSize: 14, color: colors.yellow },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    minHeight: 56, borderRadius: radius.sm, overflow: 'hidden',
  },
  ctaText: { fontFamily: fonts.display, fontSize: 15, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.onAccent },
  stateBox: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm,
    minHeight: hitTarget, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.accent, borderRadius: radius.sm,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  tile: { ...card, backgroundColor: panel, width: '48%', flexGrow: 1, padding: spacing.md, minHeight: 104 },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tileIcon: { width: 36, height: 36, borderRadius: radius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tileTitle: {
    fontFamily: fonts.displayMedium, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase',
    color: colors.text, marginTop: spacing.sm,
  },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xl, marginBottom: spacing.sm },
  sectionRule: { flex: 1, height: 1, backgroundColor: colors.border },
  chartPanel: { ...card, backgroundColor: panel, borderColor: colors.magenta + '44', padding: spacing.md },
});
