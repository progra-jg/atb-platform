import { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { colors as lightColors, darkColors } from "./colors";

type Theme = typeof lightColors;

const ThemeContext = createContext<{ colors: Theme; isDark: boolean; toggleTheme: () => void }>({
  colors: lightColors,
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === "dark");

  useEffect(() => {
    setIsDark(systemScheme === "dark");
  }, [systemScheme]);

  return (
    <ThemeContext.Provider value={{ colors: isDark ? darkColors : lightColors, isDark, toggleTheme: () => setIsDark((p) => !p) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
