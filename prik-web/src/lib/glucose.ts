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
    case "low": return "#7B5EA7";
    case "normal": return "#4CAF50";
    case "slightly-high": return "#F59E0B";
    case "high": return "#EF4444";
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

export function getGlucoseTailwind(value: number): string {
  const status = getGlucoseStatus(value);
  switch (status) {
    case "low": return "text-purple-500";
    case "normal": return "text-green-500";
    case "slightly-high": return "text-amber-500";
    case "high": return "text-red-500";
  }
}

export function getGlucoseBgTailwind(value: number): string {
  const status = getGlucoseStatus(value);
  switch (status) {
    case "low": return "bg-purple-500";
    case "normal": return "bg-green-500";
    case "slightly-high": return "bg-amber-500";
    case "high": return "bg-red-500";
  }
}

export function getGlucoseBorderTailwind(value: number): string {
  const status = getGlucoseStatus(value);
  switch (status) {
    case "low": return "border-purple-400";
    case "normal": return "border-green-400";
    case "slightly-high": return "border-amber-400";
    case "high": return "border-red-400";
  }
}
