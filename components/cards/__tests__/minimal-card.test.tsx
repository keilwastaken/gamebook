import React from "react";
import { Image } from "react-native";
import { render, screen } from "@testing-library/react-native";

import { MinimalCard } from "../minimal-card";

const BASE_GAME = {
  title: "Outer Wilds",
  playtime: "11h 03m",
  mountStyle: "color-pin" as const,
};

describe("MinimalCard", () => {
  it("renders title and note preview when available", () => {
    render(<MinimalCard game={{ ...BASE_GAME, notePreview: "Tracked the vessel route" }} />);
    expect(screen.getByText("Outer Wilds")).toBeTruthy();
    expect(screen.getByText("Tracked the vessel route")).toBeTruthy();
  });

  it("falls back to playtime when note preview is missing", () => {
    render(<MinimalCard game={BASE_GAME} />);
    expect(screen.getByText("11h 03m")).toBeTruthy();
  });

  it("falls back to 'Now playing' when neither note nor playtime is available", () => {
    render(<MinimalCard game={{ title: "Outer Wilds" }} />);
    expect(screen.getByText("Now playing")).toBeTruthy();
  });

  it("uses provided image uri when present", () => {
    const view = render(
      <MinimalCard game={{ ...BASE_GAME, imageUri: "https://example.com/cover.png" }} />
    );
    const image = view.UNSAFE_getAllByType(Image)[0];
    expect(image.props.source).toEqual({ uri: "https://example.com/cover.png" });
  });
});
