import { useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useMemo, useEffect, useRef, useState } from "react";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { getGlucoseColor, getGlucoseLabel } from "../../constants/colors";
import { useColors } from "../../contexts/ThemeContext";
import { GlucoseChart } from "../../components/GlucoseChart";
import { EditReadingModal, type EditableReading } from "../../components/EditReadingModal";
import { DeleteConfirmModal } from "../../components/DeleteConfirmModal";

// ─── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonBox({ style }: { style?: object }) {
  const colors = useColors();
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
  return <Animated.View style={[styles.skeletonBox, { backgroundColor: colors.border }, style, { opacity }]} />;
}

function DashboardSkeleton() {
  const colors = useColors();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <SkeletonBox style={{ height: 30, width: 160, marginBottom: 6 }} />
      <SkeletonBox style={{ height: 16, width: 120, marginBottom: 20 }} />
      <View style={styles.statsRow}>
        {[0, 1, 2].map((i) => <SkeletonBox key={i} style={{ flex: 1, height: 72 }} />)}
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

function ReadingRow({ value, type, timestamp, notes, mealOffset, onEdit, onDelete }: {
  value: number; type: string; timestamp: number; notes?: string; mealOffset?: string;
  onEdit: () => void; onDelete: () => void;
}) {
  const colors = useColors();
  const color = getGlucoseColor(value);
  const label = getGlucoseLabel(value);
  const date = new Date(timestamp);
  const timeStr = date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  const dateStr = date.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });

  function renderRightActions(progress: Animated.AnimatedInterpolation<number>) {
    const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
    return (
      <Animated.View style={[styles.swipeActions, { opacity }]}>
        <TouchableOpacity style={[styles.editAction, { backgroundColor: colors.primary }]} onPress={onEdit}>
          <Ionicons name="pencil" size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteAction} onPress={onDelete}>
          <Ionicons name="trash" size={16} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Swipeable renderRightActions={renderRightActions} friction={2} rightThreshold={40}>
      <View style={[styles.readingRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.readingBar, { backgroundColor: color }]} />
        <View style={styles.readingInfo}>
          <Text style={[styles.readingType, { color: colors.text }]}>{type === "fasted" ? "Fasted" : "Post-meal"}</Text>
          <Text style={[styles.readingDate, { color: colors.textSecondary }]}>
            {dateStr} · {timeStr}{type === "post-meal" && mealOffset ? ` · ${mealOffset} after meal` : ""}
          </Text>
          {notes ? <Text style={[styles.readingNotes, { color: colors.textMuted }]}>{notes}</Text> : null}
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
  const colors = useColors();
  const { user } = useUser();
  const router = useRouter();
  const sevenDaysAgo = useMemo(() => Date.now() - 7 * 24 * 60 * 60 * 1000, []);

  const readings = useQuery(
    api.readings.getLast7DaysReadings,
    user ? { userId: user.id, since: sevenDaysAgo } : "skip"
  );
  const deleteReading = useMutation(api.readings.deleteReading);
  const [editingReading, setEditingReading] = useState<EditableReading | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      {deletingId && (
        <DeleteConfirmModal
          onConfirm={() => { deleteReading({ id: deletingId as Id<"readings"> }); setDeletingId(null); }}
          onCancel={() => setDeletingId(null)}
        />
      )}
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content}>
        <Text style={[styles.greeting, { color: colors.text }]}>Hi {user.firstName ?? "there"} 👋</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Last 7 days · {values.length} reading{values.length !== 1 ? "s" : ""}
        </Text>

        <View style={styles.statsRow}>
          {[
            { label: "Average", value: avg },
            { label: "High", value: high },
            { label: "Low", value: low },
          ].map(({ label, value }) => (
            <View key={label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
              <Text style={[styles.statValue, { color: value !== null ? getGlucoseColor(value) : colors.textMuted }]}>
                {value !== null ? value.toFixed(1) : "—"}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.logButton, { backgroundColor: colors.primary }]} onPress={() => router.push("/(tabs)/log")}>
          <Text style={styles.logButtonText}>+ Log Reading</Text>
        </TouchableOpacity>

        {readings.length > 1 && (
          <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.chartHeader}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>7-day trend</Text>
              <View style={styles.chartLegend}>
                <View style={styles.legendDot} />
                <Text style={[styles.legendText, { color: colors.textMuted }]}>Target 4.0–7.8</Text>
              </View>
            </View>
            <GlucoseChart readings={readings} />
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Readings</Text>

        {sorted.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No readings in the last 7 days.</Text>
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
              onDelete={() => setDeletingId(r._id)}
            />
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 100 },

  skeletonBox: { borderRadius: 12, marginBottom: 8 },

  greeting: { fontSize: 24, fontWeight: "700" },
  subtitle: { fontSize: 14, marginBottom: 20 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1 },
  statLabel: { fontSize: 11, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: "700" },

  logButton: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginBottom: 24 },
  logButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  chartCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 24, overflow: "hidden" },
  chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  chartTitle: { fontSize: 14, fontWeight: "600" },
  chartLegend: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 3, backgroundColor: "#dcfce7", borderWidth: 1, borderColor: "#86efac" },
  legendText: { fontSize: 11 },

  sectionTitle: { fontSize: 17, fontWeight: "600", marginBottom: 12 },
  readingRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, marginBottom: 8, borderWidth: 1, overflow: "hidden" },
  readingBar: { width: 5, alignSelf: "stretch" },
  readingInfo: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  readingType: { fontSize: 14, fontWeight: "500" },
  readingDate: { fontSize: 12, marginTop: 1 },
  readingNotes: { fontSize: 12, marginTop: 2 },
  readingRight: { paddingHorizontal: 14, alignItems: "flex-end" },
  readingValue: { fontSize: 20, fontWeight: "700" },
  readingStatus: { fontSize: 11 },

  swipeActions: { flexDirection: "row", marginBottom: 8, gap: 6, alignItems: "center" },
  editAction: { borderRadius: 12, paddingHorizontal: 16, justifyContent: "center", alignSelf: "stretch" },
  deleteAction: { backgroundColor: "#EF4444", borderRadius: 12, paddingHorizontal: 16, justifyContent: "center", alignSelf: "stretch" },

  emptyText: { textAlign: "center", marginTop: 20 },
});
