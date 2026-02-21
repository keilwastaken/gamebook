import { by, device, element, expect as detoxExpect, waitFor } from "detox";
import { expect as jestExpect } from "@jest/globals";

type Frame = { x: number; y: number; width: number; height: number };

const SAME_SLOT_TOLERANCE_PX = 2;
const CROSS_PAGE_SAFE_Y_RATIO = 0.86;
const EXPO_DEV_URL = process.env.EXPO_DEV_URL;
const HOME_SCREEN_ID = "screen-home";
const ST = "seed-stardew";

function card(id: string) {
  return element(by.id(`playing-card-add-${id}`));
}

function isSameSlot(a: Frame, b: Frame, tolerance: number = SAME_SLOT_TOLERANCE_PX): boolean {
  return Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

async function launchFresh(): Promise<void> {
  if (EXPO_DEV_URL) {
    await device.launchApp({ newInstance: true, delete: true });
    await device.openURL({ url: EXPO_DEV_URL });
    return;
  }
  await device.launchApp({ newInstance: true, delete: true });
}

async function relaunchPreservingData(): Promise<void> {
  if (EXPO_DEV_URL) {
    await device.launchApp({ newInstance: true, delete: false });
    await device.openURL({ url: EXPO_DEV_URL });
    return;
  }
  await device.launchApp({ newInstance: true, delete: false });
}

async function getFrame(testId: string): Promise<Frame> {
  const attrs = await element(by.id(testId)).getAttributes();
  if (!("frame" in attrs) || !attrs.frame) {
    throw new Error(`Missing iOS frame for ${testId}`);
  }
  return attrs.frame as Frame;
}

async function waitForCardVisible(id: string, timeout = 6000): Promise<void> {
  await waitFor(card(id)).toBeVisible().withTimeout(timeout);
}

async function waitForAnyCardVisible(ids: readonly string[], timeoutPerCard = 1000): Promise<string> {
  for (const id of ids) {
    try {
      await waitForCardVisible(id, timeoutPerCard);
      return id;
    } catch {
      // Try next.
    }
  }
  throw new Error(`None of the cards became visible: ${ids.join(", ")}`);
}

async function openPageMenu(): Promise<void> {
  await element(by.id("home-page-menu-trigger")).tap();
}

async function goToPage(pageNumber: number): Promise<void> {
  await openPageMenu();
  const optionId = `home-page-option-${pageNumber}`;
  await waitFor(element(by.id(optionId))).toBeVisible().withTimeout(5000);
  await element(by.id(optionId)).tap();
}

async function createPageTwoAndReturnToPageOne(): Promise<void> {
  await openPageMenu();
  await element(by.id("home-page-create")).tap();
  await goToPage(1);
}

async function dragCardToEdge(
  id: string,
  direction: "left" | "right",
  yRatio: number,
  holdMs: number = 800
): Promise<void> {
  const homeScreen = element(by.id(HOME_SCREEN_ID));
  const xRatio = direction === "right" ? 0.99 : 0.01;
  await card(id).longPressAndDrag(1200, NaN, NaN, homeScreen, xRatio, yRatio, "slow", holdMs);
}

async function ratioYForCard(id: string): Promise<number> {
  const cardFrame = await getFrame(`playing-card-add-${id}`);
  const screenFrame = await getFrame(HOME_SCREEN_ID);
  const centerY = cardFrame.y + cardFrame.height / 2;
  return clamp((centerY - screenFrame.y) / screenFrame.height, 0.2, 0.95);
}

describe("Core board flows: Home board", () => {
  beforeEach(async () => {
    await launchFresh();
    await waitFor(element(by.id(HOME_SCREEN_ID))).toBeVisible().withTimeout(15000);
    await waitForCardVisible(ST);
  });

  it("rejects occupied drop on the same page", async () => {
    const occupiedTargetId = await waitForAnyCardVisible(["seed-hades", "seed-outerwilds"]);
    const initial = await getFrame(`playing-card-add-${ST}`);

    await card(ST).longPressAndDrag(
      1200,
      NaN,
      NaN,
      card(occupiedTargetId),
      NaN,
      NaN,
      "slow",
      0
    );

    const after = await getFrame(`playing-card-add-${ST}`);
    jestExpect(isSameSlot(after, initial)).toBe(true);
  });

  it("accepts empty-slot drop on the same page", async () => {
    const homeScreen = element(by.id(HOME_SCREEN_ID));
    const initial = await getFrame(`playing-card-add-${ST}`);

    await card(ST).longPressAndDrag(1200, NaN, NaN, homeScreen, 0.08, 0.84, "slow", 0);

    const after = await getFrame(`playing-card-add-${ST}`);
    jestExpect(isSameSlot(after, initial)).toBe(false);
    jestExpect(after.y).toBeGreaterThan(initial.y + 20);
  });

  it("moves card to the next page via right-edge drag", async () => {
    await createPageTwoAndReturnToPageOne();
    await waitForCardVisible(ST);

    await dragCardToEdge(ST, "right", CROSS_PAGE_SAFE_Y_RATIO, 900);
    await goToPage(1);
    await detoxExpect(card(ST)).toBeNotVisible();
    await goToPage(2);
    await waitForCardVisible(ST);
  });

  it("moves card back to the previous page via left-edge drag", async () => {
    await createPageTwoAndReturnToPageOne();
    await waitForCardVisible(ST);

    await dragCardToEdge(ST, "right", CROSS_PAGE_SAFE_Y_RATIO, 900);
    await goToPage(2);
    await waitForCardVisible(ST);

    await dragCardToEdge(ST, "left", CROSS_PAGE_SAFE_Y_RATIO, 1600);

    await goToPage(1);
    await waitForCardVisible(ST, 7000);
    await goToPage(2);
    await detoxExpect(card(ST)).toBeNotVisible();
  });

  it("rejects left-to-right cross-page drop when destination slot is occupied", async () => {
    await createPageTwoAndReturnToPageOne();
    await waitForCardVisible(ST);

    const blockerId = await waitForAnyCardVisible(["seed-outerwilds", "seed-hades"], 1500);
    const blockerStartYRatio = await ratioYForCard(blockerId);

    // Move blocker to page 2 near right edge.
    await dragCardToEdge(blockerId, "right", blockerStartYRatio, 800);
    await goToPage(2);
    await waitForCardVisible(blockerId);

    const blockerPageTwoYRatio = await ratioYForCard(blockerId);

    // Attempt to drop stardew into blocker slot from page 1 -> page 2.
    await goToPage(1);
    await waitForCardVisible(ST);
    await dragCardToEdge(ST, "right", blockerPageTwoYRatio, 950);

    // Verify stardew did not move pages.
    await goToPage(1);
    await waitForCardVisible(ST);
    await goToPage(2);
    await waitForCardVisible(blockerId);
    await detoxExpect(card(ST)).toBeNotVisible();
  });

  it("keeps cards re-draggable near bottom boundary after an edge drop", async () => {
    const homeScreen = element(by.id(HOME_SCREEN_ID));

    await card(ST).longPressAndDrag(1200, NaN, NaN, homeScreen, 0.10, 0.80, "slow", 0);
    await waitForCardVisible(ST);
    const first = await getFrame(`playing-card-add-${ST}`);

    await card(ST).longPressAndDrag(1200, NaN, NaN, homeScreen, 0.22, 0.74, "slow", 0);
    await waitForCardVisible(ST);
    const second = await getFrame(`playing-card-add-${ST}`);

    jestExpect(isSameSlot(first, second)).toBe(false);
  });

  it("persists cross-page placement after app relaunch", async () => {
    await createPageTwoAndReturnToPageOne();
    await waitForCardVisible(ST);

    await dragCardToEdge(ST, "right", 0.55, 800);
    await goToPage(2);
    await waitForCardVisible(ST);

    await relaunchPreservingData();
    await waitFor(element(by.id(HOME_SCREEN_ID))).toBeVisible().withTimeout(15000);

    await goToPage(2);
    await waitForCardVisible(ST);
    await goToPage(1);
    await detoxExpect(card(ST)).toBeNotVisible();
  });
});
