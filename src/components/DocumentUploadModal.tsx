import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Loader2,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import { uploadLegalDocumentApi } from '../services/legalApiService';
import { useLanguage } from '../context/LanguageContext';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentAnalyzed: (result: {
    fileName: string;
    fileSize: string;
    analysis: string;
  }) => void;
}

type StepState = 'idle' | 'uploading' | 'extracting' | 'analysing' | 'grounding' | 'ready';

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onDocumentAnalyzed
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState<StepState>('idle');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setSelectedFile(file);
    setError(null);
  };

  const runAnalysisPipeline = async () => {
    if (!selectedFile) return;

    try {
      setStep('uploading');
      await new Promise(r => setTimeout(r, 500));

      setStep('extracting');
      let extractedSnippet = `${t.uploadModal.scrutinyQueryPrefix} ${selectedFile.name}`;
      try {
        if (
          selectedFile.type.includes('text') || 
          selectedFile.name.endsWith('.txt') || 
          selectedFile.name.endsWith('.md') || 
          selectedFile.name.endsWith('.json') || 
          selectedFile.name.endsWith('.csv')
        ) {
          const text = await selectedFile.text();
          if (text && text.trim().length > 0) {
            extractedSnippet = text.slice(0, 8000);
          }
        }
      } catch (err) {
        console.warn("Could not read file text directly:", err);
      }
      await new Promise(r => setTimeout(r, 500));

      setStep('analysing');
      const response = await uploadLegalDocumentApi(selectedFile, extractedSnippet, language);

      setStep('grounding');
      await new Promise(r => setTimeout(r, 500));

      setStep('ready');
      await new Promise(r => setTimeout(r, 400));

      onDocumentAnalyzed({
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
        analysis: response.analysis
      });

      onClose();
    } catch (err: any) {
      console.error(err);
      setError(t.uploadModal.errorUpload);
      setStep('idle');
    }
  };

  const stepsList = [
    { key: 'uploading', label: t.uploadModal.stepUploading },
    { key: 'extracting', label: t.uploadModal.stepExtracting },
    { key: 'analysing', label: t.uploadModal.stepAnalyzing },
    { key: 'grounding', label: t.uploadModal.stepGrounding },
    { key: 'ready', label: t.uploadModal.stepReady }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {t.uploadModal.title}
              </h3>
              <p className="text-[11px] text-slate-500">
                {t.uploadModal.subtitle}
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

        <div className="p-6 space-y-4">
          {step === 'idle' ? (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50/50'
                    : selectedFile
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 max-w-xs truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {t.uploadModal.readyToAnalyze}
                    </p>
                    <span className="mt-3 text-[11px] text-blue-600 font-semibold underline">
                      {t.uploadModal.chooseDifferent}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {t.uploadModal.dragDrop}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {t.uploadModal.supportedFormats}
                    </p>
                    <button
                      type="button"
                      className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-semibold hover:bg-blue-800 transition-colors shadow-2xs"
                    >
                      {t.uploadModal.browseFiles}
                    </button>
                  </div>
                )}
              </div>

              {/* Sample Files shortcuts for instant demonstration */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {t.uploadModal.loadTemplates}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sample = new File(
                        [t.uploadModal.templateRentalContent],
                        t.uploadModal.templateRentalFile,
                        { type: 'text/plain' }
                      );
                      setSelectedFile(sample);
                    }}
                    className="p-2 text-left bg-white border border-slate-200 rounded-lg hover:border-blue-300 text-xs text-slate-700 font-medium truncate cursor-pointer"
                  >
                    {t.uploadModal.templateRental}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const sample = new File(
                        [t.uploadModal.templateConsumerContent],
                        t.uploadModal.templateConsumerFile,
                        { type: 'text/plain' }
                      );
                      setSelectedFile(sample);
                    }}
                    className="p-2 text-left bg-white border border-slate-200 rounded-lg hover:border-blue-300 text-xs text-slate-700 font-medium truncate cursor-pointer"
                  >
                    {t.uploadModal.templateConsumer}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            <div className="py-6 px-4 space-y-4">
              <div className="text-center mb-4">
                <Loader2 className="w-8 h-8 text-blue-700 animate-spin mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">
                  {t.uploadModal.analyzingTitle}
                </h4>
                <p className="text-xs text-slate-500">
                  {t.uploadModal.analyzingDesc}
                </p>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {stepsList.map((st, i) => {
                  const stepIndex = ['uploading', 'extracting', 'analysing', 'grounding', 'ready'].indexOf(step);
                  const isCurrent = st.key === step;
                  const isDone = i < stepIndex || step === 'ready';

                  return (
                    <div key={st.key} className="flex items-center gap-2.5 text-xs">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                      )}
                      <span className={`${isDone ? 'text-slate-700 font-medium' : isCurrent ? 'text-blue-900 font-bold' : 'text-slate-400'}`}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            {t.uploadModal.encryptionNotice}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={step !== 'idle'}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={runAnalysisPipeline}
              disabled={!selectedFile || step !== 'idle'}
              className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-semibold hover:bg-blue-800 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>{t.uploadModal.analyzeBtn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
