import React from 'react';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  BookOpen, 
  Bookmark, 
  FileEdit, 
  FileText, 
  Gavel, 
  Award, 
  Camera, 
  ChevronLeft, 
  ChevronRight,
  X,
  Trash2
} from 'lucide-react';
import { Conversation } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LexoraLogo } from './LexoraLogo';

interface LexoraSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onNewQuery: () => void;
  onFocusSearch: () => void;
  onOpenLibrary: () => void;
  onOpenDraft: () => void;
  onOpenScrutiny: () => void;
  onOpenCaseExplorer: () => void;
  onOpenSchemes: () => void;
  onOpenKiosk: () => void;
  onOpenSaved?: () => void;
  conversations?: Conversation[];
  activeConversationId?: string;
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
}

export const LexoraSidebar: React.FC<LexoraSidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  onNewQuery,
  onFocusSearch,
  onOpenLibrary,
  onOpenDraft,
  onOpenScrutiny,
  onOpenCaseExplorer,
  onOpenSchemes,
  onOpenKiosk,
  onOpenSaved,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onDeleteConversation
}) => {
  const { t } = useLanguage();

  const navItems = [
    { label: t.nav.legalLibrary, icon: BookOpen, action: onOpenLibrary },
    { label: t.nav.saved, icon: Bookmark, action: onOpenSaved || onOpenLibrary },
    { label: t.nav.draftGenerator, icon: FileEdit, action: onOpenDraft },
    { label: t.nav.documentScrutiny, icon: FileText, action: onOpenScrutiny },
    { label: t.nav.caseExplorer, icon: Gavel, action: onOpenCaseExplorer },
    { label: t.nav.schemesDirectory, icon: Award, action: onOpenSchemes },
    { label: t.nav.hardwareAssist, icon: Camera, action: onOpenKiosk },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        id="lexora-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-black border-r border-[#E4E1DA] dark:border-zinc-800 transition-all duration-200 lg:static ${
          isMobileOpen ? 'translate-x-0 w-[270px]' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-[64px]' : 'lg:w-[270px]'}`}
      >
        {/* Branding */}
        <div className="h-14 px-3 flex items-center justify-between border-b border-[#E4E1DA] dark:border-zinc-800">
          <LexoraLogo showText={!isCollapsed} size="sm" />

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1 text-[#73777F] hover:text-[#17244F] lg:hidden cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1 text-[#73777F] hover:text-[#17244F] dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Primary Action Button: New Consultation */}
        <div className="p-3 border-b border-[#E4E1DA] dark:border-zinc-800 space-y-2">
          <button
            type="button"
            onClick={() => {
              onNewQuery();
              if (isMobileOpen && onCloseMobile) onCloseMobile();
            }}
            id="sidebar-new-query-btn"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md font-medium text-xs bg-[#17244F] dark:bg-[#27272a] hover:bg-[#203066] dark:hover:bg-[#3f3f46] text-white transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 flex-shrink-0" />
            {!isCollapsed && <span>{t.nav.newQuery}</span>}
          </button>

          {/* Quick Search */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={() => {
                onFocusSearch();
                if (isMobileOpen && onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-[#73777F] dark:text-zinc-400 bg-[#FAF9F6] dark:bg-[#121212] border border-[#E4E1DA] dark:border-zinc-800 hover:border-[#73777F] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#73777F]" />
                <span>{t.nav.search}</span>
              </span>
              <kbd className="text-[10px] font-mono text-[#73777F] bg-white dark:bg-[#1c1c1e] px-1 py-0.2 rounded border border-[#E4E1DA] dark:border-zinc-700">
                ⌘K
              </kbd>
            </button>
          )}
        </div>

        {/* Navigation & Conversations */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {/* Section: RECENT CONSULTATIONS */}
          <div>
            {!isCollapsed && (
              <div className="px-2 mb-1 flex items-center justify-between text-[11px] font-semibold text-[#73777F] dark:text-zinc-400 uppercase tracking-wider">
                <span>{t.nav.conversations}</span>
                <span className="text-[10px] font-normal text-[#73777F]">
                  {conversations.length}
                </span>
              </div>
            )}

            <div className="space-y-0.5">
              {conversations.map((conv) => {
                const isActive = conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#17244F]/8 text-[#17244F] font-semibold dark:bg-[#27272a] dark:text-white'
                        : 'text-[#42506F] dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-zinc-800/60'
                    }`}
                    onClick={() => {
                      if (onSelectConversation) onSelectConversation(conv.id);
                      if (isMobileOpen && onCloseMobile) onCloseMobile();
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-[#73777F]" />
                      {!isCollapsed && (
                        <span className="truncate">{conv.title || 'Untitled'}</span>
                      )}
                    </div>

                    {!isCollapsed && onDeleteConversation && conversations.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#73777F] hover:text-rose-600 transition-opacity"
                        title="Delete consultation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: LEGAL TOOLS */}
          <div>
            {!isCollapsed && (
              <div className="px-2 mb-1 text-[11px] font-semibold text-[#73777F] dark:text-zinc-400 uppercase tracking-wider">
                {t.nav.tools}
              </div>
            )}

            <div className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      item.action();
                      if (isMobileOpen && onCloseMobile) onCloseMobile();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-[#42506F] dark:text-zinc-300 hover:bg-slate-100/80 dark:hover:bg-zinc-800/60 hover:text-[#17244F] dark:hover:text-white transition-colors cursor-pointer text-left"
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-3.5 h-3.5 text-[#73777F] flex-shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#E4E1DA] dark:border-zinc-800 text-[11px] text-[#73777F] dark:text-zinc-400 flex items-center justify-between">
          {!isCollapsed && (
            <span>v2.5 · TN & IN</span>
          )}
          {!isCollapsed && (
            <span className="font-mono text-[10px]">Secure Core</span>
          )}
        </div>
      </aside>
    </>
  );
};
