import React from 'react';
import { 
  Scale, 
  Sparkles, 
  Search, 
  MessageSquare, 
  BookOpen, 
  Bookmark, 
  FileEdit, 
  FileText, 
  Gavel, 
  Home, 
  Users, 
  Briefcase, 
  ShieldAlert, 
  ShoppingBag, 
  Coins, 
  Landmark, 
  ChevronLeft, 
  ChevronRight, 
  X,
  ShieldCheck,
  Building2,
  Store,
  Award,
  Wallet,
  AlertCircle,
  Camera,
  Sprout
} from 'lucide-react';
import { LegalDomain } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  selectedDomain: LegalDomain;
  onSelectDomain: (domain: LegalDomain) => void;
  onNewQuery: () => void;
  onFocusSearch: () => void;
  onOpenLibrary: () => void;
  onOpenDraft: () => void;
  onOpenScrutiny: () => void;
  onOpenCaseExplorer: () => void;
  onOpenSchemes?: () => void;
  onOpenHardware?: () => void;
  savedCount?: number;
  onOpenSaved?: () => void;
  conversationCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  selectedDomain,
  onSelectDomain,
  onNewQuery,
  onFocusSearch,
  onOpenLibrary,
  onOpenDraft,
  onOpenScrutiny,
  onOpenCaseExplorer,
  onOpenSchemes,
  onOpenHardware,
  savedCount = 0,
  onOpenSaved,
  conversationCount = 1
}) => {
  const { t, language } = useLanguage();

  const domainItems: Array<{ id: LegalDomain; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'cooperative_law', label: t.domains.cooperative_law, icon: Building2 },
    { id: 'pacs', label: t.domains.pacs, icon: Store },
    { id: 'crop_insurance', label: t.domains.crop_insurance, icon: ShieldCheck },
    { id: 'government_schemes', label: t.domains.government_schemes, icon: Award },
    { id: 'agriculture', label: t.domains.agriculture, icon: Sprout },
    { id: 'financial_literacy', label: t.domains.financial_literacy, icon: Wallet },
    { id: 'grievance', label: t.domains.grievance, icon: AlertCircle },
    { id: 'property', label: t.domains.property, icon: Home },
    { id: 'consumer', label: t.domains.consumer, icon: ShoppingBag },
    { id: 'employment', label: t.domains.employment, icon: Briefcase },
    { id: 'criminal', label: t.domains.criminal, icon: ShieldAlert },
    { id: 'finance', label: t.domains.finance, icon: Coins },
    { id: 'family', label: t.domains.family, icon: Users },
    { id: 'government', label: t.domains.government, icon: Landmark },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="lexora-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-[#0E1526] border-r border-slate-200/90 dark:border-slate-800/90 transition-all duration-300 ease-in-out lg:static ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}`}
      >
        {/* Sidebar Header / Brand */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-blue-900 text-white flex items-center justify-center shadow-xs flex-shrink-0 border border-indigo-700/40">
              <Scale className="w-5 h-5 text-amber-300" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                    LEXORA
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase truncate">
                  {language === 'ta' ? 'தமிழ் வழி சட்டம்' : 'Tamil-First Legal'}
                </p>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="p-3 space-y-2 border-b border-slate-100 dark:border-slate-800/60">
          <button
            type="button"
            onClick={() => {
              onNewQuery();
              if (isMobileOpen) onCloseMobile();
            }}
            id="sidebar-new-query-btn"
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs ${
              isCollapsed 
                ? 'bg-indigo-900 text-white hover:bg-indigo-800 p-2.5' 
                : 'bg-indigo-900 hover:bg-indigo-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500'
            }`}
            title={t.nav.newQuery}
          >
            <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
            {!isCollapsed && <span>{t.nav.newQuery}</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              onFocusSearch();
              if (isMobileOpen) onCloseMobile();
            }}
            id="sidebar-search-btn"
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-800 ${
              isCollapsed ? 'justify-center p-2' : ''
            }`}
            title={t.nav.search}
          >
            <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{t.nav.search}</span>
                <span className="text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">⌘K</span>
              </>
            )}
          </button>
        </div>

        {/* Navigation Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {/* Section: WORKSPACE */}
          <div>
            {!isCollapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {t.nav.workspace}
              </p>
            )}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onNewQuery();
                  if (isMobileOpen) onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title={t.nav.conversations}
              >
                <MessageSquare className="w-4 h-4 text-slate-500 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{t.nav.conversations}</span>
                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                      {conversationCount}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenLibrary();
                  if (isMobileOpen) onCloseMobile();
                }}
                id="sidebar-legal-library-btn"
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title={t.nav.legalLibrary}
              >
                <BookOpen className="w-4 h-4 text-slate-500 flex-shrink-0" />
                {!isCollapsed && <span className="flex-1 text-left truncate">{t.nav.legalLibrary}</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenSaved) onOpenSaved();
                  if (isMobileOpen) onCloseMobile();
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title={t.nav.saved}
              >
                <Bookmark className="w-4 h-4 text-slate-500 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{t.nav.saved}</span>
                    {savedCount > 0 && (
                      <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-full">
                        {savedCount}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section: TOOLS */}
          <div>
            {!isCollapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {t.nav.tools}
              </p>
            )}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onOpenDraft();
                  if (isMobileOpen) onCloseMobile();
                }}
                id="sidebar-draft-generator-btn"
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title={t.nav.draftGenerator}
              >
                <FileEdit className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                {!isCollapsed && <span className="flex-1 text-left truncate">{t.nav.draftGenerator}</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenScrutiny();
                  if (isMobileOpen) onCloseMobile();
                }}
                id="sidebar-doc-analysis-btn"
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title={t.nav.documentScrutiny}
              >
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                {!isCollapsed && <span className="flex-1 text-left truncate">{t.nav.documentScrutiny}</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenCaseExplorer();
                  if (isMobileOpen) onCloseMobile();
                }}
                id="sidebar-case-explorer-btn"
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title={t.nav.caseExplorer}
              >
                <Gavel className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                {!isCollapsed && <span className="flex-1 text-left truncate">{t.nav.caseExplorer}</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenSchemes) onOpenSchemes();
                  if (isMobileOpen) onCloseMobile();
                }}
                id="sidebar-schemes-directory-btn"
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title={t.nav.schemesDirectory}
              >
                <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
                {!isCollapsed && <span className="flex-1 text-left truncate">{t.nav.schemesDirectory}</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenHardware) onOpenHardware();
                  if (isMobileOpen) onCloseMobile();
                }}
                id="sidebar-hardware-assist-btn"
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title={t.nav.hardwareAssist}
              >
                <Camera className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{t.nav.hardwareAssist}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      Kiosk
                    </span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Section: LEGAL DOMAINS (7 requested domains) */}
          <div>
            {!isCollapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {t.nav.legalDomains}
              </p>
            )}
            <div className="space-y-1">
              {domainItems.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedDomain === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectDomain(item.id);
                      if (isMobileOpen) onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-200 font-bold border border-indigo-200 dark:border-indigo-800'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={item.label}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer / Legal Literacy Disclaimer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40">
          {!isCollapsed ? (
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{t.common.legalDisclaimerTitle}</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {t.common.legalDisclaimerText}
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>Madras HC & India Code</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">● Live Sync</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center" title={t.common.legalDisclaimerText}>
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
