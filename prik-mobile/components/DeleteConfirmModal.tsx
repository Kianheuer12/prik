import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { useColors } from "../contexts/ThemeContext";

export function DeleteConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const colors = useColors();

  return (
    <Modal transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
              <Text style={[styles.title, { color: colors.text }]}>Delete reading?</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                This cannot be undone.
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={onCancel}
                >
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={onConfirm}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
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
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    width: "100%",
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  buttonRow: { flexDirection: "row", gap: 10 },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600" },
  deleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#EF4444",
    alignItems: "center",
  },
  deleteText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
