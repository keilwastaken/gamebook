import { useRef } from "react";
import { Animated, Pressable, View, Image, StyleSheet } from "react-native";

interface CenterButtonProps {
  curveWidth: number;
  buttonSize: number;
  tintColor?: string;
  onPress: () => void;
}

export function CenterButton({
  curveWidth,
  buttonSize,
  onPress,
}: CenterButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      // Shrink to 90% (the "squish")
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      // Slight dimming to simulate pressure/shadow
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      // Bounce back with rubber feel
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 12,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View
      style={{
        width: curveWidth,
        marginTop: -32,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_disableSound={true}
      >
        <Animated.View
          style={[
            styles.container,
            {
              width: buttonSize,
              height: buttonSize,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Image
            source={require("@/assets/images/clay-plus-button.png")}
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    // Shadow syncs with scale animation for realistic depth
    shadowColor: "#596A5C",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
