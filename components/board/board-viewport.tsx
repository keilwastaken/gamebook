import { useContext, type ReactNode } from "react";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
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
}

export function BoardViewport({
  children,
  dragging,
  screenWidth,
  testID,
  style,
}: BoardViewportProps) {
  const insets = useContext(SafeAreaInsetsContext);
  const boardWidth = getBoardWidth(screenWidth);
  const bottomPadding = getBoardScrollBottomPadding(screenWidth, insets?.bottom ?? 0);

  return (
    <ScrollView
      testID={testID}
      style={style}
      scrollEnabled={!dragging}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: BOARD_SIDE_PADDING,
          paddingTop: BOARD_TOP_PADDING,
          paddingBottom: bottomPadding,
        },
      ]}
    >
      <View style={{ width: boardWidth, alignSelf: "center" }}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
});
