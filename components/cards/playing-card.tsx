import { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { palette } from "@/constants/palette";
import { CozyShadows } from "@/utils/shadows";
import type { Game } from "@/lib/types";

export interface PlayingCardProps {
  game: Game;
  onAddNote: (gameId: string) => void;
}

export function PlayingCard({ game, onAddNote }: PlayingCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
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

  const progressPercent = Math.round((game.progress ?? 0) * 100);

  return (
    <View style={styles.wrapper} testID={`playing-card-${game.id}`}>
      <View style={[styles.card, CozyShadows.base]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {game.title}
            </Text>
            {game.playtime && (
              <Text style={styles.playtime}>{game.playtime}</Text>
            )}
          </View>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>{progressPercent}%</Text>
          </View>
        </View>

        {game.lastNote && (
          <View style={styles.notePreview} testID={`playing-card-note-${game.id}`}>
            <Text style={styles.noteLabel}>Last bookmark</Text>
            <Text style={styles.noteText} numberOfLines={2}>
              {game.lastNote.whereLeftOff}
            </Text>
          </View>
        )}

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Pressable
            testID={`playing-card-add-${game.id}`}
            style={styles.addButton}
            onPress={() => onAddNote(game.id)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessibilityLabel={`Add note for ${game.title}`}
            accessibilityRole="button"
          >
            <Text style={styles.addButtonText}>+ Update Bookmark</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: palette.warm[50],
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.warm[200],
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Nunito",
    color: palette.text.primary,
    flex: 1,
    marginRight: 8,
  },
  playtime: {
    fontSize: 12,
    fontFamily: "Nunito",
    color: palette.text.secondary,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: palette.warm[200],
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: palette.sage[400],
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: "Nunito",
    fontWeight: "600",
    color: palette.sage[500],
    minWidth: 32,
    textAlign: "right",
  },
  notePreview: {
    backgroundColor: palette.warm[100],
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  noteLabel: {
    fontSize: 10,
    fontFamily: "Nunito",
    fontWeight: "700",
    color: palette.sage[400],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    fontFamily: "Nunito",
    color: palette.text.primary,
    lineHeight: 18,
  },
  addButton: {
    backgroundColor: palette.sage[500],
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Nunito",
    color: palette.cream.DEFAULT,
  },
});
