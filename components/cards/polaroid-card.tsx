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
import { MountAdornment } from "./mount-adornment";
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
  const handwrittenTilt = seed % 2 === 0;

  return (
    <View style={[styles.wrapper, { transform: [{ rotate: `${rotation}deg` }] }]}>
      <MountAdornment mountStyle={game.mountStyle} />
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
            <Text
              style={[styles.metaText, handwrittenTilt && styles.metaTextHandwritten]}
              numberOfLines={1}
            >
              {game.playtime}
            </Text>
          ) : null}
        </View>
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
});
