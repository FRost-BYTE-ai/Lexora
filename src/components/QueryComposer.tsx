import React, { useRef, useState, useEffect } from 'react';
import { 
  Paperclip, 
  Mic, 
  MicOff, 
  ArrowUp, 
  MapPin, 
  Loader2 
} from 'lucide-react';
import { Jurisdiction } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface QueryComposerProps {
  input: string;
  setInput: (value: string) => void;
  onSend: (override?: string) => void;
  isLoading: boolean;
  onOpenDocModal?: () => void;
  jurisdiction?: Jurisdiction;
  onToggleJurisdiction?: () => void;
  searchBoxRef?: React.RefObject<HTMLTextAreaElement | null>;
  placeholder?: string;
  autoFocus?: boolean;
}

export const QueryComposer: React.FC<QueryComposerProps> = ({
  input,
  setInput,
  onSend,
  isLoading,
  onOpenDocModal,
  jurisdiction = 'TN',
  onToggleJurisdiction,
  searchBoxRef,
  placeholder,
  autoFocus = false
}) => {
  const { t } = useLanguage();
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const activeRef = searchBoxRef || localRef;
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (autoFocus && activeRef.current) {
      activeRef.current.focus();
    }
  }, [autoFocus, activeRef]);

  // Adjust textarea height automatically as user types
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.style.height = 'auto';
      activeRef.current.style.height = `${Math.min(activeRef.current.scrollHeight, 180)}px`;
    }
  }, [input, activeRef]);

  // Web Speech API for voice dictation
  const handleToggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ta-IN'; // Tamil default, falls back to English transcription

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(input ? `${input} ${transcript}` : transcript);
        }
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSend();
      }
    }
  };

  const hasText = Boolean(input.trim());
  const resolvedPlaceholder = placeholder || t.chat.inputPlaceholder;

  return (
    <div className="w-full bg-white dark:bg-[#101522] border border-[#D5D8DF] dark:border-slate-800 rounded-2xl shadow-sm transition-all focus-within:border-[#17244F] dark:focus-within:border-slate-500 focus-within:ring-2 focus-within:ring-[#17244F]/5">
      {/* Input Textarea (ChatGPT style auto-resizing) */}
      <div className="px-4 pt-3.5 pb-1">
        <textarea
          ref={activeRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={resolvedPlaceholder}
          rows={1}
          disabled={isLoading}
          className="w-full bg-transparent text-[#17244F] dark:text-[#EAECEF] text-sm md:text-[15px] placeholder-[#8B93A7] dark:placeholder-slate-500 resize-none focus:outline-none leading-relaxed min-h-[38px] max-h-[180px]"
        />
      </div>

      {/* Bottom Control Bar */}
      <div className="px-3 pb-2.5 pt-1 flex items-center justify-between gap-2">
        {/* Left Controls */}
        <div className="flex items-center gap-1 text-xs text-[#525F7F] dark:text-slate-300">
          {onOpenDocModal && (
            <button
              type="button"
              onClick={onOpenDocModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#525F7F] dark:text-slate-300 hover:text-[#17244F] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Upload document for analysis"
            >
              <Paperclip className="w-3.5 h-3.5 text-[#73777F]" />
              <span className="hidden sm:inline">Attach</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleVoice}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isListening
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                : 'text-[#525F7F] dark:text-slate-300 hover:text-[#17244F] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-slate-800'
            }`}
            title={isListening ? t.voice.stopListening : t.voice.startListening}
          >
            {isListening ? (
              <MicOff className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            ) : (
              <Mic className="w-3.5 h-3.5 text-[#73777F]" />
            )}
            <span className="hidden sm:inline">{isListening ? t.voice.listening : t.voice.startListening}</span>
          </button>

          {onToggleJurisdiction ? (
            <button
              type="button"
              onClick={onToggleJurisdiction}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#73777F] dark:text-slate-400 hover:text-[#17244F] hover:bg-[#F3F4F6] dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Click to toggle jurisdiction"
            >
              <MapPin className="w-3 h-3 text-[#B88A25]" />
              <span>{jurisdiction === 'TN' ? t.header.tamilNaduMode : t.header.allIndiaMode}</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-[#73777F] dark:text-slate-400">
              <MapPin className="w-3 h-3 text-[#B88A25]" />
              <span>{jurisdiction === 'TN' ? t.header.tamilNaduMode : t.header.allIndiaMode}</span>
            </span>
          )}
        </div>

        {/* Right Send Circular Button (ChatGPT style) */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onSend()}
            disabled={!hasText || isLoading}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              hasText && !isLoading
                ? 'bg-[#17244F] text-white hover:bg-[#23356E] shadow-sm'
                : 'bg-[#E5E7EB] dark:bg-slate-800 text-[#9CA3AF] dark:text-slate-600 cursor-not-allowed'
            }`}
            title={t.common.send}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
