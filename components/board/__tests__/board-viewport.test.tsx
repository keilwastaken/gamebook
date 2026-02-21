import React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";

import { BoardViewport, type BoardViewportHandle } from "../board-viewport";

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

  it("reports scroll metrics callbacks and exposes imperative scroll handle", () => {
    const onScrollOffsetChange = jest.fn();
    const onViewportHeightChange = jest.fn();
    const onContentHeightChange = jest.fn();
    const ref = React.createRef<BoardViewportHandle>();

    render(
      <BoardViewport
        ref={ref}
        testID="viewport"
        dragging={false}
        screenWidth={390}
        onScrollOffsetChange={onScrollOffsetChange}
        onViewportHeightChange={onViewportHeightChange}
        onContentHeightChange={onContentHeightChange}
      >
        <Text>Board Content</Text>
      </BoardViewport>
    );

    const viewport = screen.getByTestId("viewport");
    viewport.props.onLayout({ nativeEvent: { layout: { height: 640 } } });
    viewport.props.onScroll({ nativeEvent: { contentOffset: { y: 120 } } });
    viewport.props.onContentSizeChange(300, 1200);

    expect(onViewportHeightChange).toHaveBeenCalledWith(640);
    expect(onScrollOffsetChange).toHaveBeenCalledWith(120);
    expect(onContentHeightChange).toHaveBeenCalledWith(1200);
    expect(typeof ref.current?.scrollTo).toBe("function");
  });
});
