import type { VercelRequest, VercelResponse } from '@vercel/node';
import { translateLegalContent } from '../server/legalEngine.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, targetLang } = req.body || {};
    if (!text || !targetLang) {
      return res.status(400).json({ error: 'text and targetLang are required' });
    }

    const translatedText = await translateLegalContent(text, targetLang);
    return res.status(200).json({ translatedText, targetLang });
  } catch (error: any) {
    return res.status(500).json({ error: 'Translation failed', details: error?.message });
  }
}
