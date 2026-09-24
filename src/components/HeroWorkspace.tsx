import React from 'react';
import { Jurisdiction } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LexoraLogo } from './LexoraLogo';

interface HeroWorkspaceProps {
  onSelectPrompt: (query: string) => void;
  jurisdiction: Jurisdiction;
}

export const HeroWorkspace: React.FC<HeroWorkspaceProps> = ({
  onSelectPrompt,
  jurisdiction
}) => {
  const { t } = useLanguage();

  const quickPrompts = [
    {
      title: t.hero.prompts.section420,
      query: 'What is the punishment for physical assault under Indian criminal law?'
    },
    {
      title: t.hero.prompts.tenancyRights,
      query: 'What are the rights of a PACS member under the Tamil Nadu Cooperative Societies Act?'
    },
    {
      title: t.hero.prompts.draftNotice,
      query: 'How can I appeal a rejected PMFBY crop loss insurance claim in Tamil Nadu?'
    },
    {
      title: t.hero.prompts.checkDocument,
      query: 'What notice period is legally required before evicting a tenant under Tamil Nadu Tenancy Act 2017?'
    },
    {
      title: 'கூட்டுறவு சங்க உறுப்பினர் உரிமைகள்',
      query: 'கூட்டுறவு சங்க உறுப்பினரின் உரிமைகள் என்ன?'
    },
    {
      title: 'PACS Member Removal Procedure',
      query: 'PACS member ah remove panna enna procedure under Tamil Nadu Cooperative Act?'
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto px-4 py-8 text-center select-none">
      {/* ChatGPT-style Icon Emblem */}
      <div className="mb-5 scale-125">
        <LexoraLogo size="lg" showText={false} />
      </div>

      {/* Main Title */}
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#17244F] dark:text-white mb-2">
        {t.hero.title}
      </h1>

      {/* Subtitle */}
      <p className="text-sm text-[#73777F] dark:text-slate-400 max-w-md leading-relaxed mb-8">
        {t.hero.subtitle}
      </p>

      {/* Minimal Suggestion Chips (like ChatGPT) - No bulky cards */}
      <div className="w-full">
        <div className="text-[11px] font-semibold text-[#8B93A7] dark:text-slate-500 uppercase tracking-wider mb-3">
          {t.quickPrompts.title}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
          {quickPrompts.map((p) => (
            <button
              key={p.title}
              type="button"
              onClick={() => onSelectPrompt(p.query)}
              className="px-3.5 py-2.5 rounded-xl text-xs text-[#17244F] dark:text-slate-200 bg-white dark:bg-[#101522] border border-[#E4E1DA] dark:border-slate-800 hover:border-[#17244F] dark:hover:border-slate-600 hover:bg-[#FAF9F6] dark:hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
            >
              <span className="font-medium truncate mr-2">{p.title}</span>
              <span className="text-[#8B93A7] group-hover:text-[#17244F] dark:group-hover:text-white transition-colors flex-shrink-0">
                ↵
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
