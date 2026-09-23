import React from 'react';
import { 
  Menu, 
  Scale, 
  Sun, 
  Moon, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  MapPin, 
  BookOpen,
  UserCheck,
  Award,
  Camera
} from 'lucide-react';
import { Jurisdiction, ExplanationLevel, LanguageMode } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  jurisdiction: Jurisdiction;
  onJurisdictionChange: (j: Jurisdiction) => void;
  explanationLevel: ExplanationLevel;
  onExplanationLevelChange: (lvl: ExplanationLevel) => void;
  onOpenLibrary: () => void;
  onOpenSchemes?: () => void;
  onOpenHardware?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  jurisdiction,
  onJurisdictionChange,
  explanationLevel,
  onExplanationLevelChange,
  onOpenLibrary,
  onOpenSchemes,
  onOpenHardware
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const languageOptions: Array<{ id: LanguageMode; label: string }> = [
    { id: 'ta', label: 'தமிழ்' },
    { id: 'en', label: 'English' },
    { id: 'tanglish', label: 'Tanglish' },
    { id: 'hi', label: 'हिन्दी' }
  ];

  const levels: Array<{ id: ExplanationLevel; label: string }> = [
    { id: 'citizen', label: t.header.levelCitizen },
    { id: 'student', label: t.header.levelStudent },
    { id: 'professional', label: t.header.levelAdvocate },
    { id: 'simple_tamil', label: t.header.levelSimpleTamil }
  ];

  return (
    <header className="h-16 px-4 lg:px-6 bg-white/95 dark:bg-[#0E1526]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 sticky top-0 z-30 flex-shrink-0">
      {/* Left Area: Mobile Menu Trigger + Brand Subtitle / Jurisdiction */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl lg:hidden cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Small brand info on header for mobile & breadcrumbs */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="lg:hidden flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-bold shadow-2xs">
              <Scale className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <span className="font-extrabold text-xs tracking-tight text-slate-900 dark:text-white hidden xs:inline">LEXORA</span>
          </div>

          {/* Jurisdiction Segmented Pill Switch */}
          <div className="hidden sm:inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-xs">
            <button
              type="button"
              onClick={() => onJurisdictionChange('TN')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                jurisdiction === 'TN'
                  ? 'bg-white dark:bg-slate-700 text-indigo-950 dark:text-indigo-200 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={t.header.tnModeTooltip}
            >
              <MapPin className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>{t.header.tamilNaduMode}</span>
            </button>
            <button
              type="button"
              onClick={() => onJurisdictionChange('IN')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                jurisdiction === 'IN'
                  ? 'bg-white dark:bg-slate-700 text-indigo-950 dark:text-indigo-200 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={t.header.inModeTooltip}
            >
              <span>{t.header.allIndiaMode}</span>
            </button>
          </div>

          {/* Quick Schemes & Kiosk Buttons on desktop header */}
          <div className="hidden xl:flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            {onOpenSchemes && (
              <button
                type="button"
                onClick={onOpenSchemes}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 transition-colors cursor-pointer"
                title="Government Schemes & Subsidies Directory"
              >
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>{language === 'ta' ? 'அரசு திட்டங்கள்' : 'Schemes'}</span>
              </button>
            )}

            {onOpenHardware && (
              <button
                type="button"
                onClick={onOpenHardware}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 transition-colors cursor-pointer"
                title="Smart Document & Voice Assist Kiosk Module"
              >
                <Camera className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{language === 'ta' ? 'கியோஸ்க் கேமரா' : 'Kiosk Assist'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Area: Complexity Level, Language Switcher, Theme, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Explanation Level Dropdown / Pill */}
        <div className="hidden md:flex items-center gap-1 text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-medium">{t.header.explanationLevel}</span>
          <select
            value={explanationLevel}
            onChange={(e) => onExplanationLevelChange(e.target.value as ExplanationLevel)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
          >
            {levels.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                {lvl.label}
              </option>
            ))}
          </select>
        </div>

        {/* Global Language Switcher (Segmented, prominent) */}
        <div 
          className="inline-flex p-0.5 sm:p-1 bg-slate-100 dark:bg-slate-800/90 rounded-full border border-slate-200/90 dark:border-slate-700/80 shadow-2xs"
          role="group"
          aria-label={t.accessibility.selectLanguage}
        >
          {languageOptions.map((opt) => {
            const isSelected = language === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLanguage(opt.id)}
                aria-pressed={isSelected}
                className={`px-1.5 sm:px-3 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-indigo-600 text-indigo-950 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Theme Toggle (Light / Dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={t.common.themeToggle}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer border border-slate-200/70 dark:border-slate-700/70"
          title={theme === 'dark' ? t.common.lightMode : t.common.darkMode}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-300" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Verified User / Corpus Status Avatar */}
        <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-900 dark:text-indigo-300 shadow-2xs">
            TN
          </div>
        </div>
      </div>
    </header>
  );
};
