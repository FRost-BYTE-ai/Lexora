import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Award, 
  ExternalLink, 
  FileCheck2, 
  ShieldCheck, 
  HelpCircle, 
  Landmark, 
  ChevronRight,
  Filter,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { GovernmentScheme } from '../types';
import { fetchGovernmentSchemesApi } from '../services/legalApiService';
import { useLanguage } from '../context/LanguageContext';

interface GovernmentSchemesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskAboutScheme: (query: string) => void;
}

const FALLBACK_SCHEMES: GovernmentScheme[] = [
  {
    id: 'pmfby-crop-insurance',
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    nameTamil: 'பிரதம மந்திரி பயிர் காப்பீட்டுத் திட்டம் (PMFBY)',
    category: 'Insurance',
    eligibility: 'All farmers growing notified crops in notified areas (loanee and non-loanee farmers, sharecroppers and tenant farmers eligible).',
    eligibilityTamil: 'அறிவிக்கப்பட்ட பகுதிகளில் அறிவிக்கப்பட்ட பயிர்களை சாகுபடி செய்யும் அனைத்து விவசாயிகள் (கடன் பெற்றோர் மற்றும் பெறாதோர், குத்தகை விவசாயிகள் உட்பட).',
    requiredDocuments: [
      'Aadhaar Card',
      'Land Ownership Record (Patta / Chitta / Revenue Adangal)',
      'Village Administrative Officer (VAO) Sowing Certificate',
      'Bank Passbook photocopy showing IFSC & Account No',
      'Tenant Agreement / Self-declaration (for tenant farmers)'
    ],
    requiredDocumentsTamil: [
      'ஆதார் அட்டை',
      'பட்டா / சிட்டா மற்றும் நடப்பு பசலி அடங்கல் நகல்',
      'கிராம நிர்வாக அலுவலர் (VAO) வழங்கிய பயிர் சாகுபடி சான்று',
      'வங்கி கணக்கு புத்தக நகல் (IFSC & கணக்கு எண் தெளிவாக)',
      'குத்தகை ஒப்பந்தம் / சுய பிரகடனம்'
    ],
    applicationProcess: 'Enroll via nearest Primary Agricultural Credit Society (PACS), National Crop Insurance Portal (pmfby.gov.in), Common Service Centre (CSC), or commercial bank before statutory cut-off dates.',
    applicationProcessTamil: 'அருகிலுள்ள தொடக்க வேளாண் கூட்டுறவு சங்கம் (PACS), e-Sevai / CSC மையம் அல்லது pmfby.gov.in மூலம் காலக்கெடுவிற்குள் பதிவு செய்யவும்.',
    relevantAuthority: 'District Grievance Redressal Committee (DGRC) headed by District Collector • Joint Director of Agriculture',
    relevantAuthorityTamil: 'மாவட்ட ஆட்சித்தலைவர் தலைமையிலான குறைதீர் குழு • வேளாண்மை இணை இயக்குநர்',
    officialSource: 'Ministry of Agriculture & Farmers Welfare, Govt of India & Department of Agriculture, Govt of Tamil Nadu',
    portalUrl: 'https://pmfby.gov.in/',
    keyBenefits: 'Premium capped at 2% for Kharif crops, 1.5% for Rabi food & oilseed crops, and 5% for commercial/horticultural crops; remaining premium shared equally by Central and State Governments.',
    keyBenefitsTamil: 'காரிப் பயிர்களுக்கு 2%, ரபி உணவுப் பயிர்களுக்கு 1.5%, வணிகப் பயிர்களுக்கு 5% மட்டுமே குறைந்த பிரீமியம். மீதி பிரீமியத்தை அரசே செலுத்துகிறது. மகசூல் இழப்பிற்கு முழு இழப்பீடு.',
    schemeStatus: 'Active'
  },
  {
    id: 'kcc-interest-subvention',
    name: 'Kisan Credit Card (KCC) & Modified Interest Subvention Scheme (MISS)',
    nameTamil: 'கிசான் கடன் அட்டை (KCC) & வட்டி மானியத் திட்டம்',
    category: 'Credit',
    eligibility: 'Individual/joint farmers, owner cultivators, tenant farmers, oral lessees, sharecroppers, and SHGs/JLGs engaged in agriculture, animal husbandry, or fisheries.',
    eligibilityTamil: 'சொந்த நிலம் வைத்துள்ள விவசாயிகள், குத்தகை விவசாயிகள், பங்கு சாகுபடியாளர்கள், கால்நடை மற்றும் மீன்வள விவசாயிகள்.',
    requiredDocuments: [
      'Duly completed KCC application form',
      'Identity & Address Proof (Aadhaar / Voter ID)',
      'Land Records (Patta, Chitta, Adangal copy)',
      'Crop cultivation plan / cropping pattern certificate'
    ],
    requiredDocumentsTamil: [
      'பூர்த்தி செய்யப்பட்ட KCC விண்ணப்பப் படிவம்',
      'அடையாள அட்டை (ஆதார் / வாக்காளர் அட்டை)',
      'நில ஆவணங்கள் (பட்டா, சிட்டா, நடப்பு அடங்கல் நகல்)',
      'பயிர் சாகுபடி திட்டம்'
    ],
    applicationProcess: 'Apply at the village Primary Agricultural Credit Society (PACS), District Central Cooperative Bank (DCCB) branch, or online through the JanSamarth portal.',
    applicationProcessTamil: 'கிராம தொடக்க வேளாண் கூட்டுறவு சங்கம் (PACS) அல்லது மாவட்ட மத்திய கூட்டுறவு வங்கி (DCCB) கிளையில் விண்ணப்பிக்கலாம்.',
    relevantAuthority: 'Primary Agricultural Credit Society (PACS) Management • District Central Cooperative Bank (DCCB)',
    relevantAuthorityTamil: 'தொடக்க வேளாண் கூட்டுறவு சங்கம் (PACS) • மாவட்ட மத்திய கூட்டுறவு வங்கி (DCCB)',
    officialSource: 'Reserve Bank of India (RBI) & NABARD Rural Credit Division',
    portalUrl: 'https://www.jansamarth.in/',
    keyBenefits: 'Short-term crop credit up to ₹3,00,000 at a benchmark 7% interest per annum. Prompt Repaying Farmers receive an additional 3% prompt repayment subvention (PRIS), reducing the effective interest rate to just 4% per annum (zero interest in select Tamil Nadu cooperative schemes).',
    keyBenefitsTamil: 'ரூ. 3 லட்சம் வரை குறுகிய கால பயிர்க்கடன் 7% வட்டியில். உரிய தவணையில் திருப்பிச் செலுத்துவோருக்கு 3% ஊக்கத்தொகை கழிவு செய்யப்பட்டு வெறும் 4% வட்டியில் (தமிழ்நாடு கூட்டுறவில் வட்டி இல்லாக் கடன்).',
    schemeStatus: 'Active'
  },
  {
    id: 'computerization-of-pacs',
    name: 'Centrally Sponsored Project for Computerization of PACS',
    nameTamil: 'தொடக்க வேளாண் கூட்டுறவு சங்கங்கள் (PACS) கணினிமயமாக்கல் திட்டம்',
    category: 'Cooperative',
    eligibility: 'All functional Primary Agricultural Credit Societies across India onboarded into the national ERP system.',
    eligibilityTamil: 'அனைத்து செயல்பாட்டில் உள்ள தொடக்க வேளாண் கூட்டுறவு சங்கங்கள் (PACS).',
    requiredDocuments: [
      'Society Registration Certificate under State Cooperative Act',
      'Approved Society By-laws & Member Register',
      'Audited Financial Statements (Last 3 years)'
    ],
    requiredDocumentsTamil: [
      'கூட்டுறவு சங்க பதிவுச் சான்றிதழ்',
      'உறுப்பினர் பதிவேடு மற்றும் சங்க துணை விதிகள் நகல்',
      'கடந்த 3 ஆண்டுகளுக்கான தணிக்கை அறிக்கை'
    ],
    applicationProcess: 'Implemented directly through the State Registrar of Cooperative Societies, NABARD, and Ministry of Cooperation via state-level implementation committees.',
    applicationProcessTamil: 'மத்திய கூட்டுறவு அமைச்சகம், நபார்டு மற்றும் தமிழ்நாடு கூட்டுறவு சங்கங்களின் பதிவாளர் மூலம் நேரடியாக செயல்படுத்தப்படுகிறது.',
    relevantAuthority: 'Ministry of Cooperation, GoI • Registrar of Co-operative Societies, Tamil Nadu',
    relevantAuthorityTamil: 'மத்திய கூட்டுறவு அமைச்சகம் • தமிழ்நாடு கூட்டுறவு சங்கங்களின் பதிவாளர்',
    officialSource: 'Ministry of Cooperation, Government of India',
    portalUrl: 'https://cooperation.gov.in/',
    keyBenefits: 'Standardizes PACS operations on cloud ERP, integrates PACS with DCCBs, eliminates fake ledger entries, and allows PACS to deliver CSC services, fertilizer sales, and PDS transactions seamlessly.',
    keyBenefitsTamil: 'ஒற்றை கிளவுட் மென்பொருள் மூலம் நேரடி கணினிமயமாக்கல், முறைகேடுகள் தவிர்ப்பு, CSC இணையவழி சேவைகள் மற்றும் வெளிப்படையான கடன் பரிவர்த்தனை.',
    schemeStatus: 'Updated Guidelines 2024-25'
  },
  {
    id: 'model-bylaws-multipurpose-pacs',
    name: 'Model By-laws for Multipurpose PACS & Diversified Services',
    nameTamil: 'பல்நோக்கு தொடக்க வேளாண் கூட்டுறவு சங்கங்களுக்கான மாதிரி துணை விதிகள்',
    category: 'Cooperative',
    eligibility: 'PACS adopting the Ministry of Cooperation Model By-laws by resolution of their General Body.',
    eligibilityTamil: 'பொதுக்குழு தீர்மானம் மூலம் மாதிரி துணை விதிகளை ஏற்றுக்கொள்ளும் அனைத்து தொடக்க வேளாண் கூட்டுறவு சங்கங்கள்.',
    requiredDocuments: [
      'General Body Meeting Resolution adopting Model By-laws',
      'Submission to Circle Deputy Registrar of Cooperative Societies (DRCS)'
    ],
    requiredDocumentsTamil: [
      'மாதிரி துணை விதிகளை ஏற்பதற்கான பொதுக்குழுக் கூட்டத் தீர்மானம்',
      'வட்ட துணைப் பதிவாளரிடம் சமர்ப்பிப்பு படிவம்'
    ],
    applicationProcess: 'PACS convenes a Special or Annual General Body meeting with statutory quorum, approves the adoption of 25+ diversified business domains, and registers amendments with the Circle Deputy Registrar.',
    applicationProcessTamil: 'சங்கத்தின் பொதுக்குழுவில் தீர்மானம் நிறைவேற்றி, வட்ட துணைப் பதிவாளரிடம் (DRCS) பதிவு செய்ய வேண்டும். இதன் மூலம் உரம் விற்பனை, வாடகை இயந்திர மையம், CSC சேவை உள்ளிட்ட 25-க்கும் மேற்பட்ட வணிகங்களை தொடங்கலாம்.',
    relevantAuthority: 'Circle Deputy Registrar of Co-operative Societies (DRCS) • Joint Registrar (District)',
    relevantAuthorityTamil: 'வட்ட கூட்டுறவு துணைப் பதிவாளர் (DRCS) • மாவட்ட கூட்டுறவு இணைப் பதிவாளர்',
    officialSource: 'Ministry of Cooperation & Tamil Nadu Co-operative Department',
    portalUrl: 'https://cooperation.gov.in/model-by-laws',
    keyBenefits: 'Enables PACS to diversify beyond crop loans into community service centers (CSC), custom hiring centers for farm machinery, cold storage, retail fuel outlets, dairy, and national seed/organic marketing.',
    keyBenefitsTamil: 'பயிர்க்கடன் மட்டுமின்றி உழவு இயந்திர வாடகை மையம், பெட்ரோல்/டீசல் பங்க், பால் பண்ணை, விதை உற்பத்தி மற்றும் சி.எஸ்.சி இணைய சேவைகள் வழங்கும் அதிகாரமளித்தல்.',
    schemeStatus: 'Active'
  },
  {
    id: 'agriculture-infrastructure-fund',
    name: 'Agriculture Infrastructure Fund (AIF) for Cooperatives & Farmers',
    nameTamil: 'வேளாண் உட்கட்டமைப்பு நிதி (AIF) - கூட்டுறவு சங்கங்களுக்கான திட்டம்',
    category: 'Storage & Infra',
    eligibility: 'Primary Agricultural Credit Societies (PACS), Marketing Cooperative Societies, Farmer Producer Organizations (FPOs), Self Help Groups, and individual agri-entrepreneurs.',
    eligibilityTamil: 'தொடக்க வேளாண் கூட்டுறவு சங்கங்கள் (PACS), உழவர் உற்பத்தியாளர் நிறுவனங்கள் (FPO), சுயஉதவிக் குழுக்கள் மற்றும் விவசாய தொழில்முனைவோர்.',
    requiredDocuments: [
      'Detailed Project Report (DPR) for post-harvest infrastructure or godown',
      'Land ownership or long-term lease deed (minimum 10-15 years)',
      'Registration Certificate & Audited Financials of PACS / Applicant'
    ],
    requiredDocumentsTamil: [
      'கிடங்கு அல்லது அறுவடை பின்செய் உட்கட்டமைப்பு விரிவான திட்ட அறிக்கை (DPR)',
      'நில உரிமைப் பத்திரம் அல்லது நீண்ட கால குத்தகை ஒப்பந்தம்',
      'பதிவுச் சான்றிதழ் மற்றும் தணிக்கை அறிக்கை'
    ],
    applicationProcess: 'Apply online through the Agri Infra Fund portal (agriinfra.dac.gov.in) with bank project appraisal and collateral backing.',
    applicationProcessTamil: 'agriinfra.dac.gov.in இணையதளம் மூலமாக வங்கி திட்ட மதிப்பீட்டுடன் விண்ணப்பிக்கலாம்.',
    relevantAuthority: 'National Bank for Agriculture and Rural Development (NABARD) • Ministry of Agriculture, GoI',
    relevantAuthorityTamil: 'நபார்டு (NABARD) • மத்திய வேளாண் அமைச்சகம்',
    officialSource: 'Agri Infra Fund, Ministry of Agriculture & Farmers Welfare',
    portalUrl: 'https://agriinfra.dac.gov.in/',
    keyBenefits: 'Interest subvention of 3% per annum up to ₹2 crore for loans disbursed for post-harvest infrastructure projects such as cold storage, godowns, sorting/grading units, and PACS primary processing centers.',
    keyBenefitsTamil: 'ரூ. 2 கோடி வரை குளிர்சாதன கிடங்கு, சேமிப்புக் கிடங்கு மற்றும் பதப்படுத்தும் நிலையங்கள் அமைக்க ஆண்டுக்கு 3% வட்டி மானியம்.',
    schemeStatus: 'Active'
  }
];

