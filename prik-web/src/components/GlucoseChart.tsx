"use client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
} from "recharts";

type Reading = { timestamp: number; value: number; type: string };

function getColor(val: number) {
  if (val < 4.0) return "#7C3AED";
  if (val <= 7.8) return "#16A34A";
  if (val <= 10.0) return "#D97706";
  return "#DC2626";
}

function CustomDot(props: { cx?: number; cy?: number; payload?: Reading }) {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={getColor(payload.value)}
      stroke="white"
      strokeWidth={2}
    />
  );
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Reading }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm text-xs">
      <p className="font-bold text-base" style={{ color: getColor(d.value) }}>
        {d.value.toFixed(1)} mmol/L
      </p>
      <p className="text-slate-500">{d.type === "fasted" ? "Fasted" : "Post-meal"}</p>
      <p className="text-slate-400">
        {new Date(d.timestamp).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" })}
        {" · "}
        {new Date(d.timestamp).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}

export function GlucoseChart({ readings }: { readings: Reading[] }) {
  const data = [...readings].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <ReferenceArea y1={4.0} y2={7.8} fill="#dcfce7" fillOpacity={0.6} />
        <ReferenceLine y={4.0} stroke="#16A34A" strokeDasharray="3 3" strokeOpacity={0.4} />
        <ReferenceLine y={7.8} stroke="#16A34A" strokeDasharray="3 3" strokeOpacity={0.4} />
        <XAxis
          dataKey="timestamp"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(ts: number) =>
            new Date(ts).toLocaleDateString("en-ZA", { weekday: "short", day: "numeric" })
          }
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 25]}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          tickCount={6}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#2E86AB"
          strokeWidth={2}
          dot={<CustomDot />}
          activeDot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
