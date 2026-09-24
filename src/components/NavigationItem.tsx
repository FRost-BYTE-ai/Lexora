import React from 'react';
import { LucideIcon } from 'lucide-react';

interface NavigationItemProps {
  icon: LucideIcon;
  label: string;
  badge?: string | number;
  isSelected?: boolean;
  accent?: 'default' | 'gold' | 'purple';
  onClick: () => void;
  isCollapsed?: boolean;
}

export const NavigationItem: React.FC<NavigationItemProps> = ({
  icon: Icon,
  label,
  badge,
  isSelected = false,
  accent = 'default',
  onClick,
  isCollapsed = false
}) => {
  let textColor = 'text-[#17244F] dark:text-slate-300';
  let iconColor = 'text-[#6B7280] dark:text-slate-400';
  let hoverBg = 'hover:bg-slate-100 dark:hover:bg-slate-800/60';

  if (accent === 'gold') {
    textColor = 'text-[#C49A32] font-semibold';
    iconColor = 'text-[#C49A32]';
    hoverBg = 'hover:bg-[#FFFDF5] dark:hover:bg-amber-950/30';
  } else if (accent === 'purple') {
    textColor = 'text-[#4A43A5] font-semibold';
    iconColor = 'text-[#4A43A5]';
    hoverBg = 'hover:bg-[#F0EFFF] dark:hover:bg-indigo-950/30';
  }

  if (isSelected) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer bg-[#F0EFFF] text-[#37318F] dark:bg-indigo-950/60 dark:text-indigo-200 ${
          isCollapsed ? 'justify-center px-2' : ''
        }`}
        title={label}
      >
        <Icon className="w-4 h-4 flex-shrink-0 text-[#37318F] dark:text-indigo-300" />
        {!isCollapsed && <span className="flex-1 text-left truncate">{label}</span>}
        {!isCollapsed && badge !== undefined && (
          <span className="text-[11px] font-bold bg-[#37318F] text-white px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${textColor} ${hoverBg} ${
        isCollapsed ? 'justify-center px-2' : ''
      }`}
      title={label}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
      {!isCollapsed && <span className="flex-1 text-left truncate">{label}</span>}
      {!isCollapsed && badge !== undefined && (
        <span className="text-[11px] font-bold bg-[#F0EFFF] text-[#37318F] dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
};
