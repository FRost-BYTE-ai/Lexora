export type Category = 'Civil' | 'Criminal' | 'Property' | 'Consumer' | 'Family Law' | 'General';

export type LegalDomain = 
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
  };
}

export interface LegalContext {
  title: string;
  content: string;
  source: string;
}

export type DraftType = 
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
  category: 'Constitution' | 'Acts' | 'Rules & Regulations' | 'Citizen Rights' | 'Court Procedures' | 'Government Services' | 'Legal FAQs' | 'Tamil Nadu Laws';
  jurisdiction: Jurisdiction;
  summary: string;
  summaryTamil: string;
  keySections: string[];
  officialSource: string;
  url?: string;
}
