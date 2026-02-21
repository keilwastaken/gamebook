import { by, device, element, expect as detoxExpect, waitFor } from "detox";
import { expect as jestExpect } from "@jest/globals";

type Frame = { x: number; y: number; width: number; height: number };

const BLOCKER_CANDIDATES = [
  "seed-celeste",
  "seed-outerwilds",
  "seed-hades",
  "seed-spiritfarer",
] as const;

async function getFrame(testId: string): Promise<Frame> {
  const attrs = await element(by.id(testId)).getAttributes();
  if (!("frame" in attrs) || !attrs.frame) {
    throw new Error(`Missing iOS frame for ${testId}`);
  }
  return attrs.frame as Frame;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

async function findVisibleBlockerId(): Promise<string> {
  for (const id of BLOCKER_CANDIDATES) {
    const card = element(by.id(`playing-card-add-${id}`));
    try {
      await waitFor(card).toBeVisible().withTimeout(1000);
      return id;
    } catch {
      // Try next candidate.
    }
  }
  throw new Error(`Could not find a visible blocker card from: ${BLOCKER_CANDIDATES.join(", ")}`);
}

describe("Cross-page conflict: Home board", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  it("rejects right-to-left cross-page drop when hovering an occupied lower-row slot", async () => {
    const pageMenuTrigger = element(by.id("home-page-menu-trigger"));
    const homeScreen = element(by.id("screen-home"));
    const stardewCard = element(by.id("playing-card-add-seed-stardew"));
    const spiritfarerCard = element(by.id("playing-card-add-seed-spiritfarer"));

    await waitFor(homeScreen).toBeVisible().withTimeout(15000);
    await waitFor(stardewCard).toBeVisible().withTimeout(5000);
    const blockerId = await findVisibleBlockerId();
    const blockerCard = element(by.id(`playing-card-add-${blockerId}`));
    await waitFor(blockerCard).toBeVisible().withTimeout(5000);

    const blockerInitial = await getFrame(`playing-card-add-${blockerId}`);

    // Push blocker toward a lower row near the left edge.
    await blockerCard.longPressAndDrag(1200, NaN, NaN, homeScreen, 0.05, 0.80, "slow", 0);
    const blockerAfter = await getFrame(`playing-card-add-${blockerId}`);
    jestExpect(blockerAfter.y).toBeGreaterThanOrEqual(blockerInitial.y);

    const screenFrame = await getFrame("screen-home");
    const blockerCenterY = blockerAfter.y + blockerAfter.height / 2;
    const targetRatioY = clamp((blockerCenterY - screenFrame.y) / screenFrame.height, 0.2, 0.95);

    // Create page 2 and return to page 1.
    await pageMenuTrigger.tap();
    await element(by.id("home-page-create")).tap();
    await pageMenuTrigger.tap();
    await waitFor(element(by.id("home-page-option-2"))).toBeVisible().withTimeout(5000);
    await element(by.id("home-page-option-1")).tap();
    await waitFor(stardewCard).toBeVisible().withTimeout(5000);

    // Move stardew to page 2 from page 1.
    await stardewCard.longPressAndDrag(1200, NaN, NaN, homeScreen, 0.99, 0.55, "slow", 800);
    await waitFor(element(by.text("1 game | Page 2 of 2"))).toBeVisible().withTimeout(5000);

    // Attempt moving stardew back left onto occupied lower-row blocker slot.
    await stardewCard.longPressAndDrag(1200, NaN, NaN, homeScreen, 0.04, targetRatioY, "slow", 900);

    // Verify move was rejected: stardew should still be on page 2.
    await pageMenuTrigger.tap();
    await element(by.id("home-page-option-1")).tap();
    await waitFor(spiritfarerCard).toBeVisible().withTimeout(5000);
    await waitFor(blockerCard).toBeVisible().withTimeout(5000);
    await detoxExpect(stardewCard).toBeNotVisible();

    await pageMenuTrigger.tap();
    await element(by.id("home-page-option-2")).tap();
    await waitFor(stardewCard).toBeVisible().withTimeout(5000);
  });
});
