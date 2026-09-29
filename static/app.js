// Lexora Modern Legal Desk - Unified Master Frontend
let currentSessionId = localStorage.getItem('lexora_session_id') || '';
let isVoiceRecording = false;
let recognition = null;
let currentSources = [];
let isTnJurisdiction = true;
let allSessions = [];
let currentAudioPlayer = null;
let activeTool = null;
let cameraStream = null;
let voiceOverlayActive = false;

const UI_TRANSLATIONS = {
    en: {
        brand_title: "LEXORA",
        brand_subtitle: "TAMIL-FIRST LEGAL",
        btn_new_query: "+ New Query",
        search_conversations_ph: "Search",
        sec_conversations: "CONVERSATIONS",
        sec_tools: "TOOLS",
        tool_library: "Legal Library",
        tool_saved: "Saved",
        tool_draft: "Draft Generator",
        tool_doc: "Document Analysis",
        tool_explorer: "Case Explorer",
        tool_schemes: "Government Schemes",
        tool_voice: "Smart Doc & Voice Assist",
        tool_diagnostics: "RAG Diagnostics",
        jur_tn: "Tamil Nadu",
        jur_in: "All India",
        nav_schemes: "Schemes",
        nav_kiosk: "Kiosk",
        nav_voice: "Voice Consultation",
        user_citizen: "Citizen",
        landing_heading: "Legal answers, grounded in the law.",
        landing_subheading: "Ask in Tamil, English or Tanglish. Lexora finds, verifies and explains relevant legal sources.",
        rec_header_title: "RECOMMENDED PROMPT",
        btn_try_another: "Try Another",
        input_placeholder: "Ask any legal question in Tamil, English, or Tanglish...",
        btn_attach: "Attach",
        btn_voice_mode: "Voice Mode",
        btn_tn_mode: "Tamil Nadu Mode",
        disclaimer: "Lexora provides informational legal & cooperative literacy. Always verify with official gazettes and practicing advocates.",
        lib_title: "Legal Library",
        lib_sub: "Unified research interface to the authoritative Indian Legal Corpus: BNS, BNSS, BSA, Constitution, and Tamil Nadu Law.",
        lib_back: "← Back to Chat",
        lib_ph: "Search provisions (e.g., Article 21, BNS 303, theft, FIR, electronic evidence)...",
        lib_btn_search: "Search Library",
        schemes_title: "Government Schemes",
        schemes_sub: "Verified Central and State Government (Tamil Nadu) citizen welfare schemes, eligibility rules, and official application portals.",
        schemes_ph: "Search schemes (e.g. farmer, student, women, subsidy, pension, crop loan)...",
        schemes_btn_search: "Find Schemes",
        cases_title: "Case Explorer",
        cases_sub: "Search and inspect verified landmark judgments, constitutional precedents, and high court rulings.",
        cases_ph: "Search landmark cases (e.g. Maneka Gandhi, Puttaswamy, Article 21, electronic evidence, FIR)...",
        cases_btn_search: "Search Judgments",
        saved_title: "Saved Consultations & Provisions",
        saved_sub: "Access your saved legal provisions, chatbot answers, government schemes, landmark cases, and drafts.",
        saved_ph: "Search saved items..."
    },
    ta: {
        brand_title: "லெக்சோரா",
        brand_subtitle: "தமிழ் முதன்மை சட்டம்",
        btn_new_query: "+ புதிய வினவல்",
        search_conversations_ph: "தேடு",
        sec_conversations: "உரையாடல்கள்",
        sec_tools: "கருவிகள்",
        tool_library: "சட்ட நூலகம்",
        tool_saved: "சேமிக்கப்பட்டவை",
        tool_draft: "வரைவு உருவாக்குபவர்",
        tool_doc: "ஆவண பகுப்பாய்வு",
        tool_explorer: "வழக்கு ஆய்வாளர்",
        tool_schemes: "அரசு திட்டங்கள்",
        tool_voice: "ஸ்மார்ட் ஆவணம் & குரல் உதவி",
        tool_diagnostics: "RAG கண்டறிதல்",
        jur_tn: "தமிழ்நாடு",
        jur_in: "அனைத்து இந்தியா",
        nav_schemes: "திட்டங்கள்",
        nav_kiosk: "கியோஸ்க்",
        nav_voice: "குரல் கலந்தாய்வு",
        user_citizen: "குடிமகன்",
        landing_heading: "சட்டத்தின் அடிப்படையில் தெளிவான விடைகள்.",
        landing_subheading: "தமிழ், ஆங்கிலம் அல்லது தங்க்லீஷில் கேளுங்கள். லெக்சோரா உரிய சட்ட ஆதாரங்களை கண்டறிந்து விளக்குகிறது.",
        rec_header_title: "பரிந்துரைக்கப்பட்ட கேள்வி",
        btn_try_another: "வேறொன்று",
        input_placeholder: "தமிழ், ஆங்கிலம் அல்லது தங்க்லீஷில் உங்கள் சட்ட கேள்வியை கேளுங்கள்...",
        btn_attach: "இணைக்கவும்",
        btn_voice_mode: "குரல் முறை",
        btn_tn_mode: "தமிழ்நாடு முறை",
        disclaimer: "லெக்சோரா தகவல் மற்றும் சட்ட விழிப்புணர்வை வழங்குகிறது. அதிகாரப்பூர்வ அரசிதழ்கள் மற்றும் வழக்கறிஞர்களிடம் சரிபார்க்கவும்.",
        lib_title: "சட்ட நூலகம்",
        lib_sub: "இந்திய சட்ட தொகுப்பு: BNS, BNSS, BSA, அரசமைப்பு மற்றும் தமிழ்நாடு சட்டங்களை ஆராயுங்கள்.",
        lib_back: "← உரையாடலுக்கு திரும்பு",
        lib_ph: "சட்டப் பிரிவுகளைத் தேடுங்கள் (எ.கா. பிரிவு 21, BNS 303, திருட்டு, எஃப்.ஐ.ஆர்)...",
        lib_btn_search: "நூலகத்தில் தேடு",
        schemes_title: "அரசு திட்டங்கள்",
        schemes_sub: "மத்திய மற்றும் தமிழ்நாடு அரசு நலத்திட்டங்கள், தகுதி விதிகள் மற்றும் அதிகாரப்பூர்வ விண்ணப்ப போர்ட்டல்கள்.",
        schemes_ph: "திட்டங்களைத் தேடுங்கள் (எ.கா. விவசாயி, மாணவர், பெண்கள், மானியம், ஓய்வூதியம்)...",
        schemes_btn_search: "திட்டங்களைக் கண்டுபிடி",
        cases_title: "வழக்கு ஆய்வாளர்",
        cases_sub: "முக்கிய உச்ச நீதிமன்ற மற்றும் உயர் நீதிமன்ற தீர்ப்புகளைத் தேடி ஆராயுங்கள்.",
        cases_ph: "முக்கிய வழக்குகளைத் தேடுங்கள் (எ.கா. மேனகா காந்தி, புட்டசுவாமி, பிரிவு 21)...",
        cases_btn_search: "தீர்ப்புகளைத் தேடு",
        saved_title: "சேமிக்கப்பட்டவை",
        saved_sub: "உங்கள் சேமிக்கப்பட்ட சட்ட விதிகள், பதில்கள், திட்டங்கள் மற்றும் வரைவுகளை அணுகுங்கள்.",
        saved_ph: "சேமித்தவற்றைத் தேடு..."
    },
    tanglish: {
        brand_title: "LEXORA",
        brand_subtitle: "TAMIL-FIRST LEGAL",
        btn_new_query: "+ New Query",
        search_conversations_ph: "Search pannunga",
        sec_conversations: "CONVERSATIONS",
        sec_tools: "TOOLS",
        tool_library: "Legal Library",
        tool_saved: "Saved Items",
        tool_draft: "Draft Generator",
        tool_doc: "Document Analysis",
        tool_explorer: "Case Explorer",
        tool_schemes: "Govt Schemes",
        tool_voice: "Smart Doc & Voice Assist",
        tool_diagnostics: "RAG Diagnostics",
        jur_tn: "Tamil Nadu",
        jur_in: "All India",
        nav_schemes: "Schemes",
        nav_kiosk: "Kiosk",
        nav_voice: "Voice Consultation",
        user_citizen: "Citizen",
        landing_heading: "Legal answers, grounded in the law.",
        landing_subheading: "Tamil, English or Tanglish la kelunga. Lexora verified legal sources ah kandupidichu sollum.",
        rec_header_title: "RECOMMENDED PROMPT",
        btn_try_another: "Try Another",
        input_placeholder: "Tamil, English, or Tanglish la kelunga...",
        btn_attach: "Attach",
        btn_voice_mode: "Voice Mode",
        btn_tn_mode: "Tamil Nadu Mode",
        disclaimer: "Lexora informational legal assistance tharugiradhu. Official advocate moolam verify pannavum.",
        lib_title: "Legal Library",
        lib_sub: "Indian legal laws search pannunga: BNS, BNSS, BSA, Constitution, Tamil Nadu laws.",
        lib_back: "← Back to Chat",
        lib_ph: "Search sections (e.g. Article 21, BNS 303, theft, FIR)...",
        lib_btn_search: "Search Library",
        schemes_title: "Government Schemes",
        schemes_sub: "Verified Govt schemes, eligibility criteria matrum apply portal details.",
        schemes_ph: "Search schemes (e.g. farmer, student, women, subsidy, pension)...",
        schemes_btn_search: "Find Schemes",
        cases_title: "Case Explorer",
        cases_sub: "Search landmark court judgments and rulings.",
        cases_ph: "Search landmark cases (e.g. Puttaswamy, Article 21, FIR)...",
        cases_btn_search: "Search Judgments",
        saved_title: "Saved Items",
        saved_sub: "Ungaludaiya saved legal items matrum answers inka irukkum.",
        saved_ph: "Search saved items..."
    },
    hi: {
        brand_title: "लेक्सोरा",
        brand_subtitle: "तमिल-प्रथम कानूनी",
        btn_new_query: "+ नया प्रश्न",
        search_conversations_ph: "खोजें",
        sec_conversations: "बातचीत",
        sec_tools: "उपकरण",
        tool_library: "कानूनी पुस्तकालय",
        tool_saved: "सहेजे गए",
        tool_draft: "ड्राफ्ट जनरेटर",
        tool_doc: "दस्तावेज़ विश्लेषण",
        tool_explorer: "केस एक्सप्लोरर",
        tool_schemes: "सरकारी योजनाएं",
        tool_voice: "स्मार्ट दस्तावेज़ और वॉयस",
        tool_diagnostics: "RAG निदान",
        jur_tn: "तमिलनाडु",
        jur_in: "संपूर्ण भारत",
        nav_schemes: "योजनाएं",
        nav_kiosk: "कियोस्क",
        nav_voice: "वॉयस परामर्श",
        user_citizen: "नागरिक",
        landing_heading: "कानूनी उत्तर, कानून पर आधारित।",
        landing_subheading: "तमिल, अंग्रेजी या तंगलिश में पूछें। लेक्सोरा संबंधित कानूनी स्रोतों की पुष्टि और व्याख्या करता है।",
        rec_header_title: "अनुशंसित प्रश्न",
        btn_try_another: "दूसरा प्रयास करें",
        input_placeholder: "तमिल, अंग्रेजी या तंगलिश में कोई भी कानूनी प्रश्न पूछें...",
        btn_attach: "संलग्न करें",
        btn_voice_mode: "वॉयस मोड",
        btn_tn_mode: "तमिलनाडु मोड",
        disclaimer: "लेक्सोरा सूचनात्मक कानूनी साक्षरता प्रदान करता है। आधिकारिक राजपत्रों और वकीलों से हमेशा पुष्टि करें।",
        lib_title: "कानूनी पुस्तकालय",
        lib_sub: "भारतीय कानूनी संहिताओं का एकीकृत खोज इंटरफ़ेस: BNS, BNSS, BSA, संविधान और तमिलनाडु कानून।",
        lib_back: "← चैट पर वापस जाएं",
        lib_ph: "कानूनी धाराओं की खोज करें (जैसे, अनुच्छेद 21, BNS 303, चोरी, एफआईआर)...",
        lib_btn_search: "पुस्तकालय में खोजें",
        schemes_title: "सरकारी योजनाएं",
        schemes_sub: "सत्यापित केंद्रीय और राज्य सरकार (तमिलनाडु) नागरिक कल्याण योजनाएं और पात्रता नियम।",
        schemes_ph: "योजनाएं खोजें (जैसे किसान, छात्र, महिला, सब्सिडी, पेंशन)...",
        schemes_btn_search: "योजनाएं खोजें",
        cases_title: "केस एक्सप्लोरर",
        cases_sub: "सत्यापित ऐतिहासिक निर्णयों और उच्च न्यायालय के फैसलों की खोज करें।",
        cases_ph: "ऐतिहासिक मामले खोजें (जैसे मेनका गांधी, पुट्टास्वामी, अनुच्छेद 21)...",
        cases_btn_search: "फैसले खोजें",
        saved_title: "सहेजी गई सामग्री",
        saved_sub: "अपनी सहेजी गई कानूनी धाराओं, चैटबॉट उत्तरों और ड्राफ्ट तक पहुंचें।",
        saved_ph: "सहेजी गई सामग्री खोजें..."
    }
};

