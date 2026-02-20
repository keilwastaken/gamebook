import {
  ALL_GRID_SIZE_IDS,
  applyBoardLayout,
  applyBoardLayoutWithPinned,
  constrainSpanForCard,
  findBestInsertion,
  getAllowedGridSizeIds,
  getCardSpan,
  getCardSpanPresets,
  getEffectiveCardSpan,
  getAxisIntentSpan,
  getHoverZone,
  previewInsertionAtIndex,
} from "../board-layout";
import type { Game } from "../types";

const BASE_GAMES: Game[] = [
  { id: "polaroid", title: "Polaroid", ticketType: "polaroid", status: "playing", notes: [] },
  { id: "postcard", title: "Postcard", ticketType: "postcard", status: "playing", notes: [] },
  { id: "widget", title: "Widget", ticketType: "widget", status: "playing", notes: [] },
  { id: "ticket", title: "Ticket", ticketType: "ticket", status: "playing", notes: [] },
  { id: "minimal", title: "Minimal", ticketType: "minimal", status: "playing", notes: [] },
];

describe("board-layout", () => {
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

  it.each(["polaroid", "postcard", "widget", "ticket", "minimal"] as const)(
    "findBestInsertion can move %s card to top-left",
    (id) => {
      const laidOut = applyBoardLayout(BASE_GAMES, 4);
      const result = findBestInsertion(laidOut, id, 0, 0, 4);

      expect(result.insertionIndex).toBe(0);
      expect(result.target.x).toBe(0);
      expect(result.target.y).toBe(0);
    }
  );

  it("produces a valid target for wide postcard in lower board rows", () => {
    const laidOut = applyBoardLayout(BASE_GAMES, 4);
    const result = findBestInsertion(laidOut, "postcard", 3, 4, 4);

    expect(result.target.w).toBe(2);
    expect(result.target.x).toBeLessThanOrEqual(2);
    expect(result.target.y).toBeGreaterThanOrEqual(0);
  });

  it("applies span overrides for push/reflow placement", () => {
    const laidOut = applyBoardLayout(BASE_GAMES, 4);
    const result = findBestInsertion(laidOut, "minimal", 0, 0, 4, { w: 2, h: 2 });

    expect(result.insertionIndex).toBe(0);
    expect(result.target).toMatchObject({ x: 0, y: 0, w: 2, h: 2 });
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

  it("previews insertion at an explicit index for deterministic zone hover", () => {
    const laidOut = applyBoardLayout(BASE_GAMES, 4);
    const hoveredIndex = laidOut.findIndex((g) => g.id === "postcard");
    const result = previewInsertionAtIndex(laidOut, "minimal", hoveredIndex, 4, {
      w: 2,
      h: 2,
    });

    expect(result.insertionIndex).toBe(hoveredIndex);
    expect(result.target.w).toBe(2);
    expect(result.target.h).toBe(2);
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

  it("returns deterministic fallback when preview is requested for missing game id", () => {
    const preview = previewInsertionAtIndex(BASE_GAMES, "missing", 2, 4, { w: 2, h: 2 });
    expect(preview).toEqual({
      insertionIndex: 0,
      target: { x: 0, y: 0, w: 1, h: 1 },
    });
  });

  it("clamps preview insertion index and applies span overrides without existing board", () => {
    const preview = previewInsertionAtIndex(BASE_GAMES, "postcard", 999, 4, { w: 2, h: 2 });
    expect(preview.insertionIndex).toBe(BASE_GAMES.length - 1);
    expect(preview.target).toMatchObject({ w: 2, h: 2 });
  });

  it("falls back to a default preview target when moving id mutates during layout", () => {
    let readCount = 0;
    const unstable = {
      title: "Shifting",
      status: "playing",
      notes: [],
      get id() {
        readCount += 1;
        if (readCount <= 2) return "moving";
        return "moving-mutated";
      },
    } as unknown as Game;

    const preview = previewInsertionAtIndex([unstable], "moving", 0, 4);
    expect(preview).toEqual({
      insertionIndex: 0,
      target: { x: 0, y: 0, w: 1, h: 1 },
    });
  });

  it("returns deterministic fallback when best insertion is requested for missing id", () => {
    expect(findBestInsertion(BASE_GAMES, "missing", 1, 1, 4)).toEqual({
      insertionIndex: 0,
      target: { x: 0, y: 0, w: 1, h: 1 },
    });
  });

  it("uses default desired span when card has no board", () => {
    const result = findBestInsertion(BASE_GAMES, "polaroid", 0, 0, 4);
    expect(result.target).toMatchObject({ w: 1, h: 1 });
  });

  it("applies span override using default board shape when finding best insertion", () => {
    const result = findBestInsertion(BASE_GAMES, "postcard", 1, 0, 4, { w: 2, h: 2 });
    expect(result.target).toMatchObject({ w: 2, h: 2 });
  });

  it("chooses a deterministic insertion index for symmetric placements", () => {
    const mirrored: Game[] = [
      { id: "moving", title: "Moving", ticketType: "polaroid", status: "playing", notes: [] },
      {
        id: "left",
        title: "Left",
        ticketType: "polaroid",
        status: "playing",
        notes: [],
        board: { x: 0, y: 0, w: 1, h: 1, columns: 4 },
      },
      {
        id: "right",
        title: "Right",
        ticketType: "polaroid",
        status: "playing",
        notes: [],
        board: { x: 2, y: 0, w: 1, h: 1, columns: 4 },
      },
    ];
    const laidOut = applyBoardLayout(mirrored, 4);
    const result = findBestInsertion(laidOut, "moving", 1, 0, 4);
    expect(result.insertionIndex).toBe(1);
  });

  it("returns the defensive fallback when candidate scan loop cannot run", () => {
    const pathologicalGames = {
      find: () => ({
        id: "moving",
        title: "Moving",
        status: "playing",
        notes: [],
      }),
      filter: () => ({ length: -1 }),
    } as unknown as Game[];

    const result = findBestInsertion(pathologicalGames, "moving", 0, 0, 4);
    expect(result).toEqual({
      insertionIndex: 0,
      target: { x: 0, y: 0, w: 1, h: 1 },
    });
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
