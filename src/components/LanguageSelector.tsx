import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageMode } from '../types';

interface LanguageSelectorProps {
  language?: LanguageMode;
  onLanguageChange?: (lang: LanguageMode) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  language: propLanguage,
  onLanguageChange: propOnChange
}) => {
  const { language: ctxLanguage, setLanguage: ctxSetLanguage, t } = useLanguage();
  const language = propLanguage || ctxLanguage;
  const onLanguageChange = propOnChange || ctxSetLanguage;

  const options: Array<{ id: LanguageMode; label: string; title: string }> = [
    { id: 'ta', label: 'தமிழ்', title: t.common.inTamil },
    { id: 'en', label: 'English', title: t.common.inEnglish },
    { id: 'tanglish', label: 'Tanglish', title: t.common.inTanglish },
    { id: 'hi', label: 'हिन्दी', title: t.common.inHindi }
  ];

  return (
    <div 
      className="inline-flex p-1 bg-slate-100 rounded-full border border-slate-200" 
      id="language-mode-selector"
      role="group"
      aria-label={t.accessibility.selectLanguage}
    >
      {options.map((opt) => {
        const isSelected = language === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onLanguageChange(opt.id)}
            aria-pressed={isSelected}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              isSelected
                ? 'bg-white text-blue-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
            title={opt.title}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
