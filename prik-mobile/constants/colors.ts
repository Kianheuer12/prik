export const Colors = {
  // Brand
  primary: "#2E86AB",      // calm blue — trustworthy, health-focused
  primaryLight: "#E6F4FE",
  accent: "#4CAF50",       // green — normal range

  // Glucose status colors
  low: "#7B5EA7",          // purple — below 4.0
  normal: "#4CAF50",       // green — 4.0–7.8
  slightlyHigh: "#F59E0B", // amber — 7.8–10.0
  high: "#EF4444",         // red — above 10.0

  // UI
  background: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  text: "#1A202C",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
};

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
    case "low":
      return Colors.low;
    case "normal":
      return Colors.normal;
    case "slightly-high":
      return Colors.slightlyHigh;
    case "high":
      return Colors.high;
  }
}

export function getGlucoseLabel(value: number): string {
  const status = getGlucoseStatus(value);
  switch (status) {
    case "low":
      return "Low";
    case "normal":
      return "Normal";
    case "slightly-high":
      return "Slightly High";
    case "high":
      return "High";
  }
}
