import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Mic, 
  Volume2, 
  Cpu, 
  CheckCircle2, 
  Radio, 
  Sparkles, 
  Scan, 
  RefreshCw, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  Layers,
  Zap,
  Info
} from 'lucide-react';
import { HardwareAssistStatus, LanguageMode } from '../types';
import { fetchHardwareStatusApi, analyzeHardwareDocumentApi } from '../services/legalApiService';
import { speakLegalText } from '../services/speechService';
import { useLanguage } from '../context/LanguageContext';

interface SmartHardwareAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentAnalyzed: (result: { fileName: string; fileSize: string; analysis: string }) => void;
}

const SAMPLE_PHYSICAL_DOCS = [
  {
    id: 'pmfby-rejection',
    title: 'PMFBY Crop Loss Claim Disallowance Notice (DGRC)',
    titleTamil: 'பயிர் காப்பீடு இழப்பீட்டு மறுப்பு அறிவிக்கை (DGRC)',
    category: 'Crop Insurance',
    sampleText: 'Disallowance Notice from Agricultural Insurance Company under PMFBY Kharif season. Claim rejected citing 72-hour localized calamity intimation delay and survey discrepancy in Survey No. 142/3, Thanjavur District. Farmer appeals to District Collector DGRC.',
    imagePlaceholder: 'PMFBY-CLAIM-REJECTION-2024.JPG'
  },
  {
    id: 'pacs-sec90-demand',
    title: 'PACS Section 90 Surcharge & Demand Notice',
    titleTamil: 'தொடக்க வேளாண் கூட்டுறவு சங்கம் பிரிவு 90 தீர்வு அறிவிப்பு',
    category: 'Cooperative Governance',
    sampleText: 'Notice issued by Primary Agricultural Credit Society under Section 90 of TN Cooperative Societies Act 1983 regarding loan arrears recovery and dispute reference to Circle Deputy Registrar of Co-operative Societies.',
    imagePlaceholder: 'PACS-SEC90-ARREARS-NOTICE.JPG'
  },
  {
    id: 'pacs-membership-rejection',
    title: 'PACS Membership Denial Order under Section 21',
    titleTamil: 'கூட்டுறவு சங்க உறுப்பினர் சேர்க்கை மறுப்பு ஆணை (பிரிவு 21)',
    category: 'Member Rights',
    sampleText: 'Rejection of PACS Class-A membership application citing operational limits. Appeal lie to the Registrar/Deputy Registrar within 60 days under Section 21(3) for deemed admission and voting rights.',
    imagePlaceholder: 'PACS-MEMBERSHIP-DENIAL-SEC21.JPG'
  }
];

