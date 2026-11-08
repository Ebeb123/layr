import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { PillButton } from '@/components/Buttons';
import { TagPicker } from '@/components/TagPicker';
import { DAILY_AI_LIMIT } from '@/lib/gemini';
import { colors, text } from '@/theme';
import { useLists } from '@/lib/lists';
import type { Occasion, Weather } from '@/types';

const WEATHER_CHOICES = ['any', 'hot', 'rainy'] as const;
type WeatherChoice = (typeof WEATHER_CHOICES)[number];

type Props = {
  visible: boolean;
  occasion: Occasion;
  weather: Weather | null;
  aiLeft: number;
  onChangeOccasion: (o: Occasion) => void;
  onChangeWeather: (w: Weather | null) => void;
  onShuffle: () => void;
  onClose: () => void;
};

// Bottom sheet shown when you tap shuffle: pick occasion + weather, then go.
export function ShuffleSheet(p: Props) {
  const weatherChoice: WeatherChoice = p.weather ?? 'any';
  const { occasions } = useLists();
  return (
    <Modal visible={p.visible} transparent animationType="slide" onRequestClose={p.onClose}>
      {/* Tap the dark area to close */}
      <Pressable style={styles.backdrop} onPress={p.onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={text.label}>Shuffle with AI</Text>
        <Text style={text.title}>What's the plan?</Text>

        <View style={styles.block}>
          <TagPicker
            label="Occasion"
            options={occasions.map((o) => o.key)}
            selected={[p.occasion]}
            onChange={(next) => next[0] && p.onChangeOccasion(next[0])}
          />
        </View>
        <View style={styles.block}>
          <TagPicker
            label="Weather"
            options={WEATHER_CHOICES}
            selected={[weatherChoice]}
            onChange={(next) => next[0] && p.onChangeWeather(next[0] === 'any' ? null : next[0])}
          />
        </View>

        <PillButton title="Shuffle" onPress={p.onShuffle} />
        <Text style={[text.caption, styles.left]}>
          {p.aiLeft > 0
            ? `${p.aiLeft} of ${DAILY_AI_LIMIT} AI picks left today`
            : 'AI limit reached today. Shuffle will use offline color rules.'}
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingBottom: 32,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 14 },
  block: { marginTop: 18 },
  left: { marginTop: 10 },
});
