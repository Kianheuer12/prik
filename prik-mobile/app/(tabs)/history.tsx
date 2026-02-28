import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { api } from "../../convex/_generated/api";
import { Colors, getGlucoseColor, getGlucoseLabel } from "../../constants/colors";

export default function History() {
  const { user } = useUser();

  const readings = useQuery(
    api.readings.getReadingsForUser,
    user ? { userId: user.id } : "skip"
  );

  const grouped = readings?.reduce(
    (acc, r) => {
      const day = new Date(r.timestamp).toLocaleDateString("en-ZA", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      if (!acc[day]) acc[day] = [];
      acc[day].push(r);
      return acc;
    },
    {} as Record<string, typeof readings>
  ) ?? {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {Object.entries(grouped).map(([day, dayReadings]) => (
        <View key={day} style={styles.dayGroup}>
          <Text style={styles.dayLabel}>{day}</Text>
          {dayReadings!.map((r) => {
            const color = getGlucoseColor(r.value);
            const time = new Date(r.timestamp).toLocaleTimeString("en-ZA", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <View key={r._id} style={styles.row}>
                <View style={[styles.colorBar, { backgroundColor: color }]} />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTime}>{time}</Text>
                  <Text style={styles.rowType}>
                    {r.type === "fasted" ? "Fasted" : "Post-meal"}
                  </Text>
                  {r.notes ? (
                    <Text style={styles.rowNotes}>{r.notes}</Text>
                  ) : null}
                </View>
                <View style={styles.rowRight}>
                  <Text style={[styles.rowValue, { color }]}>
                    {r.value.toFixed(1)}
                  </Text>
                  <Text style={[styles.rowStatus, { color }]}>
                    {getGlucoseLabel(r.value)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}

      {readings?.length === 0 && (
        <Text style={styles.empty}>No readings logged yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  dayGroup: { marginBottom: 24 },
  dayLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  colorBar: { width: 5 },
  rowInfo: { flex: 1, padding: 12 },
  rowTime: { fontSize: 14, fontWeight: "600", color: Colors.text },
  rowType: { fontSize: 12, color: Colors.textSecondary },
  rowNotes: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  rowRight: { padding: 12, alignItems: "flex-end", justifyContent: "center" },
  rowValue: { fontSize: 20, fontWeight: "700" },
  rowStatus: { fontSize: 11 },
  empty: { color: Colors.textMuted, textAlign: "center", marginTop: 40 },
});
