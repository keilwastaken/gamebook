import { StyleSheet, View } from "react-native";
import Svg, { Defs, Image as SvgImage, Path, Pattern } from "react-native-svg";

import { palette } from "@/constants/palette";

import { CURVE_DEPTH, CURVE_WIDTH } from "./constants";

const corkTexture = require("@/assets/images/cork-texture.png");

interface TabBarBackgroundProps {
  width: number;
  height: number;
  fillColor: string;
  colorScheme: "light" | "dark";
}

// The "Enhanced Slope" Generator
const getTabPath = (width: number, height: number) => {
  const center = width / 2;
  const topY = 20;
  const dipHeight = 45; // Deeper dip
  const curveStart = center - 75; // Wider curve
  const curveEnd = center + 75; // Wider curve
  const cornerRadius = 16;
  const controlPointXOffset = 31; // Adjusted control point for a smooth slope

  return `
    M 0 ${topY + cornerRadius}
    Q 0 ${topY}, ${cornerRadius} ${topY}
    L ${curveStart} ${topY}
    C ${center - controlPointXOffset},${topY} ${center - controlPointXOffset},${dipHeight} ${center},${dipHeight}
    C ${center + controlPointXOffset},${dipHeight} ${center + controlPointXOffset},${topY} ${curveEnd},${topY}
    L ${width - cornerRadius} ${topY}
    Q ${width} ${topY}, ${width} ${topY + cornerRadius}
    L ${width} ${height}
    L 0 ${height}
    Z
  `;
};

export function TabBarBackground({
  width,
  height,
  fillColor,
  colorScheme,
}: TabBarBackgroundProps) {
  const d = getTabPath(width, height);

  // Texture tile size
  const TILE_SIZE = 256;

  return (
    <View
      style={{
        ...StyleSheet.absoluteFillObject,
        shadowColor: palette.sage[600],
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: -6 },
        shadowRadius: 18,
        elevation: 10,
      }}
    >
      <Svg width={width} height={height}>
        <Defs>
          <Pattern
            id="corkTexture"
            patternUnits="userSpaceOnUse"
            width={TILE_SIZE}
            height={TILE_SIZE}
          >
            <SvgImage
              href={corkTexture}
              x="0"
              y="0"
              width={TILE_SIZE}
              height={TILE_SIZE}
              preserveAspectRatio="xMidYMid slice"
            />
          </Pattern>
        </Defs>

        {/* Layer 1: Warm cork base color */}
        <Path
          d={d}
          fill={colorScheme === "dark" ? palette.warm[400] : palette.warm[200]}
        />

        {/* Layer 2: Cork texture clipped to the path */}
        <Path
          d={d}
          fill="url(#corkTexture)"
          fillOpacity={colorScheme === "dark" ? 0.15 : 0.25}
        />

        {/* Layer 3: Subtle stroke */}
        <Path
          d={d}
          fill="none"
          stroke={
            colorScheme === "dark" ? palette.sage[700] : palette.warm[300]
          }
          strokeWidth={0.5}
        />
      </Svg>
    </View>
  );
}
