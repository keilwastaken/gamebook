import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from "react-native";

import { palette } from "@/constants/palette";

// Slight random rotation for organic, hand-placed feel (-2° to 2°)
const ROTATION_MIN = -2;
const ROTATION_MAX = 2;

function randomRotation(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return ROTATION_MIN + (x - Math.floor(x)) * (ROTATION_MAX - ROTATION_MIN);
}

export interface StickyNoteProps {
  children: React.ReactNode;
  /** Stable seed for deterministic rotation (e.g. index or id) */
  seed?: number;
  /** Optional custom rotation in degrees */
  rotation?: number;
  /** Paper color - warm cream tones */
  paperColor?: string;
  /** Show pushpin at top center */
  showPin?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function StickyNote({
  children,
  seed = 0,
  rotation: rotationOverride,
  paperColor = palette.cream.DEFAULT,
  showPin = true,
  style,
  textStyle,
}: StickyNoteProps) {
  const rotation = useMemo(
    () => rotationOverride ?? randomRotation(seed),
    [rotationOverride, seed]
  );

  return (
    <View style={[styles.wrapper, style]}>
      {showPin && (
        <View style={styles.pinContainer}>
          <View style={styles.pin} />
        </View>
      )}
      <View
        style={[
          styles.note,
          {
            backgroundColor: paperColor,
            transform: [{ rotate: `${rotation}deg` }],
          },
        ]}
      >
        {typeof children === "string" ? (
          <Text style={[styles.text, textStyle]}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "flex-start",
    alignItems: "center",
  },
  pinContainer: {
    position: "absolute",
    top: -8,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.clay[500],
    shadowColor: palette.sage[700],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 4,
  },
  note: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 20,
    minWidth: 120,
    minHeight: 80,
    borderRadius: 4,
    // Layered soft shadows - lifts off the cork
    shadowColor: palette.sage[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    // Secondary softer shadow for depth
    borderWidth: 1,
    borderColor: "rgba(68, 88, 57, 0.08)",
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.text.primary,
    fontFamily: "System",
  },
});
