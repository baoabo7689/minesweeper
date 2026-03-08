"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslations, getLanguageFromStorage, setLanguageToLocalStorage } from '@/i18n';

interface LanguageContextProps {
  language: string;
  translations: any;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState(getLanguageFromStorage());
  const [translations, setTranslations] = useState(getTranslations(language));

  useEffect(() => {
    setTranslations(getTranslations(language));
    setLanguageToLocalStorage(language);
  }, [language]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, translations, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
