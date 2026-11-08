import { requireOptionalNativeModule } from 'expo';

// The native ML Kit module (from @westwood-dev/expo-segmentation).
// It only exists in a dev build. In Expo Go this is null, so we skip removal.
type SegmentationModule = {
  removeBackground(uri: string, options: object): Promise<{ uri: string }[]>;
};
const Segmentation = requireOptionalNativeModule<SegmentationModule>('ExpoSegmentation');

export const canRemoveBackground = Segmentation != null;

// True when running inside the Expo Go app (it ships its own "ExpoGo" native module).
export const isExpoGo = requireOptionalNativeModule('ExpoGo') != null;

export type RemovalResult = {
  uri: string; // the cut-out PNG, or the original photo if removal failed
  removed: boolean;
  error?: string; // why it failed (shown on screen)
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Runs fully on-device. The first time, Google Play services downloads the ML Kit
// model (~10 MB, needs internet) and the call fails until it's ready, so we retry.
export async function removeBackground(uri: string): Promise<RemovalResult> {
  if (!Segmentation) return { uri, removed: false, error: 'Not available in this app build' };

  let lastError = '';
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const [result] = await Segmentation.removeBackground(uri, {});
      if (result?.uri) return { uri: result.uri, removed: true };
      lastError = 'No result from ML Kit';
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      // Only the "model still downloading" error is worth retrying.
      if (!/download|wait|unavailable/i.test(lastError)) break;
      await wait(4000);
    }
  }
  return { uri, removed: false, error: lastError };
}
