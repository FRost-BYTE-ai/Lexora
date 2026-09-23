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
      setSchemes(data);
      if (data.length > 0 && !activeScheme) {
        setActiveScheme(data[0]);
      }
    } catch (err) {
      console.error('Failed to load schemes:', err);
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
