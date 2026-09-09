import type { VercelRequest, VercelResponse } from '@vercel/node';
import { analyzeLegalDocumentServer } from '../server/legalEngine.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileType, fileSize, contentSnippet } = req.body || {};
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }

    const result = await analyzeLegalDocumentServer(
      fileName,
      fileType || 'application/pdf',
      fileSize || '1 MB',
      contentSnippet || 'Standard legal document excerpt'
    );

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: 'Document analysis failed', details: error?.message });
  }
}