let currentLanguage = localStorage.getItem('lexora_language') || 'en';

function setAppLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('lexora_language', lang);

    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.dataset.lang === lang) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    const dict = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS['en'];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) {
            el.placeholder = dict[key];
        }
    });

    if (recognition) {
        if (lang === 'ta') recognition.lang = 'ta-IN';
        else if (lang === 'hi') recognition.lang = 'hi-IN';
        else recognition.lang = 'en-IN';
    }

    if (activeTool === 'library') openLegalLibrary();
    else if (activeTool === 'schemes') openGovernmentSchemes();
    else if (activeTool === 'explorer') openCaseExplorer();
    else if (activeTool === 'saved') openSavedItems();
}

// Dynamic legal prompt suggestions for recommendation card
const LEGAL_RECOMMENDED_PROMPTS = [
    {
        title: "Find Section 420 IPC / BNS equivalent",
        sub: '"What is the punishment for physical assault under Indian criminal law?"',
        query: "What is the punishment for physical assault under Indian criminal law and its BNS equivalent?"
    },
    {
        title: "Constitutional Rights & Protection",
        sub: '"What fundamental rights are protected under Article 21 of the Indian Constitution?"',
        query: "What fundamental rights are protected under Article 21 of the Indian Constitution?"
    },
    {
        title: "Tamil Nadu Specific Regulation",
        sub: '"What are tenant rights under Tamil Nadu Landlords and Tenants Act?"',
        query: "What are tenant rights under Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act?"
    },
    {
        title: "Criminal Procedure under BNSS 2023",
        sub: '"How do I file a criminal complaint or FIR under BNSS?"',
        query: "How do I file a criminal complaint or FIR under BNSS 2023?"
    },
    {
        title: "Tanglish Legal Query",
        sub: '"thiruttu ku enna punishment BNS la?"',
        query: "thiruttu ku enna punishment BNS la?"
    }
];

let currentPromptIdx = 0;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupEventListeners();
    initSpeechRecognition();
    renderRecommendedPrompt();
    setAppLanguage(currentLanguage);
    await loadSessions();
    if (!currentSessionId) {
        await createNewSession();
    } else {
        await loadSessionDetails(currentSessionId);
    }
}

function setupEventListeners() {
    // New consultation / New Query button
    document.getElementById('btn-new-query').addEventListener('click', async () => {
        showChatWorkspace();
        await createNewSession();
    });

    // Chat form submit
    document.getElementById('chat-form').addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage();
    });

    // Textarea enter & auto-grow
    const textarea = document.getElementById('user-input');
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 180) + 'px';
    });

    // Recommendation card prompt rotation
    document.getElementById('btn-try-another').addEventListener('click', (e) => {
        e.stopPropagation();
        rotateRecommendedPrompt();
    });

    document.getElementById('recommendation-card').addEventListener('click', () => {
        const item = LEGAL_RECOMMENDED_PROMPTS[currentPromptIdx];
        document.getElementById('user-input').value = item.query;
        sendMessage();
    });

    document.getElementById('btn-run-rec').addEventListener('click', (e) => {
        e.stopPropagation();
        const item = LEGAL_RECOMMENDED_PROMPTS[currentPromptIdx];
        document.getElementById('user-input').value = item.query;
        sendMessage();
    });

    // Sidebar collapse & mobile menu
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const sidebar = document.getElementById('sidebar');

    if (btnToggleSidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    if (btnMobileMenu) {
        btnMobileMenu.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Keyboard shortcut ⌘K / Ctrl+K for search input
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('search-conversations').focus();
        }
    });

    // Conversation search filter
    document.getElementById('search-conversations').addEventListener('input', (e) => {
        filterSessions(e.target.value);
    });

    // Jurisdiction Segment buttons
    const btnTn = document.getElementById('btn-tn-jurisdiction');
    const btnIn = document.getElementById('btn-in-jurisdiction');
    if (btnTn && btnIn) {
        btnTn.addEventListener('click', () => {
            btnTn.classList.add('active');
            btnIn.classList.remove('active');
            isTnJurisdiction = true;
            const composerTn = document.getElementById('btn-composer-tn-mode');
            if (composerTn) composerTn.classList.add('active');
        });
        btnIn.addEventListener('click', () => {
            btnIn.classList.add('active');
            btnIn.classList.remove('active');
            isTnJurisdiction = false;
            const composerTn = document.getElementById('btn-composer-tn-mode');
            if (composerTn) composerTn.classList.remove('active');
        });
    }

    // Composer Tamil Nadu Mode toggle button
    const btnComposerTn = document.getElementById('btn-composer-tn-mode');
    if (btnComposerTn) {
        btnComposerTn.addEventListener('click', () => {
            isTnJurisdiction = !isTnJurisdiction;
            if (isTnJurisdiction) {
                btnComposerTn.classList.add('active');
                if (btnTn) btnTn.classList.add('active');
                if (btnIn) btnIn.classList.remove('active');
            } else {
                btnComposerTn.classList.remove('active');
                if (btnTn) btnTn.classList.remove('active');
                if (btnIn) btnIn.classList.add('active');
            }
        });
    }

    // Language selector buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang || 'en';
            setAppLanguage(lang);
        });
    });

    // Theme toggle (Dark / Light)
    const themeBtn = document.querySelector('.nav-icon-btn[title*="Theme"]');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('lexora_theme', newTheme);
        });
        const savedTheme = localStorage.getItem('lexora_theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    }

    // Wire up Sidebar Tool items
    document.querySelectorAll('.tool-item[data-tool="library"]').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); openLegalLibrary(); }));
    document.querySelectorAll('.tool-item[data-tool="saved"]').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); openSavedItems(); }));
    document.querySelectorAll('.tool-item[data-tool="draft"]').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); openDraftGenerator(); }));
    document.querySelectorAll('.tool-item[data-tool="explorer"]').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); openCaseExplorer(); }));
    document.querySelectorAll('.tool-item[data-tool="schemes"]').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); openGovernmentSchemes(); }));
    document.querySelectorAll('.nav-action-btn:nth-child(1)').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); openGovernmentSchemes(); }));
    document.querySelectorAll('.tool-item[data-tool="diagnostics"]').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); openDiagnostics(); }));
    document.querySelectorAll('.tool-item[data-tool="voice"]').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); openSmartDocAndVoice(); }));
    document.querySelectorAll('.tool-item[data-tool="doc"]').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); openSmartDocAndVoice(); }));

    // Voice buttons
    const btnTopVoice = document.getElementById('btn-top-voice');
    const btnComposerVoice = document.getElementById('btn-composer-voice');
    const btnStopVoice = document.getElementById('btn-stop-voice');

    if (btnTopVoice) btnTopVoice.addEventListener('click', openVoiceOverlay);
    if (btnComposerVoice) btnComposerVoice.addEventListener('click', openVoiceOverlay);
    if (btnStopVoice) btnStopVoice.addEventListener('click', stopVoiceMode);

    // Document upload triggers
    const btnComposerAttach = document.getElementById('btn-composer-attach');
    const fileInput = document.getElementById('file-input');

    if (btnComposerAttach) btnComposerAttach.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);

    document.getElementById('btn-remove-doc').addEventListener('click', () => {
        document.getElementById('uploaded-doc-badge').style.display = 'none';
        fileInput.value = '';
    });

    // Modals close
    document.getElementById('btn-close-source-modal').addEventListener('click', () => {
        document.getElementById('source-modal').style.display = 'none';
    });
    document.getElementById('source-modal').addEventListener('click', (e) => {
        if (e.target.id === 'source-modal') {
            document.getElementById('source-modal').style.display = 'none';
        }
    });

    document.getElementById('btn-close-item-modal').addEventListener('click', () => {
        document.getElementById('item-modal').style.display = 'none';
    });
    document.getElementById('item-modal').addEventListener('click', (e) => {
        if (e.target.id === 'item-modal') {
            document.getElementById('item-modal').style.display = 'none';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('source-modal').style.display = 'none';
            document.getElementById('item-modal').style.display = 'none';
            if (voiceOverlayActive) closeVoiceOverlay();
        }
    });

    // Voice Overlay Modal event listeners
    const btnCloseVoiceModal = document.getElementById('btn-close-voice-modal');
    const voiceOverlay = document.getElementById('voice-overlay');
    const voiceModalMicToggle = document.getElementById('voice-modal-mic-toggle');
    const voiceModalAudioStop = document.getElementById('voice-modal-audio-stop');
    const voiceModalViewChat = document.getElementById('voice-modal-view-chat');
    const voiceOrb = document.getElementById('voice-orb');

    if (btnCloseVoiceModal) btnCloseVoiceModal.addEventListener('click', closeVoiceOverlay);

    if (voiceOverlay) {
        voiceOverlay.addEventListener('click', (e) => {
            if (e.target === voiceOverlay) closeVoiceOverlay();
        });
    }

    if (voiceModalMicToggle) voiceModalMicToggle.addEventListener('click', toggleVoiceOverlayMic);
    if (voiceOrb) voiceOrb.addEventListener('click', toggleVoiceOverlayMic);

    if (voiceModalAudioStop) {
        voiceModalAudioStop.addEventListener('click', () => {
            stopVoiceOverlayAudio();
        });
    }

    if (voiceModalViewChat) {
        voiceModalViewChat.addEventListener('click', () => {
            closeVoiceOverlay();
            showChatWorkspace();
        });
    }
}

function showChatWorkspace() {
    document.getElementById('tool-workspace-container').style.display = 'none';
    document.querySelectorAll('.tool-item').forEach(el => el.classList.remove('active'));
    activeTool = null;
    if (document.getElementById('messages-list').children.length > 0) {
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('chat-stream').style.display = 'block';
    } else {
        document.getElementById('empty-state').style.display = 'flex';
        document.getElementById('chat-stream').style.display = 'none';
    }
}

function showToolWorkspace(toolName) {
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('chat-stream').style.display = 'none';
    const container = document.getElementById('tool-workspace-container');
    container.style.display = 'block';
    container.innerHTML = '';
    
    document.querySelectorAll('.tool-item').forEach(el => {
        if (el.dataset.tool === toolName) el.classList.add('active');
        else el.classList.remove('active');
    });
    activeTool = toolName;
}

