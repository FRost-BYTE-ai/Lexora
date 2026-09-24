import React, { useState, useRef, useEffect } from 'react';
import { 
  Message, 
  LegalDomain, 
  Jurisdiction, 
  ExplanationLevel, 
  Category,
  Conversation,
  ExplainabilityData,
  DocumentScanMode,
  LanguageMode
} from './types';
import { sendLegalQuery, classifyQueryApi, translateTextApi } from './services/legalApiService';
import { speakLegalText, stopSpeech } from './services/speechService';
import { useLanguage } from './context/LanguageContext';
import { Plus, Loader2 } from 'lucide-react';

// Components
import { LexoraSidebar } from './components/LexoraSidebar';
import { LexoraHeader } from './components/LexoraHeader';
import { HeroWorkspace } from './components/HeroWorkspace';
import { StructuredAnswer } from './components/StructuredAnswer';
import { DocumentUploadModal } from './components/DocumentUploadModal';
import { DraftGeneratorModal } from './components/DraftGeneratorModal';
import { LegalLibraryModal } from './components/LegalLibraryModal';
import { CaseExplorerModal } from './components/CaseExplorerModal';
import { GovernmentSchemesModal } from './components/GovernmentSchemesModal';
import { SmartHardwareAssistModal } from './components/SmartHardwareAssistModal';
import { ExplainabilityModal } from './components/ExplainabilityModal';
import { QueryComposer } from './components/QueryComposer';

