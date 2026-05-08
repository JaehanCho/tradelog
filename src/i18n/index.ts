import { useEffect } from "react";
import { create } from "zustand";
import { api } from "../lib/api";
import { messages } from "./messages";
import type { Locale, Messages } from "./messages";

export type { Locale, Messages };
export { messages };

interface LocaleState {
  locale: Locale;
  loaded: boolean;
  load: () => Promise<void>;
  setLocale: (next: Locale) => Promise<void>;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: "ko",
  loaded: false,

  load: async () => {
    try {
      const s = await api.getSettings();
      const raw = s.locale;
      const locale: Locale = raw === "en" ? "en" : "ko";
      set({ locale, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  setLocale: async (next) => {
    set({ locale: next });
    try {
      await api.setSetting("locale", next);
    } catch (e) {
      console.error("[i18n] failed to persist locale:", e);
    }
  },
}));

/** Returns the current locale's message bundle. Re-renders on locale change. */
export function useT(): Messages {
  const locale = useLocaleStore((s) => s.locale);
  return messages[locale];
}

/** Keeps `<html lang="...">` in sync with the active locale. Call once near root. */
export function useDocumentLang(): void {
  const locale = useLocaleStore((s) => s.locale);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
}
