import { useRef } from "react";
import { Animated, Pressable, View, Image, StyleSheet } from "react-native";

import { palette } from "@/constants/palette";

const buttonDefault = require("@/assets/images/clay-plus-button-tiny.png");
const buttonPressed = require("@/assets/images/clay-plus-button-dark-tiny.png");

interface CenterButtonProps {
  size: number;
  onPress: () => void;
}

export function CenterButton({ size, onPress }: CenterButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const darkFadeAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(darkFadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 12,
      }),
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
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "8%",
      }}
    >
      <Pressable
        testID="center-button-add"
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_disableSound={true}
      >
        <Animated.View
          style={[
            styles.container,
            {
              width: size,
              height: size,
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
    shadowColor: palette.sage[600],
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
