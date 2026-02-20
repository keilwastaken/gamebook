import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { CenterButton } from "../center-button";

describe("CenterButton", () => {
  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    render(<CenterButton size={64} onPress={onPress} />);
    fireEvent.press(screen.getByTestId("center-button-add"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("handles press-in and press-out animation triggers without errors", () => {
    render(<CenterButton size={64} onPress={jest.fn()} />);
    const button = screen.getByTestId("center-button-add");
    fireEvent(button, "pressIn");
    fireEvent(button, "pressOut");
    expect(button).toBeTruthy();
  });
});
