import type { VercelRequest, VercelResponse } from '@vercel/node';
import { LEGAL_LIBRARY_DATA } from '../server/legalLibraryData.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { category, jurisdiction, search } = req.query || {};
  let items = [...LEGAL_LIBRARY_DATA];

  if (category && typeof category === 'string') {
    items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
  }
  if (jurisdiction && typeof jurisdiction === 'string') {
    items = items.filter(i => i.jurisdiction === jurisdiction);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    items = items.filter(i => 
      i.title.toLowerCase().includes(q) || 
      i.titleTamil.toLowerCase().includes(q) || 
      i.summary.toLowerCase().includes(q) ||
      i.summaryTamil.toLowerCase().includes(q)
    );
  }

  return res.status(200).json({ items, total: items.length });
}
