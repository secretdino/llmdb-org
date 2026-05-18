"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import en from "@/i18n/en.json";
import es from "@/i18n/es.json";
import de from "@/i18n/de.json";

export type Language = "en" | "es" | "de";

// Supported dictionary assets mapping
const dictionaries = { en, es, de };

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

/**
 * Recursive resolver to fetch deep nested string values from a JSON object
 */
function getNestedValue(obj: Record<string, unknown> | unknown, path: string): string | null {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }
  return typeof current === "string" ? current : null;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Load user preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("llmdb_locale") as Language;
    if (saved === "en" || saved === "es" || saved === "de") {
      setLanguageState(saved);
    } else if (typeof window !== "undefined" && window.navigator) {
      const browserLang = window.navigator.language.split("-")[0];
      if (browserLang === "es") setLanguageState("es");
      else if (browserLang === "de") setLanguageState("de");
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("llmdb_locale", lang);
  };

  /**
   * Translates a string path using recursive path lookup with fallback logic
   */
  const t = (path: string): string => {
    // 1. Attempt translation in active language
    const dict = dictionaries[language];
    const resolved = getNestedValue(dict, path);
    if (resolved !== null) return resolved;

    // 2. Fallback to English dictionary
    if (language !== "en") {
      const englishResolved = getNestedValue(en, path);
      if (englishResolved !== null) return englishResolved;
    }

    // 3. Worst-case scenario: return key path itself
    return path;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
