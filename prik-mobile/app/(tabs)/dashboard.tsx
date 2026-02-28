import { useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useMemo, useEffect, useRef, useState } from "react";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Colors, getGlucoseColor, getGlucoseLabel } from "../../constants/colors";
import { GlucoseChart } from "../../components/GlucoseChart";
import { EditReadingModal, type EditableReading } from "../../components/EditReadingModal";

// ─── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonBox({ style }: { style?: object }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return <Animated.View style={[styles.skeletonBox, style, { opacity }]} />;
}

function DashboardSkeleton() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SkeletonBox style={{ height: 30, width: 160, marginBottom: 6 }} />
      <SkeletonBox style={{ height: 16, width: 120, marginBottom: 20 }} />
      <View style={styles.statsRow}>
        {[0, 1, 2].map((i) => (
          <SkeletonBox key={i} style={{ flex: 1, height: 72 }} />
        ))}
      </View>
      <SkeletonBox style={{ height: 56, width: "100%", marginBottom: 24 }} />
      <SkeletonBox style={{ height: 200, width: "100%", marginBottom: 24 }} />
      <SkeletonBox style={{ height: 20, width: 140, marginBottom: 12 }} />
      {[0, 1, 2, 3].map((i) => (
        <SkeletonBox key={i} style={{ height: 64, width: "100%", marginBottom: 8 }} />
      ))}
    </ScrollView>
  );
}

// ─── Reading row ─────────────────────────────────────────────────────────────

function ReadingRow({
  value,
  type,
  timestamp,
  notes,
  mealOffset,
  onEdit,
  onDelete,
}: {
  value: number;
  type: string;
  timestamp: number;
  notes?: string;
  mealOffset?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = getGlucoseColor(value);
  const label = getGlucoseLabel(value);
  const date = new Date(timestamp);
  const timeStr = date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  const dateStr = date.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });

  function renderRightActions(progress: Animated.AnimatedInterpolation<number>) {
    const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
    return (
      <Animated.View style={[styles.swipeActions, { opacity }]}>
        <TouchableOpacity style={styles.editAction} onPress={onEdit}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteAction} onPress={onDelete}>
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Swipeable renderRightActions={renderRightActions} friction={2} rightThreshold={40}>
      <View style={styles.readingRow}>
        <View style={[styles.readingBar, { backgroundColor: color }]} />
        <View style={styles.readingInfo}>
          <Text style={styles.readingType}>{type === "fasted" ? "Fasted" : "Post-meal"}</Text>
          <Text style={styles.readingDate}>
            {dateStr} · {timeStr}
            {type === "post-meal" && mealOffset ? ` · ${mealOffset} after meal` : ""}
          </Text>
          {notes ? <Text style={styles.readingNotes}>{notes}</Text> : null}
        </View>
        <View style={styles.readingRight}>
          <Text style={[styles.readingValue, { color }]}>{value.toFixed(1)}</Text>
          <Text style={[styles.readingStatus, { color }]}>{label}</Text>
        </View>
      </View>
    </Swipeable>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useUser();
  const router = useRouter();
  const sevenDaysAgo = useMemo(() => Date.now() - 7 * 24 * 60 * 60 * 1000, []);

  const readings = useQuery(
    api.readings.getLast7DaysReadings,
    user ? { userId: user.id, since: sevenDaysAgo } : "skip"
  );
  const deleteReading = useMutation(api.readings.deleteReading);
  const [editingReading, setEditingReading] = useState<EditableReading | null>(null);

  if (!user || readings === undefined) return <DashboardSkeleton />;

  const sorted = [...readings].sort((a, b) => b.timestamp - a.timestamp);
  const values = sorted.map((r) => r.value);
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const high = values.length ? Math.max(...values) : null;
  const low = values.length ? Math.min(...values) : null;

  return (
    <>
      {editingReading && (
        <EditReadingModal reading={editingReading} onClose={() => setEditingReading(null)} />
      )}
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Hi {user.firstName ?? "there"} 👋</Text>
        <Text style={styles.subtitle}>
          Last 7 days · {values.length} reading{values.length !== 1 ? "s" : ""}
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Average", value: avg },
            { label: "High", value: high },
            { label: "Low", value: low },
          ].map(({ label, value }) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statLabel}>{label}</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: value !== null ? getGlucoseColor(value) : Colors.textMuted },
                ]}
              >
                {value !== null ? value.toFixed(1) : "—"}
              </Text>
            </View>
          ))}
        </View>

        {/* Log button */}
        <TouchableOpacity style={styles.logButton} onPress={() => router.push("/(tabs)/log")}>
          <Text style={styles.logButtonText}>+ Log Reading</Text>
        </TouchableOpacity>

        {/* Chart */}
        {readings.length > 1 && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>7-day trend</Text>
              <View style={styles.chartLegend}>
                <View style={styles.legendDot} />
                <Text style={styles.legendText}>Target 4.0–7.8</Text>
              </View>
            </View>
            <GlucoseChart readings={readings} />
          </View>
        )}

        {/* Readings list */}
        <Text style={styles.sectionTitle}>Recent Readings</Text>

        {sorted.length === 0 ? (
          <Text style={styles.emptyText}>No readings in the last 7 days.</Text>
        ) : (
          sorted.map((r) => (
            <ReadingRow
              key={r._id}
              value={r.value}
              type={r.type}
              timestamp={r.timestamp}
              notes={r.notes}
              mealOffset={(r as { mealOffset?: string }).mealOffset}
              onEdit={() => setEditingReading(r as EditableReading)}
              onDelete={() => deleteReading({ id: r._id as Id<"readings"> })}
            />
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },

  skeletonBox: { backgroundColor: "#e2e8f0", borderRadius: 12, marginBottom: 8 },

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
  statValue: { fontSize: 22, fontWeight: "700" },

  logButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  logButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    overflow: "hidden",
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  chartTitle: { fontSize: 14, fontWeight: "600", color: Colors.text },
  chartLegend: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#86efac",
  },
  legendText: { fontSize: 11, color: Colors.textMuted },

  sectionTitle: { fontSize: 17, fontWeight: "600", color: Colors.text, marginBottom: 12 },
  readingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  readingBar: { width: 5, alignSelf: "stretch" },
  readingInfo: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  readingType: { fontSize: 14, fontWeight: "500", color: Colors.text },
  readingDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  readingNotes: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  readingRight: { paddingHorizontal: 14, alignItems: "flex-end" },
  readingValue: { fontSize: 20, fontWeight: "700" },
  readingStatus: { fontSize: 11 },

  swipeActions: { flexDirection: "row", marginBottom: 8, gap: 6, alignItems: "center" },
  editAction: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignSelf: "stretch",
  },
  deleteAction: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignSelf: "stretch",
  },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  emptyText: { color: Colors.textMuted, textAlign: "center", marginTop: 20 },
});
