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
const GRAIN_OVERLAY = require("../../assets/images/tab-bar-background.png");

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
  const mountStyle = seed % 3 === 0 ? "metal-pin" : seed % 2 === 0 ? "color-pin" : "tape";
  const pinColor =
    mountStyle === "metal-pin"
      ? palette.warm[300]
      : seed % 4 === 0
        ? palette.sage[500]
        : palette.clay[500];
  const showCornerWear = seed % 2 === 0;
  const handwrittenTilt = seed % 2 === 0;

  return (
    <View style={[styles.wrapper, { transform: [{ rotate: `${rotation}deg` }] }]}>
      {mountStyle === "tape" ? (
        <View style={styles.tape} />
      ) : (
        <View style={styles.pinWrap}>
          <View
            style={[
              styles.pinHead,
              mountStyle === "metal-pin" ? styles.pinMetal : styles.pinColor,
              { backgroundColor: pinColor },
              CozyShadows.micro,
            ]}
          />
          <View style={styles.pinNeedle} />
        </View>
      )}
      <View style={[styles.card, CozyShadows.base, styles.cardShadow]}>
        <View style={styles.innerFrame}>
          <View style={styles.imageLip}>
            <View style={styles.imageContainer}>
              <Image
                source={imageSource as ImageSourcePropType}
                style={styles.image}
                resizeMode="cover"
              />
              <Image
                source={GRAIN_OVERLAY}
                style={styles.grain}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>
        <View style={styles.contentRow}>
          <Image
            source={GRAIN_OVERLAY}
            style={styles.paperGrain}
            resizeMode="cover"
          />
          <Text
            style={[styles.caption, handwrittenTilt && styles.captionHandwritten]}
            numberOfLines={1}
          >
            {game.title}
          </Text>
          {game.playtime ? (
            <Text style={[styles.metaText, handwrittenTilt && styles.metaTextHandwritten]} numberOfLines={1}>
              {game.playtime}
            </Text>
          ) : null}
        </View>
        {showCornerWear ? (
          <>
            <View style={styles.cornerCurl} />
            <View style={styles.cornerCrease} />
          </>
        ) : null}
        <View style={styles.bottomGloss} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "flex-start",
    alignItems: "center",
    paddingTop: 10,
  },
  tape: {
    position: "absolute",
    width: 56,
    height: 18,
    backgroundColor: palette.cream.DEFAULT,
    borderWidth: 1,
    borderColor: palette.warm[200],
    opacity: 0.6,
    top: 2,
    left: "50%",
    marginLeft: -28,
    zIndex: 3,
    transform: [{ rotate: "6deg" }],
  },
  pinWrap: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -8,
    zIndex: 3,
    alignItems: "center",
  },
  pinHead: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pinColor: {
    borderWidth: 1,
    borderColor: palette.warm[100],
  },
  pinMetal: {
    borderWidth: 1,
    borderColor: palette.warm[200],
  },
  pinNeedle: {
    width: 2,
    height: 10,
    backgroundColor: palette.warm[300],
    marginTop: -2,
    borderRadius: 1,
    opacity: 0.8,
  },
  card: {
    backgroundColor: palette.warm[50],
    padding: 10,
    paddingBottom: 34,
    width: 140,
    borderWidth: 1,
    borderColor: palette.warm[200],
    borderRadius: 2,
  },
  cardShadow: {
    shadowColor: palette.warm[600],
    shadowOffset: { width: 1, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 7,
  },
  innerFrame: {
    backgroundColor: palette.warm[100],
    borderWidth: 1,
    borderColor: "rgba(125, 112, 99, 0.12)",
    padding: 2,
    marginBottom: 8,
    overflow: "hidden",
  },
  imageLip: {
    backgroundColor: palette.cream.DEFAULT,
    padding: 2,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: palette.sage[200],
    borderWidth: 1,
    borderColor: palette.warm[200],
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },
  contentRow: {
    minHeight: 18,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    position: "relative",
    overflow: "hidden",
    paddingHorizontal: 2,
  },
  paperGrain: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.035,
  },
  caption: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Nunito",
    color: palette.text.secondary,
    fontStyle: "italic",
    letterSpacing: 0.2,
  },
  captionHandwritten: {
    letterSpacing: 0.35,
    opacity: 0.94,
  },
  metaText: {
    fontSize: 10,
    fontFamily: "Nunito",
    color: palette.sage[500],
    marginTop: 1,
    opacity: 0.95,
  },
  metaTextHandwritten: {
    marginTop: 2,
    opacity: 0.88,
  },
  cornerCurl: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    borderBottomWidth: 9,
    borderLeftWidth: 9,
    borderBottomColor: palette.warm[100],
    borderLeftColor: "transparent",
    opacity: 0.9,
  },
  cornerCrease: {
    position: "absolute",
    right: 1,
    bottom: 4,
    width: 7,
    height: 1,
    backgroundColor: palette.warm[200],
    transform: [{ rotate: "-45deg" }],
    opacity: 0.9,
  },
  bottomGloss: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: palette.warm[100],
    opacity: 0.65,
  },
});
