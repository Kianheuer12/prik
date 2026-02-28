import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Run with: npx convex run seed:importReadings '{"userId":"your_clerk_id_here"}'
export const importReadings = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const readings = [
      {
        value: 21.4,
        timestamp: new Date("2026-02-21T12:18:00Z").getTime(),
        type: "post-meal" as const,
        notes: "After meal (meal at 12:15)",
      },
      {
        value: 23.6,
        timestamp: new Date("2026-02-21T19:23:00Z").getTime(),
        type: "post-meal" as const,
        notes: "After meal (meal at 19:15)",
      },
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
        notes: "After meal (meal at 11:45)",
      },
      {
        value: 14.2,
        timestamp: new Date("2026-02-22T16:49:00Z").getTime(),
        type: "post-meal" as const,
        notes: "After meal (meal at 16:30)",
      },
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
        notes: "After meal (meal at 12:05)",
      },
      {
        value: 12.0,
        timestamp: new Date("2026-02-23T18:11:00Z").getTime(),
        type: "post-meal" as const,
        notes: "After meal (meal at 18:50)",
      },
      {
        value: 11.5,
        timestamp: new Date("2026-02-24T06:41:00Z").getTime(),
        type: "fasted" as const,
        notes: "Fasting / no meal",
      },
      {
        value: 9.3,
        timestamp: new Date("2026-02-25T06:27:00Z").getTime(),
        type: "fasted" as const,
        notes: "Fasting / no meal",
      },
      {
        value: 15.2,
        timestamp: new Date("2026-02-25T12:40:00Z").getTime(),
        type: "post-meal" as const,
        notes: "After meal (meal at 12:10)",
      },
      {
        value: 18.9,
        timestamp: new Date("2026-02-25T19:03:00Z").getTime(),
        type: "post-meal" as const,
        notes: "After meal (meal at 19:15)",
      },
      {
        value: 13.5,
        timestamp: new Date("2026-02-26T06:20:00Z").getTime(),
        type: "fasted" as const,
        notes: "Fasting / no meal",
      },
      {
        value: 11.2,
        timestamp: new Date("2026-02-26T13:33:00Z").getTime(),
        type: "post-meal" as const,
        notes: "After meal (meal at 12:00)",
      },
      {
        value: 14.8,
        timestamp: new Date("2026-02-26T18:45:00Z").getTime(),
        type: "post-meal" as const,
        notes: "After meal (meal at 18:10)",
      },
      {
        value: 16.5,
        timestamp: new Date("2026-02-27T07:55:00Z").getTime(),
        type: "fasted" as const,
        notes: "After cappuccino (missed fasted reading)",
      },
    ];

    let count = 0;
    for (const r of readings) {
      await ctx.db.insert("readings", { userId, ...r });
      count++;
    }

    return `Imported ${count} readings for user ${userId}`;
  },
});
