import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Audio } from "expo-av";
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
  const recordingRef = useRef<Audio.Recording | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!activeBoard && id) setActiveBoard(id);
  }, [id]);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
    };
  }, []);

  const saveRecording = useCallback(
    async (rec: Audio.Recording) => {
      try {
        await rec.stopAndUnloadAsync();
        const uri = rec.getURI();
        if (!uri) return;

        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

        const { sound } = await Audio.Sound.createAsync({ uri });
        const status = await sound.getStatusAsync();
        await sound.unloadAsync();
        if (
          status.isLoaded &&
          status.durationMillis &&
          status.durationMillis > MAX_AUDIO_DURATION_S * 1000
        ) {
          Alert.alert("Too long", `Recording must be ${MAX_AUDIO_DURATION_S}s or less.`);
          return;
        }

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
    },
    [id, buttonId, button?.soundUri, label, updateButton],
  );

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
    if (isRecording && recordingRef.current) {
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
      const rec = recordingRef.current;
      recordingRef.current = null;
      setIsRecording(false);
      await saveRecording(rec);
      return;
    }

    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Microphone access is required to record.");
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setIsRecording(true);

      autoStopTimerRef.current = setTimeout(() => {
        const rec = recordingRef.current;
        if (!rec) return;
        recordingRef.current = null;
        setIsRecording(false);
        saveRecording(rec);
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
      <View className="flex-1 bg-gray-100 items-center justify-center">
        <Text className="text-gray-500">Button not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100 px-4 pt-6">
      <Stack.Screen options={{ title: "Edit Button" }} />

      <Text className="text-gray-500 text-sm mb-1">Button Name</Text>
      <TextInput
        value={label}
        onChangeText={setLabel}
        placeholder="Enter name..."
        placeholderTextColor="#9ca3af"
        className="bg-white text-gray-900 rounded-xl px-4 py-3 mb-6 border border-gray-300"
      />

      <Pressable
        onPress={handleReplace}
        className="bg-teal-500 rounded-xl py-4 items-center mb-3"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Text className="text-white font-bold">Replace Sound</Text>
      </Pressable>

      <Pressable
        onPress={handleRecord}
        className={`rounded-xl py-4 items-center mb-3 ${
          isRecording ? "bg-red-500" : "bg-emerald-500"
        }`}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Text className="text-white font-bold">
          {isRecording ? "Stop Recording" : "Record Sound"}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleRemove}
        className="bg-red-100 rounded-xl py-4 items-center mb-6"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Text className="text-red-600 font-bold">Remove Sound</Text>
      </Pressable>

      <Pressable
        onPress={handleSave}
        className="bg-gray-200 rounded-xl py-4 items-center"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Text className="text-gray-800 font-bold">Save & Back</Text>
      </Pressable>
    </View>
  );
}
