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
  PenTool,
  Printer,
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import { uploadLegalDocumentApi } from '../services/legalApiService';
import { useLanguage } from '../context/LanguageContext';
import { DocumentScanMode } from '../types';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentAnalyzed: (result: {
    fileName: string;
    fileSize: string;
    analysis: string;
    scanMode?: DocumentScanMode;
    documentScriptType?: string;
    extractedText?: string;
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
  const [base64ImageData, setBase64ImageData] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<DocumentScanMode>('auto');
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
      setBase64ImageData(null);
      setScanMode('auto');
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
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setBase64ImageData(dataUrl);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File(
          [blob], 
          `camera-scanned-${scanMode === 'handwritten' ? 'handwritten' : scanMode === 'typed' ? 'typed' : 'doc'}-${Date.now()}.jpg`, 
          { type: 'image/jpeg' }
        );
        setSelectedFile(file);
        stopCameraStream();
        setShowCamera(false);
      }
    }, 'image/jpeg', 0.92);
  };

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setSelectedFile(file);
    setError(null);

    // If it's an image, read as Data URL for true multimodal OCR
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setBase64ImageData(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setBase64ImageData(null);
    }

    // Auto adjust mode if filename clearly indicates script
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('handwritten') || lowerName.includes('petition') || lowerName.includes('letter') || lowerName.includes('note')) {
      setScanMode('handwritten');
    } else if (lowerName.includes('agreement') || lowerName.includes('contract') || lowerName.includes('typed') || lowerName.includes('notice')) {
      setScanMode('typed');
    }
  };

  const runAnalysisPipeline = async () => {
    if (!selectedFile) return;

    try {
      setStep('uploading');
      await new Promise(r => setTimeout(r, 400));

      setStep('extracting');
      let extractedSnippet = `${t.uploadModal.scrutinyQueryPrefix} ${selectedFile.name} [Mode: ${scanMode}]`;
      
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
      const response = await uploadLegalDocumentApi(
        selectedFile, 
        extractedSnippet, 
        language, 
        base64ImageData || undefined,
        scanMode
      );

      setStep('grounding');
      await new Promise(r => setTimeout(r, 450));

      setStep('ready');
      await new Promise(r => setTimeout(r, 350));

      onDocumentAnalyzed({
        fileName: selectedFile.name,
        fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
        analysis: response.analysis,
        scanMode: response.scanMode || scanMode,
        documentScriptType: response.documentScriptType,
        extractedText: response.extractedText
      });

      onClose();
    } catch (err: any) {
      console.error(err);
      setError(t.uploadModal.errorUpload || 'Document analysis encountered an issue. Please try again.');
      setStep('idle');
    }
  };

  const stepsList = [
    { key: 'uploading', label: t.uploadModal.stepUploading },
    { key: 'extracting', label: scanMode === 'handwritten' ? (language === 'ta' ? 'கையெழுத்து எழுத்துருக்களை படித்தல்...' : 'Deciphering Handwritten Strokes & Text...') : t.uploadModal.stepExtracting },
    { key: 'analysing', label: t.uploadModal.stepAnalyzing },
    { key: 'grounding', label: t.uploadModal.stepGrounding },
    { key: 'ready', label: t.uploadModal.stepReady }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-upload-modal-title"
    >
      <div 
        className="bg-white dark:bg-[#0E1526] rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shadow-2xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="doc-upload-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'ta' ? 'ஆவண ஸ்கேனர் & சட்ட பகுப்பாய்வு' : 'Legal Document Scanner & OCR Scrutiny'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {language === 'ta' ? 'கையெழுத்து + அச்சு' : 'Handwritten & Typed'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'ta' ? 'கையெழுத்து மற்றும் அச்சிடப்பட்ட ஆவணங்களை ஸ்கேன் செய்து சட்ட விதிகளை அறிந்திடுங்கள்' : 'Scan handwritten petitions, handwritten receipts, and typed legal agreements'}
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

        <div className="p-6 space-y-4 overflow-y-auto">
          {step === 'idle' ? (
            <>
              {/* 1. SCRIPT TYPE / SCAN MODE TOGGLE */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{language === 'ta' ? 'ஸ்கேன் செய்யும் ஆவண வகை (Document Medium)' : 'Document Medium & OCR Engine'}</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setScanMode('auto')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      scanMode === 'auto'
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 dark:text-indigo-200'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      {scanMode === 'auto' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <span className="text-xs font-bold block">{language === 'ta' ? 'தானியங்கி (Auto)' : 'Auto-Detect'}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      {language === 'ta' ? 'கையெழுத்து & அச்சு இரண்டும்' : 'Both scripts combined'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScanMode('handwritten')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      scanMode === 'handwritten'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 dark:text-amber-200'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <PenTool className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      {scanMode === 'handwritten' && <Check className="w-3.5 h-3.5 text-amber-600" />}
                    </div>
                    <span className="text-xs font-bold block">{language === 'ta' ? '✍️ கையெழுத்து' : '✍️ Handwritten'}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      {language === 'ta' ? 'மனு, கடிதம், ரசீது' : 'Petitions, letters, notes'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScanMode('typed')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      scanMode === 'typed'
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/20 text-blue-950 dark:text-blue-200'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      {scanMode === 'typed' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <span className="text-xs font-bold block">{language === 'ta' ? '🖨️ அச்சிடப்பட்டவை' : '🖨️ Typed / Printed'}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      {language === 'ta' ? 'ஒப்பந்தம், பத்திரம், நோட்டீஸ்' : 'Deeds, notices, court orders'}
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. CAMERA OR DROPZONE */}
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
                  <div className="absolute inset-4 border-2 border-dashed border-indigo-400/70 rounded-xl pointer-events-none flex flex-col items-center justify-between p-3">
                    <span className="text-[10px] font-mono bg-slate-900/90 text-indigo-300 px-2.5 py-1 rounded shadow-sm">
                      {scanMode === 'handwritten' 
                        ? (language === 'ta' ? '[கையெழுத்து ஆவணத்தை சட்டத்தினுள் வைக்கவும்]' : '[Align Handwritten Document in Frame]')
                        : (language === 'ta' ? '[ஆவணத்தை சட்டத்தினுள் சீராக வைக்கவும்]' : '[Align Document in Frame]')
                      }
                    </span>
                    <span className="text-[9px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded">
                      {language === 'ta' ? 'வெளிச்சமான இடத்தில் வைத்து படம் பிடிக்கவும்' : 'Hold steady in good lighting'}
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
                      <span>{language === 'ta' ? 'படம் பிடிக்கவும் (Capture Document)' : 'Capture Document'}</span>
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
                    accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />

                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-2">
                        {scanMode === 'handwritten' ? <PenTool className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                          {scanMode === 'handwritten' ? '✍️ HANDWRITTEN' : scanMode === 'typed' ? '🖨️ TYPED' : '⚡ HYBRID'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {t.uploadModal.readyToAnalyze}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setBase64ImageData(null);
                        }}
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
                          {language === 'ta' ? 'கையெழுத்து அல்லது அச்சிடப்பட்ட ஆவணத்தை பதிவேற்றவும்' : 'Upload or scan handwritten & typed documents'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                          PDF • JPG • PNG • DOCX • CAMERA LIVE CAPTURE
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

              {/* 3. SAMPLE DOCUMENTS (HANDWRITTEN & TYPED PRESETS) */}
              {!showCamera && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {language === 'ta' ? 'மாதிரி ஆவணங்களை சோதிக்கவும் (Handwritten & Typed Samples)' : 'One-Click Sample Documents (Handwritten & Typed)'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {/* Sample 1: Handwritten Police Complaint */}
                    <button
                      type="button"
                      onClick={() => {
                        setScanMode('handwritten');
                        const sampleText = `[கையெழுத்துப் பிரதி / Handwritten Police Complaint]
பெறுநர்: காவல் நிலைய ஆய்வாளர் அவர்களுக்கு,
மனுதாரர்: க. முருகன், த/பெ கந்தசாமி, எண். 14, வடக்கு தெரு, திருச்சி.
பொருள்: வீட்டு வாடகை முன்பணம் ₹50,000 திரும்பத் தராமல் மிரட்டுவது மற்றும் பூட்டை உடைப்பது தொடர்பாக புகார்.
ஐயா, நான் கடந்த இரண்டு வருடங்களாக வாடகைக்கு இருந்து வருகிறேன். உரிய 30 நாட்கள் முன்னறிவிப்பு கொடுத்து காலி செய்த பின்னரும் உரிமையாளர் அட்வான்ஸ் தொகையை திருப்பித் தராமல் மிரட்டுகிறார். உரிய நடவடிக்கை எடுக்க வேண்டுகிறேன்.
இப்படிக்கு, க. முருகன் (கையொப்பம்)`;
                        const sample = new File([sampleText], 'handwritten-police-complaint-tamil.txt', { type: 'text/plain' });
                        setSelectedFile(sample);
                        setBase64ImageData(null);
                      }}
                      className="p-2.5 text-left bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-amber-400 transition-all text-xs cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <PenTool className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">✍️ Handwritten</span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {language === 'ta' ? 'கையெழுத்து காவல் புகார் மனு' : 'Handwritten Police Petition'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {language === 'ta' ? 'முன்பணம் மறுப்பு & மிரட்டல் புகார்' : 'Deposit refund & illegal lockout'}
                      </p>
                    </button>

                    {/* Sample 2: Handwritten Receipt */}
                    <button
                      type="button"
                      onClick={() => {
                        setScanMode('handwritten');
                        const sampleText = `[கையெழுத்து வாடகை ரசீது & அட்வான்ஸ் ஒப்புதல்]
நாள்: 12-01-2025
பெறப்பட்டது: திரு. ஆர். கார்த்திக் அவர்களிடமிருந்து வாடகை முன்பணமாக ₹45,000 (நாற்பத்தைந்தாயிரம் ரூபாய் மட்டும்) ரொக்கமாக பெறப்பட்டது. 
மாத வாடகை: ₹15,000. காலி செய்யும் போது 15 நாட்களுக்குள் அட்வான்ஸ் திருப்பித் தரப்படும்.
ஒப்பம்: வீட்டு உரிமையாளர் எஸ். ராமநாதன்.`;
                        const sample = new File([sampleText], 'handwritten-advance-receipt.txt', { type: 'text/plain' });
                        setSelectedFile(sample);
                        setBase64ImageData(null);
                      }}
                      className="p-2.5 text-left bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-amber-400 transition-all text-xs cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <PenTool className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">✍️ Handwritten</span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {language === 'ta' ? 'கையெழுத்து முன்பண ரசீது' : 'Handwritten Deposit Receipt'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {language === 'ta' ? 'ரொக்க ரசீது & வாக்குறுதி' : 'Advance cash voucher note'}
                      </p>
                    </button>

                    {/* Sample 3: Typed Tenancy Agreement */}
                    <button
                      type="button"
                      onClick={() => {
                        setScanMode('typed');
                        const sampleText = `[PRINTED / TYPED TENANCY AGREEMENT]
THIS RESIDENTIAL TENANCY AGREEMENT is made under the Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act, 2017 (TNRRRLT Act).
BETWEEN: LESSOR (Owner) and LESSEE (Tenant)
CLAUSE 1: Monthly Rent is fixed at ₹14,000 payable on or before 5th of each English calendar month.
CLAUSE 2: Security Deposit is fixed at ₹42,000 (3 months rent equivalent as per Section 8).
CLAUSE 3: Notice Period for vacation shall be 30 days mandatory written notice.
CLAUSE 4: Lessor shall not enter premises without prior 24-hour intimation.`;
                        const sample = new File([sampleText], 'typed-tenancy-agreement-tn.txt', { type: 'text/plain' });
                        setSelectedFile(sample);
                        setBase64ImageData(null);
                      }}
                      className="p-2.5 text-left bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-400 transition-all text-xs cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300">🖨️ Typed</span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {language === 'ta' ? 'அச்சிடப்பட்ட வாடகை ஒப்பந்தம்' : 'Typed Tenancy Agreement'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {language === 'ta' ? 'TNRRRLT சட்டம் 2017 விதிகள்' : 'Standard TN tenancy deed'}
                      </p>
                    </button>

                    {/* Sample 4: Typed Legal Notice */}
                    <button
                      type="button"
                      onClick={() => {
                        setScanMode('typed');
                        const sampleText = `[REGISTERED LEGAL NOTICE]
UNDER INSTRUCTIONS FROM ADVOCATE ON BEHALF OF CLIENT:
TO: [Opposite Party / Service Provider]
SUBJECT: Statutory Demand Notice for Deficient Service and Unfair Trade Practice under Section 35 of Consumer Protection Act 2019.
You are hereby called upon to refund the disputed sum of ₹28,500 along with interest within 15 days of receipt of this notice, failing which legal proceedings will be initiated before District Consumer Disputes Redressal Commission.`;
                        const sample = new File([sampleText], 'typed-legal-notice-consumer.txt', { type: 'text/plain' });
                        setSelectedFile(sample);
                        setBase64ImageData(null);
                      }}
                      className="p-2.5 text-left bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-400 transition-all text-xs cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-300">🖨️ Typed</span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {language === 'ta' ? 'அச்சிடப்பட்ட வழக்கறிஞர் நோட்டீஸ்' : 'Typed Legal Demand Notice'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {language === 'ta' ? 'நுகர்வோர் பாதுகாப்பு சட்டம்' : 'Consumer statutory notice'}
                      </p>
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
            <div className="py-8 px-4 space-y-5">
              <div className="text-center mb-4">
                <Loader2 className="w-9 h-9 text-indigo-700 dark:text-indigo-400 animate-spin mx-auto mb-2.5" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {scanMode === 'handwritten' 
                    ? (language === 'ta' ? 'கையெழுத்துப் பிரதி மற்றும் உரை வாசிக்கப்படுகிறது...' : 'Deciphering Handwritten Script & Legal Meaning...')
                    : (language === 'ta' ? 'ஆவணம் ஸ்கேன் செய்யப்பட்டு சட்டப் பிரிவுகள் சரிபார்க்கப்படுகின்றன...' : 'Analyzing & Grounding Legal Document...')}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {language === 'ta' 
                    ? 'கையெழுத்து மற்றும் அச்சிடப்பட்ட வாசகங்கள் பிரித்தெடுக்கப்பட்டு, எளிய தமிழில் உங்களுக்குப் புரியும் வகையில் தயார் செய்யப்படுகிறது.' 
                    : 'Transcribing text and deciphering statutory liabilities under Tamil Nadu and Indian enactments.'}
                </p>
              </div>

              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md mx-auto">
                {stepsList.map((st, i) => {
                  const stepIndex = ['uploading', 'extracting', 'analysing', 'grounding', 'ready'].indexOf(step);
                  const isCurrent = st.key === step;
                  const isDone = i < stepIndex || step === 'ready';

                  return (
                    <div key={st.key} className="flex items-center gap-3 text-xs">
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

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
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
              className="px-4 py-2 bg-indigo-900 dark:bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-800 dark:hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>{scanMode === 'handwritten' ? (language === 'ta' ? 'கையெழுத்தை பகுப்பாய்வு செய்' : 'Scan Handwritten Text') : t.uploadModal.analyzeBtn}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
