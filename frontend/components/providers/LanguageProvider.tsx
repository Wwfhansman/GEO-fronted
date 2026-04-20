"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  Language,
  normalizeLanguage,
  persistLanguage,
  readStoredLanguage,
} from "../../lib/i18n";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage: Language;
}) {
  const [language, setLanguageState] = useState<Language>(normalizeLanguage(initialLanguage));

  useEffect(() => {
    const storedLanguage = readStoredLanguage();
    if (storedLanguage && storedLanguage !== language) {
      setLanguageState(storedLanguage);
      return;
    }
    persistLanguage(language);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    persistLanguage(language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage: Language) => {
        setLanguageState(normalizeLanguage(nextLanguage));
      },
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return context ?? { language: "en", setLanguage: () => undefined };
}
