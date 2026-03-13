import "../global.css";
import { useEffect } from "react";
import { Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore, lightColors, darkColors } from "@/src/store/themeStore";

export default function RootLayout() {
  const router = useRouter();
  const { isDark, isLoaded, loadTheme } = useThemeStore();
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  useEffect(() => {
    setColorScheme(isDark ? "dark" : "light");
  }, [isDark, setColorScheme]);

  const colors = isDark ? darkColors : lightColors;

  if (!isLoaded) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTintColor: colors.headerTint,
        headerTitleStyle: { fontWeight: "bold", color: colors.headerTitle },
        contentStyle: { backgroundColor: colors.contentBg },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Boardi",
          headerRight: () => (
            <Pressable onPress={() => router.push("/settings")} hitSlop={8}>
              <Ionicons
                name="settings-outline"
                size={24}
                color={colors.headerTint}
              />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
    </Stack>
  );
}
