import React from "react";
import { render, screen } from "@testing-library/react-native";

import ModalScreen from "../modal";

jest.mock("expo-router", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Link: ({ children }: { children: React.ReactNode }) => (
      <View testID="modal-link">{children}</View>
    ),
  };
});

describe("ModalScreen", () => {
  it("renders modal copy and navigation link text", () => {
    render(<ModalScreen />);
    expect(screen.getByText("This is a modal")).toBeTruthy();
    expect(screen.getByText("Go to home screen")).toBeTruthy();
    expect(screen.getByTestId("modal-link")).toBeTruthy();
  });
});
