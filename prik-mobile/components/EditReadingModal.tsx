import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Colors, getGlucoseColor, getGlucoseLabel } from "../constants/colors";

type ReadingType = "fasted" | "post-meal";

export type EditableReading = {
  _id: string;
  value: number;
  type: string;
  mealOffset?: string;
  notes?: string;
};

const MEAL_OFFSETS = ["30 min", "1 hr", "1.5 hrs", "2 hrs", "3 hrs"];

export function EditReadingModal({
  reading,
  onClose,
}: {
  reading: EditableReading;
  onClose: () => void;
}) {
  const updateReading = useMutation(api.readings.updateReading);
  const [value, setValue] = useState(reading.value.toFixed(1));
  const [type, setType] = useState<ReadingType>(reading.type as ReadingType);
  const [mealOffset, setMealOffset] = useState<string | undefined>(reading.mealOffset);
  const [notes, setNotes] = useState(reading.notes ?? "");
  const [loading, setLoading] = useState(false);

  const numericValue = parseFloat(value);
  const isValid = !isNaN(numericValue) && numericValue > 0 && numericValue < 50;
  const borderColor = isValid ? getGlucoseColor(numericValue) : Colors.border;

  async function handleSave() {
    if (!isValid) return;
    setLoading(true);
    try {
      await updateReading({
        id: reading._id as Id<"readings">,
        value: numericValue,
        type,
        mealOffset: type === "post-meal" ? mealOffset : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch {
      // silent — could add Alert here
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.title}>Edit Reading</Text>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Value */}
                <Text style={styles.label}>Glucose (mmol/L)</Text>
                <TextInput
                  style={[styles.valueInput, { borderColor }]}
                  value={value}
                  onChangeText={setValue}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
                {isValid && (
                  <Text style={[styles.statusBadge, { color: getGlucoseColor(numericValue) }]}>
                    {getGlucoseLabel(numericValue)} · {numericValue.toFixed(1)} mmol/L
                  </Text>
                )}

                {/* Type */}
                <Text style={[styles.label, { marginTop: 20 }]}>Type</Text>
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

                {/* Meal offset */}
                {type === "post-meal" && (
                  <>
                    <Text style={[styles.label, { marginTop: 20 }]}>Time after meal</Text>
                    <View style={styles.offsetRow}>
                      {MEAL_OFFSETS.map((o) => (
                        <TouchableOpacity
                          key={o}
                          style={[
                            styles.offsetChip,
                            mealOffset === o && styles.offsetChipActive,
                          ]}
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

                {/* Notes */}
                <Text style={[styles.label, { marginTop: 20 }]}>Notes (optional)</Text>
                <TextInput
                  style={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={Colors.textMuted}
                  placeholder="e.g. after lunch..."
                />

                {/* Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, (!isValid || loading) && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={!isValid || loading}
                  >
                    <Text style={styles.saveText}>{loading ? "Saving..." : "Save"}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
    maxHeight: "88%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: "700", color: Colors.text, marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  valueInput: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  statusBadge: { textAlign: "center", marginTop: 6, fontSize: 14, fontWeight: "600" },
  typeRow: { flexDirection: "row", gap: 10 },
  typeButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  typeButtonActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  typeButtonText: { fontSize: 14, color: Colors.textSecondary, fontWeight: "500" },
  typeButtonTextActive: { color: Colors.primary, fontWeight: "700" },
  offsetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  offsetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  offsetChipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  offsetChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: "500" },
  offsetChipTextActive: { color: Colors.primary, fontWeight: "600" },
  notesInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    textAlignVertical: "top",
    minHeight: 80,
  },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 24 },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
  },
  saveButtonDisabled: { backgroundColor: Colors.border },
  saveText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
