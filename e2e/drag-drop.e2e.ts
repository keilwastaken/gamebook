import { by, device, element, expect as detoxExpect } from "detox";
import { expect as jestExpect } from "@jest/globals";

const CARD_IDS = [
  "seed-stardew",
  "seed-spiritfarer",
  "seed-hades",
  "seed-celeste",
  "seed-outerwilds",
] as const;

type CardId = (typeof CARD_IDS)[number];
type Frame = { x: number; y: number; width: number; height: number };
type FrameMap = Record<CardId, Frame>;

const SLOT_TOLERANCE_PX = 2;

function cardHandle(id: CardId) {
  return element(by.id(`playing-card-add-${id}`));
}

function isSameSlot(a: Frame, b: Frame, tolerance: number = SLOT_TOLERANCE_PX): boolean {
  return Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance;
}

function countMovedCards(before: FrameMap, after: FrameMap): number {
  return CARD_IDS.filter((id) => !isSameSlot(before[id], after[id])).length;
}

function assertUniqueAnchors(frames: FrameMap) {
  const anchors = CARD_IDS.map((id) => `${Math.round(frames[id].x)}:${Math.round(frames[id].y)}`);
  jestExpect(new Set(anchors).size).toBe(CARD_IDS.length);
}

async function getFrame(id: CardId): Promise<Frame> {
  const attrs = await cardHandle(id).getAttributes();
  if (!("frame" in attrs) || !attrs.frame) {
    throw new Error(`Missing iOS frame attributes for ${id}`);
  }
  return attrs.frame as Frame;
}

async function getAllFrames(): Promise<FrameMap> {
  const frames = {} as FrameMap;
  for (const id of CARD_IDS) {
    frames[id] = await getFrame(id);
  }
  return frames;
}

async function dragToCard(sourceId: CardId, targetId: CardId): Promise<void> {
  const source = cardHandle(sourceId);
  const target = cardHandle(targetId);
  await source.longPressAndDrag(1200, NaN, NaN, target, NaN, NaN, "slow", 0);
}

describe("Drag and Drop: Home board", () => {
  beforeAll(async () => {
    const expoDevUrl = process.env.EXPO_DEV_URL;
    if (expoDevUrl) {
      await device.launchApp({ newInstance: true, delete: true });
      await device.openURL({ url: expoDevUrl });
      return;
    }
    await device.launchApp({ newInstance: true, delete: true });
  });

  it("supports multi-card drag and drop reflow across the board", async () => {
    await detoxExpect(element(by.id("screen-home"))).toBeVisible();
    for (const id of ["seed-stardew", "seed-spiritfarer", "seed-hades"] as const) {
      await detoxExpect(cardHandle(id)).toBeVisible();
    }

    const initial = await getAllFrames();
    jestExpect(initial["seed-spiritfarer"].width).toBeGreaterThan(initial["seed-stardew"].width);
    assertUniqueAnchors(initial);

    // Step 1: 1x1 -> 1x1 swap pressure (Stardew moves into Hades' prior slot).
    const hadesSlotStep1 = initial["seed-hades"];
    await dragToCard("seed-stardew", "seed-hades");
    const afterStep1 = await getAllFrames();
    jestExpect(isSameSlot(afterStep1["seed-stardew"], hadesSlotStep1)).toBe(true);
    jestExpect(isSameSlot(afterStep1["seed-hades"], hadesSlotStep1)).toBe(false);
    jestExpect(countMovedCards(initial, afterStep1)).toBeGreaterThanOrEqual(2);
    assertUniqueAnchors(afterStep1);

    // Step 2: 2x1 -> 1x1 pressure; source moves and board reflows.
    const spiritfarerSlotBeforeStep2 = afterStep1["seed-spiritfarer"];
    await dragToCard("seed-spiritfarer", "seed-stardew");
    const afterStep2 = await getAllFrames();
    jestExpect(isSameSlot(afterStep2["seed-spiritfarer"], spiritfarerSlotBeforeStep2)).toBe(false);
    jestExpect(countMovedCards(afterStep1, afterStep2)).toBeGreaterThanOrEqual(2);
    assertUniqueAnchors(afterStep2);

    // Step 3: another 1x1 operation to validate chained board reflow.
    const stardewSlotBeforeStep3 = afterStep2["seed-stardew"];
    await dragToCard("seed-stardew", "seed-hades");
    const afterStep3 = await getAllFrames();
    jestExpect(isSameSlot(afterStep3["seed-stardew"], stardewSlotBeforeStep3)).toBe(false);
    jestExpect(countMovedCards(afterStep2, afterStep3)).toBeGreaterThanOrEqual(2);
    assertUniqueAnchors(afterStep3);
  });
});
