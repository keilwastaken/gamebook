import { getAxisIntentSpan, getCardSpanPresets } from "../board-layout";
import type { TicketType } from "../types";

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
