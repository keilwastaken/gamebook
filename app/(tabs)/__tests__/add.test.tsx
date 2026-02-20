import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";

import AddScreen from "../add";
import { GamesProvider } from "@/lib/games-context";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 1 },
  NotificationFeedbackType: { Success: 1 },
}));

function AddScreenWithProvider() {
  return (
    <GamesProvider>
      <AddScreen />
    </GamesProvider>
  );
}

async function renderAddScreen() {
  render(<AddScreenWithProvider />);
  await waitFor(() => expect(screen.getByTestId("screen-add")).toBeTruthy());
}

describe("AddScreen", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    jest.clearAllMocks();
  });

  it("renders add form with required fields", async () => {
    await renderAddScreen();

    expect(screen.getByTestId("add-title-input")).toBeTruthy();
    expect(screen.getByTestId("add-where-input")).toBeTruthy();
    expect(screen.getByTestId("add-save-button")).toBeTruthy();
  });

  it("disables save button when title or whereLeftOff is empty", async () => {
    await renderAddScreen();

    const saveButton = screen.getByTestId("add-save-button");
    expect(saveButton.props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(screen.getByTestId("add-title-input"), "My Game");
    expect(saveButton.props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(screen.getByTestId("add-where-input"), "Just started");
    expect(saveButton.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("enables save when both title and whereLeftOff are filled", async () => {
    await renderAddScreen();

    fireEvent.changeText(screen.getByTestId("add-title-input"), "Stardew");
    fireEvent.changeText(screen.getByTestId("add-where-input"), "Farming");

    const saveButton = screen.getByTestId("add-save-button");
    expect(saveButton.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("renders optional quick thought", async () => {
    await renderAddScreen();
    expect(screen.getByTestId("add-thought-input")).toBeTruthy();
  });

  it("shows ticket type choices with polaroid selected by default", async () => {
    await renderAddScreen();

    expect(
      screen.getByTestId("add-ticket-type-polaroid").props.accessibilityState?.selected
    ).toBe(true);
    expect(screen.getByTestId("add-ticket-type-postcard")).toBeTruthy();
    expect(screen.getByTestId("add-ticket-type-widget")).toBeTruthy();
    expect(screen.getByTestId("add-ticket-type-ticket")).toBeTruthy();
    expect(screen.getByTestId("add-ticket-type-minimal")).toBeTruthy();
  });

  it("shows mount style choices for all ticket types", async () => {
    await renderAddScreen();

    expect(
      screen.getByTestId("add-mount-style-tape").props.accessibilityState?.selected
    ).toBe(true);
    expect(screen.getByTestId("add-mount-style-color-pin")).toBeTruthy();
    expect(screen.getByTestId("add-mount-style-metal-pin")).toBeTruthy();
    fireEvent.press(screen.getByTestId("add-ticket-type-postcard"));
    expect(screen.getByTestId("add-mount-style-tape")).toBeTruthy();
  });

  it("shows postcard side options only for postcard", async () => {
    await renderAddScreen();

    expect(screen.queryByTestId("add-postcard-side-front")).toBeNull();
    fireEvent.press(screen.getByTestId("add-ticket-type-postcard"));
    expect(screen.getByTestId("add-postcard-side-front")).toBeTruthy();
    expect(screen.getByTestId("add-postcard-side-back")).toBeTruthy();
    expect(
      screen.getByTestId("add-postcard-side-front").props.accessibilityState?.selected
    ).toBe(true);

    fireEvent.press(screen.getByTestId("add-ticket-type-ticket"));
    expect(screen.queryByTestId("add-postcard-side-front")).toBeNull();
  });

  it("saves and routes back to tabs when form is valid", async () => {
    await renderAddScreen();

    fireEvent.changeText(screen.getByTestId("add-title-input"), "Celeste");
    fireEvent.changeText(screen.getByTestId("add-where-input"), "Chapter 3");
    fireEvent.changeText(screen.getByTestId("add-thought-input"), "Great pacing");
    fireEvent.press(screen.getByTestId("add-save-button"));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/(tabs)"));
    expect(Haptics.notificationAsync).toHaveBeenCalled();
  });

  it("handles press-in and press-out events on save button", async () => {
    await renderAddScreen();
    const button = screen.getByTestId("add-save-button");
    fireEvent(button, "pressIn");
    fireEvent(button, "pressOut");
    expect(button).toBeTruthy();
  });
});
