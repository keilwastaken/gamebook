import React from "react";
import { StyleSheet, View } from "react-native";
import { render, screen } from "@testing-library/react-native";

import { PolaroidCard } from "../polaroid-card";
import { randomRotation } from "@/utils/random-rotation";

jest.mock("@/utils/random-rotation", () => ({
  randomRotation: jest.fn(() => 1.5),
}));

const mockRandomRotation = randomRotation as jest.MockedFunction<typeof randomRotation>;

const BASE_GAME = {
  title: "Stardew Valley",
  playtime: "24h 12m",
  mountStyle: "tape" as const,
};

function hasRotateStyle(node: { props: { style?: unknown } }, deg: number): boolean {
  const style = StyleSheet.flatten(node.props.style) as
    | { transform?: Array<{ rotate?: string }> }
    | undefined;
  if (!style || !Array.isArray(style.transform)) return false;
  return style.transform.some((entry: { rotate?: string }) => entry.rotate === `${deg}deg`);
}

describe("PolaroidCard", () => {
  beforeEach(() => {
    mockRandomRotation.mockClear();
  });

  it("renders title and playtime", () => {
    render(<PolaroidCard game={BASE_GAME} seed={2} />);
    expect(screen.getByText("Stardew Valley")).toBeTruthy();
    expect(screen.getByText("24h 12m")).toBeTruthy();
  });

  it("hides playtime when absent", () => {
    render(<PolaroidCard game={{ title: "Stardew Valley" }} seed={1} />);
    expect(screen.queryByText("24h 12m")).toBeNull();
  });

  it("uses random rotation when override is not provided", () => {
    const view = render(<PolaroidCard game={BASE_GAME} seed={9} />);
    expect(mockRandomRotation).toHaveBeenCalledWith(9);
    const rotated = view.UNSAFE_getAllByType(View).find((node) =>
      hasRotateStyle(node, 1.5)
    );
    expect(rotated).toBeTruthy();
  });

  it("uses explicit rotation override and skips random rotation", () => {
    const view = render(<PolaroidCard game={BASE_GAME} rotation={7} />);
    expect(mockRandomRotation).not.toHaveBeenCalled();
    const rotated = view.UNSAFE_getAllByType(View).find((node) =>
      hasRotateStyle(node, 7)
    );
    expect(rotated).toBeTruthy();
  });
});
