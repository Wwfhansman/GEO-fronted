export type Language = "en" | "zh";

export const LANGUAGE_STORAGE_KEY = "giugeo-language";
export const LANGUAGE_COOKIE_KEY = "giugeo-language";

export function normalizeLanguage(value?: string | null): Language {
  return value === "zh" ? "zh" : "en";
}

export function persistLanguage(language: Language) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Ignore storage failures
  }

  document.cookie = `${LANGUAGE_COOKIE_KEY}=${language}; path=/; max-age=31536000; samesite=lax`;
}

export function readStoredLanguage(): Language | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) {
      return normalizeLanguage(stored);
    }
  } catch {
    // Ignore storage failures
  }

  const cookieMatch = document.cookie.match(/(?:^|; )giugeo-language=([^;]+)/);
  return cookieMatch ? normalizeLanguage(cookieMatch[1]) : null;
}
