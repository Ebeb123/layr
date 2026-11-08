import { StyleSheet } from 'react-native';

// One place for the app's look: clean white / light-grey surfaces, black text, no bright accent.
export const colors = {
  ink: '#0f0f10', // main text, selected things, dark buttons
  muted: '#86868b', // small labels, captions
  faint: '#c7c7cc', // unselected things, icons at rest
  band: '#f4f4f6', // grey band / chip background
  bg: '#ffffff', // white band / screen background
  line: '#ebebef', // hairline dividers
  danger: '#e5484d',
};

// Rounded corners used everywhere, so every card and chip feels like one family.
export const radius = { sm: 12, md: 18, lg: 26, pill: 999 };

// Soft floating shadow (cards, floating buttons, the selected segment).
export const shadow = {
  elevation: 3, // Android
  shadowColor: '#000', // iOS
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
};

export const text = StyleSheet.create({
  // Small caps label above every section, e.g. "TOPS"
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.4,
    color: colors.muted,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  // Big centered title, bold with tight letter spacing (the "modern" look)
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.6, color: colors.ink, textAlign: 'center', marginTop: 2 },
  caption: { fontSize: 12.5, color: colors.muted, textAlign: 'center', lineHeight: 17 },
});

// Header style shared by all screens: centered bold title, no shadow line.
export const headerOptions = {
  headerTitleAlign: 'center' as const,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.bg },
  headerTitleStyle: { fontWeight: '700' as const, fontSize: 18, color: colors.ink },
  headerTintColor: colors.ink,
};
