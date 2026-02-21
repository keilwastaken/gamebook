import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { Animated, Platform } from "react-native";
import * as Haptics from "expo-haptics";
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
      .mockImplementation((() => instantAnimation()) as never);
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

});
