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

const PHOTO_PROMPT = `Analyse this meal or food photo. Follow these steps in order:

1. FIRST: Read any visible text in the image — product labels, brand names, packaging text, nutrition panels. If you can read what the product is, use that information.
2. THEN: Identify all food items visible (using label text if available, otherwise visual appearance).
3. FINALLY: Estimate carbohydrate content based on standard nutritional values for each identified item and the portion sizes visible.

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
- "high": label/text clearly identifies the product, or very clear photo with obvious portions
- "medium": reasonable visual estimate, some uncertainty about portions
- "low": unclear photo, mixed dishes, or very hard to judge portions

Important: estimatedCarbs and totalCarbs are in grams of carbohydrate. Only return the JSON object.`;

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
        model: "claude-sonnet-4-6",
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
