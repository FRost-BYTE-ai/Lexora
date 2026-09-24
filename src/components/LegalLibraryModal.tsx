import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Search, 
  ExternalLink
} from 'lucide-react';
import { LegalLibraryItem, Jurisdiction } from '../types';
import { fetchLegalLibraryApi } from '../services/legalApiService';
import { useLanguage } from '../context/LanguageContext';

interface LegalLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTopicToChat?: (topic: string) => void;
}

export const LegalLibraryModal: React.FC<LegalLibraryModalProps> = ({
  isOpen,
  onClose,
  onInsertTopicToChat
}) => {
  const { t } = useLanguage();
  const [items, setItems] = useState<LegalLibraryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    { id: 'All', label: t.libraryModal.categories.all },
    { id: 'Cooperative Laws', label: t.libraryModal.categories.cooperativeLaws || 'Cooperative Laws' },
    { id: 'Cooperative By-laws', label: t.libraryModal.categories.cooperativeByLaws || 'Cooperative By-laws' },
    { id: 'Government Schemes', label: t.libraryModal.categories.governmentSchemes || 'Government Schemes' },
    { id: 'Crop Insurance & PMFBY', label: t.libraryModal.categories.cropInsurance || 'Crop Insurance & PMFBY' },
    { id: 'Tamil Nadu Laws', label: t.libraryModal.categories.tnLaws },
    { id: 'Acts', label: t.libraryModal.categories.centralActs },
    { id: 'Citizen Rights', label: t.libraryModal.categories.citizenRights },
    { id: 'Government Services', label: t.libraryModal.categories.governmentServices },
    { id: 'Constitution', label: t.libraryModal.categories.constitution },
    { id: 'Court Procedures', label: t.libraryModal.categories.courtProcedures }
  ];

  useEffect(() => {
    if (!isOpen) return;

    const loadLibrary = async () => {
      setIsLoading(true);
      try {
        const fetched = await fetchLegalLibraryApi({
          category: selectedCategory === 'All' ? undefined : selectedCategory,
          jurisdiction: selectedJurisdiction === 'ALL' ? undefined : selectedJurisdiction,
          search: searchTerm.trim() || undefined
        });
        setItems(fetched);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLibrary();
  }, [isOpen, selectedCategory, selectedJurisdiction, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {t.libraryModal.title}
              </h3>
              <p className="text-[11px] text-slate-500">
                {t.libraryModal.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t.accessibility.closeDialog}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3 flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.libraryModal.searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none"
              />
            </div>

            {/* Jurisdiction filter */}
            <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedJurisdiction('ALL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  selectedJurisdiction === 'ALL' ? 'bg-white text-blue-900 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                {t.libraryModal.allJurisdictions}
              </button>
              <button
                type="button"
                onClick={() => setSelectedJurisdiction('TN')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  selectedJurisdiction === 'TN' ? 'bg-white text-blue-900 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                {t.header.tamilNaduMode}
              </button>
              <button
                type="button"
                onClick={() => setSelectedJurisdiction('IN')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  selectedJurisdiction === 'IN' ? 'bg-white text-blue-900 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                {t.header.allIndiaMode}
              </button>
            </div>
          </div>

          {/* Categories Horizontal */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-blue-900 text-white shadow-2xs font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3 bg-slate-50/50">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm font-semibold text-slate-600">{t.libraryModal.emptyResults}</p>
              <p className="text-xs text-slate-400 mt-1">{t.libraryModal.emptyHint}</p>
            </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white border border-slate-200 rounded-2xl hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.jurisdiction === 'TN' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          {item.jurisdiction === 'TN' ? t.libraryModal.tnLawBadge : t.libraryModal.centralStatuteBadge}
                        </span>
                        <span className="text-[10px] text-slate-400">{item.category}</span>
                      </div>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                          title={t.sources.openSource}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <h4 className="text-sm font-bold font-serif text-slate-900 mb-0.5 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[12px] font-serif text-blue-700 font-medium mb-2">
                      {item.titleTamil}
                    </p>

                    <p className="text-xs font-serif text-slate-600 leading-relaxed mb-3">
                      {item.summary}
                    </p>

                    <div className="p-2.5 bg-slate-50 rounded-xl mb-3 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        {t.libraryModal.keySections}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {item.keySections.map((sec, idx) => (
                          <span key={idx} className="text-[10px] bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                            {sec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                      {item.officialSource}
                    </span>
                    {onInsertTopicToChat && (
                      <button
                        type="button"
                        onClick={() => {
                          onInsertTopicToChat(`What are the key rights under ${item.title}?`);
                          onClose();
                        }}
                        className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                      >
                        {t.libraryModal.askInChat}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          <p className="text-[11px] text-slate-400">
            {t.libraryModal.sourceNotice}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            {t.libraryModal.closeExplorer}
          </button>
        </div>
      </div>
    </div>
  );
};
