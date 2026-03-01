"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { getGlucoseColor, getGlucoseLabel } from "@/lib/glucose";

type ReadingType = "fasted" | "post-meal";

export type EditableReading = {
  _id: string;
  value: number;
  type: string;
  mealOffset?: string;
  notes?: string;
};

const MEAL_OFFSETS = ["30 min", "1 hr", "1.5 hrs", "2 hrs", "3 hrs"];

export function EditReadingModal({
  reading,
  onClose,
}: {
  reading: EditableReading;
  onClose: () => void;
}) {
  const updateReading = useMutation(api.readings.updateReading);
  const [value, setValue] = useState(reading.value.toFixed(1));
  const [type, setType] = useState<ReadingType>(reading.type as ReadingType);
  const [mealOffset, setMealOffset] = useState<string | undefined>(reading.mealOffset);
  const [notes, setNotes] = useState(reading.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const numericValue = parseFloat(value);
  const isValid = !isNaN(numericValue) && numericValue > 0 && numericValue < 50;

  async function handleSave() {
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      await updateReading({
        id: reading._id as Id<"readings">,
        value: numericValue,
        type,
        mealOffset: type === "post-meal" ? mealOffset : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-5">Edit Reading</h2>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Glucose (mmol/L)
          </label>
          <input
            type="number" step="0.1" min="0" max="50"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full text-3xl font-bold text-center py-4 rounded-xl border-2 bg-white dark:bg-slate-700 dark:text-slate-100 outline-none transition-colors"
            style={{ borderColor: isValid ? getGlucoseColor(numericValue) : "#e2e8f0", color: isValid ? getGlucoseColor(numericValue) : undefined }}
          />
          {isValid && (
            <p className="text-center mt-1 text-sm font-semibold" style={{ color: getGlucoseColor(numericValue) }}>
              {getGlucoseLabel(numericValue)}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(["fasted", "post-meal"] as ReadingType[]).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`py-2.5 rounded-xl border font-medium text-sm transition-colors ${
                  type === t
                    ? "bg-[#E6F4FE] dark:bg-[#1e3a5f] border-[#2E86AB] text-[#2E86AB]"
                    : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                }`}
              >
                {t === "fasted" ? "Fasted" : "Post-meal"}
              </button>
            ))}
          </div>
        </div>

        {type === "post-meal" && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Time after meal</label>
            <div className="flex flex-wrap gap-2">
              {MEAL_OFFSETS.map((o) => (
                <button key={o} type="button" onClick={() => setMealOffset(mealOffset === o ? undefined : o)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    mealOffset === o
                      ? "bg-[#E6F4FE] dark:bg-[#1e3a5f] border-[#2E86AB] text-[#2E86AB]"
                      : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Notes (optional)</label>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 outline-none resize-none focus:border-[#2E86AB] transition-colors"
          />
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button onClick={handleSave} disabled={!isValid || loading}
            className="flex-1 py-3 rounded-xl bg-[#2E86AB] text-white font-bold hover:bg-[#2577a0] transition-colors disabled:opacity-40"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
