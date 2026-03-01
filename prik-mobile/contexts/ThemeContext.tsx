import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { LightColors, DarkColors } from "../constants/colors";

type ThemeMode = "light" | "dark" | "system";
type ColorScheme = typeof LightColors;

interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  colors: ColorScheme;
  setTheme: (t: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  isDark: false,
  colors: LightColors,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>("system");

  useEffect(() => {
    SecureStore.getItemAsync("theme").then((val) => {
      if (val === "light" || val === "dark" || val === "system") {
        setThemeState(val);
      }
    });
  }, []);

  const isDark = theme === "dark" || (theme === "system" && systemScheme === "dark");
  const colors = isDark ? DarkColors : LightColors;

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    SecureStore.setItemAsync("theme", t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
export const useColors = () => useContext(ThemeContext).colors;
