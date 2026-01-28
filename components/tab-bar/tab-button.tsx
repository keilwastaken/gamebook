import { useRef } from "react";
import { Animated, Pressable } from "react-native";

import { palette } from "@/constants/palette";

import {
  ICON_SIZE_DEFAULT,
  ICON_SIZE_FOCUSED,
  TAB_BAR_HEIGHT,
  TabConfig,
} from "./constants";

interface TabButtonProps {
  tab: TabConfig;
  isFocused: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
  activeIconShadowColor: string;
}

export function TabButton({
  tab,
  isFocused,
  onPress,
  activeColor,
  inactiveColor,
  activeIconShadowColor,
}: TabButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.85,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 12,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="flex-1 items-center justify-center"
      style={{ height: TAB_BAR_HEIGHT }}
    >
      <Animated.View
        className="items-center justify-center"
        style={[
          { transform: [{ scale: scaleAnim }] },
          isFocused && {
            shadowColor: activeIconShadowColor,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 6,
            elevation: 10,
          },
        ]}
      >
        <tab.icon
          size={isFocused ? ICON_SIZE_FOCUSED : ICON_SIZE_DEFAULT}
          color={isFocused ? activeColor : inactiveColor}
          weight="fill"
        />
      </Animated.View>
    </Pressable>
  );
}
