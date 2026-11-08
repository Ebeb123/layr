import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { isWornThisWeek } from '@/lib/worn';
import { colors, text } from '@/theme';
import type { Item } from '@/types';

type Props = {
  label: string; // small caps title, e.g. "TOPS"
  items: Item[];
  selectedId: number | undefined;
  onChange: (id: number | undefined) => void;
  optional?: boolean; // adds a "None" choice first (jacket / accessory)
  screenWidth: number;
  height: number; // image height for this row
  shaded?: boolean; // grey band background (rows alternate grey / white)
  spinning?: boolean; // true = keep flicking through items (while the AI is picking)
  stopDelay?: number; // ms this row waits before landing, so rows stop one after another
  onToggleFavorite?: (item: Item) => void; // shows a small heart on the centered item
  onLongPressItem?: (item: Item) => void; // long-press = edit the item
};

// Title for an item: its style ("Shirt", "Jeans"...). Items without a style show the row name.
const nameOf = (p: Item | null | undefined, fallback: string) => (p === undefined ? '' : p ? p.subtype || fallback : 'None');

// One "Dressup" row: a carousel strip. The centered item is a bit bigger; swipe or tap to choose.
export function Carousel(props: Props) {
  const { label, items, selectedId, onChange, optional, screenWidth, height, shaded } = props;
  const { spinning = false, stopDelay = 0, onToggleFavorite, onLongPressItem } = props;
  const pages: (Item | null)[] = optional ? [null, ...items] : items;
  const cell = screenWidth / 4.2; // width of one item; about 4 visible at once
  const side = (screenWidth - cell) / 2; // empty space so the first/last item can sit in the center
  const index = Math.max(0, pages.findIndex((p) => (p?.id ?? undefined) === selectedId));

  const scrollX = useRef(new Animated.Value(index * cell)).current;
  const listRef = useRef<FlatList<Item | null>>(null);
  const currentIndex = useRef(index);
  const busy = useRef(false); // true while spinning, so scroll events don't change the choice
  const scrollTo = (i: number) => listRef.current?.scrollToOffset({ offset: i * cell, animated: true });

  // Spin: while `spinning` is true, jump to random items. When it turns false, land on the chosen one.
  useEffect(() => {
    if (pages.length < 2) return;
    if (spinning) {
      busy.current = true;
      const timer = setInterval(() => scrollTo(Math.floor(Math.random() * pages.length)), 120);
      return () => clearInterval(timer);
    }
    if (!busy.current) return;
    const land = setTimeout(() => {
      currentIndex.current = index;
      scrollTo(index);
      setTimeout(() => (busy.current = false), 500);
    }, stopDelay);
    return () => clearTimeout(land);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning]);

  // When the choice changes from outside (e.g. opening a favorite), scroll to it.
  useEffect(() => {
    if (busy.current || index === currentIndex.current) return;
    currentIndex.current = index;
    scrollTo(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, cell]);

  function select(i: number) {
    if (busy.current || i === currentIndex.current || i < 0 || i >= pages.length) return;
    currentIndex.current = i;
    onChange(pages[i]?.id ?? undefined);
  }

  return (
    <View style={[styles.band, shaded && styles.shaded]}>
      <Text style={text.label}>{label}</Text>

      {/* Title row: previous, current and next names, like a mini carousel */}
      <View style={styles.titles}>
        <Text style={[styles.sideTitle, styles.right]} numberOfLines={1}>
          {nameOf(pages[index - 1], label)}
        </Text>
        <Text style={styles.title} numberOfLines={1}>
          {pages.length === 0 ? 'Empty' : nameOf(pages[index], label)}
        </Text>
        <Text style={styles.sideTitle} numberOfLines={1}>
          {nameOf(pages[index + 1], label)}
        </Text>
      </View>

      <Animated.FlatList
        ref={listRef}
        horizontal
        data={pages}
        extraData={`${index}-${spinning}`} // re-draw so the heart follows the centered item
        keyExtractor={(p) => (p ? String(p.id) : 'none')}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cell} // stop exactly on an item
        decelerationRate="fast"
        contentOffset={{ x: index * cell, y: 0 }}
        style={{ height: height + 16 }}
        ListHeaderComponent={<View style={{ width: side }} />}
        ListFooterComponent={<View style={{ width: side }} />}
        ListEmptyComponent={<Text style={[text.caption, { width: screenWidth - side * 2 }]}>No items yet</Text>}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        onMomentumScrollEnd={(e) => select(Math.round(e.nativeEvent.contentOffset.x / cell))}
        renderItem={({ item, index: i }) => {
          // The centered item grows a little; neighbors stay clearly visible.
          const range = [(i - 1) * cell, i * cell, (i + 1) * cell];
          const scale = scrollX.interpolate({ inputRange: range, outputRange: [0.86, 1.12, 0.86], extrapolate: 'clamp' });
          const lift = scrollX.interpolate({ inputRange: range, outputRange: [0, -6, 0], extrapolate: 'clamp' });
          return (
            <Pressable
              onPress={() => {
                if (busy.current) return;
                scrollTo(i);
                select(i);
              }}
              onLongPress={() => item && onLongPressItem?.(item)}
              delayLongPress={400}
            >
              <Animated.View
                style={[{ width: cell, height }, styles.cell, { transform: [{ translateY: lift }, { scale }] }]}
              >
                {item ? (
                  <>
                    <Image
                      source={{ uri: item.imageUri }}
                      style={[styles.image, isWornThisWeek(item) && styles.worn]}
                      resizeMode="contain"
                    />
                    {isWornThisWeek(item) && <Text style={styles.wornTag}>WORN</Text>}
                  </>
                ) : (
                  <Text style={styles.none}>None</Text>
                )}
              </Animated.View>

              {/* Small heart, only on the item sitting in the middle */}
              {item && onToggleFavorite && i === index && !spinning && (
                <Pressable style={styles.heart} hitSlop={10} onPress={() => onToggleFavorite(item)}>
                  <Ionicons name={item.favorite ? 'heart' : 'heart-outline'} size={18} color={item.favorite ? colors.ink : colors.muted} />
                </Pressable>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  band: { paddingTop: 16, paddingBottom: 18, backgroundColor: colors.bg },
  shaded: { backgroundColor: colors.band },
  titles: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 2, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '500', marginHorizontal: 14, color: colors.ink },
  sideTitle: { flex: 1, fontSize: 17, color: colors.faint },
  right: { textAlign: 'right' },
  cell: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  image: { width: '100%', height: '100%' },
  none: { color: colors.faint },
  worn: { opacity: 0.35 },
  wornTag: {
    position: 'absolute',
    bottom: 2,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.muted,
    backgroundColor: colors.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  heart: {
    position: 'absolute',
    top: -4,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
