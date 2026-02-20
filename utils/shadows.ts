import { StyleSheet } from "react-native";

const WARM_SHADOW_COLOR = "#2A1B38"; // Deep plum/navy instead of harsh black

export const CozyShadows = StyleSheet.create({
  base: {
    shadowColor: WARM_SHADOW_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  liftedBottom: {
    // Simulates a sticky note curling up at the bottom
    shadowColor: WARM_SHADOW_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  micro: {
    // Sharp, tiny shadows for small physical items like pushpins
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
});
