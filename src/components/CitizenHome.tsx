import React, { useState, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Send, 
  CheckCircle,
  PhoneCall,
  Volume2,
  FileCheck2,
  Scale
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { startSpeechRecognition, isSpeechRecognitionSupported } from '../services/speechService';
import { LegalDomain } from '../types';
import { TamilBorderPattern, TamilEmblem } from './TamilEmblem';

interface CitizenHomeProps {
  onSendQuery: (query: string, domain?: LegalDomain) => void;
  isLoading: boolean;
  searchBoxRef?: React.RefObject<HTMLTextAreaElement | null>;
}

interface CitizenPlacard {
  id: LegalDomain;
  tamilTitle: string;
  englishTitle: string;
  deptTagTa: string;
  deptTagEn: string;
  accentColor: string;
  bannerBg: string;
  badgeBg: string;
  badgeText: string;
  emoji: string;
  keyIssuesTa: string[];
  keyIssuesEn: string[];
  primaryQuestionTa: string;
  primaryQuestionEn: string;
}

export const CitizenHome: React.FC<CitizenHomeProps> = ({
  onSendQuery,
  isLoading,
  searchBoxRef
}) => {
  const { language } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const localTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const textareaRef = searchBoxRef || localTextareaRef;

  const hasSpeechSupport = isSpeechRecognitionSupported();

  // 6 Authentic Public Service Notice Placards (Replacing generic AI-card templates)
  const placards: CitizenPlacard[] = [
    {
      id: 'crop_insurance',
      tamilTitle: 'விவசாயம் & பயிர் இழப்பீடு',
      englishTitle: 'Agriculture & Crop Loss',
      deptTagTa: 'வேளாண்மை & உழவர் நலத்துறை',
      deptTagEn: 'Dept of Agriculture & Farmers Welfare',
      accentColor: '#1B5E20',
      bannerBg: '#E8F5E9',
      badgeBg: '#C8E6C9',
      badgeText: '#1B5E20',
      emoji: '🌾',
      keyIssuesTa: [
        'மழை வெள்ளத்தால் பயிர் சேதம் — 72 மணி நேரத்திற்குள் 14447 புகார்',
        'PMFBY பயிர் காப்பீட்டு இழப்பீடு நிராகரிப்பு & DGRC மேல்முறையீடு',
        'தொடக்க வேளாண் கூட்டுறவு சங்கம் (PACS) கடன் மறுப்பு & உர மானியம்'
      ],
      keyIssuesEn: [
        'Crop damage due to rain/flood — Mandatory 72-hr reporting via 14447',
        'PMFBY crop insurance claim rejection appeal before DGRC committee',
        'PACS agricultural society loan denial and fertilizer subsidy dispute'
      ],
      primaryQuestionTa: 'PMFBY பயிர் காப்பீட்டு இழப்பீடு நிராகரிக்கப்பட்டால் DGRC குறைதீர் குழுவிடம் மேல்முறையீடு செய்வது எப்படி?',
      primaryQuestionEn: 'How to appeal before the DGRC committee against PMFBY crop insurance claim rejection?'
    },
    {
      id: 'property',
      tamilTitle: 'வீட்டு வாடகை & பட்டா நிலம்',
      englishTitle: 'House Rent & Land Title',
      deptTagTa: 'வருவாய்த்துறை & வாடகை ஒழுங்குமுறை',
      deptTagEn: 'Revenue Dept & Tenancy Authority',
      accentColor: '#8D4004',
      bannerBg: '#FBE9E7',
      badgeBg: '#FFCCBC',
      badgeText: '#8D4004',
      emoji: '🏠',
      keyIssuesTa: [
        'தமிழ்நாடு சட்டப்படி அதிகபட்சம் 3 மாத வாடகை முன்பணம் மட்டுமே (Deposit)',
        'வாடகைதாரரை திடீரென மிரட்டி அத்துமீறி காலி செய்ய தடை',
        'தாலுகா அலுவலகத்தில் பட்டா பெயர் மாற்றம் & உட்பிரிவு விண்ணப்பம்'
      ],
      keyIssuesEn: [
        'Maximum 3 months rent advance (Security Deposit) under TN Tenancy Act',
        'Legal protection against arbitrary eviction or power disconnection',
        'Application procedure for Patta name transfer at the Taluk Office'
      ],
      primaryQuestionTa: 'தமிழ்நாடு வாடகை சட்டப்படி வீட்டு உரிமையாளர் அதிகபட்சம் எத்தனை மாத முன்பணம் (Deposit) கேட்கலாம்?',
      primaryQuestionEn: 'What is the maximum security deposit a landlord can demand under Tamil Nadu Tenancy Act?'
    },
    {
      id: 'employment',
      tamilTitle: 'கூலி பாக்கி & தொழிலாளர் நலன்',
      englishTitle: 'Unpaid Wages & Labour Rights',
      deptTagTa: 'தொழிலாளர் நலத்துறை',
      deptTagEn: 'Labour & Employment Dept',
      accentColor: '#004D40',
      bannerBg: '#E0F2F1',
      badgeBg: '#B2DFDB',
      badgeText: '#004D40',
      emoji: '💼',
      keyIssuesTa: [
        'வேலை செய்த கூலியை தர மறுத்தால் தொழிலாளர் நல அதிகாரியிடம் புகார்',
        '5 ஆண்டுகள் தொடர்ந்து பணியாற்றிய தொழிலாளிக்கு Gratuity பணிக்கொடை',
        'முன்னறிவிப்பு இல்லாமல் திடீர் பணிநீக்கம் & இழப்பீடு பெறும் உரிமை'
      ],
      keyIssuesEn: [
        'Filing petition before Labour Officer for recovery of unpaid wages',
        'Gratuity eligibility and computation rules after 5 years of service',
        'Remedies against arbitrary termination without notice or severance pay'
      ],
      primaryQuestionTa: 'வேலை செய்த கூலியை முதலாளி தராமல் இழுத்தடித்தால் தொழிலாளர் நல அதிகாரியிடம் புகார் செய்வது எப்படி?',
      primaryQuestionEn: 'How to file a complaint before the Labour Officer for recovery of unpaid wages?'
    },
    {
      id: 'criminal',
      tamilTitle: 'காவல்துறை & FIR புகார்',
      englishTitle: 'Police & FIR Complaint',
      deptTagTa: 'காவல்துறை (BNSS சட்டங்கள்)',
      deptTagEn: 'Police Dept & BNSS Codes',
      accentColor: '#7A1C28',
      bannerBg: '#FFEBEE',
      badgeBg: '#FFCDD2',
      badgeText: '#7A1C28',
      emoji: '🚨',
      keyIssuesTa: [
        'காவல் நிலையத்தில் FIR போட மறுத்தால் BNSS 173(3) படி SP-யிடம் புகார்',
        'எந்த காவல் நிலையத்திலும் அவசர புகார் பதிவு செய்ய Zero FIR சட்டம்',
        'தாக்குதல் மற்றும் அச்சுறுத்தலுக்கு (BNS 115) முன் ஜாமீன் வழிகாட்டல்'
      ],
      keyIssuesEn: [
        'Remedy if police refuse FIR registration: Petition to SP under BNSS 173(3)',
        'Zero FIR right: Register immediate complaint at any police station',
        'Assault & criminal intimidation defense, anticipatory bail procedures'
      ],
      primaryQuestionTa: 'காவல் நிலையத்தில் புகார் கொடுத்தும் FIR போட மறுத்தால் BNSS சட்டப்படி என்ன நடவடிக்கை எடுக்கலாம்?',
      primaryQuestionEn: 'What legal steps to take if the police station refuses to register an FIR under BNSS?'
    },
    {
      id: 'consumer',
      tamilTitle: 'நுகர்வோர் & பண மோசடி',
      englishTitle: 'Consumer Protection & Fraud',
      deptTagTa: 'நுகர்வோர் குறைதீர் ஆணையம்',
      deptTagEn: 'Consumer Redressal Commission',
      accentColor: '#BF360C',
      bannerBg: '#FFF3E0',
      badgeBg: '#FFE0B2',
      badgeText: '#BF360C',
      emoji: '🛒',
      keyIssuesTa: [
        'வாங்கிய பொருள் பழுது / ரீஃபண்ட் மறுப்பு — E-Daakhil இலவச வழக்கு',
        'அதிக வட்டி வசூல் & மிரட்டல் — தமிழ்நாடு கந்துவட்டி தடுப்புச் சட்டம்',
        'வங்கி அல்லது இணையவழி பண மோசடி — 1930 எண்ணில் உடனடி புகார்'
      ],
      keyIssuesEn: [
        'Defective appliances or warranty refusal: File free on E-Daakhil',
        'Predatory lending: Complaint under TN Prohibition of Charging Exorbitant Interest',
        'Cyber financial loss: Dial 1930 immediately to freeze stolen funds'
      ],
      primaryQuestionTa: 'வாங்கிய எலக்ட்ரானிக்ஸ் அல்லது வாகனத்தில் பழுது இருந்து ரீஃபண்ட் தராவிட்டால் E-Daakhil மூலம் வழக்கு தொடர்வது எப்படி?',
      primaryQuestionEn: 'How to file a consumer complaint on E-Daakhil without hiring an advocate?'
    },
    {
      id: 'family',
      tamilTitle: 'குடும்பம் & ஜீவனாம்சம்',
      englishTitle: 'Family Welfare & Maintenance',
      deptTagTa: 'சமூக நலத்துறை & குடும்ப நீதிமன்றம்',
      deptTagEn: 'Social Welfare & Family Court',
      accentColor: '#4A148C',
      bannerBg: '#F3E5F5',
      badgeBg: '#E1BEE7',
      badgeText: '#4A148C',
      emoji: '👨‍👩‍👧',
      keyIssuesTa: [
        'மனைவி மற்றும் குழந்தைகளுக்கு நீதிமன்றம் மூலம் மாத ஜீவனாம்சம் (BNSS 144)',
        'பெண்கள் குடும்ப வன்முறை பாதுகாப்பு & 181 மகளிர் உதவி எண்',
        'முதியோர் பராமரிப்பு & பெற்றோர் சொத்துரிமை பாதுகாப்பு சட்டம்'
      ],
      keyIssuesEn: [
        'Claiming monthly maintenance for wife and children under Section 144 BNSS',
        'Domestic violence protection orders & 24/7 assistance via 181 helpline',
        'Parents maintenance and protection under Senior Citizens Act'
      ],
      primaryQuestionTa: 'கணவன் குடும்பத்தை கவனிக்காமல் விட்டால் மனைவி மற்றும் குழந்தைகளுக்கு நீதிமன்றத்தில் மாத ஜீவனாம்சம் பெறுவது எப்படி?',
      primaryQuestionEn: 'How to claim monthly maintenance under Section 144 BNSS for wife and children?'
    }
  ];

  // Voice Recognition Controls
  const handleToggleVoice = async () => {
    if (isListening) {
      recognitionInstance?.stop();
      setIsListening(false);
      return;
    }

    setSpeechError(null);
    setIsListening(true);

    const recognition = await startSpeechRecognition({
      language: language === 'ta' ? 'ta' : 'en',
      onResult: (transcriptText) => {
        setInputText(transcriptText);
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

  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputText.trim();
    if (!query || isLoading) return;
    if (isListening) {
      recognitionInstance?.stop();
      setIsListening(false);
    }
    onSendQuery(query);
  };

  const handleSelectPlacard = (question: string, domain: LegalDomain) => {
    setInputText(question);
    onSendQuery(question, domain);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-9 space-y-8">
      {/* 1. OFFICIAL TRUST & REASSURANCE BANNER */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EAEFF5] dark:bg-[#0E2038] border border-[#0B2545]/25 text-[#0B2545] dark:text-[#93BFE8] text-xs font-black tracking-wide shadow-2xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>
            {language === 'ta' 
              ? 'தமிழ்நாடு அரசு சட்டங்கள் & அரசாணைகளின் நேரடி வழிகாட்டல்'
              : 'Direct Guidance from Tamil Nadu Government Acts & Official Gazettes'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-[#0B2545] dark:text-white tracking-tight leading-snug font-sans">
          {language === 'ta' 
            ? 'உங்கள் சட்டப் பிரச்சனையை சொல்லுங்கள், எளிய தமிழில் தீர்வு தருகிறோம்' 
            : 'Explain your legal problem in plain words, we provide clear guidance'}
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-700 dark:text-slate-300 font-medium">
          {language === 'ta'
            ? 'விவசாயம், வீட்டு வாடகை, கூலி பாக்கி, நிலப் பட்டா அல்லது காவல் புகார் — வழக்கறிஞர் கட்டணம் இன்றி எளிய தமிழில் பேசி அல்லது தட்டச்சு செய்து வழிகாட்டல் பெறலாம்.'
            : 'Get clear, statutory legal guidance for tenant rights, crop loss, unpaid wages, police FIR, or land records.'}
        </p>

        {/* Real Official Trust Markers */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-1 text-xs text-slate-600 dark:text-slate-400 font-bold">
          <span className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            {language === 'ta' ? 'தமிழ்நாடு அரசு சட்டங்களின்படி சரிபார்க்கப்பட்டது' : 'Sourced from TN Govt Acts'}
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            {language === 'ta' ? 'சென்னை உயர்நீதிமன்ற தீர்ப்புகள்' : 'Madras High Court Rules'}
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            {language === 'ta' ? 'முற்றிலும் இலவச மக்கள் சேவை' : '100% Free Public Service'}
          </span>
        </div>
      </div>

      {/* 2. RADICAL SIMPLICITY: DOMINANT DUAL-INPUT ACTION BOX (MIC AS PROMINENT AS TEXT FIELD) */}
      <div className="bg-white dark:bg-[#0F1E33] rounded-3xl border-3 border-[#0B2545] dark:border-[#1E3A60] shadow-md overflow-hidden">
        {/* Official Header Strip on Input Card */}
        <div className="bg-[#0B2545] text-white px-5 py-2.5 flex items-center justify-between border-b-2 border-[#B87314]">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-extrabold tracking-wide">
              {language === 'ta' ? 'சட்ட உதவி மையம் · உடனடி வினா அரங்கம்' : 'Legal Help Counter · Instant Inquiry'}
            </span>
          </div>
          <span className="text-[11px] text-amber-300 font-bold">
            {language === 'ta' ? 'பேசலாம் அல்லது எழுதலாம்' : 'Voice or Text'}
          </span>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* EQUALLY PROMINENT OPTION 1: VOICE INPUT (GIANT MIC FOR LOW-LITERACY & ELDERS) */}
          <div className="bg-[#FAF7EE] dark:bg-[#081527] p-4 sm:p-5 rounded-2xl border-2 border-amber-600/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center md:text-left">
              {/* Giant Pulsating Mic Button */}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex-shrink-0 flex items-center justify-center transition-all shadow-md cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse ring-6 ring-rose-300'
                    : 'bg-[#7A1C28] hover:bg-[#5C141F] text-white'
                }`}
                title={language === 'ta' ? 'மைக் தொட்டு தமிழில் பேசவும்' : 'Tap to speak'}
              >
                {isListening ? (
                  <Square className="w-8 h-8 fill-white" />
                ) : (
                  <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300" />
                )}
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <h2 className="text-base sm:text-lg font-black text-[#0B2545] dark:text-white">
                    {isListening
                      ? (language === 'ta' ? '🎙️ உங்கள் குரலை பதிவு செய்கிறோம்...' : '🎙️ Recording your voice...')
                      : (language === 'ta' ? '1. தமிழில் பேசி கேள்வி கேட்கலாம்' : '1. Speak Your Question in Voice')}
                  </h2>
                  {isListening && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {isListening
                    ? (language === 'ta' ? 'பேசி முடித்தவுடன் மீண்டும் இந்த பட்டனை அழுத்தவும்.' : 'Tap button again when you finish speaking.')
                    : (language === 'ta' ? 'எழுதத் தெரியாவிட்டாலும் பரவாயில்லை! மைக் பட்டனைத் தொட்டு உங்கள் பிரச்சனையை இயல்பாகப் பேசுங்கள்.' : 'No typing needed. Just tap the big mic button and explain your problem naturally.')}
                </p>
              </div>
            </div>

            {/* Quick Trigger Button */}
            {hasSpeechSupport ? (
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`w-full md:w-auto px-6 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                  isListening
                    ? 'bg-rose-700 hover:bg-rose-800 text-white ring-4 ring-rose-200 animate-pulse'
                    : 'bg-[#7A1C28] hover:bg-[#5C141F] text-white'
                }`}
              >
                {isListening ? (
                  <>
                    <Square className="w-4 h-4 fill-white" />
                    <span>{language === 'ta' ? '⏹️ பேசி முடிந்தது (நிறுத்து)' : '⏹️ Stop Speaking'}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-amber-300" />
                    <span>{language === 'ta' ? '🎙️ மைக் தொட்டு பேசவும்' : '🎙️ Tap to Speak'}</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-xs text-slate-400">
                {language === 'ta' ? 'குரல் உள்ளீடு ஆதரிக்கப்படவில்லை' : 'Voice not supported in this browser'}
              </span>
            )}
          </div>

          {speechError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
              ⚠️ {speechError}
            </div>
          )}

          {/* EQUALLY PROMINENT OPTION 2: TEXTAREA WITH DIRECT ACTION BUTTON */}
          <form onSubmit={handleFormSubmit} className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="citizen-query-input" className="text-xs sm:text-sm font-black text-[#0B2545] dark:text-white">
                {language === 'ta' ? '2. அல்லது உங்கள் கேள்வியை இங்கு எழுதலாம்:' : '2. Or type your legal question here:'}
              </label>
              {inputText.length > 0 && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="text-xs text-slate-500 hover:text-rose-600 underline font-semibold cursor-pointer"
                >
                  {language === 'ta' ? 'அழிக்க (Clear)' : 'Clear'}
                </button>
              )}
            </div>

            <textarea
              id="citizen-query-input"
              ref={textareaRef}
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                language === 'ta'
                  ? 'உங்கள் சட்டப் பிரச்சனையை இங்கு விரிவாக எழுதவும் (எ.கா: வாடகை முன்பணம் 3 மாதத்திற்கு மேல் கேட்கலாமா? அல்லது PMFBY பயிர் காப்பீட்டு இழப்பீடு நிராகரிக்கப்பட்டால் என்ன செய்வது?)...'
                  : 'Type your legal problem here (e.g.: Can a landlord demand more than 3 months deposit under TN Tenancy Act? Or how to appeal if PMFBY crop claim is denied?)...'
              }
              className="w-full p-4 rounded-2xl bg-[#FCFBF7] dark:bg-[#071324] border-2 border-slate-300 dark:border-slate-700 text-[#0B2545] dark:text-white placeholder-slate-400 text-base sm:text-lg focus:outline-none focus:border-[#0B2545] dark:focus:border-amber-400 leading-relaxed resize-none shadow-inner"
            />

            {/* Primary Action Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {language === 'ta' 
                    ? '🔒 100% இலவச மக்கள் சேவை · வழக்கறிஞர் கட்டணம் இல்லை' 
                    : '🔒 100% confidential public guidance · Zero fees'}
                </span>
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0B2545] hover:bg-[#133863] text-white font-black text-base flex items-center justify-center gap-2.5 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{language === 'ta' ? 'சட்ட விளக்கம் பெறப்படுகிறது...' : 'Retrieving statutory guidance...'}</span>
                  </>
                ) : (
                  <>
                    <span>{language === 'ta' ? '⚖️ சட்ட விளக்கம் & வழிகாட்டல் பெறுக' : '⚖️ Get Legal Guidance'}</span>
                    <Send className="w-4 h-4 text-amber-400" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 3. VISUAL-FIRST NAVIGATION: 6 AUTHENTIC PUBLIC SERVICE NOTICE PLACARDS (NO ICON-IN-CIRCLE AI SLOP) */}
      <div className="space-y-4 pt-1">
        <div className="border-b-2 border-slate-300 dark:border-slate-700 pb-2">
          <h2 className="text-xl sm:text-2xl font-black text-[#0B2545] dark:text-white">
            {language === 'ta' ? 'உங்களுக்கு என்ன உதவி வேண்டும்? (முக்கிய தலைப்புகள்)' : 'What Do You Need Help With? (Key Services)'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            {language === 'ta' 
              ? 'கீழே உள்ள அரசு உதவி அட்டைகளில் ஏதேனும் ஒன்றைத் தொட்டு உடனடி சட்ட வழிகாட்டல் பெறலாம்:' 
              : 'Tap any official notice card below to receive immediate statutory advice:'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {placards.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#0E1E33] rounded-2xl border-2 border-slate-300 dark:border-slate-700/80 hover:border-[#0B2545] dark:hover:border-amber-400 transition-all flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-md"
            >
              {/* Placard Department Header */}
              <div 
                className="px-4 py-2.5 flex items-center justify-between border-b"
                style={{ backgroundColor: item.bannerBg, borderColor: `${item.accentColor}30` }}
              >
                <span 
                  className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-md"
                  style={{ backgroundColor: item.badgeBg, color: item.badgeText }}
                >
                  {language === 'ta' ? item.deptTagTa : item.deptTagEn}
                </span>
                <span className="text-2xl select-none" aria-hidden="true">
                  {item.emoji}
                </span>
              </div>

              {/* Placard Title & Specific Citizen Issues */}
              <div className="p-4 sm:p-5 space-y-3 flex-1">
                <h3 
                  className="text-lg font-black leading-snug"
                  style={{ color: item.accentColor }}
                >
                  {language === 'ta' ? item.tamilTitle : item.englishTitle}
                </h3>

                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {(language === 'ta' ? item.keyIssuesTa : item.keyIssuesEn).map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-snug">
                      <span className="text-amber-700 dark:text-amber-400 font-black">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Direct Government-Action Button at the Bottom */}
              <div className="p-3 bg-[#FAF8F5] dark:bg-[#071324] border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSelectPlacard(
                    language === 'ta' ? item.primaryQuestionTa : item.primaryQuestionEn,
                    item.id
                  )}
                  className="w-full py-2.5 px-3 rounded-xl font-black text-xs text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer hover:opacity-95"
                  style={{ backgroundColor: item.accentColor }}
                >
                  <span>{item.emoji}</span>
                  <span>{language === 'ta' ? 'இதைப்பற்றி விளக்கம் பெற' : 'Get Guidance on This'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. EMERGENCY TOLL-FREE HELPLINE DIRECTORY (PHYSICAL KIOSK DIALING) */}
      <div className="bg-[#FAF7EE] dark:bg-[#0A1626] rounded-2xl border-2 border-amber-600/30 p-4 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-amber-800 dark:text-amber-400" />
          <h2 className="text-sm sm:text-base font-black text-[#0B2545] dark:text-white">
            {language === 'ta' 
              ? 'அரசு அவசர உதவி எண்கள் (கட்டணமில்லா தொலைபேசி - Toll-Free)' 
              : 'Official Tamil Nadu & Central Helplines (Toll-Free)'}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-center">
          <a 
            href="tel:112"
            className="p-3 rounded-xl bg-white dark:bg-[#0F1E33] border border-slate-300 dark:border-slate-700 hover:border-rose-600 transition-colors shadow-2xs block"
          >
            <span className="block text-lg font-black text-rose-700 dark:text-rose-400">112</span>
            <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
              {language === 'ta' ? 'காவல்துறை' : 'Police'}
            </span>
          </a>

          <a 
            href="tel:181"
            className="p-3 rounded-xl bg-white dark:bg-[#0F1E33] border border-slate-300 dark:border-slate-700 hover:border-purple-600 transition-colors shadow-2xs block"
          >
            <span className="block text-lg font-black text-purple-700 dark:text-purple-400">181</span>
            <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
              {language === 'ta' ? 'மகளிர் உதவி' : 'Women Aid'}
            </span>
          </a>

          <a 
            href="tel:14447"
            className="p-3 rounded-xl bg-white dark:bg-[#0F1E33] border border-slate-300 dark:border-slate-700 hover:border-emerald-600 transition-colors shadow-2xs block"
          >
            <span className="block text-lg font-black text-emerald-700 dark:text-emerald-400">14447</span>
            <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
              {language === 'ta' ? 'பயிர் காப்பீடு' : 'PMFBY'}
            </span>
          </a>

          <a 
            href="tel:1915"
            className="p-3 rounded-xl bg-white dark:bg-[#0F1E33] border border-slate-300 dark:border-slate-700 hover:border-amber-600 transition-colors shadow-2xs block"
          >
            <span className="block text-lg font-black text-amber-700 dark:text-amber-400">1915</span>
            <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
              {language === 'ta' ? 'நுகர்வோர்' : 'Consumer'}
            </span>
          </a>

          <a 
            href="tel:1551"
            className="p-3 rounded-xl bg-white dark:bg-[#0F1E33] border border-slate-300 dark:border-slate-700 hover:border-teal-600 transition-colors shadow-2xs block"
          >
            <span className="block text-lg font-black text-teal-700 dark:text-teal-400">1551</span>
            <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
              {language === 'ta' ? 'உழவர் மையம்' : 'Kisan Kisan'}
            </span>
          </a>

          <a 
            href="tel:15100"
            className="p-3 rounded-xl bg-white dark:bg-[#0F1E33] border border-slate-300 dark:border-slate-700 hover:border-blue-700 transition-colors shadow-2xs block"
          >
            <span className="block text-lg font-black text-blue-800 dark:text-blue-400">15100</span>
            <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
              {language === 'ta' ? 'இலவச சட்ட உதவி' : 'Legal Aid'}
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};
