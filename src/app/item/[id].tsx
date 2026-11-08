import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PillButton } from '@/components/Buttons';
import { ItemForm } from '@/components/ItemForm';
import { deleteItem, getItem, setItemsWorn, updateItem } from '@/db/items';
import { deleteItemImage } from '@/lib/images';
import { isWornThisWeek } from '@/lib/worn';
import { colors, radius, shadow, text } from '@/theme';
import type { Category, Item, Occasion, Weather } from '@/types';

// Edit screen for one item, opened from the closet (route: /item/123).
export default function EditItemScreen() {
  const db = useSQLiteContext();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const [item, setItem] = useState<Item | null>(null);
  const [category, setCategory] = useState<Category>('top');
  const [subtype, setSubtype] = useState<string | null>(null);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [weathers, setWeathers] = useState<Weather[]>([]);
  const [color, setColor] = useState('#808080');

  // Load the item once and copy its values into the form.
  useEffect(() => {
    getItem(db, id).then((found) => {
      if (!found) return;
      setItem(found);
      setCategory(found.category);
      setSubtype(found.subtype);
      setOccasions(found.occasions);
      setWeathers(found.weathers);
      setColor(found.color);
    });
  }, [db, id]);

  if (!item) return <Text style={[text.caption, styles.loading]}>Loading…</Text>;

  async function save() {
    if (!item) return;
    await updateItem(db, id, { imageUri: item.imageUri, category, subtype, occasions, weathers, color });
    router.back();
  }

  function confirmDelete() {
    Alert.alert('Delete item?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteItem(db, id);
          deleteItemImage(item!.imageUri); // remove the PNG file too
          router.back();
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        {/* Photo */}
        <View style={styles.photoBand}>
          <View style={styles.card}>
            <Image source={{ uri: item.imageUri }} style={styles.image} resizeMode="contain" />
          </View>
          {isWornThisWeek(item) && (
            <View style={styles.wornRow}>
              <Text style={text.caption}>Worn this week · shuffle skips it until Monday</Text>
              <Text
                style={styles.washed}
                onPress={async () => {
                  await setItemsWorn(db, [item.id], null);
                  setItem({ ...item, wornAt: null });
                }}
              >
                Washed
              </Text>
            </View>
          )}
        </View>

        {/* Tags: one line each */}
        <ItemForm
          category={category}
          setCategory={setCategory}
          subtype={subtype}
          setSubtype={setSubtype}
          occasions={occasions}
          setOccasions={setOccasions}
          weathers={weathers}
          setWeathers={setWeathers}
          color={color}
          setColor={setColor}
        />
      </ScrollView>

      {/* Buttons stay at the bottom */}
      <View style={styles.footer}>
        <View style={styles.half}>
          <PillButton title="Delete" onPress={confirmDelete} variant="danger" />
        </View>
        <View style={styles.half}>
          <PillButton title="Save changes" onPress={save} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { flexGrow: 1 }, // lets the photo area stretch to fill the screen
  loading: { padding: 24 },
  photoBand: { flexGrow: 1, backgroundColor: colors.band, padding: 16 },
  card: { flexGrow: 1, minHeight: 220, padding: 16, backgroundColor: colors.bg, borderRadius: radius.lg, ...shadow },
  footer: { flexDirection: 'row', paddingHorizontal: 10, paddingTop: 4, paddingBottom: 16, backgroundColor: colors.bg },
  wornRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 },
  washed: { fontSize: 13, fontWeight: '700', color: colors.ink, textDecorationLine: 'underline' },
  half: { flex: 1, marginHorizontal: -10 }, // PillButton has its own side margin
  // Absolute fill: the photo fits inside the card instead of stretching it
  image: { position: 'absolute', top: 16, bottom: 16, left: 16, right: 16 },
});
