import { useEffect, useRef } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '@/theme';

export type WordOption<T> = { value: T; label: string };

// Animated version of FlatList, typed like a normal FlatList so it works with any value type.
const AnimatedFlatList = Animated.FlatList as unknown as typeof FlatList;

type Props<T> = {
  options: WordOption<T>[];
  value: T;
  onChange: (value: T) => void;
  screenWidth: number;
  cellWidth?: number; // width of one word (default: a third of the screen)
  fontSize?: number;
};

// A swipeable row of words, like "Polo  Shirts  Tees" on the Dressup screen.
// The centered word is the selected one; neighbors fade out. Swipe or tap to choose.
export function WordCarousel<T>({ options, value, onChange, screenWidth, cellWidth, fontSize = 24 }: Props<T>) {
  const cell = cellWidth ?? screenWidth / 3;
  const side = (screenWidth - cell) / 2; // empty space so the first/last word can sit in the center
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  const scrollX = useRef(new Animated.Value(index * cell)).current;
  const listRef = useRef<FlatList<WordOption<T>>>(null);
  const current = useRef(index);

  // If the value changes from outside, scroll to it.
  useEffect(() => {
    if (index !== current.current) {
      current.current = index;
      listRef.current?.scrollToOffset({ offset: index * cell, animated: true });
    }
  }, [index, cell]);

  function select(i: number) {
    const clamped = Math.min(options.length - 1, Math.max(0, i));
    if (clamped === current.current) return;
    current.current = clamped;
    onChange(options[clamped].value);
  }

  return (
    <AnimatedFlatList
      ref={listRef}
      horizontal
      data={options}
      keyExtractor={(o) => String(o.value)}
      showsHorizontalScrollIndicator={false}
      snapToInterval={cell}
      decelerationRate="fast"
      contentOffset={{ x: index * cell, y: 0 }}
      ListHeaderComponent={<View style={{ width: side }} />}
      ListFooterComponent={<View style={{ width: side }} />}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
      onMomentumScrollEnd={(e) => select(Math.round(e.nativeEvent.contentOffset.x / cell))}
      renderItem={({ item, index: i }) => {
        const range = [(i - 1) * cell, i * cell, (i + 1) * cell];
        const scale = scrollX.interpolate({ inputRange: range, outputRange: [0.72, 1, 0.72], extrapolate: 'clamp' });
        const opacity = scrollX.interpolate({ inputRange: range, outputRange: [0.25, 1, 0.25], extrapolate: 'clamp' });
        return (
          <Pressable
            onPress={() => {
              listRef.current?.scrollToOffset({ offset: i * cell, animated: true });
              select(i);
            }}
          >
            <Animated.Text
              numberOfLines={1}
              style={[styles.word, { width: cell, fontSize, opacity, transform: [{ scale }] }]}
            >
              {item.label}
            </Animated.Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  word: { textAlign: 'center', color: colors.ink, fontWeight: '500', paddingVertical: 4 },
});
