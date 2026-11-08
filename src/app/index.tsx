import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CircleButton } from '@/components/Buttons';
import { defaultSelection, OutfitRows } from '@/components/OutfitRows';
import { ShuffleSheet } from '@/components/ShuffleSheet';
import { getItems, setItemFavorite, setItemsWorn } from '@/db/items';
import { getOutfit } from '@/db/outfits';
import { getProfile } from '@/db/profile';
import { getAiRemaining, recordAiRequest } from '@/db/usage';
import { useLists } from '@/lib/lists';
import { isWornThisWeek } from '@/lib/worn';
import { suggestOutfits } from '@/lib/gemini';
import type { Slots } from '@/lib/suggest';
import { colors, shadow, text } from '@/theme';
import type { Item, Occasion, Weather } from '@/types';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The main screen. Swipe each row to dress up. Shuffle = AI picks a look. ♡ on the middle item = favorite.
export default function DressupScreen() {
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ outfitId?: string }>(); // set when opening a saved outfit
  const { categories } = useLists();

  const [items, setItems] = useState<Item[]>([]);
  const [selection, setSelection] = useState<Slots>({});
  const [caption, setCaption] = useState(''); // e.g. "✨ AI pick · 3 left today"
  const [spinning, setSpinning] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [occasion, setOccasion] = useState<Occasion>('casual');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [aiLeft, setAiLeft] = useState(0);
  const started = useRef(false);

  // Reload clothes whenever this screen is shown (e.g. after adding an item).
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const all = await getItems(db);
        setItems(all);
        setAiLeft(await getAiRemaining(db));
        if (!started.current && all.length > 0) {
          started.current = true;
          setSelection(defaultSelection(all, categories));
        }
      })();
    }, [db, categories])
  );

  // Opening a favorite / custom outfit from the Favorites page loads it here.
  useEffect(() => {
    if (!params.outfitId) return;
    getOutfit(db, Number(params.outfitId)).then((outfit) => {
      if (!outfit) return;
      const slots: Slots = {};
      for (const it of items) if (outfit.itemIds.includes(it.id)) slots[it.category] = it.id;
      setSelection(slots);
      setCaption(outfit.kind === 'custom' ? `Custom look · ${outfit.name}` : `♥ ${outfit.name}`);
    });
  }, [db, params.outfitId, items]);

  // ---- Shuffle (AI) ----
  async function shuffle() {
    setSheetOpen(false);
    setSpinning(true); // rows start flicking right away
    setCaption('Picking your look…');
    // Clothes you wore this week are in the laundry: shuffle won't pick them.
    const available = items.filter((it) => !isWornThisWeek(it));
    const skipped = items.length - available.length;
    if (available.length === 0) {
      setSpinning(false);
      setCaption('Everything was worn this week. Swipe to pick manually.');
      return;
    }
    const remaining = await getAiRemaining(db);
    const [result] = await Promise.all([
      suggestOutfits(available, occasion, weather, await getProfile(db), remaining > 0, categories.map((c) => c.key)),
      wait(1200), // let the spin play for at least a moment
    ]);
    // Take one of the suggestions at random so each shuffle feels different.
    const pick = result.suggestions[Math.floor(Math.random() * result.suggestions.length)];
    if (pick) setSelection(pick.slots);
    const skippedNote = skipped > 0 ? ` · skipped ${skipped} worn` : '';
    if (result.source === 'ai') {
      await recordAiRequest(db);
      setAiLeft(remaining - 1);
      setCaption(`✨ AI pick · ${remaining - 1} left today${skippedNote}`);
    } else {
      setCaption(`Offline pick${result.error ? ` · ${result.error}` : ''}${skippedNote}`);
    }
    setSpinning(false); // rows land one after another
  }

  // ---- Wear today: marks the pieces you're showing as worn (shuffle skips them until next Monday) ----
  const shown = Object.values(selection)
    .map((id) => items.find((it) => it.id === id))
    .filter((it): it is Item => !!it);
  const allWorn = shown.length > 0 && shown.every(isWornThisWeek);

  async function toggleWorn() {
    if (shown.length === 0) return;
    const time = allWorn ? null : Date.now(); // tap again = washed / undo
    const ids = shown.map((it) => it.id);
    try {
      await setItemsWorn(db, ids, time);
    } catch {
      setCaption('Could not save. Try again.');
      return;
    }
    setItems((list) => list.map((it) => (ids.includes(it.id) ? { ...it, wornAt: time } : it)));
    setCaption(time ? 'Marked as worn · shuffle skips these until next Monday' : 'Marked as washed · available again');
  }

  // ---- Favorite: the small heart on the middle item of a row ----
  const heartScale = useRef(new Animated.Value(0)).current;

  async function toggleFavorite(item: Item) {
    const next = !item.favorite;
    // Update the screen right away, then save.
    setItems((list) => list.map((it) => (it.id === item.id ? { ...it, favorite: next } : it)));
    try {
      await setItemFavorite(db, item.id, next);
    } catch {
      // Saving failed: undo the change on screen.
      setItems((list) => list.map((it) => (it.id === item.id ? { ...it, favorite: item.favorite } : it)));
      setCaption('Could not save favorite. Try again.');
      return;
    }
    setCaption(next ? '♥ Added to favorite clothes' : 'Removed from favorite clothes');
    if (next) {
      // Heart "pop" in the middle of the screen
      heartScale.setValue(0);
      Animated.sequence([
        Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
        Animated.timing(heartScale, { toValue: 0, duration: 250, delay: 300, useNativeDriver: true }),
      ]).start();
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: 'Dressup',
          headerRight: () => (
            <View style={styles.headerIcons}>
              <Pressable onPress={() => router.push('/favorites')} hitSlop={10}>
                <Ionicons name="heart-outline" size={22} color={colors.ink} />
              </Pressable>
              <Pressable onPress={() => setSheetOpen(true)} hitSlop={10} disabled={spinning || items.length === 0}>
                <Ionicons name="shuffle" size={24} color={colors.ink} />
              </Pressable>
              <Pressable onPress={() => router.push('/settings')} hitSlop={10}>
                <Ionicons name="ellipsis-vertical" size={20} color={colors.ink} />
              </Pressable>
            </View>
          ),
        }}
      />

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={text.label}>Your closet</Text>
          <Text style={text.title}>Nothing here yet</Text>
          <Text style={[text.caption, styles.gap]}>Tap the photo button to add your first piece of clothing.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {caption ? <Text style={[text.caption, styles.caption]}>{caption}</Text> : null}
          <OutfitRows
            items={items}
            selection={selection}
            onChange={setSelection}
            spinning={spinning}
            onToggleFavorite={toggleFavorite}
            onLongPressItem={(item) => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
          />
          <Text style={[text.caption, styles.hint]}>
            Tap ♡ to favorite · Long-press to edit · Worn clothes are skipped by shuffle until Monday
          </Text>
        </ScrollView>
      )}

      {/* Heart pop shown after favoriting */}
      <Animated.View pointerEvents="none" style={[styles.heart, { opacity: heartScale, transform: [{ scale: heartScale }] }]}>
        <Ionicons name="heart" size={96} color={colors.ink} />
      </Animated.View>

      {/* Bottom-left: build your own outfit. Bottom-right: add clothes from camera/gallery. */}
      <View style={[styles.fab, styles.fabLeft]}>
        <CircleButton icon="add" color={colors.muted} onPress={() => router.push('/builder')} disabled={items.length === 0} />
      </View>
      {/* Bottom-center: mark today's look as worn */}
      {items.length > 0 && (
        <View style={styles.wearWrap} pointerEvents="box-none">
          <Pressable
            onPress={toggleWorn}
            disabled={spinning || shown.length === 0}
            style={({ pressed }) => [
              styles.wear,
              allWorn && styles.wearDone,
              pressed && { transform: [{ scale: 0.96 }] },
            ]}
          >
            <Ionicons name={allWorn ? 'checkmark' : 'shirt-outline'} size={18} color={allWorn ? colors.ink : '#fff'} />
            <Text style={[styles.wearText, allWorn && { color: colors.ink }]}>{allWorn ? 'Worn today' : 'Wear today'}</Text>
          </Pressable>
        </View>
      )}

      <View style={[styles.fab, styles.fabRight]}>
        <CircleButton onPress={() => router.push('/add')}>
          <MaterialCommunityIcons name="image-plus" size={24} color={colors.ink} />
        </CircleButton>
      </View>

      <ShuffleSheet
        visible={sheetOpen}
        occasion={occasion}
        weather={weather}
        aiLeft={aiLeft}
        onChangeOccasion={setOccasion}
        onChangeWeather={setWeather}
        onShuffle={shuffle}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { paddingBottom: 110 }, // room for the floating buttons
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  caption: { paddingVertical: 6, paddingHorizontal: 24 },
  hint: { marginTop: 16, color: colors.faint, paddingHorizontal: 24 },
  empty: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 80 },
  gap: { marginTop: 8 },
  heart: { position: 'absolute', top: '38%', alignSelf: 'center' },
  fab: { position: 'absolute', bottom: 24 },
  fabLeft: { left: 20 },
  fabRight: { right: 20 },
  wearWrap: { position: 'absolute', bottom: 28, left: 0, right: 0, alignItems: 'center' },
  wear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: colors.ink,
    ...shadow,
  },
  wearDone: { backgroundColor: colors.bg },
  wearText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
