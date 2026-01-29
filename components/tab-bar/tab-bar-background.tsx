import { StyleSheet, View } from "react-native";
import Svg, { Defs, Image as SvgImage, Path, Pattern } from "react-native-svg";

import { palette } from "@/constants/palette";

const corkTexture = require("@/assets/images/cork-texture-blurred-tiny.jpg");

interface TabBarBackgroundProps {
  width: number;
  height: number;
  colorScheme: "light" | "dark";
}

// Creates the SVG path for the tab bar's curved shape.
const getTabBarPath = (width: number, height: number) => {
  const center = width / 2;
  const topY = 0;
  const dipHeight = 25;
  const curveStart = center - 75;
  const curveEnd = center + 75;
  const controlPointXOffset = 31;

  return `
    M 0 ${topY}
    L ${curveStart} ${topY}
    C ${center - controlPointXOffset},${topY} ${center - controlPointXOffset},${dipHeight} ${center},${dipHeight}
    C ${center + controlPointXOffset},${dipHeight} ${center + controlPointXOffset},${topY} ${curveEnd},${topY}
    L ${width} ${topY}
    L ${width} ${height}
    L 0 ${height}
    Z
  `;
};

export function TabBarBackground({
  width,
  height,
  colorScheme,
}: TabBarBackgroundProps) {
  const d = getTabBarPath(width, height);

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
          fillOpacity={colorScheme === "dark" ? 0.3 : 0.32}
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
