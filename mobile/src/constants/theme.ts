import { StyleSheet } from 'react-native';

// iOS system greys with a light green brand colour (light appearance). Secondary text is darkened slightly from Apple's
// translucent secondaryLabel so it keeps 4.5:1 contrast on white and grouped backgrounds.
export const colors = {
  bg: '#F4F5F2', // grouped background, faintly warm
  surface: '#FFFFFF', // secondarySystemGroupedBackground
  ink: '#1C1C1E', // label
  inkSoft: '#3A3A3C',
  muted: '#6C6C70', // secondaryLabel
  faint: '#AEAEB2', // tertiaryLabel, decorative only
  line: '#C6C6C8', // separator
  border: '#D1D1D6',
  field: '#E3E3E8', // tertiarySystemFill on grouped background
  // Brand green. `primaryFill` is the light green behind buttons and selected states, with `onPrimary` text on it.
  // `primary` is a deeper green for links, icons and text on white, kept readable at 4.5:1.
  primary: '#3B7D23',
  primaryFill: '#A6E57E',
  onPrimary: '#16330B',
  primarySoft: '#EEF7E7',
  primaryInk: '#2B5E17',
  accent: '#C93400', // systemOrange, darkened for white text
  accentChart: '#C9A15A', // muted gold for 'donated' series
  okBg: '#E4F6E9',
  okInk: '#1C7A36',
  warnBg: '#FFEDE3',
  warnInk: '#B33A00',
  danger: '#D70015',
  noticeBg: '#FFF4E0',
  noticeInk: '#7A4A00',
  track: '#E5E5EA',
  dark: '#1C1C1E',
  camera: '#000000',
};

// Apple's Dynamic Type sizes at the default "Large" setting. System font = SF Pro on iOS, Roboto on Android.
export const type = StyleSheet.create({
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: 0.37, color: colors.ink },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '700', color: colors.ink },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: colors.ink },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600', color: colors.ink },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', color: colors.ink },
  body: { fontSize: 17, lineHeight: 22, color: colors.ink },
  callout: { fontSize: 16, lineHeight: 21, color: colors.ink },
  subhead: { fontSize: 15, lineHeight: 20, color: colors.ink },
  footnote: { fontSize: 13, lineHeight: 18, color: colors.muted },
  caption: { fontSize: 12, lineHeight: 16, color: colors.muted },
});

// 4-pt grid. `gutter` is the iOS standard content inset.
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, gutter: 16 };
export const radius = { sm: 6, md: 10, lg: 14, xl: 18, xxl: 22 };
export const hairline = StyleSheet.hairlineWidth;
