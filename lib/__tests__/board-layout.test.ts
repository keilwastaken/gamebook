import {
  ALL_GRID_SIZE_IDS,
  applyBoardLayout,
  applyBoardLayoutWithPinned,
  constrainSpanForCard,
  getAllowedGridSizeIds,
  getCardSpan,
  getCardSpanPresets,
  getEffectiveCardSpan,
  getAxisIntentSpan,
  getHoverZone,
} from "../board-layout";
import type { Game } from "../types";

const BASE_GAMES: Game[] = [
  { id: "polaroid", title: "Polaroid", ticketType: "polaroid", status: "playing", notes: [] },
  { id: "postcard", title: "Postcard", ticketType: "postcard", status: "playing", notes: [] },
  { id: "widget", title: "Widget", ticketType: "widget", status: "playing", notes: [] },
  { id: "ticket", title: "Ticket", ticketType: "ticket", status: "playing", notes: [] },
  { id: "minimal", title: "Minimal", ticketType: "minimal", status: "playing", notes: [] },
];

// Regression contract: these cases guard production drag/drop placement behavior.
describe("[dragdrop-regression] board-layout", () => {
  it("defines grid size ids for every size from 1x1 to 4x4", () => {
    expect(ALL_GRID_SIZE_IDS).toHaveLength(16);
    expect(ALL_GRID_SIZE_IDS[0]).toBe("1x1");
    expect(ALL_GRID_SIZE_IDS).toContain("4x4");
  });

  it("maps ticket types to allowed grid sizes", () => {
    expect(getAllowedGridSizeIds("polaroid")).toEqual(["1x1", "2x1", "1x2", "2x2"]);
    expect(getAllowedGridSizeIds("postcard")).toEqual(["2x1", "2x2"]);
    expect(getAllowedGridSizeIds("minimal")).toEqual(["1x1", "2x1", "1x2", "2x2"]);
    expect(getAllowedGridSizeIds("widget")).toEqual(["1x1", "2x1", "1x2", "2x2"]);
  });

  it("uses 1x1 defaults when ticket type is missing", () => {
    expect(getAllowedGridSizeIds(undefined)).toEqual(["1x1"]);
    expect(getCardSpan(undefined)).toEqual({ w: 1, h: 1 });
  });

  it("clamps axis intent span by configured cap", () => {
    expect(getAxisIntentSpan(0, 100, 4)).toBe(4);
    expect(getAxisIntentSpan(0, 100, 2)).toBe(2);
    expect(getAxisIntentSpan(50, 100, 4)).toBe(1);
  });

  it("constrains legacy spans to type presets", () => {
    expect(constrainSpanForCard("polaroid", { w: 4, h: 1 }, 4)).toMatchObject({
      w: 1,
      h: 1,
    });
    expect(constrainSpanForCard("postcard", { w: 4, h: 4 }, 4)).toMatchObject({
      w: 2,
      h: 2,
    });
  });

  it("enforces minimum occupied area from base card span", () => {
    expect(constrainSpanForCard("postcard", { w: 1, h: 1 }, 4)).toMatchObject({
      w: 2,
      h: 1,
    });
  });

  it("preserves explicit preset selections when exact", () => {
    expect(constrainSpanForCard("polaroid", { w: 2, h: 2 }, 4)).toMatchObject({
      w: 2,
      h: 2,
    });
  });

  it("computes edge and middle hover zones", () => {
    expect(getHoverZone(0.03, 0.5)).toBe("left");
    expect(getHoverZone(0.97, 0.5)).toBe("right");
    expect(getHoverZone(0.5, 0.04)).toBe("top");
    expect(getHoverZone(0.5, 0.96)).toBe("bottom");
    expect(getHoverZone(0.5, 0.5)).toBe("middle");
  });

  it("pins a moved card at an explicit slot and reflows others around it", () => {
    const laidOut = applyBoardLayout(BASE_GAMES, 4);
    const pinned = applyBoardLayoutWithPinned(
      laidOut,
      "postcard",
      { x: 2, y: 3, w: 2, h: 1 },
      4
    );
    const moved = pinned.find((g) => g.id === "postcard");

    expect(moved?.board).toMatchObject({ x: 2, y: 3, w: 2, h: 1 });
  });

  it("exposes preset options by card type", () => {
    const polaroidPresets = getCardSpanPresets("polaroid", 4);
    expect(polaroidPresets).toEqual([
      { w: 1, h: 1 },
      { w: 2, h: 1 },
      { w: 1, h: 2 },
      { w: 2, h: 2 },
    ]);
    expect(getCardSpanPresets("postcard", 4)).toEqual([
      { w: 2, h: 1 },
      { w: 2, h: 2 },
    ]);
  });

  it("falls back to 1x1 presets when columns hide all allowed widths", () => {
    expect(getCardSpanPresets("postcard", 1)).toEqual([{ w: 1, h: 1 }]);
    expect(getCardSpanPresets("postcard", 0)).toEqual([{ w: 1, h: 1 }]);
  });

  it("clamps effective card spans before applying ticket constraints", () => {
    const game = {
      id: "g-oversized",
      title: "Oversized",
      ticketType: "polaroid",
      status: "playing",
      notes: [],
      board: { x: 0, y: 0, w: 9, h: 9, columns: 9 },
    } as const satisfies Game;

    expect(getEffectiveCardSpan(game, 2)).toEqual({ w: 2, h: 2 });
  });

  it("falls back to regular layout when pinned game id is missing", () => {
    const laidOut = applyBoardLayout(BASE_GAMES, 4);
    const pinned = applyBoardLayoutWithPinned(
      laidOut,
      "unknown-id",
      { x: 2, y: 2, w: 2, h: 2 },
      4
    );
    expect(pinned).toEqual(applyBoardLayout(laidOut, 4));
  });

  it("uses existing board when placement lookup misses due unstable id reads", () => {
    const reads: string[] = [];
    const unstable = {
      title: "Unstable",
      status: "playing",
      notes: [],
      board: { x: 9, y: 9, w: 1, h: 1, columns: 4 },
      get id() {
        const value = reads.length < 2 ? "unstable-a" : "unstable-miss";
        reads.push(value);
        return value;
      },
    } as unknown as Game;

    const pinned = applyBoardLayoutWithPinned(
      [
        { id: "pin", title: "Pin", ticketType: "polaroid", status: "playing", notes: [] },
        unstable,
      ],
      "pin",
      { x: 0, y: 0, w: 1, h: 1 },
      4
    );

    const unstableResult = pinned.find((game) => game.title === "Unstable");
    expect(unstableResult?.board).toEqual({ x: 9, y: 9, w: 1, h: 1, columns: 4 });
  });

  it("handles default and all threshold branches for axis intent span", () => {
    expect(getAxisIntentSpan(0, 100)).toBe(4);
    expect(getAxisIntentSpan(3, 100, 4)).toBe(3);
    expect(getAxisIntentSpan(7, 100, 4)).toBe(2);
    expect(getAxisIntentSpan(50, 100, 4)).toBe(1);
    expect(getAxisIntentSpan(10, 0, 4)).toBe(1);
  });

  it("clamps hover inputs and threshold bounds", () => {
    expect(getHoverZone(-2, 0.5, 0.001)).toBe("left");
    expect(getHoverZone(2, 0.5, 0.9)).toBe("right");
    expect(getHoverZone(0.5, -3, 0.001)).toBe("top");
    expect(getHoverZone(0.5, 3, 0.9)).toBe("bottom");
  });
});
