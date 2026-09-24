import React from 'react';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface StatusBadgeProps {
  label?: string;
  subText?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  subText
}) => {
  const { language } = useLanguage();

  const defaultLabel = language === 'ta'
    ? 'தானியங்கு சட்ட வினவல் தேர்வு செயலில் உள்ளது'
    : 'Automatic Legal Query Selection Active';

  const defaultSubText = language === 'ta'
    ? 'தமிழ் மற்றும் ஆங்கிலம் ஆதரிக்கப்படுகிறது'
    : 'Supports Tamil & English';

  return (
    <div className="w-full flex items-center justify-between mt-3 px-1">
      {/* Gold outlined pill */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-[#C49A32] text-[#C49A32] bg-transparent">
        <Sparkles className="w-3.5 h-3.5 text-[#C49A32] flex-shrink-0" />
        <span>{label || defaultLabel}</span>
      </div>

      {/* Right aligned small text */}
      <span className="text-xs text-[#6B7280] dark:text-slate-400 font-medium">
        {subText || defaultSubText}
      </span>
    </div>
  );
};
