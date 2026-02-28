"use client";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { getGlucoseColor, getGlucoseLabel, getGlucoseBgTailwind } from "@/lib/glucose";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { EditReadingModal, type EditableReading } from "@/components/EditReadingModal";
import { downloadXLSX } from "@/lib/export";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

function HistorySkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="mb-6">
          <Skeleton className="h-4 w-48 mb-2" />
          <div className="space-y-2">
            {[0, 1, 2].map((j) => <Skeleton key={j} className="h-16" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function History() {
  const { user } = useUser();
  const readings = useQuery(
    api.readings.getReadingsForUser,
    user ? { userId: user.id } : "skip"
  );
  const deleteReading = useMutation(api.readings.deleteReading);
  const [editingReading, setEditingReading] = useState<EditableReading | null>(null);

  if (!user || readings === undefined) return <HistorySkeleton />;

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
      {editingReading && (
        <EditReadingModal reading={editingReading} onClose={() => setEditingReading(null)} />
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">History</h1>
        {readings.length > 0 && (
          <button
            onClick={() => downloadXLSX(readings, `prik-all-readings-${new Date().toISOString().slice(0, 10)}`)}
            className="text-sm text-white bg-[#2E86AB] hover:bg-[#2577a0] px-4 py-2 rounded-xl font-medium transition-colors"
          >
            Export XLSX
          </button>
        )}
      </div>

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
                  const mealOffset = (r as { mealOffset?: string }).mealOffset;
                  return (
                    <div key={r._id} className="bg-white rounded-xl border border-slate-200 flex items-center overflow-hidden group">
                      <div className={`w-1.5 self-stretch ${getGlucoseBgTailwind(r.value)}`} />
                      <div className="flex-1 px-4 py-3">
                        <p className="text-sm font-medium text-slate-800">
                          {r.type === "fasted" ? "Fasted" : "Post-meal"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {timeStr}
                          {r.type === "post-meal" && mealOffset && <> · {mealOffset} after meal</>}
                        </p>
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
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                          <button
                            onClick={() => setEditingReading(r as EditableReading)}
                            className="text-slate-300 hover:text-[#2E86AB] text-base leading-none transition-colors"
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => deleteReading({ id: r._id as Id<"readings"> })}
                            className="text-slate-300 hover:text-red-400 text-lg leading-none transition-colors"
                            title="Delete"
                          >
                            ×
                          </button>
                        </div>
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
