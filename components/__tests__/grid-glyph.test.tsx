import {
  GRID_2X2_PERMUTATIONS,
  GRID_ACTIVE_BOTTOM_LEFT,
  GRID_ACTIVE_BOTTOM_RIGHT,
  GRID_ACTIVE_BOTTOM_ROW,
  GRID_ACTIVE_FULL_GRID,
  GRID_ACTIVE_LEFT_COLUMN,
  GRID_ACTIVE_RIGHT_COLUMN,
  GRID_ACTIVE_TOP_LEFT,
  GRID_ACTIVE_TOP_RIGHT,
  GRID_ACTIVE_TOP_ROW,
} from "@/components/ui/grid-glyph";

describe("GridGlyph permutations", () => {
  it("defines all named 2x2 position constants", () => {
    expect(GRID_ACTIVE_TOP_LEFT).toEqual(["top-left"]);
    expect(GRID_ACTIVE_TOP_RIGHT).toEqual(["top-right"]);
    expect(GRID_ACTIVE_BOTTOM_LEFT).toEqual(["bottom-left"]);
    expect(GRID_ACTIVE_BOTTOM_RIGHT).toEqual(["bottom-right"]);
    expect(GRID_ACTIVE_TOP_ROW).toEqual(["top-left", "top-right"]);
    expect(GRID_ACTIVE_BOTTOM_ROW).toEqual(["bottom-left", "bottom-right"]);
    expect(GRID_ACTIVE_LEFT_COLUMN).toEqual(["top-left", "bottom-left"]);
    expect(GRID_ACTIVE_RIGHT_COLUMN).toEqual(["top-right", "bottom-right"]);
    expect(GRID_ACTIVE_FULL_GRID).toEqual([
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
    ]);
  });

  it("exposes permutation constants as a selection map", () => {
    expect(Object.keys(GRID_2X2_PERMUTATIONS)).toEqual([
      "TOP_LEFT",
      "TOP_RIGHT",
      "BOTTOM_LEFT",
      "BOTTOM_RIGHT",
      "TOP_ROW",
      "BOTTOM_ROW",
      "LEFT_COLUMN",
      "RIGHT_COLUMN",
      "FULL_GRID",
    ]);
  });
});
