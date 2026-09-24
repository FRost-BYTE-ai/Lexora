import React from 'react';
import { MapPin, Award, Camera } from 'lucide-react';
import { Jurisdiction } from '../types';

interface ModeSelectorProps {
  jurisdiction: Jurisdiction;
  onSelectJurisdiction: (j: Jurisdiction) => void;
  onOpenSchemes?: () => void;
  onOpenKiosk?: () => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  jurisdiction,
  onSelectJurisdiction,
  onOpenSchemes,
  onOpenKiosk
}) => {
  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {/* Tamil Nadu Mode / All India Segmented Control */}
      <div className="inline-flex items-center bg-[#F3F2EE] dark:bg-slate-800 p-0.5 rounded-full border border-[#E7E5E0] dark:border-slate-700 text-xs font-semibold">
        <button
          type="button"
          onClick={() => onSelectJurisdiction('TN')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            jurisdiction === 'TN'
              ? 'bg-white dark:bg-[#101728] text-[#17244F] dark:text-white shadow-2xs border border-slate-200/80 dark:border-slate-700'
              : 'text-[#6B7280] dark:text-slate-400 hover:text-[#17244F]'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-[#37318F]" />
          <span>Tamil Nadu Mode</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectJurisdiction('IN')}
          className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            jurisdiction === 'IN'
              ? 'bg-white dark:bg-[#101728] text-[#17244F] dark:text-white shadow-2xs border border-slate-200/80 dark:border-slate-700'
              : 'text-[#6B7280] dark:text-slate-400 hover:text-[#17244F]'
          }`}
        >
          All India
        </button>
      </div>

      {/* Schemes Pill Button */}
      {onOpenSchemes && (
        <button
          type="button"
          onClick={onOpenSchemes}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#101728] border border-[#C49A32] text-[#C49A32] text-xs font-semibold hover:bg-[#FFFDF7] dark:hover:bg-amber-950/30 transition-colors shadow-2xs cursor-pointer"
        >
          <Award className="w-3.5 h-3.5 text-[#C49A32]" />
          <span>Schemes</span>
        </button>
      )}

      {/* Kiosk Assist Pill Button */}
      {onOpenKiosk && (
        <button
          type="button"
          onClick={onOpenKiosk}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#101728] border border-[#4A43A5] text-[#4A43A5] text-xs font-semibold hover:bg-[#F0EFFF] dark:hover:bg-indigo-950/30 transition-colors shadow-2xs cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5 text-[#4A43A5]" />
          <span>Kiosk Assist</span>
        </button>
      )}
    </div>
  );
};
