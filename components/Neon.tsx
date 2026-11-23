import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

/** Full-screen violet→black gradient with a faint neon grid. Purely decorative. */
export function NeonBackground() {
  const { width, height } = useWindowDimensions();
  const step = 32;
  const cols = Math.ceil(width / step) + 1;
  const rows = Math.ceil(height / step) + 1;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[colors.bgTop, colors.bg, colors.bgBottom]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      {Array.from({ length: cols }).map((_, i) => (
        <View key={'v' + i} style={[styles.vLine, { left: i * step }]} />
      ))}
      {Array.from({ length: rows }).map((_, i) => (
        <View key={'h' + i} style={[styles.hLine, { top: i * step }]} />
      ))}
      {/* magenta haze top-right */}
      <LinearGradient
        colors={['rgba(255,43,214,0.18)', 'rgba(255,43,214,0)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.3, y: 0.4 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

/** HUD corner brackets drawn over a panel. */
export function Corners({ color = colors.accent, size = 10, thickness = 2 }: { color?: string; size?: number; thickness?: number }) {
  const base = { position: 'absolute' as const, width: size, height: size, borderColor: color };
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[base, { top: -1, left: -1, borderTopWidth: thickness, borderLeftWidth: thickness }]} />
      <View style={[base, { top: -1, right: -1, borderTopWidth: thickness, borderRightWidth: thickness }]} />
      <View style={[base, { bottom: -1, left: -1, borderBottomWidth: thickness, borderLeftWidth: thickness }]} />
      <View style={[base, { bottom: -1, right: -1, borderBottomWidth: thickness, borderRightWidth: thickness }]} />
    </View>
  );
}

/**
 * Angular "cut corner" mask: covers the top-right and bottom-left corners
 * with background-coloured triangles (rotated squares). Put inside an overflow:hidden box.
 */
export function CutCorners({ size = 18, color = colors.bg }: { size?: number; color?: string }) {
  const d = size * 1.414;
  const sq: StyleProp<ViewStyle> = { position: 'absolute', width: d, height: d, backgroundColor: color, transform: [{ rotate: '45deg' }] };
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[sq, { top: -d / 2, right: -d / 2 }]} />
      <View style={[sq, { bottom: -d / 2, left: -d / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  vLine: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: colors.grid },
  hLine: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.grid },
});
