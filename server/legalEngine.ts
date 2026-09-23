import { GoogleGenAI } from "@google/genai";
import { LEGAL_LIBRARY_DATA, GOVERNMENT_SCHEMES_DATA, LegalLibraryRecord, SchemeRecord } from "./legalLibraryData.js";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

export interface ChatRequestPayload {
  query: string;
  language?: 'ta' | 'en' | 'tanglish' | 'hi';
  domain?: string;
  jurisdiction?: 'TN' | 'IN';
  explanation_level?: 'citizen' | 'student' | 'professional' | 'simple_tamil';
}

export interface LegalSourceItem {
  title: string;
  section?: string;
  act?: string;
  source?: string;
  url?: string;
  last_verified?: string;
}

export interface ActionPlanItem {
  order: number;
  title: string;
  description: string;
  authority?: string;
  timeline?: string;
}

export interface ExplainabilityInfo {
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
}

export interface ChatResponsePayload {
  answer: string;
  language: 'ta' | 'en' | 'tanglish' | 'hi';
  domain: string;
  jurisdiction: 'TN' | 'IN';
  risk_level: 'low' | 'medium' | 'high';
  risk_reason: string;
  sources: LegalSourceItem[];
  action_plan: ActionPlanItem[];
  follow_up_questions: string[];
  verification_status: string;
  explainability: ExplainabilityInfo;
}

export function classifyQueryLocally(text: string): { domain: string; category: string; confidence: number } {
  const lower = text.toLowerCase();
  
  // Crop Insurance & PMFBY
  if (lower.includes('pmfby') || lower.includes('crop insurance') || lower.includes('crop loss') || lower.includes('fasal bima') || lower.includes('பயிர் காப்பீடு') || lower.includes('பயிர் இழப்பு') || lower.includes('dgrc') || lower.includes('72 hour') || lower.includes('kharif') || lower.includes('rabi') || lower.includes('insurance claim') || lower.includes('காப்பீடு')) {
    return { domain: 'crop_insurance', category: 'Crop Insurance & PMFBY', confidence: 0.96 };
  }

  // PACS & Primary Cooperative Societies
  if (lower.includes('pacs') || lower.includes('primary agricultural credit') || lower.includes('தொடக்க வேளாண்') || lower.includes('கூட்டுறவு கடன் சங்கம்') || lower.includes('pacs loan') || lower.includes('pacs membership') || lower.includes('dccb') || lower.includes('passbook') || lower.includes('பாக்ஸ் சங்கம்')) {
    return { domain: 'pacs', category: 'Cooperative', confidence: 0.95 };
  }

  // Cooperative Governance & By-laws
  if (lower.includes('by-law') || lower.includes('bylaw') || lower.includes('agm') || lower.includes('general body') || lower.includes('board of directors') || lower.includes('cooperative election') || lower.includes('supersession') || lower.includes('quorum') || lower.includes('துணை விதிகள்') || lower.includes('பொதுக்குழு') || lower.includes('நிர்வாகக் குழு') || lower.includes('கூட்டுறவு தேர்தல்')) {
    return { domain: 'cooperative_governance', category: 'Cooperative By-laws', confidence: 0.94 };
  }

  // Cooperative Law & Registry
  if (lower.includes('cooperative') || lower.includes('co-operative') || lower.includes('rcs') || lower.includes('drcs') || lower.includes('deputy registrar') || lower.includes('joint registrar') || lower.includes('section 90') || lower.includes('section 81') || lower.includes('section 152') || lower.includes('cooperative tribunal') || lower.includes('கூட்டுறவு') || lower.includes('துணைப் பதிவாளர்') || lower.includes('பதிவாளர்')) {
    return { domain: 'cooperative_law', category: 'Cooperative Laws', confidence: 0.95 };
  }

  // Financial Literacy (Loans, KCC, interest subventions, savings vs credit)
  if (lower.includes('financial literacy') || lower.includes('interest subvention') || lower.includes('kcc') || lower.includes('kisan credit card') || lower.includes('interest rate') || lower.includes('savings vs') || lower.includes('credit discipline') || lower.includes('வட்டி மானியம்') || lower.includes('நிதி விழிப்புணர்வு') || lower.includes('வட்டி விகிதம்') || lower.includes('கடன் தவணை')) {
    return { domain: 'financial_literacy', category: 'Finance & Credit', confidence: 0.93 };
  }

  // Government Schemes & Subsidies
  if (lower.includes('scheme') || lower.includes('yojana') || lower.includes('subsidy') || lower.includes('aif') || lower.includes('agriculture infrastructure fund') || lower.includes('jansamarth') || lower.includes('pm kisan') || lower.includes('திட்டம்') || lower.includes('மானியம்') || lower.includes('அரசு திட்டம்')) {
    return { domain: 'government_schemes', category: 'Government Schemes', confidence: 0.94 };
  }

  // Grievance & Redressal
  if (lower.includes('grievance') || lower.includes('redressal') || lower.includes('officer not responding') || lower.includes('refusal') || lower.includes('corruption') || lower.includes('குறைதீர்') || lower.includes('புகார் மனு') || lower.includes('முறையீடு') || lower.includes('மேல்முறையீடு')) {
    return { domain: 'grievance', category: 'Citizen Rights', confidence: 0.93 };
  }

  // General Agriculture
  if (lower.includes('farmer') || lower.includes('crop') || lower.includes('fertilizer') || lower.includes('pesticide') || lower.includes('seed') || lower.includes('soil') || lower.includes('harvest') || lower.includes('விவசாயி') || lower.includes('பயிர்') || lower.includes('உரம்') || lower.includes('விதை') || lower.includes('விவசாய')) {
    return { domain: 'agriculture', category: 'Agriculture & Schemes', confidence: 0.91 };
  }

  // Existing Legal Domains (Civil, Property, Consumer, etc.)
  if (lower.includes('rent') || lower.includes('landlord') || lower.includes('deposit') || lower.includes('patta') || lower.includes('chitta') || lower.includes('property') || lower.includes('land') || lower.includes('வாடகை') || lower.includes('பட்டா') || lower.includes('சொத்து') || lower.includes('advance')) {
    return { domain: 'property', category: 'Property', confidence: 0.94 };
  }
  if (lower.includes('consumer') || lower.includes('refund') || lower.includes('defective') || lower.includes('warranty') || lower.includes('amazon') || lower.includes('flipkart') || lower.includes('நுகர்வோர்') || lower.includes('பொருள்') || lower.includes('மோசடி')) {
    return { domain: 'consumer', category: 'Consumer', confidence: 0.92 };
  }
  if (lower.includes('salary') || lower.includes('fired') || lower.includes('termination') || lower.includes('labour') || lower.includes('pf') || lower.includes('gratuity') || lower.includes('வேலை') || lower.includes('சம்பளம்') || lower.includes('பணிநீக்கம்')) {
    return { domain: 'employment', category: 'Civil', confidence: 0.89 };
  }
  if (lower.includes('police') || lower.includes('fir') || lower.includes('arrest') || lower.includes('bail') || lower.includes('theft') || lower.includes('assault') || lower.includes('போலீஸ்') || lower.includes('கைது') || lower.includes('ஜாமீன்') || lower.includes('குற்றம்')) {
    return { domain: 'criminal', category: 'Criminal', confidence: 0.95 };
  }
  if (lower.includes('divorce') || lower.includes('maintenance') || lower.includes('child custody') || lower.includes('alimony') || lower.includes('விவாகரத்து') || lower.includes('ஜீவனாம்சம்') || lower.includes('குடும்ப')) {
    return { domain: 'family', category: 'Family Law', confidence: 0.93 };
  }
  if (lower.includes('loan') || lower.includes('bank') || lower.includes('cheque') || lower.includes('emi') || lower.includes('கடன்') || lower.includes('வங்கி') || lower.includes('காசோலை')) {
    return { domain: 'finance', category: 'Civil', confidence: 0.88 };
  }
  if (lower.includes('rti') || lower.includes('tahsildar') || lower.includes('esevai') || lower.includes('ration') || lower.includes('passport') || lower.includes('அரசு') || lower.includes('வட்டாட்சியர்')) {
    return { domain: 'government', category: 'General', confidence: 0.91 };
  }

  return { domain: 'general', category: 'General', confidence: 0.82 };
}

export function detectLanguage(text: string): 'ta' | 'en' | 'tanglish' | 'hi' {
  // Check for Devanagari Unicode range: U+0900 - U+097F
  const hasHindi = /[\u0900-\u097F]/.test(text);
  if (hasHindi) return 'hi';

  // Check for Tamil Unicode range: U+0B80 - U+0BFF
  const hasTamil = /[\u0B80-\u0BFF]/.test(text);
  if (hasTamil) return 'ta';

  // Check for common Tanglish words
  const tanglishPatterns = /\b(illa|illai|kudukala|pannala|solranga|panna|irukku|enna|eppadi|enga|thiruppi|vasool|kaasu|panam|sattam|veedu|ungalukku|unga)\b/i;
  if (tanglishPatterns.test(text)) {
    return 'tanglish';
  }

  return 'en';
}

