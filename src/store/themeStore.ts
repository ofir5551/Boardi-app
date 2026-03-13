import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "theme_preference";

type ThemeStore = {
  isDark: boolean;
  isLoaded: boolean;
  loadTheme: () => Promise<void>;
  toggleTheme: () => void;
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  isDark: false,
  isLoaded: false,

  loadTheme: async () => {
    try {
      const value = await AsyncStorage.getItem(THEME_KEY);
      if (value !== null) {
        set({ isDark: value === "true", isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  toggleTheme: () => {
    const next = !get().isDark;
    set({ isDark: next });
    AsyncStorage.setItem(THEME_KEY, String(next)).catch(() => {});
  },
}));

export const lightColors = {
  headerBg: "#ffffff",
  headerTint: "#0d9488",
  headerTitle: "#111827",
  contentBg: "#f3f4f6",
};

export const darkColors = {
  headerBg: "#1f2937",
  headerTint: "#2dd4bf",
  headerTitle: "#f9fafb",
  contentBg: "#111827",
};
