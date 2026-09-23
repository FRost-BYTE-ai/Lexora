import React, { useRef, useEffect } from 'react';
import { 
  Search, 
  Send, 
  UploadCloud, 
  Scale, 
  FileText, 
  FileEdit, 
  Gavel, 
  Landmark, 
  BookOpen, 
  Sparkles, 
  MapPin, 
  ShieldCheck, 
  ChevronRight,
  HelpCircle,
  Award,
  Camera
} from 'lucide-react';
import { VoiceInputButton } from './VoiceInputButton';
import { DomainSelector } from './DomainSelector';
import { LegalDomain, Jurisdiction, ExplanationLevel } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HeroWorkspaceProps {
  input: string;
  setInput: (val: string) => void;
  onSend: (override?: string) => void;
  isLoading: boolean;
  domain: LegalDomain;
  setDomain: (d: LegalDomain) => void;
  jurisdiction: Jurisdiction;
  setJurisdiction: (j: Jurisdiction) => void;
  explanationLevel: ExplanationLevel;
  setExplanationLevel: (lvl: ExplanationLevel) => void;
  onOpenDocModal: () => void;
  onOpenDraftModal: () => void;
  onOpenLibraryModal: () => void;
  onOpenCaseExplorer: () => void;
  onOpenSchemesModal?: () => void;
  onOpenHardwareModal?: () => void;
  onSelectPrompt: (promptText: string) => void;
  voiceBaseText: string;
  setVoiceBaseText: (val: string) => void;
  searchBoxRef?: React.RefObject<HTMLTextAreaElement>;
}

