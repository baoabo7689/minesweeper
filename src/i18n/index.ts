import * as en from './en';
import * as vi from './vi';

export const defaultLocale = 'en';

export const translations = en.translations;

export function setLanguageToLocalStorage(language: string) {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('language', language);
  }
}

export function getLanguageFromStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('language') || defaultLocale;
  }

  return defaultLocale;
}

export function getTranslations(locale = getLanguageFromStorage()) {
  switch (locale) {
    case 'vi':
      return vi.translations;
    case 'en':
    default:
      return en.translations;
  }
}

export default { defaultLocale, getTranslations };
