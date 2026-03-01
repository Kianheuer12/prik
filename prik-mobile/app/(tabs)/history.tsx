import { useUser } from "@clerk/clerk-expo";
import { useMutation, usePaginatedQuery } from "convex/react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { getGlucoseColor, getGlucoseLabel } from "../../constants/colors";
import { useColors } from "../../contexts/ThemeContext";
import { EditReadingModal, type EditableReading } from "../../components/EditReadingModal";
import { DeleteConfirmModal } from "../../components/DeleteConfirmModal";

const PAGE_SIZE = 20;

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

  return (
    <Animated.View
      style={[{ backgroundColor: colors.border, borderRadius: 12, marginBottom: 6 }, style, { opacity }]}
    />
  );
}

function HistorySkeleton() {
  const colors = useColors();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
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
  const colors = useColors();
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
        <TouchableOpacity
          style={[styles.editAction, { backgroundColor: colors.primary }]}
          onPress={onEdit}
        >
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
      <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.colorBar, { backgroundColor: color }]} />
        <View style={styles.rowInfo}>
          <Text style={[styles.rowType, { color: colors.text }]}>
            {type === "fasted" ? "Fasted" : "Post-meal"}
          </Text>
          <Text style={[styles.rowTime, { color: colors.textSecondary }]}>
            {time}
            {type === "post-meal" && mealOffset ? ` · ${mealOffset} after meal` : ""}
          </Text>
          {notes ? <Text style={[styles.rowNotes, { color: colors.textMuted }]}>{notes}</Text> : null}
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
  const colors = useColors();
  const { user } = useUser();

  const { results, status, loadMore } = usePaginatedQuery(
    api.readings.getReadingsPage,
    user ? { userId: user.id } : "skip",
    { initialNumItems: PAGE_SIZE }
  );

  const deleteReading = useMutation(api.readings.deleteReading);
  const [editingReading, setEditingReading] = useState<EditableReading | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!user || status === "LoadingFirstPage") return <HistorySkeleton />;

  const grouped: Record<string, typeof results> = {};
  for (const r of results) {
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
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.heading, { color: colors.text }]}>History</Text>

        {results.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>No readings logged yet.</Text>
        ) : (
          Object.entries(grouped).map(([day, dayReadings]) => (
            <View key={day} style={styles.dayGroup}>
              <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{day}</Text>
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

        {status === "CanLoadMore" && (
          <TouchableOpacity
            style={[styles.loadMore, { borderColor: colors.border }]}
            onPress={() => loadMore(PAGE_SIZE)}
          >
            <Text style={[styles.loadMoreText, { color: colors.textSecondary }]}>Load more</Text>
          </TouchableOpacity>
        )}
        {status === "LoadingMore" && (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },

  heading: { fontSize: 24, fontWeight: "700", marginBottom: 20 },
  empty: { textAlign: "center", marginTop: 40 },

  dayGroup: { marginBottom: 24 },
  dayLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    overflow: "hidden",
  },
  colorBar: { width: 5, alignSelf: "stretch" },
  rowInfo: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  rowType: { fontSize: 14, fontWeight: "500" },
  rowTime: { fontSize: 12, marginTop: 1 },
  rowNotes: { fontSize: 12, marginTop: 2 },
  rowRight: { paddingHorizontal: 14, alignItems: "flex-end", justifyContent: "center" },
  rowValue: { fontSize: 20, fontWeight: "700" },
  rowStatus: { fontSize: 11 },

  swipeActions: { flexDirection: "row", marginBottom: 6, gap: 6, alignItems: "center" },
  editAction: {
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

  loadMore: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  loadMoreText: { fontSize: 14, fontWeight: "600" },
});
