import { useRef } from "react";
import { Animated, Pressable, Text, ViewStyle } from "react-native";

import { palette } from "@/constants/palette";

import { TabConfig } from "./constants";

interface TabButtonProps {
  tab: TabConfig;
  isFocused: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
  style?: ViewStyle;
}

export function TabButton({
  tab,
  isFocused,
  onPress,
  activeColor,
  inactiveColor,
  style,
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
      className="items-center justify-center py-2 flex-1"
      style={style}
    >
      <Animated.View
        className={`rounded-full items-center justify-center ${
          isFocused ? "bg-sage-200/80 dark:bg-sage-600/80" : "bg-transparent"
        }`}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 6,
          transform: [{ scale: scaleAnim }],
          ...(isFocused && {
            shadowColor: palette.sage[300],
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.7,
            shadowRadius: 12,
          }),
        }}
      >
        <tab.icon
          size={24}
          color={isFocused ? activeColor : inactiveColor}
          weight={isFocused ? "fill" : "regular"}
        />
      </Animated.View>
      <Text
        className={`text-xs mt-1 font-semibold ${
          isFocused
            ? "text-sage-600 dark:text-sage-50"
            : "text-sage-400 dark:text-sage-300"
        }`}
        style={{ fontFamily: "Nunito" }}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}
