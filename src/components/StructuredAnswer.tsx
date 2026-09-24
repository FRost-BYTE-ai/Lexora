import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { 
  Scale, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  Languages, 
  FileEdit, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Message, LegalSource, ActionStep, LanguageMode } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface StructuredAnswerProps {
  message: Message;
  isSpeaking: boolean;
  copiedId: string | null;
  onToggleSpeech: (msg: Message) => void;
  onToggleTranslation: (msgId: string) => void;
  onCopyMessage: (id: string, text: string) => void;
  onOpenDraftWithContext: (context: string) => void;
  onOpenExplainability?: () => void;
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
  const [showAllSources, setShowAllSources] = useState(false);

  const displayContent = message.translation?.isShowingTranslation
    ? message.translation.translatedContent
    : message.content;

  const targetLang: LanguageMode = language;
  const langName = 
    targetLang === 'ta' ? 'Tamil' :
    targetLang === 'hi' ? 'Hindi' :
    targetLang === 'tanglish' ? 'Tanglish' :
    'English';
  const targetLabel = `Translate to ${langName}`;

  const sources = message.sources || [];
  const actionPlan = message.action_plan || [];
  const followUps = message.follow_up_questions || [];

  return (
    <div className="w-full space-y-4">
      {/* Assistant Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E4E1DA] dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wider uppercase text-[#17244F] dark:text-white">
            Lexora
          </span>
          <span className="text-[#73777F] dark:text-slate-400">·</span>
          <span className="text-[#73777F] dark:text-slate-400 font-medium">
            {message.jurisdiction === 'TN' ? 'Tamil Nadu & Central Law' : 'Indian Central Law'}
          </span>
          {message.domain && (
            <>
              <span className="text-[#73777F] dark:text-slate-400">·</span>
              <span className="text-[#73777F] dark:text-slate-400 uppercase font-mono text-[11px]">
                {message.domain}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Scrutiny Document Metadata if present */}
      {message.documentMeta && (
        <div className="p-3 rounded-md bg-[#FAF9F6] dark:bg-slate-900 border border-[#E4E1DA] dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#17244F] dark:text-white" />
            <span className="font-semibold text-[#17244F] dark:text-white">
              {message.documentMeta.fileName}
            </span>
            <span className="text-[#73777F]">({message.documentMeta.fileSize})</span>
          </div>
          <span className="text-[11px] font-mono uppercase text-[#73777F]">Scrutiny Report</span>
        </div>
      )}

      {/* Translation Active Notice */}
      {message.translation?.isShowingTranslation && (
        <div className="px-3 py-1.5 rounded-md bg-[#FAF9F6] dark:bg-slate-900 border border-[#E4E1DA] dark:border-slate-800 flex items-center justify-between text-xs text-[#42506F] dark:text-slate-300">
          <span>
            Showing {
              message.translation.targetLanguage === 'ta' ? 'Tamil' :
              message.translation.targetLanguage === 'hi' ? 'Hindi' :
              message.translation.targetLanguage === 'tanglish' ? 'Tanglish' :
              'English'
            } translation
          </span>
          <button
            type="button"
            onClick={() => onToggleTranslation(message.id)}
            className="text-xs font-semibold text-[#17244F] dark:text-white hover:underline cursor-pointer"
          >
            Show original
          </button>
        </div>
      )}

      {/* Main Legal Answer Text */}
      <div className="prose dark:prose-invert max-w-none text-[#17244F] dark:text-[#EAECEF] text-sm leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {displayContent}
        </ReactMarkdown>
      </div>

      {/* Cited Statutory Sources */}
      {sources.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#E4E1DA] dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#73777F] dark:text-slate-400 uppercase tracking-wider">
              Cited Statutory Sources ({sources.length})
            </span>
            {sources.length > 2 && (
              <button
                type="button"
                onClick={() => setShowAllSources(!showAllSources)}
                className="text-xs text-[#73777F] hover:text-[#17244F] dark:hover:text-white inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{showAllSources ? 'Show less' : 'View all'}</span>
                {showAllSources ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(showAllSources ? sources : sources.slice(0, 2)).map((s, idx) => (
              <div 
                key={idx}
                className="p-2.5 rounded-md bg-[#FAF9F6] dark:bg-slate-900 border border-[#E4E1DA] dark:border-slate-800 text-xs space-y-1"
              >
                <div className="font-semibold font-serif text-[#17244F] dark:text-white flex items-center justify-between">
                  <span className="truncate">{s.title || s.act}</span>
                  {s.url && (
                    <a 
                      href={s.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#73777F] hover:text-[#17244F] ml-1 flex-shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {s.section && (
                  <div className="text-[#42506F] dark:text-slate-300 font-mono text-[11px]">
                    {s.section}
                  </div>
                )}
                {s.source && (
                  <div className="text-[11px] font-serif text-[#73777F] truncate">
                    Authority: {s.source}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Procedural Next Steps */}
      {actionPlan.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#E4E1DA] dark:border-slate-800 space-y-2">
          <div className="text-[11px] font-semibold font-sans text-[#73777F] dark:text-slate-400 uppercase tracking-wider">
            Procedural Protocol & Next Steps
          </div>

          <div className="space-y-1.5">
            {actionPlan.map((step) => (
              <div
                key={step.order}
                className="p-2.5 rounded-md bg-white dark:bg-[#101522] border border-[#E4E1DA] dark:border-slate-800 text-xs flex items-start gap-2.5"
              >
                <span className="w-5 h-5 rounded bg-[#FAF9F6] dark:bg-slate-800 border border-[#E4E1DA] dark:border-slate-700 text-[#17244F] dark:text-white font-mono text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  {step.order}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold font-serif text-[#17244F] dark:text-white flex items-center justify-between">
                    <span>{step.title}</span>
                    {step.timeline && (
                      <span className="text-[11px] font-mono text-[#73777F] ml-2 font-normal">
                        {step.timeline}
                      </span>
                    )}
                  </div>
                  <p className="font-serif text-[#42506F] dark:text-slate-300 text-[13px] mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                  {step.authority && (
                    <span className="text-[11px] font-sans text-[#73777F] block mt-0.5">
                      Filing Authority: {step.authority}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Follow-ups */}
      {followUps.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#E4E1DA] dark:border-slate-800 space-y-2">
          <div className="text-[11px] font-semibold text-[#73777F] dark:text-slate-400 uppercase tracking-wider">
            Relevant Inquiries
          </div>
          <div className="flex flex-wrap gap-1.5">
            {followUps.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelectFollowUp(q)}
                className="text-left text-xs px-2.5 py-1 rounded bg-[#FAF9F6] dark:bg-slate-900 border border-[#E4E1DA] dark:border-slate-800 text-[#42506F] dark:text-slate-300 hover:text-[#17244F] dark:hover:text-white hover:border-[#17244F] transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action Toolbar */}
      <div className="pt-2 border-t border-[#E4E1DA] dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs text-[#73777F]">
        <div className="flex items-center gap-1.5">
          {/* Copy */}
          <button
            type="button"
            onClick={() => onCopyMessage(message.id, displayContent)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[#42506F] dark:text-slate-300 cursor-pointer"
            title="Copy answer"
          >
            {copiedId === message.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Speech */}
          <button
            type="button"
            onClick={() => onToggleSpeech(message)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded cursor-pointer ${
              isSpeaking
                ? 'text-rose-600 font-semibold bg-rose-50 dark:bg-rose-950/40'
                : 'text-[#42506F] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isSpeaking ? "Stop speaking" : "Listen to answer"}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
          </button>

          {/* Translation */}
          <button
            type="button"
            onClick={() => onToggleTranslation(message.id)}
            disabled={message.translation?.isTranslating}
            className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[#42506F] dark:text-slate-300 cursor-pointer disabled:opacity-50"
            title={targetLabel}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>
              {message.translation?.isTranslating
                ? 'Translating...'
                : message.translation?.isShowingTranslation
                ? 'Original'
                : targetLabel}
            </span>
          </button>
        </div>

        {/* Draft Notice Button */}
        <button
          type="button"
          onClick={() => onOpenDraftWithContext(message.content.slice(0, 300))}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-[#17244F] dark:text-white bg-[#FAF9F6] dark:bg-slate-900 border border-[#E4E1DA] dark:border-slate-800 hover:border-[#17244F] transition-colors cursor-pointer"
        >
          <FileEdit className="w-3.5 h-3.5 text-[#B88A25]" />
          <span>Draft Notice from Context</span>
        </button>
      </div>
    </div>
  );
};
