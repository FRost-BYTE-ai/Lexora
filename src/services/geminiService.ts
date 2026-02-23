import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getLegalResponse = async (query: string, language: 'ta' | 'en') => {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are LexTamil, an expert AI legal assistant specializing in Tamil Nadu laws.
    Your goal is to simplify complex legal jargon into easy-to-understand explanations for common citizens.
    
    Rules:
    1. If the user provides a case law citation (e.g., "2023 SCC OnLine Mad 1234", "AIR 2022 SC 1"), prioritize finding that specific judgment using Google Search.
    2. For citations:
       - Provide the full case name and parties involved.
       - Summarize the facts of the case.
       - Explain the final judgment/order in simple terms.
       - Highlight the legal principle established.
       - Provide a link to the full judgment if found in search results.
    3. If the user asks a general question in Tamil, respond primarily in Tamil with English legal terms in brackets where necessary.
    4. If the user asks in English, respond in English but offer a Tamil summary.
    5. Focus on Tamil Nadu specific laws (e.g., TN Land Reforms, TN Consumer Protection, etc.).
    6. Always include a disclaimer that this is not professional legal advice.
    7. Classify the query into one of these: Civil, Criminal, Property, Consumer, Family Law.
    8. Structure your response with:
       - Summary (Simplified)
       - Key Legal Points
       - Relevant Acts/Sections
       - Relevant Case Laws & Judgments (Search for actual Tamil Nadu high court or Supreme Court cases related to the query. Provide a brief summary of the case, key points, and outcomes in simple Tamil/English based on preference.)
       - Next Steps/Advice
    
    Current Language Preference: ${language === 'ta' ? 'Tamil' : 'English'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: query,
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks?.map(chunk => ({
      title: chunk.web?.title || 'Source',
      uri: chunk.web?.uri || ''
    })).filter(s => s.uri) || [];

    return { text, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const classifyQuery = async (text: string) => {
  const response = await fetch("/api/classify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return response.json();
};
