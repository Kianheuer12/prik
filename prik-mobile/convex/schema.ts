import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  readings: defineTable({
    userId: v.string(), // clerkId
    value: v.number(), // mmol/L
    timestamp: v.number(), // Unix ms
    type: v.union(v.literal("fasted"), v.literal("post-meal")),
    mealOffset: v.optional(v.string()), // e.g. "30 min", "1 hr", "2 hrs"
    notes: v.optional(v.string()),
    // AI meal analysis (post-meal only)
    mealDescription: v.optional(v.string()), // "Rice, chicken curry, broccoli"
    estimatedCarbs:  v.optional(v.number()), // total grams e.g. 61
    carbsConfidence: v.optional(v.string()), // "low" | "medium" | "high"
  })
    .index("by_user", ["userId"])
    .index("by_user_and_time", ["userId", "timestamp"]),
});
