import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { PlayingCard } from "../playing-card";
import type { Game } from "@/lib/types";

const MOCK_GAME: Game = {
  id: "test-1",
  title: "Stardew Valley",
  playtime: "24h",
  status: "playing",
  lastNote: {
    id: "n1",
    timestamp: Date.now(),
    whereLeftOff: "Finished the mines",
  },
  notes: [],
};

describe("PlayingCard", () => {
  it("renders game title and playtime", () => {
    render(<PlayingCard game={MOCK_GAME} onAddNote={jest.fn()} />);

    expect(screen.getByText("Stardew Valley")).toBeTruthy();
    expect(screen.getByText("24h")).toBeTruthy();
  });

  it("shows last note date metadata", () => {
    render(<PlayingCard game={MOCK_GAME} onAddNote={jest.fn()} />);

    expect(screen.getByText(/Last note/i)).toBeTruthy();
  });

  it("renders last note preview", () => {
    render(<PlayingCard game={MOCK_GAME} onAddNote={jest.fn()} />);

    expect(screen.getByText("Finished the mines")).toBeTruthy();
    expect(screen.getByText("Last bookmark")).toBeTruthy();
  });

  it("calls onAddNote when + button is pressed", () => {
    const onAddNote = jest.fn();
    render(<PlayingCard game={MOCK_GAME} onAddNote={onAddNote} />);

    fireEvent.press(screen.getByText("+ Update Bookmark"));

    expect(onAddNote).toHaveBeenCalledWith("test-1");
  });

  it("hides note preview when no lastNote exists", () => {
    const gameWithoutNote: Game = { ...MOCK_GAME, lastNote: undefined };
    render(<PlayingCard game={gameWithoutNote} onAddNote={jest.fn()} />);

    expect(screen.queryByText("Last bookmark")).toBeNull();
  });

  it("handles press-in and press-out animation events on add button", () => {
    render(<PlayingCard game={MOCK_GAME} onAddNote={jest.fn()} />);
    const addButton = screen.getByTestId("playing-card-add-test-1");
    fireEvent(addButton, "pressIn");
    fireEvent(addButton, "pressOut");
    expect(addButton).toBeTruthy();
  });
});
