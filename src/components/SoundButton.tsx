import { Pressable, Text } from "react-native";
import * as Haptics from "expo-haptics";
import type { SoundButton as SoundButtonType } from "@/src/types/soundboard";

type Props = {
  button: SoundButtonType;
  onPress: () => void;
  onLongPress: () => void;
  /** Only fires for empty buttons (press-to-record UX) */
  onPressIn?: () => void;
  /** Only fires for empty buttons (press-to-record UX) */
  onPressOut?: () => void;
  isRecording?: boolean;
};

export default function SoundButton({
  button,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  isRecording,
}: Props) {
  const isEmpty = !button.soundUri;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const bg = isRecording
    ? "bg-red-600"
    : isEmpty
      ? "bg-gray-700 border-2 border-dashed border-gray-500"
      : "bg-indigo-600";

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={isEmpty ? onPressIn : undefined}
      onPressOut={isEmpty ? onPressOut : undefined}
      className={`flex-1 m-1.5 rounded-2xl items-center justify-center h-24 ${bg}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Text className="text-white font-bold text-base text-center px-2">
        {isRecording ? "Recording…" : isEmpty ? "+" : button.label || "Sound"}
      </Text>
    </Pressable>
  );
}
