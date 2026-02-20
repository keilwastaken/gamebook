import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { JournalOverlay } from "../journal-overlay";
import type { Game } from "@/lib/types";

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: "success" },
}));

const MOCK_GAME: Game = {
  id: "test-1",
  title: "Spiritfarer",
  status: "playing",
  notes: [],
};

describe("JournalOverlay", () => {
  it("renders game title", () => {
    render(
      <JournalOverlay game={MOCK_GAME} onSave={jest.fn()} onClose={jest.fn()} />
    );

    expect(screen.getByText("Spiritfarer")).toBeTruthy();
  });

  it("renders both text inputs", () => {
    render(
      <JournalOverlay game={MOCK_GAME} onSave={jest.fn()} onClose={jest.fn()} />
    );

    expect(screen.getByTestId("journal-where-input")).toBeTruthy();
    expect(screen.getByTestId("journal-thought-input")).toBeTruthy();
  });

  it("disables save button when whereLeftOff is empty", () => {
    render(
      <JournalOverlay game={MOCK_GAME} onSave={jest.fn()} onClose={jest.fn()} />
    );

    const saveButton = screen.getByTestId("journal-save-button");
    expect(saveButton.props.accessibilityState?.disabled).toBe(true);
  });

  it("enables save button when text is entered", () => {
    render(
      <JournalOverlay game={MOCK_GAME} onSave={jest.fn()} onClose={jest.fn()} />
    );

    fireEvent.changeText(
      screen.getByTestId("journal-where-input"),
      "At the docks"
    );

    const saveButton = screen.getByTestId("journal-save-button");
    expect(saveButton.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("renders section labels", () => {
    render(
      <JournalOverlay game={MOCK_GAME} onSave={jest.fn()} onClose={jest.fn()} />
    );

    expect(screen.getByText("WHERE I LEFT OFF")).toBeTruthy();
    expect(screen.getByText("QUICK THOUGHT")).toBeTruthy();
  });

  it("renders save button with correct label", () => {
    render(
      <JournalOverlay game={MOCK_GAME} onSave={jest.fn()} onClose={jest.fn()} />
    );

    expect(screen.getByText("Save Gentle Note")).toBeTruthy();
  });

  it("shows size options when size handlers are provided", () => {
    render(
      <JournalOverlay
        game={MOCK_GAME}
        onSave={jest.fn()}
        onClose={jest.fn()}
        sizePresets={[
          { w: 1, h: 2 },
          { w: 2, h: 2 },
        ]}
        currentSize={{ w: 1, h: 2 }}
        onSelectSize={jest.fn()}
      />
    );

    expect(screen.getByTestId("journal-size-options")).toBeTruthy();
  });

  it("calls onSelectSize when choosing a size", () => {
    const onSelectSize = jest.fn();
    render(
      <JournalOverlay
        game={MOCK_GAME}
        onSave={jest.fn()}
        onClose={jest.fn()}
        sizePresets={[
          { w: 1, h: 2 },
          { w: 2, h: 2 },
        ]}
        currentSize={{ w: 1, h: 2 }}
        onSelectSize={onSelectSize}
      />
    );

    fireEvent.press(screen.getByTestId("journal-size-2x2"));
    expect(onSelectSize).toHaveBeenCalledWith({ w: 2, h: 2 });
    expect(screen.getByTestId("journal-size-options")).toBeTruthy();
  });
});
