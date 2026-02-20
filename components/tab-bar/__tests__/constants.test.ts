import { TABS, TAB_BAR_HEIGHT_RATIO, ICON_SIZE_RATIO } from "../constants";

describe("tab-bar constants", () => {
  it("defines exactly 5 tabs", () => {
    expect(TABS).toHaveLength(5);
  });

  it("has exactly one center tab (the add button)", () => {
    const centerTabs = TABS.filter((t) => t.isCenter);
    expect(centerTabs).toHaveLength(1);
    expect(centerTabs[0].name).toBe("add");
  });

  it("every tab has a name, label, and icon", () => {
    for (const tab of TABS) {
      expect(tab.name).toBeTruthy();
      expect(tab.label).toBeTruthy();
      expect(tab.icon).toBeDefined();
    }
  });

  it("ratios are positive fractions", () => {
    expect(TAB_BAR_HEIGHT_RATIO).toBeGreaterThan(0);
    expect(TAB_BAR_HEIGHT_RATIO).toBeLessThan(1);
    expect(ICON_SIZE_RATIO).toBeGreaterThan(0);
    expect(ICON_SIZE_RATIO).toBeLessThan(1);
  });
});
