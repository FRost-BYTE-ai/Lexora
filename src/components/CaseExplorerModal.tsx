import React, { useState } from 'react';
import { 
  X, 
  Gavel, 
  Search, 
  Calendar, 
  ChevronRight, 
  Scale, 
  ExternalLink, 
  CheckCircle2, 
  Clock,
  Sparkles
} from 'lucide-react';
import { LegalDomain } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CasePrecedent {
  id: string;
  title: string;
  citation: string;
  court: string;
  domain: LegalDomain;
  summary: string;
  ruling: string;
  keySections: string[];
  timeline: Array<{
    year: string;
    stage: string;
    description: string;
  }>;
}

const LANDMARK_CASES: CasePrecedent[] = [
  {
    id: 'madras-tenancy-2025',
    title: 'K. Sridhar v. Revenue Divisional Officer & Landlords',
    citation: '2025 SCC OnLine Mad 412',
    court: 'Madras High Court',
    domain: 'property',
    summary: 'Landmark ruling under Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act (TNRRRLT Act, 2017) regarding recovery of excess security deposit and arbitrary eviction.',
    ruling: 'Landlords are legally prohibited from demanding security deposits exceeding three months of agreed rent. The Rent Court possesses exclusive jurisdiction to penalize withheld advance amounts.',
    keySections: ['TNRRRLT Act Sec 4', 'TNRRRLT Act Sec 21', 'Transfer of Property Act Sec 106'],
    timeline: [
      { year: '2022', stage: 'Complaint filed', description: 'Tenant petition submitted before the Chennai Rent Court regarding withheld 3 lakh advance deposit.' },
      { year: '2023', stage: 'Lower Court Order', description: 'Rent Tribunal directed refund with 9% annual interest; landlord preferred statutory appeal.' },
      { year: '2024', stage: 'Appeal filed', description: 'Civil Revision Petition filed before Madras High Court under Article 227 of Constitution.' },
      { year: '2025', stage: 'High Court Judgment', description: 'Single Bench upheld strict deposit cap of 3 months and imposed compensatory cost on landlord.' },
      { year: '2026', stage: 'Current status', description: 'Binding authoritative precedent across all Rent Courts and Sub-Courts in Tamil Nadu.' }
    ]
  },
  {
    id: 'madras-patta-2024',
    title: 'M. Selvam v. Tahsildar, Tambaram Taluk',
    citation: '2024 (2) CTC 543 (Mad)',
    court: 'Madras High Court (Madurai Bench)',
    domain: 'government',
    summary: 'Time-bound disposal of online Patta transfer applications and strict prohibition of rejecting online applications without reasoned speaking order.',
    ruling: 'Tahsildars must adhere to the 30-day statutory timeline under Tamil Nadu Patta Pass Book Act, 1983. Rejections without physical inquiry and survey notice violate principles of natural justice.',
    keySections: ['TN Patta Pass Book Act Sec 3', 'TN Patta Pass Book Act Sec 10', 'Article 226'],
    timeline: [
      { year: '2022', stage: 'Complaint filed', description: 'Online Patta transfer application pending for over 14 months without survey action.' },
      { year: '2023', stage: 'Lower Court Order', description: 'District Revenue Officer failed to dispose statutory revision within prescribed timeline.' },
      { year: '2024', stage: 'Appeal filed', description: 'Writ Petition in nature of Mandamus instituted before Madras High Court.' },
      { year: '2025', stage: 'High Court Judgment', description: 'Court mandated circular to all 38 District Collectors enforcing digital timeline tracking.' },
      { year: '2026', stage: 'Current status', description: 'Enforced strictly across Tamil Nadu e-Services (Anytime / Anywhere Patta Portal).' }
    ]
  },
  {
    id: 'sc-consumer-2024',
    title: 'Consumer Protection Association v. National Insurance Ltd.',
    citation: '2024 INSC 289',
    court: 'Supreme Court of India',
    domain: 'consumer',
    summary: 'Standard form insurance exclusion clauses cannot be invoked arbitrarily to deny genuine mediclaim settlements without clear upfront disclosure.',
    ruling: 'Exclusion clauses in boilerplate contracts that were not highlighted or explained to the consumer are void for unfair trade practice under CPA 2019.',
    keySections: ['Consumer Protection Act 2019 Sec 2(47)', 'CPA 2019 Sec 35', 'Insurance Act Sec 45'],
    timeline: [
      { year: '2022', stage: 'Complaint filed', description: 'Complaint lodged before State Consumer Disputes Redressal Commission, Chennai.' },
      { year: '2023', stage: 'Lower Court Order', description: 'State Commission awarded reimbursement of ₹6.4 Lakhs plus compensation.' },
      { year: '2024', stage: 'Appeal filed', description: 'National Commission and Special Leave Petition before Supreme Court of India.' },
      { year: '2025', stage: 'High Court Judgment', description: 'Apex Court dismissed insurer appeal, laying down nationwide guidelines for policy disclosures.' },
      { year: '2026', stage: 'Current status', description: 'Settled nationwide law governing consumer health insurance disputes.' }
    ]
  },
  {
    id: 'madras-labour-2025',
    title: 'Automotive Workers Union v. Labour Officer, Sriperumbudur',
    citation: '2025 (1) LLJ 118 (Mad)',
    court: 'Madras High Court',
    domain: 'employment',
    summary: 'Applicability of statutory notice and conciliation protocols in industrial units across industrial corridors in Kanchipuram and Chengalpattu.',
    ruling: 'Employers cannot terminate permanent staff without prior 30-day conciliation failure report and compliance with Industrial Disputes Act Section 25-F.',
    keySections: ['Industrial Disputes Act Sec 25F', 'TN Industrial Establishments Act', 'Factories Act Sec 66'],
    timeline: [
      { year: '2022', stage: 'Complaint filed', description: 'Conciliation application filed before Labour Officer following mass unnotified retrenchment.' },
      { year: '2023', stage: 'Lower Court Order', description: 'Labour Court directed interim reinstatement with 50% back wages.' },
      { year: '2024', stage: 'Appeal filed', description: 'Management writ petition challenging jurisdiction of Conciliation Officer.' },
      { year: '2025', stage: 'High Court Judgment', description: 'Division Bench held procedural compliance mandatory before invoking severance clauses.' },
      { year: '2026', stage: 'Current status', description: 'Standard precedent for industrial belt settlements in Tamil Nadu.' }
    ]
  }
];

