import React from 'react';
import { Landmark, Globe2 } from 'lucide-react';
import { Jurisdiction } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface JurisdictionSelectorProps {
  jurisdiction: Jurisdiction;
  onChange: (j: Jurisdiction) => void;
}

export const JurisdictionSelector: React.FC<JurisdictionSelectorProps> = ({
  jurisdiction,
  onChange
}) => {
  const { t } = useLanguage();

  return (
    <div 
      className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200" 
      id="jurisdiction-mode-selector"
      role="group"
      aria-label={t.accessibility.selectJurisdiction}
    >
      <button
        type="button"
        onClick={() => onChange('TN')}
        aria-pressed={jurisdiction === 'TN'}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
          jurisdiction === 'TN'
            ? 'bg-blue-900 text-white shadow-2xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title={t.header.tnModeTooltip}
      >
        <Landmark className="w-3.5 h-3.5 text-amber-400" />
        <span>{t.header.tamilNaduMode}</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('IN')}
        aria-pressed={jurisdiction === 'IN'}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
          jurisdiction === 'IN'
            ? 'bg-blue-900 text-white shadow-2xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        title={t.header.inModeTooltip}
      >
        <Globe2 className="w-3.5 h-3.5 text-blue-300" />
        <span>{t.header.allIndiaMode}</span>
      </button>
    </div>
  );
};
