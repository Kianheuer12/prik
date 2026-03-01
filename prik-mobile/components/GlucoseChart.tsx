import { useWindowDimensions, View, Text, StyleSheet } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useColors } from "../contexts/ThemeContext";

type Reading = { timestamp: number; value: number; type: string };

function getColor(val: number) {
  if (val < 4.0) return "#7B5EA7";
  if (val <= 7.8) return "#4CAF50";
  if (val <= 10.0) return "#F59E0B";
  return "#EF4444";
}

export function GlucoseChart({ readings }: { readings: Reading[] }) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const sorted = [...readings].sort((a, b) => a.timestamp - b.timestamp);

  // Show a label every N points so they don't crowd the axis
  const step = sorted.length <= 5 ? 1 : Math.ceil(sorted.length / 5);

  const data = sorted.map((r, i) => ({
    value: r.value,
    dataPointColor: getColor(r.value),
    timestamp: r.timestamp,
    label:
      i % step === 0 || i === sorted.length - 1
        ? new Date(r.timestamp).toLocaleDateString("en-ZA", {
            day: "numeric",
            month: "short",
          })
        : "",
  }));

  return (
    <View style={{ paddingRight: 8 }}>
      <LineChart
        data={data}
        height={150}
        width={width - 88}
        maxValue={25}
        noOfSections={5}
        color="#2E86AB"
        thickness={2}
        dataPointsRadius={5}
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9 }}
        showReferenceLine1
        referenceLine1Position={7.8}
        referenceLine1Config={{ color: "#4CAF50", type: "dashed", dashWidth: 4, dashGap: 4, thickness: 1 }}
        showReferenceLine2
        referenceLine2Position={4.0}
        referenceLine2Config={{ color: "#4CAF50", type: "dashed", dashWidth: 4, dashGap: 4, thickness: 1 }}
        initialSpacing={10}
        spacing={Math.max(24, (width - 120) / Math.max(data.length - 1, 1))}
        hideRules
        yAxisColor="transparent"
        xAxisColor={colors.border}
        pointerConfig={{
          showPointerStrip: true,
          pointerStripColor: colors.border,
          pointerStripWidth: 1,
          pointerStripHeight: 150,
          pointer1Color: colors.primary,
          activatePointersOnLongPress: false,
          autoAdjustPointerLabelPosition: true,
          pointerLabelWidth: 110,
          pointerLabelHeight: 52,
          pointerLabelComponent: (items: { value: number; timestamp: number }[]) => {
            const item = items[0];
            if (!item) return <View />;
            const color = getColor(item.value);
            const dateStr = new Date(item.timestamp).toLocaleDateString("en-ZA", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
            return (
              <View
                style={[
                  styles.tooltip,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.tooltipValue, { color }]}>
                  {item.value.toFixed(1)} mmol/L
                </Text>
                <Text style={[styles.tooltipDate, { color: colors.textSecondary }]}>{dateStr}</Text>
              </View>
            );
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    borderRadius: 10,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
  },
  tooltipValue: { fontSize: 13, fontWeight: "700" },
  tooltipDate: { fontSize: 10, marginTop: 2 },
});
