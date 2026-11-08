import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import UPNG from 'upng-js';

const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');

// Finds the most common color in an image, ignoring transparent pixels.
// Steps: shrink to 24x24 -> read the pixels -> group similar colors -> pick the biggest group.
export async function detectDominantColor(uri: string): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri);
  ctx.resize({ width: 24, height: 24 });
  const small = await (await ctx.renderAsync()).saveAsync({ format: SaveFormat.PNG });

  const bytes = await new File(small.uri).bytes();
  const png = UPNG.decode(bytes.buffer);
  const rgba = new Uint8Array(UPNG.toRGBA8(png)[0]);

  // Each group ("bucket") collects pixels with similar colors.
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
  for (let i = 0; i < rgba.length; i += 4) {
    const [r, g, b, a] = [rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]];
    if (a < 128) continue; // skip see-through (background) pixels
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5); // 8 levels per channel
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  let best = { count: 0, r: 128, g: 128, b: 128 };
  for (const bucket of buckets.values()) if (bucket.count > best.count) best = bucket;
  if (best.count === 0) return '#808080';

  // Average the colors inside the winning group.
  return `#${toHex(best.r / best.count)}${toHex(best.g / best.count)}${toHex(best.b / best.count)}`;
}
