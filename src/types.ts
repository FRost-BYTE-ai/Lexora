export type Category = 
  | 'Civil' 
  | 'Criminal' 
  | 'Property' 
  | 'Consumer' 
  | 'Family Law' 
  | 'Cooperative' 
  | 'Agriculture & Schemes' 
  | 'Finance & Credit' 
  | 'General';

export type LegalDomain = 
  | 'cooperative_law'
  | 'cooperative_governance'
  | 'pacs'
  | 'agriculture'
  | 'government_schemes'
  | 'crop_insurance'
  | 'financial_literacy'
  | 'grievance'
  | 'property' 
  | 'family' 
  | 'employment' 
  | 'consumer' 
  | 'criminal' 
  | 'finance' 
  | 'government' 
  | 'general';

export type Jurisdiction = 'TN' | 'IN';

export type LanguageMode = 'ta' | 'en' | 'tanglish' | 'hi';

export type ExplanationLevel = 'citizen' | 'student' | 'professional' | 'simple_tamil';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface LegalSource {
  title: string;
  section?: string;
  act?: string;
  source?: string;
  url?: string;
  last_verified?: string;
}

export interface ActionStep {
  order: number;
  title: string;
  description: string;
  authority?: string;
  timeline?: string;
}

export interface ExplainabilityData {
  queryUnderstood: string;
  detectedLanguage: string;
  legalDomain: string;
  sourcesRetrievedCount: number;
  relevantProvisionsCount: number;
  provisionsList?: string[];
  confidence: 'High' | 'Medium' | 'Low';
  verificationStatus: 'Grounded' | 'Verified with Statutes' | 'Informational Guidance';
  jurisdictionApplied: 'Tamil Nadu' | 'All India';
  keyFactors?: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  category?: Category;
  domain?: LegalDomain;
  language?: LanguageMode;
  jurisdiction?: Jurisdiction;
  explanationLevel?: ExplanationLevel;
  sources?: LegalSource[];
  risk_level?: RiskLevel;
  risk_reason?: string;
  action_plan?: ActionStep[];
  follow_up_questions?: string[];
  explainability?: ExplainabilityData;
  translation?: {
    translatedContent: string;
    targetLanguage: LanguageMode;
    isShowingTranslation?: boolean;
    isTranslating?: boolean;
  };
  documentMeta?: {
    fileName: string;
    fileSize: string;
    fileType: string;
    ocrSource?: 'webcam_doc_cam' | 'upload_file' | 'kiosk_scanner';
  };
  schemeData?: GovernmentScheme;
}

export interface LegalContext {
  title: string;
  content: string;
  source: string;
}

export type DraftType = 
  | 'cooperative_grievance'
  | 'pmfby_claim_appeal'
  | 'pacs_membership_appeal'
  | 'rti' 
  | 'consumer_complaint' 
  | 'legal_notice' 
  | 'grievance_letter' 
  | 'representation' 
  | 'tenancy_notice';

export interface DraftRequest {
  draftType: DraftType;
  applicantName: string;
  respondentName: string;
  jurisdiction: Jurisdiction;
  language: LanguageMode;
  facts: string;
  reliefSought: string;
  specificDetails?: Record<string, string>;
}

export interface LegalLibraryItem {
  id: string;
  title: string;
  titleTamil: string;
  category: 
    | 'Cooperative Laws'
    | 'Cooperative By-laws'
    | 'Government Schemes'
    | 'Crop Insurance & PMFBY'
    | 'Constitution' 
    | 'Acts' 
    | 'Rules & Regulations' 
    | 'Citizen Rights' 
    | 'Court Procedures' 
    | 'Government Services' 
    | 'Legal FAQs' 
    | 'Tamil Nadu Laws';
  jurisdiction: Jurisdiction;
  summary: string;
  summaryTamil: string;
  keySections: string[];
  officialSource: string;
  url?: string;
}

export interface GovernmentScheme {
  id: string;
  name: string;
  nameTamil: string;
  category: 'Cooperative' | 'Agriculture' | 'Insurance' | 'Credit' | 'Storage & Infra';
  eligibility: string;
  eligibilityTamil: string;
  requiredDocuments: string[];
  requiredDocumentsTamil: string[];
  applicationProcess: string;
  applicationProcessTamil: string;
  relevantAuthority: string;
  relevantAuthorityTamil: string;
  officialSource: string;
  portalUrl?: string;
  keyBenefits: string;
  keyBenefitsTamil: string;
  schemeStatus: 'Active' | 'Updated Guidelines 2024-25';
}

export interface HardwareAssistStatus {
  deviceId: string;
  deviceName: string;
  cameraStatus: 'ready' | 'capturing' | 'standby' | 'error';
  micStatus: 'ready' | 'listening' | 'idle';
  speakerStatus: 'ready' | 'speaking' | 'muted';
  edgeController: string;
  connectionType: 'Wi-Fi 802.11 b/g/n' | 'USB Edge Link' | 'Local Rural Kiosk Hub';
  cloudSyncStatus: 'Connected to Lexora Server' | 'Synchronizing' | 'Offline';
  latencyMs: number;
  mode: 'Hardware + Software Gateway';
  developmentPhase: 'Existing Software Document Engine + Proposed Kiosk Enclosure';
}
