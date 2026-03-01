import Svg, { Path, Text as SvgText } from "react-native-svg";

/**
 * Prik logo — blood drop + wordmark.
 * height prop controls size; width is computed from the 195×56 viewBox ratio.
 */
export function PrikLogo({ height = 32, color = "#2E86AB" }: { height?: number; color?: string }) {
  const width = (195 / 56) * height;
  return (
    <Svg width={width} height={height} viewBox="0 0 195 56">
      {/* Blood drop */}
      <Path
        d="M28 6 C38 16 44 28 44 40 A16 16 0 0 1 12 40 C12 28 18 16 28 6 Z"
        fill={color}
      />
      {/* Wordmark */}
      <SvgText
        x="56"
        y="46"
        fontWeight="900"
        fontSize={44}
        letterSpacing={-1}
        fill={color}
      >
        Prik
      </SvgText>
    </Svg>
  );
}
