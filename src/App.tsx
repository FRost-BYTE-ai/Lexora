import React, { useState, useRef, useEffect } from 'react';
import { 
  Scale, 
  Search, 
  Globe, 
  Shield, 
  BookOpen, 
  Send, 
  User, 
  Bot, 
  Info, 
  Menu, 
  X, 
  FileText, 
  FileEdit, 
  Volume2, 
  VolumeX, 
  Languages, 
  Copy, 
  Check, 
  Sparkles, 
  UploadCloud, 
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

import { 
  Message, 
  LegalDomain, 
  Jurisdiction, 
  LanguageMode, 
  ExplanationLevel, 
  ExplainabilityData,
  Category 
} from './types';
import { sendLegalQuery, classifyQueryApi, translateTextApi } from './services/legalApiService';
import { speakLegalText } from './services/speechService';
import { useLanguage } from './context/LanguageContext';

// Reusable Components
import { RiskBadge } from './components/RiskBadge';
import { SourcePanel } from './components/SourcePanel';
import { ActionPlan } from './components/ActionPlan';
import { FollowUpQuestions } from './components/FollowUpQuestions';
import { ExplainabilityModal } from './components/ExplainabilityModal';
import { DomainSelector, DOMAINS } from './components/DomainSelector';
import { LanguageSelector } from './components/LanguageSelector';
import { JurisdictionSelector } from './components/JurisdictionSelector';
import { ExplanationSelector } from './components/ExplanationSelector';
import { VoiceInputButton } from './components/VoiceInputButton';
import { DocumentUploadModal } from './components/DocumentUploadModal';
import { DraftGeneratorModal } from './components/DraftGeneratorModal';
import { LegalLibraryModal } from './components/LegalLibraryModal';

export default function App() {
  const { language, setLanguage, t } = useLanguage();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: t.chat.welcomeMessage,
      timestamp: Date.now(),
      language: language,
      risk_level: 'low',
      risk_reason: 'Introductory legal onboarding and general advisory',
      follow_up_questions: t.chat.welcomeFollowUps
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [domain, setDomain] = useState<LegalDomain>('general');
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('TN');
  const [explanationLevel, setExplanationLevel] = useState<ExplanationLevel>('citizen');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Active audio speech
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const stopSpeechRef = useRef<(() => void) | null>(null);

  // Modals state
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftTopic, setDraftTopic] = useState('');
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [activeAuditData, setActiveAuditData] = useState<ExplainabilityData | null>(null);

  // Toast / copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [voiceBaseText, setVoiceBaseText] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync initial welcome message when language changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome-1') {
        return [{
          ...prev[0],
          content: t.chat.welcomeMessage,
          language: language,
          follow_up_questions: t.chat.welcomeFollowUps
        }];
      }
      return prev;
    });
  }, [language, t]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopSpeechRef.current?.();
    };
  }, []);

  const handleSendQuery = async (queryToSend?: string) => {
    const query = (queryToSend || input).trim();
    if (!query || isLoading) return;

    const userMsgId = Date.now().toString();
    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: Date.now(),
      language,
      domain,
      jurisdiction,
      explanationLevel
    };

    setMessages(prev => [...prev, userMessage]);
    if (!queryToSend) {
      setInput('');
    }
    setIsLoading(true);

    try {
      // Step 1: Detect domain if still 'general'
      let activeDomain = domain;
      if (activeDomain === 'general') {
        const classified = await classifyQueryApi(query);
        if (classified?.domain) {
          activeDomain = classified.domain;
          setDomain(classified.domain);
        }
      }

      // Step 2: Query the full-stack legal engine
      const res = await sendLegalQuery({
        query,
        language,
        domain: activeDomain,
        jurisdiction,
        explanation_level: explanationLevel
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.answer || t.chat.errorGeneral,
        timestamp: Date.now(),
        category: (res.domain.charAt(0).toUpperCase() + res.domain.slice(1)) as Category,
        domain: res.domain as LegalDomain,
        language: res.language,
        jurisdiction: res.jurisdiction,
        explanationLevel,
        sources: res.sources,
        risk_level: res.risk_level,
        risk_reason: res.risk_reason,
        action_plan: res.action_plan,
        follow_up_questions: res.follow_up_questions,
        explainability: res.explainability
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error handling legal message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t.chat.errorGeneral,
        timestamp: Date.now(),
        language
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Audio Speech Playback
  const handleToggleSpeech = (msg: Message) => {
    if (currentlySpeakingId === msg.id) {
      stopSpeechRef.current?.();
      setCurrentlySpeakingId(null);
      return;
    }

    stopSpeechRef.current?.();
    setCurrentlySpeakingId(msg.id);

    const stopFn = speakLegalText(
      msg.translation?.isShowingTranslation ? msg.translation.translatedContent : msg.content,
      msg.language,
      () => setCurrentlySpeakingId(null)
    );
    stopSpeechRef.current = stopFn;
  };

  // Legal Translation Toggle
  const handleToggleTranslation = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    // Determine target language based on message language and current UI language
    let targetLang: 'ta' | 'en' | 'hi' = 'en';
    if (msg.language === 'ta' || msg.language === 'tanglish') {
      targetLang = language === 'hi' ? 'hi' : 'en';
    } else if (msg.language === 'en') {
      targetLang = language === 'hi' ? 'hi' : 'ta';
    } else if (msg.language === 'hi') {
      targetLang = language === 'ta' ? 'ta' : 'en';
    }

    if (msg.translation?.translatedContent && msg.translation.targetLanguage === targetLang) {
      // Toggle display
      setMessages(prev => prev.map(m => {
        if (m.id === msgId && m.translation) {
          return {
            ...m,
            translation: {
              ...m.translation,
              isShowingTranslation: !m.translation.isShowingTranslation
            }
          };
        }
        return m;
      }));
      return;
    }

    // Set loading indicator
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        return {
          ...m,
          translation: {
            translatedContent: '',
            targetLanguage: targetLang,
            isTranslating: true,
            isShowingTranslation: false
          }
        };
      }
      return m;
    }));

    try {
      const translated = await translateTextApi(msg.content, targetLang);
      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return {
            ...m,
            translation: {
              translatedContent: translated,
              targetLanguage: targetLang,
              isTranslating: false,
              isShowingTranslation: true
            }
          };
        }
        return m;
      }));
    } catch (err) {
      console.error('Translation error:', err);
      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          return {
            ...m,
            translation: undefined
          };
        }
        return m;
      }));
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDocumentAnalyzed = (result: { fileName: string; fileSize: string; analysis: string }) => {
    const localizedQuestions = 
      language === 'ta' ? [
        'இந்த ஒப்பந்தத்தில் உள்ள சாதகமற்ற விதிகளை எப்படி மாற்றுவது?',
        'இதற்கு முறையான சட்டப்பூர்வ பதில் நோட்டீஸ் (Rejoinder) தயாரித்து கொடுங்கள்',
        'சார்பதிவாளர் அலுவலகத்தில் பதிவு செய்யாவிட்டால் இந்த ஒப்பந்தம் செல்லுபடியாகுமா?'
      ] : language === 'tanglish' ? [
        'Indha agreement-la disadvantageous terms-ai eppadi change panradhu?',
        'Idhukku formal rejoinder notice ready panni thanga',
        'Sub-Registrar office-la register pannala na idhu valid-ah?'
      ] : language === 'hi' ? [
        'अनुबंध की प्रतिकूल शर्तों को कैसे संशोधित किया जा सकता है?',
        'इस अनुबंध के संबंध में औपचारिक कानूनी उत्तर नोटिस तैयार करें',
        'क्या उप-पंजीयक कार्यालय में पंजीकृत न होने पर यह समझौता मान्य है?'
      ] : [
        'How can I renegotiate these disadvantageous terms?',
        'Draft a formal legal rejoinder notice for this contract',
        'Is this agreement valid if not registered at Sub-Registrar Office?'
      ];

    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: result.analysis,
      timestamp: Date.now(),
      language,
      jurisdiction,
      risk_level: 'medium',
      risk_reason: language === 'ta' ? 'ஆவண விதிமுறைகள் பரிசீலிக்கப்பட்டு எளிய விளக்கம் அளிக்கப்பட்டுள்ளது' :
                   language === 'hi' ? 'दस्तावेज़ की शर्तों का परीक्षण कर सरल विश्लेषण प्रदान किया गया है' :
                   language === 'tanglish' ? 'Document terms analyze panni simple explanation tharappattulladhu' :
                   'Scrutinized legal terms and identified compliance clauses in plain language',
      documentMeta: {
        fileName: result.fileName,
        fileSize: result.fileSize,
        fileType: 'application/pdf'
      },
      follow_up_questions: localizedQuestions
    };
    setMessages(prev => [...prev, assistantMessage]);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden text-slate-900">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center shadow-md shadow-blue-950/20 text-white">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-blue-900">{t.common.appName}</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                {t.common.appTagline}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            aria-label={t.accessibility.toggleMenu}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav Actions */}
        <div className="p-3 border-b border-slate-100 space-y-1.5">
          <button
            onClick={() => setIsLibraryModalOpen(true)}
            aria-label={t.accessibility.openLibrary}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-900 text-xs font-semibold transition-colors border border-slate-200 hover:border-blue-200 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-700" />
              <span>{t.nav.legalLibrary}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => {
              setDraftTopic('');
              setIsDraftModalOpen(true);
            }}
            aria-label={t.accessibility.openDraft}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-900 text-xs font-semibold transition-colors border border-slate-200 hover:border-blue-200 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-amber-600" />
              <span>{t.nav.draftGenerator}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => setIsDocModalOpen(true)}
            aria-label={t.accessibility.openScrutiny}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-900 text-xs font-semibold transition-colors border border-slate-200 hover:border-blue-200 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>{t.nav.documentScrutiny}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Categories Section */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
              {t.nav.filterByDomain}
            </p>
            <div className="space-y-1">
              {DOMAINS.map(cat => {
                const isSelected = domain === cat.id;
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setDomain(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200 shadow-2xs' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-700' : 'text-slate-400'}`} />
                      <span>{t.domains[cat.id]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* NLP & Pipeline Architecture info */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
              {t.nav.nlpPipeline}
            </p>
            <div className="space-y-2 px-2">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-700 text-xs font-semibold">
                  <Bot className="w-3 h-3 text-blue-700" />
                  <span>{t.nav.indicBert}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{t.nav.indicBertDesc}</p>
              </div>

              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-700 text-xs font-semibold">
                  <Search className="w-3 h-3 text-emerald-700" />
                  <span>{t.nav.grounding}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">{t.nav.groundingDesc}</p>
              </div>
            </div>
          </div>
        </nav>

        {/* Disclaimer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="bg-white rounded-xl p-3 border border-slate-200">
            <div className="flex items-center gap-1.5 mb-1 text-slate-700 text-xs font-bold">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.common.legalDisclaimerTitle}</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {t.common.legalDisclaimerText}
            </p>
          </div>
        </div>
      </aside>

      {/* Main App Container */}
      <main className="flex-1 flex flex-col min-w-0 bg-white lg:bg-slate-50 relative">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-xl lg:hidden text-slate-600 cursor-pointer"
              aria-label={t.accessibility.toggleMenu}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Jurisdiction Selector */}
            <JurisdictionSelector
              jurisdiction={jurisdiction}
              onChange={(j) => setJurisdiction(j)}
            />
          </div>

          {/* Center / Right controls */}
          <div className="flex items-center gap-2">
            {/* Explanation Selector */}
            <div className="hidden md:block">
              <ExplanationSelector
                level={explanationLevel}
                onChange={(lvl) => setExplanationLevel(lvl)}
              />
            </div>

            {/* Language Selector */}
            <LanguageSelector />

            {/* Direct Quick Tools */}
            <button
              onClick={() => setIsLibraryModalOpen(true)}
              aria-label={t.accessibility.openLibrary}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-semibold transition-colors cursor-pointer"
              title={t.accessibility.openLibrary}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-700" />
              <span>{t.header.libraryButton}</span>
            </button>
          </div>
        </header>

        {/* Chat Stream View */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 scroll-smooth"
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isSpeaking = currentlySpeakingId === msg.id;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
                      isUser ? 'bg-blue-900 text-white' : 'bg-slate-800 text-white'
                    }`}>
                      {isUser ? <User className="w-4 h-4" /> : <Scale className="w-4 h-4 text-amber-300" />}
                    </div>

                    {/* Content Column */}
                    <div className="space-y-1.5 min-w-0">
                      <div className={`p-4 sm:p-5 rounded-2xl shadow-xs transition-all ${
                        isUser 
                          ? 'bg-blue-900 text-white rounded-tr-none' 
                          : 'bg-white border border-slate-200 rounded-tl-none text-slate-900'
                      }`}>
                        {/* Assistant Header: Badges & Why this answer */}
                        {!isUser && (
                          <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <RiskBadge level={msg.risk_level} reason={msg.risk_reason} />
                              
                              {msg.domain && (
                                <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                  {t.domains[msg.domain] || msg.category}
                                </span>
                              )}

                              {msg.jurisdiction && (
                                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                  {msg.jurisdiction === 'TN' ? t.header.tamilNaduMode : t.header.allIndiaMode}
                                </span>
                              )}
                            </div>

                            {msg.explainability && (
                              <button
                                type="button"
                                onClick={() => setActiveAuditData(msg.explainability!)}
                                className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 hover:underline cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3 text-blue-600" />
                                <span>{t.common.whyThisAnswer}</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Document Analysis Meta if present */}
                        {msg.documentMeta && (
                          <div className="mb-3 p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-700" />
                              <span className="text-xs font-bold text-blue-950">{msg.documentMeta.fileName}</span>
                              <span className="text-[10px] text-blue-700">({msg.documentMeta.fileSize})</span>
                            </div>
                            <span className="text-[10px] bg-blue-200/70 text-blue-900 font-bold px-2 py-0.5 rounded">
                              {t.chat.scrutinyReport}
                            </span>
                          </div>
                        )}

                        {/* Translation banner if currently displaying translation */}
                        {msg.translation?.isShowingTranslation && (
                          <div className="mb-2.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <Languages className="w-3.5 h-3.5 text-amber-700" />
                              <span>
                                {msg.translation.targetLanguage === 'ta' ? 'தமிழ் மொழிபெயர்ப்பு' :
                                 msg.translation.targetLanguage === 'hi' ? 'हिन्दी अनुवाद' :
                                 'English Translation'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleTranslation(msg.id)}
                              className="text-[11px] text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                            >
                              {t.common.showOriginal}
                            </button>
                          </div>
                        )}

                        {/* Text Output / Markdown */}
                        <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert text-white' : 'text-slate-800'}`}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                            {msg.translation?.isShowingTranslation 
                              ? msg.translation.translatedContent 
                              : msg.content}
                          </ReactMarkdown>
                        </div>

                        {/* Statutory Sources Panel */}
                        {!isUser && msg.sources && (
                          <SourcePanel sources={msg.sources} />
                        )}

                        {/* Action Plan Component */}
                        {!isUser && msg.action_plan && (
                          <ActionPlan steps={msg.action_plan} />
                        )}

                        {/* Suggested Follow-up Prompts */}
                        {!isUser && msg.follow_up_questions && (
                          <FollowUpQuestions 
                            questions={msg.follow_up_questions} 
                            onSelect={(q) => handleSendQuery(q)} 
                          />
                        )}

                        {/* Response Action Bar (Listen, Translate, Copy, Draft) */}
                        {!isUser && (
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Audio Output */}
                              <button
                                type="button"
                                onClick={() => handleToggleSpeech(msg)}
                                aria-label={t.accessibility.listenAudio}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                                  isSpeaking 
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                                title={isSpeaking ? t.common.stop : t.accessibility.listenAudio}
                              >
                                {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5 text-slate-600" />}
                                <span>{isSpeaking ? t.common.speaking : t.common.listen}</span>
                              </button>

                              {/* Translation Toggle */}
                              {(() => {
                                let targetLang: 'ta' | 'en' | 'hi' = 'en';
                                if (msg.language === 'ta' || msg.language === 'tanglish') {
                                  targetLang = language === 'hi' ? 'hi' : 'en';
                                } else if (msg.language === 'en') {
                                  targetLang = language === 'hi' ? 'hi' : 'ta';
                                } else if (msg.language === 'hi') {
                                  targetLang = language === 'ta' ? 'ta' : 'en';
                                }

                                const targetLabel =
                                  targetLang === 'ta' ? t.common.inTamil :
                                  targetLang === 'hi' ? 'हिन्दी में' :
                                  t.common.inEnglish;

                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleTranslation(msg.id)}
                                    disabled={msg.translation?.isTranslating}
                                    aria-label={t.accessibility.translateText}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                                      msg.translation?.isShowingTranslation
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                    title={t.accessibility.translateText}
                                  >
                                    <Languages className="w-3.5 h-3.5 text-slate-600" />
                                    <span>
                                      {msg.translation?.isTranslating 
                                        ? t.common.translating 
                                        : msg.translation?.isShowingTranslation 
                                        ? t.common.showOriginal 
                                        : targetLabel}
                                    </span>
                                  </button>
                                );
                              })()}

                              {/* Copy */}
                              <button
                                type="button"
                                onClick={() => handleCopyMessage(msg.id, msg.translation?.isShowingTranslation ? msg.translation.translatedContent : msg.content)}
                                aria-label={t.accessibility.copyText}
                                className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
                                title={t.accessibility.copyText}
                              >
                                {copiedId === msg.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700 font-bold">{t.common.copied}</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                                    <span>{t.common.copy}</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Draft generation prompt shortcut */}
                            <button
                              type="button"
                              onClick={() => {
                                setDraftTopic(msg.content.slice(0, 250));
                                setIsDraftModalOpen(true);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg font-semibold transition-colors cursor-pointer"
                            >
                              <FileEdit className="w-3.5 h-3.5 text-blue-700" />
                              <span>{t.chat.draftNoticePrompt}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Loading Skeleton */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-900 text-white flex items-center justify-center animate-pulse">
                    <Scale className="w-4 h-4 text-amber-300" />
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {t.chat.loadingStatutes}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Dock Area */}
        <div className="p-4 lg:p-6 bg-white border-t border-slate-200 lg:border-t-0 lg:bg-transparent flex-shrink-0">
          <div className="max-w-4xl mx-auto space-y-2">
            {/* Domain Selector Chips Row */}
            <DomainSelector 
              selectedDomain={domain} 
              onSelectDomain={(d) => setDomain(d)} 
            />

            {/* Quick Citations & Templates */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                {t.quickPrompts.title}
              </span>
              <button
                type="button"
                onClick={() => handleSendQuery('2023 SCC OnLine Mad 1234')}
                className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full hover:bg-blue-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                {t.quickPrompts.citation}
              </button>
              <button
                type="button"
                onClick={() => handleSendQuery('How to apply for online Patta transfer in Tamil Nadu e-Services?')}
                className="text-[11px] font-medium text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                {t.quickPrompts.patta}
              </button>
              <button
                type="button"
                onClick={() => handleSendQuery('Landlord not returning 1 lakh advance amount after vacating house in Chennai')}
                className="text-[11px] font-medium text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                {t.quickPrompts.tenancy}
              </button>
            </div>

            {/* Input Bar Container */}
            <div className="relative bg-white border border-slate-300 rounded-2xl shadow-md focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent transition-all p-2 flex flex-col">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendQuery();
                  }
                }}
                placeholder={t.chat.inputPlaceholder}
                className="w-full bg-transparent p-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none resize-none min-h-[56px] max-h-[160px]"
                rows={2}
              />

              {/* Bottom Toolbar inside Input Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 px-1">
                <div className="flex items-center gap-1.5">
                  {/* Document Upload Button */}
                  <button
                    type="button"
                    onClick={() => setIsDocModalOpen(true)}
                    aria-label={t.accessibility.uploadDoc}
                    className="p-2 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    title={t.accessibility.uploadDoc}
                  >
                    <UploadCloud className="w-4 h-4" />
                  </button>

                  {/* Voice Input Button */}
                  <VoiceInputButton
                    language={language}
                    onStart={() => setVoiceBaseText(input.trim())}
                    onTranscript={(spokenText) => {
                      setInput(voiceBaseText ? `${voiceBaseText} ${spokenText}` : spokenText);
                    }}
                    disabled={isLoading}
                  />

                  <span className="hidden sm:inline text-[10px] text-slate-400 pl-2">
                    {jurisdiction === 'TN' ? t.chat.tnModeActive : t.chat.inModeActive}
                  </span>
                </div>

                <button
                  onClick={() => handleSendQuery()}
                  disabled={!input.trim() || isLoading}
                  aria-label={t.accessibility.sendMessage}
                  className="px-4 py-2 bg-blue-900 text-white rounded-xl hover:bg-blue-800 disabled:opacity-40 disabled:hover:bg-blue-900 transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <span>{t.common.send}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 font-medium">
              {t.chat.footerNote}
            </p>
          </div>
        </div>
      </main>

      {/* Document Upload Scrutiny Modal */}
      <DocumentUploadModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onDocumentAnalyzed={handleDocumentAnalyzed}
      />

      {/* Legal Draft Generator Modal */}
      <DraftGeneratorModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        initialTopic={draftTopic}
        initialLanguage={language}
      />

      {/* Legal Library Knowledge Explorer Modal */}
      <LegalLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        onInsertTopicToChat={(topic) => handleSendQuery(topic)}
      />

      {/* "Why this answer?" Explainability Modal */}
      <ExplainabilityModal
        isOpen={!!activeAuditData}
        onClose={() => setActiveAuditData(null)}
        data={activeAuditData || undefined}
      />
    </div>
  );
}
