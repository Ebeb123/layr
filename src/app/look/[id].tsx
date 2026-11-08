import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PillButton } from '@/components/Buttons';
import { getItems } from '@/db/items';
import { deleteOutfit, getOutfit } from '@/db/outfits';
import { useLists } from '@/lib/lists';
import { colors, text } from '@/theme';
import type { Item, Outfit } from '@/types';

// One saved look: only the pieces you picked, shown together like an outfit laid out on a bed.
export default function LookScreen() {
  const db = useSQLiteContext();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const { categories } = useLists();
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [parts, setParts] = useState<Item[]>([]);

  useEffect(() => {
    (async () => {
      const found = await getOutfit(db, id);
      if (!found) return;
      const all = await getItems(db);
      // Keep only this look's pieces, ordered top -> bottom -> shoes -> extras.
      const order = (it: Item) => categories.findIndex((c) => c.key === it.category);
      setParts(all.filter((it) => found.itemIds.includes(it.id)).sort((a, b) => order(a) - order(b)));
      setOutfit(found);
    })();
  }, [db, id, categories]);

  if (!outfit) return <Text style={[text.caption, styles.loading]}>Loading…</Text>;

  // Height of each piece: use its row height on the Dressup screen, made bigger.
  const heightOf = (it: Item) => (categories.find((c) => c.key === it.category)?.height ?? 90) * 1.5;

  function confirmDelete() {
    Alert.alert('Delete this look?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteOutfit(db, id).then(() => router.back()) },
    ]);
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: outfit.name }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[text.label, styles.count]}>
          {parts.length} {parts.length === 1 ? 'piece' : 'pieces'}
        </Text>
        {/* The look, stacked like it would be worn */}
        <View style={styles.stack}>
          {parts.map((it) => (
            <Image key={it.id} source={{ uri: it.imageUri }} style={[styles.piece, { height: heightOf(it) }]} resizeMode="contain" />
          ))}
        </View>
        {parts.length < outfit.itemIds.length && (
          <Text style={text.caption}>Some pieces were deleted from your closet.</Text>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <PillButton title="Wear on Dressup" onPress={() => router.navigate({ pathname: '/', params: { outfitId: id } })} />
        <PillButton title="Delete look" onPress={confirmDelete} variant="danger" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.band },
  container: { paddingVertical: 16, alignItems: 'center' },
  loading: { padding: 24 },
  count: { marginBottom: 8 },
  stack: { width: '100%', alignItems: 'center', gap: 4 },
  piece: { width: '60%' },
  footer: { backgroundColor: colors.bg, paddingBottom: 16 },
});
