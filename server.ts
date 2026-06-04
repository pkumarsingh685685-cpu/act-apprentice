import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Search endpoint
  app.post("/api/ai-search", async (req, res) => {
    try {
      const { query } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is missing. Please set it in Settings." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Simple AI model prompt to translate natural language into structured search
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are an AI assistant for a Railway Enterprise HR system.
Translate the user's query into structured parameters.

User Query: "${query}"

Return a JSON object matching this schema.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: { type: Type.STRING, description: "One of: employee_search, stipend_search, attendance_search, pending_sf, all_sf, training_search, medical_search, dynamic_register_search, google_sheet_search" },
              employeeId: { type: Type.STRING, description: "Extract if present e.g. EMP000123. Only the ID, no other words." },
              employeeName: { type: Type.STRING, description: "Extract name if present. Only the core name, no conversational text." },
              trade: { type: Type.STRING, description: "Extract trade such as Electrician, Fitter, etc. Clean and capitalized." },
              month: { type: Type.STRING, description: "Extract Month string like April. Clean." },
              year: { type: Type.STRING, description: "Extract Year like 2026. Clean." },
              status: { type: Type.STRING, description: "Extract exact status or form type (e.g., 'pending', 'issued', 'sf5', 'sf11'). Do NOT include conversational text, complaints, or user chat (e.g. do not extract 'sf5 dekho' or '0 found'), just the core keyword." },
              registerName: { type: Type.STRING, description: "If intent is dynamic_register_search, extract the register name" },
              sheetName: { type: Type.STRING, description: "If intent is google_sheet_search, extract the google sheet name user is referring to." },
              explanation: { type: Type.STRING, description: "Explain what we are searching for naturally." }
            },
            required: ["intent", "explanation"]
          }
        }
      });

      const structuredPlan = JSON.parse(response.text.trim());
      res.json(structuredPlan);
      
    } catch (error: any) {
      console.error("AI Search Error:", error);
      res.status(500).json({ error: error.message || "Failed to process AI search." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
