import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { startSpeechRecognition, isSpeechRecognitionSupported } from '../services/speechService';
import { LanguageMode } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface VoiceInputButtonProps {
  language: LanguageMode;
  onTranscript: (text: string) => void;
  onStart?: () => void;
  disabled?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  language,
  onTranscript,
  onStart,
  disabled = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [hasSupport, setHasSupport] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    setHasSupport(isSpeechRecognitionSupported());
  }, []);

  const handleToggle = () => {
    if (isListening) {
      recognitionInstance?.stop();
      setIsListening(false);
      return;
    }

    setSpeechError(null);
    setIsListening(true);
    onStart?.();

    const recognition = startSpeechRecognition({
      language,
      onResult: (text) => {
        onTranscript(text);
      },
      onError: (err) => {
        setSpeechError(err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });

    if (recognition) {
      setRecognitionInstance(recognition);
    } else {
      setIsListening(false);
    }
  };

  if (!hasSupport) {
    return (
      <button
        type="button"
        disabled
        title={t.voice.notSupported}
        aria-label={t.voice.notSupported}
        className="p-2 text-slate-300 rounded-xl cursor-not-allowed opacity-50"
      >
        <MicOff className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        id="voice-input-btn"
        disabled={disabled}
        onClick={handleToggle}
        className={`relative p-2.5 rounded-xl transition-all cursor-pointer ${
          isListening
            ? 'bg-rose-600 text-white shadow-md animate-pulse ring-4 ring-rose-200'
            : 'text-slate-500 hover:text-blue-900 hover:bg-slate-100'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        title={isListening ? t.voice.stopListening : t.voice.startListening}
        aria-label={isListening ? t.voice.stopListening : t.voice.startListening}
      >
        {isListening ? (
          <div className="flex items-center gap-1.5">
            <Square className="w-4 h-4 fill-white" />
            <span className="text-[10px] font-bold uppercase tracking-wider pr-1">{t.voice.listening}</span>
          </div>
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {speechError && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg whitespace-nowrap z-50">
          {speechError}
        </div>
      )}
    </div>
  );
};
