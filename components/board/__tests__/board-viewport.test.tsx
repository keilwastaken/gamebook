import React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";

import { BoardViewport } from "../board-viewport";

describe("BoardViewport", () => {
  it("renders without a SafeAreaProvider boundary", () => {
    render(
      <BoardViewport testID="viewport" dragging={false} screenWidth={390}>
        <Text>Board Content</Text>
      </BoardViewport>
    );

    expect(screen.getByTestId("viewport")).toBeTruthy();
    expect(screen.getByText("Board Content")).toBeTruthy();
  });
});
