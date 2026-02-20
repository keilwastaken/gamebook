import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
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
import { applyBoardLayout } from "@/lib/board-layout";
import { DEFAULT_TICKET_TYPE, type Game, type TicketType } from "@/lib/types";

const BOARD_GAP = 8;
const BASE_CARD_SIZE: Record<TicketType, { width: number; height: number }> = {
  polaroid: { width: 140, height: 196 },
  postcard: { width: 228, height: 142 },
  widget: { width: 150, height: 98 },
  ticket: { width: 220, height: 90 },
  minimal: { width: 220, height: 84 },
};

export default function HomeScreen() {
  const { playingGames, loading, saveNote } = useGamesContext();
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const { width } = useWindowDimensions();
  const boardColumns = 4;
  const boardWidth = Math.max(200, width - 32);
  const cellWidth =
    (boardWidth - BOARD_GAP * (boardColumns - 1)) / boardColumns;
  const rowHeight = cellWidth * 1.28;
  const boardGames = useMemo(
    () => applyBoardLayout(playingGames, boardColumns),
    [playingGames, boardColumns]
  );
  const boardRows = useMemo(
    () =>
      boardGames.reduce((max, game) => {
        const y = game.board?.y ?? 0;
        const h = game.board?.h ?? 1;
        return Math.max(max, y + h);
      }, 0),
    [boardGames]
  );
  const boardHeight =
    boardRows > 0 ? boardRows * rowHeight + (boardRows - 1) * BOARD_GAP : 0;

  const handleAddNote = useCallback(
    (gameId: string) => {
      const game = boardGames.find((g) => g.id === gameId);
      if (game) setActiveGame(game);
    },
    [boardGames]
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

  const renderCardVisual = useCallback((game: Game, index: number) => {
    const ticketType = game.ticketType ?? DEFAULT_TICKET_TYPE;
    const cardData = {
      ...game,
      notePreview: game.lastNote?.whereLeftOff,
      mountStyle: game.mountStyle,
      postcardSide: game.postcardSide,
    };
    const baseProps = { game: cardData, seed: index + 1 };

    if (ticketType === "postcard") return <PostcardCard {...baseProps} />;
    if (ticketType === "widget") return <WidgetCard {...baseProps} />;
    if (ticketType === "minimal") return <MinimalCard {...baseProps} />;
    if (ticketType === "ticket") return <TicketCard game={game} seed={index + 1} />;
    return <PolaroidCard {...baseProps} />;
  }, []);

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
              : `${boardGames.length} game${boardGames.length !== 1 ? "s" : ""}`}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={palette.sage[400]} size="large" />
          </View>
        ) : boardGames.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No games pinned yet.{"\n"}Add one to start your journey!
            </Text>
          </View>
        ) : (
          <View style={[styles.board, { height: boardHeight }]}>
            {boardGames.map((game, index) => {
              const board = game.board ?? { x: 0, y: index, w: 1, h: 1 };
              const ticketType = game.ticketType ?? DEFAULT_TICKET_TYPE;
              const baseSize = BASE_CARD_SIZE[ticketType];
              const slotWidth = board.w * cellWidth + (board.w - 1) * BOARD_GAP;
              const slotHeight = board.h * rowHeight + (board.h - 1) * BOARD_GAP;
              const scale = Math.min(
                (slotWidth - 2) / baseSize.width,
                (slotHeight - 2) / baseSize.height
              );

              return (
                <Pressable
                  key={game.id}
                  onPress={() => handleAddNote(game.id)}
                  testID={`playing-card-add-${game.id}`}
                  accessibilityLabel={`Update bookmark for ${game.title}`}
                  accessibilityRole="button"
                  style={[
                    styles.boardItem,
                    {
                      left: board.x * (cellWidth + BOARD_GAP),
                      top: board.y * (rowHeight + BOARD_GAP),
                      width: slotWidth,
                      height: slotHeight,
                    },
                  ]}
                >
                  <View style={styles.slotCenter} testID={`playing-card-${game.id}`}>
                    <View style={{ transform: [{ scale }] }}>
                      {renderCardVisual(game, index)}
                    </View>
                  </View>
                </Pressable>
              );
            })}
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
    paddingHorizontal: 16,
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
  board: {
    position: "relative",
  },
  boardItem: {
    position: "absolute",
  },
  slotCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
