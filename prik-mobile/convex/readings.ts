import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addReading = mutation({
  args: {
    userId: v.string(),
    value: v.number(),
    timestamp: v.number(),
    type: v.union(v.literal("fasted"), v.literal("post-meal")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("readings", args);
  },
});

export const getReadingsForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("readings")
      .withIndex("by_user_and_time", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getTodayReadings = query({
  args: { userId: v.string(), startOfDay: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("readings")
      .withIndex("by_user_and_time", (q) =>
        q.eq("userId", args.userId).gte("timestamp", args.startOfDay)
      )
      .order("desc")
      .collect();
  },
});

export const getLast7DaysReadings = query({
  args: { userId: v.string(), since: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("readings")
      .withIndex("by_user_and_time", (q) =>
        q.eq("userId", args.userId).gte("timestamp", args.since)
      )
      .order("asc")
      .collect();
  },
});

export const deleteReading = mutation({
  args: { id: v.id("readings") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
