import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateLegalDraftServer } from '../server/legalEngine.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { draftType, applicantName, respondentName, jurisdiction, language, facts, reliefSought } = req.body || {};
    if (!draftType || !facts) {
      return res.status(400).json({ error: 'draftType and facts are required' });
    }

    const result = await generateLegalDraftServer({
      draftType,
      applicantName,
      respondentName,
      jurisdiction: jurisdiction || 'TN',
      language: language || 'ta',
      facts,
      reliefSought: reliefSought || 'Statutory compliance and immediate restitution'
    });

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: 'Draft generation failed', details: error?.message });
  }
}
