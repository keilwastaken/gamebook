import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import AddScreen from "../add";
import { GamesProvider } from "@/lib/games-context";

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: jest.fn(),
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

describe("AddScreen", () => {
  it("renders add form with required fields", async () => {
    const { getByTestId } = render(<AddScreenWithProvider />);
    await waitFor(() => expect(getByTestId("screen-add")).toBeTruthy());

    expect(screen.getByTestId("add-title-input")).toBeTruthy();
    expect(screen.getByTestId("add-where-input")).toBeTruthy();
    expect(screen.getByTestId("add-save-button")).toBeTruthy();
  });

  it("disables save button when title or whereLeftOff is empty", async () => {
    render(<AddScreenWithProvider />);
    await waitFor(() => expect(screen.getByTestId("add-save-button")).toBeTruthy());

    const saveButton = screen.getByTestId("add-save-button");
    expect(saveButton.props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(screen.getByTestId("add-title-input"), "My Game");
    expect(saveButton.props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(screen.getByTestId("add-where-input"), "Just started");
    expect(saveButton.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("enables save when both title and whereLeftOff are filled", async () => {
    render(<AddScreenWithProvider />);
    await waitFor(() => expect(screen.getByTestId("add-save-button")).toBeTruthy());

    fireEvent.changeText(screen.getByTestId("add-title-input"), "Stardew");
    fireEvent.changeText(screen.getByTestId("add-where-input"), "Farming");

    const saveButton = screen.getByTestId("add-save-button");
    expect(saveButton.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("renders optional quick thought", async () => {
    render(<AddScreenWithProvider />);
    await waitFor(() => expect(screen.getByTestId("add-thought-input")).toBeTruthy());
  });

  it("shows ticket type choices with polaroid selected by default", async () => {
    render(<AddScreenWithProvider />);
    await waitFor(() =>
      expect(screen.getByTestId("add-ticket-type-polaroid")).toBeTruthy()
    );

    expect(
      screen.getByTestId("add-ticket-type-polaroid").props.accessibilityState?.selected
    ).toBe(true);
    expect(screen.getByTestId("add-ticket-type-postcard")).toBeTruthy();
    expect(screen.getByTestId("add-ticket-type-widget")).toBeTruthy();
    expect(screen.getByTestId("add-ticket-type-ticket")).toBeTruthy();
    expect(screen.getByTestId("add-ticket-type-minimal")).toBeTruthy();
  });

  it("shows mount style choices for polaroid and hides them for other ticket types", async () => {
    render(<AddScreenWithProvider />);
    await waitFor(() =>
      expect(screen.getByTestId("add-mount-style-tape")).toBeTruthy()
    );

    expect(
      screen.getByTestId("add-mount-style-tape").props.accessibilityState?.selected
    ).toBe(true);
    expect(screen.getByTestId("add-mount-style-color-pin")).toBeTruthy();
    expect(screen.getByTestId("add-mount-style-metal-pin")).toBeTruthy();

    fireEvent.press(screen.getByTestId("add-ticket-type-postcard"));
    expect(screen.queryByTestId("add-mount-style-tape")).toBeNull();
  });
});
