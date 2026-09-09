import type { VercelRequest, VercelResponse } from '@vercel/node';
import { classifyQueryLocally } from '../server/legalEngine.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text string is required' });
  }

  const result = classifyQueryLocally(text);
  return res.status(200).json(result);
}
