import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
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
import {
  applyBoardLayout,
  constrainSpanForCard,
  findBestInsertion,
  getAxisIntentSpan,
  getCardSpan,
} from "@/lib/board-layout";
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
  const { playingGames, loading, saveNote, reorderGame } = useGamesContext();
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [, setDragSpan] = useState<{ w: number; h: number }>({ w: 1, h: 1 });
  const [dragVisualSpan, setDragVisualSpan] = useState<{ w: number; h: number }>({
    w: 1,
    h: 1,
  });
  const [dragVisualScale, setDragVisualScale] = useState(1);
  const [dragIndex, setDragIndex] = useState(0);
  const [dropTarget, setDropTarget] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
    insertionIndex: number;
  } | null>(null);
  const consumeNextPress = useRef(false);
  const dragSpanRef = useRef<{ w: number; h: number }>({ w: 1, h: 1 });
  const pendingSpanRef = useRef<{ w: number; h: number } | null>(null);
  const pendingSpanAtRef = useRef(0);
  const boardRef = useRef<View>(null);
  const boardOriginRef = useRef({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dropTargetKeyRef = useRef("");
  const dragXY = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
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
  const visibleRows = Math.max(
    boardRows || 1,
    dropTarget ? dropTarget.y + dropTarget.h + 1 : 0
  );
  const boardHeight =
    visibleRows > 0 ? visibleRows * rowHeight + (visibleRows - 1) * BOARD_GAP : 0;
  const dragSlotWidth =
    dragVisualSpan.w * cellWidth + (dragVisualSpan.w - 1) * BOARD_GAP;
  const dragSlotHeight =
    dragVisualSpan.h * rowHeight + (dragVisualSpan.h - 1) * BOARD_GAP;

  const getCardRenderScale = useCallback(
    (ticketType: TicketType) => {
      const baseSize = BASE_CARD_SIZE[ticketType];
      const defaultSpan = getCardSpan(ticketType);
      const getScaleForSpan = (w: number, h: number) =>
        Math.min(
          (w * cellWidth + (w - 1) * BOARD_GAP - 2) / baseSize.width,
          (h * rowHeight + (h - 1) * BOARD_GAP - 2) / baseSize.height
        );

      const defaultScale = getScaleForSpan(defaultSpan.w, defaultSpan.h);
      if (ticketType === "polaroid") {
        const swappedScale = getScaleForSpan(defaultSpan.h, defaultSpan.w);
        return Math.min(defaultScale, swappedScale);
      }
      return defaultScale;
    },
    [cellWidth, rowHeight]
  );

  const maybeApplyDragSpan = useCallback((candidate: { w: number; h: number }) => {
    const current = dragSpanRef.current;
    if (candidate.w === current.w && candidate.h === current.h) {
      pendingSpanRef.current = null;
      return current;
    }

    const now = Date.now();
    const pending = pendingSpanRef.current;
    if (pending && pending.w === candidate.w && pending.h === candidate.h) {
      if (now - pendingSpanAtRef.current >= 120) {
        dragSpanRef.current = candidate;
        setDragSpan(candidate);
        pendingSpanRef.current = null;
        return candidate;
      }
      return current;
    }

    pendingSpanRef.current = candidate;
    pendingSpanAtRef.current = now;
    return current;
  }, []);

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

  const stopDragging = useCallback(() => {
    setDraggingId(null);
    setDragSpan({ w: 1, h: 1 });
    setDragVisualSpan({ w: 1, h: 1 });
    setDragVisualScale(1);
    dragSpanRef.current = { w: 1, h: 1 };
    pendingSpanRef.current = null;
    pendingSpanAtRef.current = 0;
    setDropTarget(null);
    dropTargetKeyRef.current = "";
  }, []);

  const updateDropTarget = useCallback(
    (pointerX: number, pointerY: number) => {
      if (!draggingId) return;
      const moving = boardGames.find((game) => game.id === draggingId);
      const ticketType = moving?.ticketType ?? DEFAULT_TICKET_TYPE;
      const desiredSpan = {
        w: Math.max(
          1,
          Math.min(
            boardColumns,
            getAxisIntentSpan(pointerX, cellWidth + BOARD_GAP, boardColumns)
          )
        ),
        h: Math.max(1, getAxisIntentSpan(pointerY, rowHeight + BOARD_GAP)),
      };
      const constrained = constrainSpanForCard(ticketType, desiredSpan, boardColumns);
      const span = maybeApplyDragSpan(constrained);
      const strideX = cellWidth + BOARD_GAP;
      const strideY = rowHeight + BOARD_GAP;
      const clampedX = Math.max(
        0,
        Math.min(
          boardColumns - span.w,
          Math.round(pointerX / strideX - span.w / 2)
        )
      );
      const clampedY = Math.max(
        0,
        Math.round(pointerY / strideY - span.h / 2)
      );
      const result = findBestInsertion(
        boardGames,
        draggingId,
        clampedX,
        clampedY,
        boardColumns,
        span
      );
      const key = `${result.target.x}-${result.target.y}-${result.target.w}-${result.target.h}-${result.insertionIndex}`;
      if (key !== dropTargetKeyRef.current) {
        dropTargetKeyRef.current = key;
        setDropTarget({
          x: result.target.x,
          y: result.target.y,
          w: result.target.w,
          h: result.target.h,
          insertionIndex: result.insertionIndex,
        });
      }
    },
    [
      draggingId,
      boardGames,
      boardColumns,
      cellWidth,
      rowHeight,
      maybeApplyDragSpan,
    ]
  );

  const handleDrop = useCallback(async () => {
    if (!draggingId || !dropTarget) return;
    await reorderGame(draggingId, dropTarget.insertionIndex, boardColumns, {
      w: dropTarget.w,
      h: dropTarget.h,
    });
    stopDragging();
  }, [
    draggingId,
    dropTarget,
    reorderGame,
    boardColumns,
    stopDragging,
  ]);

  const boardPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () => draggingId !== null,
        onMoveShouldSetPanResponderCapture: () => draggingId !== null,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_evt, gestureState) => {
          if (!draggingId) return;
          const pointerX = Math.max(0, gestureState.moveX - boardOriginRef.current.x);
          const pointerY = Math.max(0, gestureState.moveY - boardOriginRef.current.y);
          const left = Math.max(
            0,
            gestureState.moveX - boardOriginRef.current.x - dragOffsetRef.current.x
          );
          const top = Math.max(
            0,
            gestureState.moveY - boardOriginRef.current.y - dragOffsetRef.current.y
          );
          dragXY.setValue({ x: left, y: top });
          updateDropTarget(pointerX, pointerY);
        },
        onPanResponderRelease: () => {
          void handleDrop();
        },
        onPanResponderTerminate: () => {
          stopDragging();
        },
      }),
    [draggingId, dragXY, handleDrop, stopDragging, updateDropTarget]
  );

  const draggingGame = useMemo(
    () => (draggingId ? boardGames.find((game) => game.id === draggingId) ?? null : null),
    [boardGames, draggingId]
  );

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
        scrollEnabled={draggingId === null}
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
          <View
            ref={boardRef}
            style={[styles.board, { height: boardHeight }]}
            onLayout={() => {
              boardRef.current?.measureInWindow((x, y) => {
                boardOriginRef.current = { x, y };
              });
            }}
            {...boardPanResponder.panHandlers}
          >
            {boardGames.map((game, index) => {
              const board = game.board ?? { x: 0, y: index, w: 1, h: 1 };
              const ticketType = game.ticketType ?? DEFAULT_TICKET_TYPE;
              const slotWidth = board.w * cellWidth + (board.w - 1) * BOARD_GAP;
              const slotHeight = board.h * rowHeight + (board.h - 1) * BOARD_GAP;
              const scale = getCardRenderScale(ticketType);
              const slotLeft = board.x * (cellWidth + BOARD_GAP);
              const slotTop = board.y * (rowHeight + BOARD_GAP);
              const isDragging = draggingId === game.id;

              return (
                <Pressable
                  key={game.id}
                  onPress={() => {
                    if (consumeNextPress.current || draggingId) {
                      consumeNextPress.current = false;
                      return;
                    }
                    handleAddNote(game.id);
                  }}
                  onLongPress={(event) => {
                    const locationX = event.nativeEvent.locationX;
                    const locationY = event.nativeEvent.locationY;
                    consumeNextPress.current = true;
                    boardRef.current?.measureInWindow((x, y) => {
                      boardOriginRef.current = { x, y };
                    });
                    dragOffsetRef.current = { x: locationX, y: locationY };
                    dragXY.setValue({ x: slotLeft, y: slotTop });
                    setDraggingId(game.id);
                    dragSpanRef.current = { w: board.w, h: board.h };
                    pendingSpanRef.current = null;
                    pendingSpanAtRef.current = 0;
                    setDragSpan({ w: board.w, h: board.h });
                    setDragVisualSpan({ w: board.w, h: board.h });
                    setDragVisualScale(scale);
                    setDragIndex(index);
                    const initial = findBestInsertion(
                      boardGames,
                      game.id,
                      board.x,
                      board.y,
                      boardColumns,
                      { w: board.w, h: board.h }
                    );
                    dropTargetKeyRef.current = `${initial.target.x}-${initial.target.y}-${initial.target.w}-${initial.target.h}-${initial.insertionIndex}`;
                    setDropTarget({
                      x: initial.target.x,
                      y: initial.target.y,
                      w: initial.target.w,
                      h: initial.target.h,
                      insertionIndex: initial.insertionIndex,
                    });
                  }}
                  delayLongPress={220}
                  testID={`playing-card-add-${game.id}`}
                  accessibilityLabel={`Update bookmark for ${game.title}`}
                  accessibilityRole="button"
                  style={[
                    styles.boardItem,
                    {
                      left: slotLeft,
                      top: slotTop,
                      width: slotWidth,
                      height: slotHeight,
                      zIndex: isDragging ? 1 : 2,
                      opacity: isDragging ? 0.18 : 1,
                    },
                  ]}
                >
                  <View style={styles.slotCenter} testID={`playing-card-${game.id}`}>
                    <View
                      style={{
                        transform: [
                          { scale },
                          { rotate: draggingId === game.id ? "0.8deg" : "0deg" },
                        ],
                      }}
                    >
                      {renderCardVisual(game, index)}
                    </View>
                  </View>
                </Pressable>
              );
            })}
            {draggingGame ? (
              <View pointerEvents="none" style={styles.gridOverlay}>
                {Array.from({ length: visibleRows * boardColumns }).map((_, index) => {
                  const row = Math.floor(index / boardColumns);
                  const col = index % boardColumns;
                  return (
                    <View
                      key={`grid-${col}-${row}`}
                      style={[
                        styles.gridCell,
                        {
                          left: col * (cellWidth + BOARD_GAP),
                          top: row * (rowHeight + BOARD_GAP),
                          width: cellWidth,
                          height: rowHeight,
                        },
                      ]}
                    />
                  );
                })}
                {dropTarget ? (
                  <View
                    style={[
                      styles.dropTarget,
                      {
                        left: dropTarget.x * (cellWidth + BOARD_GAP),
                        top: dropTarget.y * (rowHeight + BOARD_GAP),
                        width: dropTarget.w * cellWidth + (dropTarget.w - 1) * BOARD_GAP,
                        height: dropTarget.h * rowHeight + (dropTarget.h - 1) * BOARD_GAP,
                      },
                    ]}
                  />
                ) : null}
              </View>
            ) : null}
            {draggingGame ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.dragOverlay,
                  {
                    width: dragSlotWidth,
                    height: dragSlotHeight,
                    transform: [{ translateX: dragXY.x }, { translateY: dragXY.y }],
                  },
                ]}
              >
                <View style={styles.slotCenter}>
                  <View
                    style={{ transform: [{ scale: dragVisualScale }, { rotate: "0.8deg" }] }}
                  >
                    {renderCardVisual(draggingGame, dragIndex)}
                  </View>
                </View>
              </Animated.View>
            ) : null}
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
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  gridCell: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(125, 112, 99, 0.16)",
    backgroundColor: "rgba(245, 240, 232, 0.14)",
    borderRadius: 6,
  },
  dropTarget: {
    position: "absolute",
    borderWidth: 2,
    borderColor: palette.sage[500],
    backgroundColor: "rgba(107, 139, 94, 0.14)",
    borderRadius: 8,
  },
  dragOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 30,
  },
  slotCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
