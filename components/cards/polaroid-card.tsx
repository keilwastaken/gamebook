import { useMemo } from "react";
import {
  Image,
  View,
  Text,
  StyleSheet,
  type ImageSourcePropType,
} from "react-native";

import { palette } from "@/constants/palette";
import { CozyShadows } from "@/utils/shadows";
import type { GameCardData } from "./types";
import { randomRotation } from "./types";

export interface PolaroidCardProps {
  game: GameCardData;
  seed?: number;
  rotation?: number;
}

const PLACEHOLDER_IMAGE =
  "https://image.api.playstation.com/vulcan/ap/disc/21/08/17/63257d9761f00696955e632732386120800b3950f6312450505470002.png";

export function PolaroidCard({
  game,
  seed = 1,
  rotation: rotationOverride,
}: PolaroidCardProps) {
  const rotation = useMemo(
    () => rotationOverride ?? randomRotation(seed),
    [rotationOverride, seed]
  );
  const imageSource = game.imageUri
    ? { uri: game.imageUri }
    : { uri: PLACEHOLDER_IMAGE };

  return (
    <View style={[styles.wrapper, { transform: [{ rotate: `${rotation}deg` }] }]}>
      <View style={styles.pinContainer}>
        <View
          style={[
            styles.pin,
            { backgroundColor: palette.clay[500] },
            CozyShadows.micro,
          ]}
        />
      </View>
      <View style={[styles.card, CozyShadows.base]}>
        <View style={styles.imageContainer}>
          <Image
            source={imageSource as ImageSourcePropType}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.caption} numberOfLines={1}>
          {game.title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "flex-start",
    alignItems: "center",
  },
  pinContainer: {
    position: "absolute",
    top: -6,
    left: "50%",
    marginLeft: -7,
    zIndex: 2,
  },
  pin: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    paddingBottom: 32,
    width: 140,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: palette.sage[200],
    marginBottom: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  caption: {
    fontSize: 13,
    color: palette.text.secondary,
    textAlign: "center",
    fontStyle: "italic",
  },
});
