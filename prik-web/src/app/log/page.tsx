"use client";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { getGlucoseColor, getGlucoseLabel } from "@/lib/glucose";

type ReadingType = "fasted" | "post-meal";

export default function LogReading() {
  const { user } = useUser();
  const addReading = useMutation(api.readings.addReading);
  const router = useRouter();

  const [value, setValue] = useState("");
  const [type, setType] = useState<ReadingType>("fasted");
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
        notes: notes.trim() || undefined,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Failed to save reading");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-900">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Log Reading</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Value input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Glucose (mmol/L)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="50"
              placeholder="e.g. 5.4"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full text-4xl font-bold text-center py-5 rounded-2xl border-2 bg-white outline-none transition-colors"
              style={{
                borderColor: isValid ? getGlucoseColor(numericValue) : "#e2e8f0",
                color: isValid ? getGlucoseColor(numericValue) : "#1a202c",
              }}
            />
            {isValid && (
              <p
                className="text-center mt-2 font-semibold text-sm"
                style={{ color: getGlucoseColor(numericValue) }}
              >
                {getGlucoseLabel(numericValue)} · {numericValue.toFixed(1)} mmol/L
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Reading type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["fasted", "post-meal"] as ReadingType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-3 rounded-xl border font-medium transition-colors ${
                    type === t
                      ? "bg-[#E6F4FE] border-[#2E86AB] text-[#2E86AB]"
                      : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  {t === "fasted" ? "Fasted" : "Post-meal"}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Notes (optional)
            </label>
            <textarea
              placeholder="e.g. after lunch, felt dizzy..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none resize-none focus:border-[#2E86AB] transition-colors"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-colors disabled:opacity-40"
            style={{ backgroundColor: isValid ? "#2E86AB" : "#94a3b8" }}
          >
            {loading ? "Saving..." : "Save Reading"}
          </button>
        </form>
      </div>
    </div>
  );
}
