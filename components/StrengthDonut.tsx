import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Text as SvgText, G } from 'react-native-svg';
import { colors, fonts, spacing, typography, textGlow } from '../theme';
import { StrengthReport } from '../utils/strength';

export const SLICE_COLORS = ['#00F0FF', '#FF2BD6', '#F5FF3B', '#39FF88', '#9D5CFF', '#FF8A3D'];
const OTHER_COLOR = '#5B5F97';
const MAX_SLICES = 6;

interface Slice {
  label: string;
  value: number;   // slice weight (share of total gain %-points)
  pct: number;     // label shown on the ring (that exercise's own gain %)
  color: string;
  detail: string;  // legend detail
}

function buildSlices(report: StrengthReport): Slice[] {
  const top = report.gains.slice(0, MAX_SLICES);
  const rest = report.gains.slice(MAX_SLICES);
  const slices: Slice[] = top.map((g, i) => ({
    label: g.name,
    value: g.gainPct,
    pct: g.gainPct,
    color: SLICE_COLORS[i % SLICE_COLORS.length],
    detail: `${Math.round(g.first)} → ${Math.round(g.latest)} e1RM`,
  }));
  if (rest.length) {
    const sum = rest.reduce((s, g) => s + g.gainPct, 0);
    slices.push({
      label: 'Other',
      value: sum,
      pct: sum / rest.length,
      color: OTHER_COLOR,
      detail: `${rest.length} lifts · avg`,
    });
  }
  return slices;
}

// angle in radians, 0 = 12 o'clock, clockwise
const pt = (cx: number, cy: number, rad: number, a: number) => [cx + rad * Math.sin(a), cy - rad * Math.cos(a)];

function arcPath(cx: number, cy: number, R: number, r: number, a0: number, a1: number) {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = pt(cx, cy, R, a0);
  const [x1, y1] = pt(cx, cy, R, a1);
  const [x2, y2] = pt(cx, cy, r, a1);
  const [x3, y3] = pt(cx, cy, r, a0);
  return `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${r} ${r} 0 ${large} 0 ${x3} ${y3} Z`;
}

/** Split a name into ≤2 short lines for the donut hole. */
function shortLines(name: string): string[] {
  const words = name.split(/\s+/);
  const clip = (s: string) => (s.length > 8 ? s.slice(0, 7) + '.' : s);
  if (words.length === 1) return [clip(words[0])];
  return [clip(words[0]), clip(words.slice(1).join(' '))];
}

const NAME_FS = 9;
const NAME_LH = 10;
const NAME_CW = 5.9; // approx. JetBrains Mono advance at 9px + letterSpacing

const fmtPct = (p: number) => `+${p >= 10 ? Math.round(p) : p.toFixed(1)}%`;

