import { applyBoardLayout, findBestInsertion } from "../board-layout";
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
});
