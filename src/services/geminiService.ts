import { sendLegalQuery, classifyQueryApi } from "./legalApiService";

export const getLegalResponse = async (query: string, language: 'ta' | 'en' | 'tanglish' = 'ta') => {
  try {
    const data = await sendLegalQuery({
      query,
      language: language as any,
      domain: 'general',
      jurisdiction: 'TN',
      explanation_level: 'citizen'
    });

    return {
      text: data.answer,
      sources: data.sources.map(s => ({
        title: s.title,
        uri: s.url || ''
      }))
    };
  } catch (error) {
    console.error("Legal Response error:", error);
    throw error;
  }
};

export const classifyQuery = async (text: string) => {
  return classifyQueryApi(text);
};
