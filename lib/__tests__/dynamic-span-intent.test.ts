import {
  applyBoardLayout,
  findBestInsertion,
  getAxisIntentSpan,
  getCardSpanPresets,
} from "../board-layout";
import type { Game, TicketType } from "../types";

const BASE_GAMES: Game[] = [
  { id: "polaroid", title: "Polaroid", ticketType: "polaroid", status: "playing", notes: [] },
  { id: "postcard", title: "Postcard", ticketType: "postcard", status: "playing", notes: [] },
  { id: "widget", title: "Widget", ticketType: "widget", status: "playing", notes: [] },
  { id: "ticket", title: "Ticket", ticketType: "ticket", status: "playing", notes: [] },
  { id: "minimal", title: "Minimal", ticketType: "minimal", status: "playing", notes: [] },
];

function maxAllowedWidth(ticketType: TicketType, columns: number): number {
  return Math.max(...getCardSpanPresets(ticketType, columns).map((preset) => preset.w));
}

describe("dynamic span intent boundaries", () => {
  it("uses inclusive threshold boundaries for 4/3/2/1 span intent near a grid line", () => {
    const stride = 100;

    expect(getAxisIntentSpan(0, stride, 4)).toBe(4);
    expect(getAxisIntentSpan(1.5, stride, 4)).toBe(4);
    expect(getAxisIntentSpan(1.5001, stride, 4)).toBe(3);
    expect(getAxisIntentSpan(3.5, stride, 4)).toBe(3);
    expect(getAxisIntentSpan(3.5001, stride, 4)).toBe(2);
    expect(getAxisIntentSpan(7.5, stride, 4)).toBe(2);
    expect(getAxisIntentSpan(7.5001, stride, 4)).toBe(1);
  });

  it("detects intent symmetrically on both sides of each column boundary", () => {
    const stride = 100;
    const boundary = 2 * stride;

    expect(getAxisIntentSpan(boundary - 3, stride, 4)).toBe(3);
    expect(getAxisIntentSpan(boundary + 3, stride, 4)).toBe(3);
    expect(getAxisIntentSpan(boundary - 7, stride, 4)).toBe(2);
    expect(getAxisIntentSpan(boundary + 7, stride, 4)).toBe(2);
  });

  it("caps intent width by per-card allowed presets and available columns", () => {
    const nearBoundaryPointer = 0;

    const polaroidCap = maxAllowedWidth("polaroid", 4);
    expect(getAxisIntentSpan(nearBoundaryPointer, 100, polaroidCap)).toBe(2);

    const postcardCap = maxAllowedWidth("postcard", 4);
    expect(getAxisIntentSpan(nearBoundaryPointer, 100, postcardCap)).toBe(2);

    const oneColumnCap = maxAllowedWidth("minimal", 1);
    expect(oneColumnCap).toBe(1);
    expect(getAxisIntentSpan(nearBoundaryPointer, 100, oneColumnCap)).toBe(1);
  });

  it("falls back to 1x intent when stride is invalid", () => {
    expect(getAxisIntentSpan(10, 0, 4)).toBe(1);
    expect(getAxisIntentSpan(10, -100, 4)).toBe(1);
  });
});

describe("dynamic span intent + insertion contract", () => {
  it("applies a widened span override when pointer is near a column boundary", () => {
    const laidOut = applyBoardLayout(BASE_GAMES, 4);
    const intendedW = getAxisIntentSpan(0, 100, maxAllowedWidth("minimal", 4));

    const result = findBestInsertion(laidOut, "minimal", 1, 0, 4, {
      w: intendedW,
      h: 1,
    });

    expect(intendedW).toBe(2);
    expect(result.target.w).toBe(2);
    expect(result.target.x).toBeLessThanOrEqual(2);
  });

  it("keeps 1x width when pointer is far from any column boundary", () => {
    const laidOut = applyBoardLayout(BASE_GAMES, 4);
    const intendedW = getAxisIntentSpan(50, 100, maxAllowedWidth("minimal", 4));

    const result = findBestInsertion(laidOut, "minimal", 1, 0, 4, {
      w: intendedW,
      h: 1,
    });

    expect(intendedW).toBe(1);
    expect(result.target.w).toBe(1);
  });

  it("does not violate card-type minimum span constraints when intent suggests 1x", () => {
    const laidOut = applyBoardLayout(BASE_GAMES, 4);
    const intendedW = getAxisIntentSpan(50, 100, maxAllowedWidth("ticket", 4));

    const result = findBestInsertion(laidOut, "ticket", 1, 0, 4, {
      w: intendedW,
      h: 1,
    });

    expect(intendedW).toBe(1);
    expect(result.target.w).toBe(2);
  });
});
