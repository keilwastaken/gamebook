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

export interface PostcardCardProps {
  game: GameCardData;
  seed?: number;
  rotation?: number;
}

const PLACEHOLDER_IMAGE =
  "https://image.api.playstation.com/vulcan/ap/disc/21/08/17/63257d9761f00696955e632732386120800b3950f6312450505470002.png";

export function PostcardCard({
  game,
  seed = 2,
  rotation: rotationOverride,
}: PostcardCardProps) {
  const rotation = useMemo(
    () => rotationOverride ?? randomRotation(seed),
    [rotationOverride, seed]
  );
  const imageSource = game.imageUri
    ? { uri: game.imageUri }
    : { uri: PLACEHOLDER_IMAGE };

  return (
    <View style={[styles.wrapper, { transform: [{ rotate: `${rotation}deg` }] }]}>
      <View style={[styles.card, CozyShadows.base]}>
        <View style={[styles.tape, styles.tapeTopLeft]} />
        <View style={[styles.tape, styles.tapeBottomRight]} />
        <View style={styles.content}>
          <View style={styles.imageBox}>
            <Image
              source={imageSource as ImageSourcePropType}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
          <View style={styles.textBox}>
            <View style={styles.stamp} />
            <Text style={styles.to}>TO: PLAYER 1</Text>
            <Text style={styles.title} numberOfLines={2}>
              {game.title}
            </Text>
            <Text style={styles.wish}>Wish you were here!</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "flex-start",
  },
  card: {
    backgroundColor: palette.cream.DEFAULT,
    padding: 4,
    width: 220,
    borderWidth: 1,
    borderColor: "rgba(68, 88, 57, 0.15)",
  },
  tape: {
    position: "absolute",
    width: 32,
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    opacity: 0.7,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    zIndex: 1,
  },
  tapeTopLeft: {
    top: -2,
    left: -4,
    transform: [{ rotate: "-45deg" }],
  },
  tapeBottomRight: {
    bottom: -2,
    right: -4,
    transform: [{ rotate: "-45deg" }],
  },
  content: {
    flexDirection: "row",
    gap: 8,
  },
  imageBox: {
    width: 100,
    height: 64,
    backgroundColor: palette.sage[200],
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  textBox: {
    flex: 1,
    paddingVertical: 4,
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(125, 112, 99, 0.18)",
    paddingLeft: 8,
  },
  stamp: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: palette.clay[300],
    backgroundColor: palette.clay[50],
  },
  to: {
    fontSize: 9,
    color: palette.text.muted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.text.primary,
    lineHeight: 16,
  },
  wish: {
    fontSize: 9,
    color: palette.text.secondary,
    marginTop: 4,
    fontStyle: "italic",
  },
});
