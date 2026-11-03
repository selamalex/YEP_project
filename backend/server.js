import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Allowed frontend origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "1mb" }));

// Initialize Supabase admin client for backend operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Rate limiters
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "rate_limited",
    reply: "Too many messages sent from this IP address. Please wait a few minutes before asking another question.",
  },
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "rate_limited",
    error: "Too many contact messages sent from this IP. Please wait a few minutes.",
  },
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    supabaseConfigured: Boolean(supabase),
  });
});

// AI Chatbot endpoint using Gemini Free Version API
app.post("/api/chat", chatLimiter, async (req, res) => {
  const { messages, publishedEvents = [] } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  for (const msg of messages) {
    if (typeof msg.content !== "string" || msg.content.length > 2000) {
      return res.status(400).json({ error: "Invalid message format or length exceeds 2000 characters." });
    }
  }

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    return res.json({
      status: "unconfigured",
      reply:
        "The AI chatbot is currently in preview mode because `GEMINI_API_KEY` is not yet configured in the backend environment.\n\nPlease configure your GEMINI_API_KEY in the backend environment variables to enable dynamic AI responses.",
    });
  }

  try {
    const formattedEvents = publishedEvents
      .filter((e) => new Date(e.end_date || e.start_date) >= new Date())
      .map((e) => `- ${e.title} (${e.start_date} at ${e.venue}): ${e.short_description || e.full_description}`)
      .join("\n");

    const systemPrompt = `You are the friendly mascot and AI assistant for YEP Initiative (Yael Educational Pathway).
You help Ethiopian students with university guidance, scholarships, mentorship, workshops, and upcoming events.
Founded: 2024. Community: 60,000+ members. Programs: Bachelor's Pathway, Master's Pathway, Mentorship, Training cohorts.
Official Telegram: @yaeleducationalpathway. Email: yaeleducation07@gmail.com.
Upcoming published events from database:
${formattedEvents || "No upcoming events scheduled right now."}

Rules:
1. Ground answers strictly in verified YEP information.
2. Never invent fake scholarship deadlines, prices, or false dates.
3. If unknown, direct students to /contact or Telegram.`;

    const geminiMessages = messages
      .filter((m) => m.content && m.content.trim().length > 0)
      .slice(-8)
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content.trim() }],
      }));

    while (geminiMessages.length > 0 && geminiMessages[0].role !== "user") {
      geminiMessages.shift();
    }
    if (geminiMessages.length === 0) {
      geminiMessages.push({ role: "user", parts: [{ text: "Hello" }] });
    }

    const candidateModels = [
      process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.1-flash-lite",
    ].filter(Boolean);

    const uniqueModels = Array.from(new Set(candidateModels));

    for (const model of uniqueModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const geminiRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: geminiMessages,
            generationConfig: {
              maxOutputTokens: 600,
              temperature: 0.7,
            },
          }),
        });

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const reply = data.candidates?.[0]?.content?.parts
            ?.map((p) => p.text || "")
            .join("")
            .trim();

          if (reply) {
            return res.json({
              status: "success",
              reply,
            });
          }
        }
      } catch (err) {
        console.warn(`Backend Gemini attempt for model ${model} failed:`, err);
      }
    }

    return res.status(502).json({
      status: "api_error",
      reply: "I am having trouble reaching the AI service right now. Please try again shortly or reach out on Telegram.",
    });
  } catch (err) {
    console.error("Chat backend error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Server-side Contact Submission Endpoint
app.post("/api/contact", contactLimiter, async (req, res) => {
  const { name, subject, message } = req.body;

  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedSubject = typeof subject === "string" ? subject.trim() : "";
  const trimmedMessage = typeof message === "string" ? message.trim() : "";

  if (!trimmedName || trimmedName.length > 100) {
    return res.status(400).json({ error: "Valid name (max 100 chars) is required." });
  }
  if (!trimmedSubject || trimmedSubject.length > 150) {
    return res.status(400).json({ error: "Valid subject (max 150 chars) is required." });
  }
  if (!trimmedMessage || trimmedMessage.length > 2000) {
    return res.status(400).json({ error: "Valid message (max 2000 chars) is required." });
  }

  if (!supabase) {
    return res.status(503).json({ error: "Supabase connection is not configured on the backend." });
  }

  try {
    const { error } = await supabase.from("contact_submissions").insert([
      {
        name: trimmedName,
        subject: trimmedSubject,
        message: trimmedMessage,
        is_read: false,
      },
    ]);

    if (error) {
      console.error("Backend contact insert error:", error);
      return res.status(500).json({ error: "Failed to save message." });
    }

    res.json({ success: true, message: "Contact message saved successfully." });
  } catch (err) {
    console.error("Backend error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log(`YEP Backend server listening on http://localhost:${PORT}`);
});
