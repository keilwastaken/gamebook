import { StyleSheet } from "react-native";

import { CozyShadows } from "../shadows";

describe("CozyShadows", () => {
  it("defines expected base shadow tokens", () => {
    const base = StyleSheet.flatten(CozyShadows.base);
    expect(base).toMatchObject({
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    });
  });

  it("defines lifted and micro variants", () => {
    const lifted = StyleSheet.flatten(CozyShadows.liftedBottom);
    const micro = StyleSheet.flatten(CozyShadows.micro);

    expect(lifted.elevation).toBe(6);
    expect(micro.shadowColor).toBe("#000000");
    expect(micro.elevation).toBe(2);
  });
});
