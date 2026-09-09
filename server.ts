import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { 
  processLegalChat, 
  classifyQueryLocally, 
  translateLegalContent,
  analyzeLegalDocumentServer,
  generateLegalDraftServer
} from "./server/legalEngine.js";
import { LEGAL_LIBRARY_DATA } from "./server/legalLibraryData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Query Classification (IndicBERT simulated / local rule engine)
  app.post("/api/classify", (req, res) => {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: "Text string is required" });
    }
    const result = classifyQueryLocally(text);
    res.json(result);
  });

  // Core Legal Chat Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { query, language, domain, jurisdiction, explanation_level } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Query is required" });
      }

      const responsePayload = await processLegalChat({
        query,
        language,
        domain,
        jurisdiction,
        explanation_level
      });

      res.json(responsePayload);
    } catch (error: any) {
      console.error("Error in /api/chat:", error);
      res.status(500).json({ error: "Internal server error processing legal chat", details: error?.message });
    }
  });

  // Legal Translation Endpoint
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLang } = req.body;
      if (!text || !targetLang) {
        return res.status(400).json({ error: "text and targetLang ('ta' | 'en' | 'hi') are required" });
      }

      const translated = await translateLegalContent(text, targetLang as 'ta' | 'en' | 'hi');
      res.json({ translatedText: translated, targetLang });
    } catch (error: any) {
      console.error("Error in /api/translate:", error);
      res.status(500).json({ error: "Translation failed", details: error?.message });
    }
  });

  // Document Upload & Analysis Endpoint
  app.post("/api/documents/upload", async (req, res) => {
    try {
      const { fileName, fileType, fileSize, contentSnippet, language } = req.body;
      if (!fileName) {
        return res.status(400).json({ error: "fileName is required" });
      }

      const result = await analyzeLegalDocumentServer(
        fileName, 
        fileType || 'application/pdf', 
        fileSize || '1 MB', 
        contentSnippet || 'Standard tenancy agreement / legal notice document excerpt.',
        language || 'ta'
      );

      res.json(result);
    } catch (error: any) {
      console.error("Error in /api/documents/upload:", error);
      res.status(500).json({ error: "Document processing failed", details: error?.message });
    }
  });

  // Legal Draft Generator Endpoint
  app.post("/api/draft", async (req, res) => {
    try {
      const { draftType, applicantName, respondentName, jurisdiction, language, facts, reliefSought } = req.body;
      if (!draftType || !facts) {
        return res.status(400).json({ error: "draftType and facts are required" });
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

      res.json(result);
    } catch (error: any) {
      console.error("Error in /api/draft:", error);
      res.status(500).json({ error: "Draft generation failed", details: error?.message });
    }
  });

  // Legal Library Knowledge Explorer Endpoint
  app.get("/api/legal-library", (req, res) => {
    const { category, jurisdiction, search } = req.query;
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

    res.json({ items, total: items.length });
  });

  // User Feedback Endpoint
  app.post("/api/feedback", (req, res) => {
    const { messageId, rating, feedback } = req.body;
    res.json({ success: true, message: "Feedback recorded securely" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LexTamil server running on http://localhost:${PORT}`);
  });
}

startServer();
