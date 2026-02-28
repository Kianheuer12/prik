import { useWindowDimensions, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

type Reading = { timestamp: number; value: number; type: string };

function getColor(val: number) {
  if (val < 4.0) return "#7B5EA7";
  if (val <= 7.8) return "#4CAF50";
  if (val <= 10.0) return "#F59E0B";
  return "#EF4444";
}

export function GlucoseChart({ readings }: { readings: Reading[] }) {
  const { width } = useWindowDimensions();
  const sorted = [...readings].sort((a, b) => a.timestamp - b.timestamp);

  const data = sorted.map((r, i) => {
    const showLabel = sorted.length <= 5 || i === 0 || i === sorted.length - 1;
    return {
      value: r.value,
      dataPointColor: getColor(r.value),
      label: showLabel
        ? new Date(r.timestamp).toLocaleDateString("en-ZA", {
            weekday: "short",
            day: "numeric",
          })
        : "",
    };
  });

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
        yAxisTextStyle={{ color: "#94a3b8", fontSize: 10 }}
        xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 9 }}
        showReferenceLine1={true}
        referenceLine1Position={7.8}
        referenceLine1Config={{
          color: "#4CAF50",
          type: "dashed",
          dashWidth: 4,
          dashGap: 4,
          thickness: 1,
        }}
        showReferenceLine2={true}
        referenceLine2Position={4.0}
        referenceLine2Config={{
          color: "#4CAF50",
          type: "dashed",
          dashWidth: 4,
          dashGap: 4,
          thickness: 1,
        }}
        initialSpacing={10}
        spacing={Math.max(20, (width - 120) / Math.max(data.length - 1, 1))}
        hideRules
        yAxisColor="transparent"
        xAxisColor="#e2e8f0"
      />
    </View>
  );
}
