import { useRef } from "react";
import { Animated, Pressable, View, Image, StyleSheet } from "react-native";

const buttonDefault = require("@/assets/images/clay-plus-button-tiny.png");
const buttonPressed = require("@/assets/images/clay-plus-button-dark-tiny.png");

interface CenterButtonProps {
  curveWidth: number;
  buttonSize: number;
  onPress: () => void;
}

export function CenterButton({
  curveWidth,
  buttonSize,
  onPress,
}: CenterButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const darkFadeAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      // Shrink to 90% (the "squish")
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      // Fade in dark button
      Animated.timing(darkFadeAnim, {
        toValue: 1,
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
      // Fade out dark button
      Animated.timing(darkFadeAnim, {
        toValue: 0,
        duration: 150,
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
            },
          ]}
        >
          <Image
            source={buttonDefault}
            style={styles.image}
            resizeMode="contain"
          />
          <Animated.Image
            source={buttonPressed}
            style={[
              styles.image,
              styles.darkOverlay,
              { opacity: darkFadeAnim },
            ]}
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
  darkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
  },
});
