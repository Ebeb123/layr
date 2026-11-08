import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, text } from '@/theme';

type Props = {
  label?: string; // small caps, e.g. "CATEGORY"
  title?: string; // big centered title under it
  shaded?: boolean; // grey background (sections alternate grey / white)
  children?: ReactNode;
};

// A full-width section of a screen, like the rows on the Dressup screen.
export function Band({ label, title, shaded, children }: Props) {
  return (
    <View style={[styles.band, shaded && styles.shaded]}>
      {label ? <Text style={text.label}>{label}</Text> : null}
      {title ? <Text style={text.title}>{title}</Text> : null}
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  band: { paddingTop: 18, paddingBottom: 22, backgroundColor: colors.bg },
  shaded: { backgroundColor: colors.band },
  content: { marginTop: 14 },
});
