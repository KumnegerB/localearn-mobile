import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, translations } from './translations';

const LANGUAGE_KEY = '@sira_language';

interface LanguageState {
  language: Language;
  isReady: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  loadLanguage: () => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const translateText = (
  lang: Language,
  key: string,
  params?: Record<string, string | number>
): string => {
  const keys = key.split('.');
  let current: any = translations[lang];

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      current = undefined;
      break;
    }
  }

  // Fallback to English if missing in current language
  if (current === undefined && lang !== 'en') {
    let fallback: any = translations.en;
    for (const k of keys) {
      if (fallback && typeof fallback === 'object' && k in fallback) {
        fallback = fallback[k];
      } else {
        fallback = undefined;
        break;
      }
    }
    current = fallback;
  }

  if (typeof current !== 'string') {
    return key;
  }

  if (params) {
    let result = current;
    for (const [pKey, pVal] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    }
    return result;
  }

  return current;
};

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'en',
  isReady: false,

  loadLanguage: async () => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (stored === 'en' || stored === 'am') {
        set({ language: stored, isReady: true });
        return;
      }
    } catch {
      // fallback silently
    }
    set({ isReady: true });
  },

  setLanguage: async (newLang: Language) => {
    set({ language: newLang });
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, newLang);
    } catch {
      // fallback silently
    }
  },

  t: (key: string, params?: Record<string, string | number>) => {
    return translateText(get().language, key, params);
  },
}));

// Auto-hydrate on startup
useLanguageStore.getState().loadLanguage();

export const useTranslation = () => {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const isReady = useLanguageStore((s) => s.isReady);

  const t = (key: string, params?: Record<string, string | number>) => {
    return translateText(language, key, params);
  };

  return { t, language, setLanguage, isReady, isAmharic: language === 'am' };
};

