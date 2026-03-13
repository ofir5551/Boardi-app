import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  useAudioRecorder,
  RecordingPresets,
  AudioModule,
  setAudioModeAsync,
} from "expo-audio";
import { Ionicons } from "@expo/vector-icons";
import { useSoundboardStore } from "@/src/store/soundboardStore";
import * as fileService from "@/src/services/fileService";
import * as audioService from "@/src/services/audioService";
import { pickAndValidateAudio } from "@/src/services/audioPicker";
import { generateId } from "@/src/utils/id";
import { MAX_AUDIO_DURATION_S } from "@/src/constants/limits";

export default function EditButtonScreen() {
  const { id, buttonId } = useLocalSearchParams<{
    id: string;
    buttonId: string;
  }>();
  const router = useRouter();
  const { activeBoard, updateButton, setActiveBoard } = useSoundboardStore();

  const button = activeBoard?.buttons.find((b) => b.id === buttonId);
  const [label, setLabel] = useState(button?.label ?? "");
  const [isRecording, setIsRecording] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!activeBoard && id) setActiveBoard(id);
  }, [id]);

  useEffect(() => {
    return () => {
      recorder.stop().catch(() => {});
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
    };
  }, []);

  const saveRecording = useCallback(async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) return;
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const filename = `${generateId()}.m4a`;
      const dest = fileService.copyAudioFile(uri, filename);
      if (button?.soundUri) fileService.deleteAudioFile(button.soundUri);
      const newLabel = label.trim() || "Recording";
      await updateButton(id!, buttonId!, { soundUri: dest, label: newLabel });
      await audioService.updateButtonSound(buttonId!, dest);
      setLabel(newLabel);
    } catch {
      Alert.alert("Error", "Could not save recording.");
    }
  }, [id, buttonId, button?.soundUri, label, updateButton, recorder]);

  const handleSave = async () => {
    if (id && buttonId) {
      await updateButton(id, buttonId, { label: label.trim() });
    }
    router.back();
  };

  const handleReplace = async () => {
    try {
      const result = await pickAndValidateAudio();
      if (!result) return;

      if (button?.soundUri) fileService.deleteAudioFile(button.soundUri);
      const newLabel = label.trim() || result.label;
      await updateButton(id!, buttonId!, { soundUri: result.uri, label: newLabel });
      await audioService.updateButtonSound(buttonId!, result.uri);
      setLabel(newLabel);
    } catch {
      Alert.alert("Error", "Could not load audio file.");
    }
  };

  const handleRecord = async () => {
    if (isRecording) {
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
      setIsRecording(false);
      await saveRecording();
      return;
    }

    const { granted } = await AudioModule.requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert("Permission needed", "Microphone access is required to record.");
      return;
    }

    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);

      autoStopTimerRef.current = setTimeout(() => {
        setIsRecording(false);
        saveRecording();
      }, MAX_AUDIO_DURATION_S * 1000);
    } catch {
      Alert.alert("Error", "Could not start recording.");
    }
  };

  const handleRemove = async () => {
    Alert.alert("Remove Sound", "Remove the sound from this button?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (button?.soundUri) fileService.deleteAudioFile(button.soundUri);
          await updateButton(id!, buttonId!, {
            soundUri: null,
            label: "",
          });
          router.back();
        },
      },
    ]);
  };

  if (!button) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-gray-900 items-center justify-center">
        <Text className="text-gray-500 dark:text-gray-400">Button not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-gray-900 px-4 pt-6">
      <Stack.Screen options={{ title: "Edit Button" }} />

      <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1">Button Name</Text>
      <TextInput
        value={label}
        onChangeText={setLabel}
        placeholder="Enter name..."
        placeholderTextColor="#9ca3af"
        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 mb-6 border border-gray-300 dark:border-gray-600"
      />

      <Pressable
        onPress={handleReplace}
        className="bg-sky-500 rounded-xl py-4 items-center mb-3 flex-row justify-center gap-2"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Ionicons name="cloud-upload-outline" size={20} color="white" />
        <Text className="text-white font-bold">Replace Sound</Text>
      </Pressable>

      <Pressable
        onPress={handleRecord}
        className={`rounded-xl py-4 items-center mb-3 flex-row justify-center gap-2 ${
          isRecording ? "bg-red-500" : "bg-violet-500"
        }`}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Ionicons name={isRecording ? "stop" : "mic"} size={20} color="white" />
        <Text className="text-white font-bold">
          {isRecording ? "Stop Recording" : "Record Sound"}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleRemove}
        className="bg-red-500 rounded-xl py-4 items-center mb-6 flex-row justify-center gap-2"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Ionicons name="trash-outline" size={20} color="white" />
        <Text className="text-white font-bold">Remove Sound</Text>
      </Pressable>

      <Pressable
        onPress={handleSave}
        className="bg-teal-500 rounded-xl py-4 items-center flex-row justify-center gap-2"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Ionicons name="checkmark" size={20} color="white" />
        <Text className="text-white font-bold">Save & Back</Text>
      </Pressable>
    </View>
  );
}
