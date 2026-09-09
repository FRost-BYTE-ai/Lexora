import React from 'react';
import { X, Sparkles, CheckCircle2, ShieldCheck, Scale, Compass, Globe } from 'lucide-react';
import { ExplainabilityData } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ExplainabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: ExplainabilityData;
}

export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const { t } = useLanguage();

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {t.explainability.title}
              </h3>
              <p className="text-[11px] text-slate-500">
                {t.explainability.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t.accessibility.closeDialog}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Query Intent */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
              {t.explainability.queryUnderstood}
            </span>
            <p className="text-xs font-semibold text-slate-800">
              {data.queryUnderstood}
            </p>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[10px] uppercase font-bold tracking-wider">{t.explainability.languageDetected}</span>
              </div>
              <p className="text-xs font-bold text-slate-800">{data.detectedLanguage}</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Scale className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[10px] uppercase font-bold tracking-wider">{t.explainability.legalDomain}</span>
              </div>
              <p className="text-xs font-bold text-slate-800">{data.legalDomain}</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Compass className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[10px] uppercase font-bold tracking-wider">{t.explainability.jurisdictionApplied}</span>
              </div>
              <p className="text-xs font-bold text-slate-800">{data.jurisdictionApplied}</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] uppercase font-bold tracking-wider">{t.explainability.verificationStatus}</span>
              </div>
              <p className="text-xs font-bold text-emerald-700">{data.verificationStatus}</p>
            </div>
          </div>

          {/* Provisions & Sources */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">{t.explainability.retrievedReferences}</span>
              <span className="font-bold text-blue-700">{data.sourcesRetrievedCount} {t.explainability.verifiedSourcesCount}</span>
            </div>

            {data.provisionsList && data.provisionsList.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.provisionsList.map((prov, i) => (
                  <span key={i} className="text-[11px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-lg font-medium">
                    {prov}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Key Factors */}
          {data.keyFactors && data.keyFactors.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                {t.explainability.groundingFactors}
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {data.keyFactors.map((factor, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 border border-slate-200 leading-relaxed">
            {t.explainability.auditDisclaimer}
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer"
          >
            {t.explainability.closeAudit}
          </button>
        </div>
      </div>
    </div>
  );
};
