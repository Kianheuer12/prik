"use client";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useMemo } from "react";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import { getGlucoseColor, getGlucoseLabel, getGlucoseTailwind, getGlucoseBgTailwind } from "@/lib/glucose";

export default function Dashboard() {
  const { user } = useUser();
  const sevenDaysAgo = useMemo(() => Date.now() - 7 * 24 * 60 * 60 * 1000, []);

  const readings = useQuery(
    api.readings.getLast7DaysReadings,
    user ? { userId: user.id, since: sevenDaysAgo } : "skip"
  );

  const sorted = readings ? [...readings].sort((a, b) => b.timestamp - a.timestamp) : [];
  const values = sorted.map((r) => r.value);
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const high = values.length ? Math.max(...values) : null;
  const low = values.length ? Math.min(...values) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-slate-900">
            Hi {user?.firstName ?? "there"} 👋
          </h1>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          Last 7 days · {values.length} reading{values.length !== 1 ? "s" : ""}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Average", value: avg },
            { label: "High", value: high },
            { label: "Low", value: low },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl p-4 border border-slate-200 text-center">
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p
                className="text-2xl font-bold"
                style={{ color: value !== null ? getGlucoseColor(value) : "#94a3b8" }}
              >
                {value !== null ? value.toFixed(1) : "—"}
              </p>
            </div>
          ))}
        </div>

        {/* Log button */}
        <Link
          href="/log"
          className="block w-full bg-[#2E86AB] text-white text-center font-bold text-lg py-4 rounded-2xl mb-6 hover:bg-[#2577a0] transition-colors"
        >
          + Log Reading
        </Link>

        {/* Readings list */}
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Recent Readings</h2>

        {readings === undefined ? (
          <p className="text-slate-400 text-center py-8">Loading...</p>
        ) : sorted.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No readings in the last 7 days.</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((r) => {
              const date = new Date(r.timestamp);
              const timeStr = date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
              const dateStr = date.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
              return (
                <div key={r._id} className="bg-white rounded-xl border border-slate-200 flex items-center overflow-hidden">
                  <div className={`w-1.5 self-stretch ${getGlucoseBgTailwind(r.value)}`} />
                  <div className="flex-1 px-4 py-3">
                    <p className="text-sm font-medium text-slate-800">
                      {r.type === "fasted" ? "Fasted" : "Post-meal"}
                    </p>
                    <p className="text-xs text-slate-400">{dateStr} · {timeStr}</p>
                    {r.notes && <p className="text-xs text-slate-400 mt-0.5">{r.notes}</p>}
                  </div>
                  <div className="px-4 text-right">
                    <p className={`text-xl font-bold ${getGlucoseTailwind(r.value)}`}>
                      {r.value.toFixed(1)}
                    </p>
                    <p className={`text-xs ${getGlucoseTailwind(r.value)}`}>
                      {getGlucoseLabel(r.value)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
