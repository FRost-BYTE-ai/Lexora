import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processLegalChat } from '../server/legalEngine.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, language, domain, jurisdiction, explanation_level } = req.body || {};
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const payload = await processLegalChat({
      query,
      language,
      domain,
      jurisdiction,
      explanation_level
    });

    return res.status(200).json(payload);
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    return res.status(500).json({ error: 'Internal server error', details: error?.message });
  }
}
