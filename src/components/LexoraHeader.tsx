import React from 'react';
import { 
  ChevronDown, 
  Moon, 
  Sun,
  Menu,
  FileText,
  Camera
} from 'lucide-react';
import { Jurisdiction, ExplanationLevel, LanguageMode } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface LexoraHeaderProps {
  jurisdiction: Jurisdiction;
  onSelectJurisdiction: (j: Jurisdiction) => void;
  explanationLevel: ExplanationLevel;
  onSelectExplanationLevel: (lvl: ExplanationLevel) => void;
  onOpenSchemes?: () => void;
  onOpenKiosk?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const LexoraHeader: React.FC<LexoraHeaderProps> = ({
  jurisdiction,
  onSelectJurisdiction,
  explanationLevel,
  onSelectExplanationLevel,
  onOpenSchemes,
  onOpenKiosk,
  onToggleMobileSidebar
}) => {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const langOptions: Array<{ id: LanguageMode; label: string }> = [
    { id: 'ta', label: 'தமிழ்' },
    { id: 'en', label: 'English' },
    { id: 'tanglish', label: 'Tanglish' },
    { id: 'hi', label: 'हिन्दी' }
  ];

  return (
    <header className="w-full bg-white dark:bg-black border-b border-[#E4E1DA] dark:border-zinc-800 sticky top-0 z-30 flex-shrink-0">
      <div className="w-full px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto">
        {/* Left Side: Jurisdiction Segmented Control */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="p-1.5 rounded-md text-[#73777F] hover:bg-slate-100 dark:hover:bg-zinc-800 lg:hidden cursor-pointer"
              aria-label="Toggle navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Clean Segmented Jurisdiction Control */}
          <div className="inline-flex items-center bg-[#FAF9F6] dark:bg-[#121212] p-0.5 rounded-md border border-[#E4E1DA] dark:border-zinc-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => onSelectJurisdiction('TN')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                jurisdiction === 'TN'
                  ? 'bg-white dark:bg-[#27272a] text-[#17244F] dark:text-white font-semibold shadow-2xs'
                  : 'text-[#73777F] dark:text-zinc-400 hover:text-[#17244F] dark:hover:text-white'
              }`}
            >
              Tamil Nadu
            </button>
            <button
              type="button"
              onClick={() => onSelectJurisdiction('IN')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                jurisdiction === 'IN'
                  ? 'bg-white dark:bg-[#27272a] text-[#17244F] dark:text-white font-semibold shadow-2xs'
                  : 'text-[#73777F] dark:text-zinc-400 hover:text-[#17244F] dark:hover:text-white'
              }`}
            >
              All India
            </button>
          </div>

          {/* Quick Tools */}
          {onOpenSchemes && (
            <button
              type="button"
              onClick={onOpenSchemes}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#42506F] dark:text-zinc-300 hover:text-[#17244F] dark:hover:text-white hover:bg-[#FAF9F6] dark:hover:bg-zinc-800 rounded-md border border-transparent hover:border-[#E4E1DA] transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#B88A25]" />
              <span>Schemes</span>
            </button>
          )}

          {onOpenKiosk && (
            <button
              type="button"
              onClick={onOpenKiosk}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#42506F] dark:text-zinc-300 hover:text-[#17244F] dark:hover:text-white hover:bg-[#FAF9F6] dark:hover:bg-zinc-800 rounded-md border border-transparent hover:border-[#E4E1DA] transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-[#B88A25]" />
              <span>Kiosk</span>
            </button>
          )}
        </div>

        {/* Right Side: Level, Language, Theme, User */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Explanation Level Dropdown */}
          <div className="relative inline-block text-xs">
            <select
              value={explanationLevel}
              onChange={(e) => onSelectExplanationLevel(e.target.value as ExplanationLevel)}
              className="appearance-none bg-[#FAF9F6] dark:bg-[#121212] border border-[#E4E1DA] dark:border-zinc-800 text-[#17244F] dark:text-white font-medium text-xs rounded-md pl-2.5 pr-6 py-1 cursor-pointer focus:outline-none"
            >
              <option value="citizen">Citizen</option>
              <option value="student">Student / Research</option>
              <option value="professional">Advocate / Legal</option>
            </select>
            <ChevronDown className="w-3 h-3 text-[#73777F] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Language Selector: Segmented */}
          <div className="inline-flex items-center bg-[#FAF9F6] dark:bg-[#121212] p-0.5 rounded-md border border-[#E4E1DA] dark:border-zinc-800 text-xs font-medium">
            {langOptions.map((opt) => {
              const isSelected = language === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLanguage(opt.id)}
                  className={`px-2.5 py-0.5 rounded transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-[#27272a] text-[#17244F] dark:text-white font-semibold shadow-2xs'
                      : 'text-[#73777F] dark:text-zinc-400 hover:text-[#17244F] dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-[#73777F] hover:text-[#17244F] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[#B88A25]" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Badge */}
          <div className="w-7 h-7 rounded-md bg-[#FAF9F6] dark:bg-[#18181b] border border-[#E4E1DA] dark:border-zinc-800 text-[#17244F] dark:text-zinc-200 font-semibold text-xs flex items-center justify-center flex-shrink-0">
            TN
          </div>
        </div>
      </div>
    </header>
  );
};
