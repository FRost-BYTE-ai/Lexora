import React from 'react';
import { LanguageMode } from '../types';

interface LanguageSelectorProps {
  language: LanguageMode;
  onSelectLanguage: (lang: LanguageMode) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  language,
  onSelectLanguage
}) => {
  const options: Array<{ id: LanguageMode; label: string }> = [
    { id: 'ta', label: 'தமிழ்' },
    { id: 'en', label: 'English' },
    { id: 'tanglish', label: 'Tanglish' },
    { id: 'hi', label: 'हिन्दी' }
  ];

  return (
    <div className="inline-flex items-center bg-[#F3F2EE] dark:bg-slate-800 p-0.5 rounded-full border border-[#E7E5E0] dark:border-slate-700 text-xs font-semibold">
      {options.map((opt) => {
        const isSelected = language === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelectLanguage(opt.id)}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              isSelected
                ? 'bg-white dark:bg-[#101728] text-[#17244F] dark:text-white font-bold shadow-2xs border border-slate-200/80 dark:border-slate-700'
                : 'text-[#6B7280] dark:text-slate-400 hover:text-[#17244F] dark:hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
