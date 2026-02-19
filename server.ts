import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mocking the ML model responses for the demo
  // In a real scenario, these would call Hugging Face or local Python services
  app.post("/api/classify", (req, res) => {
    const { text } = req.body;
    // Simple mock classification logic
    const categories = ["Civil", "Criminal", "Property", "Consumer", "Family Law"];
    const category = categories[Math.floor(Math.random() * categories.length)];
    res.json({ category, confidence: 0.92 });
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
