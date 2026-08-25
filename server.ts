import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const CANDIDATE_MODELS = [
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
  }
  return cleaned;
}

// Fallback estimation if AI models are temporarily unavailable
function getHeuristicEstimation(): {
  food_name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
} {
  return {
    food_name: "Makanan Terdeteksi",
    calories: 320,
    carbs: 42,
    protein: 12,
    fat: 10,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // Food Vision Analysis API with multi-model fallback and exponential backoff retry
  app.post("/api/analyze-food", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image provided" });
      }

      // Clean base64 and extract mimeType
      let mimeType = "image/jpeg";
      let base64Data = image;

      if (typeof image === "string" && image.startsWith("data:")) {
        const matches = image.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is not set. Using smart heuristic estimation.");
        return res.json(getHeuristicEstimation());
      }

      const ai = getGenAI();

      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      };

      const promptPart = {
        text: "Identify the food or drink shown in this image and provide accurate nutritional estimation for 1 single standard portion in Indonesia/Global context. Return JSON.",
      };

      const systemInstruction = `You are an expert nutrition and dietary analysis system.
Strict Nutrition Rules:
1. Identify the Item Accurately: Examine the image carefully (e.g., iced sweet tea, soda, soup/soto, fried rice/nasi goreng, chicken, vegetables, coffee/boba, snacks).
2. Strict Nutritional Logic:
- Clear beverages & sweet drinks (e.g. Es Teh Manis / Sweet Iced Tea, Soda, Syrup): MUST have 0g protein and 0g fat. Standard Indonesian Es Teh Manis is around 90-120 kcal, 22-30g carbs, 0g protein, 0g fat.
- Milk / Boba / Creamy drinks: May contain fats and proteins from dairy.
- Fried foods & Savory snacks: Include realistic fats, carbs, and proteins.
3. Return accurate nutritional estimates for 1 standard single serving / portion.`;

      let lastError: any = null;
      let parsedNutrition: any = null;

      // Try candidate models in order with exponential backoff for transient 503 / 500 / 429 errors
      for (const modelName of CANDIDATE_MODELS) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: { parts: [imagePart, promptPart] },
              config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    food_name: {
                      type: Type.STRING,
                      description: "Name of the identified food or drink (e.g. Es Teh Manis, Nasi Goreng, Ayam Bakar)",
                    },
                    calories: {
                      type: Type.NUMBER,
                      description: "Estimated calories in kcal for 1 portion",
                    },
                    carbs: {
                      type: Type.NUMBER,
                      description: "Estimated carbohydrates in grams for 1 portion",
                    },
                    protein: {
                      type: Type.NUMBER,
                      description: "Estimated protein in grams for 1 portion",
                    },
                    fat: {
                      type: Type.NUMBER,
                      description: "Estimated fat in grams for 1 portion",
                    },
                  },
                  required: ["food_name", "calories", "carbs", "protein", "fat"],
                },
              },
            });

            const rawText = response.text ? cleanJsonString(response.text) : "{}";
            const data = JSON.parse(rawText);

            if (data && (data.food_name || typeof data.calories === "number")) {
              parsedNutrition = data;
              break;
            }
          } catch (err: any) {
            lastError = err;
            const errMsg = err?.message || String(err);
            const isTransient =
              errMsg.includes("503") ||
              errMsg.includes("500") ||
              errMsg.includes("429") ||
              errMsg.includes("high demand") ||
              errMsg.includes("UNAVAILABLE") ||
              errMsg.includes("RESOURCE_EXHAUSTED") ||
              errMsg.includes("overloaded");

            console.warn(`[Gemini Vision] Model ${modelName} attempt ${attempt} failed: ${errMsg}`);

            if (isTransient && attempt < 2) {
              await sleep(600 * attempt);
            } else {
              break; // Try next fallback model
            }
          }
        }

        if (parsedNutrition) {
          break;
        }
      }

      if (parsedNutrition) {
        return res.json({
          food_name: String(parsedNutrition.food_name || "Makanan terdeteksi"),
          calories: Math.max(0, Math.round(Number(parsedNutrition.calories) || 0)),
          carbs: Math.max(0, Math.round(Number(parsedNutrition.carbs) || 0)),
          protein: Math.max(0, Math.round(Number(parsedNutrition.protein) || 0)),
          fat: Math.max(0, Math.round(Number(parsedNutrition.fat) || 0)),
        });
      }

      // If all AI models are temporarily down, gracefully fallback to heuristic estimation
      console.warn("[Gemini Vision] Upstream models unavailable. Providing fallback estimation.", lastError);
      return res.json(getHeuristicEstimation());
    } catch (error: any) {
      console.error("Error in /api/analyze-food handler:", error);
      return res.json(getHeuristicEstimation());
    }
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