function renderRecommendedPrompt() {
    const item = LEGAL_RECOMMENDED_PROMPTS[currentPromptIdx];
    document.getElementById('rec-title').textContent = item.title;
    document.getElementById('rec-sub').textContent = item.sub;
}

function rotateRecommendedPrompt() {
    currentPromptIdx = (currentPromptIdx + 1) % LEGAL_RECOMMENDED_PROMPTS.length;
    renderRecommendedPrompt();
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Management
// ─────────────────────────────────────────────────────────────────────────────
async function loadSessions() {
    try {
        const res = await fetch('/api/sessions');
        const data = await res.json();
        allSessions = data.sessions || [];
        renderSessionList(allSessions);
    } catch (e) {
        console.error('Failed to load sessions', e);
    }
}

function renderSessionList(sessions) {
    const listEl = document.getElementById('session-list');
    listEl.innerHTML = '';
    document.getElementById('conversation-count').textContent = sessions.length;

    sessions.forEach(s => {
        const item = document.createElement('div');
        item.className = `session-item ${s.session_id === currentSessionId ? 'active' : ''}`;
        
        const iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
        const delSvg = `<button class="btn-del-session" title="Delete Session" aria-label="Delete Session"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
        item.innerHTML = `
            ${iconSvg}
            <span class="session-title-text" style="flex:1;" title="${escapeHtml(s.title)}">${escapeHtml(s.title)}</span>
            ${delSvg}
        `;
        item.addEventListener('click', (e) => {
            if (e.target.closest('.btn-del-session')) {
                e.stopPropagation();
                deleteSession(s.session_id);
                return;
            }
            switchSession(s.session_id);
        });
        listEl.appendChild(item);
    });
}

async function deleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this consultation session?')) return;
    try {
        await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
        if (currentSessionId === sessionId) {
            currentSessionId = '';
            localStorage.removeItem('lexora_session_id');
            await createNewSession();
        } else {
            await loadSessions();
        }
    } catch (e) {
        console.error('Failed to delete session', e);
    }
}

function filterSessions(query) {
    if (!query) {
        renderSessionList(allSessions);
        return;
    }
    const q = query.toLowerCase();
    const filtered = allSessions.filter(s => s.title.toLowerCase().includes(q));
    renderSessionList(filtered);
}

async function createNewSession() {
    try {
        const res = await fetch('/api/sessions/new', { method: 'POST' });
        const data = await res.json();
        currentSessionId = data.session_id;
        localStorage.setItem('lexora_session_id', currentSessionId);
        
        document.getElementById('messages-list').innerHTML = '';
        showChatWorkspace();
        document.getElementById('uploaded-doc-badge').style.display = 'none';
        
        await loadSessions();
    } catch (e) {
        console.error('Failed to create session', e);
    }
}

async function switchSession(sessionId) {
    currentSessionId = sessionId;
    localStorage.setItem('lexora_session_id', sessionId);
    showChatWorkspace();
    await loadSessions();
    await loadSessionDetails(sessionId);
}

async function loadSessionDetails(sessionId) {
    try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) {
            await createNewSession();
            return;
        }
        const data = await res.json();

        const messagesList = document.getElementById('messages-list');
        messagesList.innerHTML = '';

        if (data.turns && data.turns.length > 0) {
            document.getElementById('empty-state').style.display = 'none';
            document.getElementById('chat-stream').style.display = 'block';
            data.turns.forEach(t => {
                appendMessage(t.role, t.content, t.metadata);
            });
        } else {
            document.getElementById('empty-state').style.display = 'flex';
            document.getElementById('chat-stream').style.display = 'none';
        }

        if (data.documents && data.documents.length > 0) {
            const latestDoc = data.documents[data.documents.length - 1];
            document.getElementById('uploaded-doc-badge').style.display = 'flex';
            document.getElementById('doc-filename').textContent = latestDoc.filename;
        }
    } catch (e) {
        console.error('Failed to load session details', e);
        await createNewSession();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat Execution: Text & Voice
// ─────────────────────────────────────────────────────────────────────────────
let activeStreamController = null;

function setComposerStreamingState(isStreaming) {
    const btnSend = document.getElementById('btn-send');
    if (!btnSend) return;
    
    if (isStreaming) {
        btnSend.classList.add('streaming-stop-btn');
        btnSend.title = "Stop Generation";
        btnSend.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`;
    } else {
        btnSend.classList.remove('streaming-stop-btn');
        btnSend.title = "Send Legal Inquiry";
        btnSend.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`;
    }
}

function stopStreaming() {
    if (activeStreamController) {
        activeStreamController.abort();
    }
}

function createStreamingAssistantCard() {
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('chat-stream').style.display = 'block';

    const messagesList = document.getElementById('messages-list');
    const card = document.createElement('div');
    card.className = 'message-card assistant streaming-card';

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    card.innerHTML = `
        <div class="message-meta">
            <span>Lexora Legal Analysis</span>
            <span>·</span>
            <span class="stream-status-badge">Thinking...</span>
            <span>·</span>
            <span>${timeStr}</span>
        </div>
        <div class="message-body" id="current-stream-body">
            <span class="stream-typing-indicator"><span class="pulse-dot"></span> Lexora is analyzing...</span>
        </div>
        <div class="stream-citations-placeholder" style="display:none;"></div>
    `;
    messagesList.appendChild(card);
    scrollToBottom();
    return card;
}

async function sendMessage(overrideText = null) {
    const inputEl = document.getElementById('user-input');
    const query = (overrideText !== null ? overrideText : inputEl.value).trim();

    if (activeStreamController) {
        stopStreaming();
        return;
    }

    if (!query) return;

    if (overrideText === null) {
        inputEl.value = '';
        inputEl.style.height = 'auto';
    }

    // Force transition immediately
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('chat-stream').style.display = 'block';

    appendMessage('user', query);
    showChatWorkspace();

    const card = createStreamingAssistantCard();
    const statusBadge = card.querySelector('.stream-status-badge');
    const msgBody = card.querySelector('#current-stream-body');
    const citationsHolder = card.querySelector('.stream-citations-placeholder');

    setComposerStreamingState(true);
    activeStreamController = new AbortController();

    let fullText = "";
    let endMetadata = null;
    let receivedFirstText = false;
    let isInterrupted = false;

    try {
        const activeLangBtn = document.querySelector('.lang-btn.active');
        const activeLang = activeLangBtn ? activeLangBtn.dataset.lang : 'en';
        const activeJurisdiction = isTnJurisdiction ? 'Tamil Nadu' : 'Central / India';

        const response = await fetch('/api/chat/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: currentSessionId,
                message: query,
                language: activeLang,
                jurisdiction: activeJurisdiction
            }),
            signal: activeStreamController.signal
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({ detail: 'Server error' }));
            msgBody.innerHTML = `<span class="stream-error-inline">Request error (${response.status}): ${escapeHtml(errData.detail || 'Failed to process inquiry.')}</span>`;
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let sseBuffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            sseBuffer += decoder.decode(value, { stream: true });
            const frames = sseBuffer.split('\n\n');
            sseBuffer = frames.pop() || '';

            for (const frame of frames) {
                if (!frame.trim()) continue;

                let eventType = 'message';
                let dataStr = '';

                for (const line of frame.split('\n')) {
                    if (line.startsWith('event: ')) {
                        eventType = line.slice(7).trim();
                    } else if (line.startsWith('data: ')) {
                        dataStr += line.slice(6);
                    }
                }

                if (!dataStr) continue;
                let data;
                try {
                    data = JSON.parse(dataStr);
                } catch(e) { continue; }

                if (eventType === 'message_start') {
                    if (data.session_id && data.session_id !== currentSessionId) {
                        currentSessionId = data.session_id;
                        localStorage.setItem('lexora_session_id', currentSessionId);
                    }
                    if (statusBadge) statusBadge.textContent = 'Generating...';
                } else if (eventType === 'text_delta') {
                    if (!receivedFirstText) {
                        receivedFirstText = true;
                        if (statusBadge) statusBadge.textContent = 'Generating...';
                    }
                    fullText += data.text;
                    msgBody.innerHTML = formatLegalMarkdown(fullText);
                    scrollToBottom();
                } else if (eventType === 'message_end') {
                    endMetadata = data;
                } else if (eventType === 'error') {
                    isInterrupted = true;
                    if (fullText) {
                        msgBody.innerHTML = formatLegalMarkdown(fullText) + `<div class="stream-error-inline">Response interrupted. Please try again.</div>`;
                    } else {
                        msgBody.innerHTML = `<div class="stream-error-inline">${escapeHtml(data.error || 'Response interrupted.')}</div>`;
                    }
                }
            }
        }
    } catch (e) {
        if (e.name === 'AbortError') {
            isInterrupted = true;
            if (fullText) {
                msgBody.innerHTML = formatLegalMarkdown(fullText) + `<div class="stream-interrupted-inline">Generation stopped by user.</div>`;
            } else {
                msgBody.innerHTML = `<div class="stream-interrupted-inline">Generation stopped by user.</div>`;
            }
        } else {
            isInterrupted = true;
            if (fullText) {
                msgBody.innerHTML = formatLegalMarkdown(fullText) + `<div class="stream-error-inline">Response interrupted. Please try again.</div>`;
            } else {
                msgBody.innerHTML = `<div class="stream-error-inline">Error connecting to Lexora server. Please check your network or server status.</div>`;
            }
        }
    } finally {
        setComposerStreamingState(false);
        activeStreamController = null;

        if (statusBadge) statusBadge.textContent = isInterrupted ? 'Interrupted' : 'Complete';
        card.classList.remove('streaming-card');

        if (fullText) {
            msgBody.innerHTML = formatLegalMarkdown(fullText) + (isInterrupted ? `<div class="stream-interrupted-inline">Generation stopped by user.</div>` : '');

            window.assistantMessages = window.assistantMessages || [];
            const msgIdx = window.assistantMessages.length;
            window.assistantMessages.push(fullText);

            let citationsHtml = `<div class="citations-panel">`;
            const sources = (endMetadata && endMetadata.source_metadata) ? endMetadata.source_metadata : [];

            if (sources.length > 0) {
                citationsHtml += `<span style="font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Citations:</span>`;
                sources.forEach((s, idx) => {
                    citationsHtml += `<div class="citation-chip" onclick="showSourceModal(${idx})">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>
                        <span>${escapeHtml(s.act_name)} · ${escapeHtml(s.article_or_section || s.heading)}</span>
                    </div>`;
                });
                currentSources = sources;
            }

            citationsHtml += `
                <button class="btn-tts" onclick="speakMessageIndex(${msgIdx})">🔊 Listen</button>
                <button class="btn-tts" onclick="translateMessageIndex(${msgIdx}, this)">🌐 Translate</button>
                <button class="btn-tts" onclick="saveAnswerIndex(${msgIdx}, this)">💾 Save</button>
            </div>`;

            citationsHolder.innerHTML = citationsHtml;
            citationsHolder.style.display = 'block';
        }

        await loadSessions();
    }
}

