import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { type ComponentProps, useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Band } from '@/components/Band';
import { addCategory, addOccasion, countItemsInCategory, deleteCategory, deleteOccasion, toKey } from '@/db/lists';
import { getAiRemaining } from '@/db/usage';
import { DAILY_AI_LIMIT } from '@/lib/gemini';
import { useLists } from '@/lib/lists';
import { colors, radius, text } from '@/theme';

// Settings (the ⋮ button): profile, closet, your own categories and occasions, AI usage.
export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { categories, occasions, reload } = useLists();
  const [aiLeft, setAiLeft] = useState(DAILY_AI_LIMIT);

  useFocusEffect(
    useCallback(() => {
      getAiRemaining(db).then(setAiLeft);
    }, [db])
  );

  // ---- Categories ----
  async function onAddCategory(label: string) {
    if (categories.some((c) => c.key === toKey(label))) return Alert.alert('That category already exists.');
    await addCategory(db, label);
    await reload();
  }
  async function onDeleteCategory(key: string, label: string) {
    const used = await countItemsInCategory(db, key);
    if (used > 0) {
      return Alert.alert(`${label} still has ${used} item${used === 1 ? '' : 's'}`, 'Move or delete those clothes first.');
    }
    Alert.alert(`Delete ${label}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(db, key).then(reload) },
    ]);
  }

  // ---- Occasions ----
  async function onAddOccasion(label: string) {
    if (occasions.some((o) => o.key === toKey(label))) return Alert.alert('That occasion already exists.');
    await addOccasion(db, label);
    await reload();
  }
  function onDeleteOccasion(key: string, label: string) {
    Alert.alert(`Delete ${label}?`, 'Clothes tagged with it keep their other tags.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteOccasion(db, key).then(reload) },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Band label="Settings" title="Make it yours" shaded />

      <Band label="You">
        <View style={styles.group}>
        <Row icon="person-outline" title="Profile" subtitle="Height and skin tone" onPress={() => router.push('/profile')} />
        <Row icon="shirt-outline" title="My closet" subtitle="All your clothes by type" onPress={() => router.push('/closet')} />
        <Row icon="heart-outline" title="Favorites" subtitle="Hearted clothes and saved looks" onPress={() => router.push('/favorites')} last />
        </View>
      </Band>

      <Band label="Categories" title={`${categories.length} types`} shaded>
        <ListEditor
          words={categories.map((c) => ({ key: c.key, label: c.label, locked: c.builtIn }))}
          placeholder="New category, e.g. Hats"
          onAdd={onAddCategory}
          onDelete={onDeleteCategory}
        />
        <Text style={[text.caption, styles.note]}>Each category becomes its own row on the Dressup screen.</Text>
      </Band>

      <Band label="Occasions" title={`${occasions.length} occasions`}>
        <ListEditor
          words={occasions.map((o) => ({ key: o.key, label: o.label, locked: o.builtIn }))}
          placeholder="New occasion, e.g. Party"
          onAdd={onAddOccasion}
          onDelete={onDeleteOccasion}
        />
      </Band>

      <Band label="AI picks" title={`${aiLeft} of ${DAILY_AI_LIMIT} left`} shaded>
        <Text style={text.caption}>Resets every midnight. Shuffle uses offline color rules when it runs out.</Text>
      </Band>
    </ScrollView>
  );
}

// One tappable settings row: icon, title, subtitle, chevron.
function Row(p: { icon: ComponentProps<typeof Ionicons>['name']; title: string; subtitle: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable onPress={p.onPress} style={({ pressed }) => [styles.row, p.last && styles.rowLast, pressed && { opacity: 0.5 }]}>
      <View style={styles.iconBox}>
        <Ionicons name={p.icon} size={19} color={colors.ink} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{p.title}</Text>
        <Text style={styles.rowSub}>{p.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.faint} />
    </Pressable>
  );
}

// Centered words with a small × on the ones you added, plus a field to add a new one.
function ListEditor(p: {
  words: { key: string; label: string; locked: boolean }[];
  placeholder: string;
  onAdd: (label: string) => Promise<unknown> | void;
  onDelete: (key: string, label: string) => void;
}) {
  const [value, setValue] = useState('');
  const submit = async () => {
    if (!value.trim()) return;
    await p.onAdd(value);
    setValue('');
  };
  return (
    <View>
      <View style={styles.words}>
        {p.words.map((w) => (
          <View key={w.key} style={styles.word}>
            <Text style={styles.wordText}>{w.label}</Text>
            {!w.locked && (
              <Pressable onPress={() => p.onDelete(w.key, w.label)} hitSlop={10}>
                <Ionicons name="close" size={14} color={colors.muted} />
              </Pressable>
            )}
          </View>
        ))}
      </View>
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          placeholder={p.placeholder}
          placeholderTextColor={colors.faint}
          maxLength={20}
          onSubmitEditing={submit}
          returnKeyType="done"
        />
        <Pressable onPress={submit} hitSlop={10} disabled={!value.trim()}>
          <Ionicons name="add-circle" size={30} color={value.trim() ? colors.ink : colors.faint} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  container: { paddingBottom: 40 },
  group: { marginHorizontal: 16, backgroundColor: colors.band, borderRadius: radius.md, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  rowLast: { borderBottomWidth: 0 },
  iconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, color: colors.ink, fontWeight: '600' },
  rowSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  words: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 18, paddingHorizontal: 20 },
  word: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  wordText: { fontSize: 18, color: colors.ink, fontWeight: '500' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, paddingHorizontal: 32 },
  input: {
    flex: 1,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.line,
  },
  note: { marginTop: 12, paddingHorizontal: 24 },
});
