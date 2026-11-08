import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LookStrip } from '@/components/LookStrip';
import { Segmented } from '@/components/Segmented';
import { getItems, setItemFavorite } from '@/db/items';
import { deleteOutfit, getOutfits } from '@/db/outfits';
import { useLists } from '@/lib/lists';
import { colors, text } from '@/theme';
import type { Item, Outfit } from '@/types';

const TABS = ['clothes', 'looks'] as const;
type Tab = (typeof TABS)[number];

// Favorites: hearted clothes (by type) and saved looks (custom outfits you built with +).
export default function FavoritesScreen() {
  const db = useSQLiteContext();
  const { categories } = useLists();
  const [tab, setTab] = useState<Tab>('clothes');
  const [items, setItems] = useState<Item[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);

  const load = useCallback(() => {
    getItems(db).then(setItems);
    getOutfits(db).then(setOutfits);
  }, [db]);
  useFocusEffect(load);

  const favorites = items.filter((it) => it.favorite);
  const itemsById = new Map(items.map((it) => [it.id, it]));

  async function unfavorite(item: Item) {
    await setItemFavorite(db, item.id, false);
    load();
  }

  function confirmDeleteLook(outfit: Outfit) {
    Alert.alert('Delete this look?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteOutfit(db, outfit.id).then(load) },
    ]);
  }

  const header = (
    <View style={styles.header}>
      <Segmented
        options={[
          { value: 'clothes', label: 'Clothes' },
          { value: 'looks', label: 'Looks' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <Text style={[text.caption, styles.count]}>
        {tab === 'clothes'
          ? `${favorites.length} favorite ${favorites.length === 1 ? 'piece' : 'pieces'} · tap ♥ to remove`
          : `${outfits.length} ${outfits.length === 1 ? 'look' : 'looks'} · tap to open · long-press to delete`}
      </Text>
    </View>
  );

  // ---- Clothes tab: one sideways row per category, like the closet ----
  if (tab === 'clothes') {
    const sections = categories
      .map((c) => ({ key: c.key, title: c.label, items: favorites.filter((it) => it.category === c.key) }))
      .filter((s) => s.items.length > 0);
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
        {header}
        {sections.length === 0 && (
          <Text style={[text.caption, styles.empty]}>Tap ♡ on the middle item of a row on the Dressup screen to save it here.</Text>
        )}
        {sections.map((section, i) => (
          <View key={section.key} style={[styles.band, i % 2 === 0 && styles.shaded]}>
            <Text style={text.label}>{section.items.length} favorite</Text>
            <Text style={text.title}>{section.title}</Text>
            <FlatList
              horizontal
              data={section.items}
              keyExtractor={(it) => String(it.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.row}
              renderItem={({ item }) => (
                <Pressable onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}>
                  <Image source={{ uri: item.imageUri }} style={styles.tile} resizeMode="contain" />
                  <Pressable style={styles.heart} hitSlop={10} onPress={() => unfavorite(item)}>
                    <Ionicons name="heart" size={16} color={colors.ink} />
                  </Pressable>
                </Pressable>
              )}
            />
          </View>
        ))}
      </ScrollView>
    );
  }

  // ---- Looks tab: saved outfits ----
  return (
    <FlatList
      style={styles.screen}
      data={outfits}
      keyExtractor={(o) => String(o.id)}
      contentContainerStyle={styles.container}
      ListHeaderComponent={header}
      ListEmptyComponent={<Text style={[text.caption, styles.empty]}>Tap + on the Dressup screen to build and save a look.</Text>}
      renderItem={({ item: outfit, index }) => (
        <Pressable
          onPress={() => router.push({ pathname: '/look/[id]', params: { id: outfit.id } })}
          onLongPress={() => confirmDeleteLook(outfit)}
        >
          {/* All the pieces you picked for this look, side by side */}
          <LookStrip
            label={outfit.name}
            items={outfit.itemIds.map((id) => itemsById.get(id)).filter((it): it is Item => !!it)}
            size={72}
            shaded={index % 2 === 0}
          />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  container: { paddingBottom: 40 },
  header: { paddingTop: 12, paddingBottom: 14 },
  count: { marginTop: 10 },
  empty: { marginTop: 40, paddingHorizontal: 32 },
  band: { paddingTop: 18, paddingBottom: 20, backgroundColor: colors.bg },
  shaded: { backgroundColor: colors.band },
  row: { paddingHorizontal: 16, gap: 8, marginTop: 14 },
  tile: { width: 110, height: 130 },
  heart: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
