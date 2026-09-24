import React, { useState } from 'react';
import { BookOpen, ExternalLink, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { LegalSource } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface SourcePanelProps {
  sources?: LegalSource[];
}

export const SourcePanel: React.FC<SourcePanelProps> = ({ sources = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguage();

  if (!sources || sources.length === 0) return null;

  const displaySources = isExpanded ? sources : sources.slice(0, 2);

  return (
    <div className="mt-4 pt-3 border-t border-slate-100" id="legal-source-panel">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-blue-700" />
          {t.sources.title} ({sources.length})
        </p>
        {sources.length > 2 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-0.5 cursor-pointer"
          >
            {isExpanded ? (
              <>{t.sources.showLess} <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>{t.sources.viewAll} ({sources.length}) <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {displaySources.map((source, idx) => (
          <div
            key={idx}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/80 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-1.5 mb-1">
                <span className="font-semibold font-serif text-xs text-slate-900 line-clamp-1">
                  {source.title}
                </span>
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 p-0.5 rounded hover:bg-blue-50 transition-colors flex-shrink-0"
                    title={t.sources.openSource}
                    aria-label={t.sources.openSource}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <div className="flex flex-wrap gap-1 text-[10px] text-slate-600 mb-1.5">
                {source.section && (
                  <span className="bg-blue-100 text-blue-800 font-medium px-1.5 py-0.5 rounded">
                    {source.section}
                  </span>
                )}
                {source.source && (
                  <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded truncate max-w-[150px]">
                    {source.source}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-200/60">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="w-2.5 h-2.5" /> {t.sources.verifiedReference}
              </span>
              {source.last_verified && <span>{t.sources.checked}: {source.last_verified}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
