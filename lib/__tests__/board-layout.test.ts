import {
  applyBoardLayout,
  constrainSpanForCard,
  findBestInsertion,
  getAxisIntentSpan,
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

  it("constrains extreme aspect spans while allowing up to 2x2", () => {
    expect(constrainSpanForCard("polaroid", { w: 4, h: 1 }, 4)).toMatchObject({
      w: 2,
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
});
