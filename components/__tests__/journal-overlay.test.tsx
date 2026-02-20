import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { Animated, Platform } from "react-native";
import * as Haptics from "expo-haptics";
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
  let timingSpy: jest.SpyInstance;
  let springSpy: jest.SpyInstance;
  let parallelSpy: jest.SpyInstance;
  const originalPlatformOs = Platform.OS;

  beforeEach(() => {
    (Haptics.notificationAsync as jest.Mock).mockClear();
    const instantAnimation = () => ({
      start: (callback?: () => void) => callback?.(),
      stop: jest.fn(),
      reset: jest.fn(),
    });

    timingSpy = jest
      .spyOn(Animated, "timing")
      .mockImplementation((() => instantAnimation()) as never);
    springSpy = jest
      .spyOn(Animated, "spring")
      .mockImplementation((() => instantAnimation()) as never);
    parallelSpy = jest
      .spyOn(Animated, "parallel")
      .mockImplementation((animations: Array<{ start?: (cb?: () => void) => void }>) => ({
        start: (callback?: () => void) => {
          animations.forEach((animation) => animation.start?.());
          callback?.();
        },
        stop: jest.fn(),
        reset: jest.fn(),
      }));
  });

  afterEach(() => {
    timingSpy.mockRestore();
    springSpy.mockRestore();
    parallelSpy.mockRestore();
    Object.defineProperty(Platform, "OS", { value: originalPlatformOs });
  });

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

  it("saves note with trimmed values and closes via save animation callback", async () => {
    const onSave = jest.fn();
    render(<JournalOverlay game={MOCK_GAME} onSave={onSave} onClose={jest.fn()} />);

    fireEvent.changeText(screen.getByTestId("journal-where-input"), "  At dock  ");
    fireEvent.changeText(screen.getByTestId("journal-thought-input"), "  cozy  ");
    fireEvent.press(screen.getByTestId("journal-save-button"));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        whereLeftOff: "At dock",
        quickThought: "cozy",
      })
    );
    expect(Haptics.notificationAsync).toHaveBeenCalled();
  });

  it("omits quickThought when trimmed value is empty", async () => {
    const onSave = jest.fn();
    render(<JournalOverlay game={MOCK_GAME} onSave={onSave} onClose={jest.fn()} />);

    fireEvent.changeText(screen.getByTestId("journal-where-input"), "Checkpoint");
    fireEvent.changeText(screen.getByTestId("journal-thought-input"), "   ");
    fireEvent.press(screen.getByTestId("journal-save-button"));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        whereLeftOff: "Checkpoint",
        quickThought: undefined,
      })
    );
  });

  it("keeps save disabled when whereLeftOff is only whitespace", () => {
    render(<JournalOverlay game={MOCK_GAME} onSave={jest.fn()} onClose={jest.fn()} />);
    fireEvent.changeText(screen.getByTestId("journal-where-input"), "   ");
    const button = screen.getByTestId("journal-save-button");
    expect(button.props.accessibilityState?.disabled).toBe(true);
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  it("closes when backdrop is pressed", async () => {
    const onClose = jest.fn();
    render(<JournalOverlay game={MOCK_GAME} onSave={jest.fn()} onClose={onClose} />);
    fireEvent.press(screen.getByTestId("journal-backdrop"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("supports android keyboard behavior branch", () => {
    Object.defineProperty(Platform, "OS", { value: "android" });
    render(<JournalOverlay game={MOCK_GAME} onSave={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByTestId("journal-overlay")).toBeTruthy();
  });

  it("handles empty activePositions and unmatched current size safely", () => {
    const onSelectSize = jest.fn();
    render(
      <JournalOverlay
        game={{
          ...MOCK_GAME,
          board: { x: 1, y: 1, w: 1, h: 1, columns: 4 },
        }}
        onSave={jest.fn()}
        onClose={jest.fn()}
        sizePresets={[
          { id: "empty", w: 1, h: 1, activePositions: [] },
        ]}
        currentSize={{ w: 2, h: 2 }}
        onSelectSize={onSelectSize}
      />
    );

    fireEvent.press(screen.getByTestId("journal-size-empty"));
    expect(onSelectSize).toHaveBeenCalledWith(
      { id: "empty", w: 1, h: 1, activePositions: [] },
      { x: 0, y: 0 }
    );
  });

  it("handles default active positions for 2x1 and 1x2 presets", () => {
    const onSelectSize = jest.fn();
    render(
      <JournalOverlay
        game={{
          ...MOCK_GAME,
          board: { x: 0, y: 0, w: 2, h: 1, columns: 4 },
        }}
        onSave={jest.fn()}
        onClose={jest.fn()}
        sizePresets={[
          { id: "wide", w: 2, h: 1 },
          { id: "tall", w: 1, h: 2 },
        ]}
        currentSize={{ w: 2, h: 1 }}
        onSelectSize={onSelectSize}
      />
    );

    fireEvent.press(screen.getByTestId("journal-size-tall"));
    expect(onSelectSize).toHaveBeenCalledWith(
      { id: "tall", w: 1, h: 2 },
      { x: 0, y: 0 }
    );
  });
});
