import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Band } from '@/components/Band';
import { WordCarousel } from '@/components/WordCarousel';
import { getProfile, saveProfile } from '@/db/profile';
import { colors, text } from '@/theme';

// Preview colors for skin tone 1 (lightest) .. 10 (darkest).
const SKIN_TONES = ['#fbe3d3', '#f3d0b5', '#e8b996', '#d9a27c', '#c68863', '#ad6f4b', '#8f5838', '#73432a', '#57311f', '#3b2116'];

// Heights you can swipe through: 120 .. 220 cm.
const HEIGHTS = Array.from({ length: 101 }, (_, i) => ({ value: 120 + i, label: String(120 + i) }));

// Profile: swipe your height, tap your skin tone. Changes save automatically.
export default function ProfileScreen() {
  const db = useSQLiteContext();
  const width = useWindowDimensions().width;
  const [loaded, setLoaded] = useState(false);
  const [height, setHeight] = useState<number | null>(null);
  const [skinTone, setSkinTone] = useState(5);
  const changed = useRef(false); // only save after the user changes something

  // Load the saved profile once.
  useEffect(() => {
    getProfile(db).then((p) => {
      setHeight(p.heightCm);
      setSkinTone(p.skinTone);
      setLoaded(true);
    });
  }, [db]);

  // Auto-save whenever height or skin tone changes.
  useEffect(() => {
    if (loaded && changed.current) saveProfile(db, { heightCm: height, skinTone });
  }, [db, loaded, height, skinTone]);

  if (!loaded) return null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Band label="Profile" title="Your fit" shaded>
        <Text style={text.caption}>Used to tailor your outfit suggestions</Text>
      </Band>

      <Band label="Height" title={height ? `${height} cm` : 'Not set'}>
        <WordCarousel
          options={HEIGHTS}
          value={height ?? 165}
          onChange={(h) => {
            changed.current = true;
            setHeight(h);
          }}
          screenWidth={width}
          cellWidth={width / 5}
          fontSize={22}
        />
        <Text style={[text.caption, styles.gap]}>Swipe to set</Text>
      </Band>

      <Band label="Skin tone" title={`Tone ${skinTone}`} shaded>
        <View style={styles.tones}>
          {SKIN_TONES.map((hex, i) => {
            const on = skinTone === i + 1;
            return (
              <Pressable
                key={hex}
                hitSlop={4}
                onPress={() => {
                  changed.current = true;
                  setSkinTone(i + 1);
                }}
                style={[styles.ring, on && styles.ringOn]}
              >
                <View style={[styles.tone, { backgroundColor: hex }, on && styles.toneOn]} />
              </Pressable>
            );
          })}
        </View>
        <View style={styles.scale}>
          <Text style={text.caption}>Lightest</Text>
          <Text style={text.caption}>Darkest</Text>
        </View>
      </Band>

      <Text style={[text.caption, styles.saved]}>Changes save automatically</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.bg },
  container: { paddingBottom: 40 },
  gap: { marginTop: 8 },
  tones: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, paddingHorizontal: 12 },
  ring: { padding: 3, borderRadius: 24, borderWidth: 1.5, borderColor: 'transparent' },
  ringOn: { borderColor: colors.ink },
  tone: { width: 24, height: 24, borderRadius: 12 },
  toneOn: { width: 34, height: 34, borderRadius: 17 },
  scale: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 28, marginTop: 10 },
  saved: { marginTop: 24 },
});