function appendMessage(role, content, metadata = {}) {
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('chat-stream').style.display = 'block';

    const messagesList = document.getElementById('messages-list');
    const card = document.createElement('div');
    card.className = `message-card ${role}`;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let metaHeader = `<div class="message-meta">
        <span>${role === 'user' ? 'Client Inquiry' : 'Lexora Legal Analysis'}</span>
        <span>·</span>
        <span>${timeStr}</span>
    </div>`;

    let formattedText = role === 'assistant' ? formatLegalMarkdown(content) : escapeHtml(content);

    let citationsHtml = '';
    if (role === 'assistant') {
        window.assistantMessages = window.assistantMessages || [];
        const msgIdx = window.assistantMessages.length;
        window.assistantMessages.push(content);

        citationsHtml += `<div class="citations-panel">`;
        
        if (metadata.sources && metadata.sources.length > 0) {
            citationsHtml += `<span style="font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Citations:</span>`;
            metadata.sources.forEach((s, idx) => {
                citationsHtml += `<div class="citation-chip" onclick="showSourceModal(${idx})">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h18"/></svg>
                    <span>${escapeHtml(s.act_name)} · ${escapeHtml(s.article_or_section || s.heading)}</span>
                </div>`;
            });
            currentSources = metadata.sources;
        }

        citationsHtml += `
            <button class="btn-tts" onclick="speakMessageIndex(${msgIdx})">🔊 Listen</button>
            <button class="btn-tts" onclick="translateMessageIndex(${msgIdx}, this)">🌐 Translate</button>
            <button class="btn-tts" onclick="saveAnswerIndex(${msgIdx}, this)">💾 Save</button>
        </div>`;
    }

    card.innerHTML = `${metaHeader}<div class="message-body" id="msg-body-${role === 'assistant' ? (window.assistantMessages ? window.assistantMessages.length - 1 : 0) : 'user'}">${formattedText}</div>${citationsHtml}`;
    messagesList.appendChild(card);
    scrollToBottom();
}

function createLoadingCard() {
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('chat-stream').style.display = 'block';

    const card = document.createElement('div');
    card.className = 'message-card assistant';
    card.innerHTML = `
        <div class="message-meta">
            <span>Lexora Legal Analysis</span>
            <span>·</span>
            <span>Searching statutory evidence...</span>
        </div>
        <div class="message-body" style="color:var(--text-muted); font-style:italic;">
            Analyzing Constitution, BNS, BNSS, BSA & Tamil Nadu Law corpora...
        </div>
    `;
    return card;
}

