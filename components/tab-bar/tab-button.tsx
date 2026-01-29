import { useRef } from "react";
import { Animated, Pressable } from "react-native";

import { TabConfig } from "./constants";

interface TabButtonProps {
  tab: TabConfig;
  isFocused: boolean;
  iconSize: number;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
  activeIconShadowColor: string;
}

export function TabButton({
  tab,
  isFocused,
  iconSize,
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

  const size = isFocused ? iconSize * 1.1 : iconSize;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="flex-1 items-center justify-center"
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
          size={size}
          color={isFocused ? activeColor : inactiveColor}
          weight="fill"
        />
      </Animated.View>
    </Pressable>
  );
}
