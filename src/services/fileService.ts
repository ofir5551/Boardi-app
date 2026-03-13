import { Paths, File, Directory } from "expo-file-system";

const SOUNDS_DIR_NAME = "sounds";

function getSoundsDir(): Directory {
  return new Directory(Paths.document, SOUNDS_DIR_NAME);
}

export function ensureSoundsDir(): void {
  const dir = getSoundsDir();
  if (!dir.exists) {
    dir.create();
  }
}

export function copyAudioFile(sourceUri: string, filename: string): string {
  ensureSoundsDir();
  const source = new File(sourceUri);
  const dest = new File(getSoundsDir(), filename);
  source.copy(dest);
  return dest.uri;
}

export function deleteAudioFile(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // best-effort cleanup
  }
}

export function getFileSize(uri: string): number {
  const file = new File(uri);
  if (!file.exists) return 0;
  return file.size ?? 0;
}
