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

export interface MinimalCardProps {
  game: GameCardData;
  seed?: number;
  /** No rotation by default for this card - keeps digital feel */
  rotation?: number;
}

const PLACEHOLDER_IMAGE =
  "https://image.api.playstation.com/vulcan/ap/disc/21/08/17/63257d9761f00696955e632732386120800b3950f6312450505470002.png";

export function MinimalCard({
  game,
  seed = 5,
  rotation = 0,
}: MinimalCardProps) {
  const imageSource = game.imageUri
    ? { uri: game.imageUri }
    : { uri: PLACEHOLDER_IMAGE };

  return (
    <View style={[styles.wrapper, { transform: [{ rotate: `${rotation}deg` }] }]}>
      <MountAdornment mountStyle={game.mountStyle} />
      <View
        style={[
          styles.card,
          CozyShadows.base,
          { shadowOpacity: 0.04, elevation: 4 },
        ]}
      >
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
          <Text style={styles.metaText} numberOfLines={1}>
            {game.notePreview ?? game.playtime ?? "Now playing"}
          </Text>
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 12,
    width: 220,
    backgroundColor: palette.warm[50],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(125, 112, 99, 0.18)",
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
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
    fontSize: 14,
    fontWeight: "700",
    color: palette.text.primary,
  },
  metaText: {
    fontSize: 11,
    color: palette.text.secondary,
    marginTop: 6,
  },
});
