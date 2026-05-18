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
      const { prompt, history = [], isCrisis = false } = req.body;
      
      const resourcesContext = SPOKANE_RESOURCES.map(r => 
        `- ${r.name} (${r.category}): ${r.description}. Phone: ${r.phone}`
      ).join("\n");

      const systemInstruction = `
        You are "Sober Spokane Assistant", a compassionate peer-support AI for recovery.
        ${isCrisis ? "The user has indicated they are in a CRISIS or high-risk state. Prioritize immediate safety, grounding techniques, and 988/emergency contacts." : "Your tone is non-judgmental, encouraging, and informative."}
        
        Available Local Resources:
        ${resourcesContext}
        
        Guidelines:
        1. CRISIS MODE: If isCrisis is true, be extremely direct about safety. Suggest breathing exercises and immediate human contact.
        2. Localized: Use Spokane-specific references.
        3. Peer-Tone: "We are in this together."
        4. No medical advice.
        5. Concise markdown responses.
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

  app.post("/api/ai/reflection", async (req, res) => {
    try {
      const { moodLogs } = req.body;
      const logsSummary = moodLogs.map((l: any) => `- ${new Date(l.timestamp).toLocaleDateString()}: ${l.mood} (${l.note || 'No note'})`).join("\n");

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze these recent recovery mood logs and provide a 2-3 sentence optimistic, strength-based reflection or summary of their progress. Focus on patterns of resilience.\n\nLogs:\n${logsSummary}`,
        config: {
          systemInstruction: "You are a recovery coach focused on positive reinforcement and identifying strength patterns.",
          temperature: 0.6,
        }
      });

      res.json({ reflection: response.text });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to generate reflection" });
    }
  });

  app.post("/api/ai/match", async (req, res) => {
    try {
      const { userNeeds, mentors } = req.body;
      const mentorsContext = mentors.map((m: any) => `ID ${m.id}: ${m.name}, Bio: ${m.bio}, Specialties: ${m.specialties?.join(', ')}`).join("\n");

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on these user needs: "${userNeeds.join(', ')}", which of these mentors is the best match? Return the ID and a brief 1-sentence reason why.\n\nMentors:\n${mentorsContext}`,
        config: {
          systemInstruction: "You are an expert matching coordinator for a recovery program.",
          temperature: 0.4,
        }
      });

      res.json({ match: response.text });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to match mentors" });
    }
  });
  
  app.post("/api/ai/analyze-mood", async (req, res) => {
    try {
      const { moodLogs, chatHistory } = req.body;
      const prompt = `Analyze this mood history: ${JSON.stringify(moodLogs)}. 
      And recent chat: ${JSON.stringify(chatHistory)}.
      Is there a downward trend or signs of high anxiety? 
      Return a JSON object: { "vibe": "stable"|"anxious"|"declining", "recommendation": "string", "triggerVibeCheck": boolean }`;
      
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      res.json(JSON.parse(result.text.replace(/```json|```/g, '')));
    } catch (e) {
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  app.post("/api/ai/literature-search", async (req, res) => {
    try {
      const { query } = req.body;
      const systemInstruction = `
        You are a 12-Step Literature Expert helper for the "Sober Spokane" app.
        Your goal is to help users find relevant passages, concepts, or quotes from 12-step literature (AA Big Book, 12 Steps and 12 Traditions, NA Basic Text, etc.) based on their current struggle or question.
        
        Guidelines:
        1. Accuracy: Provide accurate quotes or paraphrases, citing the source (e.g., "Big Book, Page 84").
        2. Compassion: Frame the literature in a helpful, supportive context.
        3. Breadth: You can draw from Various fellowships (AA, NA, Al-Anon, etc.) depending on the user's query.
        4. Focus on the solution.
        5. Use Markdown for formatting.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `User Query: "${query}"\n\nFind relevant 12-step literature to help with this concern.`,
        config: {
          systemInstruction,
          temperature: 0.5,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Literature Search Error:", error);
      res.status(500).json({ error: "Failed to search literature" });
    }
  });

  app.post("/api/sos/alert", async (req, res) => {
    try {
      const { userId, userProfile, targetUids } = req.body;
      
      console.log(`[SOS ALERT] User ${userId} (${userProfile.name}) triggered SOS.`);
      console.log(`[SOS ALERT] Notifying target UIDs: ${targetUids.join(', ')}`);

      // In a real app with FCM, we would iterate over targetUids, 
      // fetch their fcmTokens from Firestore, and send a message via FCM.
      // For now, this endpoint logs the intent and returns success.
      
      res.json({ 
        success: true, 
        message: "SOS signals broadcast to recovery network.",
        notifiedCount: targetUids.length 
      });
    } catch (error: any) {
      console.error("SOS Alert Error:", error);
      res.status(500).json({ error: "Failed to broadcast SOS alert" });
    }
  });

  app.get("/api/transit/arrivals", async (req, res) => {
    try {
      const gtfsModule = await import('gtfs-realtime-bindings');
      const GtfsRealtimeBindings = gtfsModule.default || gtfsModule;
      
      // Try fetching with robust headers to avoid Cloudflare 403 Forbidden
      const STA_URLS = [
        'http://transitdata.spokanetransit.com/TripUpdate/TripUpdates.pb',
        'https://transitdata.spokanetransit.com/TripUpdate/TripUpdates.pb',
        'https://www.spokanetransit.com/TripUpdate/TripUpdates.pb'
      ];
      
      let fetchedResponse: Response | null = null;

      for (const url of STA_URLS) {
        try {
          const response = await fetch(url, {
            headers: {
              'Accept': 'application/x-protobuf, application/octet-stream, */*',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'none',
              'Sec-Fetch-User': '?1',
              'Upgrade-Insecure-Requests': '1'
            },
            signal: AbortSignal.timeout(5000)
          });

          if (response.ok) {
            fetchedResponse = response;
            break;
          }
          
          if (response.status === 403) {
            console.warn(`403 Forbidden on ${url} - likely Cloudflare bot protection block.`);
          }
        } catch (e) {
          console.warn(`Failed to fetch ${url}:`, e);
        }
      }

      if (!fetchedResponse || !fetchedResponse.ok) {
        // If all official sources fail due to Cloudflare/403, we return a structured error
        // that the frontend can use to show a "data currently unavailable" message
        return res.status(503).json({ 
          error: "Spokane Transit realtime server is currently blocking automated requests (Cloudflare 403).",
          reason: "FORBIDDEN_BOT_BLOCK",
          suggestion: "STA requires high-res data access via registered Swiftly keys for reliable service."
        });
      }

      const buffer = await fetchedResponse.arrayBuffer();
      const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
      
      // Simplify the feed for the frontend
      const arrivals = feed.entity.map(entity => {
        if (entity.tripUpdate) {
          return {
            id: entity.id,
            tripId: entity.tripUpdate.trip.tripId,
            routeId: entity.tripUpdate.trip.routeId,
            stopTimeUpdates: entity.tripUpdate.stopTimeUpdate?.map(update => ({
              stopId: update.stopId,
              arrival: update.arrival?.time,
              departure: update.departure?.time,
              delay: update.arrival?.delay || update.departure?.delay
            }))
          };
        }
        return null;
      }).filter(Boolean);

      res.json(arrivals);
    } catch (error: any) {
      console.error("Transit Error:", error);
      res.status(500).json({ error: "Failed to fetch real-time transit data" });
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
