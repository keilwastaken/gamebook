import { by, device, element, expect } from "detox";

describe("Smoke: Tab Navigation", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it("shows the home screen on launch", async () => {
    await expect(element(by.id("screen-home"))).toBeVisible();
  });

  it("navigates to library tab", async () => {
    await element(by.id("tab-library")).tap();
    await expect(element(by.id("screen-library"))).toBeVisible();
  });

  it("navigates to favorites tab", async () => {
    await element(by.id("tab-favorites")).tap();
    await expect(element(by.id("screen-favorites"))).toBeVisible();
  });

  it("navigates to profile tab", async () => {
    await element(by.id("tab-profile")).tap();
    await expect(element(by.id("screen-profile"))).toBeVisible();
  });

  it("navigates back to home tab", async () => {
    await element(by.id("tab-index")).tap();
    await expect(element(by.id("screen-home"))).toBeVisible();
  });
});
