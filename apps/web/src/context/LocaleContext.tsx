import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import enMessages from '../../messages/en.json';
import frMessages from '../../messages/fr.json';
import esMessages from '../../messages/es.json';

export type Locale = 'en' | 'fr' | 'es';

export const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
];

// Maps country codes returned by IP geolocation → supported locale
const COUNTRY_LOCALE: Record<string, Locale> = {
  // English-speaking countries
  US: 'en', GB: 'en', AU: 'en', CA: 'en', NZ: 'en', IE: 'en', ZA: 'en',
  // French-speaking countries
  FR: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', MC: 'fr', SN: 'fr', CI: 'fr',
  // Spanish-speaking countries
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es',
  BO: 'es', PY: 'es', UY: 'es', EC: 'es', GT: 'es', HN: 'es', SV: 'es',
  NI: 'es', CR: 'es', PA: 'es', DO: 'es', CU: 'es',
};

const STORAGE_KEY = 'envsync_locale';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MESSAGES: Record<Locale, any> = {
  en: enMessages,
  fr: frMessages,
  es: esMessages,
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: typeof enMessages;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  messages: enMessages,
});

export function useLocale() {
  return useContext(LocaleContext);
}

// Derive locale from browser language string (e.g. "fr-FR" → "fr")
function fromBrowserLang(lang: string): Locale {
  const code = lang.split('-')[0].toLowerCase();
  if (code === 'fr') return 'fr';
  if (code === 'es') return 'es';
  return 'en';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    // 1. Saved user preference wins immediately — no network call needed
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && MESSAGES[saved]) {
      setLocaleState(saved);
      return;
    }

    // 2. Try IP geolocation — async, non-blocking
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

    fetch('https://ipapi.co/json/', { signal: controller.signal })
      .then((r) => r.json())
      .then((data: { country_code?: string }) => {
        const detected = data.country_code
          ? (COUNTRY_LOCALE[data.country_code] ?? fromBrowserLang(navigator.language))
          : fromBrowserLang(navigator.language);
        setLocaleState(detected);
      })
      .catch(() => {
        // 3. IP call failed — fall back to browser language
        setLocaleState(fromBrowserLang(navigator.language));
      })
      .finally(() => clearTimeout(timeout));

    return () => controller.abort();
  }, []);

  function setLocale(next: Locale) {
    localStorage.setItem(STORAGE_KEY, next);
    setLocaleState(next);
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, messages: MESSAGES[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}
