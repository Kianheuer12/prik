import { action } from "./_generated/server";
import { v } from "convex/values";

export type MealItem = {
  name: string;
  estimatedCarbs: number;
  portion: string;
};

export type MealAnalysis = {
  description: string;
  items: MealItem[];
  totalCarbs: number;
  confidence: "low" | "medium" | "high";
};

// ─── Photo analysis ───────────────────────────────────────────────────────────

const PHOTO_PROMPT = `Analyse this meal photo. Identify all food items visible and estimate the carbohydrate content based on the portion sizes you can see.

Return ONLY a valid JSON object in this exact format — no other text:
{
  "description": "Brief comma-separated list of items",
  "items": [
    { "name": "Rice", "estimatedCarbs": 45, "portion": "~200g bowl" },
    { "name": "Chicken curry", "estimatedCarbs": 12, "portion": "~150g" }
  ],
  "totalCarbs": 57,
  "confidence": "medium"
}

Confidence levels:
- "high": clear photo, identifiable items, obvious portion sizes
- "medium": reasonable estimate, some uncertainty
- "low": unclear photo, mixed dishes, or very hard to judge portions

Important: estimatedCarbs and totalCarbs are in grams. Only return the JSON object.`;

// ─── Weight-based recalculation ───────────────────────────────────────────────

function weightPrompt(items: { name: string; weightG: number }[]) {
  const list = items.map((i) => `- ${i.name}: ${i.weightG}g`).join("\n");
  return `I have weighed these food items:\n${list}\n\nUsing standard nutritional values (grams of carbohydrate per 100g of food), calculate the carbohydrate content for each item and the total.\n\nReturn ONLY a valid JSON object in this exact format — no other text:\n{\n  "description": "comma-separated item names",\n  "items": [\n    { "name": "Rice", "estimatedCarbs": 56, "portion": "200g" }\n  ],\n  "totalCarbs": 72,\n  "confidence": "high"\n}`;
}

// ─── Action ──────────────────────────────────────────────────────────────────

export const analyzeMeal = action({
  args: {
    // Photo mode: provide base64 image
    imageBase64: v.optional(v.string()),
    mediaType: v.optional(v.string()), // "image/jpeg"
    // Weight mode: provide weighed items (skips vision, calculates exactly)
    weightedItems: v.optional(
      v.array(v.object({ name: v.string(), weightG: v.number() }))
    ),
  },
  handler: async (_ctx, args): Promise<MealAnalysis> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    let messages: object[];

    if (args.weightedItems && args.weightedItems.length > 0) {
      // Weight mode — text only, no vision needed
      messages = [{ role: "user", content: weightPrompt(args.weightedItems) }];
    } else if (args.imageBase64 && args.mediaType) {
      // Photo mode — vision
      messages = [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: args.mediaType,
                data: args.imageBase64,
              },
            },
            { type: "text", text: PHOTO_PROMPT },
          ],
        },
      ];
    } else {
      throw new Error("Provide either imageBase64 or weightedItems");
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error: ${err}`);
    }

    const data = await res.json() as { content: { type: string; text: string }[] };
    const text = data.content.find((b) => b.type === "text")?.text ?? "";

    // Extract JSON — Claude sometimes wraps in ```json ... ```
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse meal analysis response");

    return JSON.parse(jsonMatch[0]) as MealAnalysis;
  },
});
