import { by, device, element, expect as detoxExpect, waitFor } from "detox";

describe("Cross-page drag: Home board", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it("moves a card from page 1 to page 2 by dragging near the right edge", async () => {
    const pageMenuTrigger = element(by.id("home-page-menu-trigger"));
    const stardewCard = element(by.id("playing-card-add-seed-stardew"));
    const spiritfarerCard = element(by.id("playing-card-add-seed-spiritfarer"));
    const homeScreen = element(by.id("screen-home"));

    await waitFor(homeScreen).toBeVisible().withTimeout(15000);
    await waitFor(stardewCard).toBeVisible().withTimeout(5000);

    // Create page 2 and return to page 1.
    await pageMenuTrigger.tap();
    await element(by.id("home-page-create")).tap();

    await pageMenuTrigger.tap();
    await waitFor(element(by.id("home-page-option-2"))).toBeVisible().withTimeout(5000);
    await element(by.id("home-page-option-1")).tap();
    await waitFor(stardewCard).toBeVisible().withTimeout(5000);

    // Drag card to the right edge to trigger cross-page move.
    await stardewCard.longPressAndDrag(1200, NaN, NaN, homeScreen, 0.99, 0.55, "slow", 800);
    await waitFor(element(by.text("1 game | Page 2 of 2"))).toBeVisible().withTimeout(5000);

    // Verify card moved off page 1...
    await pageMenuTrigger.tap();
    await element(by.id("home-page-option-1")).tap();
    await waitFor(spiritfarerCard).toBeVisible().withTimeout(5000);
    await detoxExpect(stardewCard).toBeNotVisible();

    // ...and is present on page 2.
    await pageMenuTrigger.tap();
    await element(by.id("home-page-option-2")).tap();
    await waitFor(stardewCard).toBeVisible().withTimeout(5000);
  });
});
