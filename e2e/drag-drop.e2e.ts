import { by, device, element, expect as detoxExpect } from "detox";

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
  expect(new Set(anchors).size).toBe(CARD_IDS.length);
}

async function getFrame(id: CardId): Promise<Frame> {
  const attrs = await cardHandle(id).getAttributes();
  if (!("frame" in attrs) || !attrs.frame) {
    throw new Error(`Missing iOS frame attributes for ${id}`);
  }
  return attrs.frame as Frame;
}

async function getAllFrames(): Promise<FrameMap> {
  const entries = await Promise.all(CARD_IDS.map(async (id) => [id, await getFrame(id)] as const));
  return Object.fromEntries(entries) as FrameMap;
}

async function dragToCard(sourceId: CardId, targetId: CardId): Promise<void> {
  const source = cardHandle(sourceId);
  const target = cardHandle(targetId);
  await detoxExpect(source).toBeVisible();
  await detoxExpect(target).toBeVisible();
  await source.longPressAndDrag(1200, NaN, NaN, target, NaN, NaN, "slow", 0);
}

describe("Drag and Drop: Home board", () => {
  beforeAll(async () => {
    const expoDevUrl = process.env.EXPO_DEV_URL;
    if (expoDevUrl) {
      await device.launchApp({ newInstance: true });
      await device.openURL({ url: expoDevUrl });
      return;
    }
    await device.launchApp({ newInstance: true });
  });

  it("supports multi-card drag and drop reflow across the board", async () => {
    await detoxExpect(element(by.id("screen-home"))).toBeVisible();
    for (const id of CARD_IDS) {
      await detoxExpect(cardHandle(id)).toBeVisible();
    }

    const initial = await getAllFrames();
    expect(initial["seed-spiritfarer"].width).toBeGreaterThan(initial["seed-stardew"].width);
    expect(initial["seed-celeste"].width).toBeGreaterThan(initial["seed-hades"].width);
    assertUniqueAnchors(initial);

    // Step 1: 1x1 -> 1x1 swap pressure (Stardew moves into Hades' prior slot).
    const hadesSlotStep1 = initial["seed-hades"];
    await dragToCard("seed-stardew", "seed-hades");
    const afterStep1 = await getAllFrames();
    expect(isSameSlot(afterStep1["seed-stardew"], hadesSlotStep1)).toBe(true);
    expect(isSameSlot(afterStep1["seed-hades"], hadesSlotStep1)).toBe(false);
    expect(countMovedCards(initial, afterStep1)).toBeGreaterThanOrEqual(2);
    assertUniqueAnchors(afterStep1);

    // Step 2: 2x1 -> 2x1 swap pressure (Celeste moves into Spiritfarer's prior slot).
    const spiritfarerSlotStep2 = afterStep1["seed-spiritfarer"];
    await dragToCard("seed-celeste", "seed-spiritfarer");
    const afterStep2 = await getAllFrames();
    expect(isSameSlot(afterStep2["seed-celeste"], spiritfarerSlotStep2)).toBe(true);
    expect(isSameSlot(afterStep2["seed-spiritfarer"], spiritfarerSlotStep2)).toBe(false);
    expect(countMovedCards(afterStep1, afterStep2)).toBeGreaterThanOrEqual(2);
    assertUniqueAnchors(afterStep2);

    // Step 3: another 1x1 operation to validate chained board reflow.
    const hadesSlotStep3 = afterStep2["seed-hades"];
    await dragToCard("seed-outerwilds", "seed-hades");
    const afterStep3 = await getAllFrames();
    expect(isSameSlot(afterStep3["seed-outerwilds"], hadesSlotStep3)).toBe(true);
    expect(countMovedCards(afterStep2, afterStep3)).toBeGreaterThanOrEqual(2);
    assertUniqueAnchors(afterStep3);
  });
});
