import React, { useState } from 'react';
import { Shield, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { RiskLevel } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface RiskBadgeProps {
  level?: RiskLevel;
  reason?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level = 'low', reason }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { t } = useLanguage();

  const config = {
    low: {
      label: t.riskBadges.low,
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      dot: 'bg-emerald-500',
      icon: Shield,
      defaultReason: t.riskBadges.lowTooltip
    },
    medium: {
      label: t.riskBadges.medium,
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      dot: 'bg-amber-500',
      icon: AlertTriangle,
      defaultReason: t.riskBadges.mediumTooltip
    },
    high: {
      label: t.riskBadges.high,
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      dot: 'bg-rose-500',
      icon: AlertCircle,
      defaultReason: t.riskBadges.highTooltip
    }
  }[level];

  const IconComponent = config.icon;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        id={`risk-badge-${level}`}
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} transition-all hover:shadow-xs cursor-help`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
        <IconComponent className="w-3.5 h-3.5" />
        <span>{config.label}</span>
      </button>

      {showTooltip && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-72 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-200 mb-1">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>{t.riskBadges.riskIndicatorTitle}</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {reason || config.defaultReason || t.riskBadges.riskGeneralNotice}
          </p>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
            {t.riskBadges.riskGeneralNotice}
          </div>
        </div>
      )}
    </div>
  );
};