export default function StrengthDonut({ report, size = 300 }: { report: StrengthReport; size?: number }) {
  const slices = buildSlices(report);

  if (!slices.length) {
    return (
      <View style={styles.empty}>
        <Text style={[typography.title, { fontSize: 15 }]}>Not enough data</Text>
        <Text style={[typography.caption, { textAlign: 'center', marginTop: spacing.xxs }]}>
          Log the same exercise with weight in at least two workouts to see how much stronger you’re getting.
        </Text>
      </View>
    );
  }

  const cx = size / 2, cy = size / 2;
  const R = size / 2 - 6;          // leave room for glow stroke
  const r = R - 48;                // thick ring
  const total = slices.reduce((s, x) => s + x.value, 0);
  const gap = slices.length > 1 ? 0.03 : 0; // radians between slices

  let a = 0;
  const geo = slices.map(s => {
    const sweep = (s.value / total) * Math.PI * 2;
    const a0 = a + gap / 2;
    const a1 = a + sweep - gap / 2;
    a += sweep;
    return { ...s, a0, a1, mid: (a0 + a1) / 2, sweep };
  });

  const avg = report.averagePct ?? 0;

  // Place names inside the hole next to their slice. Each label is centred on the slice's
  // mid-angle, pulled in just enough to stay inside the hole; labels that would collide with
  // the centre readout or a bigger slice's label are skipped (the legend still lists them).
  const CENTER_BOX = { x0: cx - 42, x1: cx + 42, y0: cy - 22, y1: cy + 24 };
  const placed: { x0: number; x1: number; y0: number; y1: number }[] = [CENTER_BOX];
  const overlaps = (a: typeof CENTER_BOX, b: typeof CENTER_BOX) =>
    a.x0 < b.x1 + 2 && a.x1 + 2 > b.x0 && a.y0 < b.y1 + 2 && a.y1 + 2 > b.y0;
  const nameLabels: { x: number; y: number; lines: string[]; color: string }[] = [];
  geo
    .map((g, idx) => ({ g, idx }))
    .sort((a, b) => b.g.sweep - a.g.sweep)
    .forEach(({ g }) => {
      if (g.sweep < 0.3) return;
      const lines = shortLines(g.label).map(l => l.toUpperCase());
      const w = Math.max(...lines.map(l => l.length)) * NAME_CW;
      const h = lines.length * NAME_LH;
      const sin = Math.sin(g.mid), cos = Math.cos(g.mid);
      const rho = r - 6 - (w / 2) * Math.abs(sin) - (h / 2) * Math.abs(cos);
      const [x, y] = pt(cx, cy, rho, g.mid);
      const box = { x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2 };
      if (placed.some(p => overlaps(p, box))) return;
      placed.push(box);
      nameLabels.push({ x, y, lines, color: g.color === OTHER_COLOR ? colors.textMuted : g.color });
    });

  return (
    <View>
      <View style={{ alignItems: 'center' }}>
        <Svg width={size} height={size}>
          {/* faint track */}
          <Circle cx={cx} cy={cy} r={(R + r) / 2} stroke={colors.border} strokeWidth={R - r} fill="none" opacity={0.5} />
          {geo.map((s, i) => {
            const full = s.a1 - s.a0 >= Math.PI * 2 - 0.001;
            const paths = full
              ? [arcPath(cx, cy, R, r, 0, Math.PI), arcPath(cx, cy, R, r, Math.PI, Math.PI * 2 - 0.0001)]
              : [arcPath(cx, cy, R, r, s.a0, s.a1)];
            return (
              <G key={i}>
                {/* glow halo: wide translucent stroke behind the slice */}
                {paths.map((d, k) => (
                  <Path key={'g' + k} d={d} fill="none" stroke={s.color} strokeWidth={7} strokeOpacity={0.28} strokeLinejoin="round" />
                ))}
                {paths.map((d, k) => (
                  <Path key={'f' + k} d={d} fill={s.color} fillOpacity={0.92} stroke={s.color} strokeWidth={1} />
                ))}
              </G>
            );
          })}

          {/* % labels inside the ring */}
          {geo.map((s, i) => {
            if (s.sweep < 0.38) return null; // too thin for a label; legend covers it
            const [x, y] = pt(cx, cy, (R + r) / 2, s.mid);
            const big = s.sweep > 0.8;
            return (
              <SvgText
                key={'p' + i}
                x={x}
                y={y + (big ? 6 : 5)}
                fill={colors.onAccent}
                fontSize={big ? 17 : 14}
                fontWeight="bold"
                fontFamily={fonts.monoBold}
                textAnchor="middle"
              >
                {fmtPct(s.pct)}
              </SvgText>
            );
          })}

          {/* exercise names inside the hole, next to their slice */}
          {nameLabels.map((l, i) => (
            <G key={'n' + i}>
              {l.lines.map((ln, k) => (
                <SvgText
                  key={k}
                  x={l.x}
                  y={l.y - ((l.lines.length - 1) * NAME_LH) / 2 + 3 + k * NAME_LH}
                  fill={l.color}
                  fontSize={NAME_FS}
                  fontFamily={fonts.mono}
                  textAnchor="middle"
                  letterSpacing={0.5}
                >
                  {ln}
                </SvgText>
              ))}
            </G>
          ))}
        </Svg>

        {/* centre readout (RN Text so it can glow) */}
        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          <Text style={styles.centerValue}>{avg >= 0 ? '+' : ''}{avg.toFixed(avg >= 10 ? 0 : 1)}%</Text>
          <Text style={styles.centerLabel}>STRONGER</Text>
        </View>
      </View>

      {/* legend */}
      <View style={styles.legend}>
        {geo.map((s, i) => (
          <View key={i} style={styles.legendRow}>
            <View style={[styles.swatch, { backgroundColor: s.color }]} />
            <Text style={[typography.bodyStrong, { flex: 1, minWidth: 0 }]} numberOfLines={1}>{s.label}</Text>
            <Text style={[typography.caption, { marginRight: spacing.sm }]} numberOfLines={1}>{s.detail}</Text>
            <Text style={[styles.legendPct, { color: s.color === OTHER_COLOR ? colors.text : s.color }]}>{fmtPct(s.pct)}</Text>
          </View>
        ))}
      </View>

      {report.excluded.length > 0 && (
        <Text style={styles.note}>
          Not charted:{' '}
          {report.excluded
            .map(e => `${e.name} (${e.reason === 'no weight' ? 'no weight logged' : e.reason})`)
            .join(', ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  centerValue: {
    fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: colors.text,
    ...textGlow(colors.accent, 16),
  },
  centerLabel: { fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 2.5, color: colors.accent, marginTop: 2 },
  legend: { marginTop: spacing.md, gap: spacing.xs },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 26 },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  legendPct: { fontFamily: fonts.monoBold, fontSize: 14, minWidth: 52, textAlign: 'right' },
  note: { ...typography.caption, fontSize: 11, color: colors.placeholder, marginTop: spacing.sm },
  empty: { alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
});
