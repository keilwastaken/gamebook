import { Image, View } from "react-native";

import { IMAGE_ASPECT_RATIO } from "./constants";

const tabBarImage = require("@/assets/images/tab-bar-background.png");

interface TabBarBackgroundProps {
  width: number;
}

export function TabBarBackground({ width }: TabBarBackgroundProps) {
  const imageHeight = width * IMAGE_ASPECT_RATIO;

  return (
    <View className="absolute inset-0">
      <Image
        source={tabBarImage}
        style={{ width, height: imageHeight, marginTop: -70 }}
        resizeMode="contain"
      />
    </View>
  );
}
