import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Loader2,
  FileCheck,
  ShieldCheck,
  Camera,
  RotateCcw
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
  const [showCamera, setShowCamera] = useState(false);
  const [step, setStep] = useState<StepState>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  const { t, language } = useLanguage();

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setShowCamera(false);
      setSelectedFile(null);
      setStep('idle');
      setError(null);
    }
  }, [isOpen]);

  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError(language === 'ta' ? 'கேமரா அணுகல் கிடைக்கவில்லை. தயவுசெய்து அனுமதி வழங்கவும்.' : 'Camera access denied or unavailable.');
      setShowCamera(false);
    }
  };

  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `scanned-document-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
        stopCameraStream();
        setShowCamera(false);
      }
    }, 'image/jpeg', 0.9);
  };

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
          selectedFile.name.endsWith('.md')
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-upload-modal-title"
    >
      <div 
        className="bg-white dark:bg-[#0E1526] rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 id="doc-upload-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'ta' ? 'ஆவண ஸ்கேனிங் & பகுப்பாய்வு' : 'Document Scanning & Scrutiny'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'ta' ? 'கேமரா மூலம் ஆவணங்களை ஸ்கேன் செய்யவும் அல்லது கோப்புகளை பதிவேற்றவும்' : 'Scan physical notices with camera or upload files'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            aria-label={t.accessibility.closeDialog}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {step === 'idle' ? (
            <>
              {showCamera ? (
                /* Live Camera Viewfinder */
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center min-h-[300px]">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-[280px] object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Viewfinder Target Frame */}
                  <div className="absolute inset-4 border-2 border-dashed border-indigo-400/60 rounded-xl pointer-events-none flex items-center justify-center">
                    <span className="text-[10px] font-mono bg-slate-900/80 text-indigo-300 px-2 py-1 rounded">
                      {language === 'ta' ? '[ஆவணத்தை சட்டத்தினுள் வைக்கவும்]' : '[Align Document in Frame]'}
                    </span>
                  </div>

                  <div className="absolute bottom-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        stopCameraStream();
                        setShowCamera(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      {language === 'ta' ? 'ரத்து செய்' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={captureSnapshot}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{language === 'ta' ? 'படம் பிடிக்கவும் (Capture)' : 'Capture Document'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Upload Drop Zone & Camera Trigger */
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFiles(e.dataTransfer.files);
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    dragOver
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : selectedFile
                      ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50/60 dark:hover:bg-slate-850'
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
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-2">
                        <FileText className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {t.uploadModal.readyToAnalyze}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="mt-3 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold underline cursor-pointer"
                      >
                        {t.uploadModal.chooseDifferent}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {language === 'ta' ? 'கோப்பை இழுத்து விடவும் அல்லது ஸ்கேன் செய்யவும்' : 'Drop legal document or scan via camera'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                          PDF • DOCX • JPG • PNG • CAMERA
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          {language === 'ta' ? 'கோப்பு தேர்வு செய்' : 'Browse Files'}
                        </button>

                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <Camera className="w-4 h-4" />
                          <span>{language === 'ta' ? 'கேமரா மூலம் ஸ்கேன்' : 'Scan with Camera'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sample Files shortcuts for instant demonstration */}
              {!showCamera && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
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
                      className="p-2 text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-400 text-xs text-slate-700 dark:text-slate-300 font-medium truncate cursor-pointer"
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
                      className="p-2 text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-400 text-xs text-slate-700 dark:text-slate-300 font-medium truncate cursor-pointer"
                    >
                      {t.uploadModal.templateConsumer}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            <div className="py-6 px-4 space-y-4">
              <div className="text-center mb-4">
                <Loader2 className="w-8 h-8 text-indigo-700 dark:text-indigo-400 animate-spin mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t.uploadModal.analyzingTitle}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.uploadModal.analyzingDesc}
                </p>
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                {stepsList.map((st, i) => {
                  const stepIndex = ['uploading', 'extracting', 'analysing', 'grounding', 'ready'].indexOf(step);
                  const isCurrent = st.key === step;
                  const isDone = i < stepIndex || step === 'ready';

                  return (
                    <div key={st.key} className="flex items-center gap-2.5 text-xs">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex-shrink-0" />
                      )}
                      <span className={`${isDone ? 'text-slate-700 dark:text-slate-300 font-medium' : isCurrent ? 'text-indigo-900 dark:text-indigo-200 font-bold' : 'text-slate-400'}`}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            {t.uploadModal.encryptionNotice}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                stopCameraStream();
                onClose();
              }}
              disabled={step !== 'idle'}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl cursor-pointer"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={runAnalysisPipeline}
              disabled={!selectedFile || step !== 'idle' || showCamera}
              className="px-4 py-2 bg-indigo-900 dark:bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-800 dark:hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
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
