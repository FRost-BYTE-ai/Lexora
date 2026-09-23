import React, { useState, useRef, useEffect } from 'react';
import { 
  Scale, 
  Search, 
  Send, 
  User, 
  Sparkles, 
  UploadCloud, 
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { 
  Message, 
  LegalDomain, 
  Jurisdiction, 
  ExplanationLevel, 
  ExplainabilityData,
  Category 
} from './types';
import { sendLegalQuery, classifyQueryApi, translateTextApi } from './services/legalApiService';
import { speakLegalText } from './services/speechService';
import { useLanguage } from './context/LanguageContext';

// Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HeroWorkspace } from './components/HeroWorkspace';
import { StructuredAnswer } from './components/StructuredAnswer';
import { ResearchStatus } from './components/ResearchStatus';
import { DocumentAnalysisCard } from './components/DocumentAnalysisCard';
import { DocumentUploadModal } from './components/DocumentUploadModal';
import { DraftGeneratorModal } from './components/DraftGeneratorModal';
import { LegalLibraryModal } from './components/LegalLibraryModal';
import { CaseExplorerModal } from './components/CaseExplorerModal';
import { ExplainabilityModal } from './components/ExplainabilityModal';
import { GovernmentSchemesModal } from './components/GovernmentSchemesModal';
import { SmartHardwareAssistModal } from './components/SmartHardwareAssistModal';
import { VoiceInputButton } from './components/VoiceInputButton';

export default function App() {
  const { language, t } = useLanguage();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [domain, setDomain] = useState<LegalDomain>('general');
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('TN');
  const [explanationLevel, setExplanationLevel] = useState<ExplanationLevel>('citizen');

  // Sidebar responsive & collapsed states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Active audio speech
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const stopSpeechRef = useRef<(() => void) | null>(null);

  // Modals state
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftTopic, setDraftTopic] = useState('');
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isCaseExplorerOpen, setIsCaseExplorerOpen] = useState(false);
  const [isSchemesModalOpen, setIsSchemesModalOpen] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [activeAuditData, setActiveAuditData] = useState<ExplainabilityData | null>(null);

  // Copy feedback & voice recording baseline
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [voiceBaseText, setVoiceBaseText] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLTextAreaElement>(null);

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
    setInput('');
    setIsLoading(true);

    try {
      // Step 1: Automatic domain classification if general
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

    let targetLang: 'ta' | 'en' | 'hi' = 'en';
    if (msg.language === 'ta' || msg.language === 'tanglish') {
      targetLang = language === 'hi' ? 'hi' : 'en';
    } else if (msg.language === 'en') {
      targetLang = language === 'hi' ? 'hi' : 'ta';
    } else if (msg.language === 'hi') {
      targetLang = language === 'ta' ? 'ta' : 'en';
    }

    if (msg.translation?.translatedContent && msg.translation.targetLanguage === targetLang) {
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

  const handleNewQuery = () => {
    setMessages([]);
    setInput('');
    searchBoxRef.current?.focus();
  };

  const handleOpenDraftWithContext = (contextText: string) => {
    setDraftTopic(contextText);
    setIsDraftModalOpen(true);
  };

  const isThreadActive = messages.length > 0;

  return (
    <div className="flex h-screen bg-[#FDFBF7] dark:bg-[#090D16] font-sans overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Redesigned Collapsible Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        selectedDomain={domain}
        onSelectDomain={(d) => setDomain(d)}
        onNewQuery={handleNewQuery}
        onFocusSearch={() => searchBoxRef.current?.focus()}
        onOpenLibrary={() => setIsLibraryModalOpen(true)}
        onOpenDraft={() => {
          setDraftTopic('');
          setIsDraftModalOpen(true);
        }}
        onOpenScrutiny={() => setIsDocModalOpen(true)}
        onOpenCaseExplorer={() => setIsCaseExplorerOpen(true)}
        onOpenSchemes={() => setIsSchemesModalOpen(true)}
        onOpenHardware={() => setIsHardwareModalOpen(true)}
        savedCount={0}
        conversationCount={isThreadActive ? 1 : 0}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Redesigned Header */}
        <Header
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          jurisdiction={jurisdiction}
          onJurisdictionChange={(j) => setJurisdiction(j)}
          explanationLevel={explanationLevel}
          onExplanationLevelChange={(lvl) => setExplanationLevel(lvl)}
          onOpenLibrary={() => setIsLibraryModalOpen(true)}
          onOpenSchemes={() => setIsSchemesModalOpen(true)}
          onOpenHardware={() => setIsHardwareModalOpen(true)}
        />

        {/* Workspace Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {!isThreadActive ? (
            /* Homepage / New Query Workspace */
            <HeroWorkspace
              input={input}
              setInput={setInput}
              onSend={handleSendQuery}
              isLoading={isLoading}
              domain={domain}
              setDomain={setDomain}
              jurisdiction={jurisdiction}
              setJurisdiction={setJurisdiction}
              explanationLevel={explanationLevel}
              setExplanationLevel={setExplanationLevel}
              onOpenDocModal={() => setIsDocModalOpen(true)}
              onOpenDraftModal={() => {
                setDraftTopic('');
                setIsDraftModalOpen(true);
              }}
              onOpenLibraryModal={() => setIsLibraryModalOpen(true)}
              onOpenCaseExplorer={() => setIsCaseExplorerOpen(true)}
              onOpenSchemesModal={() => setIsSchemesModalOpen(true)}
              onOpenHardwareModal={() => setIsHardwareModalOpen(true)}
              onSelectPrompt={(p) => handleSendQuery(p)}
              voiceBaseText={voiceBaseText}
              setVoiceBaseText={setVoiceBaseText}
              searchBoxRef={searchBoxRef}
            />
          ) : (
            /* Active Research Thread */
            <div className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
              {/* Thread Header Reset Shortcut */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t.nav.conversations} ({jurisdiction === 'TN' ? 'Tamil Nadu' : 'All India'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleNewQuery}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.nav.newQuery}</span>
                </button>
              </div>

              {/* Messages Stream */}
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isSpeaking = currentlySpeakingId === msg.id;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {isUser ? (
                      /* User Query Bubble */
                      <div className="max-w-[90%] sm:max-w-[80%] bg-indigo-950 dark:bg-indigo-600 text-white p-4 rounded-3xl rounded-tr-md shadow-xs">
                        <div className="flex items-center gap-2 mb-1.5 text-[10px] font-bold text-indigo-200 dark:text-indigo-100">
                          <User className="w-3.5 h-3.5" />
                          <span>YOU</span>
                          <span>•</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    ) : (
                      /* Assistant Structured Answer Card */
                      <div className="w-full">
                        {msg.documentMeta && (
                          <DocumentAnalysisCard
                            fileName={msg.documentMeta.fileName}
                            fileSize={msg.documentMeta.fileSize}
                            onAskLexoraClause={(clause, rec) => {
                              handleSendQuery(`Please draft a legally protective counter-clause for "${clause}" considering: ${rec}`);
                            }}
                          />
                        )}
                        <StructuredAnswer
                          message={msg}
                          isSpeaking={isSpeaking}
                          copiedId={copiedId}
                          onToggleSpeech={handleToggleSpeech}
                          onToggleTranslation={handleToggleTranslation}
                          onCopyMessage={handleCopyMessage}
                          onOpenDraftWithContext={handleOpenDraftWithContext}
                          onOpenExplainability={() => {
                            if (msg.explainability) {
                              setActiveAuditData(msg.explainability);
                            }
                          }}
                          onSelectFollowUp={(q) => handleSendQuery(q)}
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Research Status Progression during processing */}
              <ResearchStatus isLoading={isLoading} />
            </div>
          )}
        </div>

        {/* Bottom Floating Query Dock when in Active Thread */}
        {isThreadActive && (
          <div className="p-3 sm:p-4 bg-white/95 dark:bg-[#0E1526]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="relative rounded-2xl bg-slate-50 dark:bg-[#11192C] border border-slate-300 dark:border-slate-700 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-500/20 p-2 flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendQuery();
                    }
                  }}
                  placeholder={t.hero.searchPlaceholder}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none"
                />

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <VoiceInputButton
                    language={language}
                    onStart={() => setVoiceBaseText(input.trim())}
                    onTranscript={(spoken) => {
                      setInput(voiceBaseText ? `${voiceBaseText} ${spoken}` : spoken);
                    }}
                    disabled={isLoading}
                  />

                  <button
                    type="button"
                    onClick={() => handleSendQuery()}
                    disabled={!input.trim() || isLoading}
                    className="px-3.5 py-1.5 bg-indigo-950 dark:bg-indigo-600 hover:bg-indigo-900 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <span>{t.common.send}</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Overlays */}
      <DocumentUploadModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onDocumentAnalyzed={handleDocumentAnalyzed}
      />

      <DraftGeneratorModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        initialTopic={draftTopic}
        initialLanguage={language}
      />

      <LegalLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        onInsertTopicToChat={(topic) => handleSendQuery(topic)}
      />

      <CaseExplorerModal
        isOpen={isCaseExplorerOpen}
        onClose={() => setIsCaseExplorerOpen(false)}
        onInsertToChat={(query) => handleSendQuery(query)}
      />

      <GovernmentSchemesModal
        isOpen={isSchemesModalOpen}
        onClose={() => setIsSchemesModalOpen(false)}
        onAskAboutScheme={(query) => handleSendQuery(query)}
      />

      <SmartHardwareAssistModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        onDocumentAnalyzed={handleDocumentAnalyzed}
      />

      <ExplainabilityModal
        isOpen={!!activeAuditData}
        onClose={() => setActiveAuditData(null)}
        data={activeAuditData || undefined}
      />
    </div>
  );
}
