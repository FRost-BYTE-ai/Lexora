import React, { useState } from 'react';
import { CheckSquare, Square, ListOrdered, Building2, Clock, CheckCircle } from 'lucide-react';
import { ActionStep } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ActionPlanProps {
  steps?: ActionStep[];
}

export const ActionPlan: React.FC<ActionPlanProps> = ({ steps = [] }) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const { t } = useLanguage();

  if (!steps || steps.length === 0) return null;

  const toggleStep = (order: number) => {
    setCompletedSteps(prev => 
      prev.includes(order) ? prev.filter(o => o !== order) : [...prev, order]
    );
  };

  return (
    <div className="mt-4 p-4 bg-slate-50/80 border border-slate-200 rounded-2xl" id="action-plan-container">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-700 text-white flex items-center justify-center text-xs">
            <ListOrdered className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 tracking-tight">
              {t.actionPlan.title}
            </h4>
            <p className="text-[10px] text-slate-500">
              {t.actionPlan.subtitle}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
          {completedSteps.length} {t.actionPlan.doneCount} {steps.length} {t.common.done}
        </span>
      </div>

      <div className="space-y-2.5">
        {steps.map((step) => {
          const isDone = completedSteps.includes(step.order);
          return (
            <div
              key={step.order}
              onClick={() => toggleStep(step.order)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                isDone 
                  ? 'bg-emerald-50/60 border-emerald-200 text-slate-500' 
                  : 'bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-xs'
              }`}
            >
              <button 
                type="button" 
                className="mt-0.5 text-slate-400 hover:text-blue-600 focus:outline-none"
                aria-label={`${t.actionPlan.stepPrefix} ${step.order}`}
              >
                {isDone ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300" />
                )}
              </button>

              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {t.actionPlan.stepPrefix} {step.order}
                  </span>
                  <span className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {step.title}
                  </span>
                </div>

                <p className={`text-xs leading-relaxed ${isDone ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                  {step.description}
                </p>

                {(step.authority || step.timeline) && (
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500 flex-wrap">
                    {step.authority && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {step.authority}
                      </span>
                    )}
                    {step.timeline && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {step.timeline}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] text-slate-400 italic">
        {t.actionPlan.citizenNotice}
      </p>
    </div>
  );
};
