import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, Alert } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { useSoundboardStore } from "@/src/store/soundboardStore";
import * as audioService from "@/src/services/audioService";
import * as fileService from "@/src/services/fileService";
import { generateId } from "@/src/utils/id";
import { MAX_AUDIO_DURATION_S } from "@/src/constants/limits";
import BoardGrid from "@/src/components/BoardGrid";
import type { SoundButton } from "@/src/types/soundboard";

export default function SoundboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { activeBoard, setActiveBoard, clearActiveBoard, updateButton } =
    useSoundboardStore();

  const [recordingButtonId, setRecordingButtonId] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevBoardIdRef = useRef<string | null>(null);

  const stopAndSaveRecording = useCallback(
    async (buttonId: string) => {
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
      const recording = recordingRef.current;
      if (!recording) return;
      recordingRef.current = null;
      setRecordingButtonId(null);
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        if (!uri) return;
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        const filename = `${generateId()}.m4a`;
        const savedUri = fileService.copyAudioFile(uri, filename);
        await updateButton(id!, buttonId, { soundUri: savedUri, label: "Recording" });
        await audioService.updateButtonSound(buttonId, savedUri);
      } catch {
        Alert.alert("Error", "Could not save recording.");
      }
    },
    [id, updateButton],
  );

  useEffect(() => {
    if (id) setActiveBoard(id);
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      audioService.unloadBoard();
      clearActiveBoard();
    };
  }, [id]);

  // Only reload audio when board ID changes, not on every button update
  useEffect(() => {
    if (activeBoard && activeBoard.id !== prevBoardIdRef.current) {
      prevBoardIdRef.current = activeBoard.id;
      audioService.loadBoard(activeBoard);
    }
  }, [activeBoard]);

  const handlePress = async (button: SoundButton) => {
    if (button.soundUri) {
      await audioService.play(button.id);
    } else {
      router.push(`/soundboard/${id}/edit-button/${button.id}`);
    }
  };

  const handleLongPress = async (button: SoundButton) => {
    if (button.soundUri) {
      router.push(`/soundboard/${id}/edit-button/${button.id}`);
      return;
    }
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission required", "Microphone access is needed to record.");
      return;
    }
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setRecordingButtonId(button.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      autoStopTimerRef.current = setTimeout(
        () => stopAndSaveRecording(button.id),
        MAX_AUDIO_DURATION_S * 1000,
      );
    } catch {
      Alert.alert("Error", "Could not start recording.");
    }
  };

  const handlePressOut = async (button: SoundButton) => {
    if (!recordingRef.current || recordingButtonId !== button.id) return;
    await stopAndSaveRecording(button.id);
  };

  if (!activeBoard) {
    return (
      <View className="flex-1 bg-gray-100 dark:bg-gray-900 items-center justify-center">
        <Text className="text-gray-500 dark:text-gray-400">Loading board...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100 dark:bg-gray-900">
      <Stack.Screen options={{ title: activeBoard.name }} />
      <BoardGrid
        buttons={activeBoard.buttons}
        onButtonPress={handlePress}
        onButtonLongPress={handleLongPress}
        onButtonPressOut={handlePressOut}
        isRecordingButtonId={recordingButtonId}
      />
    </View>
  );
}
