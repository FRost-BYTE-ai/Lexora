import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Printer, 
  Copy, 
  Check, 
  PhoneCall, 
  MapPin, 
  FileText, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  Send,
  Mic,
  Square,
  Scale,
  FileCheck
} from 'lucide-react';
import { Message } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { speakLegalText, startSpeechRecognition, isSpeechRecognitionSupported } from '../services/speechService';
import { TamilEmblem, TamilBorderPattern } from './TamilEmblem';

interface CitizenAnswerViewProps {
  userMessage?: Message;
  assistantMessage: Message;
  onBackToHome: () => void;
  onSendFollowUp: (query: string) => void;
  isLoadingFollowUp?: boolean;
}

export const CitizenAnswerView: React.FC<CitizenAnswerViewProps> = ({
  userMessage,
  assistantMessage,
  onBackToHome,
  onSendFollowUp,
  isLoadingFollowUp = false
}) => {
  const { language } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [copied, setCopied] = useState(false);
  const [cancelSpeechFn, setCancelSpeechFn] = useState<(() => void) | null>(null);

  // Follow-up query state
  const [followUpText, setFollowUpText] = useState('');
  const [isFollowUpListening, setIsFollowUpListening] = useState(false);
  const [followUpRecognition, setFollowUpRecognition] = useState<any>(null);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (cancelSpeechFn) {
        cancelSpeechFn();
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [cancelSpeechFn]);

  // Audio Playback Handler
  const handleToggleSpeech = (rate: number = speechRate) => {
    if (isSpeaking) {
      cancelSpeechFn?.();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setCancelSpeechFn(null);
      return;
    }

    setIsSpeaking(true);
    const cleanText = assistantMessage.content
      .replace(/[#*`_>~-]/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\s+/g, ' ')
      .slice(0, 900);

    const cancelFn = speakLegalText(
      cleanText, 
      language === 'ta' ? 'ta' : 'en', 
      () => {
        setIsSpeaking(false);
        setCancelSpeechFn(null);
      },
      rate
    );
    setCancelSpeechFn(() => cancelFn);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(assistantMessage.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Follow-up voice recognition
  const handleToggleFollowUpVoice = async () => {
    if (isFollowUpListening) {
      followUpRecognition?.stop();
      setIsFollowUpListening(false);
      return;
    }

    setIsFollowUpListening(true);
    const recognition = await startSpeechRecognition({
      language: language === 'ta' ? 'ta' : 'en',
      onResult: (text) => {
        setFollowUpText(text);
      },
      onError: () => {
        setIsFollowUpListening(false);
      },
      onEnd: () => {
        setIsFollowUpListening(false);
      }
    });

    if (recognition) {
      setFollowUpRecognition(recognition);
    } else {
      setIsFollowUpListening(false);
    }
  };

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() || isLoadingFollowUp) return;
    onSendFollowUp(followUpText.trim());
    setFollowUpText('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* 0. ALWAYS-VISIBLE 'BACK TO HOME / START OVER' NAVIGATION CONTROL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-slate-300 dark:border-slate-800">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7A1C28] hover:bg-[#5C141F] text-white font-black text-sm shadow-xs transition-colors cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4 text-amber-300" />
          <span>{language === 'ta' ? '⟵ முகப்புக்கு திரும்புக / புதிய கேள்வி' : '⟵ Back to Home / New Question'}</span>
        </button>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F1E33] text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? (language === 'ta' ? 'நகலெடுக்கப்பட்டது!' : 'Copied!') : (language === 'ta' ? 'நகலெடு' : 'Copy')}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0F1E33] text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'ta' ? 'அச்சிடுக' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* CITIZEN QUERY RE-STATEMENT (CONFIRMATION OF WHAT WAS ASKED) */}
      {userMessage && (
        <div className="bg-[#FAF8F5] dark:bg-[#0A1626] p-4 rounded-2xl border-2 border-[#0B2545]/20 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#0B2545] text-amber-300 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
            கே
          </div>
          <div>
            <span className="text-[11px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-wider block">
              {language === 'ta' ? 'நீங்கள் கேட்ட கேள்வி:' : 'Your Legal Question:'}
            </span>
            <p className="text-base sm:text-lg font-bold text-[#0B2545] dark:text-white leading-snug mt-0.5">
              "{userMessage.content}"
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          TIER 1: A SHORT PLAIN-LANGUAGE TAMIL SUMMARY FIRST
          ========================================================================= */}
      <div className="bg-white dark:bg-[#0F1E33] p-5 sm:p-7 rounded-3xl border-3 border-[#0B2545] dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <TamilEmblem className="w-8 h-8 flex-shrink-0" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                1. நேரடி மக்கள் விளக்கம் · PLAIN SUMMARY
              </span>
              <h2 className="text-lg sm:text-xl font-black text-[#0B2545] dark:text-white mt-0.5 font-sans">
                {language === 'ta' ? 'சட்ட விளக்கம் & மக்கள் உரிமை' : 'Statutory Explanation & Citizen Rights'}
              </h2>
            </div>
          </div>

          <span className="hidden sm:inline-block text-xs font-bold text-emerald-700 dark:text-emerald-400">
            ✓ தமிழ்நாடு சட்டங்களின்படி
          </span>
        </div>

        {/* Formatted Markdown Content */}
        <div className="text-[#152335] dark:text-slate-100 text-base sm:text-lg leading-relaxed space-y-3 prose dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {assistantMessage.content}
          </ReactMarkdown>
        </div>
      </div>

      {/* =========================================================================
          TIER 2: LEGAL CITATION / SOURCE (RENDERED ONLY WHEN EVIDENCE IS PRESENT)
          ========================================================================= */}
      {assistantMessage.sources && assistantMessage.sources.length > 0 && (
        <div className="bg-[#FCFBF7] dark:bg-[#0A1626] p-5 sm:p-6 rounded-3xl border-2 border-amber-800/30 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-800/20">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-700 dark:text-amber-400 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-300">
                  சட்டப்பூர்வ அரசு ஆதாரம் · LEGAL CITATIONS
                </span>
                <h3 className="text-sm sm:text-base font-black text-[#0B2545] dark:text-white mt-0.5">
                  {language === 'ta' ? 'அதிகாரப்பூர்வ அரசு சட்டங்கள் & அரசாணைகள்' : 'Official Acts & Statutory Provisions'}
                </h3>
              </div>
            </div>

            <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
              தமிழ்நாடு அரசிதழ் / Central Gazette
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {assistantMessage.sources.map((source, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#0F1E33] border-2 border-amber-600/20 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-400 block mb-1">
                    {source.section || (language === 'ta' ? 'சட்டப்பிரிவு' : 'Statutory Provision')}
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-[#0B2545] dark:text-white leading-tight">
                    {source.title}
                  </p>
                  {source.act && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-medium">
                      {source.act}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">
                    {source.source || (language === 'ta' ? 'தமிழ்நாடு அரசு சட்டம்' : 'Govt of Tamil Nadu Act')}
                  </span>
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#7A1C28] dark:text-amber-400 font-bold hover:underline"
                    >
                      <span>{language === 'ta' ? 'அரசு கெஜட்' : 'Gazette'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-xs text-slate-600 dark:text-slate-400 font-medium pt-1">
            🏛️ {language === 'ta' 
              ? 'பொதுமக்கள் சட்ட விழிப்புணர்வுக்கு வழங்கப்பட்டது. உண்மை ஆதாரங்களை நீதிமன்றத்தில் சான்றாக பயன்படுத்தலாம்.' 
              : 'Provided for statutory public awareness. Citations can be presented before authorities.'}
          </div>
        </div>
      )}

      {/* =========================================================================
          TIER 3: ACTION STEPS (RENDERED ONLY WHEN ACTION STEPS EXIST)
          ========================================================================= */}
      {assistantMessage.action_plan && assistantMessage.action_plan.length > 0 && (
        <div className="bg-[#FAF7EE] dark:bg-[#0B1728] p-5 sm:p-7 rounded-3xl border-3 border-emerald-700/30 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-emerald-700/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                  அடுத்த கட்ட நடவடிக்கை · ACTION STEPS
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#0B2545] dark:text-white mt-0.5">
                  {language === 'ta' ? 'நீங்கள் செய்ய வேண்டியவை (வரிசை முறை)' : 'What You Must Do (Step-by-Step Action Plan)'}
                </h3>
              </div>
            </div>
            <span className="text-xs text-emerald-800 dark:text-emerald-400 font-bold hidden sm:inline">
              வரிசையாக பின்பற்றவும்
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {assistantMessage.action_plan.map((step, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-2xl bg-white dark:bg-[#0F1E33] border-2 border-emerald-600/20 shadow-2xs space-y-2"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0B2545] text-white flex items-center justify-center font-black text-sm flex-shrink-0">
                    {step.order || idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm sm:text-base font-bold text-[#0B2545] dark:text-white">
                      {step.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                      {step.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold">
                      {step.authority && (
                        <span className="inline-flex items-center gap-1 text-[#7A1C28] dark:text-amber-300">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{language === 'ta' ? 'அணுக வேண்டிய அலுவலகம்:' : 'Office:'} {step.authority}</span>
                        </span>
                      )}
                      {step.timeline && (
                        <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{language === 'ta' ? 'காலக்கெடு:' : 'Timeline:'} {step.timeline}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Phone Hotline Callout for Immediate Action */}
          <div className="p-3.5 rounded-2xl bg-[#0B2545] text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <span>
                {language === 'ta' 
                  ? 'உடனடி சட்ட உதவி தேவைப்பட்டால் இலவச தேசிய உதவி எண்:' 
                  : 'For immediate free legal aid, National Legal Services Authority (NALSA):'}
              </span>
            </div>
            <a 
              href="tel:15100" 
              className="px-3 py-1 rounded-lg bg-amber-400 text-slate-900 font-bold hover:bg-amber-300 transition-colors"
            >
              📞 15100 (Free Legal Aid)
            </a>
          </div>
        </div>
      )}

      {/* Emergency Helplines bar */}
      <div className="p-3.5 rounded-2xl bg-[#0B2545] text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-emerald-400" />
          <span className="font-bold">
            {language === 'ta' ? 'உடனடி தொலைபேசி உதவி எண்கள்:' : 'Direct Emergency Helplines:'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-black text-amber-300">
          <a href="tel:112" className="hover:underline">காவல்துறை: 112</a>
          <span>·</span>
          <a href="tel:181" className="hover:underline">மகளிர்: 181</a>
          <span>·</span>
          <a href="tel:14447" className="hover:underline">பயிர் காப்பீடு: 14447</a>
          <span>·</span>
          <a href="tel:15100" className="hover:underline">சட்ட உதவி: 15100</a>
        </div>
      </div>

      {/* =========================================================================
          TIER 4: AUDIO PLAYBACK OPTION FOR THE ANSWER (LOW-LITERACY / ELDERS)
          ========================================================================= */}
      <div className="bg-gradient-to-r from-[#7A1C28] to-[#5C141F] text-white p-5 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/20">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-amber-300" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400 text-[#0B2545]">
                4. குரல்வழியாக கேட்க · AUDIO PLAYBACK
              </span>
              <h3 className="text-sm sm:text-base font-black mt-0.5">
                {language === 'ta' ? 'இந்த சட்ட விளக்கத்தை குரல்வழியாக கேட்கலாம்' : 'Listen to this Legal Advice in Audio'}
              </h3>
            </div>
          </div>
          <span className="text-xs text-amber-200 font-semibold hidden sm:inline">
            படிக்க சிரமமாக உள்ளவர்களுக்கு
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          <div className="text-xs text-amber-100/90 leading-relaxed text-center sm:text-left">
            <p>
              {isSpeaking
                ? (language === 'ta' ? '🔊 பதில் எளிய தமிழில் குரல்வழியாக வாசிக்கப்படுகிறது...' : '🔊 Response is playing aloud in voice...')
                : (language === 'ta' ? 'ஸ்பீக்கர் பட்டனை அழுத்தி முழு விளக்கத்தையும் எளிய தமிழில் காதால் கேட்கலாம்.' : 'Tap play to hear the explanation spoken aloud clearly.')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed toggle for elders */}
            <div className="bg-[#480E16] rounded-xl p-1 flex items-center text-xs font-bold text-amber-200">
              <button
                type="button"
                onClick={() => {
                  setSpeechRate(0.85);
                  if (isSpeaking) handleToggleSpeech(0.85);
                }}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  speechRate < 1 ? 'bg-amber-400 text-[#0B2545]' : 'hover:text-white'
                }`}
                title="மெதுவாக (Slow for elders)"
              >
                0.8x மெதுவாக
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpeechRate(1.0);
                  if (isSpeaking) handleToggleSpeech(1.0);
                }}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  speechRate === 1.0 ? 'bg-amber-400 text-[#0B2545]' : 'hover:text-white'
                }`}
                title="இயல்பு வேகம் (Normal speed)"
              >
                1.0x இயல்பு
              </button>
            </div>

            {/* Play/Stop Button */}
            <button
              type="button"
              onClick={() => handleToggleSpeech(speechRate)}
              className={`px-6 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                isSpeaking 
                  ? 'bg-amber-400 hover:bg-amber-500 text-[#0B2545]' 
                  : 'bg-white hover:bg-slate-100 text-[#7A1C28]'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>{language === 'ta' ? '⏹️ ஒலியை நிறுத்து' : '⏹️ Stop Audio'}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>{language === 'ta' ? '🔊 ஒலியை இயக்கு' : '🔊 Play Audio'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 5. ASK FOLLOW-UP QUESTION (CLEAN INQUIRY BOX) */}
      <div className="bg-white dark:bg-[#0F1E33] p-4 rounded-2xl border-2 border-[#0B2545] dark:border-slate-700 shadow-sm space-y-3">
        <span className="text-xs font-black text-[#0B2545] dark:text-white block">
          {language === 'ta' ? 'இந்த பதில் தொடர்பாக வேறு ஏதேனும் சந்தேகம் உள்ளதா?' : 'Have a follow-up question on this advice?'}
        </span>

        <form onSubmit={handleFollowUpSubmit} className="flex items-center gap-2">
          {isSpeechRecognitionSupported() && (
            <button
              type="button"
              onClick={handleToggleFollowUpVoice}
              className={`p-3 rounded-xl transition-all cursor-pointer ${
                isFollowUpListening
                  ? 'bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse'
                  : 'bg-[#F6F4ED] dark:bg-[#0A1626] text-[#7A1C28] hover:bg-slate-200'
              }`}
              title={language === 'ta' ? 'குரல் உள்ளீடு' : 'Voice Input'}
            >
              {isFollowUpListening ? <Square className="w-4 h-4 fill-white" /> : <Mic className="w-4 h-4" />}
            </button>
          )}

          <input
            type="text"
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
            placeholder={
              language === 'ta' 
                ? 'உங்கள் கூடுதல் சந்தேகத்தை இங்கு எழுதவும்...' 
                : 'Type your follow-up query here...'
            }
            className="flex-1 p-3 rounded-xl bg-[#FCFBF7] dark:bg-[#0A1424] border-2 border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:border-[#0B2545] text-[#0B2545] dark:text-white font-medium"
          />

          <button
            type="submit"
            disabled={!followUpText.trim() || isLoadingFollowUp}
            className="px-5 py-3 rounded-xl bg-[#0B2545] hover:bg-[#133863] text-white font-black text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
          >
            <span>{language === 'ta' ? 'கேட்க' : 'Ask'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* 6. BOTTOM ALWAYS-VISIBLE BACK TO HOME BUTTON */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0B2545] hover:bg-[#133863] text-white font-black text-sm shadow-md transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-amber-300" />
          <span>{language === 'ta' ? '⟵ முகப்புக்கு திரும்புக (புதிய கேள்வி கேட்க)' : '⟵ Back to Home (Ask New Question)'}</span>
        </button>
      </div>
    </div>
  );
};
