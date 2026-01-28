import { PlusIcon } from "phosphor-react-native";
import { useRef } from "react";
import { Animated, Pressable, View } from "react-native";

import { palette } from "@/constants/palette";

interface CenterButtonProps {
  curveWidth: number;
  buttonSize: number;
  tintColor: string;
  onPress: () => void;
}

export function CenterButton({
  curveWidth,
  buttonSize,
  tintColor,
  onPress,
}: CenterButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
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
    <View
      className="items-center justify-center"
      style={{
        width: curveWidth,
        marginTop: -28,
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          className="rounded-full items-center justify-center shadow-lg bg-sage-200 dark:bg-sage-700"
          style={{
            width: buttonSize,
            height: buttonSize,
            transform: [{ scale: scaleAnim }],
            shadowColor: palette.sage[600],
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <PlusIcon size={28} color={tintColor} weight="bold" />
        </Animated.View>
      </Pressable>
    </View>
  );
}
