import { by, device, element, expect as detoxExpect, waitFor } from "detox";

async function tapIfVisible(matcher: Detox.NativeMatcher, timeoutMs: number = 2500): Promise<boolean> {
  try {
    await waitFor(element(matcher)).toBeVisible().withTimeout(timeoutMs);
    await element(matcher).tap();
    return true;
  } catch {
    return false;
  }
}

describe("Launch diagnostic", () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it("tries to transition from launcher shell into app home", async () => {
    await tapIfVisible(by.text("Open"), 4000);
    await tapIfVisible(by.text("Open"), 4000);
    await tapIfVisible(by.text("Dismiss"), 2000);

    await waitFor(element(by.id("screen-home"))).toBeVisible().withTimeout(15000);
    await detoxExpect(element(by.id("screen-home"))).toBeVisible();
  });
});
