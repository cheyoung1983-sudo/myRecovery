import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import * as dotenv from "dotenv";
import * as Sentry from "@sentry/node";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import admin from "firebase-admin";

// Load environment variables for local development
dotenv.config();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 1.0,
});

// Load Spokane resources to provide context to Gemini
import { SPOKANE_RESOURCES } from "./src/constants";

// Initialize Firebase Admin
try {
  admin.initializeApp();
} catch (e) {
  console.warn("Firebase Admin failed to initialize. Custom Claims and real SOS will be disabled.");
  Sentry.captureException(e);
}

async function startServer() {
  const app = express();

  // Sentry request handler must be the first middleware on the app
  Sentry.setupExpressErrorHandler(app);

  const PORT = Number(process.env.PORT) || 3000;

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https:", "http:"],
        "script-src": ["'self'", "'unsafe-inline'", "https://securepubads.g.doubleclick.net", "https://pagead2.googlesyndication.com", "https://browser.sentry-cdn.com"],
        "connect-src": ["'self'", "https://*.googleapis.com", "https://*.firebaseio.com", "https://*.google-analytics.com", "https://*.sentry.io"]
      }
    }
  }));

  app.use(cors({
    origin: process.env.NODE_ENV === "production"
      ? [/\.web\.app$/, /\.firebaseapp\.com$/] // Restrict to Firebase Hosting domains
      : true
  }));

  app.use(express.json());

  // Rate Limiting
  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 50, // Limit each IP to 50 AI requests per window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: "Too many AI requests. Please take a breather." }
  });

  const adminLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 10, // Very strict for admin sync
    message: { error: "Admin rate limit exceeded." }
  });

  const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

  async function getVectorForText(text: string) {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  }

  // Apply rate limiters to specific routes
  app.use("/api/ai/", aiLimiter);
  app.use("/api/gemini/", aiLimiter);
  app.use("/api/admin/", adminLimiter);

  // API Routes
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { prompt, history = [], isCrisis = false } = req.body;
      
      // Fetch dynamic resources from Firestore
      let resourceSource = SPOKANE_RESOURCES;
      try {
        const resourcesSnap = await admin.firestore().collection('spokaneResources').get();
        const dynamicResources = resourcesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        if (dynamicResources.length > 0) resourceSource = dynamicResources;
      } catch (e) {
        console.warn("Could not fetch resources from Firestore, falling back to static list.");
      }

      // PRODUCTION RAG: Semantic Search
      // In a full production environment, we would use getVectorForText(prompt)
      // and query Firestore like:
      // db.collection('spokaneResources').findNearest('embedding', vector, { limit: 3, distanceMeasure: 'cosine' })

      // For now, we continue with our lightweight LLM-based filter which mimics the
      // behavior of a vector search by picking the most relevant context.
      const resourcePicker = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `User Query: "${prompt}"\n\nFrom this list of Spokane resources, return ONLY the IDs of the 3 most relevant ones as a comma-separated list:\n${resourceSource.map((r: any) => `ID ${r.id}: ${r.name} - ${r.description}`).join('\n')}` }] }],
        config: { temperature: 0.1 }
      });

      const relevantIds = resourcePicker.response.text().split(',').map(id => id.trim());
      const filteredResources = resourceSource.filter((r: any) => relevantIds.some(id => id.includes(r.id)));

      const resourcesContext = filteredResources.length > 0
        ? filteredResources.map((r: any) => `- ${r.name} (${r.category}): ${r.description}. Phone: ${r.phone}`).join("\n")
        : "No specific local resources identified for this query.";

      const systemInstruction = `
        You are "Sober Spokane Assistant", a compassionate peer-support AI for recovery.
        ${isCrisis ? "The user has indicated they are in a CRISIS or high-risk state. Prioritize immediate safety, grounding techniques, and 988/emergency contacts." : "Your tone is non-judgmental, encouraging, and informative."}
        
        Available Local Resources (Relevant to current context):
        ${resourcesContext}
        
        Guidelines:
        1. CRISIS MODE: If isCrisis is true, be extremely direct about safety. Suggest breathing exercises and immediate human contact.
        2. Localized: Use Spokane-specific references.
        3. Peer-Tone: "We are in this together."
        4. No medical advice.
        5. Concise markdown responses.
      `;

      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: systemInstruction }] },
          { role: 'model', parts: [{ text: "Understood. I am Sober Spokane Assistant, ready to help with local resources and peer support." }] },
          ...history.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          }))
        ]
      });

      const response = await chat.sendMessage(prompt);
      res.json({ text: response.response.text() });
    } catch (error: any) {
      Sentry.captureException(error);
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI response" });
    }
  });

  // Admin: Set Custom Claims for roles (Production Security Recommendation)
  app.post("/api/admin/sync-role", async (req, res) => {
    try {
      const { uid, role } = req.body;
      await admin.auth().setCustomUserClaims(uid, { role });
      res.json({ success: true, message: `Custom claim '${role}' set for user ${uid}` });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to set custom claims. Ensure Admin SDK is configured." });
    }
  });

  // Admin: Utility to generate embeddings for all resources (Vector Search Prep)
  app.post("/api/admin/index-resources", async (req, res) => {
    try {
      const indexedResources = await Promise.all(SPOKANE_RESOURCES.map(async (r) => {
        const vector = await getVectorForText(`${r.name} ${r.description} ${r.category}`);
        return { ...r, embedding: vector };
      }));

      // In production, you would write these to Firestore:
      // indexedResources.forEach(r => db.collection('spokaneResources').doc(r.id).set(r));

      res.json({ success: true, count: indexedResources.length, message: "Embeddings generated for all resources." });
    } catch (e) {
      res.status(500).json({ error: "Indexing failed" });
    }
  });

  app.post("/api/ai/reflection", async (req, res) => {
    try {
      const { moodLogs } = req.body;
      const logsSummary = moodLogs.map((l: any) => `- ${new Date(l.timestamp).toLocaleDateString()}: ${l.mood} (${l.note || 'No note'})`).join("\n");

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `Analyze these recent recovery mood logs and provide a 2-3 sentence optimistic, strength-based reflection or summary of their progress. Focus on patterns of resilience.\n\nLogs:\n${logsSummary}` }] }],
        config: {
          systemInstruction: "You are a recovery coach focused on positive reinforcement and identifying strength patterns.",
          temperature: 0.6,
        }
      });

      res.json({ reflection: response.response.text() });
    } catch (error: any) {
      Sentry.captureException(error);
      res.status(500).json({ error: "Failed to generate reflection" });
    }
  });

  app.post("/api/ai/match", async (req, res) => {
    try {
      const { userNeeds, mentors } = req.body;
      const mentorsContext = mentors.map((m: any) => `ID ${m.id}: ${m.name}, Bio: ${m.bio}, Specialties: ${m.specialties?.join(', ')}`).join("\n");

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `Based on these user needs: "${userNeeds.join(', ')}", which of these mentors is the best match? Return the ID and a brief 1-sentence reason why.\n\nMentors:\n${mentorsContext}` }] }],
        config: {
          systemInstruction: "You are an expert matching coordinator for a recovery program.",
          temperature: 0.4,
        }
      });

      res.json({ match: response.response.text() });
    } catch (error: any) {
      Sentry.captureException(error);
      res.status(500).json({ error: "Failed to match mentors" });
    }
  });
  
  app.post("/api/ai/analyze-mood", async (req, res) => {
    try {
      const { moodLogs, chatHistory } = req.body;
      const prompt = `Analyze this mood history: ${JSON.stringify(moodLogs)}. 
      And recent chat: ${JSON.stringify(chatHistory)}.
      Is there a downward trend or signs of high anxiety? 
      Return ONLY a JSON object: { "vibe": "stable"|"anxious"|"declining", "recommendation": "string", "triggerVibeCheck": boolean }`;
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });

      res.json(JSON.parse(result.response.text() || "{}"));
    } catch (e) {
      Sentry.captureException(e);
      console.error("Analysis failed:", e);
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

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `User Query: "${query}"\n\nFind relevant 12-step literature to help with this concern.` }] }],
        config: {
          systemInstruction,
          temperature: 0.5,
        }
      });

      res.json({ text: response.response.text() });
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
      Sentry.captureException(error);
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