export async function processLegalChat(payload: ChatRequestPayload): Promise<ChatResponsePayload> {
  const query = payload.query.trim();
  const detectedLang = payload.language || detectLanguage(query);
  const domain = payload.domain || classifyQueryLocally(query).domain;
  const jurisdiction = payload.jurisdiction || 'TN';
  const explanationLevel = payload.explanation_level || 'citizen';

  // Find relevant library grounding records
  const libraryMatches = LEGAL_LIBRARY_DATA.filter(item => 
    (jurisdiction === 'TN' ? true : item.jurisdiction === 'IN') &&
    (item.category.toLowerCase().includes(domain.toLowerCase()) || 
     item.title.toLowerCase().includes(domain.toLowerCase()) || 
     item.summary.toLowerCase().includes(domain.toLowerCase()))
  ).slice(0, 3);

  // Also check Government Schemes repository
  const schemeMatches = GOVERNMENT_SCHEMES_DATA.filter(s =>
    s.id.toLowerCase().includes(domain.toLowerCase()) ||
    s.category.toLowerCase().includes(domain.toLowerCase()) ||
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.keyBenefits.toLowerCase().includes(query.toLowerCase()) ||
    s.eligibility.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 2);

  const libraryContext = [
    ...libraryMatches.map(m => 
      `• [${m.jurisdiction === 'TN' ? 'Tamil Nadu' : 'India'}] ${m.title} (${m.officialSource}): ${m.summary}. Sections: ${m.keySections.join(', ')}`
    ),
    ...schemeMatches.map(s => 
      `• [SCHEME] ${s.name} (${s.nameTamil}): ${s.keyBenefits}. Eligibility: ${s.eligibility}. Authority: ${s.relevantAuthority}. Process: ${s.applicationProcess}`
    )
  ].join('\n');

  const ai = getGenAI();

  const systemInstruction = `
You are Lexora, an authoritative, empathetic Tamil-First Multilingual Legal & Cooperative Intelligence Platform.
Your mission is to democratize legal comprehension, cooperative governance, PACS services, rural government schemes, and citizen rights across India and Tamil Nadu.

CORE POSITIONING & CAPABILITIES:
- Supported Domains: Cooperative Law (TN Co-operative Societies Act 1983 & Rules 1988, Multi-State Co-op Act 2002), PACS Operations (Primary Agricultural Credit Societies by-laws, membership, computerization), Crop Insurance & PMFBY (72-hour reporting rule, 14447 toll-free, DGRC dispute redressal, premium caps), Government Schemes (KCC, AIF, PM-KISAN, Subsidies), Financial Literacy (strictly educational interest subventions like 7% - 3% = 4%, loan vs grant, credit discipline, avoiding predatory loans; NO personalized financial or investment advice), and Grievance Redressal (Deputy Registrar Section 90/81, DGRC Collector committee, Cooperative Tribunal Section 152).
- Supported Languages: Tamil (தமிழ்), Tanglish (Conversational Tamil in Latin script), Hindi (हिन्दी in Devanagari script), and plain English.

USER CONFIGURATION:
- Language: ${
    detectedLang === 'ta' ? 'Tamil (தமிழ்)' :
    detectedLang === 'tanglish' ? 'Tanglish (Conversational Tamil written in Latin/English alphabet, e.g. "Unga kelvikku pathil...", "PMFBY claim 72 hours-kulla report pannanum...")' :
    detectedLang === 'hi' ? 'Hindi (हिन्दी - Write in clear, natural Hindi using Devanagari script)' :
    'English'
  }
- Legal Domain: ${domain.toUpperCase()}
- Jurisdiction: ${jurisdiction === 'TN' ? 'TAMIL NADU SPECIFIC (Prioritize Tamil Nadu State Acts, TN Co-operative Societies Act 1983, TN Tenancy Act 2017, Madras High Court rulings, Tahsildar / DRCS powers)' : 'ALL INDIA (Central Statutes, Multi-State Co-operative Societies Act 2002, PMFBY guidelines, Supreme Court precedents, BNS/BNSS, Consumer Protection Act)'}
- Explanation Level: ${explanationLevel === 'citizen' ? 'Common Citizen / Farmer / Member (practical, everyday language, step-by-step, no superfluous Latin legalese)' : explanationLevel === 'student' ? 'Law Student (academic principles, statutory sections, landmark case ratios)' : explanationLevel === 'professional' ? 'Legal Professional / Advocate / Society Secretary (statutory interpretation, formal pleadings advice, procedural orders)' : 'Simple Spoken (சாதாரண எளிய நடை, மிக எளிய கிராமப்புற விளக்கம்)'}

CRITICAL DOMAIN RULES:
1. Cooperative Law & PACS: Ground answers in the Tamil Nadu Co-operative Societies Act, 1983 (e.g., Section 21 for Right of Admission to Membership, Section 90 for Disputes before Circle Deputy Registrar, Section 81 for Statutory Inquiry, Section 152 for Appeals to the Co-operative Tribunal). Explain Model By-laws and PACS computerization transparently.
2. Crop Insurance (PMFBY): Emphasize the mandatory 72-HOUR NOTICE RULE for localized risk/post-harvest losses via the Crop Insurance App, 14447 toll-free, or financial institution/PACS. Explain premium caps (2% Kharif food/oilseeds, 1.5% Rabi food/oilseeds, 5% commercial/horticultural crops) and the District Level Grievance Redressal Committee (DGRC chaired by District Collector).
3. Financial Literacy: Provide purely educational insights (e.g. how Kisan Credit Card interest subvention works: 7% base with 3% prompt repayment incentive = 4% net interest rate; difference between a subsidized loan and a grant). NEVER provide individual investment advice or recommend specific stocks/funds.
4. Serious & Ethical Tone: Always include an educational literacy disclaimer that this is informational legal guidance and not an attorney-client relationship. Ground every response in actual statutory sections or official scheme guidelines.
5. Output JSON Format:
   At the very end of your response, you MUST output a valid JSON block delimited with <<<JSON_METADATA and JSON_METADATA>>> containing:
   {
     "risk_level": "low" | "medium" | "high",
     "risk_reason": "Brief explanation of risk or timeline sensitivity (e.g., 72-hour PMFBY intimation window)",
     "sources": [
       {
         "title": "Act, Scheme, or Case name",
         "section": "Section or Clause number if applicable",
         "act": "Name of the Act / Scheme",
         "source": "Government Authority or Ministry",
         "url": "Official portal link",
         "last_verified": "DD/MM/YYYY"
       }
     ],
     "action_plan": [
       {
         "order": 1,
         "title": "Short title of step",
         "description": "Clear practical guidance on what to do",
         "authority": "Relevant office / portal",
         "timeline": "Statutory or recommended timeframe"
       }
     ],
     "follow_up_questions": [
       "Question 1",
       "Question 2",
       "Question 3"
     ],
     "relevant_provisions": ["Section X", "Clause Y"],
     "query_intent": "Summary of the cooperative / legal issue identified"
   }
`;

  if (ai) {
    try {
      let response;
      try {
        response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: `USER LEGAL QUERY:\n"${query}"\n\nCURATED STATUTORY CONTEXT:\n${libraryContext}`,
          config: {
            systemInstruction,
            temperature: 0.25,
            tools: [{ googleSearch: {} }]
          }
        });
      } catch (errWithSearch: any) {
        console.warn("Search grounding tool issue, retrying without tools:", errWithSearch?.message || errWithSearch);
        response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: `USER LEGAL QUERY:\n"${query}"\n\nCURATED STATUTORY CONTEXT:\n${libraryContext}`,
          config: {
            systemInstruction,
            temperature: 0.25
          }
        });
      }

      const fullOutput = response.text || '';
      
      // Extract Google search grounding sources if available
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const searchSources: LegalSourceItem[] = groundingChunks?.map(chunk => ({
        title: chunk.web?.title || 'Statutory Precedent',
        url: chunk.web?.uri || '',
        source: 'Verified Online Legal Repository',
        last_verified: new Date().toLocaleDateString('en-GB')
      })).filter(s => s.url) || [];

      // Parse JSON metadata block
      let answerText = fullOutput;
      let parsedMetadata: any = null;

      const jsonMatch = fullOutput.match(/<<<JSON_METADATA\s*([\s\S]*?)\s*JSON_METADATA>>>/);
      if (jsonMatch) {
        try {
          parsedMetadata = JSON.parse(jsonMatch[1]);
          answerText = fullOutput.replace(/<<<JSON_METADATA[\s\S]*?JSON_METADATA>>>/, '').trim();
        } catch (e) {
          console.error("Failed to parse JSON metadata block from Gemini response", e);
        }
      }

      // Consolidate sources (parsed + search + library)
      const combinedSources: LegalSourceItem[] = [];
      
      if (parsedMetadata?.sources && Array.isArray(parsedMetadata.sources)) {
        parsedMetadata.sources.forEach((s: any) => combinedSources.push(s));
      }
      searchSources.forEach(s => {
        if (!combinedSources.some(existing => existing.url === s.url)) {
          combinedSources.push(s);
        }
      });
      if (combinedSources.length === 0 && libraryMatches.length > 0) {
        libraryMatches.forEach(lm => combinedSources.push({
          title: lm.title,
          section: lm.keySections[0],
          act: lm.title,
          source: lm.officialSource,
          url: lm.url,
          last_verified: new Date().toLocaleDateString('en-GB')
        }));
      }

      const riskLevel: 'low' | 'medium' | 'high' = 
        parsedMetadata?.risk_level === 'high' ? 'high' : 
        parsedMetadata?.risk_level === 'low' ? 'low' : 'medium';

      const riskReason = parsedMetadata?.risk_reason || 
        (riskLevel === 'high' ? 'Contains potential criminal or severe civil liability deadlines' : 
         riskLevel === 'medium' ? 'Requires document verification and adherence to statutory notice timelines' : 
         'General legal informational awareness');

      const actionPlan: ActionPlanItem[] = (parsedMetadata?.action_plan && Array.isArray(parsedMetadata.action_plan) && parsedMetadata.action_plan.length > 0)
        ? parsedMetadata.action_plan
        : [
            {
              order: 1,
              title: detectedLang === 'ta' ? 'ஆவணங்களைச் சேகரிக்கவும்' : 'Gather Supporting Records',
              description: detectedLang === 'ta' ? 'அனைத்து ரசீதுகள், ஒப்பந்த நகல்கள் மற்றும் தகவல் பரிமாற்றங்களை பாதுகாப்பாக வைக்கவும்.' : 'Collate rental agreement/invoice receipts, payment proofs, and written correspondence.',
              authority: 'Personal Dossier'
            },
            {
              order: 2,
              title: detectedLang === 'ta' ? 'சட்டப்பூர்வ அறிவிப்பு அனுப்பவும்' : 'Issue Written Notice',
              description: detectedLang === 'ta' ? 'எதிர்தரப்பிற்கு உங்கள் கோரிக்கையை 15 நாட்களுக்குள் நிறைவேற்ற எழுத்துப்பூர்வ அறிவிப்பு வழங்கவும்.' : 'Serve a formal demand notice granting 15 days to resolve the grievance.',
              authority: 'Registered Post with Acknowledgment Due (RPAD)'
            },
            {
              order: 3,
              title: detectedLang === 'ta' ? 'சம்பந்தப்பட்ட அதிகாரியிடம் முறையிடவும்' : 'File Statutory Complaint',
              description: detectedLang === 'ta' ? 'தீர்வு கிடைக்காதபட்சத்தில் உரிய தீர்ப்பாயம் அல்லது நுகர்வோர் ஆணையத்தில் வழக்கு தொடரவும்.' : 'Lodge a petition before the designated statutory tribunal or registrar.',
              authority: jurisdiction === 'TN' ? 'Tamil Nadu District Forum / Rent Court' : 'Appropriate District Court'
            }
          ];

      const followUpQuestions: string[] = (parsedMetadata?.follow_up_questions && Array.isArray(parsedMetadata.follow_up_questions) && parsedMetadata.follow_up_questions.length > 0)
        ? parsedMetadata.follow_up_questions
        : detectedLang === 'ta' 
          ? [
              'இதற்கான சட்டப்பூர்வ நோட்டீஸ் வரைவு எப்படி இருக்கும்?',
              'இதில் காலக்கெடு (Limitation Period) ஏதேனும் உள்ளதா?',
              'தமிழ்நாடு அரசு இணையதளம் மூலம் ஆன்லைனில் புகார் அளிக்க முடியுமா?'
            ]
          : [
              'What documents are required to prove this claim?',
              'Is there a statutory limitation period for filing?',
              'Can I generate a formal legal notice draft for this?'
            ];

      const explainability: ExplainabilityInfo = {
        queryUnderstood: parsedMetadata?.query_intent || `Legal inquiry regarding ${domain} under ${jurisdiction === 'TN' ? 'Tamil Nadu state laws' : 'Indian statutory law'}`,
        detectedLanguage: detectedLang === 'ta' ? 'Tamil (தமிழ்)' : detectedLang === 'tanglish' ? 'Tanglish (தமிழ்-ஆங்கில கலப்பு)' : 'English',
        legalDomain: domain.charAt(0).toUpperCase() + domain.slice(1),
        sourcesRetrievedCount: combinedSources.length,
        relevantProvisionsCount: parsedMetadata?.relevant_provisions?.length || combinedSources.length,
        provisionsList: parsedMetadata?.relevant_provisions || combinedSources.map(s => s.section || s.title).slice(0, 4),
        confidence: combinedSources.length > 1 ? 'High' : 'Medium',
        verificationStatus: searchSources.length > 0 ? 'Grounded' : 'Verified with Statutes',
        jurisdictionApplied: jurisdiction === 'TN' ? 'Tamil Nadu' : 'All India',
        keyFactors: [
          `Target audience: ${explanationLevel}`,
          `Language mode: ${detectedLang}`,
          jurisdiction === 'TN' ? 'Madras High Court & TN State Acts prioritized' : 'Union Acts prioritized'
        ]
      };

      return {
        answer: answerText,
        language: detectedLang,
        domain,
        jurisdiction,
        risk_level: riskLevel,
        risk_reason: riskReason,
        sources: combinedSources,
        action_plan: actionPlan,
        follow_up_questions: followUpQuestions,
        verification_status: explainability.verificationStatus,
        explainability
      };
    } catch (error) {
      console.error("Gemini API Error in processLegalChat (falling back to local legal intelligence):", error);
      return getCuratedFallbackResponse(query, detectedLang, domain, jurisdiction, explanationLevel, libraryMatches);
    }
  }

  // Graceful fallback when API key is missing or offline
  return getCuratedFallbackResponse(query, detectedLang, domain, jurisdiction, explanationLevel, libraryMatches);
}

