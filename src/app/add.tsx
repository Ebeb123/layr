import { Ionicons } from '@expo/vector-icons';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PillButton } from '@/components/Buttons';
import { ItemForm } from '@/components/ItemForm';
import { addItem } from '@/db/items';
import { canRemoveBackground, isExpoGo, removeBackground } from '@/lib/backgroundRemoval';
import { detectDominantColor } from '@/lib/color';
import { cleanUpClothingImage } from '@/lib/gemini';
import { saveItemImage, shrinkImage } from '@/lib/images';
import { colors, radius, shadow, text } from '@/theme';
import type { Category, Occasion, Weather } from '@/types';

export default function AddItemScreen() {
  const db = useSQLiteContext();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(''); // what happened to the photo (AI clean-up / background removal)
  const [color, setColor] = useState('#808080');
  const [category, setCategory] = useState<Category>('top');
  const [subtype, setSubtype] = useState<string | null>(null);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [weathers, setWeathers] = useState<Weather[]>([]);

  // 1) get a photo  2) shrink it  3) AI clean-up  4) remove background  5) detect color
  async function pickPhoto(source: 'camera' | 'gallery') {
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return Alert.alert('Camera permission is needed.');
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, quality: 1 };
    const result =
      source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;

    setBusy(true);
    try {
      const small = await shrinkImage(result.assets[0].uri);

      // Try to redraw it as a neat product shot. If that fails, keep the original photo.
      let source = small;
      let cleanNote = '';
      try {
        source = await cleanUpClothingImage(small);
        cleanNote = '✓ Cleaned up by AI';
      } catch (e) {
        cleanNote = `AI clean-up skipped: ${e instanceof Error ? e.message : String(e)}`;
      }

      const cutout = await removeBackground(source);
      setImageUri(cutout.uri); // keep the photo even if removal failed
      const removal = cutout.removed ? '✓ Background removed' : `Background not removed: ${cutout.error}`;
      setNote(`${cleanNote}\n${removal}`);
      setColor(await detectDominantColor(cutout.uri));
    } catch (e) {
      Alert.alert('Could not process photo', String(e));
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!imageUri) return Alert.alert('Add a photo first.');
    setBusy(true);
    try {
      const savedUri = await saveItemImage(imageUri);
      await addItem(db, { imageUri: savedUri, category, subtype, occasions, weathers, color });
      // Reset the form, then go to the closet.
      setImageUri(null);
      setCategory('top');
      setSubtype(null);
      setOccasions([]);
      setWeathers([]);
      setColor('#808080');
      setNote('');
      router.navigate('/');
    } catch (e) {
      Alert.alert('Could not save item', String(e));
    } finally {
      setBusy(false);
    }
  }

  const inExpoGo = isExpoGo || Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  // One short status line under the photo.
  const status = !canRemoveBackground
    ? inExpoGo
      ? 'In Expo Go: open the "Layr" app to remove backgrounds.'
      : 'Background removal is missing from this app build.'
    : note.replace('\n', ' · ');

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        {/* Photo: preview with the camera / gallery buttons right under it */}
        <View style={styles.photoBand}>
          <View style={[styles.preview, !imageUri && !busy && styles.previewEmpty]}>
            {busy ? (
              <>
                <ActivityIndicator size="large" color={colors.ink} />
                <Text style={[text.caption, styles.gap]}>Cleaning up your photo…</Text>
              </>
            ) : imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
            ) : (
              <>
                <Ionicons name="shirt-outline" size={56} color={colors.faint} />
                <Text style={[text.caption, styles.gap]}>One item per photo</Text>
              </>
            )}
          </View>
          <View style={styles.buttons}>
            <SmallButton icon="camera-outline" label="Camera" onPress={() => pickPhoto('camera')} disabled={busy} />
            <View style={styles.divider} />
            <SmallButton icon="images-outline" label="Gallery" onPress={() => pickPhoto('gallery')} disabled={busy} />
          </View>
          {status ? (
            <Text style={[text.caption, styles.status]} numberOfLines={2}>
              {status}
            </Text>
          ) : null}
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

      {/* Save stays at the bottom, always visible */}
      <View style={styles.footer}>
        <PillButton title="Save to closet" onPress={save} disabled={busy || !imageUri} />
      </View>
    </View>
  );
}

// Small outlined button with an icon and a word.
function SmallButton(p: { icon: 'camera-outline' | 'images-outline'; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={p.onPress}
      disabled={p.disabled}
      style={({ pressed }) => [styles.small, (pressed || p.disabled) && { opacity: 0.5 }]}
    >
      <Ionicons name={p.icon} size={18} color={colors.ink} />
      <Text style={styles.smallText}>{p.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { flexGrow: 1 }, // lets the photo area stretch to fill the screen
  photoBand: { flexGrow: 1, backgroundColor: colors.band, padding: 16 },
  // Rounded white card holding the photo
  preview: {
    flexGrow: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    ...shadow,
  },
  previewEmpty: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.faint, elevation: 0, shadowOpacity: 0 },
  // Absolute fill: the photo fits inside the card instead of stretching it
  image: { position: 'absolute', top: 16, bottom: 16, left: 16, right: 16 },
  gap: { marginTop: 8 },
  // One pill split in two: Camera | Gallery
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 14,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    ...shadow,
  },
  divider: { width: StyleSheet.hairlineWidth, height: 22, backgroundColor: colors.line },
  small: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 22, paddingVertical: 12 },
  smallText: { fontSize: 14.5, fontWeight: '600', color: colors.ink },
  status: { marginTop: 10, paddingHorizontal: 24 },
  footer: { paddingTop: 4, paddingBottom: 16, backgroundColor: colors.bg },
});
