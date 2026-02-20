import { by, device, element, expect } from "detox";

describe("Add Flow: Center Button", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it("opens the add screen when center button is tapped", async () => {
    await element(by.id("center-button-add")).tap();
    await expect(element(by.id("screen-add"))).toBeVisible();
  });

  it("returns to previous tab after leaving add", async () => {
    await element(by.id("tab-index")).tap();
    await expect(element(by.id("screen-home"))).toBeVisible();
  });
});