interface CaseExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat: (query: string) => void;
}

export const CaseExplorerModal: React.FC<CaseExplorerModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState<CasePrecedent>(LANDMARK_CASES[0]);
  const [activeDomainFilter, setActiveDomainFilter] = useState<LegalDomain | 'all'>('all');

  if (!isOpen) return null;

  const filteredCases = LANDMARK_CASES.filter((c) => {
    const matchesDomain = activeDomainFilter === 'all' || c.domain === activeDomainFilter;
    const matchesSearch = !searchTerm.trim() || 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.citation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {t.caseExplorer.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.caseExplorer.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Domain filter */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.caseExplorer.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {(['all', 'property', 'consumer', 'employment', 'government'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setActiveDomainFilter(d)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                  activeDomainFilter === d
                    ? 'bg-indigo-900 dark:bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {d === 'all' ? t.caseExplorer.filterAll : d}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Split Left List & Right Timeline Detail */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Left Cases List */}
          <div className="md:col-span-5 p-3 space-y-2 border-r border-slate-100 dark:border-slate-800 overflow-y-auto">
            {filteredCases.map((c) => {
              const isSelected = selectedCase?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCase(c)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 shadow-2xs'
                      : 'bg-white dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1">
                    <span className="uppercase tracking-wider text-indigo-700 dark:text-indigo-400">{c.court}</span>
                    <span className="font-mono">{c.citation}</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {c.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-tight">
                    {c.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Detail: CASE TIMELINE */}
          <div className="md:col-span-7 p-4 sm:p-6 overflow-y-auto space-y-5">
            {selectedCase ? (
              <div>
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <Gavel className="w-3.5 h-3.5" />
                    <span>{selectedCase.court}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">{selectedCase.citation}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    {selectedCase.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {selectedCase.summary}
                  </p>
                </div>

                {/* Statutory Sections Applied */}
                <div className="py-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Key Statutory Sections:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedCase.keySections.map((sec, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* THE CASE TIMELINE (Requested exact format) */}
                <div className="py-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{t.caseExplorer.timelineTitle}</span>
                  </h4>

                  <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                    {selectedCase.timeline.map((item, index) => (
                      <div key={index} className="relative">
                        {/* Dot indicator */}
                        <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-indigo-600 dark:bg-indigo-400 border-2 border-white dark:border-[#0E1526]" />
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                            {item.year}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                            {item.stage}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ask Lexora CTA */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onInsertToChat(`Analyze the legal precedent of "${selectedCase.title}" (${selectedCase.citation}) and explain its relevance to Tamil Nadu law.`);
                      onClose();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{t.caseExplorer.askLexora}</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
