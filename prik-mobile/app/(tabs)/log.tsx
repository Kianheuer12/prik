import { useUser } from "@clerk/clerk-expo";
import { useMutation, useAction } from "convex/react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform,
  Image, ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { readAsStringAsync } from "expo-file-system";
import { api } from "../../convex/_generated/api";
import { getGlucoseColor, getGlucoseLabel } from "../../constants/colors";
import { useColors } from "../../contexts/ThemeContext";
import type { MealAnalysis } from "../../convex/meals";

type ReadingType = "fasted" | "post-meal";
const MEAL_OFFSETS = ["30 min", "1 hr", "1.5 hrs", "2 hrs", "3 hrs"];

async function pickAndCompress(source: "camera" | "library"): Promise<{ uri: string; base64: string } | null> {
  const result = source === "camera"
    ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.9 })
    : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });

  if (result.canceled || !result.assets[0]) return null;

  const compressed = await ImageManipulator.manipulateAsync(
    result.assets[0].uri,
    [{ resize: { width: 800 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  const base64 = await readAsStringAsync(compressed.uri, {
    encoding: "base64",
  });

  return { uri: compressed.uri, base64 };
}

export default function LogReading() {
  const colors = useColors();
  const { user } = useUser();
  const addReading = useMutation(api.readings.addReading);
  const analyzeMeal = useAction(api.meals.analyzeMeal);
  const router = useRouter();

  const [value, setValue] = useState("");
  const [type, setType] = useState<ReadingType>("fasted");
  const [mealOffset, setMealOffset] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Meal analysis
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [showWeights, setShowWeights] = useState(false);
  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});
  const [recalculating, setRecalculating] = useState(false);

  const numericValue = parseFloat(value);
  const isValidValue = !isNaN(numericValue) && numericValue > 0 && numericValue < 50;

  function promptImageSource() {
    Alert.alert("Add Meal Photo", "Choose source", [
      { text: "Take Photo", onPress: () => handlePickImage("camera") },
      { text: "Choose from Library", onPress: () => handlePickImage("library") },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  async function handlePickImage(source: "camera" | "library") {
    const result = await pickAndCompress(source);
    if (!result) return;

    setPhotoUri(result.uri);
    setPhotoBase64(result.base64);
    setAnalysis(null);
    setShowWeights(false);
    setWeightInputs({});
    setAnalysing(true);
    try {
      const res = await analyzeMeal({ imageBase64: result.base64, mediaType: "image/jpeg" });
      setAnalysis(res);
      const w: Record<string, string> = {};
      res.items.forEach((item) => { w[item.name] = ""; });
      setWeightInputs(w);
    } catch (e) {
      Alert.alert("Analysis failed", e instanceof Error ? e.message : "Could not analyse photo");
    } finally {
      setAnalysing(false);
    }
  }

  async function handleRecalculate() {
    const weighted = Object.entries(weightInputs)
      .filter(([, w]) => w.trim() !== "" && !isNaN(parseFloat(w)))
      .map(([name, w]) => ({ name, weightG: parseFloat(w) }));
    if (weighted.length === 0) return;
    setRecalculating(true);
    try {
      const res = await analyzeMeal({ weightedItems: weighted });
      setAnalysis(res);
    } catch (e) {
      Alert.alert("Recalculation failed", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setRecalculating(false);
    }
  }

  function removePhoto() {
    setPhotoUri(null); setPhotoBase64(null);
    setAnalysis(null); setShowWeights(false); setWeightInputs({});
  }

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
        mealDescription: analysis?.description,
        estimatedCarbs: analysis?.totalCarbs,
        carbsConfidence: analysis?.confidence,
      });
      router.replace("/(tabs)/dashboard");
    } catch (err: unknown) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to save reading");
    } finally {
      setLoading(false);
    }
  }

  const confidenceColor: Record<string, string> = { high: "#22c55e", medium: "#f59e0b", low: "#ef4444" };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>

        {/* Glucose value */}
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

        {/* Reading type */}
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
              <Text style={[styles.typeButtonText, { color: colors.textSecondary }, type === t && { color: colors.primary, fontWeight: "700" }]}>
                {t === "fasted" ? "Fasted" : "Post-meal"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {type === "post-meal" && (
          <>
            {/* Meal offset */}
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
                  <Text style={[styles.offsetChipText, { color: colors.textSecondary }, mealOffset === o && { color: colors.primary, fontWeight: "600" }]}>
                    {o}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Meal analysis */}
            <Text style={[styles.label, { marginTop: 24, color: colors.textSecondary }]}>Meal analysis (optional)</Text>

            {!photoUri ? (
              <TouchableOpacity
                style={[styles.photoButton, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
                onPress={promptImageSource}
              >
                <Text style={[styles.photoButtonText, { color: colors.primary }]}>📷  Analyse Meal</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.analysisCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.thumbRow}>
                  <Image source={{ uri: photoUri }} style={styles.thumb} />
                  <TouchableOpacity onPress={removePhoto} style={styles.removeBtn}>
                    <Text style={styles.removeText}>✕ Remove</Text>
                  </TouchableOpacity>
                </View>

                {analysing ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Analysing meal...</Text>
                  </View>
                ) : analysis ? (
                  <>
                    <Text style={[styles.detectedLabel, { color: colors.textMuted }]}>Detected:</Text>
                    {analysis.items.map((item) => (
                      <View key={item.name} style={styles.itemRow}>
                        <Text style={[styles.itemName, { color: colors.text }]}>• {item.name}</Text>
                        <Text style={[styles.itemCarbs, { color: colors.textSecondary }]}>~{item.estimatedCarbs}g carbs</Text>
                      </View>
                    ))}
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.totalRow}>
                      <Text style={[styles.totalLabel, { color: colors.text }]}>~{analysis.totalCarbs}g carbs total</Text>
                      <Text style={[styles.confidence, { color: confidenceColor[analysis.confidence] ?? "#888" }]}>
                        {analysis.confidence} confidence
                      </Text>
                    </View>

                    <TouchableOpacity style={styles.weightToggle} onPress={() => setShowWeights(!showWeights)}>
                      <Text style={[styles.weightToggleText, { color: colors.primary }]}>
                        {showWeights ? "▲ Hide weights" : "▼ Add weights for exact count"}
                      </Text>
                    </TouchableOpacity>

                    {showWeights && (
                      <View style={styles.weightsSection}>
                        {analysis.items.map((item) => (
                          <View key={item.name} style={styles.weightRow}>
                            <Text style={[styles.weightLabel, { color: colors.text }]}>{item.name}</Text>
                            <TextInput
                              style={[styles.weightInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
                              placeholder="g"
                              placeholderTextColor={colors.textMuted}
                              keyboardType="numeric"
                              value={weightInputs[item.name] ?? ""}
                              onChangeText={(v) => setWeightInputs((prev) => ({ ...prev, [item.name]: v }))}
                            />
                          </View>
                        ))}
                        <TouchableOpacity
                          style={[styles.recalcBtn, { backgroundColor: colors.primary }, recalculating && { opacity: 0.5 }]}
                          onPress={handleRecalculate}
                          disabled={recalculating}
                        >
                          {recalculating
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={styles.recalcText}>Recalculate →</Text>
                          }
                        </TouchableOpacity>
                      </View>
                    )}
                    <Text style={[styles.disclaimer, { color: colors.textMuted }]}>* Estimates only — not medical advice</Text>
                  </>
                ) : null}
              </View>
            )}
          </>
        )}

        {/* Notes */}
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
          style={[styles.button, { backgroundColor: colors.primary }, (!isValidValue || loading) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!isValidValue || loading}
        >
          <Text style={styles.buttonText}>{loading ? "Saving..." : "Save Reading"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 100 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  valueInput: { borderWidth: 2, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 18, fontSize: 32, fontWeight: "700", textAlign: "center" },
  statusBadge: { textAlign: "center", marginTop: 8, fontSize: 15, fontWeight: "600" },
  typeRow: { flexDirection: "row", gap: 10 },
  typeButton: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  typeButtonText: { fontSize: 15, fontWeight: "500" },
  offsetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  offsetChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  offsetChipText: { fontSize: 14, fontWeight: "500" },
  photoButton: { borderWidth: 1.5, borderStyle: "dashed", borderRadius: 14, paddingVertical: 18, alignItems: "center" },
  photoButtonText: { fontSize: 16, fontWeight: "600" },
  analysisCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  thumbRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  thumb: { width: 72, height: 72, borderRadius: 10 },
  removeBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  removeText: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  loadingText: { fontSize: 14 },
  detectedLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemName: { fontSize: 14 },
  itemCarbs: { fontSize: 13 },
  divider: { height: 1, marginVertical: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 15, fontWeight: "700" },
  confidence: { fontSize: 12, fontWeight: "600" },
  weightToggle: { paddingVertical: 4 },
  weightToggleText: { fontSize: 13, fontWeight: "600" },
  weightsSection: { gap: 8 },
  weightRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  weightLabel: { fontSize: 14, flex: 1 },
  weightInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, width: 80, textAlign: "right", fontSize: 14 },
  recalcBtn: { borderRadius: 10, paddingVertical: 10, alignItems: "center", marginTop: 4 },
  recalcText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  disclaimer: { fontSize: 11, marginTop: 4 },
  notesInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, textAlignVertical: "top", minHeight: 90 },
  button: { borderRadius: 14, paddingVertical: 18, alignItems: "center", marginTop: 32 },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