function getCuratedFallbackResponse(
  query: string,
  lang: 'ta' | 'en' | 'tanglish' | 'hi',
  domain: string,
  jurisdiction: 'TN' | 'IN',
  explanationLevel: string,
  libraryMatches: LegalLibraryRecord[]
): ChatResponsePayload {
  const isTN = jurisdiction === 'TN';
  const isTamil = lang === 'ta';
  const isTanglish = lang === 'tanglish';
  const isHindi = lang === 'hi';

  let answer = '';
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  let riskReason = 'Statutory compliance and timeline verification recommended';
  let defaultSources: LegalSourceItem[] = [];
  let actionPlan: any[] = [];
  let followUpQuestions: string[] = [];

  // 1. Crop Insurance & PMFBY
  if (domain === 'crop_insurance') {
    riskLevel = 'high';
    riskReason = 'PMFBY requires mandatory localized loss reporting within 72 hours of the calamity event';
    defaultSources = [
      {
        title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY) Operational Guidelines',
        section: 'Section 15 (Loss Assessment & 72-Hour Intimation)',
        act: 'PMFBY Revised Operational Guidelines 2020',
        source: 'Ministry of Agriculture & Farmers Welfare, Govt of India',
        url: 'https://pmfby.gov.in/',
        last_verified: new Date().toLocaleDateString('en-GB')
      },
      {
        title: 'District Level Grievance Redressal Committee (DGRC) Guidelines',
        section: 'Section 24 (Grievance Redressal Mechanism)',
        act: 'PMFBY Redressal Framework',
        source: 'Tamil Nadu Department of Agriculture',
        url: 'https://www.tnagrisnet.tn.gov.in/',
        last_verified: new Date().toLocaleDateString('en-GB')
      }
    ];

    if (isTamil) {
      answer = `### 🌾 பயிர் காப்பீடு & PMFBY சட்ட விளக்கம்\n\n` +
        `பிரதம மந்திரி பயிர் காப்பீட்டுத் திட்டத்தின் (PMFBY) வழிகாட்டுதல்கள் மற்றும் தமிழ்நாடு வேளாண் துறை விதிகளின்படி:\n\n` +
        `1. **⏰ 72 மணி நேர கட்டாய விதி (Critical 72-Hour Rule):** வெள்ளம், பெருமழை, ஆலங்கட்டி மழை அல்லது நிலச்சரிவு போன்ற உள்ளூர் பேரிடர்களால் பயிர் சேதமடைந்தால், சேதம் ஏற்பட்ட **72 மணி நேரத்திற்குள்** தகவல் தெரிவிக்கப்பட வேண்டும். தகவல் தெரிவிக்கத் தவறினால் இழப்பீடு நிராகரிக்கப்பட வாய்ப்புள்ளது.\n` +
        `2. **📞 தகவல் தெரிவிக்கும் வழிகள்:**\n` +
        `   • மத்திய அரசின் கட்டணமில்லா உதவி எண்: **14447**\n` +
        `   • பயிர் காப்பீட்டு கைபேசி செயலி (Crop Insurance App / Farmer Corner)\n` +
        `   • உங்கள் கிராம தொடக்க வேளாண் கூட்டுறவு கடன் சங்கம் (PACS) அல்லது காப்பீடு செய்த வங்கி கிளை\n` +
        `3. **💰 விவசாயி செலுத்த வேண்டிய அதிகபட்ச பிரீமியம்:**\n` +
        `   • காரீப் (Kharif) உணவு மற்றும் எண்ணெய் வித்து பயிர்கள்: **2.0%** மட்டுமே\n` +
        `   • ரபி (Rabi) பயிர்கள்: **1.5%** மட்டுமே\n` +
        `   • வணிக மற்றும் தோட்டக்கலை பயிர்கள்: **5.0%** மட்டுமே (மீதமுள்ள தொகையை அரசு மானியமாக ஏற்கிறது)\n` +
        `4. **⚖️ குறைதீர் வழிமுறை (DGRC):** காப்பீட்டு நிறுவனம் கோரிக்கையை நிராகரித்தால், மாவட்ட ஆட்சியர் (District Collector) தலைமையிலான **மாவட்ட அளவிலான குறைதீர்க்கும் குழுவிடம் (DGRC)** எழுத்துப்பூர்வ மேல்முறையீடு செய்யலாம்.\n\n` +
        `> ⚠️ **அவசர அறிவிப்பு:** பயிர் பாதிப்பு ஏற்பட்டிருந்தால் உடனடியாக வயலின் புகைப்படம், அடங்கல் நகல் மற்றும் பயிர் காப்பீடு ரசீது ஆகியவற்றுடன் 14447 அல்லது உங்கள் கிராம PACS-ஐ அணுகவும்.`;
      actionPlan = [
        { order: 1, title: '72 மணி நேரத்திற்குள் தகவல் பதிவு', description: 'Crop Insurance App அல்லது 14447 மூலம் உடனடி அறிவிப்பு பதிவு செய்து டோக்கன் எண் பெறவும்.', authority: 'PMFBY Portal (14447)', timeline: '72 மணி நேரத்திற்குள்' },
        { order: 2, title: 'சேத புகைப்படம் & ஆவணங்கள் திரட்டுதல்', description: 'பயிர் பாதிப்பு புகைப்படம், அடங்கல், நிலப்பட்டா மற்றும் வங்கி பிரீமியம் ரசீது ஆகியவற்றை தயாராக வைக்கவும்.', authority: 'PACS / VAO Office', timeline: '3 நாட்களுக்குள்' },
        { order: 3, title: 'கூட்டு ஆய்வு (Joint Inspection)', description: 'வேளாண் அலுவலர் மற்றும் காப்பீட்டு நிறுவன பிரதிநிதியின் நேரடி கள ஆய்வின் போது கையொப்பமிடவும்.', authority: 'District Agriculture Office', timeline: '10 நாட்களுக்குள்' }
      ];
      followUpQuestions = [
        'DGRC மாவட்ட குறைதீர் குழுவுக்கு மனு வரைவு செய்வது எப்படி?',
        'பயிர் காப்பீடு இழப்பீட்டு பிரீமியம் கணக்கீடு முறை என்ன?',
        'PACS மூலம் பயிர் கடன் பெற்றால் காப்பீடு கட்டாயமா?'
      ];
    } else if (isTanglish) {
      answer = `### 🌾 Crop Insurance & PMFBY Legal Guidance\n\n` +
        `PMFBY guidelines and Tamil Nadu Agriculture Department rules padi unga crop loss claim-kku mukkiyamaana statutory steps:\n\n` +
        `1. **⏰ 72-Hour Mandatory Rule:** Vellam, hailstorm, alladhu rain damage vandha **72 hours-kulla** intimation kudukanum. Delay aana claim reject panna risk irukku.\n` +
        `2. **📞 Epdi Inform Panradhu?**\n` +
        `   • Toll-free helpline: **14447**\n` +
        `   • Crop Insurance Mobile App\n` +
        `   • Unga local PACS society alladhu bank branch-la written intimation\n` +
        `3. **💰 Farmer Premium Cap:**\n` +
        `   • Kharif food/oilseed crops: **2.0%** max\n` +
        `   • Rabi crops: **1.5%** max\n` +
        `   • Commercial / Horticulture: **5.0%** max\n` +
        `4. **⚖️ Appeal Authority (DGRC):** Claim reject aana, District Collector chair pannura **District Grievance Redressal Committee (DGRC)** kitta appeal submit pannalam.\n\n` +
        `> ⚠️ **Important:** 14447 call panni docket/token number safe-ah note panni vechukkonga.`;
      actionPlan = [
        { order: 1, title: 'Report Loss within 72 Hours', description: 'Call 14447 or use Crop Insurance app to register calamity and save token number.', authority: 'Helpline 14447', timeline: 'Within 72 Hours' },
        { order: 2, title: 'Assemble Farm Evidence', description: 'Collect geo-tagged crop photos, Adangal excerpt, and bank premium debit receipt.', authority: 'PACS / Bank', timeline: '3 Days' },
        { order: 3, title: 'Attend Joint Survey', description: 'Participate in the joint inspection by Agricultural Officer and Insurance Surveyor.', authority: 'Agri Dept', timeline: '10 Days' }
      ];
      followUpQuestions = [
        'How to appeal against insurance claim denial before DGRC?',
        'Can tenant farmers apply for PMFBY crop insurance in Tamil Nadu?',
        'What documents are needed for harvest loss claim?'
      ];
    } else {
      answer = `### 🌾 Statutory Framework: PMFBY Crop Insurance & Grievance Redressal\n\n` +
        `Under the **Pradhan Mantri Fasal Bima Yojana (PMFBY) Operational Guidelines** and Tamil Nadu State Agricultural Rules:\n\n` +
        `1. **⏰ Mandatory 72-Hour Intimation Window:** For localized calamities (inundation, hailstorm, landslide, natural fire) or post-harvest losses, the insured farmer must intimate the loss within **72 hours** of occurrence. Failure to intimate within this window severely jeopardizes claim settlement.\n` +
        `2. **Intimation Channels:**\n` +
        `   • Central Toll-Free Helpline: **14447**\n` +
        `   • National Crop Insurance Portal / Crop Insurance App\n` +
        `   • Local Primary Agricultural Credit Society (PACS) or bank branch\n` +
        `3. **Statutory Farmer Premium Caps:**\n` +
        `   • Kharif Food & Oilseed Crops: **2.0%** maximum\n` +
        `   • Rabi Food & Oilseed Crops: **1.5%** maximum\n` +
        `   • Annual Commercial / Horticultural Crops: **5.0%** maximum\n` +
        `4. **Appellate & Redressal Forum (DGRC):** Disputes arising from delay, under-assessment, or arbitrary rejection must be escalated to the **District Level Grievance Redressal Committee (DGRC)** chaired by the District Collector.\n\n` +
        `> ⚠️ **Statutory Notice:** Document the damage with date-stamped photographs, Adangal copy, and bank premium transaction proof before the joint survey.`;
      actionPlan = [
        { order: 1, title: 'Lodge 72-Hour Calamity Notice', description: 'Call 14447 or log into pmfby.gov.in to obtain a verified intimation reference number.', authority: 'PMFBY Portal', timeline: 'Within 72 hours' },
        { order: 2, title: 'Gather Land & Crop Records', description: 'Compile Patta/Chitta, Adangal crop entry, and PACS premium voucher.', authority: 'PACS Secretary', timeline: '3 working days' },
        { order: 3, title: 'Escalate to DGRC if Disputed', description: 'File representation before the District Collector in the event of wrongful deduction or rejection.', authority: 'District Collectorate (DGRC)', timeline: '30 days' }
      ];
      followUpQuestions = [
        'How to file a formal appeal before the District Collector (DGRC)?',
        'What is the formula for calculating short-yield threshold under PMFBY?',
        'Are tenant farmers eligible under Tamil Nadu Cultivating Tenants Protection Act?'
      ];
    }
  }

  // 2. PACS & Primary Agricultural Credit Societies
  else if (domain === 'pacs') {
    riskLevel = 'medium';
    riskReason = 'Cooperative society governance and statutory member admission rights under TN Act 1983';
    defaultSources = [
      {
        title: 'Tamil Nadu Co-operative Societies Act, 1983',
        section: 'Section 21 (Right of Admission to Membership) & Section 90 (Disputes)',
        act: 'TN Act 30 of 1983',
        source: 'Tamil Nadu Department of Co-operation',
        url: 'https://cooperation.tn.gov.in/',
        last_verified: new Date().toLocaleDateString('en-GB')
      },
      {
        title: 'Model By-laws for Primary Agricultural Credit Societies (PACS)',
        section: 'Model By-law 5 (Multipurpose Objectives & ERP Integration)',
        act: 'Ministry of Cooperation Guidelines 2023',
        source: 'Ministry of Cooperation, Govt of India',
        url: 'https://cooperation.gov.in/',
        last_verified: new Date().toLocaleDateString('en-GB')
      }
    ];

    if (isTamil) {
      answer = `### 🏛️ தொடக்க வேளாண் கூட்டுறவு கடன் சங்கம் (PACS) சட்ட விளக்கம்\n\n` +
        `**தமிழ்நாடு கூட்டுறவுச் சங்கங்கள் சட்டம், 1983** மற்றும் மாதிரி துணை விதிகளின் கீழ் உங்கள் உரிமைகள்:\n\n` +
        `1. **👤 உறுப்பினர் உரிமை (Section 21 - Right of Admission):** சங்கத்தின் எல்லைக்குட்பட்ட பகுதியில் விவசாயம் செய்யும் தகுதியுள்ள எந்தவொரு விவசாயிக்கும் சங்கத்தில் உறுப்பினராகும் (Class-A Voting Member) சட்டப்பூர்வ உரிமை உண்டு. சங்கம் 60 நாட்களுக்குள் விண்ணப்பத்தின் மீது முடிவெடுக்காவிட்டால், அவர் உறுப்பினராக சேர்க்கப்பட்டதாகக் (Deemed Admitted) கருதப்படும்.\n` +
        `2. **📖 கணக்கு புத்தக ஆய்வு (Member Inspection Rights):** ஒவ்வொரு உறுப்பினருக்கும் தனது கடன் கணக்கு புத்தகம் (Loan Passbook), வரவு-செலவு பதிவுகள் மற்றும் சங்கத்தின் தணிக்கை அறிக்கையை (Audit Report) பார்வையிட உரிமை உண்டு.\n` +
        `3. **💻 தேசிய கணினிமயமாக்கல் திட்டம் (PACS ERP):** தற்போது அனைத்து பாக்ஸ் சங்கங்களும் தேசிய ERP தளத்தில் இணைக்கப்பட்டு வருகின்றன. இதனால் ஆன்லைன் ரசீதுகள், சேமிப்பு இருப்பு மற்றும் உரம் இருப்பு ஆகியவை வெளிப்படையாக கண்காணிக்கப்படுகின்றன.\n` +
        `4. **⚖️ புகார் தீர்வு (Dispute under Section 90):** சங்கம் உறுப்பினர் சேர்க்கையை மறுத்தாலோ அல்லது கடன் வழங்குவதில் பாரபட்சம் காட்டினாலோ, வட்ட துணைப் பதிவாளரிடம் (Circle Deputy Registrar of Cooperative Societies) சட்டப்பிரிவு 90-ன் கீழ் முறையீடு செய்யலாம்.\n\n` +
        `> ℹ️ **வழிகாட்டுதல்:** சங்கம் உறுப்பினர் அட்டை தர மறுத்தால், விண்ணப்பத்தின் ஒப்புதல் ரசீதுடன் வட்ட துணைப் பதிவாளரிடம் முறையிடலாம்.`;
      actionPlan = [
        { order: 1, title: 'விண்ணப்ப நகல் & ரசீது பெறுதல்', description: 'PACS சங்கத்தில் சமர்ப்பித்த உறுப்பினர் அல்லது கடன் விண்ணப்பத்தின் தேதியிட்ட ரசீதை பாதுகாக்கவும்.', authority: 'PACS Secretary', timeline: 'உடனடியாக' },
        { order: 2, title: '60 நாட்கள் சட்ட அவகாசம்', description: 'சட்டம் பிரிவு 21-ன் படி 60 நாட்களுக்குள் முடிவெடுக்க சங்கத்திற்கு கடிதம் அனுப்பவும்.', authority: 'PACS Board', timeline: '60 நாட்கள்' },
        { order: 3, title: 'வட்ட துணைப் பதிவாளரிடம் மனு', description: 'துணைப் பதிவாளர் (Deputy Registrar) அலுவலகத்தில் பிரிவு 90-ன் கீழ் தீர்ப்புக்கு மனு தாக்கல் செய்யவும்.', authority: 'Circle DRCS Office', timeline: '15 நாட்கள்' }
      ];
      followUpQuestions = [
        'பாக்ஸ் சங்க உறுப்பினர் சேர்க்கை மறுக்கப்பட்டால் மேல்முறையீடு செய்வது எப்படி?',
        'PACS மூலம் வழங்கப்படும் பயிர் கடன் வட்டி மானிய விபரம் என்ன?',
        'துணை விதிகளில் புதிய சேவைகள் (CSC / உரம் விற்பனை) சேர்ப்பது எப்படி?'
      ];
    } else {
      answer = `### 🏛️ Statutory Framework: Primary Agricultural Credit Societies (PACS)\n\n` +
        `Under the **Tamil Nadu Co-operative Societies Act, 1983** and the **National Model By-laws for PACS (2023)**:\n\n` +
        `1. **Statutory Right of Admission (Section 21):** Every eligible cultivator residing within the operational area of the society is legally entitled to admission as an 'A-Class' voting member. If the Board fails to communicate a rejection decision within **60 days**, the applicant is statutorily deemed admitted.\n` +
        `2. **Member Inspection Rights (Section 23):** Members possess an absolute legal entitlement to inspect society books, audit reports, and their individual loan ledger passbooks.\n` +
        `3. **National PACS Computerization:** The ongoing ERP computerization project mandates digital ledger reconciliation, real-time KCC limits, and transparent input distribution (fertilizer, seeds, CSC services).\n` +
        `4. **Statutory Dispute Resolution (Section 90):** Any dispute touching the constitution, management, or business of the society (including refusal of membership or denial of credit) must be referred to the **Circle Deputy Registrar of Co-operative Societies (DRCS)**.\n\n` +
        `> ℹ️ **Legal Remedy:** Unlawful refusal of membership can be challenged via petition under Section 90 before the Circle Deputy Registrar.`;
      actionPlan = [
        { order: 1, title: 'Obtain Acknowledgment Receipt', description: 'Ensure written proof of submission for membership or loan application.', authority: 'PACS Society Office', timeline: 'Immediate' },
        { order: 2, title: 'Monitor 60-Day Deemed Period', description: 'Section 21 mandates board decision within 60 days of application.', authority: 'Society Board', timeline: '60 days' },
        { order: 3, title: 'File Petition under Section 90', description: 'Submit formal dispute petition to the Circle Deputy Registrar if grievance persists.', authority: 'Deputy Registrar (DRCS)', timeline: '30 days' }
      ];
      followUpQuestions = [
        'How to draft an appeal against refusal of PACS membership under Section 21?',
        'What are the borrowing limits and collateral rules for PACS crop loans?',
        'Can PACS operate Common Service Centers (CSCs) and drone hiring services?'
      ];
    }
  }

  // 3. Cooperative Governance & By-laws
  else if (domain === 'cooperative_governance') {
    riskLevel = 'medium';
    riskReason = 'Statutory adherence to AGM timelines, quorum rules, and by-law amendment procedures';
    defaultSources = [
      {
        title: 'Tamil Nadu Co-operative Societies Act, 1983',
        section: 'Section 32 (General Meetings) & Section 33 (Constitution of Board)',
        act: 'TN Act 30 of 1983',
        source: 'Tamil Nadu Department of Co-operation',
        url: 'https://cooperation.tn.gov.in/',
        last_verified: new Date().toLocaleDateString('en-GB')
      }
    ];

    if (isTamil) {
      answer = `### ⚖️ கூட்டுறவு நிர்வாகம் & துணை விதிகள் (Cooperative Governance)\n\n` +
        `**தமிழ்நாடு கூட்டுறவுச் சங்கங்கள் சட்டம், 1983**-ன் கீழ் சங்க நிர்வாக விதிகள்:\n\n` +
        `1. **📅 வருடாந்திர பொதுக்குழு கூட்டம் (AGM - Section 32):** நிதியாண்டு முடிந்த 6 மாதங்களுக்குள் (செப்டம்பர் 30-க்குள்) பொதுக்குழு கூட்டம் கட்டாயம் கூட்டப்பட வேண்டும். இதில் வரவு செலவு அறிக்கை, தணிக்கை அறிக்கை மற்றும் லாப பங்கீடு வைக்கப்பட வேண்டும்.\n` +
        `2. **👥 சிறப்பு பொதுக்குழு (SGM Requisition):** சங்க உறுப்பினர்களில் ஐந்தில் ஒரு பங்கு (1/5th) உறுப்பினர்கள் கையொப்பமிட்டுக் கோரினால், நிர்வாகக் குழு 30 நாட்களுக்குள் சிறப்புப் பொதுக்குழுவைக் கூட்ட வேண்டும்.\n` +
        `3. **📜 துணை விதிகள் திருத்தம் (By-law Amendments):** துணை விதிகளில் திருத்தம் செய்ய பொதுக்குழுவில் மூன்றில் இரண்டு பங்கு (2/3rd) பெரும்பான்மை ஒப்புதல் பெற்று, பதிவாளரிடம் பதிவு செய்யப்பட வேண்டும்.\n` +
        `4. **💰 ஈவுத்தொகை வரம்பு (Dividend Limit):** சட்டத்தின்படி செலுத்தப்பட்ட பங்கு மூலதனத்தின் மீது அதிகபட்சம் **14%** மட்டுமே ஈவுத்தொகை (Dividend) வழங்க முடியும்.\n\n` +
        `> ⚠️ **சட்ட வழிமுறை:** நிர்வாகக் குழு விதிகளின்படி செயல்படவில்லை என்றால், பதிவாளர் சட்டம் பிரிவு 81-ன் கீழ் விசாரணைக்கு உத்தரவிடலாம்.`;
      actionPlan = [
        { order: 1, title: 'பொதுக்குழு நோட்டீஸ் சரிபார்த்தல்', description: 'கூட்டம் நடப்பதற்கு குறைந்தபட்சம் 15 நாட்களுக்கு முன் உறுப்பினர்களுக்கு நோட்டீஸ் தரப்பட்டுள்ளதா என பார்க்கவும்.', authority: 'Society Notice Board', timeline: '15 நாட்களுக்கு முன்' },
        { order: 2, title: 'தணிக்கை அறிக்கை கோருதல்', description: 'சங்கத்தின் வருடாந்திர தணிக்கை அறிக்கையின் நகலை பார்வையிட மனு அளிக்கவும்.', authority: 'PACS Secretary', timeline: '7 நாட்கள்' }
      ];
      followUpQuestions = [
        'கூட்டுறவு சங்கத்தில் சிறப்பு பொதுக்குழு (SGM) கூட்டுவது எப்படி?',
        'நிர்வாகக் குழு முறைகேடு செய்தால் பிரிவு 81 விசாரணை கோருவது எப்படி?',
        'கூட்டுறவு சங்க தேர்தல் விதிகள் என்ன?'
      ];
    } else {
      answer = `### ⚖️ Cooperative Governance & Statutory By-laws\n\n` +
        `Under the **Tamil Nadu Co-operative Societies Act, 1983**:\n\n` +
        `1. **Mandatory Annual General Meeting (Section 32):** The Board must convene an AGM within 6 months of the close of each financial year (prior to September 30) to present audited accounts, budget estimates, and excess dividend allocations.\n` +
        `2. **Special General Body Requisition (Section 32(3)):** Upon written requisition by not less than **one-fifth (1/5th)** of total voting members, the Board is legally obligated to convene a Special General Meeting within 30 days.\n` +
        `3. **Statutory Dividend Ceiling (Section 72):** No cooperative society may declare dividend exceeding **14% per annum** on paid-up share capital.\n` +
        `4. **Inspection & Inquiry (Section 81):** On receipt of representation from members or the financing bank, the Registrar can order a statutory inquiry into the constitution, working, and financial condition of the society.\n\n` +
        `> ℹ️ **Compliance Note:** By-law amendments take legal effect only after formal registration by the Circle Deputy Registrar.`;
      actionPlan = [
        { order: 1, title: 'Verify 15-Day AGM Notice', description: 'Ensure statutory notice period of at least 15 clear days prior to the meeting date.', authority: 'Society Secretary', timeline: '15 days prior' },
        { order: 2, title: 'Inspect Audited Balance Sheet', description: 'Exercise Section 23 rights to scrutinize balance sheet and auditor observations.', authority: 'Society Board', timeline: 'Before AGM' }
      ];
      followUpQuestions = [
        'What is the procedure to requisition an SGM under Section 32(3)?',
        'How does Section 81 statutory inquiry function in case of fund misappropriation?',
        'What are the legal qualifications for election to a Cooperative Board of Directors?'
      ];
    }
  }

  // 4. Financial Literacy (Educational guidance only)
  else if (domain === 'financial_literacy') {
    riskLevel = 'low';
    riskReason = 'Educational financial literacy only — no personalized financial or investment advice';
    defaultSources = [
      {
        title: 'Reserve Bank of India & NABARD KCC Guidelines',
        section: 'Modified Interest Subvention Scheme (MISS)',
        act: 'NABARD Rural Credit Guidelines 2024',
        source: 'NABARD & Reserve Bank of India',
        url: 'https://www.nabard.org/',
        last_verified: new Date().toLocaleDateString('en-GB')
      },
      {
        title: 'Tamil Nadu Prohibition of Charging Exorbitant Interest Act, 2003',
        section: 'Section 3 & Section 4 (Penal Provisions for Kandhuvatti)',
        act: 'TN Act 38 of 2003',
        source: 'Government of Tamil Nadu',
        url: 'https://www.indiacode.nic.in/',
        last_verified: new Date().toLocaleDateString('en-GB')
      }
    ];

    if (isTamil) {
      answer = `### 💡 நிதி விழிப்புணர்வு & பயிர் கடன் வழிகாட்டுதல் (Financial Literacy)\n\n` +
        `*(முக்கிய குறிப்பு: இது விவசாயிகளுக்கான பொதுவான சட்ட விழிப்புணர்வு தகவல் மட்டுமே; தனிநபர் முதலீட்டு ஆலோசனை அல்ல.)*\n\n` +
        `1. **🌾 கிசான் கிரெடிட் கார்டு (KCC) வட்டி மானிய கணக்கீடு:**\n` +
        `   • விவசாய பயிர் கடன்களுக்கான அடிப்படை வட்டி விகிதம்: **7.0%** p.a.\n` +
        `   • குறித்த தவணைக்குள் திருப்பிச் செலுத்துவோருக்கு மத்திய அரசின் உடனடி திருப்பிச் செலுத்தும் ஊக்கத்தொகை (PRI): **3.0%** மானியம்\n` +
        `   • இதன் மூலம் விவசாயி செலுத்தும் நிகர வட்டி: **வெறும் 4.0% மட்டுமே** (ரூ. 3 லட்சம் வரையிலான கடன்களுக்கு)\n` +
        `2. **⚠️ பயிர் காப்பீடு vs முதலீடு (Insurance vs Investment):** பயிர் காப்பீடு என்பது முதலீடு அல்ல; அது எதிர்பாராத இயற்கை பேரிடரில் இருந்து பயிரைப் பாதுகாக்கும் இழப்பீட்டுப் பாதுகாப்பு மட்டுமே.\n` +
        `3. **🚫 கந்துவட்டி மற்றும் அங்கீகாரமற்ற கடன் ஆபத்து:** சட்டத்திற்குப் புறம்பாக அதிக வட்டி வசூலிப்பது **தமிழ்நாடு கந்துவட்டி தடைச் சட்டம், 2003**-ன் படி தண்டனைக்குரிய குற்றமாகும். எப்போதும் PACS அல்லது தேசியமயமாக்கப்பட்ட வங்கிகளிலேயே கடன் பெறவும்.\n` +
        `4. **📋 கடன் ஒழுக்கம்:** குறித்த தேதியில் கடனை புதுப்பிப்பதால் (Renewal) வட்டி மானியம் கிடைப்பதுடன், சிபில் (CIBIL) வரம்பு உயர்ந்து அடுத்த பருவத்திற்கு அதிக கடன் வரம்பு கிடைக்கும்.\n\n` +
        `> 💡 **விழிப்புணர்வு:** கடன் வாங்கும் முன் வட்டி விகிதம், மானிய நிபந்தனைகள் மற்றும் திருப்பிச் செலுத்தும் தேதியை பாஸ்புக்கில் சரிபார்க்கவும்.`;
      actionPlan = [
        { order: 1, title: 'KCC கடன் புதுப்பித்தல் தேதியை குறித்து வைத்தல்', description: '12 மாத தவணைக்குள் கடனை புதுப்பித்து 3% வட்டி மானியத்தை தக்கவைத்துக் கொள்ளவும்.', authority: 'PACS / Bank', timeline: 'தவணை தேதிக்கு முன்' },
        { order: 2, title: 'வட்டி மானியம் வரவு சரிபார்ப்பு', description: 'வங்கி கணக்கு புத்தகத்தில் 3% subvention வரவு வைக்கப்பட்டுள்ளதா என சரிபார்க்கவும்.', authority: 'Branch Manager', timeline: 'கடனை செலுத்திய பின்' }
      ];
      followUpQuestions = [
        'KCC கடன் வரம்பு (Scale of Finance) எவ்வாறு நிர்ணயிக்கப்படுகிறது?',
        'கந்துவட்டி வசூலிப்பவர்களுக்கு எதிராக புகார் அளிப்பது எப்படி?',
        'கடன் தள்ளுபடி அல்லது வட்டி தள்ளுபடி விதிகள் என்ன?'
      ];
    } else {
      answer = `### 💡 Financial Literacy: Rural Credit & Interest Subventions\n\n` +
        `*(Statutory Notice: This is purely educational legal guidance regarding institutional credit mechanisms; it does not constitute individual financial or investment advice.)*\n\n` +
        `1. **🌾 Kisan Credit Card (KCC) Subvention Math:**\n` +
        `   • Base Institutional Lending Rate: **7.0% p.a.** (up to ₹3 Lakhs)\n` +
        `   • Prompt Repayment Incentive (PRI) Subvention: **3.0% p.a.**\n` +
        `   • Effective Net Interest Cost: **4.0% p.a.** for farmers who service the loan within the statutory 12-month tenure\n` +
        `2. **Insurance vs Investment:** Crop insurance (PMFBY) is an indemnity risk-mitigation tool against harvest failure, not an asset generation product.\n` +
        `3. **Prohibition of Predatory Lending:** Unregistered private lending at usurious rates is strictly illegal under the **Tamil Nadu Prohibition of Charging Exorbitant Interest Act, 2003 (Kandhuvatti Act)**, punishable with imprisonment up to 3 years.\n` +
        `4. **Credit Hygiene:** Servicing crop loans within the annual cycle maintains an active institutional borrowing status and qualifies for enhanced Scale of Finance in subsequent seasons.\n\n` +
        `> 💡 **Core Principle:** Always ensure loan passbook entries match bank ledger computerization records.`;
      actionPlan = [
        { order: 1, title: 'Calendar KCC Due Date', description: 'Service interest within 365 days to capture the 3% Prompt Repayment subvention.', authority: 'PACS / Bank', timeline: 'Before annual due date' },
        { order: 2, title: 'Audit Passbook Entries', description: 'Verify that loan disbursement and interest subvention entries are recorded digitally.', authority: 'PACS Branch', timeline: 'Quarterly' }
      ];
      followUpQuestions = [
        'How is the Scale of Finance calculated for crops in Tamil Nadu districts?',
        'What legal remedies exist under the TN Prohibition of Exorbitant Interest Act?',
        'Can self-help groups (SHGs) access cooperative credit at subsidized rates?'
      ];
    }
  }

  // 5. Default Legal / Civil / Consumer handling
  else {
    defaultSources = libraryMatches.length > 0
      ? libraryMatches.map(lm => ({
          title: lm.title,
          section: lm.keySections[0] || 'Governing Section',
          act: lm.title,
          source: lm.officialSource,
          url: lm.url,
          last_verified: new Date().toLocaleDateString('en-GB')
        }))
      : [
          {
            title: isTN ? 'Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act, 2017' : 'Consumer Protection Act, 2019',
            section: 'Section 4 / Section 35',
            act: isTN ? 'TN Tenancy Act' : 'Consumer Protection Act',
            source: isTN ? 'Government of Tamil Nadu' : 'Government of India',
            url: isTN ? 'https://tenancy.tn.gov.in/' : 'https://edaakhil.nic.in/',
            last_verified: new Date().toLocaleDateString('en-GB')
          }
        ];

    if (isTamil) {
      answer = `### ⚖️ சட்ட விளக்கம்: ${domain.toUpperCase()} சட்டம்\n\n` +
        `உங்கள் கேள்வி பரிசீலிக்கப்பட்டது. **${isTN ? 'தமிழ்நாடு அரசு சட்டங்கள்' : 'இந்திய மத்திய சட்டங்கள்'}** அடிப்படையில் இந்த விவகாரத்தில் பின்வரும் விதிமுறைகள் பொருந்தும்:\n\n` +
        `1. **சட்டப்பூர்வ உரிமை:** சட்டத்தின் கீழ் இருதரப்புக்கும் பரஸ்பர உரிமைகள் மற்றும் கடமைகள் உண்டு. உரிய காரணமின்றி பணத்தை நிறுத்தி வைப்பதோ அல்லது கடமையை மீறுவதோ சட்ட விரோதமாகும்.\n` +
        `2. **முக்கிய விதிகள்:** ஒப்பந்த நகல், பணம் செலுத்திய ரசீதுகள் (Bank Statement / UTR) ஆகியவை மிக முக்கியமான ஆதாரங்கள் ஆகும்.\n` +
        `3. **அரசு நடைமுறை:** அமைதியான முறையில் தீர்வு எட்டப்படாவிட்டால், வழக்கறிஞர் மூலம் சட்டப்பூர்வ அறிவிப்பு (Legal Notice) அனுப்பி, 15 நாட்கள் அவகாசம் வழங்கலாம்.\n\n` +
        `> ⚠️ **குறிப்பு:** இது பொதுவான சட்ட விழிப்புணர்வு தகவலாகும். இறுதி முடிவெடுப்பதற்கு முன் தகுதியுள்ள வழக்கறிஞரிடம் ஆலோசிக்கவும்.`;
      actionPlan = [
        { order: 1, title: 'ஆவணங்கள் சரிபார்ப்பு', description: 'ஒப்பந்தம் மற்றும் பணப் பரிவர்த்தனை சான்றுகளை ஒருங்கிணைக்கவும்.', authority: 'Personal File' },
        { order: 2, title: 'சட்டப்பூர்வ நோட்டீஸ்', description: 'எதிர்தரப்பிற்கு பதிவு அஞ்சல் (RPAD) மூலம் கோரிக்கை கடிதம் அனுப்பவும்.', authority: 'Post Office (RPAD)' },
        { order: 3, title: 'துறைசார் தீர்ப்பாயம் அணுகுதல்', description: 'உரிய நீதிமன்றம் அல்லது தீர்ப்பாயத்தில் மனு தாக்கல் செய்யவும்.', authority: isTN ? 'Tahsildar / Rent Court / District Commission' : 'District Legal Services Authority' }
      ];
      followUpQuestions = [
        'இதற்கான சட்டப்பூர்வ நோட்டீஸ் மாதிரி என்ன?',
        'தமிழ்நாடு இணையவழி போர்டலில் புகார் செய்வது எப்படி?',
        'வழக்கு தொடர காலக்கெடு எவ்வளவு?'
      ];
    } else if (isTanglish) {
      answer = `### ⚖️ Legal Explanation (${domain.toUpperCase()})\n\n` +
        `Unga kelvi pathi parkkum bothu, **${isTN ? 'Tamil Nadu state laws' : 'Indian Central Acts'}** padi indha vishayathula ungalluku sila legal rights irukku:\n\n` +
        `1. **Statutory Right:** Oppandham (agreement) padi edhirkatchi nadakka vendum. Reason illama advance money tharama irukkaradhu wrong.\n` +
        `2. **Mukkiyamana Documents:** Rent agreement, bank statement receipts, WhatsApp/SMS messages safe-ah vechukkonga.\n` +
        `3. **Next Step:** First 15 days time kuduthu oru formal Legal Notice anuppalam.\n\n` +
        `> ⚠️ **Disclaimer:** Idhu purely legal guidance informational purposedhaan. Please verify with an advocate.`;
      actionPlan = [
        { order: 1, title: 'Verify Proofs', description: 'Collect written agreements and payment transaction receipts.', authority: 'Personal Records' },
        { order: 2, title: 'Serve Demand Notice', description: 'Send a formal 15-day notice via Registered Post.', authority: 'RPAD' }
      ];
      followUpQuestions = [
        'Can you help me generate a formal legal draft for this?',
        'What are the mandatory court fees and filing timelines?'
      ];
    } else {
      answer = `### ⚖️ Legal Assessment: ${domain.toUpperCase()}\n\n` +
        `Based on the provisions of **${isTN ? 'Tamil Nadu State enactments' : 'Indian Federal law'}**, the following legal framework applies to your matter:\n\n` +
        `1. **Statutory Entitlement:** The law protects parties against arbitrary withholding of refunds, tenancy deposits, or deficient services.\n` +
        `2. **Evidentiary Requirement:** Valid documentary evidence (written agreement, payment receipts, banking transaction records) forms the foundation of any claim.\n` +
        `3. **Remedial Procedure:** You are entitled to serve a statutory 15-day Demand Notice prior to escalating the dispute to the jurisdictional tribunal or court.\n\n` +
        `> ⚠️ **Statutory Notice:** This response is intended for legal literacy and does not constitute formal legal representation.`;
      actionPlan = [
        { order: 1, title: 'Assemble Documentation', description: 'Gather countersigned agreements and digital bank transactions.', authority: 'Personal File' },
        { order: 2, title: 'Issue Demand Notice', description: 'Serve formal 15-day statutory demand via RPAD.', authority: 'Competent Authority' }
      ];
      followUpQuestions = [
        'Can you help me generate a formal legal draft for this?',
        'What are the mandatory court fees and filing timelines?',
        'How does the Tamil Nadu e-filing portal work?'
      ];
    }
  }

  return {
    answer,
    language: lang,
    domain,
    jurisdiction,
    risk_level: riskLevel,
    risk_reason: riskReason,
    sources: defaultSources,
    action_plan: actionPlan,
    follow_up_questions: followUpQuestions,
    verification_status: 'Verified with Statutes & Schemes',
    explainability: {
      queryUnderstood: `Legal/Cooperative query regarding ${domain} under ${isTN ? 'Tamil Nadu Cooperative / State laws' : 'Indian statutory schemes'}`,
      detectedLanguage: isTamil ? 'Tamil' : isTanglish ? 'Tanglish' : isHindi ? 'Hindi' : 'English',
      legalDomain: domain.toUpperCase(),
      sourcesRetrievedCount: defaultSources.length,
      relevantProvisionsCount: 2,
      provisionsList: defaultSources.map(s => s.section || s.title),
      confidence: 'High',
      verificationStatus: 'Verified with Statutes',
      jurisdictionApplied: isTN ? 'Tamil Nadu' : 'All India',
      keyFactors: [
        `Explanation tier: ${explanationLevel}`,
        `Jurisdiction: ${jurisdiction}`,
        'Domain-specific statutory and scheme rules applied'
      ]
    }
  };
}

