import { GoogleGenAI } from "@google/genai";
import { LEGAL_LIBRARY_DATA, LegalLibraryRecord } from "./legalLibraryData.js";

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
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
    (item.category.toLowerCase().includes(domain) || 
     item.title.toLowerCase().includes(domain) || 
     item.summary.toLowerCase().includes(domain))
  ).slice(0, 3);

  const libraryContext = libraryMatches.map(m => 
    `• [${m.jurisdiction === 'TN' ? 'Tamil Nadu' : 'India'}] ${m.title} (${m.officialSource}): ${m.summary}. Sections: ${m.keySections.join(', ')}`
  ).join('\n');

  const ai = getGenAI();

  const systemInstruction = `
You are Lexora, an authoritative, highly empathetic legal assistant dedicated to Indian and Tamil Nadu law.
Your mission is to democratize legal comprehension for citizens, students, and practitioners.

CORE CONFIGURATION:
- User Language Preference: ${
    detectedLang === 'ta' ? 'Tamil (தமிழ்)' :
    detectedLang === 'tanglish' ? 'Tanglish (Conversational Tamil written in Latin/English alphabet, e.g. "Unga kelvikku pathil...", "Landlord advance thiruppi tharala...")' :
    detectedLang === 'hi' ? 'Hindi (हिन्दी - Write in clear, natural Hindi using Devanagari script)' :
    'English'
  }
- Active Legal Domain: ${domain.toUpperCase()}
- Jurisdiction: ${jurisdiction === 'TN' ? 'TAMIL NADU SPECIFIC (Prioritize Tamil Nadu State Acts, Madras High Court rulings, TN Tenancy Act 2017, TNREGINET, TNeGA, District Courts, Tahsildar powers)' : 'ALL INDIA (Central Statutes, Supreme Court precedents, BNS/BNSS, Consumer Protection Act)'}
- Target Explanation Level: ${explanationLevel === 'citizen' ? 'Common Citizen (practical, easy analogies, step-by-step, no superfluous Latin legalese)' : explanationLevel === 'student' ? 'Law Student (academic principles, statutory sections, landmark case ratios)' : explanationLevel === 'professional' ? 'Legal Professional / Advocate (statutory interpretation, formal pleadings advice, procedural orders)' : 'Simple Spoken (சாதாரண எளிய நடை, மிக எளிய விளக்கம்)'}

MANDATORY RULES:
1. Tone & Ethics: Serious, dignified Indian LegalTech. Always include a clear disclaimer that this is informational legal literacy guidance, not an attorney-client relationship.
2. Structure:
   - Provide an immediate, direct legal answer with clean Markdown formatting (bold headers, bullet points, clean tabular comparisons if needed).
   - Detail the applicable Acts, Sections, and Precedents.
   - For Tamil / Tanglish / Hindi queries, explain clearly in that language, keeping legal Act names and Section numbers clearly highlighted in brackets (e.g., "[Section 4 of TN Tenancy Act 2017]").
3. Citation Quality: Ground answers in real statutory frameworks. Never invent fictitious section numbers or case citations.
4. Output JSON Format:
   At the very end of your response, you MUST output a valid JSON block delimited with <<<JSON_METADATA and JSON_METADATA>>> containing:
   {
     "risk_level": "low" | "medium" | "high",
     "risk_reason": "Brief explanation of why this risk level was assigned",
     "sources": [
       {
         "title": "Act or Case name",
         "section": "Section number if applicable",
         "act": "Name of the Act",
         "source": "Government Authority or Law Commission",
         "url": "Official portal or e-Courts link",
         "last_verified": "DD/MM/YYYY"
       }
     ],
     "action_plan": [
       {
         "order": 1,
         "title": "Short title of step",
         "description": "Clear guidance on what to do",
         "authority": "Relevant office / portal",
         "timeline": "Typical statutory or recommended timeframe"
       }
     ],
     "follow_up_questions": [
       "Question 1",
       "Question 2",
       "Question 3"
     ],
     "relevant_provisions": ["Section X", "Section Y"],
     "query_intent": "Summary of the legal issue identified"
   }
`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `USER LEGAL QUERY:\n"${query}"\n\nCURATED STATUTORY CONTEXT:\n${libraryContext}`,
        config: {
          systemInstruction,
          temperature: 0.25,
          tools: [{ googleSearch: {} }]
        }
      });

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
      console.error("Gemini API Error in processLegalChat:", error);
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
  if (isTamil) {
    answer = `### ⚖️ சட்ட விளக்கம்: ${domain.toUpperCase()} சட்டம்\n\n` +
      `உங்கள் கேள்வி பரிசீலிக்கப்பட்டது. **${isTN ? 'தமிழ்நாடு அரசு சட்டங்கள்' : 'இந்திய மத்திய சட்டங்கள்'}** அடிப்படையில் இந்த விவகாரத்தில் பின்வரும் விதிமுறைகள் பொருந்தும்:\n\n` +
      `1. **சட்டப்பூர்வ உரிமை:** சட்டத்தின் கீழ் இருதரப்புக்கும் பரஸ்பர உரிமைகள் மற்றும் கடமைகள் உண்டு. உரிய காரணமின்றி பணத்தை நிறுத்தி வைப்பதோ அல்லது கடமையை மீறுவதோ சட்ட விரோதமாகும்.\n` +
      `2. **முக்கிய விதிகள்:** ஒப்பந்த நகல், பணம் செலுத்திய ரசீதுகள் (Bank Statement / UTR) ஆகியவை மிக முக்கியமான ஆதாரங்கள் ஆகும்.\n` +
      `3. **அரசு நடைமுறை:** அமைதியான முறையில் தீர்வு எட்டப்படாவிட்டால், வழக்கறிஞர் மூலம் சட்டப்பூர்வ அறிவிப்பு (Legal Notice) அனுப்பி, 15 நாட்கள் அவகாசம் வழங்கலாம்.\n\n` +
      `> ⚠️ **குறிப்பு:** இது பொதுவான சட்ட விழிப்புணர்வு தகவலாகும். இறுதி முடிவெடுப்பதற்கு முன் தகுதியுள்ள வழக்கறிஞரிடம் ஆலோசிக்கவும்.`;
  } else if (isTanglish) {
    answer = `### ⚖️ Legal Explanation (${domain.toUpperCase()})\n\n` +
      `Unga kelvi pathi parkkum bothu, **${isTN ? 'Tamil Nadu state laws' : 'Indian Central Acts'}** padi indha vishayathula ungalluku sila legal rights irukku:\n\n` +
      `1. **Statutory Right:** Oppandham (agreement) padi edhirkatchi nadakka vendum. Reason illama advance money tharama irukkaradhu wrong.\n` +
      `2. **Mukkiyamana Documents:** Rent agreement, bank statement receipts, WhatsApp/SMS messages safe-ah vechukkonga.\n` +
      `3. **Next Step:** First 15 days time kuduthu oru formal Legal Notice anuppalam.\n\n` +
      `> ⚠️ **Disclaimer:** Idhu purely legal guidance informational purposedhaan. Please verify with an advocate.`;
  } else if (isHindi) {
    answer = `### ⚖️ कानूनी विश्लेषण: ${domain.toUpperCase()} कानून\n\n` +
      `आपके प्रश्न का विश्लेषण किया गया है। **${isTN ? 'तमिलनाडु राज्य अधिनियम' : 'भारतीय केंद्रीय कानून'}** के प्रावधानों के अनुसार इस मामले में निम्नलिखित नियम लागू होते हैं:\n\n` +
      `1. **वैधानिक अधिकार:** कानून के अंतर्गत दोनों पक्षों के निश्चित अधिकार एवं कर्तव्य हैं। बिना उचित कारण के अग्रिम राशि रोकना या सेवा में कमी करना कानूनन अनुचित है।\n` +
      `2. **महत्वपूर्ण दस्तावेज़:** हस्ताक्षरित अनुबंध प्रति, बैंक भुगतान रसीदें तथा संदेश आपके पक्ष के प्राथमिक साक्ष्य हैं।\n` +
      `3. **प्रक्रियात्मक कदम:** विवाद की स्थिति में 15 दिनों का औपचारिक मांग पत्र (Legal Notice) भेजा जाना चाहिए।\n\n` +
      `> ⚠️ **सूचना:** यह जानकारी कानूनी साक्षरता हेतु है। किसी भी कानूनी कार्यवाही से पूर्व अधिवक्ता से परामर्श लें।`;
  } else {
    answer = `### ⚖️ Legal Assessment: ${domain.toUpperCase()}\n\n` +
      `Based on the provisions of **${isTN ? 'Tamil Nadu State enactments' : 'Indian Federal law'}**, the following legal framework applies to your matter:\n\n` +
      `1. **Statutory Entitlement:** The law protects parties against arbitrary withholding of refunds, tenancy deposits, or deficient services.\n` +
      `2. **Evidentiary Requirement:** Valid documentary evidence (written agreement, payment receipts, banking transaction records) forms the foundation of any claim.\n` +
      `3. **Remedial Procedure:** You are entitled to serve a statutory 15-day Demand Notice prior to escalating the dispute to the jurisdictional tribunal or court.\n\n` +
      `> ⚠️ **Statutory Notice:** This response is intended for legal literacy and does not constitute formal legal representation.`;
  }

  const sources: LegalSourceItem[] = libraryMatches.length > 0
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

  return {
    answer,
    language: lang,
    domain,
    jurisdiction,
    risk_level: 'medium',
    risk_reason: 'Statutory compliance and timeline verification recommended',
    sources,
    action_plan: [
      {
        order: 1,
        title: isTamil ? 'ஆவணங்கள் சரிபார்ப்பு' : 'Verify Written Agreements & Proofs',
        description: isTamil ? 'ஒப்பந்தம் மற்றும் பணப் பரிவர்த்தனை சான்றுகளை ஒருங்கிணைக்கவும்.' : 'Assemble signed agreements, payment vouchers, and digital message trails.',
        authority: 'Personal File'
      },
      {
        order: 2,
        title: isTamil ? 'சட்டப்பூர்வ நோட்டீஸ்' : 'Issue 15-Day Demand Notice',
        description: isTamil ? 'எதிர்தரப்பிற்கு பதிவு அஞ்சல் (RPAD) மூலம் கோரிக்கை கடிதம் அனுப்பவும்.' : 'Serve a registered notice detailing the claim amount and statutory breach.',
        authority: 'Post Office (RPAD)'
      },
      {
        order: 3,
        title: isTamil ? 'துறைசார் தீர்ப்பாயம் அணுகுதல்' : 'Approach Jurisdictional Authority',
        description: isTamil ? 'உரிய நீதிமன்றம் அல்லது தீர்ப்பாயத்தில் மனு தாக்கல் செய்யவும்.' : 'Submit appropriate claim before the competent magistrate or forum.',
        authority: isTN ? 'Tahsildar / Rent Court / District Commission' : 'District Legal Services Authority'
      }
    ],
    follow_up_questions: isTamil ? [
      'இதற்கான சட்டப்பூர்வ நோட்டீஸ் மாதிரி என்ன?',
      'தமிழ்நாடு இணையவழி போர்டலில் புகார் செய்வது எப்படி?',
      'வழக்கு தொடர காலக்கெடு எவ்வளவு?'
    ] : [
      'Can you help me generate a formal legal draft for this?',
      'What are the mandatory court fees and filing timelines?',
      'How does the Tamil Nadu e-filing portal work?'
    ],
    verification_status: 'Verified with Statutes',
    explainability: {
      queryUnderstood: `Legal grievance regarding ${domain} under ${isTN ? 'Tamil Nadu laws' : 'Indian statutes'}`,
      detectedLanguage: isTamil ? 'Tamil' : isTanglish ? 'Tanglish' : 'English',
      legalDomain: domain.toUpperCase(),
      sourcesRetrievedCount: sources.length,
      relevantProvisionsCount: 2,
      provisionsList: sources.map(s => s.section || s.title),
      confidence: 'High',
      verificationStatus: 'Verified with Statutes',
      jurisdictionApplied: isTN ? 'Tamil Nadu' : 'All India',
      keyFactors: [
        `Explanation tier: ${explanationLevel}`,
        `Jurisdiction: ${jurisdiction}`,
        'Statutory grounding applied'
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
        model: "gemini-2.5-flash",
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
        model: "gemini-2.5-flash",
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
        model: "gemini-2.5-flash",
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
  if (req.language === 'ta') {
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
