import React from "react";
import { render, screen } from "@testing-library/react-native";

import { PostcardCard } from "../postcard-card";

const BASE_GAME = {
  id: "g1",
  title: "Spiritfarer",
  playtime: "8h 45m",
  notePreview: "Dropped Atul at the pier",
  mountStyle: "metal-pin" as const,
};

describe("PostcardCard", () => {
  it("renders postcard front with greeting and playtime stamp", () => {
    render(<PostcardCard game={{ ...BASE_GAME, postcardSide: "front" }} />);

    expect(screen.getByText("Greetings from Spiritfarer")).toBeTruthy();
    expect(screen.getByText("8h 45m")).toBeTruthy();
  });

  it("renders postcard back with message layout", () => {
    render(<PostcardCard game={{ ...BASE_GAME, postcardSide: "back" }} />);

    expect(screen.getByText("TO: PLAYER 1")).toBeTruthy();
    expect(screen.getByText("Dropped Atul at the pier")).toBeTruthy();
    expect(screen.getByText("Spiritfarer")).toBeTruthy();
  });
});
