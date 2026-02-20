import { randomRotation } from "../random-rotation";

describe("randomRotation", () => {
  it("is deterministic for the same seed and bounds", () => {
    expect(randomRotation(7, -2, 2)).toBe(randomRotation(7, -2, 2));
  });

  it("stays within default range", () => {
    const value = randomRotation(13);
    expect(value).toBeGreaterThanOrEqual(-2);
    expect(value).toBeLessThanOrEqual(2);
  });

  it("supports custom min/max bounds", () => {
    const value = randomRotation(21, 10, 20);
    expect(value).toBeGreaterThanOrEqual(10);
    expect(value).toBeLessThanOrEqual(20);
  });
});
