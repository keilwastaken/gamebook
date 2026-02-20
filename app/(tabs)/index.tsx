import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  JournalOverlay,
  type JournalSizePreset,
} from "@/components/journal-overlay";
import {
  GRID_ACTIVE_BOTTOM_LEFT,
  GRID_ACTIVE_BOTTOM_RIGHT,
  GRID_ACTIVE_BOTTOM_ROW,
  GRID_ACTIVE_FULL_GRID,
  GRID_ACTIVE_LEFT_COLUMN,
  GRID_ACTIVE_RIGHT_COLUMN,
  GRID_ACTIVE_TOP_LEFT,
  GRID_ACTIVE_TOP_RIGHT,
  GRID_ACTIVE_TOP_ROW,
} from "@/components/ui/grid-glyph";
import { useGamesContext } from "@/lib/games-context";
import {
  applyBoardLayout,
  constrainSpanForCard,
  getCardSpan,
  getCardSpanPresets,
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

const DEFAULT_SIZE_PRESET_ORDER: JournalSizePreset[] = [
  { id: "top-left", w: 1, h: 1, activePositions: GRID_ACTIVE_TOP_LEFT },
  { id: "top-right", w: 1, h: 1, activePositions: GRID_ACTIVE_TOP_RIGHT },
  { id: "bottom-left", w: 1, h: 1, activePositions: GRID_ACTIVE_BOTTOM_LEFT },
  { id: "bottom-right", w: 1, h: 1, activePositions: GRID_ACTIVE_BOTTOM_RIGHT },
  { id: "top-row", w: 2, h: 1, activePositions: GRID_ACTIVE_TOP_ROW },
  { id: "bottom-row", w: 2, h: 1, activePositions: GRID_ACTIVE_BOTTOM_ROW },
  { id: "left-column", w: 1, h: 2, activePositions: GRID_ACTIVE_LEFT_COLUMN },
  { id: "right-column", w: 1, h: 2, activePositions: GRID_ACTIVE_RIGHT_COLUMN },
  { id: "full-grid", w: 2, h: 2, activePositions: GRID_ACTIVE_FULL_GRID },
];

const SIZE_PRESET_IDS_BY_TICKET_TYPE: Record<TicketType, string[]> = {
  polaroid: [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
    "top-row",
    "bottom-row",
    "left-column",
    "right-column",
    "full-grid",
  ],
  postcard: ["top-row", "bottom-row", "full-grid"],
  ticket: ["top-row", "bottom-row", "full-grid"],
  minimal: [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
    "top-row",
    "bottom-row",
    "left-column",
    "right-column",
    "full-grid",
  ],
  widget: [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
    "top-row",
    "bottom-row",
    "left-column",
    "right-column",
    "full-grid",
  ],
};

export default function HomeScreen() {
  const {
    playingGames,
    loading,
    saveNote,
    moveGameToBoardTarget,
    setGameSpanPreset,
  } = useGamesContext();
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
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
  } | null>(null);
  const consumeNextPress = useRef(false);
  const dragSpanRef = useRef<{ w: number; h: number }>({ w: 1, h: 1 });
  const targetSlotRef = useRef<{ x: number; y: number } | null>(null);
  const boardRef = useRef<View>(null);
  const boardOriginRef = useRef({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dropTargetKeyRef = useRef("");
  const dragXY = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dropTargetLeft = useRef(new Animated.Value(0)).current;
  const dropTargetTop = useRef(new Animated.Value(0)).current;
  const dropTargetWidth = useRef(new Animated.Value(0)).current;
  const dropTargetHeight = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const boardColumns = 4;
  const boardWidth = Math.max(200, width - 32);
  const cellWidth =
    (boardWidth - BOARD_GAP * (boardColumns - 1)) / boardColumns;
  const rowHeight = cellWidth * 1.28;
  const boardGames = useMemo(
    () =>
      playingGames.some((game) => !game.board)
        ? applyBoardLayout(playingGames, boardColumns)
        : playingGames,
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

  const animateDropTargetTo = useCallback(
    (target: { x: number; y: number; w: number; h: number }, immediate = false) => {
      const toLeft = target.x * (cellWidth + BOARD_GAP);
      const toTop = target.y * (rowHeight + BOARD_GAP);
      const toWidth = target.w * cellWidth + (target.w - 1) * BOARD_GAP;
      const toHeight = target.h * rowHeight + (target.h - 1) * BOARD_GAP;

      if (immediate) {
        dropTargetLeft.setValue(toLeft);
        dropTargetTop.setValue(toTop);
        dropTargetWidth.setValue(toWidth);
        dropTargetHeight.setValue(toHeight);
        return;
      }

      const springConfig = {
        damping: 24,
        stiffness: 260,
        mass: 0.6,
        useNativeDriver: false as const,
      };

      Animated.parallel([
        Animated.spring(dropTargetLeft, { toValue: toLeft, ...springConfig }),
        Animated.spring(dropTargetTop, { toValue: toTop, ...springConfig }),
        Animated.spring(dropTargetWidth, { toValue: toWidth, ...springConfig }),
        Animated.spring(dropTargetHeight, { toValue: toHeight, ...springConfig }),
      ]).start();
    },
    [
      cellWidth,
      rowHeight,
      dropTargetLeft,
      dropTargetTop,
      dropTargetWidth,
      dropTargetHeight,
    ]
  );

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

  const activeGameSpanPresets = useMemo(() => {
    if (!activeGame) return [];

    const spanPresets = getCardSpanPresets(activeGame.ticketType, boardColumns);
    const allowedPresetKeys = new Set(
      spanPresets.map((preset) => `${preset.w}x${preset.h}`)
    );

    if (activeGame.ticketType) {
      const presetMap = new Map(
        DEFAULT_SIZE_PRESET_ORDER.map((preset) => [preset.id, preset] as const)
      );
      return SIZE_PRESET_IDS_BY_TICKET_TYPE[activeGame.ticketType]
        .map((presetId) => presetMap.get(presetId))
        .filter((preset): preset is JournalSizePreset => Boolean(preset))
        .filter((preset) => allowedPresetKeys.has(`${preset.w}x${preset.h}`));
    }

    return spanPresets.map((preset) => ({
      id: `${preset.w}x${preset.h}`,
      ...preset,
    }));
  }, [activeGame, boardColumns]);
  const activeGameCurrentSpan = useMemo(() => {
    if (!activeGame) return { w: 1, h: 1 };
    return constrainSpanForCard(
      activeGame.ticketType,
      activeGame.board
        ? { w: activeGame.board.w, h: activeGame.board.h }
        : getCardSpan(activeGame.ticketType),
      boardColumns
    );
  }, [activeGame, boardColumns]);

  const handleSetActiveGameSpan = useCallback(
    async (preset: JournalSizePreset, movement: { x: number; y: number }) => {
      if (!activeGame) return;
      await setGameSpanPreset(
        activeGame.id,
        { w: preset.w, h: preset.h },
        boardColumns,
        movement
      );
    },
    [activeGame, setGameSpanPreset, boardColumns]
  );

  useEffect(() => {
    if (!activeGame) return;
    const latest = boardGames.find((game) => game.id === activeGame.id);
    if (latest && latest !== activeGame) {
      setActiveGame(latest);
    }
  }, [boardGames, activeGame]);

  const stopDragging = useCallback(() => {
    setDraggingId(null);
    setDragVisualSpan({ w: 1, h: 1 });
    setDragVisualScale(1);
    dragSpanRef.current = { w: 1, h: 1 };
    targetSlotRef.current = null;
    setDropTarget(null);
    dropTargetKeyRef.current = "";
  }, []);

  const updateDropTarget = useCallback(
    (left: number, top: number) => {
      if (!draggingId) return;
      const strideX = cellWidth + BOARD_GAP;
      const strideY = rowHeight + BOARD_GAP;
      const span = dragSpanRef.current;
      const dragWidth = span.w * cellWidth + (span.w - 1) * BOARD_GAP;
      const dragHeight = span.h * rowHeight + (span.h - 1) * BOARD_GAP;
      const dragCenterX = left + dragWidth / 2;
      const dragCenterY = top + dragHeight / 2;
      const maxRowsToScan = Math.max(
        boardRows + 3,
        Math.ceil((top + dragHeight) / strideY) + 3,
        6
      );

      let bestSlot: { x: number; y: number; distSq: number } | null = null;
      for (let candidateY = 0; candidateY <= maxRowsToScan; candidateY += 1) {
        for (let candidateX = 0; candidateX <= boardColumns - span.w; candidateX += 1) {
          const slotCenterX = candidateX * strideX + dragWidth / 2;
          const slotCenterY = candidateY * strideY + dragHeight / 2;
          const dx = dragCenterX - slotCenterX;
          const dy = dragCenterY - slotCenterY;
          const distSq = dx * dx + dy * dy;

          if (!bestSlot || distSq < bestSlot.distSq) {
            bestSlot = {
              x: candidateX,
              y: candidateY,
              distSq,
            };
          }
        }
      }

      let desiredX = bestSlot?.x ?? 0;
      let desiredY = bestSlot?.y ?? 0;

      const currentSlot = targetSlotRef.current;
      if (currentSlot && (currentSlot.x !== desiredX || currentSlot.y !== desiredY)) {
        const currentCenterX = currentSlot.x * strideX + dragWidth / 2;
        const currentCenterY = currentSlot.y * strideY + dragHeight / 2;
        const currentDx = dragCenterX - currentCenterX;
        const currentDy = dragCenterY - currentCenterY;
        const currentDistSq = currentDx * currentDx + currentDy * currentDy;
        const hysteresisSq = Math.pow(Math.min(strideX, strideY) * 0.2, 2);
        const nextDistSq = bestSlot?.distSq ?? Number.MAX_SAFE_INTEGER;
        if (nextDistSq + hysteresisSq >= currentDistSq) {
          desiredX = currentSlot.x;
          desiredY = currentSlot.y;
        }
      }

      const key = `${desiredX}-${desiredY}-${span.w}-${span.h}`;
      if (key !== dropTargetKeyRef.current) {
        dropTargetKeyRef.current = key;
        const nextTarget = {
          x: desiredX,
          y: desiredY,
          w: span.w,
          h: span.h,
        };
        targetSlotRef.current = { x: desiredX, y: desiredY };
        setDropTarget(nextTarget);
        animateDropTargetTo(nextTarget);
      }
    },
    [
      draggingId,
      boardColumns,
      cellWidth,
      rowHeight,
      boardRows,
      animateDropTargetTo,
    ]
  );

  const handleDrop = useCallback(async () => {
    if (!draggingId || !dropTarget) return;
    await moveGameToBoardTarget(draggingId, dropTarget, boardColumns);
    stopDragging();
  }, [
    draggingId,
    dropTarget,
    moveGameToBoardTarget,
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
          const left = Math.max(
            0,
            gestureState.moveX - boardOriginRef.current.x - dragOffsetRef.current.x
          );
          const top = Math.max(
            0,
            gestureState.moveY - boardOriginRef.current.y - dragOffsetRef.current.y
          );
          dragXY.setValue({ x: left, y: top });
          updateDropTarget(left, top);
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
                <View key={game.id}>
                  <Pressable
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
                      const lockedSpan = constrainSpanForCard(
                        ticketType,
                        { w: board.w, h: board.h },
                        boardColumns
                      );
                      dragSpanRef.current = lockedSpan;
                      setDragVisualSpan(lockedSpan);
                      setDragVisualScale(scale);
                      setDragIndex(index);
                      const initialTarget = {
                        x: board.x,
                        y: board.y,
                        w: lockedSpan.w,
                        h: lockedSpan.h,
                      };
                      targetSlotRef.current = { x: board.x, y: board.y };
                      dropTargetKeyRef.current = `${initialTarget.x}-${initialTarget.y}-${initialTarget.w}-${initialTarget.h}`;
                      setDropTarget(initialTarget);
                      animateDropTargetTo(initialTarget, true);
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
                </View>
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
                  <Animated.View
                    style={[
                      styles.dropTarget,
                      {
                        left: dropTargetLeft,
                        top: dropTargetTop,
                        width: dropTargetWidth,
                        height: dropTargetHeight,
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
          sizePresets={activeGameSpanPresets}
          currentSize={activeGameCurrentSpan}
          onSelectSize={(preset, movement) => {
            void handleSetActiveGameSpan(preset, movement);
          }}
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
