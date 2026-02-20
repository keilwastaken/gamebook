import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { TicketCard } from "../ticket-card";
import type { Game } from "@/lib/types";

const MOCK_GAME: Game = {
  id: "test-1",
  title: "Stardew Valley",
  playtime: "24h",
  progress: 0.6,
  status: "playing",
  lastNote: {
    id: "n1",
    timestamp: Date.now(),
    whereLeftOff: "Finished the mines",
    progress: 0.6,
  },
  notes: [],
};

describe("TicketCard", () => {
  it("renders game title", () => {
    render(<TicketCard game={MOCK_GAME} />);

    expect(screen.getByText("Stardew Valley")).toBeTruthy();
  });

  it("renders last note when present", () => {
    render(<TicketCard game={MOCK_GAME} />);

    expect(screen.getByText("Finished the mines")).toBeTruthy();
  });

  it("renders playtime when no lastNote", () => {
    const gameWithoutNote: Game = { ...MOCK_GAME, lastNote: undefined };
    render(<TicketCard game={gameWithoutNote} />);

    expect(screen.getByText("24h")).toBeTruthy();
  });

  it("renders Now playing when no lastNote and no playtime", () => {
    const gameMinimal: Game = {
      ...MOCK_GAME,
      lastNote: undefined,
      playtime: undefined,
    };
    render(<TicketCard game={gameMinimal} />);

    expect(screen.getByText("Now playing")).toBeTruthy();
  });

  it("calls onPress when card is tapped", () => {
    const onPress = jest.fn();
    render(<TicketCard game={MOCK_GAME} onPress={onPress} />);

    fireEvent.press(screen.getByLabelText(/Update bookmark for Stardew Valley/i));

    expect(onPress).toHaveBeenCalledWith("test-1");
  });
});
