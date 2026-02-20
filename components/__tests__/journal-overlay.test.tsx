import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { JournalOverlay } from "../journal-overlay";
import {
  GRID_ACTIVE_TOP_LEFT,
  GRID_ACTIVE_TOP_RIGHT,
} from "@/components/ui/grid-glyph";
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
    expect(onSelectSize).toHaveBeenCalledWith({ w: 2, h: 2 }, { x: 0, y: 0 });
    expect(screen.getByTestId("journal-size-options")).toBeTruthy();
  });

  it("applies movement deltas for repeated same-span icon changes", () => {
    const onSelectSize = jest.fn();
    render(
      <JournalOverlay
        game={MOCK_GAME}
        onSave={jest.fn()}
        onClose={jest.fn()}
        sizePresets={[
          { id: "top-left", w: 1, h: 1, activePositions: GRID_ACTIVE_TOP_LEFT },
          { id: "top-right", w: 1, h: 1, activePositions: GRID_ACTIVE_TOP_RIGHT },
        ]}
        currentSize={{ w: 1, h: 1 }}
        onSelectSize={onSelectSize}
      />
    );

    fireEvent.press(screen.getByTestId("journal-size-top-right"));
    fireEvent.press(screen.getByTestId("journal-size-top-left"));

    expect(onSelectSize).toHaveBeenNthCalledWith(
      1,
      { id: "top-right", w: 1, h: 1, activePositions: GRID_ACTIVE_TOP_RIGHT },
      { x: 1, y: 0 }
    );
    expect(onSelectSize).toHaveBeenNthCalledWith(
      2,
      { id: "top-left", w: 1, h: 1, activePositions: GRID_ACTIVE_TOP_LEFT },
      { x: -1, y: 0 }
    );
  });

  it("infers current same-span preset from board anchor instead of defaulting to first option", () => {
    const onSelectSize = jest.fn();
    render(
      <JournalOverlay
        game={{
          ...MOCK_GAME,
          board: { x: 1, y: 0, w: 1, h: 1, columns: 4 },
        }}
        onSave={jest.fn()}
        onClose={jest.fn()}
        sizePresets={[
          { id: "top-left", w: 1, h: 1, activePositions: GRID_ACTIVE_TOP_LEFT },
          { id: "top-right", w: 1, h: 1, activePositions: GRID_ACTIVE_TOP_RIGHT },
        ]}
        currentSize={{ w: 1, h: 1 }}
        onSelectSize={onSelectSize}
      />
    );

    fireEvent.press(screen.getByTestId("journal-size-top-left"));

    expect(onSelectSize).toHaveBeenCalledWith(
      { id: "top-left", w: 1, h: 1, activePositions: GRID_ACTIVE_TOP_LEFT },
      { x: -1, y: 0 }
    );
  });
});