function formatLegalMarkdown(text) {
    if (!text) return '';
    let html = escapeHtml(text);

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Lists & paragraphs
    const paragraphs = html.split('\n\n');
    return paragraphs.map(p => {
        if (p.startsWith('<h3>') || p.startsWith('<h2>') || p.startsWith('<h1>')) {
            return p;
        }
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('');
}

function scrollToBottom() {
    const container = document.getElementById('workspace-scroll-area');
    container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function sanitizeCitationUrl(rawUrl) {
    if (!rawUrl) return '';
    try {
        const u = new URL(rawUrl, window.location.origin);
        if (u.protocol === 'http:' || u.protocol === 'https:') {
            return u.href;
        }
    } catch(e) {}
    return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Source Drawer Inspection
// ─────────────────────────────────────────────────────────────────────────────
window.showSourceModal = function(idx) {
    const s = currentSources[idx];
    if (!s) return;

    const safeUrl = sanitizeCitationUrl(s.url);
    const modalBody = document.getElementById('source-modal-body');
    modalBody.innerHTML = `
        <div class="source-card">
            <div class="source-title">${escapeHtml(s.document_title || s.act_name)} — ${escapeHtml(s.article_or_section)}</div>
            <span class="source-badge">Official Primary Legal Source</span>
            <div class="source-authority">Authority: ${escapeHtml(s.authority || 'Ministry of Law and Justice / Government of India')}</div>
            <div style="font-weight:600; font-size:12px; margin-top:4px;">${escapeHtml(s.heading || '')}</div>
            <div class="source-text">${escapeHtml(s.text_excerpt || 'Verbatim statutory provision indexed in Lexora RAG.')}</div>
            ${safeUrl ? `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" class="source-link">View Gazette / Legal Document ↗</a>` : ''}
            <div style="margin-top:12px; display:flex; gap:8px;">
                <button class="btn-card-action" onclick="sendSourceToChat('${escapeHtml(s.act_name)}', '${escapeHtml(s.article_or_section)}')">💬 Ask Lexora about this</button>
            </div>
        </div>
    `;
    document.getElementById('source-modal').style.display = 'flex';
};

window.sendSourceToChat = function(actName, provision) {
    document.getElementById('source-modal').style.display = 'none';
    showChatWorkspace();
    const prompt = `Explain the provisions of ${actName} (${provision}) and how they apply in practice.`;
    document.getElementById('user-input').value = prompt;
    sendMessage();
};

// ─────────────────────────────────────────────────────────────────────────────
// Core Shared Actions: Translate, Listen (TTS), Save, Send to Chat
// ─────────────────────────────────────────────────────────────────────────────
window.translateMessageIndex = async function(idx, btn) {
    if (!window.assistantMessages || !window.assistantMessages[idx]) return;
    const text = window.assistantMessages[idx];
    const targetEl = document.getElementById(`msg-body-${idx}`);
    if (!targetEl) return;

    btn.textContent = 'Translating...';
    try {
        const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: text,
                target_language: 'ta',
                source_language: 'auto'
            })
        });
        const data = await res.json();
        if (data.success && data.translated_text) {
            targetEl.innerHTML = `
                ${formatLegalMarkdown(text)}
                <div class="translated-box">
                    <div style="font-size:11px; font-weight:700; color:var(--accent-gold); margin-bottom:4px; text-transform:uppercase;">Tamil Translation (தமிழ் விளக்கம்):</div>
                    ${escapeHtml(data.translated_text).replace(/\n/g, '<br>')}
                </div>
            `;
            btn.textContent = '✓ Translated';
        } else {
            alert('Translation unavailable. Please try again.');
            btn.textContent = '🌐 Translate';
        }
    } catch (e) {
        alert('Translation unavailable. Please try again.');
        btn.textContent = '🌐 Translate';
    }
};

window.saveAnswerIndex = async function(idx, btn) {
    if (!window.assistantMessages || !window.assistantMessages[idx]) return;
    const text = window.assistantMessages[idx];
    btn.textContent = 'Saving...';
    try {
        await fetch('/api/saved', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'chat',
                title: `Legal Advice: ${text.slice(0, 50)}...`,
                content: text,
                metadata: { session_id: currentSessionId }
            })
        });
        btn.textContent = '✓ Saved';
    } catch(e) {
        btn.textContent = '💾 Save';
    }
};

window.speakMessageIndex = async function(idx) {
    if (!window.assistantMessages || !window.assistantMessages[idx]) return;
    const text = window.assistantMessages[idx];
    await playTTS(text);
};

async function playTTS(text, lang = "en") {
    if (currentAudioPlayer) {
        currentAudioPlayer.pause();
        currentAudioPlayer = null;
    }

    let resolvedLang = lang;
    if (!resolvedLang || resolvedLang === "en" || resolvedLang === "auto") {
        if (/[\u0B80-\u0BFF]/.test(text)) resolvedLang = "ta";
        else if (/[\u0900-\u097F]/.test(text)) resolvedLang = "hi";
        else if (!resolvedLang) resolvedLang = "en";
    }

    try {
        const res = await fetch('/api/tts/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, language: resolvedLang })
        });
        if (!res.ok) throw new Error("TTS endpoint error");
        
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        currentAudioPlayer = new Audio(url);
        currentAudioPlayer.play();
    } catch (e) {
        // Fallback to browser Web Speech API
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text.slice(0, 300));
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PART 6 — LEGAL LIBRARY WORKSPACE
// ─────────────────────────────────────────────────────────────────────────────
async function openLegalLibrary() {
    showToolWorkspace('library');
    const container = document.getElementById('tool-workspace-container');
    const dict = UI_TRANSLATIONS[currentLanguage] || UI_TRANSLATIONS['en'];

    container.innerHTML = `
        <div class="workspace-header">
            <div>
                <h2>${escapeHtml(dict.lib_title)}</h2>
                <p>${escapeHtml(dict.lib_sub)}</p>
            </div>
            <button class="workspace-btn-outline" onclick="showChatWorkspace()">${escapeHtml(dict.lib_back)}</button>
        </div>

        <div class="workspace-search-bar">
            <input type="text" id="library-search-input" class="workspace-input" placeholder="${escapeHtml(dict.lib_ph)}" />
            <select id="library-corpus-select" class="workspace-select">
                <option value="">All Corpora</option>
                <option value="constitution">Constitution of India</option>
                <option value="bns">Bharatiya Nyaya Sanhita (BNS)</option>
                <option value="bnss">Bharatiya Nagarik Suraksha Sanhita (BNSS)</option>
                <option value="bsa">Bharatiya Sakshya Adhiniyam (BSA)</option>
                <option value="tamilnadu">Tamil Nadu State Law</option>
            </select>
            <button class="workspace-btn" id="btn-library-search">${escapeHtml(dict.lib_btn_search)}</button>
        </div>

        <div id="library-results-grid" class="workspace-grid">
            <div style="color:var(--text-muted); font-size:14px; grid-column: 1/-1; padding: 20px 0;">
                Loading authoritative laws...
            </div>
        </div>
    `;

    document.getElementById('btn-library-search').addEventListener('click', runLibrarySearch);
    document.getElementById('library-search-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') runLibrarySearch();
    });

    document.getElementById('library-search-input').value = "";
    runLibrarySearch();
}

async function runLibrarySearch() {
    const q = document.getElementById('library-search-input').value.trim();
    const corpus = document.getElementById('library-corpus-select').value;
    const grid = document.getElementById('library-results-grid');

    grid.innerHTML = '<div style="color:var(--text-muted); padding:20px;">Searching authoritative legal corpora...</div>';

    try {
        const res = await fetch(`/api/legal/search?q=${encodeURIComponent(q)}&corpus=${encodeURIComponent(corpus)}`);
        const data = await res.json();
        const results = data.results || [];

        if (results.length === 0) {
            grid.innerHTML = '<div style="color:var(--text-muted); padding:20px;">No matching statutory records found for this query in the indexed corpora.</div>';
            return;
        }

        grid.innerHTML = '';
        results.forEach(r => {
            const card = document.createElement('div');
            card.className = 'workspace-card';
            card.innerHTML = `
                <div class="card-meta">
                    <span class="card-badge badge-gold">${escapeHtml(r.act_name)}</span>
                    <span class="card-badge">${escapeHtml(r.jurisdiction)}</span>
                </div>
                <div class="card-title">${escapeHtml(r.article_or_section || r.title)}: ${escapeHtml(r.heading || '')}</div>
                <div class="card-body-text">${escapeHtml(r.text)}</div>
                <div class="card-actions-bar">
                    <button class="btn-card-action btn-open">Open</button>
                    <button class="btn-card-action btn-save">💾 Save</button>
                    <button class="btn-card-action btn-tts">🔊 Listen</button>
                    <button class="btn-card-action btn-card-primary btn-ask">💬 Ask Lexora</button>
                </div>
            `;
            card.querySelector('.btn-open').addEventListener('click', () => openItemDetail(r, 'provision'));
            card.querySelector('.btn-save').addEventListener('click', () => saveGenericItem('provision', r.title, r.text));
            card.querySelector('.btn-tts').addEventListener('click', () => playTTS(r.text));
            card.querySelector('.btn-ask').addEventListener('click', () => sendProvisionToChat(r.title, r.text));
            grid.appendChild(card);
        });
    } catch (e) {
        grid.innerHTML = '<div style="color:#DC2626; padding:20px;">Error executing legal search. Please verify server connection.</div>';
    }
}

window.sendProvisionToChat = function(title, text) {
    showChatWorkspace();
    const prompt = `I would like consultation on ${title}:\n\n${text}\n\nCould you please explain this statutory provision and its key legal consequences?`;
    document.getElementById('user-input').value = prompt;
    sendMessage();
};

// ─────────────────────────────────────────────────────────────────────────────
// PART 11 — GOVERNMENT SCHEMES WORKSPACE
// ─────────────────────────────────────────────────────────────────────────────
async function openGovernmentSchemes() {
    showToolWorkspace('schemes');
    const container = document.getElementById('tool-workspace-container');
    const dict = UI_TRANSLATIONS[currentLanguage] || UI_TRANSLATIONS['en'];

    container.innerHTML = `
        <div class="workspace-header">
            <div>
                <h2>${escapeHtml(dict.schemes_title)}</h2>
                <p>${escapeHtml(dict.schemes_sub)}</p>
            </div>
            <button class="workspace-btn-outline" onclick="showChatWorkspace()">${escapeHtml(dict.lib_back)}</button>
        </div>

        <div class="workspace-search-bar">
            <input type="text" id="scheme-search-input" class="workspace-input" placeholder="${escapeHtml(dict.schemes_ph)}" />
            <select id="scheme-level-select" class="workspace-select">
                <option value="">All Levels</option>
                <option value="Central">Central Govt</option>
                <option value="Tamil Nadu">Tamil Nadu State</option>
            </select>
            <button class="workspace-btn" id="btn-scheme-search">${escapeHtml(dict.schemes_btn_search)}</button>
        </div>

        <div id="schemes-results-grid" class="workspace-grid">
            <!-- Populated dynamically -->
        </div>
    `;

    document.getElementById('btn-scheme-search').addEventListener('click', runSchemeSearch);
    document.getElementById('scheme-search-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') runSchemeSearch();
    });

    runSchemeSearch();
}

async function runSchemeSearch() {
    const q = document.getElementById('scheme-search-input').value.trim();
    const level = document.getElementById('scheme-level-select').value;
    const grid = document.getElementById('schemes-results-grid');
    grid.innerHTML = '<div style="color:var(--text-muted); padding:20px;">Searching verified government schemes...</div>';

    try {
        const res = await fetch(`/api/schemes/search?q=${encodeURIComponent(q)}&level=${encodeURIComponent(level)}`);
        const data = await res.json();
        const schemes = data.schemes || [];

        if (schemes.length === 0) {
            grid.innerHTML = '<div style="color:var(--text-muted); padding:20px;">No government schemes found matching your criteria.</div>';
            return;
        }

        grid.innerHTML = '';
        schemes.forEach(s => {
            const card = document.createElement('div');
            card.className = 'workspace-card';
            card.innerHTML = `
                <div class="card-meta">
                    <span class="card-badge badge-green">${escapeHtml(s.level)}</span>
                    <span class="card-badge">${escapeHtml(s.category)}</span>
                </div>
                <div class="card-title">${escapeHtml(s.scheme_name)}</div>
                <div style="font-size:12px; color:var(--text-muted);">${escapeHtml(s.ministry)}</div>
                <div class="card-body-text">${escapeHtml(s.description)}</div>
                <div style="font-size:12.5px; font-weight:600; color:var(--primary-navy); margin-top:4px;">Benefits: ${escapeHtml(s.benefits)}</div>
                <div class="card-actions-bar">
                    <button class="btn-card-action btn-open">View Details</button>
                    <button class="btn-card-action btn-save">💾 Save</button>
                    <button class="btn-card-action btn-tts">🔊 Listen</button>
                    <button class="btn-card-action btn-card-primary btn-check">💬 Check Eligibility</button>
                </div>
            `;
            card.querySelector('.btn-open').addEventListener('click', () => openItemDetail(s, 'scheme'));
            card.querySelector('.btn-save').addEventListener('click', () => saveGenericItem('scheme', s.scheme_name, s.description));
            card.querySelector('.btn-tts').addEventListener('click', () => playTTS(s.scheme_name + '. ' + s.benefits));
            card.querySelector('.btn-check').addEventListener('click', () => sendSchemeToChat(s.scheme_name, s.eligibility));
            grid.appendChild(card);
        });
    } catch(e) {
        grid.innerHTML = '<div style="color:#DC2626; padding:20px;">Error loading schemes.</div>';
    }
}

window.sendSchemeToChat = function(schemeName, eligibility) {
    showChatWorkspace();
    const prompt = `I am interested in applying for '${schemeName}'. The eligibility criteria state:\n\n"${eligibility}"\n\nCan I apply for this scheme, and what specific steps and documents are required?`;
    document.getElementById('user-input').value = prompt;
    sendMessage();
};

// ─────────────────────────────────────────────────────────────────────────────
// PART 12 — CASE EXPLORER WORKSPACE
// ─────────────────────────────────────────────────────────────────────────────
async function openCaseExplorer() {
    showToolWorkspace('explorer');
    const container = document.getElementById('tool-workspace-container');
    const dict = UI_TRANSLATIONS[currentLanguage] || UI_TRANSLATIONS['en'];

    container.innerHTML = `
        <div class="workspace-header">
            <div>
                <h2>${escapeHtml(dict.cases_title)}</h2>
                <p>${escapeHtml(dict.cases_sub)}</p>
            </div>
            <button class="workspace-btn-outline" onclick="showChatWorkspace()">${escapeHtml(dict.lib_back)}</button>
        </div>

        <div class="workspace-search-bar">
            <input type="text" id="case-search-input" class="workspace-input" placeholder="${escapeHtml(dict.cases_ph)}" />
            <button class="workspace-btn" id="btn-case-search">${escapeHtml(dict.cases_btn_search)}</button>
        </div>

        <div id="cases-results-grid" class="workspace-grid">
            <!-- Populated dynamically -->
        </div>
    `;

    document.getElementById('btn-case-search').addEventListener('click', runCaseSearch);
    document.getElementById('case-search-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') runCaseSearch();
    });

    runCaseSearch();
}

async function runCaseSearch() {
    const q = document.getElementById('case-search-input').value.trim();
    const grid = document.getElementById('cases-results-grid');
    grid.innerHTML = '<div style="color:var(--text-muted); padding:20px;">Searching verified case law precedents...</div>';

    try {
        const res = await fetch(`/api/cases/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        const cases = data.cases || [];

        if (cases.length === 0) {
            grid.innerHTML = '<div style="color:var(--text-muted); padding:20px;">No verified case records found matching this inquiry.</div>';
            return;
        }

        grid.innerHTML = '';
        cases.forEach(c => {
            const card = document.createElement('div');
            card.className = 'workspace-card';
            card.innerHTML = `
                <div class="card-meta">
                    <span class="card-badge badge-gold">${escapeHtml(c.court)}</span>
                    <span class="card-badge">${escapeHtml(c.decision_date)}</span>
                </div>
                <div class="card-title">${escapeHtml(c.title)}</div>
                <div style="font-size:12px; font-weight:600; color:var(--text-secondary);">${escapeHtml(c.citation)}</div>
                <div class="card-body-text">${escapeHtml(c.summary)}</div>
                <div style="font-size:12px; color:var(--accent-gold); margin-top:4px;">Provisions: ${escapeHtml(c.provisions.join(', '))}</div>
                <div class="card-actions-bar">
                    <button class="btn-card-action btn-open">View Holding</button>
                    <button class="btn-card-action btn-save">💾 Save</button>
                    <button class="btn-card-action btn-tts">🔊 Listen</button>
                    <button class="btn-card-action btn-card-primary btn-ask">💬 Ask Lexora</button>
                </div>
            `;
            card.querySelector('.btn-open').addEventListener('click', () => openItemDetail(c, 'case'));
            card.querySelector('.btn-save').addEventListener('click', () => saveGenericItem('case', c.title, c.summary));
            card.querySelector('.btn-tts').addEventListener('click', () => playTTS(c.title + '. ' + c.holding));
            card.querySelector('.btn-ask').addEventListener('click', () => sendCaseToChat(c.title, c.citation, c.holding));
            grid.appendChild(card);
        });
    } catch(e) {
        grid.innerHTML = '<div style="color:#DC2626; padding:20px;">Error searching cases.</div>';
    }
}

window.sendCaseToChat = function(title, citation, holding) {
    showChatWorkspace();
    const prompt = `What is the significance of the landmark ruling in ${title} (${citation})?\n\nKey Holding: "${holding}"\n\nHow does this judicial precedent apply to current disputes?`;
    document.getElementById('user-input').value = prompt;
    sendMessage();
};

// ─────────────────────────────────────────────────────────────────────────────
// PART 7 — SAVED ITEMS WORKSPACE
// ─────────────────────────────────────────────────────────────────────────────
async function openSavedItems() {
    showToolWorkspace('saved');
    const container = document.getElementById('tool-workspace-container');
    const dict = UI_TRANSLATIONS[currentLanguage] || UI_TRANSLATIONS['en'];

    container.innerHTML = `
        <div class="workspace-header">
            <div>
                <h2>${escapeHtml(dict.saved_title)}</h2>
                <p>${escapeHtml(dict.saved_sub)}</p>
            </div>
            <button class="workspace-btn-outline" onclick="showChatWorkspace()">${escapeHtml(dict.lib_back)}</button>
        </div>

        <div class="workspace-search-bar">
            <input type="text" id="saved-search-input" class="workspace-input" placeholder="${escapeHtml(dict.saved_ph)}" />
            <select id="saved-filter-select" class="workspace-select">
                <option value="all">All Items</option>
                <option value="provision">Legal Provisions</option>
                <option value="chat">Chatbot Answers</option>
                <option value="scheme">Government Schemes</option>
                <option value="case">Landmark Cases</option>
                <option value="draft">Legal Drafts</option>
            </select>
        </div>

        <div id="saved-results-grid" class="workspace-grid">
            <!-- Populated dynamically -->
        </div>
    `;

    document.getElementById('saved-search-input').addEventListener('input', runSavedSearch);
    document.getElementById('saved-filter-select').addEventListener('change', runSavedSearch);
    runSavedSearch();
}

async function runSavedSearch() {
    const q = document.getElementById('saved-search-input') ? document.getElementById('saved-search-input').value : '';
    const type = document.getElementById('saved-filter-select') ? document.getElementById('saved-filter-select').value : 'all';
    const grid = document.getElementById('saved-results-grid');
    if (!grid) return;

    try {
        const res = await fetch(`/api/saved?type=${encodeURIComponent(type)}&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        const items = data.items || [];

        if (items.length === 0) {
            grid.innerHTML = '<div style="color:var(--text-muted); padding:20px;">No saved items found. You can save provisions, answers, schemes, or drafts using the 💾 Save button.</div>';
            return;
        }

        grid.innerHTML = '';
        items.forEach(i => {
            const card = document.createElement('div');
            card.className = 'workspace-card';
            card.innerHTML = `
                <div class="card-meta">
                    <span class="card-badge badge-gold">${escapeHtml(i.type.toUpperCase())}</span>
                    <span>${new Date(i.saved_at * 1000).toLocaleDateString()}</span>
                </div>
                <div class="card-title">${escapeHtml(i.title)}</div>
                <div class="card-body-text">${escapeHtml(i.content)}</div>
                <div class="card-actions-bar">
                    <button class="btn-card-action btn-open">Open</button>
                    <button class="btn-card-action btn-tts">🔊 Listen</button>
                    <button class="btn-card-action btn-del" style="color:#DC2626;">Delete</button>
                </div>
            `;
            card.querySelector('.btn-open').addEventListener('click', () => openItemDetail(i, 'saved'));
            card.querySelector('.btn-tts').addEventListener('click', () => playTTS(i.content));
            card.querySelector('.btn-del').addEventListener('click', () => deleteSavedItem(i.id));
            grid.appendChild(card);
        });
    } catch(e) {
        grid.innerHTML = '<div style="color:#DC2626; padding:20px;">Error loading saved records.</div>';
    }
}

async function saveGenericItem(type, title, content) {
    try {
        await fetch('/api/saved', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: type,
                title: title,
                content: content
            })
        });
        alert('Item successfully saved to your Lexora Desk.');
    } catch(e) {
        alert('Failed to save item.');
    }
}

async function deleteSavedItem(id) {
    if (!confirm('Remove this item from your saved list?')) return;
    try {
        await fetch(`/api/saved/${id}`, { method: 'DELETE' });
        runSavedSearch();
    } catch(e) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// PART 8 — DRAFT GENERATOR WORKSPACE
// ─────────────────────────────────────────────────────────────────────────────
async function openDraftGenerator() {
    showToolWorkspace('draft');
    const container = document.getElementById('tool-workspace-container');
    container.innerHTML = `
        <div class="workspace-header">
            <div>
                <h2>Draft Generator</h2>
                <p>Generate formal criminal complaints, representations, legal notices, and cooperative petitions with verified statutory grounding.</p>
            </div>
            <button class="workspace-btn-outline" onclick="showChatWorkspace()">← Back to Chat</button>
        </div>

        <div style="background-color:#FFFFFF; border:1px solid var(--border-color); border-radius:var(--radius-md); padding:24px; display:flex; flex-direction:column; gap:16px;">
            <div style="display:flex; gap:16px; flex-wrap:wrap;">
                <div style="flex:1; min-width:240px;">
                    <label style="font-size:12px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:6px;">Draft Type</label>
                    <select id="draft-type-select" class="workspace-select" style="width:100%;">
                        <option value="complaint">Police Criminal Complaint (Section 173 BNSS)</option>
                        <option value="legal_notice">Formal Legal Notice (Remedy / Statutory Compliance)</option>
                        <option value="cooperative">Cooperative Society Dispute (Section 90 TN Act)</option>
                        <option value="representation">Citizen Representation / Grievance Petition</option>
                    </select>
                </div>
                <div style="flex:1; min-width:240px;">
                    <label style="font-size:12px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:6px;">Applicant / Complainant Name</label>
                    <input type="text" id="draft-name" class="workspace-input" style="width:100%;" placeholder="e.g. R. Sundaram" />
                </div>
            </div>

            <div style="display:flex; gap:16px; flex-wrap:wrap;">
                <div style="flex:1; min-width:240px;">
                    <label style="font-size:12px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:6px;">Opposite Party / Respondent</label>
                    <input type="text" id="draft-opposite" class="workspace-input" style="width:100%;" placeholder="e.g. Inspector of Police / Property Owner / Society Board" />
                </div>
                <div style="flex:1; min-width:240px;">
                    <label style="font-size:12px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:6px;">Jurisdiction / Place of Incident</label>
                    <input type="text" id="draft-place" class="workspace-input" style="width:100%;" placeholder="e.g. Madurai Central / Chennai" />
                </div>
            </div>

            <div>
                <label style="font-size:12px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:6px;">Statement of Facts & Allegations</label>
                <textarea id="draft-facts" class="ocr-result-area" rows="4" placeholder="Describe the factual situation, dates, what occurred, and what harm was caused..."></textarea>
            </div>

            <div>
                <label style="font-size:12px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:6px;">Specific Relief / Prayer Sought</label>
                <input type="text" id="draft-remedy" class="workspace-input" style="width:100%;" placeholder="e.g. Immediate registration of FIR and recovery of movable property / restitution" />
            </div>

            <div>
                <button class="workspace-btn" id="btn-generate-draft">Generate Verified Legal Draft</button>
            </div>
        </div>

        <div id="draft-output-panel" style="margin-top:24px; display:none;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
                <h3 id="draft-output-title" style="font-family:var(--font-serif); font-size:17px; color:var(--primary-navy);">Generated Legal Draft</h3>
                <div style="display:flex; gap:8px;">
                    <button class="btn-card-action" id="btn-copy-draft">📋 Copy</button>
                    <button class="btn-card-action" id="btn-save-draft">💾 Save</button>
                    <button class="btn-card-action" id="btn-tts-draft">🔊 Listen</button>
                    <button class="btn-card-action" id="btn-trans-draft">🌐 Translate</button>
                </div>
            </div>
            <textarea id="draft-content-text" class="ocr-result-area" style="min-height:300px; font-family:var(--font-serif); font-size:14px;"></textarea>
        </div>
    `;

    document.getElementById('btn-generate-draft').addEventListener('click', runDraftGeneration);
}

async function runDraftGeneration() {
    const draftType = document.getElementById('draft-type-select').value;
    const name = document.getElementById('draft-name').value;
    const opposite = document.getElementById('draft-opposite').value;
    const place = document.getElementById('draft-place').value;
    const facts = document.getElementById('draft-facts').value;
    const remedy = document.getElementById('draft-remedy').value;

    if (!facts.trim()) {
        alert('Please enter statement of facts.');
        return;
    }

    const btn = document.getElementById('btn-generate-draft');
    btn.textContent = 'Generating Draft...';

    try {
        const res = await fetch('/api/drafts/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                draft_type: draftType,
                details: {
                    complainant_name: name,
                    opposite_party: opposite,
                    place: place,
                    facts: facts,
                    remedy_sought: remedy
                }
            })
        });
        const data = await res.json();
        btn.textContent = 'Generate Verified Legal Draft';

        document.getElementById('draft-output-panel').style.display = 'block';
        document.getElementById('draft-output-title').textContent = data.title;
        document.getElementById('draft-content-text').value = data.content;

        document.getElementById('btn-copy-draft').onclick = () => {
            navigator.clipboard.writeText(document.getElementById('draft-content-text').value);
            alert('Draft copied to clipboard.');
        };
        document.getElementById('btn-save-draft').onclick = () => {
            saveGenericItem('draft', data.title, document.getElementById('draft-content-text').value);
        };
        document.getElementById('btn-tts-draft').onclick = () => {
            playTTS(document.getElementById('draft-content-text').value);
        };
        document.getElementById('btn-trans-draft').onclick = async () => {
            const current = document.getElementById('draft-content-text').value;
            const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: current, target_language: 'ta' })
            });
            const tData = await res.json();
            if (tData.success) {
                document.getElementById('draft-content-text').value = tData.translated_text;
            }
        };
    } catch(e) {
        btn.textContent = 'Generate Verified Legal Draft';
        alert('Error generating legal draft.');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PART 13 — SMART DOC & VOICE ASSIST (Camera, OCR, Voice, Document Analysis)
// ─────────────────────────────────────────────────────────────────────────────
async function openSmartDocAndVoice() {
    showToolWorkspace('voice');
    const container = document.getElementById('tool-workspace-container');
    container.innerHTML = `
        <div class="workspace-header">
            <div>
                <h2>Smart Doc & Voice Assist</h2>
                <p>Unified multimodal workspace: Browser Camera capture, Handwriting OCR, Document Analysis, and Bilingual Voice Consultation.</p>
            </div>
            <button class="workspace-btn-outline" onclick="showChatWorkspace()">← Back to Chat</button>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:20px;">
            <!-- Camera & Scanner Column -->
            <div style="background-color:#FFFFFF; border:1px solid var(--border-color); border-radius:var(--radius-md); padding:20px; display:flex; flex-direction:column; gap:14px;">
                <h3 style="font-family:var(--font-serif); font-size:16px; color:var(--primary-navy);">📷 Camera & Document Scanner</h3>
                <div class="camera-box" id="camera-box-preview">
                    <video id="camera-video" autoplay playsinline style="display:none;"></video>
                    <canvas id="camera-canvas" style="display:none;"></canvas>
                    <div id="camera-placeholder" style="color:#FFFFFF; font-size:13px; text-align:center; padding:40px 20px;">
                        Camera is currently closed. Click "Open Camera" to capture document or handwriting.
                    </div>
                </div>

                <div class="camera-controls">
                    <button class="workspace-btn" id="btn-open-camera">Open Camera</button>
                    <button class="workspace-btn" id="btn-snap-camera" style="display:none;">Capture Photo</button>
                    <button class="workspace-btn-outline" id="btn-close-camera" style="display:none;">Close Camera</button>
                </div>

                <div style="border-top:1px solid var(--border-color); padding-top:12px;">
                    <label style="font-size:12px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:6px;">Or Upload Document / Scan Image</label>
                    <input type="file" id="scanner-file-input" accept=".pdf,.txt,.png,.jpg,.jpeg,.webp" class="workspace-input" style="width:100%;" />
                </div>
            </div>

            <!-- OCR Extraction & Verification Column -->
            <div style="background-color:#FFFFFF; border:1px solid var(--border-color); border-radius:var(--radius-md); padding:20px; display:flex; flex-direction:column; gap:14px;">
                <h3 style="font-family:var(--font-serif); font-size:16px; color:var(--primary-navy);">📝 Extracted Text & Quality Check</h3>
                
                <div id="ocr-warning-box" class="warning-callout" style="display:none;">
                    <span id="ocr-warning-text"></span>
                </div>

                <textarea id="ocr-editable-text" class="ocr-result-area" placeholder="Extracted printed or handwritten text will appear here for verification and user editing before legal analysis..."></textarea>
                
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button class="workspace-btn" id="btn-analyze-extracted">Analyze in Lexora</button>
                    <button class="workspace-btn-outline" id="btn-tts-extracted">🔊 Listen</button>
                    <button class="workspace-btn-outline" id="btn-trans-extracted">🌐 Translate to Tamil</button>
                </div>

                <div id="doc-analysis-panel" style="display:none; margin-top:10px; border-top:1px solid var(--border-color); padding-top:12px;">
                    <h4 style="font-size:14px; font-weight:700; color:var(--primary-navy); margin-bottom:6px;">Structured Legal Document Analysis:</h4>
                    <div id="doc-analysis-content" style="font-size:13px; line-height:1.55; color:var(--text-secondary);"></div>
                </div>
            </div>
        </div>
    `;

    setupSmartDocListeners();
}

function setupSmartDocListeners() {
    const btnOpen = document.getElementById('btn-open-camera');
    const btnSnap = document.getElementById('btn-snap-camera');
    const btnClose = document.getElementById('btn-close-camera');
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const placeholder = document.getElementById('camera-placeholder');

    btnOpen.addEventListener('click', async () => {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = cameraStream;
            video.style.display = 'block';
            canvas.style.display = 'none';
            placeholder.style.display = 'none';
            btnOpen.style.display = 'none';
            btnSnap.style.display = 'inline-flex';
            btnClose.style.display = 'inline-flex';
        } catch (e) {
            alert('Camera access unavailable or permission denied. You can upload an image file directly.');
        }
    });

    btnSnap.addEventListener('click', () => {
        if (!cameraStream) return;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        video.style.display = 'none';
        canvas.style.display = 'block';

        // Convert canvas to blob and run OCR
        canvas.toBlob(async (blob) => {
            await runOCRFromFile(blob, "camera_scan.jpg");
        }, 'image/jpeg', 0.95);
    });

    btnClose.addEventListener('click', () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            cameraStream = null;
        }
        video.style.display = 'none';
        canvas.style.display = 'none';
        placeholder.style.display = 'block';
        btnOpen.style.display = 'inline-flex';
        btnSnap.style.display = 'none';
        btnClose.style.display = 'none';
    });

    document.getElementById('scanner-file-input').addEventListener('change', async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        await runOCRFromFile(file, file.name);
    });

    document.getElementById('btn-analyze-extracted').addEventListener('click', () => {
        const text = document.getElementById('ocr-editable-text').value.trim();
        if (!text) {
            alert('No text available to analyze.');
            return;
        }
        showChatWorkspace();
        const prompt = `Please review and provide a structured legal analysis of this extracted document text:\n\n${text}`;
        document.getElementById('user-input').value = prompt;
        sendMessage();
    });

    document.getElementById('btn-tts-extracted').addEventListener('click', () => {
        const text = document.getElementById('ocr-editable-text').value.trim();
        if (text) playTTS(text);
    });

    document.getElementById('btn-trans-extracted').addEventListener('click', async () => {
        const text = document.getElementById('ocr-editable-text').value.trim();
        if (!text) return;
        const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, target_language: 'ta' })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('ocr-editable-text').value = data.translated_text;
        }
    });
}

async function runOCRFromFile(fileBlob, filename) {
    const ocrBox = document.getElementById('ocr-editable-text');
    const warningBox = document.getElementById('ocr-warning-box');
    const warningText = document.getElementById('ocr-warning-text');
    ocrBox.value = 'Running OCR extraction...';
    warningBox.style.display = 'none';

    const formData = new FormData();
    formData.append('file', fileBlob, filename);
    formData.append('session_id', currentSessionId);

    try {
        const res = await fetch('/api/upload_document', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        ocrBox.value = data.preview || '';

        if (data.analysis) {
            const a = data.analysis;
            let analysisHtml = `<strong>Summary:</strong> ${escapeHtml(a.summary)}<br>`;
            if (a.parties && a.parties.length) analysisHtml += `<strong>Parties:</strong> ${escapeHtml(a.parties.join(', '))}<br>`;
            if (a.referenced_laws && a.referenced_laws.length) analysisHtml += `<strong>Referenced Laws:</strong> ${escapeHtml(a.referenced_laws.join(', '))}<br>`;
            if (a.dates && a.dates.length) analysisHtml += `<strong>Dates:</strong> ${escapeHtml(a.dates.join(', '))}<br>`;
            
            document.getElementById('doc-analysis-panel').style.display = 'block';
            document.getElementById('doc-analysis-content').innerHTML = analysisHtml;
        }

        document.getElementById('uploaded-doc-badge').style.display = 'flex';
        document.getElementById('doc-filename').textContent = filename;
    } catch(e) {
        ocrBox.value = 'Failed to extract text. You can manually type or paste the document content here.';
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PART 17 — RAG DIAGNOSTICS WORKSPACE
// ─────────────────────────────────────────────────────────────────────────────
async function openDiagnostics() {
    showToolWorkspace('diagnostics');
    const container = document.getElementById('tool-workspace-container');
    container.innerHTML = `
        <div class="workspace-header">
            <div>
                <h2>RAG Runtime Diagnostics & LARV Telemetry</h2>
                <p>Real-time architectural telemetry for multi-corpus hybrid retrieval, Reciprocal Rank Fusion (RRF), LARV adaptive scoring, and evidence validation.</p>
            </div>
            <button class="workspace-btn-outline" onclick="showChatWorkspace()">← Back to Chat</button>
        </div>

        <div id="diagnostics-content" style="background-color:#FFFFFF; border:1px solid var(--border-color); border-radius:var(--radius-md); padding:24px; font-size:13px; line-height:1.6;">
            Loading real-time RAG diagnostic telemetry...
        </div>
    `;

    try {
        const res = await fetch(`/api/rag/diagnostics?session_id=${currentSessionId}`);
        const data = await res.json();
        
        let larvCardsHtml = '';
        const evaluated = data.larv_layer?.candidates_evaluated || [];
        if (evaluated.length > 0) {
            larvCardsHtml = `
                <h4 style="margin: 20px 0 10px 0; color: #0C1E3C;">LARV Candidate Ranking Breakdown (${evaluated.length} candidates)</h4>
                <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:24px;">
            `;
            evaluated.forEach((c, idx) => {
                larvCardsHtml += `
                    <div style="border:1px solid #E2E8F0; border-radius:8px; padding:14px; background:#F8FAFC;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:600; color:#1E293B;">#${idx+1} ${escapeHtml(c.document_title || '')} — ${escapeHtml(c.article_or_section || '')}</span>
                            <div>
                                <span style="background:#E0E7FF; color:#3730A3; padding:2px 8px; border-radius:4px; font-weight:600; margin-right:6px;">RRF: ${c.rrf_score}</span>
                                <span style="background:#DCFCE7; color:#166534; padding:2px 8px; border-radius:4px; font-weight:600;">LARV: ${c.larv_score}</span>
                            </div>
                        </div>
                        <div style="margin-top:6px; font-size:12px; color:#475569;">
                            <strong>Authority:</strong> ${escapeHtml(c.source_authority || 'Official Source')} | 
                            <strong>Potential Conflict:</strong> ${c.potential_conflict ? '<span style="color:#DC2626; font-weight:600;">YES</span>' : '<span style="color:#16A34A;">None</span>'}
                        </div>
                        <div style="margin-top:6px; font-size:11px; color:#64748B; font-family:monospace;">
                            Semantic: ${c.components?.semantic} | Keyword: ${c.components?.keyword} | Authority: ${c.components?.authority} | Jurisdiction: ${c.components?.jurisdiction} | Structural: ${c.components?.structural} | Recency: ${c.components?.recency} | Intent: ${c.components?.intent} | Conflict: ${c.components?.conflict}
                        </div>
                        <div style="margin-top:6px; font-size:12px; color:#2563EB;">
                            <strong>Why Ranked:</strong> ${(c.rank_reason || []).join(' • ')}
                        </div>
                    </div>
                `;
            });
            larvCardsHtml += `</div>`;
        }

        const rawJson = escapeHtml(JSON.stringify(data, null, 2));
        document.getElementById('diagnostics-content').innerHTML = `
            <div style="margin-bottom:16px;">
                <div style="display:inline-block; background:#FEF3C7; color:#92400E; padding:4px 10px; border-radius:4px; font-weight:600; margin-right:8px;">
                    LARV Layer: ${data.larv_layer?.enabled ? 'ACTIVE' : 'DISABLED'}
                </div>
                <div style="display:inline-block; background:#E0F2FE; color:#0369A1; padding:4px 10px; border-radius:4px; font-weight:600;">
                    Hybrid Retrieval: ${escapeHtml(data.hybrid_retrieval || '')}
                </div>
            </div>
            ${larvCardsHtml}
            <h4 style="margin: 16px 0 8px 0; color: #0C1E3C;">Full Telemetry JSON</h4>
            <pre style="background:#0F172A; color:#E2E8F0; padding:16px; border-radius:6px; overflow-x:auto; font-size:12px;">${rawJson}</pre>
        `;
    } catch(e) {
        document.getElementById('diagnostics-content').textContent = 'Failed to connect to RAG telemetry service: ' + e;
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// Generic Reusable Modal Dialog for Details
// ─────────────────────────────────────────────────────────────────────────────
function openItemDetail(item, itemType) {
    const titleEl = document.getElementById('item-modal-title');
    const bodyEl = document.getElementById('item-modal-body');
    const footerEl = document.getElementById('item-modal-footer');

    titleEl.textContent = item.title || item.scheme_name || item.name || 'Statutory Detail';
    
    let bodyHtml = '';
    if (itemType === 'provision') {
        bodyHtml = `
            <div><strong>Act:</strong> ${escapeHtml(item.act_name)}</div>
            <div><strong>Provision:</strong> ${escapeHtml(item.article_or_section)}</div>
            <div><strong>Heading:</strong> ${escapeHtml(item.heading)}</div>
            <div><strong>Jurisdiction:</strong> ${escapeHtml(item.jurisdiction)}</div>
            <div><strong>Legal Status:</strong> ${escapeHtml(item.legal_status || 'Active')}</div>
            <div class="source-text">${escapeHtml(item.text)}</div>
        `;
    } else if (itemType === 'scheme') {
        bodyHtml = `
            <div><strong>Level:</strong> ${escapeHtml(item.level)} | <strong>Ministry:</strong> ${escapeHtml(item.ministry)}</div>
            <div><strong>Description:</strong> ${escapeHtml(item.description)}</div>
            <div><strong>Benefits:</strong> ${escapeHtml(item.benefits)}</div>
            <div><strong>Eligibility Criteria:</strong> ${escapeHtml(item.eligibility)}</div>
            <div><strong>Required Documents:</strong> ${escapeHtml(Array.isArray(item.required_documents) ? item.required_documents.join(', ') : item.required_documents)}</div>
            <div><strong>Application Portal:</strong> <a href="${escapeHtml(item.official_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.official_url)}</a></div>
        `;
    } else if (itemType === 'case') {
        bodyHtml = `
            <div><strong>Court:</strong> ${escapeHtml(item.court)} | <strong>Date:</strong> ${escapeHtml(item.decision_date)}</div>
            <div><strong>Citation:</strong> ${escapeHtml(item.citation)}</div>
            <div><strong>Provisions Interpreted:</strong> ${escapeHtml(item.provisions.join(', '))}</div>
            <div><strong>Summary:</strong> ${escapeHtml(item.summary)}</div>
            <div class="source-text"><strong>Holding:</strong> ${escapeHtml(item.holding)}</div>
        `;
    } else {
        bodyHtml = `<div class="source-text">${escapeHtml(item.content || item.text || JSON.stringify(item))}</div>`;
    }

    bodyEl.innerHTML = bodyHtml;

    footerEl.innerHTML = `
        <button class="workspace-btn-outline btn-close-modal">Close</button>
        <button class="workspace-btn btn-send-detail">💬 Send to Chat</button>
    `;

    footerEl.querySelector('.btn-close-modal').addEventListener('click', () => {
        document.getElementById('item-modal').style.display = 'none';
    });
    footerEl.querySelector('.btn-send-detail').addEventListener('click', () => {
        sendDetailToChat(item.title || item.scheme_name || 'Provision', item.text || item.description || item.holding || '');
    });

    document.getElementById('item-modal').style.display = 'flex';
}

window.sendDetailToChat = function(title, content) {
    document.getElementById('item-modal').style.display = 'none';
    showChatWorkspace();
    const prompt = `I would like to consult on '${title}':\n\n${content}\n\nCould you please explain what this means and what actions I should take?`;
    document.getElementById('user-input').value = prompt;
    sendMessage();
};

function escapeJsString(str) {
    if (!str) return "''";
    return JSON.stringify(str);
}

// ─────────────────────────────────────────────────────────────────────────────
// Document Upload
// ─────────────────────────────────────────────────────────────────────────────
async function handleFileUpload() {
    const fileInput = document.getElementById('file-input');
    if (!fileInput.files || fileInput.files.length === 0) return;

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('session_id', currentSessionId);
    formData.append('file', file);

    try {
        const res = await fetch('/api/upload_document', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        document.getElementById('uploaded-doc-badge').style.display = 'flex';
        document.getElementById('doc-filename').textContent = data.filename;

        showChatWorkspace();
        appendMessage('assistant', `Document '${data.filename}' successfully loaded into consultation session. Lexora is ready to analyze questions regarding this document.`);
    } catch (e) {
        console.error('Failed to upload document', e);
        alert('Failed to upload document.');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// VOICE OVERLAY MODAL — Open / Close / State Management
// ─────────────────────────────────────────────────────────────────────────────
function openVoiceOverlay() {
    if (!recognition) {
        // Try to init speech recognition first
        initSpeechRecognition();
        if (!recognition) {
            alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
            return;
        }
    }

    voiceOverlayActive = true;
    const overlay = document.getElementById('voice-overlay');
    overlay.style.display = 'flex';

    // Reset modal to idle state
    setVoiceOrbState('idle');
    document.getElementById('voice-modal-transcript').textContent =
        '"வணக்கம் Lexora, எனக்கு நில தகராறு சம்பந்தமாக உதவி வேண்டும்..." / "What is Section 303 BNS?"';
    document.getElementById('voice-summary-area').style.display = 'none';
    document.getElementById('voice-modal-response').textContent = '';
    document.getElementById('voice-modal-audio-stop').style.display = 'none';

    // Reset mic button
    const micBtn = document.getElementById('voice-modal-mic-toggle');
    micBtn.classList.remove('recording');
    document.getElementById('voice-mic-icon').textContent = '🎙️';
    document.getElementById('voice-mic-label').textContent = 'Start Listening';
}

function closeVoiceOverlay() {
    voiceOverlayActive = false;
    const overlay = document.getElementById('voice-overlay');
    overlay.style.display = 'none';

    // Stop any active recognition
    if (isVoiceRecording && recognition) {
        try { recognition.stop(); } catch(e) {}
        isVoiceRecording = false;
    }

    // Stop any playing audio
    stopVoiceOverlayAudio();

    // Reset orb
    setVoiceOrbState('idle');
}

function setVoiceOrbState(state) {
    const orb = document.getElementById('voice-orb');
    const stateLabel = document.getElementById('voice-state-label');
    const statusPill = document.getElementById('voice-status-pill');

    // Clear all states
    orb.classList.remove('listening', 'thinking', 'speaking');

    switch(state) {
        case 'listening':
            orb.classList.add('listening');
            stateLabel.textContent = 'LISTENING — SPEAK YOUR LEGAL INQUIRY';
            statusPill.textContent = 'Listening...';
            break;
        case 'thinking':
            orb.classList.add('thinking');
            stateLabel.textContent = 'PROCESSING YOUR INQUIRY...';
            statusPill.textContent = 'Analyzing Legal Corpora...';
            break;
        case 'speaking':
            orb.classList.add('speaking');
            stateLabel.textContent = 'LEXORA IS RESPONDING';
            statusPill.textContent = 'Speaking Response...';
            break;
        default: // 'idle'
            stateLabel.textContent = 'TAP TO SPEAK OR START SPEAKING';
            statusPill.textContent = 'Assistant Ready';
            break;
    }
}

function toggleVoiceOverlayMic() {
    if (!recognition) {
        alert('Speech recognition not available in this browser.');
        return;
    }

    if (isVoiceRecording) {
        // Stop listening
        try { recognition.stop(); } catch(e) {}
        isVoiceRecording = false;
        setVoiceOrbState('idle');

        const micBtn = document.getElementById('voice-modal-mic-toggle');
        micBtn.classList.remove('recording');
        document.getElementById('voice-mic-icon').textContent = '🎙️';
        document.getElementById('voice-mic-label').textContent = 'Start Listening';
    } else {
        // Start listening
        // Stop any playing TTS first
        stopVoiceOverlayAudio();

        try {
            recognition.start();
        } catch (e) {
            console.error('Recognition start failed:', e);
        }
    }
}

function stopVoiceOverlayAudio() {
    if (currentAudioPlayer) {
        currentAudioPlayer.pause();
        currentAudioPlayer = null;
    }
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }

    document.getElementById('voice-modal-audio-stop').style.display = 'none';

    // If we were in speaking state, go back to idle
    const orb = document.getElementById('voice-orb');
    if (orb.classList.contains('speaking')) {
        setVoiceOrbState('idle');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Speech Recognition (Voice Consultation Mode)
// ─────────────────────────────────────────────────────────────────────────────
function initSpeechRecognition() {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (window.SpeechRecognition) {
        recognition = new window.SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
            isVoiceRecording = true;

            if (voiceOverlayActive) {
                // Overlay mode
                setVoiceOrbState('listening');
                const micBtn = document.getElementById('voice-modal-mic-toggle');
                micBtn.classList.add('recording');
                document.getElementById('voice-mic-icon').textContent = '⏹';
                document.getElementById('voice-mic-label').textContent = 'Stop Listening';
                document.getElementById('voice-modal-transcript').textContent = 'Listening to your legal inquiry...';
                document.getElementById('voice-summary-area').style.display = 'none';
            } else {
                // Inline mode (existing behavior)
                document.getElementById('voice-listening-bar').style.display = 'flex';
                document.getElementById('voice-live-transcript').textContent = 'Listening to your legal inquiry...';
            }

            // Interrupt any playing TTS
            if (currentAudioPlayer) {
                currentAudioPlayer.pause();
                currentAudioPlayer = null;
            }
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    const finalTranscript = event.results[i][0].transcript;

                    if (voiceOverlayActive) {
                        // Overlay mode — update transcript in modal, send inquiry
                        document.getElementById('voice-modal-transcript').textContent = `"${finalTranscript}"`;
                        isVoiceRecording = false;
                        const micBtn = document.getElementById('voice-modal-mic-toggle');
                        micBtn.classList.remove('recording');
                        document.getElementById('voice-mic-icon').textContent = '🎙️';
                        document.getElementById('voice-mic-label').textContent = 'Start Listening';
                        setVoiceOrbState('thinking');
                        sendVoiceOverlayInquiry(finalTranscript);
                    } else {
                        // Inline mode (existing behavior)
                        document.getElementById('user-input').value = finalTranscript;
                        stopVoiceMode();
                        sendVoiceInquiry(finalTranscript);
                    }
                    return;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // Update interim text
            if (voiceOverlayActive) {
                document.getElementById('voice-modal-transcript').textContent = interimTranscript || 'Listening...';
            } else {
                document.getElementById('voice-live-transcript').textContent = interimTranscript || 'Listening...';
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (voiceOverlayActive) {
                isVoiceRecording = false;
                setVoiceOrbState('idle');
                const micBtn = document.getElementById('voice-modal-mic-toggle');
                micBtn.classList.remove('recording');
                document.getElementById('voice-mic-icon').textContent = '🎙️';
                document.getElementById('voice-mic-label').textContent = 'Start Listening';

                if (event.error === 'no-speech') {
                    document.getElementById('voice-modal-transcript').textContent = 'No speech detected. Tap the microphone to try again.';
                } else if (event.error === 'not-allowed') {
                    document.getElementById('voice-modal-transcript').textContent = 'Microphone access denied. Please allow microphone permissions.';
                }
            } else {
                stopVoiceMode();
            }
        };

        recognition.onend = () => {
            if (voiceOverlayActive) {
                // Only reset if we're still in listening state (not thinking/speaking)
                const orb = document.getElementById('voice-orb');
                if (orb.classList.contains('listening')) {
                    isVoiceRecording = false;
                    setVoiceOrbState('idle');
                    const micBtn = document.getElementById('voice-modal-mic-toggle');
                    micBtn.classList.remove('recording');
                    document.getElementById('voice-mic-icon').textContent = '🎙️';
                    document.getElementById('voice-mic-label').textContent = 'Start Listening';
                }
            } else {
                stopVoiceMode();
            }
        };
    }
}

function toggleVoiceMode() {
    if (!recognition) {
        alert('Speech recognition is not supported in this browser. You can type your query in English, Tamil, or Tanglish.');
        return;
    }
    if (isVoiceRecording) {
        stopVoiceMode();
    } else {
        try { recognition.start(); } catch (e) {}
    }
}

function stopVoiceMode() {
    isVoiceRecording = false;
    document.getElementById('voice-listening-bar').style.display = 'none';
    if (recognition) {
        try { recognition.stop(); } catch(e){}
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Voice Overlay Inquiry — processes voice within the modal
// ─────────────────────────────────────────────────────────────────────────────
async function sendVoiceOverlayInquiry(transcript) {
    if (!transcript || !transcript.trim()) return;

    try {
        const activeLangBtn = document.querySelector('.lang-btn.active');
        const activeLang = activeLangBtn ? activeLangBtn.dataset.lang : 'en';
        const activeJurisdiction = isTnJurisdiction ? 'Tamil Nadu' : 'Central / India';

        const res = await fetch('/api/voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: currentSessionId,
                transcript: transcript,
                language: activeLang,
                jurisdiction: activeJurisdiction
            })
        });

        if (!res.ok) {
            setVoiceOrbState('idle');
            document.getElementById('voice-summary-area').style.display = 'block';
            document.getElementById('voice-modal-response').textContent = 'Failed to process voice consultation. Please try again.';
            return;
        }

        const data = await res.json();
        const responseText = data.response || 'No response received.';

        // Show response in modal
        document.getElementById('voice-summary-area').style.display = 'block';
        document.getElementById('voice-modal-response').textContent = responseText;

        // Also add to chat history (background)
        appendMessage('user', transcript);
        appendMessage('assistant', responseText, {
            scope: data.scope,
            metrics: data.metrics,
            sources: data.source_metadata,
            query_plan: data.query_plan
        });

        // Play TTS with speaking orb state
        setVoiceOrbState('speaking');
        document.getElementById('voice-modal-audio-stop').style.display = 'inline-flex';

        const toSpeak = data.voice_summary || responseText;
        const voiceLang = data.language || activeLang;
        await playVoiceOverlayTTS(toSpeak, voiceLang);

        await loadSessions();
    } catch(e) {
        console.error('Voice overlay inquiry error:', e);
        setVoiceOrbState('idle');
        document.getElementById('voice-summary-area').style.display = 'block';
        document.getElementById('voice-modal-response').textContent = 'Error connecting to Lexora voice consultation service.';
    }
}

async function playVoiceOverlayTTS(text, lang = 'en') {
    if (currentAudioPlayer) {
        currentAudioPlayer.pause();
        currentAudioPlayer = null;
    }

    let resolvedLang = lang;
    if (!resolvedLang || resolvedLang === 'en' || resolvedLang === 'auto') {
        if (/[\u0B80-\u0BFF]/.test(text)) resolvedLang = 'ta';
        else if (/[\u0900-\u097F]/.test(text)) resolvedLang = 'hi';
        else if (!resolvedLang) resolvedLang = 'en';
    }

    try {
        const res = await fetch('/api/tts/synthesize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, language: resolvedLang })
        });
        if (!res.ok) throw new Error('TTS endpoint error');

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        currentAudioPlayer = new Audio(url);

        currentAudioPlayer.onended = () => {
            currentAudioPlayer = null;
            if (voiceOverlayActive) {
                setVoiceOrbState('idle');
                document.getElementById('voice-modal-audio-stop').style.display = 'none';
            }
        };

        currentAudioPlayer.onerror = () => {
            currentAudioPlayer = null;
            if (voiceOverlayActive) {
                setVoiceOrbState('idle');
                document.getElementById('voice-modal-audio-stop').style.display = 'none';
            }
        };

        currentAudioPlayer.play();
    } catch (e) {
        // Fallback to browser Web Speech API
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text.slice(0, 500));
            utterance.rate = 1.0;

            utterance.onend = () => {
                if (voiceOverlayActive) {
                    setVoiceOrbState('idle');
                    document.getElementById('voice-modal-audio-stop').style.display = 'none';
                }
            };

            window.speechSynthesis.speak(utterance);
        } else {
            // No TTS available — just go back to idle
            if (voiceOverlayActive) {
                setVoiceOrbState('idle');
                document.getElementById('voice-modal-audio-stop').style.display = 'none';
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline Voice Inquiry (original flow for non-overlay usage)
// ─────────────────────────────────────────────────────────────────────────────
async function sendVoiceInquiry(transcript) {
    if (!transcript || !transcript.trim()) return;

    appendMessage('user', transcript);
    showChatWorkspace();

    const loadingCard = createLoadingCard();
    document.getElementById('messages-list').appendChild(loadingCard);
    scrollToBottom();

    try {
        const activeLangBtn = document.querySelector('.lang-btn.active');
        const activeLang = activeLangBtn ? activeLangBtn.dataset.lang : 'en';
        const activeJurisdiction = isTnJurisdiction ? 'Tamil Nadu' : 'Central / India';

        const res = await fetch('/api/voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: currentSessionId,
                transcript: transcript,
                language: activeLang,
                jurisdiction: activeJurisdiction
            })
        });

        loadingCard.remove();
        if (!res.ok) {
            appendMessage('assistant', 'Failed to process voice consultation.');
            return;
        }

        const data = await res.json();
        appendMessage('assistant', data.response, {
            scope: data.scope,
            metrics: data.metrics,
            sources: data.source_metadata,
            query_plan: data.query_plan
        });

        // Automatically synthesize spoken summary for voice mode
        const toSpeak = data.voice_summary || data.response;
        const voiceLang = data.language || activeLang;
        await playTTS(toSpeak, voiceLang);

        await loadSessions();
    } catch(e) {
        loadingCard.remove();
        appendMessage('assistant', 'Error connecting to Lexora voice consultation service.');
    }
}