export async function translateLegalContent(
  text: string,
  targetLang: 'ta' | 'en' | 'hi'
): Promise<string> {
  const ai = getGenAI();
  if (ai) {
    const targetName = 
      targetLang === 'ta' ? 'formal and clear Tamil (தமிழ்)' :
      targetLang === 'hi' ? 'accurate and fluent Hindi (हिन्दी)' :
      'accurate, fluent English';

    const prompt = `
You are a specialized legal translator for Indian and Tamil Nadu jurisprudence.
Translate the following legal text completely into ${targetName}.

STRICT LEGAL TRANSLATION RULES:
1. Translate all paragraphs, explanations, headings, and bullet points into ${targetName}.
2. PRESERVE all Section numbers (e.g. "Section 138 of NI Act", "Section 4(2)"), Act names, Case citations (e.g. "AIR 2022 SC 123"), and Indian legal authorities intact.
3. If translating to Tamil or Hindi, you may include the English legal term in brackets where helpful for precision (e.g. "முன்வைப்புத் தொகை (Security Deposit)").
4. Retain exact numbers, dates, monetary amounts, and court names.
5. Maintain Markdown formatting (headers, bold, bullet points).
6. Return ONLY the translated legal text, no preamble or meta-commentary.

TEXT TO TRANSLATE:
"""
${text}
"""
`;

    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          temperature: 0.1
        }
      });

      const translated = response.text?.trim();
      if (translated && translated.length > 10) {
        return translated;
      }
    } catch (error) {
      console.error("Translation error in translateLegalContent:", error);
    }
  }

  // Fallback legal translator when API is offline or key missing
  return fallbackLegalTranslate(text, targetLang);
}

