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

export interface TicketCardProps {
  game: GameCardData;
  seed?: number;
  rotation?: number;
}

const PLACEHOLDER_IMAGE =
  "https://image.api.playstation.com/vulcan/ap/disc/21/08/17/63257d9761f00696955e632732386120800b3950f6312450505470002.png";

export function TicketCard({
  game,
  seed = 4,
  rotation: rotationOverride,
}: TicketCardProps) {
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
        <View style={styles.stub}>
          <Text style={styles.admitOne}>ADMIT ONE</Text>
        </View>
        <View style={styles.perforationHoleTop} />
        <View style={styles.perforationHoleBottom} />
        <View style={styles.main}>
          <View style={styles.thumb}>
            <Image
              source={imageSource as ImageSourcePropType}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>NOW SHOWING</Text>
            <Text style={styles.title} numberOfLines={2}>
              {game.title}
            </Text>
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
    flexDirection: "row",
    backgroundColor: palette.cream.DEFAULT,
    height: 72,
    width: 200,
    borderWidth: 2,
    borderColor: "rgba(139, 99, 66, 0.2)",
    overflow: "hidden",
  },
  stub: {
    width: 56,
    backgroundColor: "rgba(196, 155, 107, 0.2)",
    borderRightWidth: 2,
    borderStyle: "dashed",
    borderRightColor: "rgba(139, 99, 66, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  admitOne: {
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "Nunito",
    color: palette.warm[600],
    letterSpacing: 0.5,
    transform: [{ rotate: "-90deg" }],
    textAlign: "center",
  },
  perforationHoleTop: {
    position: "absolute",
    left: 52,
    top: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.warm[300],
  },
  perforationHoleBottom: {
    position: "absolute",
    left: 52,
    bottom: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.warm[300],
  },
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    gap: 10,
  },
  thumb: {
    width: 36,
    height: 48,
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
  label: {
    fontSize: 9,
    color: palette.warm[600],
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.text.primary,
    lineHeight: 16,
  },
});
