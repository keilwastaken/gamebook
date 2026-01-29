import { Image, StyleSheet, View } from "react-native";

import { palette } from "@/constants/palette";

const cardstockTexture = require("@/assets/images/cardstock-texture-tiny.jpg");

interface PaperBackgroundProps {
  children: React.ReactNode;
}

export function PaperBackground({ children }: PaperBackgroundProps) {
  return (
    <View style={styles.container}>
      {/* Paper texture background */}
      <View style={styles.textureContainer}>
        <Image
          source={cardstockTexture}
          style={styles.texture}
          resizeMode="repeat"
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.cream.DEFAULT,
  },
  textureContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
});
