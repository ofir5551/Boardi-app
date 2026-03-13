import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Soundboard } from "@/src/types/soundboard";

const STORAGE_KEY = "soundboards";

export async function loadAll(): Promise<Soundboard[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as Soundboard[];
}

export async function saveAll(boards: Soundboard[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
}
