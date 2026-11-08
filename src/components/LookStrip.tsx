import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, text } from '@/theme';
import type { Item } from '@/types';

type Props = { items: Item[]; label?: string; size?: number; shaded?: boolean };

// The pieces of one look shown together, side by side (no category rows).
export function LookStrip({ items, label, size = 64, shaded }: Props) {
  return (
    <View style={[styles.band, shaded && styles.shaded]}>
      {label ? <Text style={text.label}>{label}</Text> : null}
      {items.length === 0 ? (
        <Text style={[text.caption, styles.empty]}>Nothing picked yet</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {items.map((it) => (
            <Image key={it.id} source={{ uri: it.imageUri }} style={{ width: size, height: size * 1.15 }} resizeMode="contain" />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  band: { paddingVertical: 12, backgroundColor: colors.bg },
  shaded: { backgroundColor: colors.band },
  row: { flexGrow: 1, justifyContent: 'center', gap: 6, paddingHorizontal: 16, marginTop: 8 },
  empty: { marginTop: 8 },
});
