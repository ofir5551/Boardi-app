import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import type { Soundboard } from "@/src/types/soundboard";

const uriCache = new Map<string, string>();
const activePlayers: ReturnType<typeof createAudioPlayer>[] = [];

export async function loadBoard(board: Soundboard): Promise<void> {
  await unloadBoard();
  await setAudioModeAsync({ playsInSilentMode: true });
  for (const btn of board.buttons) {
    if (btn.soundUri) {
      uriCache.set(btn.id, btn.soundUri);
    }
  }
}

export async function play(buttonId: string): Promise<void> {
  const uri = uriCache.get(buttonId);
  if (!uri) return;
  const player = createAudioPlayer({ uri });
  activePlayers.push(player);
  player.play();
}

export async function updateButtonSound(buttonId: string, uri: string): Promise<void> {
  uriCache.set(buttonId, uri);
}

export async function unloadBoard(): Promise<void> {
  for (const p of activePlayers) p.remove();
  activePlayers.length = 0;
  uriCache.clear();
}
