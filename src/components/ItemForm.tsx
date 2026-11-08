import { useSQLiteContext } from 'expo-sqlite';
import { type ReactNode, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { getUsedSubtypes } from '@/db/items';
import { colorName } from '@/lib/colorRules';
import { useLists } from '@/lib/lists';
import { colors, text } from '@/theme';
import { SUBTYPES, WEATHERS, type Category, type Occasion, type Weather } from '@/types';

// Quick-pick colors (used to fix the auto-detected color).
const PRESETS = ['#000000', '#ffffff', '#808080', '#1f2a44', '#8b5a2b', '#d2b48c', '#c0392b', '#2e86de', '#27ae60', '#f1c40f', '#e91e63', '#8e44ad'];

type Props = {
  category: Category;
  setCategory: (c: Category) => void;
  subtype: string | null;
  setSubtype: (s: string | null) => void;
  occasions: Occasion[];
  setOccasions: (o: Occasion[]) => void;
  weathers: Weather[];
  setWeathers: (w: Weather[]) => void;
  color: string;
  setColor: (hex: string) => void;
};

// Compact tag form shared by "Add clothes" and "Edit item":
// one line per question (label on the left, choices scroll sideways on the right).
export function ItemForm(p: Props) {
  const { categories, occasions } = useLists(); // your lists from Settings
  const db = useSQLiteContext();
  const toggle = <T extends string>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  // Style choices: ready-made ones + ones you typed before for this type + the current one.
  const [used, setUsed] = useState<string[]>([]);
  const [typing, setTyping] = useState(false); // "Other" text box open?
  const [draft, setDraft] = useState('');
  useEffect(() => {
    getUsedSubtypes(db, p.category).then(setUsed);
  }, [db, p.category]);
  const styleChoices = [...new Set([...(SUBTYPES[p.category] ?? []), ...used, ...(p.subtype ? [p.subtype] : [])])];

  function saveDraft() {
    const value = draft.trim();
    if (value) p.setSubtype(value.charAt(0).toUpperCase() + value.slice(1));
    setDraft('');
    setTyping(false);
  }

  return (
    <View style={styles.form}>
      <FormRow label="Type">
        {categories.map((c) => (
          <Chip
            small
            key={c.key}
            label={c.label}
            on={p.category === c.key}
            onPress={() => {
              if (c.key === p.category) return;
              p.setCategory(c.key);
              p.setSubtype(null); // styles belong to a type, so start fresh
            }}
          />
        ))}
      </FormRow>

      {/* Style within the type, e.g. Shirt / Polo for Tops. Shown under the row name on Dressup. */}
      <FormRow label="Style">
        {styleChoices.map((name) => (
          <Chip small key={name} label={name} on={p.subtype === name} onPress={() => p.setSubtype(p.subtype === name ? null : name)} />
        ))}
        {typing ? (
          <TextInput
            autoFocus
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={saveDraft}
            onBlur={saveDraft}
            placeholder="Type a style"
            placeholderTextColor={colors.faint}
            maxLength={20}
            returnKeyType="done"
          />
        ) : (
          <Chip small label="＋ Other" on={false} onPress={() => setTyping(true)} />
        )}
      </FormRow>

      <FormRow label="Occasion">
        {occasions.map((o) => (
          <Chip
            small
            key={o.key}
            label={o.label}
            on={p.occasions.includes(o.key)}
            onPress={() => p.setOccasions(toggle(p.occasions, o.key))}
          />
        ))}
      </FormRow>

      <FormRow label="Weather">
        {WEATHERS.map((w) => (
          <Chip small key={w} label={w} on={p.weathers.includes(w)} onPress={() => p.setWeathers(toggle(p.weathers, w))} />
        ))}
      </FormRow>

      <FormRow label="Color">
        <Text style={styles.colorName}>{colorName(p.color)}</Text>
        {/* The detected color first, then presets to fix it */}
        {[p.color, ...PRESETS.filter((h) => h.toLowerCase() !== p.color.toLowerCase())].map((hex, i) => {
          const on = hex.toLowerCase() === p.color.toLowerCase();
          return (
            <Pressable key={`${hex}-${i}`} onPress={() => p.setColor(hex)} hitSlop={4} style={[styles.ring, on && styles.ringOn]}>
              <View style={[styles.swatch, { backgroundColor: hex }]} />
            </Pressable>
          );
        })}
      </FormRow>
    </View>
  );
}

// One line: small caps label + sideways-scrolling choices.
function FormRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={[text.label, styles.rowLabel]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    paddingLeft: 20,
  },
  rowLabel: { width: 78, textAlign: 'left' },
  choices: { alignItems: 'center', gap: 8, paddingRight: 20, paddingVertical: 10 },
  colorName: { fontSize: 15, fontWeight: '700', color: colors.ink, marginRight: 2 },
  input: {
    minWidth: 120,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.ink,
    fontSize: 13.5,
    color: colors.ink,
  },
  ring: { padding: 2, borderRadius: 16, borderWidth: 1.5, borderColor: 'transparent', marginHorizontal: -4 },
  ringOn: { borderColor: colors.ink },
  swatch: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: colors.line },
});
