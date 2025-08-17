"use client";

import { useEffect, useMemo } from "react";
import { useLocalStorage } from "./use-local-storage";

export type Theme = "light" | "dark" | "system";

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>("theme", "system");

  const systemPrefersDark = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }, []);

  const isDark = theme === "dark" || (theme === "system" && systemPrefersDark);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

  return { theme, setTheme, isDark } as const;
}
