import { useUser } from "@clerk/clerk-expo";
import { useMutation } from "convex/react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { api } from "../../convex/_generated/api";
import { Colors, getGlucoseColor, getGlucoseLabel } from "../../constants/colors";

type ReadingType = "fasted" | "post-meal";

const MEAL_OFFSETS = ["30 min", "1 hr", "1.5 hrs", "2 hrs", "3 hrs"];

export default function LogReading() {
  const { user } = useUser();
  const addReading = useMutation(api.readings.addReading);
  const router = useRouter();

  const [value, setValue] = useState("");
  const [type, setType] = useState<ReadingType>("fasted");
  const [mealOffset, setMealOffset] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const numericValue = parseFloat(value);
  const isValidValue = !isNaN(numericValue) && numericValue > 0 && numericValue < 50;

  async function handleSubmit() {
    if (!user || !isValidValue) return;
    setLoading(true);
    try {
      await addReading({
        userId: user.id,
        value: numericValue,
        timestamp: Date.now(),
        type,
        mealOffset: type === "post-meal" ? mealOffset : undefined,
        notes: notes.trim() || undefined,
      });
      router.replace("/(tabs)/dashboard");
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to save reading");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Glucose (mmol/L)</Text>
        <TextInput
          style={[
            styles.valueInput,
            isValidValue && { borderColor: getGlucoseColor(numericValue) },
          ]}
          placeholder="e.g. 5.4"
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
        />

        {isValidValue && (
          <Text style={[styles.statusBadge, { color: getGlucoseColor(numericValue) }]}>
            {getGlucoseLabel(numericValue)} · {numericValue.toFixed(1)} mmol/L
          </Text>
        )}

        <Text style={[styles.label, { marginTop: 24 }]}>Reading type</Text>
        <View style={styles.typeRow}>
          {(["fasted", "post-meal"] as ReadingType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeButton, type === t && styles.typeButtonActive]}
              onPress={() => setType(t)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === t && styles.typeButtonTextActive,
                ]}
              >
                {t === "fasted" ? "Fasted" : "Post-meal"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Meal offset — only for post-meal */}
        {type === "post-meal" && (
          <>
            <Text style={[styles.label, { marginTop: 24 }]}>Time after meal</Text>
            <View style={styles.offsetRow}>
              {MEAL_OFFSETS.map((o) => (
                <TouchableOpacity
                  key={o}
                  style={[styles.offsetChip, mealOffset === o && styles.offsetChipActive]}
                  onPress={() => setMealOffset(mealOffset === o ? undefined : o)}
                >
                  <Text
                    style={[
                      styles.offsetChipText,
                      mealOffset === o && styles.offsetChipTextActive,
                    ]}
                  >
                    {o}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={[styles.label, { marginTop: 24 }]}>Notes (optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="e.g. after lunch, felt dizzy..."
          placeholderTextColor={Colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.button, (!isValidValue || loading) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!isValidValue || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Saving..." : "Save Reading"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  valueInput: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 32,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  statusBadge: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 15,
    fontWeight: "600",
  },
  typeRow: { flexDirection: "row", gap: 10 },
  typeButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  typeButtonText: { fontSize: 15, color: Colors.textSecondary, fontWeight: "500" },
  typeButtonTextActive: { color: Colors.primary, fontWeight: "700" },
  offsetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  offsetChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  offsetChipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  offsetChipText: { fontSize: 14, color: Colors.textSecondary, fontWeight: "500" },
  offsetChipTextActive: { color: Colors.primary, fontWeight: "600" },
  notesInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    textAlignVertical: "top",
    minHeight: 90,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 32,
  },
  buttonDisabled: { backgroundColor: Colors.border },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
