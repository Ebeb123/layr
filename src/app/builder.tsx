import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { PillButton } from '@/components/Buttons';
import { LookStrip } from '@/components/LookStrip';
import { defaultSelection, OutfitRows } from '@/components/OutfitRows';
import { getItems } from '@/db/items';
import { addOutfit, getOutfits } from '@/db/outfits';
import { useLists } from '@/lib/lists';
import type { Slots } from '@/lib/suggest';
import { colors } from '@/theme';
import type { Item } from '@/types';

// "Create outfit" (the + button): build a look from clothes you own, then save it.
// The strip at the top always shows exactly what you've picked, together.
export default function BuilderScreen() {
  const db = useSQLiteContext();
  const { categories } = useLists();
  const [items, setItems] = useState<Item[]>([]);
  const [selection, setSelection] = useState<Slots>({});

  useFocusEffect(
    useCallback(() => {
      getItems(db).then((all) => {
        setItems(all);
        setSelection((s) => (Object.keys(s).length ? s : defaultSelection(all, categories)));
      });
    }, [db, categories])
  );

  // The picked pieces, in row order (tops first).
  const picked = categories
    .map((c) => items.find((it) => it.id === selection[c.key]))
    .filter((it): it is Item => !!it);

  async function save() {
    if (picked.length === 0) return Alert.alert('Pick at least one item.');
    const count = (await getOutfits(db)).filter((o) => o.kind === 'custom').length;
    await addOutfit(db, {
      name: `Custom look ${count + 1}`,
      kind: 'custom',
      itemIds: picked.map((it) => it.id),
      occasion: null,
      weather: null,
    });
    Alert.alert('Saved', 'You can find it in Favorites → Looks.');
    router.back();
  }

  return (
    <View style={styles.screen}>
      {/* stickyHeaderIndices keeps "Your look" pinned at the top while you scroll the rows */}
      <ScrollView stickyHeaderIndices={[0]} contentContainerStyle={styles.container}>
        <View style={styles.sticky}>
          <LookStrip items={picked} label={`Your look · ${picked.length} pieces`} size={52} />
        </View>
        <OutfitRows items={items} selection={selection} onChange={setSelection} />
      </ScrollView>
      <View style={styles.footer}>
        <PillButton title="Save look" onPress={save} disabled={picked.length === 0} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { paddingBottom: 16 },
  sticky: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.line, backgroundColor: colors.bg },
  footer: { paddingBottom: 16, backgroundColor: colors.bg },
});
