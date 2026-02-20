import {
  applyBoardLayout,
  applyBoardLayoutWithPinned,
  constrainSpanForCard,
  findBestInsertion,
  getCardSpanPresets,
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
      h: 2,
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
    expect(getCardSpanPresets("polaroid", 4)).toEqual([
      { w: 1, h: 2 },
      { w: 2, h: 2 },
    ]);
    expect(getCardSpanPresets("postcard", 4)).toEqual([
      { w: 2, h: 1 },
      { w: 2, h: 2 },
    ]);
  });
});
