import { LanguageMode } from '../types';
import { TranslationStructure } from './types';
import { enTranslations } from './en';
import { taTranslations } from './ta';
import { tanglishTranslations } from './tanglish';
import { hiTranslations } from './hi';

export * from './types';
export { enTranslations } from './en';
export { taTranslations } from './ta';
export { tanglishTranslations } from './tanglish';
export { hiTranslations } from './hi';

export const translations: Record<LanguageMode, TranslationStructure> = {
  ta: taTranslations,
  en: enTranslations,
  tanglish: tanglishTranslations,
  hi: hiTranslations
};

export function getTranslations(lang: LanguageMode): TranslationStructure {
  return translations[lang] || translations.ta;
}
