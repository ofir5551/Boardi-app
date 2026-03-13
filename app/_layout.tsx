import "../global.css";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#ffffff" },
        headerTintColor: "#0d9488",
        headerTitleStyle: { fontWeight: "bold", color: "#111827" },
        contentStyle: { backgroundColor: "#f3f4f6" },
      }}
    />
  );
}
