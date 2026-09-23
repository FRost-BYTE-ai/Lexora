import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, Scale } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ResearchStatusProps {
  isLoading: boolean;
}

export const ResearchStatus: React.FC<ResearchStatusProps> = ({ isLoading }) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0);
      return;
    }

    // Step progression simulation during research
    setCurrentStep(1);
    const t1 = setTimeout(() => setCurrentStep(2), 600);
    const t2 = setTimeout(() => setCurrentStep(3), 1300);
    const t3 = setTimeout(() => setCurrentStep(4), 2100);
    const t4 = setTimeout(() => setCurrentStep(5), 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  const steps = [
    { text: t.researching.stepQueryUnderstood },
    { text: t.researching.stepDomainIdentified },
    { text: t.researching.stepJurisdictionIdentified },
    { text: t.researching.stepSearchingSources },
    { text: t.researching.stepComparingProvisions },
    { text: t.researching.stepVerifyingEvidence }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto my-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#11192C] border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-900 text-white flex items-center justify-center animate-pulse">
            <Scale className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <span className="text-xs font-extrabold tracking-wider uppercase text-indigo-950 dark:text-indigo-200">
            {t.researching.title}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{t.common.loading}</span>
        </div>
      </div>

      {/* High-level processing stages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {steps.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div 
              key={idx}
              className={`flex items-center gap-2 p-2 rounded-xl transition-colors ${
                isDone 
                  ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200' 
                  : isCurrent 
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-semibold' 
                  : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex-shrink-0" />
              )}
              <span className="truncate">{step.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
