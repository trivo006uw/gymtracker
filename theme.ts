import { Platform, TextStyle, ViewStyle } from 'react-native';
import { DarkTheme, Theme } from '@react-navigation/native';

/**
 * GymTracker design system — "Neon Grid" (cyberpunk)
 * Near-black indigo base, neon cyan primary, hot magenta secondary,
 * acid-yellow highlight. HUD labels in monospace, display type in Orbitron.
 * Token names are kept from the previous theme so every screen keeps compiling.
 */
export const colors = {
  bg: '#07060F',          // app background (near-black indigo)
  bgTop: '#120A2A',       // gradient top (deep violet)
  bgBottom: '#03030A',    // gradient bottom
  surface: '#0F0D24',     // cards / HUD panels
  surfaceAlt: '#17143A',  // inputs, pressed states
  border: '#2A2560',      // dim panel outlines
  grid: 'rgba(0, 240, 255, 0.06)', // background grid lines
  text: '#EAF6FF',        // primary text (cool white)
  textMuted: '#8F9BC4',   // secondary text
  textFaint: '#4D5480',   // decorative / disabled
  placeholder: '#7681AE', // input placeholders
  accent: '#00F0FF',      // neon cyan — primary actions, glow
  accentPressed: '#00C2D1',
  accentSoft: 'rgba(0, 240, 255, 0.12)',
  magenta: '#FF2BD6',     // hot magenta — secondary accent
  magentaSoft: 'rgba(255, 43, 214, 0.14)',
  yellow: '#F5FF3B',      // acid yellow — highlights / numbers
  yellowSoft: 'rgba(245, 255, 59, 0.12)',
  onAccent: '#05040C',    // text/icons on neon fills
  success: '#39FF88',
  warning: '#FFB547',
  danger: '#FF3B6B',
} as const;

export const spacing = {
  xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 48,
} as const;

/** Sharper corners for the HUD look. */
export const radius = {
  sm: 2, md: 4, lg: 6, xl: 8, pill: 999,
} as const;

/** Minimum tap target (Apple HIG 44pt / Material 48dp). */
export const hitTarget = 48;

/** Font family names registered in App.tsx via expo-font. Web gets CSS fallbacks. */
const withFallback = (name: string, fallback: string) =>
  Platform.OS === 'web' ? `${name}, ${fallback}` : name;
const SANS = '"Segoe UI", Roboto, -apple-system, sans-serif';
const MONO = 'ui-monospace, Menlo, Consolas, monospace';

export const fonts = {
  display: withFallback('Orbitron_800ExtraBold', SANS),
  displayMedium: withFallback('Orbitron_600SemiBold', SANS),
  body: withFallback('Rajdhani_500Medium', SANS),
  bodySemi: withFallback('Rajdhani_600SemiBold', SANS),
  bodyBold: withFallback('Rajdhani_700Bold', SANS),
  mono: withFallback('JetBrainsMono_400Regular', MONO),
  monoBold: withFallback('JetBrainsMono_700Bold', MONO),
};

/** Font files to load (used by App.tsx). */
export { Orbitron_600SemiBold, Orbitron_800ExtraBold } from '@expo-google-fonts/orbitron';
export { Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
export { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';

/** Neon text glow (works on native and web). */
export const textGlow = (color: string = colors.accent, r = 10): TextStyle => ({
  textShadowColor: color,
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: r,
});

/** Neon box glow. `boxShadow` is supported by RN 0.76+ (new arch) and react-native-web. */
export const glow = (color: string = colors.accent, r = 16, alpha = 0.55): ViewStyle => {
  const hex = color.replace('#', '');
  const [rr, gg, bb] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
  return {
    boxShadow: `0 0 ${r}px rgba(${rr}, ${gg}, ${bb}, ${alpha})`,
    // older native fallbacks
    shadowColor: color,
    shadowOpacity: alpha,
    shadowRadius: r / 2,
    shadowOffset: { width: 0, height: 0 },
    elevation: Platform.OS === 'android' ? 0 : undefined,
  } as ViewStyle;
};

export const typography: Record<
  'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'label' | 'caption' | 'stat' | 'mono' | 'hud',
  TextStyle
> = {
  display: { fontFamily: fonts.display, fontSize: 30, lineHeight: 38, letterSpacing: 1.5, color: colors.text, textTransform: 'uppercase' },
  title: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26, letterSpacing: 1, color: colors.text, textTransform: 'uppercase' },
  heading: { fontFamily: fonts.bodyBold, fontSize: 19, lineHeight: 23, letterSpacing: 0.3, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 17, lineHeight: 22, color: colors.text },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 17, lineHeight: 22, color: colors.text },
  label: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 14, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.textMuted },
  caption: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 17, color: colors.textMuted },
  stat: { fontFamily: fonts.monoBold, fontSize: 28, lineHeight: 32, color: colors.text },
  mono: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 18, color: colors.text },
  hud: { fontFamily: fonts.monoBold, fontSize: 11, lineHeight: 14, letterSpacing: 2, textTransform: 'uppercase', color: colors.accent },
};

/** Shared HUD panel look. */
export const card = {
  backgroundColor: colors.surface,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.border,
} as const;

/** Shared text-input look. */
export const input = {
  backgroundColor: colors.surfaceAlt,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: colors.border,
  color: colors.text,
  fontSize: 17,
  fontFamily: fonts.bodySemi,
  paddingHorizontal: spacing.md,
  minHeight: hitTarget,
} as const;

/** React Navigation theme so headers, backgrounds and back buttons match. */
export const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    notification: colors.magenta,
  },
};

/** Default stack header options (HUD style). */
export const headerOptions = {
  headerStyle: { backgroundColor: colors.bgTop }, // matches top of NeonBackground gradient
  headerTintColor: colors.accent,
  headerTitleStyle: { fontFamily: fonts.displayMedium, fontSize: 15, color: colors.text },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};
