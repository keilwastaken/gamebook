import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { palette } from "@/constants/palette";

import { CURVE_DEPTH, CURVE_WIDTH } from "./constants";

interface TabBarBackgroundProps {
  width: number;
  height: number;
  fillColor: string;
  colorScheme: "light" | "dark";
}

export function TabBarBackground({
  width,
  height,
  fillColor,
  colorScheme,
}: TabBarBackgroundProps) {
  // Generate the SVG path for the tab bar with a soft, organic "divot"
  const center = width / 2;
  const d = `
    M 0 0
    L ${center - CURVE_WIDTH / 2} 0
    Q ${center - CURVE_WIDTH / 4} 0 ${center - CURVE_WIDTH / 6} ${CURVE_DEPTH * 0.6}
    Q ${center} ${CURVE_DEPTH + 8} ${center + CURVE_WIDTH / 6} ${CURVE_DEPTH * 0.6}
    Q ${center + CURVE_WIDTH / 4} 0 ${center + CURVE_WIDTH / 2} 0
    L ${width} 0
    L ${width} ${height}
    L 0 ${height}
    Z
  `;

  return (
    <View
      style={{
        ...StyleSheet.absoluteFillObject,
        shadowColor: palette.sage[400],
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: -2 },
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <Svg width={width} height={height}>
        <Path
          d={d}
          fill={fillColor}
          stroke={colorScheme === "dark" ? palette.sage[700] : palette.sage[200]}
          strokeWidth={0.5}
        />
      </Svg>
    </View>
  );
}
