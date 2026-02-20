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
import { randomRotation } from "@/utils/random-rotation";
import type { GameCardData } from "./types";
import { MountAdornment } from "./mount-adornment";

export interface PostcardCardProps {
  game: GameCardData;
  seed?: number;
  rotation?: number;
}

const PLACEHOLDER_IMAGE =
  "https://image.api.playstation.com/vulcan/ap/disc/21/08/17/63257d9761f00696955e632732386120800b3950f6312450505470002.png";
const GRAIN_OVERLAY = require("../../assets/images/tab-bar-background.png");

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
      <MountAdornment mountStyle={game.mountStyle} />
      <View style={[styles.card, CozyShadows.base, styles.cardShadow]}>
        {game.postcardSide === "back" ? (
          <View style={styles.backSide}>
            <Image source={GRAIN_OVERLAY} style={styles.paperGrain} resizeMode="cover" />
            <View style={styles.backDivider} />
            <View style={styles.backStamp} />
            <Text style={styles.toLine}>TO: PLAYER 1</Text>
            <Text style={styles.backMessage} numberOfLines={3}>
              {game.notePreview ?? "Wish you were here!"}
            </Text>
            <View style={styles.addressLineOne} />
            <View style={styles.addressLineTwo} />
            <Text style={styles.backTitle} numberOfLines={1}>
              {game.title}
            </Text>
          </View>
        ) : (
          <View style={styles.imageFrame}>
            <View style={styles.imageBox}>
              <Image
                source={imageSource as ImageSourcePropType}
                style={styles.image}
                resizeMode="cover"
              />
              <Image
                source={GRAIN_OVERLAY}
                style={styles.imageGrain}
                resizeMode="cover"
              />
              <Text style={styles.greeting} numberOfLines={1}>
                Greetings from {game.title}
              </Text>
              <View style={styles.stamp}>
                <Text style={styles.stampText} numberOfLines={1}>
                  {game.playtime ?? "Now"}
                </Text>
              </View>
              <Text style={styles.signature} numberOfLines={1}>
                {game.notePreview ?? "Wish you were here"}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "flex-start",
    paddingTop: 10,
  },
  card: {
    backgroundColor: palette.warm[50],
    padding: 6,
    width: 228,
    borderWidth: 1,
    borderColor: "rgba(125, 112, 99, 0.22)",
    borderRadius: 2,
  },
  cardShadow: {
    shadowColor: palette.warm[600],
    shadowOffset: { width: 1, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  imageFrame: {
    padding: 2,
    borderWidth: 1,
    borderColor: "rgba(125, 112, 99, 0.2)",
    backgroundColor: palette.warm[50],
  },
  imageBox: {
    width: 214,
    height: 128,
    backgroundColor: palette.sage[200],
    borderWidth: 1,
    borderColor: palette.warm[200],
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageGrain: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },
  greeting: {
    position: "relative",
    marginTop: 8,
    marginLeft: 8,
    marginRight: 56,
    fontSize: 16,
    fontFamily: "Nunito",
    fontWeight: "700",
    color: palette.cream.DEFAULT,
    textShadowColor: "rgba(68, 88, 57, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  stamp: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 40,
    height: 28,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: palette.warm[200],
    backgroundColor: palette.clay[50],
    alignItems: "center",
    justifyContent: "center",
  },
  stampText: {
    fontSize: 10,
    fontFamily: "Nunito",
    fontWeight: "700",
    color: palette.sage[500],
  },
  signature: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 8,
    fontSize: 9,
    fontFamily: "Nunito",
    color: palette.text.secondary,
    fontStyle: "italic",
    textShadowColor: "rgba(245, 240, 232, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  backSide: {
    width: 214,
    height: 128,
    backgroundColor: palette.warm[50],
    borderWidth: 1,
    borderColor: palette.warm[200],
    overflow: "hidden",
    position: "relative",
    padding: 8,
  },
  paperGrain: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
  },
  backDivider: {
    position: "absolute",
    top: 8,
    bottom: 8,
    left: "54%",
    width: 1,
    backgroundColor: "rgba(125, 112, 99, 0.3)",
  },
  backStamp: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: palette.warm[200],
  },
  toLine: {
    position: "absolute",
    top: 32,
    right: 8,
    left: "56%",
    fontSize: 8,
    color: palette.text.muted,
    letterSpacing: 0.4,
  },
  backMessage: {
    width: "52%",
    fontSize: 9,
    color: palette.text.secondary,
    fontStyle: "italic",
    lineHeight: 12,
  },
  addressLineOne: {
    position: "absolute",
    right: 8,
    left: "56%",
    bottom: 28,
    height: 1,
    backgroundColor: "rgba(125, 112, 99, 0.3)",
  },
  addressLineTwo: {
    position: "absolute",
    right: 8,
    left: "56%",
    bottom: 16,
    height: 1,
    backgroundColor: "rgba(125, 112, 99, 0.24)",
  },
  backTitle: {
    position: "absolute",
    left: 8,
    bottom: 8,
    right: "48%",
    fontSize: 10,
    color: palette.sage[500],
    fontFamily: "Nunito",
    fontWeight: "700",
  },
});
