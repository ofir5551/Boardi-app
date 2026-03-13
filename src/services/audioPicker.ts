import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import { Alert } from "react-native";
import * as fileService from "./fileService";
import { generateId } from "@/src/utils/id";
import {
  MAX_FILE_SIZE_BYTES,
  MAX_AUDIO_DURATION_S,
  ALLOWED_MIME_TYPES,
} from "@/src/constants/limits";

type PickResult = { uri: string; label: string } | null;

export async function pickAndValidateAudio(): Promise<PickResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ALLOWED_MIME_TYPES,
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];

  if (asset.size && asset.size > MAX_FILE_SIZE_BYTES) {
    Alert.alert("File too large", "Max file size is 5 MB.");
    return null;
  }

  const ext = asset.name?.match(/\.\w+$/)?.[0] ?? ".mp3";
  const filename = `${generateId()}${ext}`;
  const uri = fileService.copyAudioFile(asset.uri, filename);

  const { sound } = await Audio.Sound.createAsync({ uri });
  const status = await sound.getStatusAsync();
  await sound.unloadAsync();

  if (
    status.isLoaded &&
    status.durationMillis &&
    status.durationMillis > MAX_AUDIO_DURATION_S * 1000
  ) {
    fileService.deleteAudioFile(uri);
    Alert.alert("Too long", `Audio must be ${MAX_AUDIO_DURATION_S}s or less.`);
    return null;
  }

  const label = asset.name?.replace(/\.\w+$/, "") ?? "Sound";
  return { uri, label };
}
