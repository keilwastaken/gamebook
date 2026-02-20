import { formatShortDate } from "../date-format";

describe("formatShortDate", () => {
  it("formats using the environment short-date formatter", () => {
    const ts = Date.UTC(2024, 0, 15, 12, 0, 0);
    const expected = new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
    }).format(new Date(ts));
    expect(formatShortDate(ts)).toBe(expected);
  });

  it("handles epoch timestamp", () => {
    expect(typeof formatShortDate(0)).toBe("string");
    expect(formatShortDate(0).length).toBeGreaterThan(0);
  });
});
