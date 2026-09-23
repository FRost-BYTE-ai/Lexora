import React, { useState } from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  ShieldAlert, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface FindingItem {
  id: string;
  risk: 'high' | 'medium' | 'low';
  clauseTitle: string;
  excerpt: string;
  impact: string;
  recommendation: string;
}

interface DocumentAnalysisCardProps {
  fileName: string;
  fileSize: string;
  score?: number;
  onAskLexoraClause: (clauseTitle: string, recommendation: string) => void;
}

export const DocumentAnalysisCard: React.FC<DocumentAnalysisCardProps> = ({
  fileName,
  fileSize,
  score = 72,
  onAskLexoraClause
}) => {
  const { language } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>('high-1');

  const findings: FindingItem[] = [
    {
      id: 'high-1',
      risk: 'high',
      clauseTitle: language === 'ta' ? 'திடீர் முறிவு விதி (Termination Clause)' : 'Arbitrary Termination Clause',
      excerpt: 'Lessor may terminate this tenancy agreement without notice in event of non-compliance with oral regulations.',
      impact: language === 'ta' 
        ? 'வாடகைதாரருக்கு முன் அறிவிப்பின்றி காலி செய்ய வழிவகுக்கும், இது TNRRRLT Act 2017 சட்டப்பிரிவு 21-க்கு எதிரானது.' 
        : 'Violates Section 21 of Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act 2017. Minimum 30 days statutory notice is compulsory.',
      recommendation: language === 'ta'
        ? '30 நாட்கள் எழுத்துப்பூர்வ அறிவிப்பு மற்றும் வாடகை நீதிமன்ற உத்தரவு இன்றி வெளியேற்ற முடியாது என மாற்றப்பட வேண்டும்.'
        : 'Amend to mandate minimum 30 days formal written notice with recourse only through the competent Rent Court.'
    },
    {
      id: 'med-1',
      risk: 'medium',
      clauseTitle: language === 'ta' ? 'அதிக முன்பணம் பிடித்தம் (Security Deposit)' : 'Security Deposit Retention',
      excerpt: 'Security deposit equal to 10 months rent shall be retained non-refundable for initial 12 months.',
      impact: language === 'ta'
        ? 'சென்னை மற்றும் தமிழகத்தில் 3 மாத வாடகைக்கு மேல் முன்பணம் கோருவது சட்டவிரோதம்.'
        : 'The TNRRRLT Act strictly caps residential security deposits at a maximum of three months rent.',
      recommendation: language === 'ta'
        ? 'முன்பணத்தை 3 மாத வாடகையாக குறைத்து, காலி செய்யும்போது 15 நாட்களுக்குள் திரும்ப ஒப்படைக்கும் விதியை சேர்க்கவும்.'
        : 'Cap advance deposit to 3 months rent with a mandatory 15-day refund clause upon peaceful handover.'
    },
    {
      id: 'low-1',
      risk: 'low',
      clauseTitle: language === 'ta' ? 'அறிவிப்பு கால இடைவெளி (Notice Period)' : 'Notice Period & Renewal Terms',
      excerpt: 'Notice of vacation must be served via registered post minimum 30 days prior.',
      impact: language === 'ta'
        ? 'நிலையான நடைமுறை விதிமுறைகளுடன் ஒத்துப்போகிறது. குறைந்த அளவிலான ஆபத்து மட்டுமே.'
        : 'Complies with standard tenancy protocols under Transfer of Property Act Section 106.',
      recommendation: language === 'ta'
        ? 'மின்னஞ்சல் அல்லது வாட்ஸ்அப் மூலமும் அறிவிப்பு செல்லுபடியாகும் என சேர்த்துக் கொள்ளலாம்.'
        : 'Optionally include modern email and registered electronic notice as acceptable delivery channels.'
    }
  ];

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-[#11192C] border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden my-3">
      {/* Header & Risk Score Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              DOCUMENT ANALYSIS
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
              {fileName}
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{fileSize}</span>
          </div>
        </div>

        {/* Risk Score Pill */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Risk Score</span>
            <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
              {score} / 100
            </span>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Review Recommended
          </span>
        </div>
      </div>

      {/* Findings List (Clickable cards) */}
      <div className="p-4 sm:p-5 space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Organized Contract Findings:
        </h4>

        {findings.map((item) => {
          const isExpanded = expandedId === item.id;
          const isHigh = item.risk === 'high';
          const isMed = item.risk === 'medium';

          return (
            <div
              key={item.id}
              className={`rounded-xl border transition-all ${
                isHigh
                  ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
                  : isMed
                  ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20'
                  : 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20'
              }`}
            >
              {/* Clickable Title Row */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full p-3 sm:p-3.5 flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isHigh ? (
                    <span className="flex items-center gap-1 text-xs font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block animate-pulse" />
                      High Risk
                    </span>
                  ) : isMed ? (
                    <span className="flex items-center gap-1 text-xs font-extrabold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
                      Medium Risk
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                      Low Risk
                    </span>
                  )}
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {item.clauseTitle}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2.5">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    "{item.excerpt}"
                  </div>

                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                      Legal Impact:
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.impact}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                      Suggested Correction:
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.recommendation}
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onAskLexoraClause(item.clauseTitle, item.recommendation)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-900 text-white dark:bg-indigo-600 text-xs font-bold hover:bg-indigo-800 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Draft Counter-Clause in Lexora</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
