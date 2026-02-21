import { Image, View } from "react-native";

import { IMAGE_ASPECT_RATIO } from "./constants";

const tabBarImage = require("@/assets/images/tab-bar-background.png");

interface TabBarBackgroundProps {
  width: number;
}

export function TabBarBackground({ width }: TabBarBackgroundProps) {
  const imageHeight = width * IMAGE_ASPECT_RATIO;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <Image
        source={tabBarImage}
        style={{ width, height: imageHeight, marginTop: -70 }}
        resizeMode="contain"
      />
    </View>
  );
}
