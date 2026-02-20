import { StyleSheet, View } from "react-native";

import { palette } from "@/constants/palette";

export type GridCellPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export const GRID_ACTIVE_TOP_LEFT: readonly GridCellPosition[] = ["top-left"];
export const GRID_ACTIVE_TOP_RIGHT: readonly GridCellPosition[] = ["top-right"];
export const GRID_ACTIVE_BOTTOM_LEFT: readonly GridCellPosition[] = ["bottom-left"];
export const GRID_ACTIVE_BOTTOM_RIGHT: readonly GridCellPosition[] = ["bottom-right"];
export const GRID_ACTIVE_TOP_ROW: readonly GridCellPosition[] = [
  "top-left",
  "top-right",
];
export const GRID_ACTIVE_BOTTOM_ROW: readonly GridCellPosition[] = [
  "bottom-left",
  "bottom-right",
];
export const GRID_ACTIVE_LEFT_COLUMN: readonly GridCellPosition[] = [
  "top-left",
  "bottom-left",
];
export const GRID_ACTIVE_RIGHT_COLUMN: readonly GridCellPosition[] = [
  "top-right",
  "bottom-right",
];
export const GRID_ACTIVE_FULL_GRID: readonly GridCellPosition[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

export const GRID_2X2_PERMUTATIONS = {
  TOP_LEFT: GRID_ACTIVE_TOP_LEFT,
  TOP_RIGHT: GRID_ACTIVE_TOP_RIGHT,
  BOTTOM_LEFT: GRID_ACTIVE_BOTTOM_LEFT,
  BOTTOM_RIGHT: GRID_ACTIVE_BOTTOM_RIGHT,
  TOP_ROW: GRID_ACTIVE_TOP_ROW,
  BOTTOM_ROW: GRID_ACTIVE_BOTTOM_ROW,
  LEFT_COLUMN: GRID_ACTIVE_LEFT_COLUMN,
  RIGHT_COLUMN: GRID_ACTIVE_RIGHT_COLUMN,
  FULL_GRID: GRID_ACTIVE_FULL_GRID,
} as const;

const CELL_ORDER: readonly GridCellPosition[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

interface GridGlyphProps {
  activePositions: readonly GridCellPosition[];
  selected: boolean;
}

export function GridGlyph({ activePositions, selected }: GridGlyphProps) {
  const active = new Set(activePositions);

  return (
    <View style={styles.spanGlyph}>
      {CELL_ORDER.map((position) => (
        <View
          key={`glyph-${position}`}
          style={[
            styles.spanGlyphCell,
            active.has(position) && styles.spanGlyphCellFilled,
            active.has(position) && selected && styles.spanGlyphCellSelected,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  spanGlyph: {
    width: 18,
    height: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  spanGlyphCell: {
    width: 8,
    height: 8,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: palette.sage[300],
    backgroundColor: "transparent",
  },
  spanGlyphCellFilled: {
    backgroundColor: palette.sage[300],
  },
  spanGlyphCellSelected: {
    borderColor: palette.sage[500],
    backgroundColor: palette.sage[500],
  },
});
