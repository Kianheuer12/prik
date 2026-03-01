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
import { getGlucoseColor, getGlucoseLabel } from "../../constants/colors";
import { useColors } from "../../contexts/ThemeContext";

type ReadingType = "fasted" | "post-meal";

const MEAL_OFFSETS = ["30 min", "1 hr", "1.5 hrs", "2 hrs", "3 hrs"];

export default function LogReading() {
  const colors = useColors();
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
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Glucose (mmol/L)</Text>
        <TextInput
          style={[
            styles.valueInput,
            { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
            isValidValue && { borderColor: getGlucoseColor(numericValue), color: getGlucoseColor(numericValue) },
          ]}
          placeholder="e.g. 5.4"
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
        />

        {isValidValue && (
          <Text style={[styles.statusBadge, { color: getGlucoseColor(numericValue) }]}>
            {getGlucoseLabel(numericValue)} · {numericValue.toFixed(1)} mmol/L
          </Text>
        )}

        <Text style={[styles.label, { marginTop: 24, color: colors.textSecondary }]}>Reading type</Text>
        <View style={styles.typeRow}>
          {(["fasted", "post-meal"] as ReadingType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
                type === t && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
              ]}
              onPress={() => setType(t)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: colors.textSecondary },
                  type === t && { color: colors.primary, fontWeight: "700" },
                ]}
              >
                {t === "fasted" ? "Fasted" : "Post-meal"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {type === "post-meal" && (
          <>
            <Text style={[styles.label, { marginTop: 24, color: colors.textSecondary }]}>Time after meal</Text>
            <View style={styles.offsetRow}>
              {MEAL_OFFSETS.map((o) => (
                <TouchableOpacity
                  key={o}
                  style={[
                    styles.offsetChip,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                    mealOffset === o && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                  ]}
                  onPress={() => setMealOffset(mealOffset === o ? undefined : o)}
                >
                  <Text
                    style={[
                      styles.offsetChipText,
                      { color: colors.textSecondary },
                      mealOffset === o && { color: colors.primary, fontWeight: "600" },
                    ]}
                  >
                    {o}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={[styles.label, { marginTop: 24, color: colors.textSecondary }]}>Notes (optional)</Text>
        <TextInput
          style={[styles.notesInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="e.g. after lunch, felt dizzy..."
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            (!isValidValue || loading) && styles.buttonDisabled,
          ]}
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
  content: { padding: 20, paddingBottom: 100 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  valueInput: {
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  statusBadge: { textAlign: "center", marginTop: 8, fontSize: 15, fontWeight: "600" },
  typeRow: { flexDirection: "row", gap: 10 },
  typeButton: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  typeButtonText: { fontSize: 15, fontWeight: "500" },
  offsetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  offsetChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  offsetChipText: { fontSize: 14, fontWeight: "500" },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    textAlignVertical: "top",
    minHeight: 90,
  },
  button: { borderRadius: 14, paddingVertical: 18, alignItems: "center", marginTop: 32 },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
