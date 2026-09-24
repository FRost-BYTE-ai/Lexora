import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';

interface CapabilityCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}

export const CapabilityCard: React.FC<CapabilityCardProps> = ({
  icon: Icon,
  title,
  description,
  onClick
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group p-5 rounded-[18px] bg-white dark:bg-[#101728] border border-[#E7E5E0] dark:border-slate-800 hover:border-[#37318F] dark:hover:border-indigo-500 hover:shadow-xs text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[120px]"
    >
      <div className="flex items-start justify-between w-full">
        <div className="w-10 h-10 rounded-xl bg-[#F0EFFF] dark:bg-indigo-950/60 text-[#37318F] dark:text-indigo-300 flex items-center justify-center group-hover:bg-[#E3E0FA] transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#37318F] dark:group-hover:text-indigo-400 transition-colors" />
      </div>

      <div className="mt-4">
        <h3 className="text-[15px] font-bold text-[#17244F] dark:text-white group-hover:text-[#37318F] dark:group-hover:text-indigo-300 transition-colors">
          {title}
        </h3>
        <p className="text-xs text-[#6B7280] dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>
    </button>
  );
};
