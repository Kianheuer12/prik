export const LightColors = {
  // Brand
  primary: "#2E86AB",
  primaryLight: "#E6F4FE",
  accent: "#4CAF50",

  // Glucose status
  low: "#7B5EA7",
  normal: "#4CAF50",
  slightlyHigh: "#F59E0B",
  high: "#EF4444",

  // UI
  background: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  text: "#1A202C",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
};

export const DarkColors: typeof LightColors = {
  // Brand
  primary: "#2E86AB",
  primaryLight: "#1E3A5F",
  accent: "#4CAF50",

  // Glucose status (slightly lighter for dark bg)
  low: "#9B7EC8",
  normal: "#66BB6A",
  slightlyHigh: "#FBBF24",
  high: "#F87171",

  // UI
  background: "#0F172A",   // slate-950
  surface: "#1E293B",      // slate-800
  border: "#334155",       // slate-700
  text: "#F1F5F9",         // slate-100
  textSecondary: "#94A3B8",// slate-400
  textMuted: "#64748B",    // slate-500
};

// Default export keeps backward compat for any static uses
export const Colors = LightColors;

export type GlucoseStatus = "low" | "normal" | "slightly-high" | "high";

export function getGlucoseStatus(value: number): GlucoseStatus {
  if (value < 4.0) return "low";
  if (value <= 7.8) return "normal";
  if (value <= 10.0) return "slightly-high";
  return "high";
}

export function getGlucoseColor(value: number): string {
  const status = getGlucoseStatus(value);
  switch (status) {
    case "low": return LightColors.low;
    case "normal": return LightColors.normal;
    case "slightly-high": return LightColors.slightlyHigh;
    case "high": return LightColors.high;
  }
}

export function getGlucoseLabel(value: number): string {
  const status = getGlucoseStatus(value);
  switch (status) {
    case "low": return "Low";
    case "normal": return "Normal";
    case "slightly-high": return "Slightly High";
    case "high": return "High";
  }
}
