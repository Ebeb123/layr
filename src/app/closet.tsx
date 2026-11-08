import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TagPicker } from '@/components/TagPicker';
import { getItems } from '@/db/items';
import { colors, text } from '@/theme';
import { useLists } from '@/lib/lists';
import { WEATHERS, type Item, type Occasion, type Weather } from '@/types';

// Closet: one band per category. Each band is a row you scroll sideways. Tap an item to edit it.
export default function ClosetScreen() {
  const db = useSQLiteContext();
  const [items, setItems] = useState<Item[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [weathers, setWeathers] = useState<Weather[]>([]);
  const { categories, occasions: occasionList } = useLists();

  // Reload items every time this tab is shown (e.g. after adding or editing).
  useFocusEffect(
    useCallback(() => {
      getItems(db).then(setItems);
    }, [db])
  );

  // An empty filter means "show all". Otherwise the item must match at least one chosen tag.
  const visible = items.filter(
    (item) =>
      (occasions.length === 0 || item.occasions.some((o) => occasions.includes(o))) &&
      (weathers.length === 0 || item.weathers.some((w) => weathers.includes(w)))
  );

  // One section per category that has items.
  const sections = categories
    .map((c) => ({ category: c.key, title: c.label, items: visible.filter((it) => it.category === c.key) }))
    .filter((s) => s.items.length > 0);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.filters}>
          <TagPicker label="Occasion" options={occasionList.map((o) => o.key)} selected={occasions} onChange={setOccasions} multi />
          <TagPicker label="Weather" options={WEATHERS} selected={weathers} onChange={setWeathers} multi />
        </View>

        {sections.length === 0 && (
          <Text style={[text.caption, styles.empty]}>
            {items.length === 0 ? 'Your closet is empty. Tap "Add item" to start.' : 'No items match these filters.'}
          </Text>
        )}

        {sections.map((section, i) => (
          <View key={section.category} style={[styles.band, i % 2 === 0 && styles.shaded]}>
            <Text style={text.label}>
              {section.items.length} {section.items.length === 1 ? 'item' : 'items'}
            </Text>
            <Text style={text.title}>{section.title}</Text>

            {/* Sideways row of this category's clothes */}
            <FlatList
              horizontal
              data={section.items}
              keyExtractor={(it) => String(it.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.row}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.tile}
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                >
                  <Image source={{ uri: item.imageUri }} style={styles.image} resizeMode="contain" />
                </Pressable>
              )}
            />
          </View>
        ))}
      </ScrollView>

      {/* Floating button */}
      <Pressable style={styles.addButton} onPress={() => router.navigate('/add')}>
        <Text style={styles.addText}>＋ Add item</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { paddingBottom: 100 }, // room for the floating button
  filters: { paddingTop: 12, paddingBottom: 16, paddingHorizontal: 14 },
  empty: { marginTop: 60 },
  band: { paddingTop: 18, paddingBottom: 20, backgroundColor: colors.bg },
  shaded: { backgroundColor: colors.band },
  row: { paddingHorizontal: 16, gap: 8, marginTop: 14 },
  // No card: the cut-out sits directly on the band, side by side
  tile: { width: 110, height: 130 },
  image: { width: '100%', height: '100%' },
  addButton: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: colors.ink,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 4, // Android shadow
  },
  addText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