export default function App() {
  const { language } = useLanguage();

  // Mode and settings
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('TN');
  const [explanationLevel, setExplanationLevel] = useState<ExplanationLevel>('citizen');
  const [domain, setDomain] = useState<LegalDomain>('general');

  // Sidebar responsive state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Search input state
  const [input, setInput] = useState('');
  const searchBoxRef = useRef<HTMLTextAreaElement | null>(null);

  // Modals state
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isCaseExplorerOpen, setIsCaseExplorerOpen] = useState(false);
  const [isSchemesModalOpen, setIsSchemesModalOpen] = useState(false);
  const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
  const [explainabilityData, setExplainabilityData] = useState<ExplainabilityData | null>(null);
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);
  const [draftInitialContext, setDraftInitialContext] = useState('');

  // Speech & Copy state
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Seed Conversations with complete legal assessments
  const initialDefaultConversations: Conversation[] = [
    {
      id: 'conv-new-1',
      title: 'New Legal Consultation',
      timestamp: Date.now(),
      messages: [],
      domain: 'general'
    },
    {
      id: 'conv-sample-2',
      title: 'What is the mandatory leg...',
      timestamp: Date.now() - 3600000,
      messages: [
        {
          id: 'msg-u2',
          role: 'user',
          content: 'What is the mandatory legal notice period before evicting a tenant in Tamil Nadu?',
          timestamp: Date.now() - 3600000,
          language: 'en'
        },
        {
          id: 'msg-a2',
          role: 'assistant',
          content: 'Under the **Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act, 2017 (TNRRRLT Act)**:\n\n1. **Mandatory Written Tenancy Agreement (Section 4):** All tenancies in Tamil Nadu must be evidenced by a registered written agreement submitted to the Rent Authority portal within 90 days.\n2. **Statutory Notice Period (Section 21):** A landlord must serve a formal written notice of at least **30 days** (or the period stipulated in the registered contract) specifying specific statutory grounds such as non-payment of rent, willful denial of title, or subletting.\n3. **Exclusive Rent Court Jurisdiction:** Ordinary civil court suits are barred. If the tenant fails to vacate upon expiry of notice, the landlord must file an eviction petition before the designated **Rent Court** headed by the District Munsif.',
          timestamp: Date.now() - 3590000,
          category: 'Property',
          domain: 'property',
          language: 'en',
          jurisdiction: 'TN',
          risk_level: 'medium',
          sources: [
            {
              title: 'Tamil Nadu Regulation of Rights & Responsibilities of Landlords & Tenants Act, 2017',
              section: 'Section 21 (Repossession by Landlord) & Section 4',
              act: 'TNRRRLT Act 2017',
              source: 'Tamil Nadu Housing and Urban Development Department',
              url: 'https://tenancy.tn.gov.in'
            }
          ],
          action_plan: [
            {
              order: 1,
              title: 'Issue Statutory 30-Day Notice',
              description: 'Issue formal written notice specifying default grounds via Registered Post with Acknowledgment Due (RPAD).',
              authority: 'Landlord / Advocate',
              timeline: 'Immediate'
            },
            {
              order: 2,
              title: 'File Eviction Petition',
              description: 'Lodge formal petition before the jurisdictional Rent Court under Section 21 if notice remains uncomplied.',
              authority: 'Designated Rent Court',
              timeline: 'Upon expiry of 30 days'
            }
          ],
          follow_up_questions: [
            'What happens if the tenancy agreement is not registered under TNRRRLT Act?',
            'What are the statutory grounds for urgent recovery of possession for personal occupation?',
            'How is mesne profit calculated during eviction proceedings?'
          ]
        }
      ],
      domain: 'property'
    },
    {
      id: 'conv-sample-3',
      title: 'பக்கத்து வீட்டுக்காரருக்...',
      timestamp: Date.now() - 7200000,
      messages: [
        {
          id: 'msg-u3',
          role: 'user',
          content: 'பக்கத்து வீட்டுக்காரர் எங்கள் பொது வழியில் அத்துமீறி ஆக்கிரமிப்பு செய்துள்ளார். சட்டப்படி என்ன செய்வது?',
          timestamp: Date.now() - 7200000,
          language: 'ta'
        },
        {
          id: 'msg-a3',
          role: 'assistant',
          content: 'பொது வழி அல்லது பொது பாதை ஆக்கிரமிப்பு தொடர்பாக தமிழ்நாட்டில் உள்ள சட்ட வழிகாட்டுதல்:\n\n1. **பொது தொல்லை நீக்கம் (Section 152 BNSS / பழைய CrPC 133):** பொது வழியை ஆக்கிரமிப்பது சட்டவிரோத பொது தொல்லை (Public Nuisance) ஆகும். கோட்டாட்சியர் (Sub-Divisional Magistrate / RDO) அவர்களிடம் உடனடியாக மனு தாக்கல் செய்து ஆக்கிரமிப்பை அகற்ற உத்தரவு பெறலாம்.\n2. **உள்ளாட்சி அதிகார வரம்பு (TN Panchayats Act / District Municipalities Act):** ஊராட்சி அல்லது நகராட்சி ஆணையருக்கு எழுத்துப்பூர்வ புகார் அளித்து, சர்வேயரை கொண்டு நிலத்தை அளவீடு செய்து ஆக்கிரமிப்பை அகற்ற கோரலாம்.\n3. **சிவில் நீதிமன்ற தடையாணை (Civil Injunction):** உரிமையியல் நீதிமன்றத்தில் (Civil Court) உறுத்துக்கட்டளை (Permanent & Mandatory Injunction) கோரி வழக்கு தொடர்ந்து நீதிமன்ற உத்தரவு பெறலாம்.',
          timestamp: Date.now() - 7190000,
          category: 'Property',
          domain: 'property',
          language: 'ta',
          jurisdiction: 'TN',
          risk_level: 'medium',
          sources: [
            {
              title: 'Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)',
              section: 'Section 152 (Conditional order for removal of nuisance)',
              act: 'BNSS 2023',
              source: 'Ministry of Law & Justice',
              url: 'https://indiacode.nic.in'
            },
            {
              title: 'Tamil Nadu District Municipalities Act, 1920',
              section: 'Section 180 (Encroachment on Streets)',
              act: 'TN District Municipalities Act',
              source: 'Tamil Nadu Municipal Administration Department'
            }
          ],
          action_plan: [
            {
              order: 1,
              title: 'வருவாய்த்துறை சர்வே மனு',
              description: 'வட்டாட்சியர் (Tahsildar) அலுவலகத்தில் பொதுப்பாதை அளவீடு கோரி எ-சேவை மூலம் மனு சமர்ப்பிக்கவும்.',
              authority: 'வட்டாட்சியர் அலுவலகம்',
              timeline: 'உடனடியாக'
            },
            {
              order: 2,
              title: 'கோட்டாட்சியரிடம் பிரிவு 152 BNSS மனு',
              description: 'பொதுப்பாதை அடைக்கப்பட்டதற்கான புகைப்படங்கள் மற்றும் பட்டா ஆவணங்களுடன் RDO-விடம் மனு தாக்கல் செய்யவும்.',
              authority: 'RDO / Sub-Collector',
              timeline: '7 நாட்களுக்குள்'
            }
          ],
          follow_up_questions: [
            'ஆக்கிரமிப்பு அகற்ற உள்ளாட்சி நிர்வாகம் நடவடிக்கை எடுக்காவிட்டால் உயர்நீதிமன்றத்தில் ரிட் (Writ) மனு தாக்கல் செய்ய முடியுமா?',
            'RDO ஆக்கிரமிப்பு விசாரணைக்கான ஆவணங்கள் என்னென்ன தேவை?'
          ]
        }
      ],
      domain: 'property'
    },
    {
      id: 'conv-sample-4',
      title: 'punishment for murder',
      timestamp: Date.now() - 14400000,
      messages: [
        {
          id: 'msg-u4',
          role: 'user',
          content: 'What is the punishment for murder under Bharatiya Nyaya Sanhita (BNS)?',
          timestamp: Date.now() - 14400000,
          language: 'en'
        },
        {
          id: 'msg-a4',
          role: 'assistant',
          content: 'Under the **Bharatiya Nyaya Sanhita, 2023 (BNS)**, which replaced the Indian Penal Code (IPC) with effect from July 1, 2024:\n\n1. **Section 103(1) (Punishment for Murder):** Whoever commits murder shall be punished with **death** or **imprisonment for life**, and shall also be liable to fine.\n2. **Section 103(2) (Organized / Mob Murder):** When a group of five or more persons acting in concert commits murder on grounds of race, caste, community, sex, place of birth, or language, each person shall be punished with death or life imprisonment, and fine.\n3. **Bail & Trial:** Murder is a cognizable, non-bailable offense triable exclusively by the Court of Session.',
          timestamp: Date.now() - 14390000,
          category: 'Criminal',
          domain: 'criminal',
          language: 'en',
          jurisdiction: 'IN',
          risk_level: 'high',
          sources: [
            {
              title: 'Bharatiya Nyaya Sanhita, 2023',
              section: 'Section 103 (Punishment for Murder)',
              act: 'BNS 2023',
              source: 'Ministry of Home Affairs / India Code',
              url: 'https://indiacode.nic.in'
            }
          ],
          action_plan: [
            {
              order: 1,
              title: 'Immediate FIR Registration',
              description: 'Section 173 BNSS mandates prompt FIR registration by Station House Officer upon receipt of cognizable information.',
              authority: 'Jurisdictional Police Station',
              timeline: 'Immediate'
            }
          ],
          follow_up_questions: [
            'What is the difference between Section 103 (Murder) and Section 105 (Culpable Homicide not amounting to murder) under BNS?',
            'What are the statutory statutory timelines for filing chargesheet under Section 193 BNSS?'
          ]
        }
      ],
      domain: 'criminal'
    },
    {
      id: 'conv-sample-5',
      title: 'how to file a restraining or...',
      timestamp: Date.now() - 28800000,
      messages: [
        {
          id: 'msg-u5',
          role: 'user',
          content: 'How to file a restraining order or injunction against illegal trespassing?',
          timestamp: Date.now() - 28800000,
          language: 'en'
        },
        {
          id: 'msg-a5',
          role: 'assistant',
          content: 'Under Indian civil law, protection against illegal trespassing is sought through a civil suit for **Permanent & Temporary Injunction**:\n\n1. **Substantive Relief (Specific Relief Act, 1963 - Section 38):** A perpetual injunction may be granted to prevent the breach of an obligation existing in favor of the plaintiff where the defendant invades or threatens to invade title or peaceful possession.\n2. **Interim Relief (Code of Civil Procedure, 1908 - Order 39, Rules 1 & 2):** To secure immediate protection while the suit is pending, file an interlocutory application for temporary injunction establishing three essentials: *Prima Facie Case*, *Balance of Convenience*, and *Irreparable Injury*.\n3. **Evidentiary Threshold:** Produce registered title deeds, patta, property tax receipts, and police complaint acknowledgments demonstrating lawful continuous possession.',
          timestamp: Date.now() - 28790000,
          category: 'Civil',
          domain: 'property',
          language: 'en',
          jurisdiction: 'TN',
          risk_level: 'medium',
          sources: [
            {
              title: 'Specific Relief Act, 1963',
              section: 'Section 38 (Perpetual Injunction)',
              act: 'Act 47 of 1963',
              source: 'Legislative Department, India Code',
              url: 'https://indiacode.nic.in'
            },
            {
              title: 'Code of Civil Procedure, 1908',
              section: 'Order 39 Rules 1 & 2 (Temporary Injunctions)',
              act: 'Act 5 of 1908',
              source: 'Supreme Court & High Court Rules'
            }
          ],
          action_plan: [
            {
              order: 1,
              title: 'Compile Possession Documents',
              description: 'Gather registered sale deed, patta, parent documents, and encumbrance certificate (EC).',
              authority: 'Self / Advocate',
              timeline: 'Immediate'
            },
            {
              order: 2,
              title: 'File Plaint & Order 39 Application',
              description: 'Submit formal suit before jurisdictional District Munsif / Subordinate Judge with ad-interim ex-parte injunction petition.',
              authority: 'Jurisdictional Civil Court',
              timeline: 'Within 7 days'
            }
          ],
          follow_up_questions: [
            'What constitutes "irreparable injury" in an injunction petition?',
            'Can police protect possession based on an interim injunction order?'
          ]
        }
      ],
      domain: 'property'
    }
  ];

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('lexora_conversations_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialDefaultConversations;
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(
    () => conversations[0]?.id || 'conv-new-1'
  );

  const activeConversation = conversations.find(c => c.id === activeConversationId) || conversations[0];
  const messages = activeConversation?.messages || [];

  const [isLoading, setIsLoading] = useState(false);

  // Sync conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lexora_conversations_v3', JSON.stringify(conversations));
    } catch (e) {}
  }, [conversations]);

  // Global keyboard shortcut ⌘K or Ctrl+K to focus query input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchBoxRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handler for New Query button
  const handleNewQuery = () => {
    // If the currently active conversation is already empty, stay on it and focus search
    if (activeConversation && activeConversation.messages.length === 0) {
      searchBoxRef.current?.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Check if there is already an empty conversation
    const existingEmpty = conversations.find(c => c.messages.length === 0);
    if (existingEmpty) {
      setActiveConversationId(existingEmpty.id);
      setInput('');
      setTimeout(() => {
        searchBoxRef.current?.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
      return;
    }

    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Legal Consultation',
      timestamp: Date.now(),
      created_at: Date.now(),
      updated_at: Date.now(),
      language,
      jurisdiction,
      messages: [],
      domain: 'general'
    };

    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setInput('');
    setTimeout(() => {
      searchBoxRef.current?.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  // Helper to update active conversation messages
  const updateActiveMessages = (updater: (prev: Message[]) => Message[]) => {
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === activeConversationId) {
          const newMessages = updater(conv.messages);
          let title = conv.title;
          const firstUser = newMessages.find(m => m.role === 'user');
          if (firstUser && (title === 'New Legal Consultation' || !title)) {
            title = firstUser.content.slice(0, 26) + (firstUser.content.length > 26 ? '...' : '');
          }
          return { 
            ...conv, 
            messages: newMessages, 
            title, 
            updated_at: Date.now(),
            language: language || conv.language,
            jurisdiction: jurisdiction || conv.jurisdiction
          };
        }
        return conv;
      })
    );
  };

  // Delete conversation
  const handleDeleteConversation = (id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (filtered.length === 0) {
        return [
          {
            id: `conv-${Date.now()}`,
            title: 'New Legal Consultation',
            timestamp: Date.now(),
            created_at: Date.now(),
            updated_at: Date.now(),
            messages: [],
            domain: 'general'
          }
        ];
      }
      return filtered;
    });

    if (activeConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      if (remaining.length > 0) {
        setActiveConversationId(remaining[0].id);
      }
    }
  };

  // Send query handler
  const handleSend = async (overrideText?: string) => {
    const queryText = overrideText !== undefined ? overrideText : input;
    if (!queryText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText,
      timestamp: Date.now(),
      language
    };

    updateActiveMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Auto classify domain
      let targetDomain: LegalDomain = domain;
      if (domain === 'general') {
        const classified = await classifyQueryApi(queryText);
        if (classified?.domain && classified.domain !== 'general') {
          targetDomain = classified.domain;
        }
      }

      // 2. Format conversation history (up to recent 10 turns for memory)
      const historyPayload = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

      // 3. Query legal engine
      const res = await sendLegalQuery({
        conversation_id: activeConversationId,
        query: queryText,
        language,
        domain: targetDomain,
        jurisdiction,
        explanation_level: explanationLevel,
        history: historyPayload
      });

      const safeDomain = res.domain || targetDomain || 'general';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.answer,
        timestamp: Date.now(),
        category: (safeDomain.charAt(0).toUpperCase() + safeDomain.slice(1)) as Category,
        domain: safeDomain as LegalDomain,
        language: res.language || language,
        jurisdiction: res.jurisdiction || jurisdiction,
        explanationLevel,
        sources: res.sources || [],
        risk_level: res.risk_level || 'low',
        risk_reason: res.risk_reason || '',
        action_plan: res.action_plan || [],
        follow_up_questions: res.follow_up_questions || [],
        explainability: res.explainability
      };

      updateActiveMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Legal Query submission failed:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `**Notice:** An issue occurred while contacting the legal intelligence repository: ${err.message || 'Network connectivity error'}. Please retry your query.`,
        timestamp: Date.now(),
        domain: 'general',
        jurisdiction,
        risk_level: 'low'
      };
      updateActiveMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };

  // Translation Toggle
  const handleToggleTranslation = async (msgId: string) => {
    const targetMsg = messages.find(m => m.id === msgId);
    if (!targetMsg) return;

    if (targetMsg.translation?.isShowingTranslation) {
      updateActiveMessages(prev => prev.map(m => m.id === msgId ? {
        ...m,
        translation: { ...m.translation!, isShowingTranslation: false }
      } : m));
      return;
    }

    if (targetMsg.translation?.translatedContent && targetMsg.translation?.targetLanguage === language) {
      updateActiveMessages(prev => prev.map(m => m.id === msgId ? {
        ...m,
        translation: { ...m.translation!, isShowingTranslation: true }
      } : m));
      return;
    }

    const targetLang: LanguageMode = language;

    updateActiveMessages(prev => prev.map(m => m.id === msgId ? {
      ...m,
      translation: {
        isTranslating: true,
        targetLanguage: targetLang,
        translatedContent: '',
        isShowingTranslation: false
      }
    } : m));

    try {
      const translatedText = await translateTextApi(targetMsg.content, targetLang);
      updateActiveMessages(prev => prev.map(m => m.id === msgId ? {
        ...m,
        translation: {
          isTranslating: false,
          targetLanguage: targetLang,
          translatedContent: translatedText,
          isShowingTranslation: true
        }
      } : m));
    } catch (e) {
      updateActiveMessages(prev => prev.map(m => m.id === msgId ? {
        ...m,
        translation: {
          isTranslating: false,
          targetLanguage: targetLang,
          translatedContent: targetMsg.content,
          isShowingTranslation: false
        }
      } : m));
    }
  };

  // Speech Toggle
  const handleToggleSpeech = (msg: Message) => {
    if (speakingMessageId === msg.id) {
      stopSpeech();
      setSpeakingMessageId(null);
    } else {
      stopSpeech();
      setSpeakingMessageId(msg.id);
      speakLegalText(msg.content, msg.language || language, () => {
        setSpeakingMessageId(null);
      });
    }
  };

  // Copy Message
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Document Analysis completed handoff
  const handleDocumentAnalysisCompleted = (result: {
    fileName: string;
    fileSize: string;
    analysis: string;
    scanMode?: DocumentScanMode;
    documentScriptType?: string;
    extractedText?: string;
  }) => {
    setIsDocModalOpen(false);
    setIsHardwareModalOpen(false);

    const scriptLabel = result.documentScriptType || 
      (result.scanMode === 'handwritten' ? 'Handwritten Script (கையெழுத்து)' : 
       result.scanMode === 'typed' ? 'Typed / Printed Text (அச்சிடப்பட்டவை)' : 
       'Auto-Detected Hybrid');

    const userDocMsg: Message = {
      id: `msg-user-doc-${Date.now()}`,
      role: 'user',
      content: language === 'ta' 
        ? `📄 ஆவண ஸ்கேன்: **${result.fileName}** (${scriptLabel})`
        : `📄 Scanned Legal Document: **${result.fileName}** (${scriptLabel})`,
      timestamp: Date.now(),
      language,
      jurisdiction,
      documentMeta: {
        fileName: result.fileName,
        fileSize: result.fileSize,
        fileType: 'application/pdf',
        scanMode: result.scanMode || 'auto',
        documentScriptType: scriptLabel,
        extractedText: result.extractedText,
        ocrSource: 'upload_file'
      }
    };

    const assistantDocMsg: Message = {
      id: `msg-asst-doc-${Date.now() + 1}`,
      role: 'assistant',
      content: result.analysis,
      timestamp: Date.now() + 1,
      language,
      jurisdiction,
      category: 'Property',
      domain: 'property',
      risk_level: 'medium',
      risk_reason: 'Legal document scrutiny completed. Review highlighted liabilities and action points.',
      documentMeta: {
        fileName: result.fileName,
        fileSize: result.fileSize,
        fileType: 'application/pdf',
        scanMode: result.scanMode || 'auto',
        documentScriptType: scriptLabel,
        extractedText: result.extractedText,
        ocrSource: 'upload_file'
      }
    };

    updateActiveMessages(prev => [...prev, userDocMsg, assistantDocMsg]);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  // Draft Notice context handoff
  const handleOpenDraftWithContext = (context: string) => {
    setDraftInitialContext(context);
    setIsDraftModalOpen(true);
  };

  const isViewingConversation = messages.length > 0;

  return (
    <div className="flex h-screen bg-[#FAF9F6] text-[#17244F] dark:bg-[#0E131F] dark:text-[#EAECEF] overflow-hidden antialiased">
      {/* 1. SIDEBAR */}
      <LexoraSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onNewQuery={handleNewQuery}
        onFocusSearch={() => {
          searchBoxRef.current?.focus();
        }}
        onOpenLibrary={() => setIsLibraryModalOpen(true)}
        onOpenDraft={() => {
          setDraftInitialContext('');
          setIsDraftModalOpen(true);
        }}
        onOpenScrutiny={() => setIsDocModalOpen(true)}
        onOpenCaseExplorer={() => setIsCaseExplorerOpen(true)}
        onOpenSchemes={() => setIsSchemesModalOpen(true)}
        onOpenKiosk={() => setIsHardwareModalOpen(true)}
        onOpenSaved={() => setIsLibraryModalOpen(true)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* 2. MAIN WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <LexoraHeader
          jurisdiction={jurisdiction}
          onSelectJurisdiction={setJurisdiction}
          explanationLevel={explanationLevel}
          onSelectExplanationLevel={setExplanationLevel}
          onOpenSchemes={() => setIsSchemesModalOpen(true)}
          onOpenKiosk={() => setIsHardwareModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:py-6">
          {!isViewingConversation ? (
            /* NEW LEGAL CONSULTATION HERO WITH SUGGESTIONS */
            <div className="min-h-full flex flex-col justify-center">
              <HeroWorkspace
                onSelectPrompt={(query) => handleSend(query)}
                jurisdiction={jurisdiction}
              />
            </div>
          ) : (
            /* CONVERSATION THREAD VIEW */
            <div className="w-full max-w-3xl mx-auto space-y-6 pb-4">
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E1DA] dark:border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#17244F] dark:text-white">
                    Consultation
                  </span>
                  <span className="text-[#73777F]">·</span>
                  <span className="text-xs text-[#73777F] dark:text-slate-400 truncate max-w-md">
                    {activeConversation.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleNewQuery}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#17244F] hover:bg-[#203066] text-white transition-colors cursor-pointer flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Consultation</span>
                </button>
              </div>

              {/* Message List */}
              <div className="space-y-6">
                {messages.map((msg) => {
                  if (msg.role === 'user') {
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl bg-[#17244F] text-white text-sm leading-relaxed shadow-xs">
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="flex justify-start">
                      <div className="w-full">
                        <StructuredAnswer
                          message={msg}
                          isSpeaking={speakingMessageId === msg.id}
                          copiedId={copiedId}
                          onToggleSpeech={handleToggleSpeech}
                          onToggleTranslation={handleToggleTranslation}
                          onCopyMessage={handleCopyMessage}
                          onOpenDraftWithContext={handleOpenDraftWithContext}
                          onOpenExplainability={() => {
                            if (msg.explainability) {
                              setExplainabilityData(msg.explainability);
                              setIsExplainModalOpen(true);
                            }
                          }}
                          onSelectFollowUp={(q) => handleSend(q)}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#101522] border border-[#E4E1DA] dark:border-slate-800 flex items-center gap-2.5 text-xs text-[#42506F] dark:text-slate-300">
                    <Loader2 className="w-4 h-4 animate-spin text-[#17244F] dark:text-white" />
                    <span>Analyzing statutory provisions and formulating legal assessment...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM FIXED QUERY COMPOSER (ChatGPT Style) */}
        <div className="w-full bg-gradient-to-t from-[#FAF9F6] via-[#FAF9F6] to-transparent dark:from-[#0E131F] dark:via-[#0E131F] pt-2 pb-4 px-4 flex-shrink-0">
          <div className="w-full max-w-3xl mx-auto space-y-1.5">
            <QueryComposer
              input={input}
              setInput={setInput}
              onSend={handleSend}
              isLoading={isLoading}
              onOpenDocModal={() => setIsDocModalOpen(true)}
              jurisdiction={jurisdiction}
              onToggleJurisdiction={() => setJurisdiction(jurisdiction === 'TN' ? 'IN' : 'TN')}
              searchBoxRef={searchBoxRef}
              placeholder="Ask any legal question in Tamil, English, or Tanglish..."
              autoFocus={true}
            />
            <p className="text-[11px] text-center text-[#8B93A7] dark:text-slate-500">
              Lexora provides informational legal & cooperative literacy. Always verify with official gazettes and practicing advocates.
            </p>
          </div>
        </div>
      </div>

      {/* 3. MODALS FOR COMPLETE LEGAL CAPABILITIES */}
      <DocumentUploadModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onDocumentAnalyzed={handleDocumentAnalysisCompleted}
      />

      <DraftGeneratorModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        initialTopic={draftInitialContext}
      />

      <LegalLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        onInsertTopicToChat={(topic) => {
          setIsLibraryModalOpen(false);
          handleSend(topic);
        }}
      />

      <CaseExplorerModal
        isOpen={isCaseExplorerOpen}
        onClose={() => setIsCaseExplorerOpen(false)}
        onInsertToChat={(query) => {
          setIsCaseExplorerOpen(false);
          handleSend(query);
        }}
      />

      <GovernmentSchemesModal
        isOpen={isSchemesModalOpen}
        onClose={() => setIsSchemesModalOpen(false)}
        onAskAboutScheme={(query) => {
          setIsSchemesModalOpen(false);
          handleSend(query);
        }}
      />

      <SmartHardwareAssistModal
        isOpen={isHardwareModalOpen}
        onClose={() => setIsHardwareModalOpen(false)}
        onDocumentAnalyzed={handleDocumentAnalysisCompleted}
      />

      <ExplainabilityModal
        isOpen={isExplainModalOpen}
        onClose={() => setIsExplainModalOpen(false)}
        data={explainabilityData}
      />
    </div>
  );
}