export const GovernmentSchemesModal: React.FC<GovernmentSchemesModalProps> = ({
  isOpen,
  onClose,
  onAskAboutScheme
}) => {
  const { t, language } = useLanguage();
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeScheme, setActiveScheme] = useState<GovernmentScheme | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSchemes();
    }
  }, [isOpen, selectedCategory]);

  const loadSchemes = async () => {
    setIsLoading(true);
    try {
      const data = await fetchGovernmentSchemesApi({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: searchTerm || undefined
      });
      if (data && data.length > 0) {
        setSchemes(data);
        if (!activeScheme) setActiveScheme(data[0]);
      } else {
        // Fallback to local static schemes filtered
        let filtered = [...FALLBACK_SCHEMES];
        if (selectedCategory !== 'All') {
          filtered = filtered.filter(s => s.category.toLowerCase() === selectedCategory.toLowerCase());
        }
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.nameTamil.toLowerCase().includes(q));
        }
        setSchemes(filtered);
        if (filtered.length > 0 && !activeScheme) setActiveScheme(filtered[0]);
      }
    } catch (err) {
      console.warn('Failed to fetch remote schemes, using fallback:', err);
      let filtered = [...FALLBACK_SCHEMES];
      if (selectedCategory !== 'All') {
        filtered = filtered.filter(s => s.category.toLowerCase() === selectedCategory.toLowerCase());
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.nameTamil.toLowerCase().includes(q));
      }
      setSchemes(filtered);
      if (filtered.length > 0 && !activeScheme) setActiveScheme(filtered[0]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSchemes();
  };

  if (!isOpen) return null;

  const categories = [
    { id: 'All', label: language === 'ta' ? 'அனைத்து திட்டங்கள்' : language === 'hi' ? 'सभी योजनाएं' : 'All Schemes' },
    { id: 'Insurance', label: language === 'ta' ? 'பயிர் காப்பீடு (PMFBY)' : language === 'hi' ? 'फसल बीमा (PMFBY)' : 'Crop Insurance (PMFBY)' },
    { id: 'Credit', label: language === 'ta' ? 'வட்டி மானியம் & KCC' : language === 'hi' ? 'ब्याज सब्सिडी और केसीसी' : 'Credit & Subvention' },
    { id: 'Cooperative', label: language === 'ta' ? 'கூட்டுறவு & PACS' : language === 'hi' ? 'सहकारी और पैक्स' : 'Cooperative & PACS' },
    { id: 'Storage & Infra', label: language === 'ta' ? 'உட்கட்டமைப்பு நிதி (AIF)' : language === 'hi' ? 'बुनियादी ढांचा कोष (AIF)' : 'Storage & Infra (AIF)' }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schemes-modal-title"
    >
      <div 
        className="w-full max-w-5xl bg-white dark:bg-[#0E1526] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
        id="government-schemes-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 id="schemes-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {language === 'ta' ? 'அரசு திட்டங்கள் & மானிய வழிகாட்டி' : 
                 language === 'hi' ? 'सरकारी योजनाएं एवं सब्सिडी निर्देशिका' : 
                 'Government Schemes & Subsidies Directory'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'ta' ? 'விவசாயிகள், கூட்டுறவு சங்கங்கள் மற்றும் கிராமப்புற குடிமக்களுக்கான அங்கீகரிக்கப்பட்ட திட்டங்கள்' :
                 language === 'hi' ? 'किसानों, प्राथमिक सहकारी समितियों और ग्रामीण नागरिकों हेतु सत्यापित योजनाएं' :
                 'Statutory agricultural, PACS cooperative, crop insurance & subsidy entitlements'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-white dark:bg-[#0E1526]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'ta' ? 'திட்டம் அல்லது தகுதி தேடவும்...' : 'Search schemes, benefits...'}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-slate-100"
              />
            </form>
          </div>
        </div>

        {/* Modal Body: Split view (List on left, details on right) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
          {/* Schemes List Column */}
          <div className="md:col-span-5 border-r border-slate-100 dark:border-slate-800/80 overflow-y-auto p-3 space-y-2">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading schemes directory...
              </div>
            ) : schemes.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No matching schemes found.
              </div>
            ) : (
              schemes.map((s) => {
                const isSelected = activeScheme?.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveScheme(s)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-xs'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {s.category}
                      </span>
                      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {s.schemeStatus}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {language === 'ta' && s.nameTamil ? s.nameTamil : s.name}
                    </h3>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {language === 'ta' && s.keyBenefitsTamil ? s.keyBenefitsTamil : s.keyBenefits}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* Scheme Detail Column */}
          <div className="md:col-span-7 overflow-y-auto p-5 space-y-5 bg-slate-50/40 dark:bg-slate-900/20">
            {activeScheme ? (
              <div className="space-y-4">
                {/* Title & Ask Action */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                      {activeScheme.category}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {activeScheme.officialSource}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {activeScheme.name}
                  </h3>
                  {activeScheme.nameTamil && (
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mt-0.5">
                      {activeScheme.nameTamil}
                    </p>
                  )}
                </div>

                {/* Key Benefits Card */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-900 dark:text-slate-100">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    {language === 'ta' ? 'முக்கிய பலன்கள் மற்றும் நிதி உதவி' : 'Key Statutory Benefits & Financial Provisions'}
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {language === 'ta' && activeScheme.keyBenefitsTamil ? activeScheme.keyBenefitsTamil : activeScheme.keyBenefits}
                  </p>
                </div>

                {/* Eligibility */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    {language === 'ta' ? 'தகுதி வரம்பு' : 'Eligibility Criteria'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    {language === 'ta' && activeScheme.eligibilityTamil ? activeScheme.eligibilityTamil : activeScheme.eligibility}
                  </p>
                </div>

                {/* Required Documents Checklist */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-indigo-600" />
                    {language === 'ta' ? 'தேவையான ஆவணங்கள்' : 'Required Documents Checklist'}
                  </h4>
                  <ul className="space-y-1.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                    {(language === 'ta' && activeScheme.requiredDocumentsTamil?.length ? activeScheme.requiredDocumentsTamil : activeScheme.requiredDocuments).map((doc, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Application Process & Authority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'ta' ? 'விண்ணப்பிக்கும் முறை' : 'Application Process'}
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      {language === 'ta' && activeScheme.applicationProcessTamil ? activeScheme.applicationProcessTamil : activeScheme.applicationProcess}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'ta' ? 'குறைதீர் / தொடர்பு அதிகாரி' : 'Redressal & Authority'}
                    </span>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                      {language === 'ta' && activeScheme.relevantAuthorityTamil ? activeScheme.relevantAuthorityTamil : activeScheme.relevantAuthority}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  {activeScheme.portalUrl && (
                    <a
                      href={activeScheme.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 hover:underline font-medium"
                    >
                      <span>Official Scheme Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const queryText = language === 'ta' 
                        ? `${activeScheme.nameTamil || activeScheme.name} திட்டத்தின் தகுதி, பிரீமியம் மற்றும் விண்ணப்பிக்கும் நடைமுறையை விளக்குங்கள்`
                        : `Explain eligibility, documents, and application procedure for ${activeScheme.name}`;
                      onAskAboutScheme(queryText);
                      onClose();
                    }}
                    className="px-4 py-2 bg-indigo-950 dark:bg-indigo-600 hover:bg-indigo-900 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>{language === 'ta' ? 'இத்திட்டம் பற்றி லெக்சோராவிடம் கேளுங்கள்' : 'Ask Lexora About This Scheme'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-slate-400">
                Select a scheme from the list to view its official guidelines and documents.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
