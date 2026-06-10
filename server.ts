import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use((req, res, next) => {
    const logMsg = `[${new Date().toISOString()}] ${req.method} ${req.url} - Type: ${req.headers["content-type"]} - UserAgent: ${req.headers["user-agent"]}\n`;
    try {
      fs.appendFileSync(path.join(process.cwd(), "public", "server-debug.log"), logMsg);
    } catch (e) {}
    console.log(`[SERVER REQUEST LOG] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());

  // Serve uploaded files statically under /uploads from the public/uploads directory
  app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

  // Diagnostic route
  app.get("/api/test-log", (req, res) => {
    try {
      fs.writeFileSync(path.join(process.cwd(), "test-write.txt"), "Express server is functioning and writeable!");
      res.json({ ok: true, message: "Logged successfully", cwd: process.cwd() });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // Upload endpoint
  app.post("/api/upload", (req, res) => {
    const logMsg = `[${new Date().toISOString()}] ENTERED /api/upload - Content-Type: ${req.headers["content-type"]}\n`;
    try {
      fs.appendFileSync(path.join(process.cwd(), "server-debug.log"), logMsg);
    } catch (e) {}

    upload.single("file")(req, res, async (err) => {
      if (err) {
        const errMsg = err.message || String(err);
        const errLog = `[${new Date().toISOString()}] MULTER ERROR IN ROUTE: ${errMsg}\n`;
        try {
          fs.appendFileSync(path.join(process.cwd(), "server-debug.log"), errLog);
        } catch (e) {}
        console.error("=== MULTER ERROR ===", err);
        return res.status(400).json({ error: `File parsing failed: ${errMsg}` });
      }

      try {
        const file = req.file;
        if (!file) {
          const noFileLog = `[${new Date().toISOString()}] FILE IS MISSING IN REQUEST\n`;
          try {
            fs.appendFileSync(path.join(process.cwd(), "server-debug.log"), noFileLog);
          } catch (e) {}
          console.warn("Client requested upload but no file field was populated under key 'file'");
          return res.status(400).json({ error: "No file uploaded. Please ensure the parameter name is 'file'." });
        }

        const folder = req.body.folder || "uploads";
        const cloudinaryName = (req.body.cloudinaryName || "").trim();
        const cloudinaryPreset = (req.body.cloudinaryPreset || "").trim();

        const successLog = `[${new Date().toISOString()}] MULTER PARSED SUCCESS - File: ${file.originalname}, Size: ${file.size}, Folder: ${folder}\n`;
        try {
          fs.appendFileSync(path.join(process.cwd(), "server-debug.log"), successLog);
        } catch (e) {}

        console.log("=== SERVER SIDE UPLOAD ===", {
          fileName: file.originalname,
          fileSize: file.size,
          contentType: file.mimetype,
          folder,
          hasCloudinary: !!(cloudinaryName && cloudinaryPreset)
        });

        // Save file locally to disk under public/uploads/
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const uniqueFileName = `${Date.now()}_${sanitizedName}`;
        const uploadsDir = path.join(process.cwd(), "public", "uploads");

        try {
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const filePath = path.join(uploadsDir, uniqueFileName);
          fs.writeFileSync(filePath, file.buffer);
          console.log("File successfully saved to local path:", filePath);
        } catch (localWriteErr: any) {
          console.error("Failed to write file to local disk:", localWriteErr);
        }

        const localUrl = `/uploads/${uniqueFileName}`;

        if (cloudinaryName && cloudinaryPreset) {
          try {
            console.log("Uploading to Cloudinary...", { cloudinaryName, cloudinaryPreset });
            
            if (typeof FormData === "undefined" || typeof Blob === "undefined") {
              console.warn("FormData or Blob is not defined in this Node environment. Falling back to local storage.");
              return res.json({ url: localUrl });
            }

            const formData = new FormData();
            const blob = new Blob([file.buffer], { type: file.mimetype });
            formData.append("file", blob, file.originalname);
            formData.append("upload_preset", cloudinaryPreset);

            const response = await fetch(
              `https://api.cloudinary.com/v1_1/${cloudinaryName}/auto/upload`,
              {
                method: "POST",
                body: formData,
              }
            );

            if (response.ok) {
              const data = await response.json() as any;
              console.log("Cloudinary upload success:", data.secure_url);
              return res.json({ url: data.secure_url });
            } else {
              const errorData = await response.json() as any;
              const cloudinaryErrorMsg = errorData.error?.message || "Failed to upload to Cloudinary";
              console.warn("Cloudinary failed, falling back to local storage:", cloudinaryErrorMsg);
              return res.json({ url: localUrl });
            }
          } catch (cloudinaryErr: any) {
            console.warn("Cloudinary exception, falling back to local storage:", cloudinaryErr.message || String(cloudinaryErr));
            return res.json({ url: localUrl });
          }
        } else {
          console.log("Cloudinary credentials not completely provided. Storing file on local server.");
          return res.json({ url: localUrl });
        }
      } catch (globalErr: any) {
        const errMsg = globalErr.message || String(globalErr);
        const logMsg = `[${new Date().toISOString()}] GLOBAL UPLOAD ERROR: ${errMsg}\n`;
        try {
          fs.appendFileSync(path.join(process.cwd(), "server-debug.log"), logMsg);
        } catch (e) {}
        console.error("Global upload handler error:", globalErr);
        res.status(500).json({ error: globalErr.message || "Failed to upload file." });
      }
    });
  });

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

  // AI Answer Synthesis endpoint
  app.post("/api/ai-answer", async (req, res) => {
    try {
      const { query, records } = req.body;
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

      // Construct a clean summary of matching records to ground the model
      const recordsSummary = JSON.stringify(records, null, 2);

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are an intelligent AI Assistant for a Railway Enterprise HR & Records System.
You have been asked a question by the user, and we have fetched some relevant records from our database and connected Google Sheets to assist you.

User's Original Question: "${query}"

Here are the retrieved records matching or closest to their query:
${recordsSummary}

Your Goal:
Write a friendly, highly accurate, direct and comprehensive response answering the user's question based on the retrieved records.
Rules:
1. Always base your calculations, names, values, and answers strictly on the retrieved records. If no records are present or records array is empty, politely explain that no database entries or Google Sheets matched their query terms, and ask them to broaden their search or verify input terms.
2. Answer in a mix of Hindi and English (Hinglish/transliterated) or the language of their query so it reads naturally and is easy to understand for the Indian Railway employee/admin user. E.g. "EMP000123 (Ravi Kumar) ka stipend record..." or "Hume koi relevant data nahi mila..."
3. Be precise and specific! Highlight numbers, employee IDs, status, dates, names and amounts in markdown bold so the user can easily spot them.
4. If some information is missing or there's an issue with records (e.g. status is pending/unpaid), point it out clearly and objectively. Do NOT make up any numbers.
5. Do NOT mention database fields, JSON structures, or system technical terminology like "collection", "JSON payload", "fetched from collection name database". Talk in direct business/company terms (e.g., "Mera search database card", "Google Sheet record", "Company files").
6. Ensure your formatting is clean with markdown list items if listing multiple values. Keep the response professional yet conversational.`,
      });

      const answerText = response.text || "No response generated by the AI.";
      res.json({ answer: answerText });

    } catch (error: any) {
      console.error("AI Answer synthesis error:", error);
      res.status(500).json({ error: error.message || "Failed to synthesize AI answer." });
    }
  });

  // AI Response Orchestrator Endpoint
  app.post("/api/ai-orchestrate", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query parameter is required and must be a string." });
      }

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

      console.log(`=== AI ORCHESTRATOR REQUEST (Gemini-Only): "${query}" ===`);

      // Parallel Gemini perspectives
      // 1. Gemini Fast Engine (Direct, structured focus)
      const geminiFastPromise = (async () => {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `Answer the following query as Gemini Fast Engine. Provide a direct, highly structured, clear overview of the facts or rules.
User Query: "${query}"`,
          });
          return response.text || "";
        } catch (err: any) {
          return `Gemini Fast Error: ${err.message || String(err)}`;
        }
      })();

      // 2. Gemini Analyst Engine (Deep investigative, edge-cases, citations focus)
      const geminiAnalystPromise = (async () => {
         try {
           const response = await ai.models.generateContent({
             model: "gemini-3.5-flash",
             contents: `Answer the following query as Gemini Analyst Engine. Analyze the background context, examine possible circular updates, suggest relevant categories or compliance checks, and outline potential policy codes or references (e.g. Indian Railway/Govt guidelines) if applicable. 
User Query: "${query}"`,
           });
           return response.text || "";
         } catch (err: any) {
           return `Gemini Analyst Error: ${err.message || String(err)}`;
         }
      })();

      // Run parallel calls
      const [fastRes, analystRes] = await Promise.all([
        geminiFastPromise,
        geminiAnalystPromise
      ]);

      console.log("Orchestrator: Parallel Gemini representations of query received.");

      // Synthesize and orchestrate through master verify prompt
      const verificationResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are the ultimate AI Response Orchestrator for a professional Railway and Office Assistance Portal.
You have been given a user query and the answers from two separate Google Gemini perspectives (Gemini Fast and Gemini Analyst). Your job is to collect, verify, cross-check, and synthesize a single, flawless, highly reliable verified answer.

User Original Query: "${query}"

Here are the retrieved responses to cross-check:

=== GEMINI FAST RESPONSE ===
${fastRes}

=== GEMINI ANALYST RESPONSE ===
${analystRes}

==================================
ORCHESTRATION INSTRUCTIONS:
==================================
Step 1:
Analyze each response based on:
A. Factual correctness & reliability
B. Completeness
C. Logical consistency
D. Presence of contradictions (If they contradict, reduce confidence score)
E. Confidence level
F. Presence of official sources/citations (particularly Indian Railways / Govt rules if relevant)
G. Freshness of information (accounting for year 2026)

Step 2:
Synthesize the FINAL VERIFIED ANSWER:
- Merge the strongest points of both responses.
- Remove duplicate information or conversational fluff.
- Strip out any hallucinations or unsupported claims.
- If the question involves: Railway Board Circulars, Pension, Settlement Dues, D&AR Rules, Establishment, Government Orders, or Legal Matters, prioritize official documents and consensus. Never invent circular numbers or legal policies.
- If information cannot be verified, explicitly add: "Information could not be independently verified. Please refer to the relevant official notification or authority."
- The answer must be clear, professionally formatted with markdown, and use standard office/railway terminology. Answer in a natural tone (Hindi-English Hinglish is allowed if appropriate or if the query contains Hindi).

Step 3:
Assign confidence scores (0-100) to each perspective and a final combined confidence score representing the consensus.

Provide your final outcome strictly as a valid JSON object matching the requested schema.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              success: { type: Type.BOOLEAN },
              query: { type: Type.STRING },
              verification: {
                type: Type.OBJECT,
                properties: {
                  gemini_fast_score: { type: Type.INTEGER, description: "Confidence score for Gemini Fast (0-100)" },
                  gemini_analyst_score: { type: Type.INTEGER, description: "Confidence score for Gemini Analyst (0-100)" },
                  final_confidence: { type: Type.INTEGER, description: "Calculated final combined confidence (0-100)" }
                },
                required: ["gemini_fast_score", "gemini_analyst_score", "final_confidence"]
              },
              sources_used: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              final_answer: { type: Type.STRING, description: "Fully synthesized, verified, and markdown-formatted final answer." },
              citations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["success", "query", "verification", "sources_used", "final_answer", "citations"]
          }
        }
      });

      const result = JSON.parse(verificationResponse.text.trim());
      console.log("Orchestrator: Successfully synthesized Gemini response with confidence:", result.verification?.final_confidence);
      res.json(result);

    } catch (error: any) {
      console.error("AI Response Orchestration error:", error);
      res.status(500).json({ error: error.message || "Failed to orchestrate AI responses." });
    }
  });

  // Global API Error Handler
  app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("=== SERVER API ROUTE ERROR ===", err);
    res.status(err.status || 500).json({
      error: err.message || "An internal server error occurred while processing your request"
    });
  });

  // Return JSON 404 for any unmatched /api requests so they never fall through to SPA HTML
  app.all("/api/*", (req, res) => {
    const unmatchedLog = `[${new Date().toISOString()}] UNMATCHED API ROUTE: ${req.method} ${req.url}\n`;
    try {
      fs.appendFileSync(path.join(process.cwd(), "server-debug.log"), unmatchedLog);
    } catch (e) {}
    console.warn(`[API 404] Unmatched API path: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API endpoint ${req.method} ${req.url} was not found on this server.` });
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
