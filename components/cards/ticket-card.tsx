import { useMemo, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";

import { palette } from "@/constants/palette";
import { CozyShadows } from "@/utils/shadows";
import { randomRotation } from "@/utils/random-rotation";
import type { Game } from "@/lib/types";
import { MountAdornment } from "./mount-adornment";

export interface TicketCardProps {
  game: Game;
  onPress?: (gameId: string) => void;
  seed?: number;
  rotation?: number;
}

const PLACEHOLDER_IMAGE =
  "https://image.api.playstation.com/vulcan/ap/disc/21/08/17/63257d9761f00696955e632732386120800b3950f6312450505470002.png";

export function TicketCard({
  game,
  onPress,
  seed = 4,
  rotation: rotationOverride,
}: TicketCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotation = useMemo(
    () => rotationOverride ?? randomRotation(seed),
    [rotationOverride, seed]
  );
  const imageSource = game.imageUri
    ? { uri: game.imageUri }
    : { uri: PLACEHOLDER_IMAGE };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 12,
    }).start();
  };

  const handlePress = () => {
    onPress?.(game.id);
  };

  const cardContent = (
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
          <Text style={styles.title} numberOfLines={1}>
            {game.title}
          </Text>
          {game.lastNote ? (
            <Text
              style={styles.noteText}
              numberOfLines={2}
              testID={`playing-card-note-${game.id}`}
            >
              {game.lastNote.whereLeftOff}
            </Text>
          ) : (
            <Text style={styles.label}>
              {game.playtime ?? "Now playing"}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View
      style={[styles.wrapper, { transform: [{ rotate: `${rotation}deg` }] }]}
      testID={`playing-card-${game.id}`}
    >
      <MountAdornment mountStyle={game.mountStyle} />
      {onPress ? (
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          testID={`playing-card-add-${game.id}`}
          accessibilityLabel={`Update bookmark for ${game.title}`}
          accessibilityRole="button"
        >
          <Animated.View
            style={[styles.pressableInner, { transform: [{ scale: scaleAnim }] }]}
          >
            {cardContent}
          </Animated.View>
        </Pressable>
      ) : (
        <View testID={`playing-card-${game.id}`}>{cardContent}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "flex-start",
    paddingTop: 10,
    marginBottom: 16,
  },
  pressableInner: {
    alignSelf: "flex-start",
  },
  card: {
    flexDirection: "row",
    backgroundColor: palette.cream.DEFAULT,
    height: 80,
    width: 220,
    borderWidth: 2,
    borderColor: "rgba(139, 99, 66, 0.28)",
    overflow: "hidden",
  },
  stub: {
    width: 56,
    backgroundColor: "rgba(196, 155, 107, 0.3)",
    borderRightWidth: 2,
    borderStyle: "dashed",
    borderRightColor: "rgba(139, 99, 66, 0.38)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
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
    backgroundColor: "rgba(250, 246, 241, 0.75)",
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
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Nunito",
    color: palette.text.primary,
    marginBottom: 2,
  },
  label: {
    fontSize: 9,
    fontFamily: "Nunito",
    color: palette.text.secondary,
    letterSpacing: 0.5,
  },
  noteText: {
    fontSize: 10,
    fontFamily: "Nunito",
    fontStyle: "italic",
    color: palette.text.secondary,
    lineHeight: 13,
  },
});
