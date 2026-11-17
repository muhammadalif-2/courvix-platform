"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { translate } from "@/lib/locales";
import "./preferences.css";
import "./experience.css";
const Context = createContext({
  locale: "en",
  theme: "light",
  setTheme: (_v: string) => {},
  t: (s: string) => translate(s),
});
export const usePreferences = () => useContext(Context);
export function T({ children }: { children: string }) {
  const { t } = usePreferences();
  return (
    <>
      {children.startsWith(" ") ? " " : ""}
      {t(children.trim())}
      {children.endsWith(" ") ? " " : ""}
    </>
  );
}
export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState("light"),
    [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("courvix-preferences") || "{}",
      );
      setTheme(
        ["light", "dark", "system"].includes(saved.theme)
          ? saved.theme
          : "light",
      );
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem("courvix-preferences", JSON.stringify({ theme }));
    } catch {}
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.lang = "en";
      document.documentElement.dir = "ltr";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, ready]);
  return (
    <Context.Provider
      value={{ locale: "en", theme, setTheme, t: (s) => translate(s) }}
    >
      {children}
    </Context.Provider>
  );
}
export function PreferenceControls({
  expanded = false,
}: {
  expanded?: boolean;
}) {
  const { theme, setTheme } = usePreferences();
  return (
    <div className={"preference-controls " + (expanded ? "expanded" : "")}>
      <button
        className="theme-switch"
        type="button"
        title="Appearance"
        aria-label={"Appearance: " + (theme === "dark" ? "Dark" : "Light")}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? <Moon size={17} /> : <Sun size={17} />}
        <span>{theme === "dark" ? "Dark" : "Light"}</span>
      </button>
    </div>
  );
}