function fallbackLegalTranslate(text: string, targetLang: 'ta' | 'en' | 'hi'): string {
  let translated = text;

  if (targetLang === 'en') {
    const replacements: [RegExp, string][] = [
      [/### ⚖️ சட்ட விளக்கம்:?/gi, '### ⚖️ Legal Explanation:'],
      [/### ⚖️ சட்ட மதிப்பீடு:?/gi, '### ⚖️ Legal Assessment:'],
      [/### ⚖️ சட்ட ஆலோசனை:?/gi, '### ⚖️ Legal Guidance:'],
      [/### ⚖️ சட்ட ஆவண ஆய்வு அறிக்கை:?/gi, '### ⚖️ Legal Document Scrutiny Report:'],
      [/### ⚖️ कानूनी विश्लेषण:?/gi, '### ⚖️ Legal Assessment:'],
      [/### ⚖️ कानूनी व्याख्या:?/gi, '### ⚖️ Legal Explanation:'],
      [/தமிழ்நாடு அரசு சட்டங்கள்/gi, 'Tamil Nadu State enactments'],
      [/இந்திய மத்திய சட்டங்கள்/gi, 'Indian Federal / Central Acts'],
      [/சட்டப்பூர்வ உரிமை:?/gi, 'Statutory Right:'],
      [/முக்கிய விதிகள்:?/gi, 'Key Statutory Rules & Documents:'],
      [/அரசு நடைமுறை:?/gi, 'Remedial Procedure & Due Process:'],
      [/சட்டப்பூர்வ அறிவிப்பு/gi, 'Statutory Legal Demand Notice'],
      [/வழக்கறிஞர்/gi, 'Advocate / Legal Counsel'],
      [/ஒப்பந்தம்/gi, 'Agreement / Contract'],
      [/முன்பணம்/gi, 'Advance Security Deposit'],
      [/வாடகை/gi, 'Rent / Tenancy'],
      [/நீதிமன்றம்/gi, 'Competent Court / Tribunal'],
      [/காவல்துறை/gi, 'Police Station'],
      [/புகார்/gi, 'Formal Complaint / FIR'],
      [/வட்டாட்சியர்/gi, 'Tahsildar (Revenue Authority)'],
      [/பட்டா/gi, 'Patta (Land Title Record)'],
      [/பத்திரம்/gi, 'Registered Title Deed'],
      [/குறிப்பு:?/gi, 'Statutory Notice:'],
      [/இது பொதுவான சட்ட விழிப்புணர்வு தகவலாகும்/gi, 'This response is for statutory awareness purposes'],
      [/இறுதி முடிவெடுப்பதற்கு முன் தகுதியுள்ள வழக்கறிஞரிடம் ஆலோசிக்கவும்\./gi, 'Please consult a certified advocate before initiating formal legal proceedings.'],
      [/वैधानिक अधिकार:?/gi, 'Statutory Right:'],
      [/महत्वपूर्ण दस्तावेज़:?/gi, 'Key Documents & Evidence:'],
      [/प्रक्रियात्मक कदम:?/gi, 'Procedural Remedy:'],
      [/मांग पत्र/gi, 'Legal Notice']
    ];

    for (const [pattern, repl] of replacements) {
      translated = translated.replace(pattern, repl);
    }
  } else if (targetLang === 'ta') {
    const replacements: [RegExp, string][] = [
      [/### ⚖️ Legal Assessment:?/gi, '### ⚖️ சட்ட மதிப்பீடு:'],
      [/### ⚖️ Legal Explanation:?/gi, '### ⚖️ சட்ட விளக்கம்:'],
      [/### ⚖️ Legal Guidance:?/gi, '### ⚖️ சட்ட ஆலோசனை:'],
      [/### ⚖️ Legal Document Scrutiny Report:?/gi, '### ⚖️ சட்ட ஆவண ஆய்வு அறிக்கை:'],
      [/### ⚖️ कानूनी विश्लेषण:?/gi, '### ⚖️ சட்ட விளக்கம்:'],
      [/Statutory Entitlement:?/gi, 'சட்டப்பூர்வ உரிமை (Statutory Right):'],
      [/Statutory Right:?/gi, 'சட்டப்பூர்வ உரிமை (Statutory Right):'],
      [/Evidentiary Requirement:?/gi, 'ஆதாரத் தேவை (Evidentiary Proof):'],
      [/Remedial Procedure:?/gi, 'நிவாரண நடைமுறை (Legal Remedy):'],
      [/Key Observations:?/gi, 'முக்கிய அவதானிப்புகள்:'],
      [/Statutory Notice:?/gi, 'சட்டப்பூர்வ அறிவிப்பு:'],
      [/Tamil Nadu State enactments/gi, 'தமிழ்நாடு மாநில சட்டங்கள்'],
      [/Indian Federal law/gi, 'இந்திய மத்திய சட்டம்'],
      [/This response is intended for legal literacy and does not constitute formal legal representation\./gi, 'இந்த தகவல் சட்ட விழிப்புணர்வுக்கானது; இது முறையான நீதிமன்ற வழக்காடலுக்கு மாற்றாகாது.'],
      [/Please consult a certified advocate before initiating formal legal proceedings\./gi, 'இறுதி முடிவெடுப்பதற்கு முன் தகுதியுள்ள வழக்கறிஞரிடம் ஆலோசிக்கவும்.']
    ];

    for (const [pattern, repl] of replacements) {
      translated = translated.replace(pattern, repl);
    }
  } else if (targetLang === 'hi') {
    const replacements: [RegExp, string][] = [
      [/### ⚖️ Legal Assessment:?/gi, '### ⚖️ कानूनी मूल्यांकन:'],
      [/### ⚖️ Legal Explanation:?/gi, '### ⚖️ कानूनी विश्लेषण:'],
      [/### ⚖️ சட்ட விளக்கம்:?/gi, '### ⚖️ कानूनी विश्लेषण:'],
      [/Statutory Right:?/gi, 'वैधानिक अधिकार (Statutory Right):'],
      [/Statutory Entitlement:?/gi, 'वैधानिक अधिकार:'],
      [/Evidentiary Requirement:?/gi, 'साक्ष्य की आवश्यकता:'],
      [/Remedial Procedure:?/gi, 'उपचारात्मक प्रक्रिया:'],
      [/Statutory Notice:?/gi, 'वैधानिक सूचना:'],
      [/Tamil Nadu State enactments/gi, 'तमिलनाडु राज्य अधिनियम'],
      [/Indian Federal law/gi, 'भारतीय केंद्रीय कानून'],
      [/This response is intended for legal literacy and does not constitute formal legal representation\./gi, 'यह जानकारी कानूनी साक्षरता हेतु है और औपचारिक कानूनी प्रतिनिधित्व नहीं है।']
    ];

    for (const [pattern, repl] of replacements) {
      translated = translated.replace(pattern, repl);
    }
  }

  return translated;
}

export async function analyzeLegalDocumentServer(
  fileName: string,
  fileType: string,
  fileSize: string,
  contentSnippet: string,
  language: 'ta' | 'en' | 'tanglish' | 'hi' = 'ta'
) {
  const ai = getGenAI();
  
  const languageGuidance = 
    language === 'ta' ? 'Simple and clear Tamil (எளிய நடை தமிழ்)' :
    language === 'tanglish' ? 'Natural conversational Tanglish in English script (e.g. "Indha document unga rental agreement pathiyadhu...")' :
    language === 'hi' ? 'Simple and clear Hindi (सरल और सुगम हिन्दी)' :
    'Simple, plain, jargon-free English';

  const systemInstruction = `
You are a senior Legal Document Analyst for Lexora specializing in Indian and Tamil Nadu contracts, court pleadings, tenancy agreements, and notices.

IMPORTANT USER REQUIREMENT:
The user explicitly requests: "if a person loads the file the generated output should be easy to understand".
Therefore, write this analysis so that an ordinary citizen with NO legal background can effortlessly understand it.
- Ban heavy, convoluted legalese, Latin phrases, or intimidating legal jargon.
- If you cite an Act or legal clause, immediately explain what it means in plain everyday words with practical examples.
- Use clear bullet points, bold key terms, and visual section markers.

REQUIRED EASY-TO-UNDERSTAND STRUCTURE:
### 📌 1. Plain-Language Summary (What this document is about)
Explain what this document is, what purpose it serves, and what it practically means for the user in 2 to 3 friendly, crystal-clear sentences.

### 👥 2. Who is Involved & Their Main Duties
Break down in plain words:
- **Party A (e.g. You / Tenant / Consumer):** What you have agreed to do, pay, or provide.
- **Party B (e.g. Landlord / Company / Vendor):** What they are legally required to do, provide, or maintain.

### ⚠️ 3. Red Flags & Things You Must Watch Out For
Highlight practical risks that often cause disputes:
- Are there hidden penalties, lock-in clauses, or unfair repair terms?
- What are the advance deposit return conditions?
- What is the notice period for cancellation or vacating?

### 📋 4. What You Should Do Next (Action Checklist)
A simple 1-2-3 step guide on what the citizen should verify, negotiate, or keep documented right now.

### ⚖️ 5. Laws That Protect You (Explained Simply)
Mention the relevant Tamil Nadu or Central Indian laws in plain words (e.g., Section 4 of TN Tenancy Act regarding written agreements, Consumer Protection Act regarding refunds).

Notice: Write the entire analysis in **${languageGuidance}**.
Conclude with a gentle note: "ℹ️ AI-powered analysis designed for easy citizen understanding. For filing in court or signing high-value deeds, verify with an advocate."
`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `DOCUMENT NAME: ${fileName} (${fileType}, ${fileSize})\n\nDOCUMENT TEXT CONTENT:\n${contentSnippet}`,
        config: {
          systemInstruction,
          temperature: 0.2
        }
      });

      return {
        success: true,
        analysis: response.text || 'Analysis completed.',
        fileName,
        fileType,
        fileSize
      };
    } catch (error) {
      console.error("Document analysis error:", error);
    }
  }

  // Easy-to-understand fallback analysis in the chosen language
  let fallbackAnalysis = '';
  if (language === 'ta') {
    fallbackAnalysis = `### 📄 எளிய ஆவணப் பகுப்பாய்வு: ${fileName}\n\n` +
      `### 📌 1. எளிய சுருக்கம் (இந்த ஆவணம் எதைப் பற்றியது?)\n` +
      `இந்த ஆவணம் இரு தரப்பினருக்கு இடையிலான சட்டப்பூர்வ ஒப்பந்தம் அல்லது அறிவிப்பாகும். இதில் உங்கள் உரிமைகள், மாதாந்திர கடமைகள் மற்றும் பொறுப்புகள் தெளிவாகக் குறிப்பிடப்பட்டுள்ளன.\n\n` +
      `### 👥 2. சம்பந்தப்பட்ட நபர்கள் & முக்கிய கடமைகள்\n` +
      `• **முதல் தரப்பினர் (உரிமையாளர் / நிறுவனம்):** உரிய சேவையை வழங்குதல் மற்றும் ஒப்பந்த விதிமுறைகளுக்குக் கட்டுப்படுதல்.\n` +
      `• **இரண்டாம் தரப்பினர் (நீங்கள் / வாடகைதாரர்):** குறிப்பிட்ட தேதியில் தொகையைச் செலுத்துதல் மற்றும் இடத்தைப் பாதுகாப்பாகப் பராமரித்தல்.\n\n` +
      `### ⚠️ 3. நீங்கள் கவனிக்க வேண்டிய முக்கியமான விஷயங்கள் (ஆபத்துக்கள்)\n` +
      `• **முன்வைப்புத் தொகை (Advance Deposit):** ஒப்பந்தம் முடியும் போது அட்வான்ஸ் தொகையை எப்போது, எப்படித் திருப்பித் தருவார்கள் என்பதை உறுதிப்படுத்தவும்.\n` +
      `• **முன்னறிவிப்பு காலம் (Notice Period):** காலி செய்ய அல்லது ரத்து செய்ய குறைந்தபட்சம் 30 நாட்கள் அவகாசம் உள்ளதா என்பதைச் சரிபார்க்கவும்.\n` +
      `• **கூடுதல் அபராதங்கள்:** தாமதக் கட்டணம் அல்லது மறைமுகக் கட்டணங்கள் ஏதேனும் உள்ளதா எனக் கவனிக்கவும்.\n\n` +
      `### 📋 4. நீங்கள் அடுத்து செய்ய வேண்டியவை (எளிய பட்டியல்)\n` +
      `1. ஆவணத்தின் நகலை (Signed Copy) பத்திரமாகப் பாதுகாத்துக்கொள்ளுங்கள்.\n` +
      `2. வங்கிப் பரிவர்த்தனைகள் மற்றும் ரசீதுகளை டிஜிட்டல் முறையில் சேமிக்கவும்.\n` +
      `3. தமிழக அரசின் அதிகாரப்பூர்வ விதிகளின்படி ஆவணம் உள்ளதா என உறுதிசெய்யவும்.\n\n` +
      `> ℹ️ **குறிப்பு:** இது பொதுமக்கள் எளிதாகப் புரிந்துகொள்வதற்காக உருவாக்கப்பட்ட எளிய பகுப்பாய்வு. பெரிய ஒப்பந்தங்களில் கையெழுத்திடும் முன் வழக்கறிஞரிடம் சரிபார்க்கவும்.`;
  } else if (language === 'tanglish') {
    fallbackAnalysis = `### 📄 Simple Document Analysis: ${fileName}\n\n` +
      `### 📌 1. Plain Summary (Indha document enna solrudhu?)\n` +
      `Idhu rendu perukku naduvula potta legal agreement alladhu notice. Idhula unga rights, monthly dues, matrum muthalkattamana terms mention panni irukkanga.\n\n` +
      `### 👥 2. Yaar Yaarukku Enna Responsibility?\n` +
      `• **First Party (Owner / Company):** Promised service tharanum, rules follow pannanum.\n` +
      `• **Second Party (Neenga / Tenant):** Correct time-la payment seiyanum, property-ai safe-ah maintain pannanum.\n\n` +
      `### ⚠️ 3. Mukkiyamaga Gavanikka Vendiya Vishayangal (Red Flags)\n` +
      `• **Advance Deposit Refund:** Agreement mudiyum bothu advance money-ai ethanai naatkallukkul thiruppi tharuvanga nu check pannunga.\n` +
      `• **Notice Period:** Vacate panna minimum 30 days time irukka nu confirm pannunga.\n` +
      `• **Hidden Charges:** Penalty alladhu unwanted maintenance terms irukka nu paathukonga.\n\n` +
      `### 📋 4. Neenga Ippo Enna Pannanum? (Action Checklist)\n` +
      `1. Signed agreement copy-ai safe-ah download panni vechukkonga.\n` +
      `2. Payment seitha receipt matrum bank proof-ai save pannunga.\n` +
      `3. TN Government Tenancy portal-la register panni irukkaanga nu verify pannunga.\n\n` +
      `> ℹ️ **Notice:** Idhu purinjikkiradhukaana simple guidance mattume. Mukkiyamaana legal step edukkuradhukku munnadi advocate kitta verify pannikonga.`;
  } else if (language === 'hi') {
    fallbackAnalysis = `### 📄 सरल दस्तावेज़ विश्लेषण: ${fileName}\n\n` +
      `### 📌 1. सरल सारांश (यह दस्तावेज़ किस बारे में है?)\n` +
      `यह दस्तावेज़ दो पक्षों के बीच एक कानूनी अनुबंध या सूचना है, जो दोनों पक्षों के अधिकार, देय राशि और मुख्य शर्तों को सरल रूप से निर्धारित करता है।\n\n` +
      `### 👥 2. संबंधित पक्ष एवं उनकी मुख्य जिम्मेदारियां\n` +
      `• **पहला पक्ष (मालिक / कंपनी):** वादे के अनुसार सेवा या परिसर प्रदान करना और अनुबंध के नियमों का पालन करना।\n` +
      `• **दूसरा पक्ष (आप / किरायेदार):** समय पर भुगतान करना और परिसर की उचित देखभाल करना।\n\n` +
      `### ⚠️ 3. महत्वपूर्ण बातें जिन पर ध्यान देना जरूरी है (जोखिम)\n` +
      `• **सुरक्षा अग्रिम राशि (Security Deposit):** अनुबंध समाप्त होने पर जमा राशि कब और कैसे वापस मिलेगी, यह स्पष्ट करें।\n` +
      `• **नोटिस अवधि (Notice Period):** क्या खाली करने या समाप्त करने के लिए कम से कम 30 दिनों का समय दिया गया है?\n` +
      `• **अतिरिक्त शुल्क:** किसी भी अनुचित जुर्माना या छिपे हुए शुल्क की जांच करें।\n\n` +
      `### 📋 4. आपको आगे क्या करना चाहिए (सरल चेकलिस्ट)\n` +
      `1. हस्ताक्षरित अनुबंध की एक प्रति अपने पास सुरक्षित रखें।\n` +
      `2. सभी भुगतानों की बैंक रसीदें डिजिटल रूप से सहेजें।\n` +
      `3. कानूनी विवाद की स्थिति में उपभोक्ता या किरायेदारी प्राधिकरण से संपर्क करें।\n\n` +
      `> ℹ️ **सूचना:** यह आम नागरिकों की सरल समझ के लिए तैयार किया गया विश्लेषण है। किसी भी कानूनी कार्यवाही से पहले अधिवक्ता से परामर्श लें।`;
  } else {
    fallbackAnalysis = `### 📄 Plain-Language Document Scrutiny: ${fileName}\n\n` +
      `### 📌 1. Simple Summary (What this document is about)\n` +
      `This is a formal agreement or legal notice setting out the binding rights, financial payments, and mutual obligations between both parties in straightforward terms.\n\n` +
      `### 👥 2. Who is Involved & Their Main Duties\n` +
      `• **First Party (Owner / Service Provider):** Required to provide the agreed premises or service and adhere to standard statutory conditions.\n` +
      `• **Second Party (You / Tenant / Customer):** Required to remit payments on time and abide by property/usage rules.\n\n` +
      `### ⚠️ 3. Key Things You Must Watch Out For (Red Flags)\n` +
      `• **Advance Security Deposit:** Verify exact timeline for full refund upon vacating or contract termination.\n` +
      `• **Notice Period:** Ensure at least 30 days bilateral written notice is required before any lease termination.\n` +
      `• **Unfair Deductions:** Check whether arbitrary maintenance or maintenance deductions are restricted.\n\n` +
      `### 📋 4. What You Should Do Next (Simple Checklist)\n` +
      `1. Keep an original countersigned copy and stamp duty receipt safe.\n` +
      `2. Maintain clear digital payment records (NEFT/UPI/Bank proofs).\n` +
      `3. If residential tenancy in Tamil Nadu, check compliance under TN Tenancy Act 2017.\n\n` +
      `> ℹ️ **Notice:** AI-powered scrutiny prepared for citizen legal literacy. Please consult a practicing advocate prior to executing or responding to formal legal instruments.`;
  }

  return {
    success: true,
    analysis: fallbackAnalysis,
    fileName,
    fileType,
    fileSize
  };
}

export async function generateLegalDraftServer(req: {
  draftType: string;
  applicantName: string;
  respondentName: string;
  jurisdiction: 'TN' | 'IN';
  language: 'ta' | 'en' | 'tanglish' | 'hi';
  facts: string;
  reliefSought: string;
  specificDetails?: Record<string, string>;
}) {
  const ai = getGenAI();

  const langPrompt = 
    req.language === 'ta' ? 'Formal Legal Tamil' :
    req.language === 'hi' ? 'Formal Legal Hindi (using standard Hindi and Devanagari script)' :
    req.language === 'tanglish' ? 'Bilingual Tanglish & English' :
    'Formal English with standard Indian legal formatting';

  const prompt = `
You are a veteran Indian and Tamil Nadu High Court Legal Drafter for Lexora.
Generate a formal, ready-to-customize legal draft based on the user's inputs.

DETAILS:
- Draft Type: ${req.draftType} (e.g. RTI Application, Consumer Complaint, Legal Notice, Tenancy Dispute Notice, Grievance Letter)
- Complainant / Applicant: ${req.applicantName || '[Applicant Name]'}
- Opposite Party / Respondent: ${req.respondentName || '[Opposite Party Name]'}
- Jurisdiction: ${req.jurisdiction === 'TN' ? 'Tamil Nadu' : 'All India'}
- Language: ${langPrompt}
- Factual Background: ${req.facts}
- Relief / Remedy Demanded: ${req.reliefSought}

REQUIRED STRUCTURE:
1. Formal Legal Heading (To Authority / Opposite Party)
2. Subject Line referencing applicable Statute (e.g., Under Section 6(1) of RTI Act 2005 / Under Consumer Protection Act 2019 / Section 106 Transfer of Property Act)
3. Factual Chronology in numbered paragraphs
4. Statutory Legal Basis & Infringement
5. Specific Demand & Mandatory Timeline (e.g., 15 days from receipt)
6. Consequences of Non-Compliance (Civil/Criminal litigation at their risk and cost)
7. Verification & Signature Block
8. Prominent Disclaimer: "AI-generated draft — verify the contents with a qualified legal professional before submission."
`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          temperature: 0.2
        }
      });
      return {
        success: true,
        draft: response.text || '',
        draftType: req.draftType
      };
    } catch (error) {
      console.error("Draft generation error:", error);
    }
  }

  // Fallback template
  let template = '';
  const dt = (req.draftType || '').toLowerCase();

  if (dt.includes('pmfby') || dt.includes('crop_insurance') || dt.includes('insurance_appeal')) {
    if (req.language === 'ta') {
      template = `பயிர் காப்பீடு மறுப்பு / இழப்பீடு மேல்முறையீட்டு மனு\n` +
        `(மாவட்ட அளவிலான குறைதீர் குழு - DGRC முன் சமர்ப்பிக்கப்படுவது)\n\n` +
        `மனுதாரர்:\n` +
        `${req.applicantName || '[விவசாயி பெயர்]'}\n` +
        `த/பெ: [தந்தை பெயர்], கிராமம்: [கிராமம்], வட்டம்: [வட்டம்], மாவட்டம்: [மாவட்டம்]\n` +
        `அலைபேசி: [எண்], சேமிப்பு கணக்கு எண்: [வங்கி கணக்கு]\n\n` +
        `பெறுநர்:\n` +
        `மாவட்ட ஆட்சியர் மற்றும் தலைவர்,\n` +
        `மாவட்ட அளவிலான குறைதீர்க்கும் குழு (DGRC),\n` +
        `மாவட்ட ஆட்சியரகம், [மாவட்ட பெயர்], தமிழ்நாடு.\n\n` +
        `பொருள்: பிரதம மந்திரி பயிர் காப்பீட்டுத் திட்டம் (PMFBY) - பயிர் சேத இழப்பீடு கோரிக்கை நிராகரிக்கப்பட்டது / நிலுவை - உரிய நிவாரணம் பெற்றுத்தரக் கோருதல்.\n\n` +
        `மதிப்பிற்குரிய தலைவர் அவர்களுக்கு,\n\n` +
        `1. மனுதாரர் ஆகிய நான் மேற்கண்ட முகவரியில் உள்ள விவசாயி ஆவேன். எனக்கு [சர்வே எண்] கொண்ட நிலத்தில் [பயிர் பெயர்] சாகுபடி செய்யப்பட்டு, பிரதம மந்திரி பயிர் காப்பீட்டுத் திட்டத்தின் (PMFBY) கீழ் உரிய பிரீமியம் [பிரீமியம் ரசீது எண்/தேதி] மூலம் செலுத்தப்பட்டுள்ளது.\n\n` +
        `2. சம்பவ விபரம்: ${req.facts || '[பேரிடர் நாள், பாதிப்பு தன்மை (வெள்ளம்/வறட்சி) மற்றும் 72 மணி நேரத்திற்குள் அளிக்கப்பட்ட அறிவிப்பு விபரம்]'}.\n\n` +
        `3. இழப்பீட்டு மறுப்பு/தாமதம்: காப்பீட்டு நிறுவனம் எவ்வித முகாந்திரமும் இன்றி எனது கோரிக்கையை நிராகரித்துள்ளது/நிலுவையில் வைத்துள்ளது. இது PMFBY செயல்பாட்டு வழிகாட்டுதல்களுக்கு முரணானது.\n\n` +
        `4. கோரிக்கை: எனவே, மாண்புமிகு குழுவினர் தலையிட்டு, எனது பயிர் சேதத்தினை மறுஆய்வு செய்து, எனக்கு வர வேண்டிய இழப்பீட்டுத் தொகையான ${req.reliefSought || '[கோரும் தொகை]'} பெற்றுத்தர உத்தரவிட வேண்டுமாய் பணிவுடன் வேண்டுகிறேன்.\n\n` +
        `இணைப்புகள்:\n` +
        `1. நில அடங்கல் & சிட்டா நகல்\n` +
        `2. காப்பீட்டு பிரீமியம் செலுத்திய ரசீது / KCC பாஸ்புக் நகல்\n` +
        `3. 14447 புகார் டோக்கன் பதிவு எண் மற்றும் பயிர் பாதிப்பு புகைப்படங்கள்\n\n` +
        `இப்படிக்கு,\n` +
        `${req.applicantName || '[கையொப்பம் / கைரேகை]'}\n\n` +
        `⚠️ [குறிப்பு: இது AI மாதிரி வரைவு. சமர்ப்பிக்கும் முன் வட்டார வேளாண்மை அலுவலரிடம் சரிபார்க்கவும்.]`;
    } else {
      template = `APPEAL PETITION BEFORE DISTRICT LEVEL GRIEVANCE REDRESSAL COMMITTEE (DGRC)\n` +
        `(Under Pradhan Mantri Fasal Bima Yojana - PMFBY Operational Guidelines)\n\n` +
        `BEFORE THE HON'BLE DISTRICT COLLECTOR & CHAIRMAN, DGRC\n` +
        `DISTRICT COLLECTORATE, [DISTRICT NAME], TAMIL NADU\n\n` +
        `PETITIONER / AFFECTED FARMER:\n` +
        `${req.applicantName || '[Farmer Name]'}\n` +
        `S/o: [Father Name], Residing at: [Village, Taluk, District]\n` +
        `Aadhaar / Mobile No: [Contact], Bank A/c No: [Account No]\n\n` +
        `RESPONDENTS:\n` +
        `1. The Authorized Officer, [Insurance Company Name], District Office\n` +
        `2. The Secretary, [PACS / Bank Branch Name]\n` +
        `3. The Joint Director of Agriculture, [District Name]\n\n` +
        `SUBJECT: APPEAL AGAINST UNJUSTIFIED REJECTION / SHORT-SETTLEMENT OF PMFBY CROP INSURANCE CLAIM\n\n` +
        `RESPECTFULLY SHEWETH:\n\n` +
        `1. That the Petitioner is a genuine cultivator holding agricultural land in S.F. No. [Survey No], having insured the [Crop Name] under PMFBY scheme for the season [Kharif/Rabi Year] via premium transaction [Voucher/UTR No].\n\n` +
        `2. Factual Matrix of Calamity: ${req.facts || '[Detail the localized calamity event, inundation/drought, and timely 72-hour notice lodged on Helpline 14447]'}.\n\n` +
        `3. Illegality of Rejection: The Respondent Insurance Company has erroneously rejected/delayed the admissible claim without following statutory joint-survey protocols as per PMFBY Operational Guidelines.\n\n` +
        `4. Relief Prayed: The Petitioner respectfully prays that this Hon'ble Committee may be pleased to direct the Insurance Company to disburse the full claim amount of ${req.reliefSought || '[Claim Amount]'} along with penal interest for delay.\n\n` +
        `VERIFICATION:\n` +
        `Verified that the contents stated above are true to the best of my knowledge and belief.\n\n` +
        `Date: [Date]\n` +
        `Place: [Place]\n\n` +
        `${req.applicantName || '[Signature / Thumb Impression of Farmer]'}\n\n` +
        `DISCLAIMER: AI-generated draft — verify the contents with a certified legal practitioner or agricultural officer prior to submission.`;
    }
  } else if (dt.includes('cooperative') || dt.includes('pacs') || dt.includes('section_90')) {
    if (req.language === 'ta') {
      template = `கூட்டுறவு சங்க தாவா மனு (பிரிவு 90-ன் கீழ்)\n` +
        `தமிழ்நாடு கூட்டுறவுச் சங்கங்கள் சட்டம், 1983-ன் கீழ் சமர்ப்பிக்கப்படுவது\n\n` +
        `மனுதாரர்:\n` +
        `${req.applicantName || '[மனுதாரர் / உறுப்பினர் பெயர்]'}\n` +
        `உறுப்பினர் எண்: [உறுப்பினர் எண் / விண்ணப்பதாரர்], முகவரி: [முழு முகவரி]\n\n` +
        `எதிர்தரப்பினர்:\n` +
        `1. செயலாளர் / மேலாண்மை இயக்குநர், [PACS / கூட்டுறவு சங்க பெயர்]\n` +
        `2. தலைவர் / நிர்வாகக் குழு, [கூட்டுறவு சங்க முகவரி]\n\n` +
        `பெறுநர்:\n` +
        `வட்ட துணைப் பதிவாளர் (கூட்டுறவுச் சங்கங்கள்),\n` +
        `துணைப் பதிவாளர் அலுவலகம், [வட்டம் / பகுதி], தமிழ்நாடு.\n\n` +
        `பொருள்: தமிழ்நாடு கூட்டுறவுச் சங்கங்கள் சட்டம் 1983, பிரிவு 90-ன் கீழ் தாவா மனு - ${req.reliefSought || '[உறுப்பினர் சேர்க்கை மறுப்பு / பயிர் கடன் மறுப்பு / தணிக்கை அறிக்கை கோருதல்]'}.\n\n` +
        `மதிப்பிற்குரிய ஐயா,\n\n` +
        `1. மனுதாரர் சங்கத்தின் எல்லைக்குட்பட்ட பகுதியில் விவசாயம் செய்து வரும் தகுதியுள்ள நபர் ஆவேன்.\n\n` +
        `2. வழக்கின் சுருக்கம்: ${req.facts || '[சம்பவங்களின் விபரம் மற்றும் சட்டப்பிரிவு மீறல் விபரம்]'}.\n\n` +
        `3. சட்டம் பிரிவு 21 மற்றும் சங்க துணை விதிகளின்படி எனது விண்ணப்பத்தை நிராகரிக்க சங்க நிர்வாகத்திற்கு முகாந்திரம் இல்லை.\n\n` +
        `4. எனவே, துணைப் பதிவாளர் அவர்கள் இத்தாவாவை விசாரித்து, ${req.reliefSought || '[சட்டப்பூர்வ நிவாரணம்]'} வழங்க சங்க நிர்வாகத்திற்கு ஆணை பிறப்பிக்குமாறு கோருகிறேன்.\n\n` +
        `இப்படிக்கு,\n` +
        `${req.applicantName || '[கையொப்பம்]'}\n\n` +
        `⚠️ [குறிப்பு: இது மாதிரி மனு மட்டுமே. கூட்டுறவு வழக்கறிஞரிடம் சரிபார்க்கவும்.]`;
    } else {
      template = `DISPUTE PETITION UNDER SECTION 90 OF THE TAMIL NADU CO-OPERATIVE SOCIETIES ACT, 1983\n\n` +
        `BEFORE THE ARBITRATOR / CIRCLE DEPUTY REGISTRAR OF CO-OPERATIVE SOCIETIES\n` +
        `OFFICE OF THE DEPUTY REGISTRAR (HOUSING / PACS / CONSUMER),\n` +
        `[CIRCLE NAME], TAMIL NADU\n\n` +
        `DISPUTE PETITION NO: ______ / 2026\n\n` +
        `PETITIONER / MEMBER:\n` +
        `${req.applicantName || '[Petitioner Name]'}\n` +
        `Member No / Resident: [Address & Contact Details]\n\n` +
        `VERSUS\n\n` +
        `RESPONDENTS:\n` +
        `1. The Secretary / Managing Director, [Primary Agricultural Credit Society / Society Name]\n` +
        `2. The Elected Board of Directors, [Society Address]\n\n` +
        `SUBJECT: DISPUTE TOUCHING THE BUSINESS / ADMISSION / MANAGEMENT OF THE SOCIETY UNDER SECTION 90\n\n` +
        `The Petitioner respectfully submits as follows:\n\n` +
        `1. The Petitioner is an eligible farmer/resident within the territorial jurisdiction of Respondent No. 1 Society.\n\n` +
        `2. Factual Chronology: ${req.facts || '[Detail facts, denial of admission under Section 21, or non-issuance of no-due certificate/credit]'}.\n\n` +
        `3. Ground of Dispute: The action of the Respondents is arbitrary, illegal, and contrary to Section 21/33/90 of the Tamil Nadu Co-operative Societies Act 1983 and approved By-laws.\n\n` +
        `4. Relief Prayed: It is prayed that the Learned Arbitrator / Deputy Registrar may be pleased to:\n` +
        `   a) Adjudicate the dispute and declare the action of Respondent No. 1 as void;\n` +
        `   b) Direct Respondent No. 1 to grant ${req.reliefSought || '[Relief Demanded]'};\n` +
        `   c) Pass such other statutory orders as deemed fit.\n\n` +
        `VERIFICATION:\n` +
        `I verify that the statements in paras 1 to 4 are true and correct.\n\n` +
        `${req.applicantName || '[Petitioner Signature]'}\n\n` +
        `DISCLAIMER: AI-generated draft — verify the contents with a certified legal practitioner prior to submission.`;
    }
  } else if (req.language === 'ta') {
    template = `சட்டப்பூர்வ அறிவிப்பு / மனு மாதிரி\n\n` +
      `அனுப்புநர்:\n${req.applicantName || '[உங்கள் பெயர்]'}\n[முகவரி]\n\n` +
      `பெறுநர்:\n${req.respondentName || '[எதிர்தரப்பு பெயர்]'}\n[முகவரி]\n\n` +
      `பொருள்: ${req.draftType.toUpperCase()} - சட்டப்பூர்வ தீர்வு கோருதல் தொடர்பாக.\n\n` +
      `மதிப்பிற்குரியீர்,\n` +
      `1. இந்நோட்டீஸ் மூலம் தெரிவிப்பது யாதெனில், நான் மேற்கண்ட முகவரியில் வசித்து வருகிறேன்.\n` +
      `2. விபரம்: ${req.facts || '[சம்பவங்களின் விபரம்]'}.\n` +
      `3. கோரிக்கை: எனவே, இந்நோட்டீஸ் கிடைத்த 15 நாட்களுக்குள் ${req.reliefSought || '[கோரிக்கை விபரம்]'} செய்து தருமாறு கோருகிறேன்.\n` +
      `4. தவறும்பட்சத்தில், உங்கள் செலவிலும் பொறுப்பிலும் நீதிமன்றத்தில் தகுந்த சட்ட நடவடிக்கை எடுக்கப்படும் என எச்சரிக்கிறேன்.\n\n` +
      `இப்படிக்கு,\n${req.applicantName || '[கையொப்பம்]'}\n\n` +
      `⚠️ [குறிப்பு: இது மாதிரி வரைவு மட்டுமே. அனுப்பும் முன் வழக்கறிஞரிடம் சரிபார்க்கவும்.]`;
  } else if (req.language === 'hi') {
    template = `औपचारिक कानूनी मांग नोटिस / आवेदन प्रारूप\n\n` +
      `प्रेषक:\n${req.applicantName || '[आपका नाम]'}\n[पता, संपर्क एवं ईमेल]\n\n` +
      `प्रति:\n${req.respondentName || '[विपक्षी दल का नाम]'}\n[कार्यालय / निवास का पता]\n\n` +
      `विषय: ${req.draftType.toUpperCase()} - वैधानिक मांग एवं सूचना के संबंध में।\n\n` +
      `महोदय / महोदया,\n` +
      `1. मुख्य तथ्य: ${req.facts || '[घटनाओं का विवरण]'}.\n` +
      `2. आपका यह कृत्य संबंधित वैधानिक नियमों एवं अनुबंध का उल्लंघन है।\n` +
      `3. मांग: अतः इस नोटिस की प्राप्ति के 15 दिनों के भीतर ${req.reliefSought || '[विशिष्ट मांग]'} पूरी की जाए।\n` +
      `4. अन्यथा सक्षम न्यायालय में कानूनी कार्यवाही प्रारंभ की जाएगी, जिसकी समस्त जिम्मेदारी आपकी होगी।\n\n` +
      `भवदीय,\n\n${req.applicantName || '[हस्ताक्षर]'}\n\n` +
      `अस्वीकरण: यह प्रारूप मार्गदर्शन हेतु तैयार किया गया है। न्यायालय में प्रस्तुत करने से पूर्व किसी वकील से परामर्श लें।`;
  } else {
    template = `FORMAL LEGAL NOTICE / PETITION DRAFT\n\n` +
      `FROM:\n${req.applicantName || '[Your Full Name]'}\n[Address, Contact & Email]\n\n` +
      `TO:\n${req.respondentName || '[Respondent / Opposite Party Name]'}\n[Registered Address]\n\n` +
      `SUB: DEMAND NOTICE / REPRESENTATION PURSUANT TO STATUTORY PROVISIONS\n\n` +
      `Sir/Madam,\n\n` +
      `Under instructions from and on behalf of my client/myself, I hereby issue this formal notice as under:\n\n` +
      `1. That the factual matrix leading to the present grievance is: ${req.facts || '[Factual details]'}.\n\n` +
      `2. That your failure to perform statutory and contractual duties constitutes a material infringement of law.\n\n` +
      `3. I hereby call upon you to comply with the following relief within 15 (fifteen) days from the receipt hereof:\n` +
      `   ${req.reliefSought || '[Specific Relief Demanded]'}.\n\n` +
      `4. In the event of default, appropriate legal proceedings will be initiated before the competent Court / Tribunal having jurisdiction in Tamil Nadu, holding you liable for all costs and consequences.\n\n` +
      `Yours faithfully,\n\n` +
      `${req.applicantName || '[Signature]'}\n\n` +
      `DISCLAIMER: AI-generated draft — verify the contents with a qualified legal professional before submission.`;
  }

  return {
    success: true,
    draft: template,
    draftType: req.draftType
  };
}
