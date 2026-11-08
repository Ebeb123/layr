import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow } from '@/theme';

type Props<T extends string> = { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void };

// iOS-style segmented switch: a grey pill with the selected part raised in white.
export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.track}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.segment, on && styles.on]}>
            <Text style={[styles.text, on && styles.textOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: colors.band,
    borderRadius: radius.pill,
    padding: 4,
    marginHorizontal: 24,
  },
  segment: { paddingVertical: 9, paddingHorizontal: 26, borderRadius: radius.pill },
  on: { backgroundColor: colors.bg, ...shadow },
  text: { fontSize: 14, fontWeight: '600', color: colors.muted },
  textOn: { color: colors.ink },
});
