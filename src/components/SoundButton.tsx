import { Pressable, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
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
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const triggerPulse = () => {
    scale.value = withSequence(
      withTiming(1.08, { duration: 80, easing: Easing.out(Easing.ease) }),
      withTiming(1.0, { duration: 150, easing: Easing.inOut(Easing.ease) }),
    );
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isEmpty) triggerPulse();
    onPress();
  };

  const bg = isRecording
    ? "bg-red-100"
    : isEmpty
      ? "bg-white border border-gray-200"
      : "bg-sky-100";

  return (
    <Animated.View className="flex-1 m-[3px]" style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onLongPress={onLongPress}
        onPressIn={isEmpty ? onPressIn : undefined}
        onPressOut={isEmpty ? onPressOut : undefined}
        className={`flex-1 rounded-2xl items-center justify-center ${bg}`}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
        })}
      >
        {isRecording ? (
          <>
            <Ionicons name="mic" size={28} color="#dc2626" />
            <Text className="text-red-600 font-bold text-xs mt-1">Recording…</Text>
          </>
        ) : isEmpty ? (
          <>
            <Ionicons name="add" size={28} color="#9ca3af" />
            <Text className="text-gray-400 text-[10px] mt-1">Tap to Add · Hold to Record</Text>
          </>
        ) : (
          <>
            <Ionicons name="play" size={28} color="#3b82f6" />
            <Text className="text-gray-700 font-semibold text-sm mt-1 text-center px-2" numberOfLines={1}>
              {button.label || "Sound"}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
