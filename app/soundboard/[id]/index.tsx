import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, Alert } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSoundboardStore } from "@/src/store/soundboardStore";
import * as audioService from "@/src/services/audioService";
import * as fileService from "@/src/services/fileService";
import { pickAndValidateAudio } from "@/src/services/audioPicker";
import BoardGrid from "@/src/components/BoardGrid";
import type { SoundButton } from "@/src/types/soundboard";
import { MAX_AUDIO_DURATION_S } from "@/src/constants/limits";
import { Audio } from "expo-av";
import { generateId } from "@/src/utils/id";

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
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
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
      await pickFile(button);
    }
  };

  const pickFile = async (button: SoundButton) => {
    try {
      const result = await pickAndValidateAudio();
      if (!result) return;

      await updateButton(id!, button.id, { soundUri: result.uri, label: result.label });
      await audioService.updateButtonSound(button.id, result.uri);
    } catch {
      Alert.alert("Error", "Could not load audio file.");
    }
  };

  const handleLongPress = (button: SoundButton) => {
    if (!button.soundUri) return;
    router.push(`/soundboard/${id}/edit-button/${button.id}`);
  };

  const handlePressIn = async (button: SoundButton) => {
    if (button.soundUri || recordingRef.current) return;

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

      autoStopTimerRef.current = setTimeout(() => {
        stopAndSaveRecording(button.id);
      }, MAX_AUDIO_DURATION_S * 1000);
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
      <View className="flex-1 bg-[#0f0d2e] items-center justify-center">
        <Text className="text-gray-400">Loading board...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0f0d2e]">
      <Stack.Screen options={{ title: activeBoard.name }} />
      <BoardGrid
        buttons={activeBoard.buttons}
        onButtonPress={handlePress}
        onButtonLongPress={handleLongPress}
        onButtonPressIn={handlePressIn}
        onButtonPressOut={handlePressOut}
        isRecordingButtonId={recordingButtonId}
      />
    </View>
  );
}
