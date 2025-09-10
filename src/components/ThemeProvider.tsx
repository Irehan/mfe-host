import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    return saved || "system";
  });

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? getSystemTheme() : theme;

  // Update <html> and localStorage when theme changes
  useEffect(() => {
    const html = document.documentElement;
    if (resolvedTheme === "dark") {
      html.setAttribute("data-theme", "dark");
    } else {
      // IMPORTANT: do NOT set "light" — remove the attribute for light mode
      html.removeAttribute("data-theme");
    }
    localStorage.setItem("theme", theme);
  }, [theme, resolvedTheme]);

  // Watch system changes only if theme = system
  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    const handler = () => {
      const next = getSystemTheme();
      const html = document.documentElement;
      if (next === "dark") html.setAttribute("data-theme", "dark");
      else html.removeAttribute("data-theme");
    };

    // Newer browsers
    mql.addEventListener?.("change", handler);
    // Fallback for older
    // @ts-ignore
    mql.addListener?.(handler);

    return () => {
      mql.removeEventListener?.("change", handler);
      // @ts-ignore
      mql.removeListener?.(handler);
    };
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggle: () =>
        setTheme((prev) => {
          const isDark =
            prev === "dark" ||
            (prev === "system" && getSystemTheme() === "dark");
          return isDark ? "light" : "dark";
        }),
    }),
    [theme, resolvedTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

export default ThemeProvider;
