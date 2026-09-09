import React from 'react';
import { 
  Home, 
  Users, 
  Briefcase, 
  ShoppingBag, 
  ShieldAlert, 
  Coins, 
  Landmark, 
  Scale 
} from 'lucide-react';
import { LegalDomain } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface DomainSelectorProps {
  selectedDomain: LegalDomain;
  onSelectDomain: (domain: LegalDomain) => void;
}

export const DOMAIN_ICONS: Record<LegalDomain, React.ComponentType<{ className?: string }>> = {
  general: Scale,
  property: Home,
  consumer: ShoppingBag,
  family: Users,
  employment: Briefcase,
  criminal: ShieldAlert,
  finance: Coins,
  government: Landmark
};

export const DOMAINS: Array<{
  id: LegalDomain;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'general', icon: Scale },
  { id: 'property', icon: Home },
  { id: 'consumer', icon: ShoppingBag },
  { id: 'family', icon: Users },
  { id: 'employment', icon: Briefcase },
  { id: 'criminal', icon: ShieldAlert },
  { id: 'finance', icon: Coins },
  { id: 'government', icon: Landmark }
];

export const DomainSelector: React.FC<DomainSelectorProps> = ({
  selectedDomain,
  onSelectDomain
}) => {
  const { t } = useLanguage();

  return (
    <div 
      className="flex items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-none px-1" 
      id="legal-domain-selector"
      role="tablist"
      aria-label={t.nav.filterByDomain}
    >
      {DOMAINS.map((domain) => {
        const IconComponent = domain.icon;
        const isSelected = selectedDomain === domain.id;
        const domainLabel = t.domains[domain.id];

        return (
          <button
            key={domain.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelectDomain(domain.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
              isSelected
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:border-slate-300'
            }`}
            title={domainLabel}
          >
            <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-200' : 'text-slate-400'}`} />
            <span>{domainLabel}</span>
          </button>
        );
      })}
    </div>
  );
};
