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
  Sprout,
  Trash2
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
  conversations?: Array<{ id: string; title: string; timestamp: number }>;
  activeConversationId?: string;
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
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
  conversationCount = 1,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onDeleteConversation
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
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg lg:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
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
          {/* Section: WORKSPACE & RECENT CONVERSATIONS */}
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

              {/* Conversation History List */}
              {!isCollapsed && conversations.length > 0 && (
                <div className="pl-3.5 pr-1 py-1 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 ml-2 my-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {language === 'ta' ? 'சமீபத்திய உரையாடல்கள்' : 'Recent Threads'}
                  </p>
                  {conversations.map((conv) => {
                    const isActive = conv.id === activeConversationId;
                    return (
                      <div 
                        key={conv.id}
                        className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                          isActive 
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectConversation) onSelectConversation(conv.id);
                            if (isMobileOpen) onCloseMobile();
                          }}
                          className="flex-1 text-left truncate cursor-pointer pr-1"
                          title={conv.title}
                        >
                          {conv.title}
                        </button>
                        {onDeleteConversation && conversations.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(conv.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-opacity cursor-pointer"
                            title="Delete conversation"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

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
                <FileEdit className="w-4 h-4 text-slate-500 flex-shrink-0" />
                {!isCollapsed && <span className="flex-1 text-left truncate">{t.nav.draftGenerator}</span>}
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenScrutiny();
                  if (isMobileOpen) onCloseMobile();
                }}
                id="sidebar-doc-scrutiny-btn"
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title={t.nav.documentScrutiny}
              >
                <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
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
                <Gavel className="w-4 h-4 text-slate-500 flex-shrink-0" />
                {!isCollapsed && <span className="flex-1 text-left truncate">{t.nav.caseExplorer}</span>}
              </button>

              {onOpenSchemes && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenSchemes();
                    if (isMobileOpen) onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                  title="Government Schemes & Subsidies"
                >
                  <Award className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  {!isCollapsed && <span className="flex-1 text-left truncate">{language === 'ta' ? 'அரசு திட்டங்கள்' : 'Govt Schemes'}</span>}
                </button>
              )}

              {onOpenHardware && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenHardware();
                    if (isMobileOpen) onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                  title="Smart Document Scanner & Kiosk Voice Assist"
                >
                  <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  {!isCollapsed && <span className="flex-1 text-left truncate">{language === 'ta' ? 'கியோஸ்க் கேமரா' : 'Kiosk Scanner'}</span>}
                </button>
              )}
            </div>
          </div>

          {/* Section: LEGAL DOMAINS & COOPERATIVE MODULES */}
          <div>
            {!isCollapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {t.nav.legalDomains}
              </p>
            )}
            <div className="space-y-1">
              {domainItems.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedDomain === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectDomain(item.id);
                      if (isMobileOpen) onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-900 text-white dark:bg-indigo-600 font-bold shadow-2xs'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={item.label}
                  >
                    <IconComponent className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-amber-300' : 'text-slate-500'}`} />
                    {!isCollapsed && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer / Jurisdiction / Version Info */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          {!isCollapsed ? (
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Lexora v2.5
              </span>
              <span className="font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                TN & IN
              </span>
            </div>
          ) : (
            <div className="flex justify-center" title="Lexora AI v2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
