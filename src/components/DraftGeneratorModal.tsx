import React, { useState } from 'react';
import { 
  X, 
  FileEdit, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  FileCheck2
} from 'lucide-react';
import { DraftType, Jurisdiction, LanguageMode } from '../types';
import { generateLegalDraftApi } from '../services/legalApiService';
import { useLanguage } from '../context/LanguageContext';

interface DraftGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  initialLanguage?: LanguageMode;
}

export const DraftGeneratorModal: React.FC<DraftGeneratorModalProps> = ({
  isOpen,
  onClose,
  initialTopic = '',
  initialLanguage
}) => {
  const { language: currentLang, t } = useLanguage();
  const [draftType, setDraftType] = useState<DraftType>('tenancy_notice');
  const [applicantName, setApplicantName] = useState(t.draftModal.defaultComplainant);
  const [respondentName, setRespondentName] = useState(t.draftModal.defaultRespondent);
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('TN');
  const [language, setLanguage] = useState<LanguageMode>(initialLanguage || (currentLang === 'en' ? 'en' : 'ta'));
  const [facts, setFacts] = useState(initialTopic || t.draftModal.defaultFacts);
  const [reliefSought, setReliefSought] = useState(t.draftModal.defaultRelief);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const draftTypesList: Array<{
    id: DraftType;
    label: string;
    subLabel: string;
    description: string;
  }> = [
    {
      id: 'rti',
      label: t.draftModal.types.rti.label,
      subLabel: t.draftModal.types.rti.labelTamil,
      description: t.draftModal.types.rti.description
    },
    {
      id: 'consumer_complaint',
      label: t.draftModal.types.consumer_complaint.label,
      subLabel: t.draftModal.types.consumer_complaint.labelTamil,
      description: t.draftModal.types.consumer_complaint.description
    },
    {
      id: 'tenancy_notice',
      label: t.draftModal.types.tenancy_notice.label,
      subLabel: t.draftModal.types.tenancy_notice.labelTamil,
      description: t.draftModal.types.tenancy_notice.description
    },
    {
      id: 'legal_notice',
      label: t.draftModal.types.legal_notice.label,
      subLabel: t.draftModal.types.legal_notice.labelTamil,
      description: t.draftModal.types.legal_notice.description
    },
    {
      id: 'grievance_letter',
      label: t.draftModal.types.grievance_letter.label,
      subLabel: t.draftModal.types.grievance_letter.labelTamil,
      description: t.draftModal.types.grievance_letter.description
    }
  ];

  const handleGenerate = async () => {
    if (!facts.trim()) return;

    setIsGenerating(true);
    setGeneratedDraft(null);

    try {
      const res = await generateLegalDraftApi({
        draftType,
        applicantName,
        respondentName,
        jurisdiction,
        language,
        facts,
        reliefSought
      });

      setGeneratedDraft(res.draft);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedDraft) return;
    navigator.clipboard.writeText(generatedDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedDraft) return;
    const blob = new Blob([generatedDraft], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LexTamil_${draftType}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <FileEdit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {t.draftModal.title}
              </h3>
              <p className="text-[11px] text-slate-500">
                {t.draftModal.subtitle}
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {!generatedDraft ? (
            <>
              {/* Draft Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {t.draftModal.selectType}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {draftTypesList.map((dt) => (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => setDraftType(dt.id)}
                      className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                        draftType === dt.id
                          ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-2xs ring-1 ring-blue-500'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <p className="text-xs font-bold">{dt.label}</p>
                      <p className="text-[10px] text-blue-700 font-medium">{dt.subLabel}</p>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{dt.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Configurations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.draftModal.jurisdictionSetting}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setJurisdiction('TN')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border cursor-pointer ${
                        jurisdiction === 'TN' ? 'bg-blue-900 text-white border-blue-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {t.header.tamilNaduMode}
                    </button>
                    <button
                      type="button"
                      onClick={() => setJurisdiction('IN')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border cursor-pointer ${
                        jurisdiction === 'IN' ? 'bg-blue-900 text-white border-blue-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {t.header.allIndiaMode}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.draftModal.draftLanguage}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLanguage('ta')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border cursor-pointer ${
                        language === 'ta' ? 'bg-blue-900 text-white border-blue-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {t.common.inTamil}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border cursor-pointer ${
                        language === 'en' ? 'bg-blue-900 text-white border-blue-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {t.common.inEnglish}
                    </button>
                  </div>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.draftModal.complainantName}
                  </label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder={t.draftModal.complainantPlaceholder}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.draftModal.respondentName}
                  </label>
                  <input
                    type="text"
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    placeholder={t.draftModal.respondentPlaceholder}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              {/* Facts */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.draftModal.facts}
                </label>
                <textarea
                  rows={3}
                  value={facts}
                  onChange={(e) => setFacts(e.target.value)}
                  placeholder={t.draftModal.factsPlaceholder}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none resize-none"
                />
              </div>

              {/* Relief */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.draftModal.relief}
                </label>
                <input
                  type="text"
                  value={reliefSought}
                  onChange={(e) => setReliefSought(e.target.value)}
                  placeholder={t.draftModal.reliefPlaceholder}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  {t.draftModal.generatedTitle}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? t.common.copied : t.common.copy}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t.draftModal.downloadTxt}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap max-h-[50vh] overflow-y-auto">
                {generatedDraft}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>{t.common.notice}:</strong> {t.draftModal.legalNoticeDisclaimer}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
          {generatedDraft ? (
            <button
              onClick={() => setGeneratedDraft(null)}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
            >
              {t.draftModal.editParameters}
            </button>
          ) : (
            <span className="text-[10px] text-slate-400">
              {t.draftModal.footerNotice}
            </span>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer"
            >
              {generatedDraft ? t.common.done : t.common.cancel}
            </button>

            {!generatedDraft && (
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !facts.trim()}
                className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t.draftModal.generatingBtn}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t.draftModal.generateBtn}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
