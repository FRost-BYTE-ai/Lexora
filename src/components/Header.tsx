import React from 'react';
import { 
  PhoneCall, 
  ArrowLeft,
  Sun,
  Moon
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { TamilEmblem, TamilBorderPattern } from './TamilEmblem';

interface HeaderProps {
  isThreadActive?: boolean;
  onStartOver?: () => void;
  fontSize?: 'normal' | 'large' | 'xlarge';
  onFontSizeChange?: (size: 'normal' | 'large' | 'xlarge') => void;
  onOpenHelplineModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isThreadActive = false,
  onStartOver,
  fontSize = 'normal',
  onFontSizeChange,
  onOpenHelplineModal
}) => {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="w-full bg-[#0B2545] text-white border-b-2 border-[#B87314] shadow-sm sticky top-0 z-40 flex-shrink-0">
      {/* Top micro-banner with Tamil Nadu trust signal */}
      <div className="bg-[#7A1C28] text-white text-[11px] sm:text-xs py-1 px-4 text-center font-medium flex items-center justify-between border-b border-amber-900/40">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>
            {language === 'ta' 
              ? 'தமிழ்நாடு அரசு சட்டங்கள் மற்றும் சென்னை உயர்நீதிமன்ற தீர்ப்புகளின் வழிகாட்டல்'
              : 'Guidance from Tamil Nadu Government Acts & High Court Judgments'}
          </span>
          <span className="hidden md:inline text-amber-200/90 font-bold">· 100% கட்டணமில்லா மக்கள் சேவை</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-amber-100 font-bold text-[11px]">
          <span>🚨 காவல்துறை: 112</span>
          <span>👩 மகளிர் உதவி: 181</span>
          <span>🌾 பயிர் காப்பீடு: 14447</span>
          <span>⚖️ இலவச சட்ட உதவி: 15100</span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Left: Emblem + Portal Title OR Back Button */}
        <div className="flex items-center gap-3">
          {isThreadActive && onStartOver ? (
            <button
              type="button"
              onClick={onStartOver}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-[#7A1C28] hover:bg-[#9E2636] text-white font-extrabold text-xs sm:text-sm border border-amber-400/40 shadow-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-amber-300" />
              <span>{language === 'ta' ? '⟵ முகப்புக்கு திரும்புக' : '⟵ Back to Home'}</span>
            </button>
          ) : null}

          <div 
            onClick={onStartOver}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none"
          >
            <TamilEmblem className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0" />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-black tracking-wide text-white font-sans">
                  லெக்சோரா
                </span>
                <span className="text-xs sm:text-sm font-bold tracking-wider text-amber-400">
                  LEXORA
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-100 font-medium line-clamp-1">
                {language === 'ta' 
                  ? 'தமிழ்நாடு இலவச மக்கள் சட்ட உதவி மையம்' 
                  : 'Tamil Nadu Public Legal Assistance Portal'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Controls: Font Size, Clean Language Switch & Helpline */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Elder / Low-literacy Font Size Adjuster */}
          {onFontSizeChange && (
            <div className="hidden sm:flex items-center bg-[#07192F] rounded-lg border border-slate-700/60 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => onFontSizeChange('normal')}
                className={`px-2 py-1 rounded font-bold transition-colors cursor-pointer ${
                  fontSize === 'normal' 
                    ? 'bg-[#B87314] text-white' 
                    : 'text-slate-300 hover:text-white'
                }`}
                title="இயல்பு எழுத்து அளவு (Normal text)"
              >
                அ
              </button>
              <button
                type="button"
                onClick={() => onFontSizeChange('large')}
                className={`px-2 py-1 rounded font-bold text-sm transition-colors cursor-pointer ${
                  fontSize === 'large' 
                    ? 'bg-[#B87314] text-white' 
                    : 'text-slate-300 hover:text-white'
                }`}
                title="பெரிய எழுத்து அளவு (Large text)"
              >
                அ+
              </button>
              <button
                type="button"
                onClick={() => onFontSizeChange('xlarge')}
                className={`px-2 py-1 rounded font-extrabold text-base transition-colors cursor-pointer ${
                  fontSize === 'xlarge' 
                    ? 'bg-[#B87314] text-white' 
                    : 'text-slate-300 hover:text-white'
                }`}
                title="மிகப் பெரிய எழுத்து (Extra Large text for elders)"
              >
                அ++
              </button>
            </div>
          )}

          {/* Simple, Single Language Toggle: Tamil / English */}
          <div className="inline-flex items-center bg-[#07192F] rounded-lg border border-amber-500/40 p-0.5 text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setLanguage('ta')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                language === 'ta'
                  ? 'bg-[#B87314] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              தமிழ்
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-[#B87314] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              English
            </button>
          </div>

          {/* Quick Helpline Hotline Trigger */}
          {onOpenHelplineModal && (
            <button
              type="button"
              onClick={onOpenHelplineModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-800/90 hover:bg-emerald-700 text-white text-xs font-bold border border-emerald-500/40 cursor-pointer transition-colors shadow-2xs"
              title="அரசு அவசர உதவி எண்கள் (Helplines)"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-200" />
              <span className="hidden md:inline">{language === 'ta' ? 'அவசர எண்கள்' : 'Helplines'}</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#07192F] transition-colors cursor-pointer border border-transparent hover:border-slate-700"
            aria-label="Toggle Theme"
            title={theme === 'dark' ? 'பகல் பயன்முறை' : 'இரவு பயன்முறை'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Decorative Tamil Cultural Border */}
      <TamilBorderPattern className="w-full h-2" />
    </header>
  );
};
