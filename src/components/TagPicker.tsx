import { StyleSheet, Text, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { text } from '@/theme';

type Props<T extends string> = {
  label?: string;
  options: readonly T[];
  selected: T[];
  onChange: (next: T[]) => void;
  multi?: boolean; // true = pick many, false = pick one
};

// A centered, wrapping group of pill chips. Used for occasion, weather and the closet filters.
export function TagPicker<T extends string>({ label, options, selected, onChange, multi }: Props<T>) {
  const toggle = (option: T) => {
    const isOn = selected.includes(option);
    if (multi) onChange(isOn ? selected.filter((s) => s !== option) : [...selected, option]);
    else onChange(isOn ? [] : [option]);
  };

  return (
    <View style={styles.block}>
      {label ? <Text style={text.label}>{label}</Text> : null}
      <View style={styles.row}>
        {options.map((option) => (
          <Chip key={option} label={option} on={selected.includes(option)} onPress={() => toggle(option)} small />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 10, paddingHorizontal: 16 },
});
