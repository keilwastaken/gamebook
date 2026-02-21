import {
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import {
  BOARD_SIDE_PADDING,
  BOARD_TOP_PADDING,
  getBoardScrollBottomPadding,
  getBoardWidth,
} from "@/lib/board/metrics";

interface BoardViewportProps {
  children: ReactNode;
  dragging: boolean;
  screenWidth: number;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  onScrollOffsetChange?: (offsetY: number) => void;
  onViewportHeightChange?: (height: number) => void;
  onContentHeightChange?: (height: number) => void;
}

export interface BoardViewportHandle {
  scrollTo: (options: { y: number; animated?: boolean }) => void;
}

export const BoardViewport = forwardRef<BoardViewportHandle, BoardViewportProps>(
  (
    {
      children,
      dragging,
      screenWidth,
      testID,
      style,
      onScrollOffsetChange,
      onViewportHeightChange,
      onContentHeightChange,
    },
    ref
  ) => {
    const insets = useContext(SafeAreaInsetsContext);
    const scrollRef = useRef<ScrollView>(null);
    const boardWidth = getBoardWidth(screenWidth);
    const topPadding = BOARD_TOP_PADDING + (insets?.top ?? 0);
    const bottomPadding = getBoardScrollBottomPadding(screenWidth, insets?.bottom ?? 0);

    useImperativeHandle(ref, () => ({
      scrollTo: ({ y, animated }) => {
        scrollRef.current?.scrollTo({ x: 0, y, animated: animated ?? true });
      },
    }));

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      onScrollOffsetChange?.(event.nativeEvent.contentOffset.y);
    };

    const handleLayout = (event: LayoutChangeEvent) => {
      onViewportHeightChange?.(event.nativeEvent.layout.height);
    };

    return (
      <ScrollView
        ref={scrollRef}
        testID={testID}
        style={style}
        scrollEnabled={!dragging}
        showsVerticalScrollIndicator={false}
        onLayout={handleLayout}
        onScroll={handleScroll}
        onContentSizeChange={(_width, height) => {
          onContentHeightChange?.(height);
        }}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: BOARD_SIDE_PADDING,
            paddingTop: topPadding,
            paddingBottom: bottomPadding,
          },
        ]}
      >
        <View style={{ width: boardWidth, alignSelf: "center" }}>{children}</View>
      </ScrollView>
    );
  }
);

BoardViewport.displayName = "BoardViewport";

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
});
