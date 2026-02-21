import {
  BOARD_MAX_WIDTH,
  BOARD_MIN_WIDTH,
  BOARD_SIDE_PADDING,
  getBoardMetrics,
  getBoardScrollBottomPadding,
  getBoardWidth,
} from "../metrics";

describe("board metrics", () => {
  it("clamps board width within min and max bounds", () => {
    expect(getBoardWidth(120)).toBe(BOARD_MIN_WIDTH);
    expect(getBoardWidth(2200)).toBe(BOARD_MAX_WIDTH);
  });

  it("computes cell and row metrics from board width and columns", () => {
    const metrics = getBoardMetrics(360, 4);
    const expectedWidth = Math.max(BOARD_MIN_WIDTH, 360 - BOARD_SIDE_PADDING * 2);

    expect(metrics.boardWidth).toBe(expectedWidth);
    expect(metrics.columns).toBe(4);
    expect(metrics.cellWidth).toBeGreaterThan(0);
    expect(metrics.rowHeight).toBeGreaterThan(metrics.cellWidth);
  });

  it("includes tab bar and safe area in bottom padding", () => {
    const noInset = getBoardScrollBottomPadding(390, 0);
    const withInset = getBoardScrollBottomPadding(390, 34);

    expect(withInset).toBeGreaterThan(noInset);
  });
});