export const HeroWorkspace: React.FC<HeroWorkspaceProps> = ({
  input,
  setInput,
  onSend,
  isLoading,
  domain,
  setDomain,
  jurisdiction,
  setJurisdiction,
  explanationLevel,
  setExplanationLevel,
  onOpenDocModal,
  onOpenDraftModal,
  onOpenLibraryModal,
  onOpenCaseExplorer,
  onOpenSchemesModal,
  onOpenHardwareModal,
  onSelectPrompt,
  voiceBaseText,
  setVoiceBaseText,
  searchBoxRef
}) => {
  const { t, language } = useLanguage();
  const textareaRef = searchBoxRef || useRef<HTMLTextAreaElement>(null);

  const actionCards = [
    {
      id: 'ask_question',
      title: t.hero.cardAskQuestion,
      desc: t.hero.cardAskQuestionDesc,
      icon: Scale,
      action: () => {
        textareaRef.current?.focus();
      }
    },
    {
      id: 'analyze_doc',
      title: t.hero.cardAnalyzeDoc,
      desc: t.hero.cardAnalyzeDocDesc,
      icon: FileText,
      action: onOpenDocModal
    },
    {
      id: 'hardware_kiosk',
      title: language === 'ta' ? 'ஸ்மார்ட் கியோஸ்க் கேமரா' : 'Smart Kiosk Capture',
      desc: language === 'ta' ? 'இயற்பியல் கூட்டுறவு நோட்டீஸ் & பாஸ்புக் ஸ்கேனிங்' : 'Overhead scanner & voice assist for paper notices',
      icon: Camera,
      action: onOpenHardwareModal || onOpenDocModal
    },
    {
      id: 'schemes_directory',
      title: language === 'ta' ? 'அரசு திட்டங்கள் & மானியங்கள்' : 'Government Schemes',
      desc: language === 'ta' ? 'PMFBY, KCC வட்டி மானியம், AIF வழிகாட்டி' : 'PMFBY, 4% KCC subvention, PACS model by-laws',
      icon: Award,
      action: onOpenSchemesModal || onOpenLibraryModal
    },
    {
      id: 'draft_doc',
      title: t.hero.cardDraftDoc,
      desc: t.hero.cardDraftDocDesc,
      icon: FileEdit,
      action: onOpenDraftModal
    },
    {
      id: 'find_case',
      title: t.hero.cardFindCase,
      desc: t.hero.cardFindCaseDesc,
      icon: Gavel,
      action: onOpenCaseExplorer
    }
  ];

  const quickPromptsList = [
    { 
      label: language === 'ta' ? 'பயிர் காப்பீடு மறுப்பு மேல்முறையீடு' : 'PMFBY Crop Loss Appeal', 
      text: language === 'ta' ? 'PMFBY பயிர் காப்பீட்டு இழப்பீடு நிராகரிக்கப்பட்டால் DGRC குறைதீர் குழுவிடம் எவ்வாறு மேல்முறையீடு செய்வது?' : 'How to appeal against PMFBY crop insurance claim rejection before DGRC Collector committee?' 
    },
    { 
      label: language === 'ta' ? 'PACS உறுப்பினர் உரிமை (பிரிவு 21)' : 'PACS Member Rights (Sec 21)', 
      text: language === 'ta' ? 'தொடக்க வேளாண் கூட்டுறவு சங்கத்தில் (PACS) உறுப்பினர் சேர்க்கை மறுக்கப்பட்டால் பிரிவு 21 படி என்ன உரிமை உண்டு?' : 'What are my statutory rights if a PACS denies membership under Section 21 of TN Cooperative Societies Act?' 
    },
    { 
      label: language === 'ta' ? 'KCC 4% வட்டி மானியம்' : 'KCC 4% Subvention', 
      text: language === 'ta' ? 'விவசாயிகளுக்கு KCC பயிர்க்கடனில் 4% வட்டி விகிதம் பெறுவதற்கான தகுதி மற்றும் தவணை விதிமுறைகள் என்ன?' : 'What are the rules and prompt repayment conditions to get 4% effective interest on KCC crop loans?' 
    },
    { label: t.hero.prompts.section420, text: t.hero.prompts.section420 },
    { label: t.hero.prompts.tenancyRights, text: t.hero.prompts.tenancyRights },
    { label: t.hero.prompts.draftNotice, text: t.hero.prompts.draftNotice }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 lg:py-12 flex flex-col items-center">
      {/* Main Title & Subtitle */}
      <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight text-center max-w-2xl leading-snug">
        {t.hero.title}
      </h1>
      <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 text-center max-w-xl leading-relaxed">
        {t.hero.subtitle}
      </p>

      {/* LARGE PREMIUM LEGAL SEARCH BOX */}
      <div className="w-full mt-7 mb-4">
        <div className="relative rounded-2xl bg-white dark:bg-[#101728] border border-slate-300/90 dark:border-slate-700 shadow-sm hover:border-slate-400 dark:hover:border-slate-600 focus-within:border-indigo-600 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all p-3 sm:p-4">
          {/* Top Row: Search Icon & Textarea */}
          <div className="flex items-start gap-3">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-1 flex-shrink-0" />
            <textarea
              ref={textareaRef}
              id="lexora-main-search-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder={t.hero.searchPlaceholder}
              className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none resize-none min-h-[64px] max-h-[160px] leading-relaxed"
              rows={2}
            />
          </div>

          {/* Bottom Controls Row inside Search Box */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Document Upload Trigger */}
              <button
                type="button"
                onClick={onOpenDocModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-colors cursor-pointer"
                title={t.accessibility.uploadDoc}
              >
                <UploadCloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">{t.nav.documentScrutiny}</span>
              </button>

              {/* Voice Input Button */}
              <VoiceInputButton
                language={language}
                onStart={() => setVoiceBaseText(input.trim())}
                onTranscript={(spoken) => {
                  setInput(voiceBaseText ? `${voiceBaseText} ${spoken}` : spoken);
                }}
                disabled={isLoading}
              />

              {/* Jurisdiction indicator */}
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden md:inline px-1">
                {jurisdiction === 'TN' ? 'Tamil Nadu Law' : 'Central / All India'}
              </span>
            </div>

            {/* Send Query Button */}
            <button
              type="button"
              id="lexora-main-send-btn"
              onClick={() => onSend()}
              disabled={!input.trim() || isLoading}
              aria-label={t.accessibility.sendMessage}
              className="px-4 py-2 bg-indigo-950 hover:bg-indigo-900 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-xs disabled:opacity-40 disabled:hover:bg-indigo-950 cursor-pointer"
            >
              <span>{t.common.send}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-2 mb-8 scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap mr-1">
          {t.quickPrompts.title}:
        </span>
        {quickPromptsList.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelectPrompt(item.text)}
            className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* WHAT CAN LEXORA HELP WITH? - SIX ELEGANT ACTION CARDS */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.hero.whatCanHelp}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actionCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={card.action}
                className="group p-4 rounded-2xl bg-white dark:bg-[#11192C] border border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-xs text-left transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[110px]"
              >
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                </div>
                <div className="mt-3">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-950 dark:group-hover:text-indigo-300">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
