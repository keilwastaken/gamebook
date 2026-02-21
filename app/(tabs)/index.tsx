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
import { JournalOverlay } from "@/components/journal-overlay";
import { useGamesContext } from "@/lib/games-context";
import {
  applyBoardLayout,
  constrainSpanForCard,
  getAxisIntentSpan,
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

type GridRect = { x: number; y: number; w: number; h: number };
type GridCell = { x: number; y: number };

function chooseNearestAllowedSpan(
  presets: Array<{ w: number; h: number }>,
  intent: { w: number; h: number },
  fallback: { w: number; h: number }
): { w: number; h: number } {
  const exact = presets.find((preset) => preset.w === intent.w && preset.h === intent.h);
  if (exact) return exact;

  const fallbackPreset =
    presets.find((preset) => preset.w === fallback.w && preset.h === fallback.h) ?? presets[0];

  return presets.reduce((best, preset) => {
    const bestScore = Math.abs(best.w - intent.w) + Math.abs(best.h - intent.h);
    const nextScore = Math.abs(preset.w - intent.w) + Math.abs(preset.h - intent.h);
    if (nextScore < bestScore) return preset;
    if (nextScore > bestScore) return best;

    const bestAreaDelta = Math.abs(best.w * best.h - intent.w * intent.h);
    const nextAreaDelta = Math.abs(preset.w * preset.h - intent.w * intent.h);
    if (nextAreaDelta < bestAreaDelta) return preset;
    if (nextAreaDelta > bestAreaDelta) return best;

    const bestIsFallback = best.w === fallbackPreset.w && best.h === fallbackPreset.h;
    const nextIsFallback = preset.w === fallbackPreset.w && preset.h === fallbackPreset.h;
    if (nextIsFallback && !bestIsFallback) return preset;

    return best;
  }, fallbackPreset);
}

function normalizePlacementForGame(game: Game, columns: number): GridRect {
  const rawSpan = game.board ? { w: game.board.w, h: game.board.h } : getCardSpan(game.ticketType);
  const span = constrainSpanForCard(game.ticketType, rawSpan, columns);
  const maxX = Math.max(0, columns - span.w);

  return {
    x: Math.max(0, Math.min(game.board?.x ?? 0, maxX)),
    y: Math.max(0, game.board?.y ?? 0),
    w: span.w,
    h: span.h,
  };
}

function normalizePlacementForTarget(
  ticketType: TicketType | undefined,
  target: GridRect,
  columns: number
): GridRect {
  const span = constrainSpanForCard(ticketType, { w: target.w, h: target.h }, columns);
  const maxX = Math.max(0, columns - span.w);

  return {
    x: Math.max(0, Math.min(target.x, maxX)),
    y: Math.max(0, target.y),
    w: span.w,
    h: span.h,
  };
}

function getNoPushDropTargetConflictCells(
  games: Game[],
  draggingGame: Game,
  target: GridRect,
  columns: number
): GridCell[] {
  const placements = new Map<string, GridRect>();
  for (const game of games) {
    placements.set(game.id, normalizePlacementForGame(game, columns));
  }

  const movingTo = normalizePlacementForTarget(draggingGame.ticketType, target, columns);
  const occupied = new Set<string>();
  for (const game of games) {
    if (game.id === draggingGame.id) continue;
    const placement = placements.get(game.id);
    if (!placement) continue;
    for (let y = placement.y; y < placement.y + placement.h; y += 1) {
      for (let x = placement.x; x < placement.x + placement.w; x += 1) {
        occupied.add(`${x},${y}`);
      }
    }
  }

  const conflicts: GridCell[] = [];
  for (let y = movingTo.y; y < movingTo.y + movingTo.h; y += 1) {
    for (let x = movingTo.x; x < movingTo.x + movingTo.w; x += 1) {
      if (occupied.has(`${x},${y}`)) conflicts.push({ x, y });
    }
  }

  return conflicts;
}

export default function HomeScreen() {
  const {
    playingGames,
    loading,
    saveNote,
    moveGameToBoardTarget,
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
  const [dropTargetConflictCells, setDropTargetConflictCells] = useState<GridCell[]>([]);
  const dropTargetConflictKeyRef = useRef("");
  const dropTargetRef = useRef<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const consumeNextPress = useRef(false);
  const dragBaseSpanRef = useRef<{ w: number; h: number }>({ w: 1, h: 1 });
  const targetSlotRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
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
    dragBaseSpanRef.current = { w: 1, h: 1 };
    targetSlotRef.current = null;
    setDropTarget(null);
    setDropTargetConflictCells([]);
    dropTargetConflictKeyRef.current = "";
    dropTargetRef.current = null;
    dropTargetKeyRef.current = "";
  }, []);

  const updateDropTarget = useCallback(
    (left: number, top: number) => {
      if (!draggingId) return;
      const draggingGame = boardGames.find((game) => game.id === draggingId);
      if (!draggingGame) return;

      const strideX = cellWidth + BOARD_GAP;
      const strideY = rowHeight + BOARD_GAP;
      const baseSpan = dragBaseSpanRef.current;
      const baseDragWidth = baseSpan.w * cellWidth + (baseSpan.w - 1) * BOARD_GAP;
      const baseDragHeight = baseSpan.h * rowHeight + (baseSpan.h - 1) * BOARD_GAP;
      const dragCenterX = left + baseDragWidth / 2;
      const dragCenterY = top + baseDragHeight / 2;

      const allowedPresets = getCardSpanPresets(draggingGame.ticketType, boardColumns);
      const maxAllowedW = Math.max(...allowedPresets.map((preset) => preset.w));
      const maxAllowedH = Math.max(...allowedPresets.map((preset) => preset.h));
      const intentSpan = {
        w: getAxisIntentSpan(dragCenterX, strideX, maxAllowedW),
        h: getAxisIntentSpan(dragCenterY, strideY, maxAllowedH),
      };
      const span = chooseNearestAllowedSpan(allowedPresets, intentSpan, baseSpan);
      const dragWidth = span.w * cellWidth + (span.w - 1) * BOARD_GAP;
      const dragHeight = span.h * rowHeight + (span.h - 1) * BOARD_GAP;
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
      let desiredW = span.w;
      let desiredH = span.h;

      const currentSlot = targetSlotRef.current;
      if (
        currentSlot &&
        (currentSlot.x !== desiredX ||
          currentSlot.y !== desiredY ||
          currentSlot.w !== desiredW ||
          currentSlot.h !== desiredH)
      ) {
        const currentDragWidth =
          currentSlot.w * cellWidth + (currentSlot.w - 1) * BOARD_GAP;
        const currentDragHeight =
          currentSlot.h * rowHeight + (currentSlot.h - 1) * BOARD_GAP;
        const currentCenterX = currentSlot.x * strideX + currentDragWidth / 2;
        const currentCenterY = currentSlot.y * strideY + currentDragHeight / 2;
        const currentDx = dragCenterX - currentCenterX;
        const currentDy = dragCenterY - currentCenterY;
        const currentDistSq = currentDx * currentDx + currentDy * currentDy;
        const hysteresisSq = Math.pow(Math.min(strideX, strideY) * 0.2, 2);
        const nextDistSq = bestSlot?.distSq ?? Number.MAX_SAFE_INTEGER;
        if (nextDistSq + hysteresisSq >= currentDistSq) {
          desiredX = currentSlot.x;
          desiredY = currentSlot.y;
          desiredW = currentSlot.w;
          desiredH = currentSlot.h;
        }
      }

      const key = `${desiredX}-${desiredY}-${desiredW}-${desiredH}`;
      if (key !== dropTargetKeyRef.current) {
        dropTargetKeyRef.current = key;
        const nextTarget = {
          x: desiredX,
          y: desiredY,
          w: desiredW,
          h: desiredH,
        };
        const nextConflictCells = getNoPushDropTargetConflictCells(
          boardGames,
          draggingGame,
          nextTarget,
          boardColumns
        );
        const nextConflictKey = nextConflictCells.map((cell) => `${cell.x},${cell.y}`).join("|");
        if (dropTargetConflictKeyRef.current !== nextConflictKey) {
          dropTargetConflictKeyRef.current = nextConflictKey;
          setDropTargetConflictCells(nextConflictCells);
        }
        targetSlotRef.current = nextTarget;
        setDropTarget(nextTarget);
        dropTargetRef.current = nextTarget;
        animateDropTargetTo(nextTarget);
      }
    },
    [
      draggingId,
      boardColumns,
      cellWidth,
      rowHeight,
      boardRows,
      boardGames,
      animateDropTargetTo,
    ]
  );

  const handleDrop = useCallback(async () => {
    const currentTarget = dropTargetRef.current;
    if (!draggingId || !currentTarget) return;
    await moveGameToBoardTarget(draggingId, currentTarget, boardColumns);
    stopDragging();
  }, [
    draggingId,
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
                      dragBaseSpanRef.current = lockedSpan;
                      setDragVisualSpan(lockedSpan);
                      setDragVisualScale(scale);
                      setDragIndex(index);
                      const initialTarget = {
                        x: board.x,
                        y: board.y,
                        w: lockedSpan.w,
                        h: lockedSpan.h,
                      };
                      const initialConflictCells = getNoPushDropTargetConflictCells(
                        boardGames,
                        game,
                        initialTarget,
                        boardColumns
                      );
                      dropTargetConflictKeyRef.current = initialConflictCells
                        .map((cell) => `${cell.x},${cell.y}`)
                        .join("|");
                      setDropTargetConflictCells(initialConflictCells);
                      targetSlotRef.current = initialTarget;
                      dropTargetKeyRef.current = `${initialTarget.x}-${initialTarget.y}-${initialTarget.w}-${initialTarget.h}`;
                      setDropTarget(initialTarget);
                      dropTargetRef.current = initialTarget;
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
                    testID="drop-target-indicator"
                    style={[
                      styles.dropTarget,
                      styles.dropTargetActive,
                      {
                        left: dropTargetLeft,
                        top: dropTargetTop,
                        width: dropTargetWidth,
                        height: dropTargetHeight,
                      },
                    ]}
                  />
                ) : null}
                {dropTargetConflictCells.map((cell) => (
                  <View
                    key={`drop-target-conflict-${cell.x}-${cell.y}`}
                    testID={`drop-target-conflict-${cell.x}-${cell.y}`}
                    style={[
                      styles.dropTargetConflictCell,
                      {
                        left: cell.x * (cellWidth + BOARD_GAP),
                        top: cell.y * (rowHeight + BOARD_GAP),
                        width: cellWidth,
                        height: rowHeight,
                      },
                    ]}
                  />
                ))}
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
    borderRadius: 8,
  },
  dropTargetActive: {
    borderColor: palette.sage[500],
    backgroundColor: palette.sage[100],
  },
  dropTargetConflictCell: {
    position: "absolute",
    borderWidth: 2,
    borderColor: palette.clay[600],
    backgroundColor: palette.clay[100],
    borderRadius: 6,
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
