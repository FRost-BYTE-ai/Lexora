import { 
  LegalDomain, 
  Jurisdiction, 
  LanguageMode, 
  ExplanationLevel, 
  Message, 
  DraftRequest, 
  LegalLibraryItem 
} from '../types';

export interface ChatApiRequest {
  query: string;
  language: LanguageMode;
  domain: LegalDomain;
  jurisdiction: Jurisdiction;
  explanation_level: ExplanationLevel;
}

export interface ChatApiResponse {
  answer: string;
  language: LanguageMode;
  domain: string;
  jurisdiction: Jurisdiction;
  risk_level: 'low' | 'medium' | 'high';
  risk_reason: string;
  sources: Array<{
    title: string;
    section?: string;
    act?: string;
    source?: string;
    url?: string;
    last_verified?: string;
  }>;
  action_plan: Array<{
    order: number;
    title: string;
    description: string;
    authority?: string;
    timeline?: string;
  }>;
  follow_up_questions: string[];
  verification_status: string;
  explainability: {
    queryUnderstood: string;
    detectedLanguage: string;
    legalDomain: string;
    sourcesRetrievedCount: number;
    relevantProvisionsCount: number;
    provisionsList: string[];
    confidence: 'High' | 'Medium' | 'Low';
    verificationStatus: 'Grounded' | 'Verified with Statutes' | 'Informational Guidance';
    jurisdictionApplied: 'Tamil Nadu' | 'All India';
    keyFactors: string[];
  };
}

export async function sendLegalQuery(req: ChatApiRequest): Promise<ChatApiResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.statusText}`);
  }

  return response.json();
}

export async function classifyQueryApi(text: string): Promise<{ domain: LegalDomain; category: string; confidence: number }> {
  try {
    const response = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (response.ok) {
      return response.json();
    }
  } catch (err) {
    console.warn('Local classify fallback active', err);
  }

  return { domain: 'general', category: 'General', confidence: 0.85 };
}

export async function translateTextApi(text: string, targetLang: 'ta' | 'en' | 'hi'): Promise<string> {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLang })
  });

  if (!response.ok) {
    throw new Error('Translation failed');
  }

  const data = await response.json();
  return data.translatedText;
}

export async function uploadLegalDocumentApi(file: File, snippet?: string, language?: LanguageMode) {
  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      contentSnippet: snippet || `Uploaded legal document: ${file.name}`,
      language: language || 'ta'
    })
  });

  if (!response.ok) {
    throw new Error('Document analysis failed');
  }

  return response.json();
}

export async function generateLegalDraftApi(req: DraftRequest) {
  const response = await fetch('/api/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });

  if (!response.ok) {
    throw new Error('Draft generation failed');
  }

  return response.json();
}

export async function fetchLegalLibraryApi(params?: { category?: string; jurisdiction?: Jurisdiction; search?: string }): Promise<LegalLibraryItem[]> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== 'All') query.append('category', params.category);
  if (params?.jurisdiction) query.append('jurisdiction', params.jurisdiction);
  if (params?.search) query.append('search', params.search);

  const response = await fetch(`/api/legal-library?${query.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch legal library');
  }

  const data = await response.json();
  return data.items || [];
}
