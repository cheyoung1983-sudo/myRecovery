import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load Spokane resources to provide context to Gemini
import { SPOKANE_RESOURCES } from "./src/constants";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { prompt, history = [] } = req.body;
      
      const resourcesContext = SPOKANE_RESOURCES.map(r => 
        `- ${r.name} (${r.category}): ${r.description}. Phone: ${r.phone}`
      ).join("\n");

      const systemInstruction = `
        You are "Sober Spokane", a compassionate peer-support AI guide for individuals in recovery in Spokane, WA.
        Your tone is non-judgmental, encouraging, and informative.
        
        Available Local Resources:
        ${resourcesContext}
        
        Guidelines:
        1. If someone is in crisis, prioritize suggesting 988 or local emergency services.
        2. Provide specific recommendations from the provided Spokane resources list.
        3. Use a "we are in this together" tone.
        4. Do not give medical advice; always suggest consulting professionals.
        5. Keep responses concise and formatted with markdown for readability.
        6. If asked about meetings, mention that they can find a list in the "Meetings" tab of this app.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI response" });
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
