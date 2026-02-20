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

describe("Add Flow: Form validation", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it("opens Add from center button and shows form fields", async () => {
    await element(by.id("center-button-add")).tap();
    await expect(element(by.id("screen-add"))).toBeVisible();
    await expect(element(by.id("add-title-input"))).toBeVisible();
    await expect(element(by.id("add-where-input"))).toBeVisible();
    await expect(element(by.id("add-save-button"))).toBeVisible();
  });

  it("tapping save with empty fields keeps user on Add screen", async () => {
    await element(by.id("center-button-add")).tap();
    await expect(element(by.id("add-save-button"))).toBeVisible();
    await element(by.id("add-save-button")).tap();
    await expect(element(by.id("screen-add"))).toBeVisible();
  });
});

describe("Add Flow: Save and return home", () => {
  const NEW_GAME_TITLE = "E2E Test Game";
  const NEW_GAME_NOTE = "Just finished the first boss";

  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it("fills form, saves, navigates to Home, and card appears with lastNote", async () => {
    await element(by.id("center-button-add")).tap();
    await expect(element(by.id("screen-add"))).toBeVisible();

    await element(by.id("add-title-input")).typeText(NEW_GAME_TITLE);
    await element(by.id("add-where-input")).typeText(NEW_GAME_NOTE);

    await expect(element(by.id("add-save-button"))).toBeVisible();
    await element(by.id("add-save-button")).tap();

    await expect(element(by.id("screen-home"))).toBeVisible();
    await expect(element(by.text(NEW_GAME_TITLE))).toBeVisible();
    await expect(element(by.text(NEW_GAME_NOTE))).toBeVisible();
  });
});
