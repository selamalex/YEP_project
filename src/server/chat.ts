import { createServerFn } from "@tanstack/react-start";
import { buildChatbotSystemPrompt } from "@/lib/chatbot-knowledge";
import type { DatabaseEvent } from "@/lib/supabase";
import fs from "node:fs";
import path from "node:path";

type ChatRequestPayload = {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  publishedEvents?: DatabaseEvent[];
};

// In-memory rate limiting for serverless/server instances: max 20 requests per minute per IP/client
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (entry.count >= 20) {
    return false;
  }

  entry.count += 1;
  return true;
}

/**
 * Robustly retrieves the Gemini API key from environment or local env files
 */
function getGeminiApiKey(): string {
  let key =
    process.env["GEMINI_API_KEY"] ||
    process.env["VITE_GEMINI_API_KEY"] ||
    "";

  if (key) return key.trim();

  // Try loading from .env.local or .env if not yet in process.env
  try {
    if (typeof process.loadEnvFile === "function") {
      const envLocal = path.resolve(process.cwd(), ".env.local");
      if (fs.existsSync(envLocal)) {
        process.loadEnvFile(envLocal);
      } else {
        const envDefault = path.resolve(process.cwd(), ".env");
        if (fs.existsSync(envDefault)) {
          process.loadEnvFile(envDefault);
        }
      }
      key =
        process.env["GEMINI_API_KEY"] ||
        process.env["VITE_GEMINI_API_KEY"] ||
        "";
    }
  } catch {
    // Ignore fallback errors
  }

  // Direct manual line parse if still missing
  if (!key) {
    try {
      const candidates = [".env.local", ".env"];
      for (const file of candidates) {
        const fullPath = path.resolve(process.cwd(), file);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, "utf-8");
          const match = content.match(/^\s*GEMINI_API_KEY\s*=\s*([^\r\n#]+)/m);
          if (match && match[1]) {
            key = match[1].trim();
            break;
          }
        }
      }
    } catch {
      // Ignore fallback errors
    }
  }

  return key.trim();
}

/**
 * Returns candidate models in priority order for the Gemini free tier.
 * gemini-3.5-flash-lite and gemini-flash-lite-latest are ultra-fast and reliable on the free tier.
 */
function getCandidateModels(): string[] {
  const customModel = (process.env["GEMINI_MODEL"] || "").trim();
  const fastFreeModels = [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
  ];

  if (!customModel) {
    return fastFreeModels;
  }

  // If the user specified a custom model, try it first, then fall back to fast free models
  return Array.from(new Set([customModel, ...fastFreeModels]));
}

export const chatWithMascotFn = createServerFn({ method: "POST" })
  .validator((data: unknown): ChatRequestPayload => {
    if (typeof data !== "object" || data === null) {
      throw new Error("Invalid request payload.");
    }
    const payload = data as ChatRequestPayload;
    if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
      throw new Error("Messages array is required.");
    }

    // Validate and sanitize messages
    for (const msg of payload.messages) {
      if (typeof msg.content !== "string" || !["user", "assistant"].includes(msg.role)) {
        throw new Error("Invalid message format.");
      }
      if (msg.content.length > 2000) {
        throw new Error("Message content exceeds 2000 character limit.");
      }
    }

    return payload;
  })
  .handler(async ({ data }) => {
    const { messages, publishedEvents = [] } = data;

    // Check rate limit
    const clientKey = "client-session";
    if (!checkRateLimit(clientKey)) {
      return {
        reply: "You have sent too many messages in a short period. Please wait a minute before asking another question.",
        status: "rate_limited",
      };
    }

    // 1. If an external backend is configured (e.g. BACKEND_URL), forward the request there
    const backendUrl = process.env["BACKEND_URL"];
    if (backendUrl) {
      try {
        const backendRes = await fetch(`${backendUrl.replace(/\/$/, "")}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, publishedEvents }),
        });

        if (backendRes.ok) {
          const json = await backendRes.json();
          if (json.reply) {
            return { reply: json.reply, status: "success" };
          }
        }
      } catch (backendErr) {
        console.warn("External backend failed, falling back to direct server execution:", backendErr);
      }
    }

    // 2. Direct Gemini Free Version API execution on the server
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return {
        reply:
          "The AI chatbot service is currently running in informational mode because `GEMINI_API_KEY` is not yet configured on the server.\n\nTo configure AI responses, please set `GEMINI_API_KEY` in your server environment variables.\n\nIn the meantime, feel free to visit our [Events](/events) page for upcoming sessions, or get in touch with our team directly on our [Contact](/contact) page or Telegram (@yaeleducationalpathway)!",
        status: "unconfigured",
      };
    }

    try {
      // Build verified YEP system prompt with live published events
      const systemPrompt = buildChatbotSystemPrompt(publishedEvents);

      // Format conversation history for Gemini API
      const geminiMessages = messages
        .filter((m) => m.content && m.content.trim().length > 0)
        .slice(-8)
        .map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content.trim() }],
        }));

      // Ensure the conversation starts with a user turn if model messages are present
      while (geminiMessages.length > 0 && geminiMessages[0]?.role !== "user") {
        geminiMessages.shift();
      }

      // If empty, supply a default greeting
      if (geminiMessages.length === 0) {
        geminiMessages.push({
          role: "user",
          parts: [{ text: "Hello" }],
        });
      }

      const candidateModels = getCandidateModels();
      let lastError = "";

      for (const model of candidateModels) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        try {
          const requestBody: {
            systemInstruction: { parts: Array<{ text: string }> };
            contents: typeof geminiMessages;
            generationConfig: { maxOutputTokens: number; temperature: number };
          } = {
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: geminiMessages,
            generationConfig: {
              maxOutputTokens: 600,
              temperature: 0.7,
            },
          };

          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

          const geminiRes = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (geminiRes.ok) {
            const completion = await geminiRes.json();
            const answer = completion.candidates?.[0]?.content?.parts
              ?.map((part: { text?: string }) => part.text || "")
              .join("")
              .trim();

            if (answer) {
              return {
                reply: answer,
                status: "success",
              };
            }
          } else {
            const errBody = await geminiRes.text();
            lastError = `Model ${model} returned status ${geminiRes.status}: ${errBody}`;
            console.warn(`[Gemini API warning] ${lastError}. Trying next candidate model...`);
          }
        } catch (fetchErr: unknown) {
          clearTimeout(timeoutId);
          lastError = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
          console.warn(`[Gemini API fetch error] ${model}: ${lastError}. Trying next candidate model...`);
        }
      }

      console.error("[Gemini API fatal] All candidate models failed. Last error:", lastError);
      return {
        reply:
          "I'm having trouble connecting to my AI service right now. Please try again shortly or reach out to our team directly on Telegram (@yaeleducationalpathway).",
        status: "api_error",
      };
    } catch (err: unknown) {
      console.error("Chatbot server error:", err);
      return {
        reply:
          "An unexpected error occurred while processing your request. Please try again later or reach out on our Contact page.",
        status: "error",
      };
    }
  });
