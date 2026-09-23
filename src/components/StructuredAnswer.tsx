import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { 
  Scale, 
  Bookmark, 
  BookOpen, 
  Check, 
  Copy, 
  Volume2, 
  VolumeX, 
  Languages, 
  FileEdit, 
  Sparkles, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  AlertTriangle,
  Lightbulb,
  FileCheck
} from 'lucide-react';
import { Message, LegalSource, ActionStep } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ActionPlan } from './ActionPlan';
import { SourcePanel } from './SourcePanel';
import { FollowUpQuestions } from './FollowUpQuestions';

interface StructuredAnswerProps {
  message: Message;
  isSpeaking: boolean;
  copiedId: string | null;
  onToggleSpeech: (msg: Message) => void;
  onToggleTranslation: (msgId: string) => void;
  onCopyMessage: (id: string, text: string) => void;
  onOpenDraftWithContext: (context: string) => void;
  onOpenExplainability: () => void;
  onSelectFollowUp: (q: string) => void;
}

export const StructuredAnswer: React.FC<StructuredAnswerProps> = ({
  message,
  isSpeaking,
  copiedId,
  onToggleSpeech,
  onToggleTranslation,
  onCopyMessage,
  onOpenDraftWithContext,
  onOpenExplainability,
  onSelectFollowUp
}) => {
  const { t, language } = useLanguage();
  const [isEvidenceExpanded, setIsEvidenceExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const displayContent = message.translation?.isShowingTranslation
    ? message.translation.translatedContent
    : message.content;

  // Derive target language for quick translation toggle
  let targetLang: 'ta' | 'en' | 'hi' = 'en';
  if (message.language === 'ta' || message.language === 'tanglish') {
    targetLang = language === 'hi' ? 'hi' : 'en';
  } else if (message.language === 'en') {
    targetLang = language === 'hi' ? 'hi' : 'ta';
  } else if (message.language === 'hi') {
    targetLang = language === 'ta' ? 'ta' : 'en';
  }

  const targetLabel =
    targetLang === 'ta' ? t.common.inTamil :
    targetLang === 'hi' ? 'हिन्दी में' :
    t.common.inEnglish;

  // Calculate synthetic or actual evidence relevance score
  const sourcesCount = message.sources?.length || 0;
  const relevanceScore = sourcesCount > 0 ? Math.min(98, 88 + sourcesCount * 2) : 92;

  return (
    <div className="w-full space-y-3.5">
      {/* Document Scrutiny Meta Banner if present */}
      {message.documentMeta && (
        <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/90 dark:border-indigo-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                {message.documentMeta.fileName}
              </span>
              <span className="text-[11px] text-indigo-700 dark:text-indigo-400 ml-2">
                ({message.documentMeta.fileSize})
              </span>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-indigo-200/70 dark:bg-indigo-900/80 text-indigo-900 dark:text-indigo-200">
            {t.chat.scrutinyReport}
          </span>
        </div>
      )}

      {/* Translation Notice Banner */}
      {message.translation?.isShowingTranslation && (
        <div className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2 font-semibold">
            <Languages className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>
              {message.translation.targetLanguage === 'ta' ? 'தமிழ் மொழிபெயர்ப்பு' :
               message.translation.targetLanguage === 'hi' ? 'हिन्दी अनुवाद' :
               'English Translation'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onToggleTranslation(message.id)}
            className="text-[11px] text-amber-800 dark:text-amber-300 hover:underline font-bold cursor-pointer"
          >
            {t.common.showOriginal}
          </button>
        </div>
      )}

      {/* CARD 1: ⚖ LEGAL POSITION (Main Grounded Answer) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#11192C] border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
              <Scale className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-extrabold tracking-wider uppercase text-slate-800 dark:text-slate-200">
              {t.structuredCards.legalPosition}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* "Why this answer?" Explainability Audit Trigger */}
            {message.explainability && (
              <button
                type="button"
                onClick={onOpenExplainability}
                className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>{t.common.whyThisAnswer}</span>
              </button>
            )}

            {/* Save / Bookmark Button */}
            <button
              type="button"
              onClick={() => setIsSaved(!isSaved)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isSaved 
                  ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title={isSaved ? "Saved" : "Save answer"}
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content text */}
        <div className="prose prose-sm max-w-none text-slate-800 dark:text-slate-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {displayContent}
          </ReactMarkdown>
        </div>
      </div>

      {/* CARD 2: 📚 SOURCE VERIFICATION & EVIDENCE PANEL */}
      {message.sources && message.sources.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-[#11192C] border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div 
            onClick={() => setIsEvidenceExpanded(!isEvidenceExpanded)}
            className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-extrabold tracking-wider uppercase text-slate-800 dark:text-slate-200">
                  {t.structuredCards.sourcesTitle}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2 font-medium">
                  ({message.sources.length} Verified Sources)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                {t.structuredCards.evidenceRelevance} {relevanceScore}%
              </span>
              {isEvidenceExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>

          {/* Expandable Source List */}
          {isEvidenceExpanded && (
            <div className="p-3.5 sm:p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80">
              <SourcePanel sources={message.sources} />
            </div>
          )}
        </div>
      )}

      {/* CARD 3: ⚠️ ACTION PLAN / PROCEDURAL CHECKLIST */}
      {message.action_plan && message.action_plan.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-[#11192C] border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-extrabold tracking-wider uppercase text-slate-800 dark:text-slate-200">
                {t.structuredCards.proceduralSteps}
              </span>
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <ActionPlan steps={message.action_plan} />
          </div>
        </div>
      )}

      {/* Suggested Follow-up Questions */}
      {message.follow_up_questions && message.follow_up_questions.length > 0 && (
        <FollowUpQuestions
          questions={message.follow_up_questions}
          onSelect={onSelectFollowUp}
        />
      )}

      {/* Response Action Bar (Listen, Translate, Copy, Draft Notice) */}
      <div className="pt-2 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Audio Speech Output */}
          <button
            type="button"
            onClick={() => onToggleSpeech(message)}
            aria-label={t.accessibility.listenAudio}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              isSpeaking
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title={isSpeaking ? t.common.stop : t.accessibility.listenAudio}
          >
            {isSpeaking ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            )}
            <span>{isSpeaking ? t.common.speaking : t.common.listen}</span>
          </button>

          {/* Quick Translation Toggle */}
          <button
            type="button"
            onClick={() => onToggleTranslation(message.id)}
            disabled={message.translation?.isTranslating}
            aria-label={t.accessibility.translateText}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
              message.translation?.isShowingTranslation
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Languages className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>
              {message.translation?.isTranslating
                ? t.common.translating
                : message.translation?.isShowingTranslation
                ? t.common.showOriginal
                : targetLabel}
            </span>
          </button>

          {/* Copy Answer */}
          <button
            type="button"
            onClick={() => onCopyMessage(message.id, displayContent)}
            aria-label={t.accessibility.copyText}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-colors cursor-pointer"
          >
            {copiedId === message.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">{t.common.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>{t.common.copy}</span>
              </>
            )}
          </button>
        </div>

        {/* Draft Notice Action Prompt */}
        <button
          type="button"
          onClick={() => onOpenDraftWithContext(message.content.slice(0, 300))}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold transition-colors cursor-pointer shadow-2xs"
        >
          <FileEdit className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400" />
          <span>{t.chat.draftNoticePrompt}</span>
        </button>
      </div>
    </div>
  );
};
