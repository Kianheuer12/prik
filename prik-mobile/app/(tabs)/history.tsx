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
import { useEffect, useRef, useState } from "react";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Colors, getGlucoseColor, getGlucoseLabel } from "../../constants/colors";
import { EditReadingModal, type EditableReading } from "../../components/EditReadingModal";
import { DeleteConfirmModal } from "../../components/DeleteConfirmModal";

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

function HistorySkeleton() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SkeletonBox style={{ height: 28, width: 100, marginBottom: 20 }} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ marginBottom: 24 }}>
          <SkeletonBox style={{ height: 14, width: 160, marginBottom: 10 }} />
          {[0, 1, 2].map((j) => (
            <SkeletonBox key={j} style={{ height: 60, width: "100%", marginBottom: 6 }} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Reading row with swipe ───────────────────────────────────────────────────

function ReadingRow({
  id,
  value,
  type,
  timestamp,
  notes,
  mealOffset,
  onEdit,
  onDelete,
}: {
  id: string;
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
  const time = new Date(timestamp).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  function renderRightActions(progress: Animated.AnimatedInterpolation<number>) {
    const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
    return (
      <Animated.View style={[styles.swipeActions, { opacity }]}>
        <TouchableOpacity style={styles.editAction} onPress={onEdit}>
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
      <View style={styles.row}>
        <View style={[styles.colorBar, { backgroundColor: color }]} />
        <View style={styles.rowInfo}>
          <Text style={styles.rowType}>{type === "fasted" ? "Fasted" : "Post-meal"}</Text>
          <Text style={styles.rowTime}>
            {time}
            {type === "post-meal" && mealOffset ? ` · ${mealOffset} after meal` : ""}
          </Text>
          {notes ? <Text style={styles.rowNotes}>{notes}</Text> : null}
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.rowValue, { color }]}>{value.toFixed(1)}</Text>
          <Text style={[styles.rowStatus, { color }]}>{label}</Text>
        </View>
      </View>
    </Swipeable>
  );
}

// ─── History ─────────────────────────────────────────────────────────────────

export default function History() {
  const { user } = useUser();
  const readings = useQuery(
    api.readings.getReadingsForUser,
    user ? { userId: user.id } : "skip"
  );
  const deleteReading = useMutation(api.readings.deleteReading);
  const [editingReading, setEditingReading] = useState<EditableReading | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!user || readings === undefined) return <HistorySkeleton />;

  const grouped: Record<string, typeof readings> = {};
  for (const r of readings) {
    const day = new Date(r.timestamp).toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(r);
  }

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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>History</Text>

        {readings.length === 0 ? (
          <Text style={styles.empty}>No readings logged yet.</Text>
        ) : (
          Object.entries(grouped).map(([day, dayReadings]) => (
            <View key={day} style={styles.dayGroup}>
              <Text style={styles.dayLabel}>{day}</Text>
              {dayReadings.map((r) => (
                <ReadingRow
                  key={r._id}
                  id={r._id}
                  value={r.value}
                  type={r.type}
                  timestamp={r.timestamp}
                  notes={r.notes}
                  mealOffset={(r as { mealOffset?: string }).mealOffset}
                  onEdit={() => setEditingReading(r as EditableReading)}
                  onDelete={() => setDeletingId(r._id)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },

  skeletonBox: { backgroundColor: "#e2e8f0", borderRadius: 12, marginBottom: 6 },

  heading: { fontSize: 24, fontWeight: "700", color: Colors.text, marginBottom: 20 },
  empty: { color: Colors.textMuted, textAlign: "center", marginTop: 40 },

  dayGroup: { marginBottom: 24 },
  dayLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  colorBar: { width: 5, alignSelf: "stretch" },
  rowInfo: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  rowType: { fontSize: 14, fontWeight: "500", color: Colors.text },
  rowTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  rowNotes: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  rowRight: { paddingHorizontal: 14, alignItems: "flex-end", justifyContent: "center" },
  rowValue: { fontSize: 20, fontWeight: "700" },
  rowStatus: { fontSize: 11 },

  swipeActions: { flexDirection: "row", marginBottom: 6, gap: 6, alignItems: "center" },
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
});
