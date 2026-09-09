import React from 'react';
import { User, GraduationCap, Scale, MessageSquareHeart } from 'lucide-react';
import { ExplanationLevel } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ExplanationSelectorProps {
  level: ExplanationLevel;
  onChange: (level: ExplanationLevel) => void;
}

export const ExplanationSelector: React.FC<ExplanationSelectorProps> = ({
  level,
  onChange
}) => {
  const { t } = useLanguage();

  const levels: Array<{
    id: ExplanationLevel;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'citizen', label: t.header.levelCitizen, description: t.header.descCitizen, icon: User },
    { id: 'student', label: t.header.levelStudent, description: t.header.descStudent, icon: GraduationCap },
    { id: 'professional', label: t.header.levelAdvocate, description: t.header.descAdvocate, icon: Scale },
    { id: 'simple_tamil', label: t.header.levelSimpleTamil, description: t.header.descSimpleTamil, icon: MessageSquareHeart }
  ];

  return (
    <div 
      className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200" 
      id="explanation-level-selector"
      role="group"
      aria-label={t.accessibility.selectExplanationLevel}
    >
      <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 hidden sm:inline">
        {t.header.explanationLevel}
      </span>
      {levels.map((item) => {
        const IconComponent = item.icon;
        const isSelected = level === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            title={item.description}
            aria-pressed={isSelected}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isSelected
                ? 'bg-white text-blue-900 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <IconComponent className={`w-3 h-3 ${isSelected ? 'text-blue-700' : 'text-slate-400'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
