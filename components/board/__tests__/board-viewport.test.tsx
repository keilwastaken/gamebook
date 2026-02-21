import React from "react";
import { StyleSheet, Text } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { BoardViewport, type BoardViewportHandle } from "../board-viewport";
import { BOARD_TOP_PADDING, getBoardScrollBottomPadding } from "@/lib/board/metrics";

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

  it("adds safe-area insets to top and bottom content padding", () => {
    render(
      <SafeAreaInsetsContext.Provider value={{ top: 44, right: 0, bottom: 34, left: 0 }}>
        <BoardViewport testID="viewport" dragging={false} screenWidth={390}>
          <Text>Board Content</Text>
        </BoardViewport>
      </SafeAreaInsetsContext.Provider>
    );

    const viewport = screen.getByTestId("viewport");
    const contentStyle = StyleSheet.flatten(viewport.props.contentContainerStyle);
    expect(contentStyle.paddingTop).toBe(BOARD_TOP_PADDING + 44);
    expect(contentStyle.paddingBottom).toBe(getBoardScrollBottomPadding(390, 34));
  });
});
