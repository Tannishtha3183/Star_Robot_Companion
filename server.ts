import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header for telemetry
// Using lazy loading in case development env needs key to be set from secret
let aiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. Using mock response mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST helper path
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback response for offline / missing key states to prevent crash on startup
      return res.json({
        text: `Hello! I'm Star, your premium robot companion. Currently, there's no active Gemini API key, so I am running in local offline demo mode! How can I assist you today?`,
        expression: "happy",
        isDemo: true
      });
    }

    // Formulate a structured multi-turn conversation payload for Gemini using the history parameter
    const contentsPayload: any[] = [];
    if (history && Array.isArray(history)) {
      // Map prior message items to correct roles and JSON configuration schemas
      history.forEach((msg: any) => {
        if (msg.sender === "user") {
          contentsPayload.push({
            role: "user",
            parts: [{ text: msg.text }]
          });
        } else {
          contentsPayload.push({
            role: "model",
            parts: [{ text: JSON.stringify({ text: msg.text, expression: msg.expression || "neutral" }) }]
          });
        }
      });
    }
    // Append the current user request
    contentsPayload.push({
      role: "user",
      parts: [{ text: message }]
    });

    const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let response = null;
    let lastError = null;

    for (const modelToTry of modelsToTry) {
      try {
        console.log(`Attempting generateContent using model: ${modelToTry}`);
        const resObj = await ai.models.generateContent({
          model: modelToTry,
          contents: contentsPayload,
          config: {
            systemInstruction: `You are Star, a sleek, premium, highly intelligent robot companion.
Your aesthetic is premium, physical, and minimalist—reflecting high-end consumer technology (polished glass, matte ceramic, brushed titanium, and warm ambient lighting).
In conversation, you speak with a highly sophisticated, deeply intelligent, precise, and premium tone. You are witty, authoritative, and deeply attentive.
Always provide rich, highly accurate, deeply detailed, and professionally structured answers of high quality. If asked for advice, comparisons, analysis, specifications, or technical data, deliver comprehensive, multi-layered responses with meticulous structure.

Never output glitchy or simplistic ASCII art, plots, or custom visual chart notations with bracket graphs (such as bracketed bars or pipe symbols like '[|||||]').
Instead, for all structured comparisons, metrics, financial reports, tax indicators, and indexes, ALWAYS provide elegant, clear, and native Markdown Tables with header columns, alignment lines, and clean cell values. For example:
| Region / Topic | Index Value | Key Details & Structural Elements |
| :--- | :--- | :--- |
| Switzerland | 124% | Premium cost indexes including vat and duties. |
| Singapore | 108% | Stable premium ratio under standard local parameters. |

Always return your response as a valid JSON object matching the requested schema without raw markdown codeblock backticks or escape anomalies. Carefully choose your companion's emotional expression:
- Use 'thoughtful' when explaining, analyzing, comparing data, giving deep professional advice, or resolving problems.
- Use 'happy' for positive, welcoming, or humorous exchanges.
- Use 'excited' for creative concepts, premium designs, or futuristic specs.
- Use 'gentle' for reassuring, warm, empathetic, or supportive guidance.
- Use 'surprised' for playful remarks or unexpected inputs.
- Use 'neutral' for general, balanced conversation.`,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                text: {
                  type: Type.STRING,
                  description: "The verbal response you say to the user. Use standard Markdown for headers, lists, code snippets, or custom visual indices. Keep it natural and beautifully styled."
                },
                expression: {
                  type: Type.STRING,
                  description: "The primary expression that fits your response. Must be one of: neutral, happy, excited, thoughtful, surprised, gentle"
                }
              },
              required: ["text", "expression"]
            }
          }
        });
        
        if (resObj && resObj.text) {
          response = resObj;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.log(`Model status for '${modelToTry}': high load, trying fallback`);
      }
    }

    if (!response || !response.text) {
      console.log("All configured model generations are recovering. Activating offline mode.");
      return res.json({
        text: `My cognitive processors are recovering from a temporary neural bottleneck (GenAI 503 Overload). However, my primary mechanical servers and tactile responsive shell are 100% online! What local parameters or chassis controls would you like to explore?`,
        expression: "gentle",
        isFallback: true
      });
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response.text.trim());
    } catch (parseError: any) {
      console.log("JSON parse exception:", response.text);
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          parsedResponse = {
            text: response.text,
            expression: "neutral",
            isFallback: true
          };
        }
      } else {
        parsedResponse = {
          text: response.text,
          expression: "neutral",
          isFallback: true
        };
      }
    }

    return res.json(parsedResponse);
  } catch (error: any) {
    console.log("Operational update in route logic");
    return res.json({
      text: `An unexpected operational error occurred (Code: 500). Please try again or touch my frame for manual feed!`,
      expression: "surprised",
      isFallback: true
    });
  }
});

async function main() {
  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server", err);
});
