import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { api } from "../../convex/_generated/api";
import { Colors, getGlucoseColor, getGlucoseLabel } from "../../constants/colors";

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

function ReadingRow({ value, type, timestamp, notes }: {
  value: number;
  type: string;
  timestamp: number;
  notes?: string;
}) {
  const color = getGlucoseColor(value);
  const label = getGlucoseLabel(value);
  const date = new Date(timestamp);
  const timeStr = date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  const dateStr = date.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });

  return (
    <View style={styles.readingRow}>
      <View style={[styles.readingDot, { backgroundColor: color }]} />
      <View style={styles.readingInfo}>
        <Text style={styles.readingType}>{type === "fasted" ? "Fasted" : "Post-meal"}</Text>
        <Text style={styles.readingDate}>{dateStr} · {timeStr}</Text>
        {notes ? <Text style={styles.readingNotes}>{notes}</Text> : null}
      </View>
      <View>
        <Text style={[styles.readingValue, { color }]}>{value.toFixed(1)}</Text>
        <Text style={[styles.readingStatus, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

export default function Dashboard() {
  const { user } = useUser();
  const router = useRouter();

  const sevenDaysAgo = useMemo(() => Date.now() - 7 * 24 * 60 * 60 * 1000, []);

  const readings = useQuery(
    api.readings.getLast7DaysReadings,
    user ? { userId: user.id, since: sevenDaysAgo } : "skip"
  );

  const sorted = readings ? [...readings].sort((a, b) => b.timestamp - a.timestamp) : [];
  const values = sorted.map((r) => r.value);
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const high = values.length ? Math.max(...values) : null;
  const low = values.length ? Math.min(...values) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Hi {user?.firstName ?? "there"} 👋</Text>
      <Text style={styles.subtitle}>Last 7 days · {values.length} reading{values.length !== 1 ? "s" : ""}</Text>

      <View style={styles.statsRow}>
        <StatCard
          label="Average"
          value={avg !== null ? avg.toFixed(1) : "—"}
          color={avg !== null ? getGlucoseColor(avg) : Colors.textMuted}
        />
        <StatCard
          label="High"
          value={high !== null ? high.toFixed(1) : "—"}
          color={high !== null ? getGlucoseColor(high) : Colors.textMuted}
        />
        <StatCard
          label="Low"
          value={low !== null ? low.toFixed(1) : "—"}
          color={low !== null ? getGlucoseColor(low) : Colors.textMuted}
        />
      </View>

      <TouchableOpacity style={styles.logButton} onPress={() => router.push("/(tabs)/log")}>
        <Text style={styles.logButtonText}>+ Log Reading</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recent Readings</Text>

      {readings === undefined ? (
        <Text style={styles.emptyText}>Loading...</Text>
      ) : sorted.length === 0 ? (
        <Text style={styles.emptyText}>No readings in the last 7 days.</Text>
      ) : (
        sorted.map((r) => (
          <ReadingRow key={r._id} value={r.value} type={r.type} timestamp={r.timestamp} notes={r.notes} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  greeting: { fontSize: 24, fontWeight: "700", color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: "700", color: Colors.text },
  logButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  logButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  sectionTitle: { fontSize: 17, fontWeight: "600", color: Colors.text, marginBottom: 12 },
  readingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  readingDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  readingInfo: { flex: 1 },
  readingType: { fontSize: 14, fontWeight: "500", color: Colors.text },
  readingDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  readingNotes: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  readingValue: { fontSize: 20, fontWeight: "700", textAlign: "right" },
  readingStatus: { fontSize: 11, textAlign: "right" },
  emptyText: { color: Colors.textMuted, textAlign: "center", marginTop: 20 },
});
