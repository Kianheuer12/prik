"use client";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { getGlucoseColor, getGlucoseLabel, getGlucoseBgTailwind } from "@/lib/glucose";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { EditReadingModal, type EditableReading } from "@/components/EditReadingModal";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { downloadXLSX } from "@/lib/export";
import { Pencil, Trash2 } from "lucide-react";

const PAGE_SIZE = 20;

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl ${className}`} />;
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

  // Paginated query for display (20 at a time)
  const { results, status, loadMore } = usePaginatedQuery(
    api.readings.getReadingsPage,
    user ? { userId: user.id } : "skip",
    { initialNumItems: PAGE_SIZE }
  );

  // Full query used only for export
  const allReadings = useQuery(
    api.readings.getReadingsForUser,
    user ? { userId: user.id } : "skip"
  );

  const deleteReading = useMutation(api.readings.deleteReading);
  const [editingReading, setEditingReading] = useState<EditableReading | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!user || status === "LoadingFirstPage") return <HistorySkeleton />;

  const grouped: Record<string, Doc<"readings">[]> = {};
  for (const r of results) {
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
      {deletingId && (
        <DeleteConfirmModal
          onConfirm={() => { deleteReading({ id: deletingId as Id<"readings"> }); setDeletingId(null); }}
          onCancel={() => setDeletingId(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">History</h1>
        {(allReadings?.length ?? 0) > 0 && (
          <button
            onClick={() => allReadings && downloadXLSX(allReadings, `prik-all-readings-${new Date().toISOString().slice(0, 10)}`)}
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
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">
                {day}
              </p>
              <div className="space-y-2">
                {dayReadings.map((r) => {
                  const timeStr = new Date(r.timestamp).toLocaleTimeString("en-ZA", {
                    hour: "2-digit", minute: "2-digit",
                  });
                  const mealOffset = (r as { mealOffset?: string }).mealOffset;
                  return (
                    <div key={r._id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center overflow-hidden group">
                      <div className={`w-1.5 self-stretch ${getGlucoseBgTailwind(r.value)}`} />
                      <div className="flex-1 px-4 py-3">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {r.type === "fasted" ? "Fasted" : "Post-meal"}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {timeStr}
                          {r.type === "post-meal" && mealOffset && <> · {mealOffset} after meal</>}
                        </p>
                        {r.notes && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{r.notes}</p>}
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
                        <div className="flex gap-1 transition-all sm:opacity-0 sm:group-hover:opacity-100">
                          <button
                            onClick={() => setEditingReading(r as EditableReading)}
                            className="text-slate-300 dark:text-slate-600 hover:text-[#2E86AB] transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeletingId(r._id)}
                            className="text-slate-300 dark:text-slate-600 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
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

      {status === "CanLoadMore" && (
        <div className="mt-6 text-center">
          <button
            onClick={() => loadMore(PAGE_SIZE)}
            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Load more
          </button>
        </div>
      )}
      {status === "LoadingMore" && (
        <div className="mt-6 flex justify-center">
          <div className="w-5 h-5 border-2 border-[#2E86AB] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
