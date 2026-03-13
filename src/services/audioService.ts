import { Audio } from "expo-av";
import type { Soundboard } from "@/src/types/soundboard";

const soundCache = new Map<string, Audio.Sound>();

export async function loadBoard(board: Soundboard): Promise<void> {
  await unloadBoard();
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  for (const btn of board.buttons) {
    if (btn.soundUri) {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: btn.soundUri });
        soundCache.set(btn.id, sound);
      } catch {
        // skip buttons with invalid audio
      }
    }
  }
}

export async function play(buttonId: string): Promise<void> {
  const preloaded = soundCache.get(buttonId);
  if (!preloaded) return;

  // For simultaneous playback, create a new instance each tap
  // and use the preloaded sound's URI
  const status = await preloaded.getStatusAsync();
  if (!status.isLoaded) return;

  const { sound } = await Audio.Sound.createAsync(
    { uri: status.uri },
    { shouldPlay: true },
  );
  sound.setOnPlaybackStatusUpdate((s) => {
    if (!s.isLoaded || s.didJustFinish) {
      sound.unloadAsync();
    }
  });
}

export async function updateButtonSound(
  buttonId: string,
  uri: string,
): Promise<void> {
  const old = soundCache.get(buttonId);
  if (old) await old.unloadAsync().catch(() => {});
  try {
    const { sound } = await Audio.Sound.createAsync({ uri });
    soundCache.set(buttonId, sound);
  } catch {
    soundCache.delete(buttonId);
  }
}

export async function unloadBoard(): Promise<void> {
  for (const sound of soundCache.values()) {
    await sound.unloadAsync().catch(() => {});
  }
  soundCache.clear();
}
