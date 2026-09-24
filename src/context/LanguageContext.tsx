import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LanguageMode } from '../types';
import { TranslationStructure, translations, getTranslations } from '../locales';

interface LanguageContextType {
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  t: TranslationStructure;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'lextamil_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ta' || saved === 'en' || saved === 'tanglish' || saved === 'hi') {
        return saved;
      }
    } catch (e) {
      console.warn('Unable to read language preference from localStorage:', e);
    }
    return 'en'; // Match reference image default (English selected)
  });

  const setLanguage = (lang: LanguageMode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Unable to persist language preference to localStorage:', e);
    }
  };

  const t = getTranslations(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useTranslation = (): TranslationStructure => {
  const { t } = useLanguage();
  return t;
};
