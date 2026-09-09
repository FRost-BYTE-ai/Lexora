import React from 'react';
import { HelpCircle, CornerDownRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FollowUpQuestionsProps {
  questions?: string[];
  onSelect: (question: string) => void;
}

export const FollowUpQuestions: React.FC<FollowUpQuestionsProps> = ({ questions = [], onSelect }) => {
  const { t } = useLanguage();

  if (!questions || questions.length === 0) return null;

  return (
    <div className="mt-3.5 pt-3 border-t border-slate-100" id="follow-up-questions">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
        {t.followUp.title}
      </p>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(q)}
            className="text-left text-xs bg-white hover:bg-blue-50/80 text-slate-700 hover:text-blue-900 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 group cursor-pointer"
          >
            <CornerDownRight className="w-3 h-3 text-blue-500 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            <span>{q}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
