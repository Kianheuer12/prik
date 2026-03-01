"use client";
import { useUser } from "@clerk/nextjs";
import { useMutation, useAction } from "convex/react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { getGlucoseColor, getGlucoseLabel } from "@/lib/glucose";

type MealItem = { name: string; estimatedCarbs: number; portion: string };
type MealAnalysis = {
  description: string;
  items: MealItem[];
  totalCarbs: number;
  confidence: "low" | "medium" | "high";
};

type ReadingType = "fasted" | "post-meal";
const MEAL_OFFSETS = ["30 min", "1 hr", "1.5 hrs", "2 hrs", "3 hrs"];

/** Resize an image file to max 800px wide and return { dataUrl, base64 } */
async function compressImage(file: File): Promise<{ dataUrl: string; base64: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 800;
      const scale = img.width > MAX ? MAX / img.width : 1;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      const base64 = dataUrl.split(",")[1];
      URL.revokeObjectURL(objectUrl);
      resolve({ dataUrl, base64 });
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

export default function LogReading() {
  const { user } = useUser();
  const addReading = useMutation(api.readings.addReading);
  const analyzeMeal = useAction(api.meals.analyzeMeal);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [value, setValue] = useState("");
  const [type, setType] = useState<ReadingType>("fasted");
  const [mealOffset, setMealOffset] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Meal analysis
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [showWeights, setShowWeights] = useState(false);
  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});
  const [recalculating, setRecalculating] = useState(false);

  const numericValue = parseFloat(value);
  const isValid = !isNaN(numericValue) && numericValue > 0 && numericValue < 50;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalysis(null); setShowWeights(false); setWeightInputs({});
    setAnalysing(true);
    try {
      const { dataUrl, base64 } = await compressImage(file);
      setPhotoDataUrl(dataUrl);
      const res = await analyzeMeal({ imageBase64: base64, mediaType: "image/jpeg" });
      setAnalysis(res);
      const w: Record<string, string> = {};
      res.items.forEach((item: MealItem) => { w[item.name] = ""; });
      setWeightInputs(w);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyse photo");
      setPhotoDataUrl(null);
    } finally {
      setAnalysing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRecalculate() {
    const weighted = Object.entries(weightInputs)
      .filter(([, w]) => w.trim() !== "" && !isNaN(parseFloat(w)))
      .map(([name, w]) => ({ name, weightG: parseFloat(w) }));
    if (weighted.length === 0) return;
    setRecalculating(true);
    try {
      const res = await analyzeMeal({ weightedItems: weighted });
      setAnalysis(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recalculation failed");
    } finally {
      setRecalculating(false);
    }
  }

  function removePhoto() {
    setPhotoDataUrl(null); setAnalysis(null);
    setShowWeights(false); setWeightInputs({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !isValid) return;
    setLoading(true); setError("");
    try {
      await addReading({
        userId: user.id,
        value: numericValue,
        timestamp: Date.now(),
        type,
        mealOffset: type === "post-meal" ? mealOffset : undefined,
        notes: notes.trim() || undefined,
        mealDescription: analysis?.description,
        estimatedCarbs: analysis?.totalCarbs,
        carbsConfidence: analysis?.confidence,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save reading");
    } finally {
      setLoading(false);
    }
  }

  const confidenceColor: Record<string, string> = { high: "#22c55e", medium: "#f59e0b", low: "#ef4444" };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">Log Reading</h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Glucose value */}
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
            style={{ borderColor: isValid ? getGlucoseColor(numericValue) : "#e2e8f0", color: isValid ? getGlucoseColor(numericValue) : undefined }}
          />
          {isValid && (
            <p className="text-center mt-2 font-semibold text-sm" style={{ color: getGlucoseColor(numericValue) }}>
              {getGlucoseLabel(numericValue)} · {numericValue.toFixed(1)} mmol/L
            </p>
          )}
        </div>

        {/* Reading type */}
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
          <>
            {/* Meal offset */}
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

            {/* Meal analysis */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Meal analysis (optional)
              </label>

              {/* Hidden file input */}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

              {!photoDataUrl ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 rounded-xl border-2 border-dashed border-[#2E86AB] bg-[#E6F4FE] dark:bg-[#1e3a5f] text-[#2E86AB] font-semibold text-sm transition-colors hover:bg-[#d4ecf7] dark:hover:bg-[#1a3356]"
                >
                  📷  Analyse Meal
                </button>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-3">
                  {/* Thumbnail */}
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoDataUrl} alt="Meal" className="w-20 h-20 rounded-lg object-cover" />
                    <button type="button" onClick={removePhoto} className="text-red-400 hover:text-red-600 text-sm font-medium">
                      ✕ Remove
                    </button>
                  </div>

                  {analysing ? (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                      <div className="w-4 h-4 border-2 border-[#2E86AB] border-t-transparent rounded-full animate-spin" />
                      Analysing meal...
                    </div>
                  ) : analysis ? (
                    <>
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Detected:</p>
                      {analysis.items.map((item: MealItem) => (
                        <div key={item.name} className="flex justify-between text-sm">
                          <span className="text-slate-700 dark:text-slate-200">• {item.name}</span>
                          <span className="text-slate-500 dark:text-slate-400">~{item.estimatedCarbs}g carbs</span>
                        </div>
                      ))}
                      <div className="border-t border-slate-100 dark:border-slate-700 pt-2 flex justify-between items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-100">~{analysis.totalCarbs}g carbs total</span>
                        <span className="text-xs font-semibold" style={{ color: confidenceColor[analysis.confidence] ?? "#888" }}>
                          {analysis.confidence} confidence
                        </span>
                      </div>

                      {/* Weight refinement toggle */}
                      <button
                        type="button"
                        onClick={() => setShowWeights(!showWeights)}
                        className="text-[#2E86AB] text-sm font-semibold"
                      >
                        {showWeights ? "▲ Hide weights" : "▼ Add weights for exact count"}
                      </button>

                      {showWeights && (
                        <div className="space-y-2 pt-1">
                          {analysis.items.map((item: MealItem) => (
                            <div key={item.name} className="flex items-center gap-3">
                              <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{item.name}</span>
                              <input
                                type="number" min="0" placeholder="g"
                                value={weightInputs[item.name] ?? ""}
                                onChange={(e) => setWeightInputs((prev) => ({ ...prev, [item.name]: e.target.value }))}
                                className="w-20 text-right border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-[#2E86AB]"
                              />
                              <span className="text-slate-400 text-sm">g</span>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={handleRecalculate}
                            disabled={recalculating}
                            className="w-full py-2 rounded-xl bg-[#2E86AB] hover:bg-[#2577a0] text-white text-sm font-semibold transition-colors disabled:opacity-50"
                          >
                            {recalculating ? "Recalculating..." : "Recalculate →"}
                          </button>
                        </div>
                      )}

                      <p className="text-xs text-slate-400 dark:text-slate-500">* Estimates only — not medical advice</p>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          </>
        )}

        {/* Notes */}
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
