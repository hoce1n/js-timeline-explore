import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "runtimejs-theme";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Inline script injected into <head> so the stored theme is applied to the
 * <html> element before first paint (prevents a flash of the wrong theme).
 * Dark is the app's default identity; light only applies when explicitly
 * stored in localStorage.
 */
export const themeInitScript = `(function(){var el=document.documentElement;var dark=true;try{dark=localStorage.getItem("${STORAGE_KEY}")!=="light";}catch(e){}el.classList.toggle("dark",dark);})();`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  // Sync state with any stored preference on mount (the init script already
  // painted the right theme; this keeps React's state in agreement with it).
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Storage unavailable (private mode) — keep the dark default.
    }
    if (stored === "light") setTheme("light");
  }, []);

  useEffect(() => {
    const dark = theme === "dark";
    document.documentElement.classList.toggle("dark", dark);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage unavailable — the toggle still works for this visit.
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#1e1e1e" : "#eef0f4");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
