import { View } from "react-native";
import SoundButton from "./SoundButton";
import type { SoundButton as SoundButtonType } from "@/src/types/soundboard";
import { GRID_COLUMNS } from "@/src/constants/limits";

type Props = {
  buttons: SoundButtonType[];
  onButtonPress: (button: SoundButtonType) => void;
  onButtonLongPress: (button: SoundButtonType) => void;
  onButtonPressOut?: (button: SoundButtonType) => void;
  isRecordingButtonId?: string | null;
};

export default function BoardGrid({
  buttons,
  onButtonPress,
  onButtonLongPress,
  onButtonPressOut,
  isRecordingButtonId,
}: Props) {
  const rows: SoundButtonType[][] = [];
  for (let i = 0; i < buttons.length; i += GRID_COLUMNS) {
    rows.push(buttons.slice(i, i + GRID_COLUMNS));
  }

  return (
    <View className="flex-1 px-3 py-2">
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} className="flex-row flex-1">
          {row.map((btn) => (
            <SoundButton
              key={btn.id}
              button={btn}
              onPress={() => onButtonPress(btn)}
              onLongPress={() => onButtonLongPress(btn)}
              onPressOut={onButtonPressOut ? () => onButtonPressOut(btn) : undefined}
              isRecording={isRecordingButtonId === btn.id}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
