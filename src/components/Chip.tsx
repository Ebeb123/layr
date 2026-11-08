import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '@/theme';

type Props = { label: string; on: boolean; onPress: () => void; small?: boolean };

// A pill-shaped choice: black with white text when selected, soft grey when not.
export function Chip({ label, on, onPress, small }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        small && styles.small,
        on && styles.on,
        pressed && { transform: [{ scale: 0.96 }] }, // tiny "press" feedback
      ]}
    >
      <Text style={[styles.text, small && styles.smallText, on && styles.textOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.band },
  small: { paddingHorizontal: 13, paddingVertical: 7 },
  on: { backgroundColor: colors.ink },
  text: { fontSize: 14.5, fontWeight: '600', color: colors.ink, textTransform: 'capitalize' },
  smallText: { fontSize: 13.5 },
  textOn: { color: '#fff' },
});
