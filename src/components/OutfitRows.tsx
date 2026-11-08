import { useWindowDimensions } from 'react-native';
import { Carousel } from '@/components/Carousel';
import type { Slots } from '@/lib/suggest';
import { useLists } from '@/lib/lists';
import type { CategoryDef, Item } from '@/types';

// First item of each main (non-optional) category: a sensible starting outfit.
export function defaultSelection(items: Item[], categories: CategoryDef[]): Slots {
  const slots: Slots = {};
  for (const c of categories) {
    const first = items.find((it) => it.category === c.key);
    if (first && !c.optional) slots[c.key] = first.id;
  }
  return slots;
}

type Props = {
  items: Item[];
  selection: Slots;
  onChange: (next: Slots) => void;
  spinning?: boolean;
  onToggleFavorite?: (item: Item) => void;
  onLongPressItem?: (item: Item) => void;
};

// All carousel rows (tops, bottoms, shoes, jackets, accessories) as alternating bands.
// Used by the main Dressup screen and the "Create outfit" builder.
export function OutfitRows({ items, selection, onChange, spinning, onToggleFavorite, onLongPressItem }: Props) {
  const width = useWindowDimensions().width;
  const { categories } = useLists(); // one row per category, in your order
  return (
    <>
      {categories.map(({ key, label, height, optional }, i) => (
        <Carousel
          key={key}
          label={label}
          items={items.filter((it) => it.category === key)}
          selectedId={selection[key]}
          onChange={(id) => onChange({ ...selection, [key]: id })}
          optional={optional}
          screenWidth={width}
          height={height}
          shaded={i % 2 === 0}
          spinning={spinning}
          stopDelay={i * 180}
          onToggleFavorite={onToggleFavorite}
          onLongPressItem={onLongPressItem}
        />
      ))}
    </>
  );
}