export const SmartHardwareAssistModal: React.FC<SmartHardwareAssistModalProps> = ({
  isOpen,
  onClose,
  onDocumentAnalyzed
}) => {
  const { t, language } = useLanguage();
  const [hardwareInfo, setHardwareInfo] = useState<HardwareAssistStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'kiosk_scan' | 'architecture'>('kiosk_scan');
  const [selectedDocId, setSelectedDocId] = useState<string>(SAMPLE_PHYSICAL_DOCS[0].id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeCameraFeed, setActiveCameraFeed] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHardwareStatus();
    } else {
      stopCameraStream();
    }
  }, [isOpen]);

  const loadHardwareStatus = async () => {
    try {
      const data = await fetchHardwareStatusApi();
      setHardwareInfo(data);
    } catch (err) {
      console.warn('Hardware status fallback', err);
    }
  };

  const startCameraStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setActiveCameraFeed(true);
    } catch (err) {
      console.warn('Physical camera unavailable, using Kiosk Optical Sensor Simulation', err);
      setActiveCameraFeed(false);
    }
  };

  const stopCameraStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setActiveCameraFeed(false);
  };

  const handleCaptureAndProcess = async () => {
    setIsProcessing(true);
    const chosenDoc = SAMPLE_PHYSICAL_DOCS.find(d => d.id === selectedDocId) || SAMPLE_PHYSICAL_DOCS[0];

    try {
      setProcessingStep('Edge Controller: Perspective rectification & deskew (OpenCV Edge Pipeline)...');
      await new Promise(r => setTimeout(r, 600));

      setProcessingStep('Gateway Link: Forwarding 12MP high-res buffer to Lexora Cloud Legal Engine...');
      await new Promise(r => setTimeout(r, 650));

      setProcessingStep('Lexora Engine: Grounding statutory provisions and drafting citizen action plan...');
      const result = await analyzeHardwareDocumentApi(
        'data:image/jpeg;base64,simulated_optical_buffer',
        chosenDoc.title,
        language
      );

      // Play audio confirmation
      speakLegalText(
        language === 'ta' 
          ? 'ஆவணம் வெற்றிகரமாக ஸ்கேன் செய்யப்பட்டு சட்டப்பூர்வ விளக்கம் தயாராக உள்ளது.' 
          : 'Document captured successfully by Kiosk Module. Legal scrutiny and action plan ready.',
        language
      );

      onDocumentAnalyzed({
        fileName: chosenDoc.title,
        fileSize: '1.4 MB (Overhead Kiosk Capture)',
        analysis: result.analysis
      });

      onClose();
    } catch (err) {
      console.error('Processing error:', err);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  if (!isOpen) return null;

  const chosenDoc = SAMPLE_PHYSICAL_DOCS.find(d => d.id === selectedDocId) || SAMPLE_PHYSICAL_DOCS[0];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hardware-modal-title"
    >
      <div 
        className="w-full max-w-4xl bg-white dark:bg-[#0E1526] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
        id="smart-hardware-assist-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="hardware-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  {language === 'ta' ? 'ஸ்மார்ட் ஆவண & குரல் உதவி மையம்' : 'Smart Document & Voice Assist Module'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Kiosk Gateway Online
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'ta' 
                  ? 'கிராமப்புற மற்றும் PACS சேவை மையங்களுக்கான இயற்பியல் ஆவண ஸ்கேனர் & குரல் வாசிப்பு அமைப்பு' 
                  : 'Overhead optical document capture & high-clarity voice assistance for rural citizens'}
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

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 bg-white dark:bg-[#0E1526]">
          <button
            type="button"
            onClick={() => setActiveTab('kiosk_scan')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'kiosk_scan'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Scan className="w-4 h-4" />
            <span>{language === 'ta' ? 'ஆவண ஸ்கேனர் & குரல் சோதனை' : 'Physical Document Scanner & Voice'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'architecture'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{language === 'ta' ? 'வன்பொருள் கட்டமைப்பு வரைபடம்' : 'Hardware Architecture Blueprint'}</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'kiosk_scan' ? (
            <div className="space-y-5">
              {/* Hardware Telemetry Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Overhead Optical</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Sony 12MP Active</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Directional Mic</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Dual MEMS Array</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">PA Speaker</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">5W Class-D Voice</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-600" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Edge Controller</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">RPi 5 Gateway</span>
                  </div>
                </div>
              </div>

              {/* Document Selection / Optical Preview */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Physical Document Selection Column */}
                <div className="md:col-span-5 space-y-3">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block uppercase tracking-wide">
                    {language === 'ta' ? 'ஸ்கேன் செய்யப்பட வேண்டிய கிராமப்புற ஆவணம்' : 'Select Physical Document on Scanner Bed'}
                  </label>

                  <div className="space-y-2">
                    {SAMPLE_PHYSICAL_DOCS.map((doc) => {
                      const isSelected = selectedDocId === doc.id;
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => setSelectedDocId(doc.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-700 shadow-xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">
                              {doc.category}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {doc.imagePlaceholder}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {language === 'ta' ? doc.titleTamil : doc.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {doc.sampleText}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>
                      {language === 'ta' 
                        ? 'உண்மை வன்பொருளில், குடிமகன் ஆவணத்தை மேஜை ஸ்கேனரின் கீழ் வைத்தவுடன் தானாகவே படம் பிடிக்கப்படும்.'
                        : 'In rural kiosk deployment, the overhead IMX477 camera continuously detects paper boundaries, automatically triggers capture, and reads aloud the legal remedy.'}
                    </span>
                  </div>
                </div>

                {/* Overhead Scanner Viewfinder */}
                <div className="md:col-span-7 flex flex-col justify-between p-4 rounded-2xl bg-slate-900 text-white min-h-[320px] relative border border-slate-800 overflow-hidden">
                  {/* Viewfinder Target Overlay */}
                  <div className="absolute inset-4 border-2 border-dashed border-indigo-400/40 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex items-center justify-between text-[10px] font-mono text-indigo-300">
                      <span>[OVERHEAD OPTICAL SENSOR 4K]</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Radio className="w-3 h-3 animate-pulse" /> LIVE BED
                      </span>
                    </div>

                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-indigo-300/60 mx-auto mb-2" />
                      <p className="text-xs font-bold text-white uppercase tracking-wider">
                        {chosenDoc.title}
                      </p>
                      <p className="text-[11px] text-slate-300 max-w-sm mx-auto mt-1 line-clamp-3">
                        {chosenDoc.sampleText}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>LIGHTING: 5500K LED ACTIVE</span>
                      <span>AUTO-RECTIFY: ON</span>
                    </div>
                  </div>

                  {/* Processing Status Overlay */}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-10">
                      <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                      <p className="text-sm font-bold text-white mb-1">
                        {language === 'ta' ? 'ஆவணம் பரிசீலிக்கப்படுகிறது...' : 'Processing Kiosk Document...'}
                      </p>
                      <p className="text-xs text-indigo-200 font-mono">
                        {processingStep}
                      </p>
                    </div>
                  )}

                  {/* Bottom Action Controls */}
                  <div className="relative z-1 mt-auto pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeCameraFeed) {
                          stopCameraStream();
                        } else {
                          startCameraStream();
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer border border-slate-700"
                    >
                      {activeCameraFeed ? 'Switch to Kiosk Sensor' : 'Test Device Webcam'}
                    </button>

                    <button
                      type="button"
                      onClick={handleCaptureAndProcess}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <Scan className="w-4 h-4" />
                      <span>{language === 'ta' ? 'ஸ்கேன் செய்து குரல் விளக்கம் பெறவும்' : 'Capture & Generate Action Plan'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Hardware Architecture & Grounding Blueprint */
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 mb-1 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  {language === 'ta' ? 'கிராமப்புற சேவை மையங்களுக்கான வன்பொருள்-மென்பொருள் இணைப்பு' : 'Rural Kiosk Hardware + Central Cloud Architecture'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {language === 'ta'
                    ? 'லெக்சோரா வன்பொருள் தொகுதியானது தனித்தனியான போலி அமைப்புகளை உருவாக்காமல், ஏற்கனவே வெற்றிகரமாக இயங்கும் லெக்சோரா சட்ட அறிவு இயந்திரத்துடன் (Legal Intelligence Engine) நேரடி பாலம் அமைக்கிறது.'
                    : 'The Hardware Assist Module does not reinvent a duplicate AI model. Instead, it provides an accessible physical bridge for rural citizens—capturing non-digital paper notices via an overhead desk scanner and delivering spoken Tamil/Hindi remedies—while heavy statutory RAG is executed on the existing central Lexora server.'}
                </p>
              </div>

              {/* 4-Stage Architectural Flow */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs mb-2">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Overhead Camera Bed</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Overhead Sony IMX477 camera + diffuse LED illuminates physical passbooks, demand notices, and rejection orders without glare.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs mb-2">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Local Edge Gateway</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Edge controller (RPi 5 / Jetson Nano) executes OpenCV perspective deskew, contrast boosting, and noise reduction.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-xs mb-2">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Lexora Cloud Engine</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    OCR extraction + Hybrid RAG matches TN Cooperative Societies Act 1983, PMFBY guidelines, or Model By-laws.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-cyan-100 dark:bg-cyan-900/60 text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-center text-xs mb-2">
                    4
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Clear Voice Readout</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Class-D voice PA reads out the appeal steps in colloquial Tamil or Hindi, bridging the rural digital and legal literacy gap.
                  </p>
                </div>
              </div>

              {/* Hardware Specifications Table */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  Component Bill of Materials (BoM) & Kiosk Integration
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">
                      <strong>Optical Sensor:</strong> 12.3MP Sony IMX477 HQ Camera with 6mm Wide-Angle Lens.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">
                      <strong>Acoustic Input:</strong> Respeaker 2-Mic array with hardware noise suppression.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">
                      <strong>Processing Hub:</strong> Raspberry Pi 5 (4GB RAM) running Linux Edge Daemon.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">
                      <strong>Rural Enclosure:</strong> Tamper-resistant kiosk podium with document alignment guide.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
