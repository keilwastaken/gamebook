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

export interface WidgetCardProps {
  game: GameCardData;
  seed?: number;
  rotation?: number;
}

const PLACEHOLDER_IMAGE =
  "https://image.api.playstation.com/vulcan/ap/disc/21/08/17/63257d9761f00696955e632732386120800b3950f6312450505470002.png";

export function WidgetCard({
  game,
  seed = 3,
  rotation: rotationOverride,
}: WidgetCardProps) {
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
      <View style={[styles.card, CozyShadows.liftedBottom]}>
        <View style={styles.foldCorner} />
        <Text style={styles.header}>Playing...</Text>
        <View style={styles.row}>
          <View style={styles.thumb}>
            <Image
              source={imageSource as ImageSourcePropType}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {game.title}
            </Text>
            <Text style={styles.playtime}>
              {game.playtime ?? "—"}
            </Text>
          </View>
        </View>
        <View style={styles.rule} />
        <View style={styles.rule} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "flex-start",
    alignItems: "flex-end",
    paddingTop: 10,
  },
  card: {
    backgroundColor: palette.warm[100],
    padding: 12,
    width: 150,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(166, 124, 82, 0.25)",
    borderRadius: 4,
  },
  foldCorner: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderTopWidth: 16,
    borderLeftWidth: 16,
    borderTopColor: palette.warm[50],
    borderLeftColor: "transparent",
  },
  header: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.text.primary,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  thumb: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: palette.sage[200],
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.text.primary,
  },
  playtime: {
    fontSize: 10,
    color: palette.text.secondary,
    marginTop: 2,
  },
  rule: {
    height: 1,
    backgroundColor: "rgba(125, 112, 99, 0.2)",
    marginTop: 6,
  },
});
