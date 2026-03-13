import { View, Text, Switch } from "react-native";
import { Stack } from "expo-router";
import { useThemeStore } from "@/src/store/themeStore";

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <View className="flex-1 bg-gray-100 dark:bg-gray-900 px-4 pt-6">
      <Stack.Screen options={{ title: "Settings" }} />

      <View className="bg-white dark:bg-gray-800 rounded-xl px-4 py-4 flex-row items-center justify-between">
        <Text className="text-gray-900 dark:text-gray-100 text-base font-medium">
          Dark Mode
        </Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: "#d1d5db", true: "#2dd4bf" }}
          thumbColor="#ffffff"
        />
      </View>
    </View>
  );
}
