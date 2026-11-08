import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// All item images live in <app documents>/items/
const itemsDir = new Directory(Paths.document, 'items');

// Shrinks big camera photos so background removal is fast and memory-safe.
export async function shrinkImage(uri: string, maxWidth = 1024): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri);
  ctx.resize({ width: maxWidth, height: null });
  const image = await ctx.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
  return result.uri;
}

// Copies a temporary image into permanent app storage and returns its new uri.
export async function saveItemImage(tempUri: string): Promise<string> {
  if (!itemsDir.exists) itemsDir.create({ intermediates: true });
  const dest = new File(itemsDir, `${Date.now()}.png`);
  await new File(tempUri).copy(dest);
  return dest.uri;
}

// Deletes a saved image (ignores errors if it's already gone).
export function deleteItemImage(uri: string) {
  try {
    new File(uri).delete();
  } catch {}
}
