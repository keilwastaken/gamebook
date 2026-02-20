import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { palette } from "@/constants/palette";
import {
  MinimalCard,
  PolaroidCard,
  PostcardCard,
  TicketCard,
  WidgetCard,
} from "@/components/cards";
import { JournalOverlay } from "@/components/journal-overlay";
import { useGamesContext } from "@/lib/games-context";
import { DEFAULT_TICKET_TYPE, type Game } from "@/lib/types";

export default function HomeScreen() {
  const { playingGames, loading, saveNote } = useGamesContext();
  const [activeGame, setActiveGame] = useState<Game | null>(null);

  const dashboardGames = playingGames.filter(
    (game, index, list) =>
      list.findIndex(
        (candidate) =>
          (candidate.ticketType ?? DEFAULT_TICKET_TYPE) ===
          (game.ticketType ?? DEFAULT_TICKET_TYPE)
      ) === index
  );

  const handleAddNote = useCallback(
    (gameId: string) => {
      const game = dashboardGames.find((g) => g.id === gameId);
      if (game) setActiveGame(game);
    },
    [dashboardGames]
  );

  const handleSaveNote = useCallback(
    async (note: { whereLeftOff: string; quickThought?: string }) => {
      if (!activeGame) return;
      await saveNote(activeGame.id, note);
      setActiveGame(null);
    },
    [activeGame, saveNote]
  );

  const handleCloseJournal = useCallback(() => {
    setActiveGame(null);
  }, []);

  const renderCard = useCallback(
    (game: Game, index: number) => {
      const ticketType = game.ticketType ?? DEFAULT_TICKET_TYPE;
      const cardData = {
        ...game,
        notePreview: game.lastNote?.whereLeftOff,
        mountStyle: game.mountStyle,
        postcardSide: game.postcardSide,
      };
      const baseProps = { game: cardData, seed: index + 1 };

      if (ticketType === "ticket") {
        return (
          <TicketCard
            key={game.id}
            game={game}
            onPress={handleAddNote}
            seed={index + 1}
          />
        );
      }

      const card =
        ticketType === "postcard" ? (
          <PostcardCard {...baseProps} />
        ) : ticketType === "widget" ? (
          <WidgetCard {...baseProps} />
        ) : ticketType === "minimal" ? (
          <MinimalCard {...baseProps} />
        ) : (
          <PolaroidCard {...baseProps} />
        );

      return (
        <Pressable
          key={game.id}
          onPress={() => handleAddNote(game.id)}
          testID={`playing-card-add-${game.id}`}
          accessibilityLabel={`Update bookmark for ${game.title}`}
          accessibilityRole="button"
          style={styles.cardPressable}
        >
          <View testID={`playing-card-${game.id}`}>{card}</View>
        </Pressable>
      );
    },
    [handleAddNote]
  );

  return (
    <>
      <ScrollView
        testID="screen-home"
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Currently Playing</Text>
          <Text style={styles.subtitle}>
            {loading
              ? "Loading..."
              : `${dashboardGames.length} game${dashboardGames.length !== 1 ? "s" : ""}`}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={palette.sage[400]} size="large" />
          </View>
        ) : dashboardGames.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No games pinned yet.{"\n"}Add one to start your journey!
            </Text>
          </View>
        ) : (
          <View style={styles.ticketGrid}>
            {dashboardGames.map((game, index) => renderCard(game, index))}
          </View>
        )}
      </ScrollView>

      {activeGame && (
        <JournalOverlay
          game={activeGame}
          onSave={handleSaveNote}
          onClose={handleCloseJournal}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "transparent" },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Nunito",
    color: palette.warm[600],
    opacity: 0.9,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Nunito",
    color: palette.warm[600],
    opacity: 0.6,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Nunito",
    color: palette.text.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  ticketGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  cardPressable: {
    alignSelf: "flex-start",
  },
});
