import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Step 1 – find your userId:
//   npx convex run seed:getUserId
// Step 2 – import (clears existing data first):
//   npx convex run seed:importReadings '{"userId":"user_xxx"}'

export const getUserId = query({
  args: {},
  handler: async (ctx) => {
    const readings = await ctx.db.query("readings").collect();
    const ids = [...new Set(readings.map((r) => r.userId))];
    return ids.length ? ids[0] : "No readings found — check Clerk dashboard for your user ID";
  },
});

export const importReadings = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // Clear all existing readings for this user
    const existing = await ctx.db
      .query("readings")
      .withIndex("by_user_and_time", (q) => q.eq("userId", userId))
      .collect();
    for (const r of existing) {
      await ctx.db.delete(r._id);
    }

    // All times converted from SAST (UTC+2) → UTC
    const readings = [
      // ── 21 Feb 2026 ──────────────────────────────────────────
      {
        value: 21.4,
        timestamp: new Date("2026-02-21T12:18:00Z").getTime(),
        type: "post-meal" as const,
        mealOffset: "2 hrs",
        notes: "After meal (meal at 12:15)",
      },
      {
        value: 23.6,
        timestamp: new Date("2026-02-21T19:23:00Z").getTime(),
        type: "post-meal" as const,
        mealOffset: "2 hrs",
        notes: "After meal (meal at 19:15)",
      },
      // ── 22 Feb 2026 ──────────────────────────────────────────
      {
        value: 17.3,
        timestamp: new Date("2026-02-22T07:13:00Z").getTime(),
        type: "fasted" as const,
        notes: "Fasting / no meal",
      },
      {
        value: 14.0,
        timestamp: new Date("2026-02-22T11:49:00Z").getTime(),
        type: "post-meal" as const,
        mealOffset: "2 hrs",
        notes: "After meal (meal at 11:45)",
      },
      {
        value: 14.2,
        timestamp: new Date("2026-02-22T16:49:00Z").getTime(),
        type: "post-meal" as const,
        mealOffset: "2 hrs",
        notes: "After meal (meal at 16:30)",
      },
      // ── 23 Feb 2026 ──────────────────────────────────────────
      {
        value: 10.6,
        timestamp: new Date("2026-02-23T07:06:00Z").getTime(),
        type: "fasted" as const,
        notes: "Fasting / no meal",
      },
      {
        value: 16.3,
        timestamp: new Date("2026-02-23T12:18:00Z").getTime(),
        type: "post-meal" as const,
        mealOffset: "2 hrs",
        notes: "After meal (meal at 12:05)",
      },
      {
        value: 12.0,
        timestamp: new Date("2026-02-23T18:11:00Z").getTime(),
        type: "post-meal" as const,
        mealOffset: "1.5 hrs",
        notes: "After meal (meal at 18:50)",
      },
      // ── 24 Feb 2026 ──────────────────────────────────────────
      {
        value: 11.5,
        timestamp: new Date("2026-02-24T06:41:00Z").getTime(),
        type: "fasted" as const,
        notes: "Fasting / no meal",
      },
      // ── 26 Feb 2026 ──────────────────────────────────────────
      {
        value: 9.3,
        timestamp: new Date("2026-02-26T06:27:00Z").getTime(),
        type: "fasted" as const,
        notes: "Fasting / no meal",
      },
      {
        value: 15.2,
        timestamp: new Date("2026-02-26T12:40:00Z").getTime(),
        type: "post-meal" as const,
        mealOffset: "2 hrs",
        notes: "After meal (meal at 12:10)",
      },
      {
        value: 18.9,
        timestamp: new Date("2026-02-26T19:03:00Z").getTime(),
        type: "post-meal" as const,
        mealOffset: "2 hrs",
        notes: "After meal (meal at 19:15)",
      },
      // ── 27 Feb 2026 ──────────────────────────────────────────
      {
        value: 13.5,
        timestamp: new Date("2026-02-27T06:20:00Z").getTime(),
        type: "fasted" as const,
        notes: "Fasting / no meal",
      },
      {
        value: 11.2,
        timestamp: new Date("2026-02-27T13:33:00Z").getTime(),
        type: "post-meal" as const,
        mealOffset: "3 hrs",
        notes: "After meal (meal at 12:00)",
      },
      {
        value: 14.8,
        timestamp: new Date("2026-02-27T18:45:00Z").getTime(),
        type: "post-meal" as const,
        mealOffset: "3 hrs",
        notes: "After meal (meal at 18:10)",
      },
      // ── 28 Feb 2026 ──────────────────────────────────────────
      {
        value: 16.5,
        timestamp: new Date("2026-02-28T07:55:00Z").getTime(),
        type: "post-meal" as const,
        notes: "After cappuccino (missed fasted reading)",
      },
    ];

    for (const r of readings) {
      await ctx.db.insert("readings", { userId, ...r });
    }

    return `Cleared ${existing.length} old readings. Imported ${readings.length} readings for ${userId}.`;
  },
});
