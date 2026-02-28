"use client";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { getGlucoseColor, getGlucoseLabel, getGlucoseBgTailwind } from "@/lib/glucose";
import { Doc, Id } from "../../../../convex/_generated/dataModel";

export default function History() {
  const { user } = useUser();
  const readings = useQuery(
    api.readings.getReadingsForUser,
    user ? { userId: user.id } : "skip"
  );
  const deleteReading = useMutation(api.readings.deleteReading);

  if (readings === undefined) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">History</h1>
        <p className="text-slate-400 text-center py-12">Loading...</p>
      </div>
    );
  }

  // Group by day
  const grouped: Record<string, Doc<"readings">[]> = {};
  for (const r of readings) {
    const day = new Date(r.timestamp).toLocaleDateString("en-ZA", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(r);
  }

  const days = Object.entries(grouped);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">History</h1>

      {days.length === 0 ? (
        <p className="text-slate-400 text-center py-12">No readings yet.</p>
      ) : (
        <div className="space-y-6">
          {days.map(([day, dayReadings]) => (
            <div key={day}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {day}
              </p>
              <div className="space-y-2">
                {dayReadings.map((r) => {
                  const timeStr = new Date(r.timestamp).toLocaleTimeString("en-ZA", {
                    hour: "2-digit", minute: "2-digit",
                  });
                  return (
                    <div key={r._id} className="bg-white rounded-xl border border-slate-200 flex items-center overflow-hidden group">
                      <div className={`w-1.5 self-stretch ${getGlucoseBgTailwind(r.value)}`} />
                      <div className="flex-1 px-4 py-3">
                        <p className="text-sm font-medium text-slate-800">
                          {r.type === "fasted" ? "Fasted" : "Post-meal"}
                        </p>
                        <p className="text-xs text-slate-400">{timeStr}</p>
                        {r.notes && <p className="text-xs text-slate-400 mt-0.5">{r.notes}</p>}
                      </div>
                      <div className="px-4 text-right flex items-center gap-3">
                        <div>
                          <p className="text-xl font-bold" style={{ color: getGlucoseColor(r.value) }}>
                            {r.value.toFixed(1)}
                          </p>
                          <p className="text-xs" style={{ color: getGlucoseColor(r.value) }}>
                            {getGlucoseLabel(r.value)}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteReading({ id: r._id as Id<"readings"> })}
                          className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all text-lg leading-none"
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
