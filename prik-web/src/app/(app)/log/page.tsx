"use client";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { getGlucoseColor, getGlucoseLabel } from "@/lib/glucose";

type ReadingType = "fasted" | "post-meal";

const MEAL_OFFSETS = ["30 min", "1 hr", "1.5 hrs", "2 hrs", "3 hrs"];

export default function LogReading() {
  const { user } = useUser();
  const addReading = useMutation(api.readings.addReading);
  const router = useRouter();

  const [value, setValue] = useState("");
  const [type, setType] = useState<ReadingType>("fasted");
  const [mealOffset, setMealOffset] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const numericValue = parseFloat(value);
  const isValid = !isNaN(numericValue) && numericValue > 0 && numericValue < 50;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !isValid) return;
    setLoading(true);
    setError("");
    try {
      await addReading({
        userId: user.id,
        value: numericValue,
        timestamp: Date.now(),
        type,
        mealOffset: type === "post-meal" ? mealOffset : undefined,
        notes: notes.trim() || undefined,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save reading");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Log Reading</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Glucose (mmol/L)
          </label>
          <input
            type="number" step="0.1" min="0" max="50"
            placeholder="e.g. 5.4"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full text-4xl font-bold text-center py-5 rounded-2xl border-2 bg-white dark:bg-slate-800 dark:text-slate-100 outline-none transition-colors"
            style={{
              borderColor: isValid ? getGlucoseColor(numericValue) : "#e2e8f0",
              color: isValid ? getGlucoseColor(numericValue) : undefined,
            }}
          />
          {isValid && (
            <p className="text-center mt-2 font-semibold text-sm" style={{ color: getGlucoseColor(numericValue) }}>
              {getGlucoseLabel(numericValue)} · {numericValue.toFixed(1)} mmol/L
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Reading type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(["fasted", "post-meal"] as ReadingType[]).map((t) => (
              <button
                key={t} type="button" onClick={() => setType(t)}
                className={`py-3 rounded-xl border font-medium transition-colors ${
                  type === t
                    ? "bg-[#E6F4FE] dark:bg-[#1e3a5f] border-[#2E86AB] text-[#2E86AB]"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                }`}
              >
                {t === "fasted" ? "Fasted" : "Post-meal"}
              </button>
            ))}
          </div>
        </div>

        {type === "post-meal" && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Time after meal
            </label>
            <div className="flex flex-wrap gap-2">
              {MEAL_OFFSETS.map((o) => (
                <button
                  key={o} type="button"
                  onClick={() => setMealOffset(mealOffset === o ? undefined : o)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                    mealOffset === o
                      ? "bg-[#E6F4FE] dark:bg-[#1e3a5f] border-[#2E86AB] text-[#2E86AB]"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Notes (optional)
          </label>
          <textarea
            placeholder="e.g. after lunch, felt dizzy..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 dark:placeholder-slate-500 outline-none resize-none focus:border-[#2E86AB] transition-colors"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={!isValid || loading}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-colors disabled:opacity-40 bg-[#2E86AB] hover:bg-[#2577a0]"
        >
          {loading ? "Saving..." : "Save Reading"}
        </button>
      </form>
    </div>
  );
}
