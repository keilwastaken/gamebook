import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";

import { BoardViewport, type BoardViewportHandle } from "@/components/board";
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
  BOARD_GAP,
  chooseNearestAllowedSpan,
  getBoardMetrics,
  getDropTargetConflictCells,
  type GridCell,
} from "@/lib/board";
import {
  DEFAULT_BOARD_COLUMNS,
  applyBoardLayout,
  constrainSpanForCard,
  getAxisIntentSpan,
  getCardSpan,
  getCardSpanPresets,
} from "@/lib/board-layout";
import { DEFAULT_TICKET_TYPE, type Game, type TicketType } from "@/lib/types";

const BASE_CARD_SIZE: Record<TicketType, { width: number; height: number }> = {
  polaroid: { width: 140, height: 196 },
  postcard: { width: 228, height: 142 },
  widget: { width: 150, height: 98 },
  ticket: { width: 220, height: 90 },
  minimal: { width: 220, height: 84 },
};

const AUTO_SCROLL_EDGE_THRESHOLD = 112;
const AUTO_SCROLL_MIN_SPEED = 28;
const AUTO_SCROLL_MAX_SPEED = 340;
const AUTO_SCROLL_CAP_SLOWDOWN_PX = 96;
const MAX_DRAG_ROW_COUNT = 12;
const HAPTIC_TICK_MIN_INTERVAL_MS = 45;

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
  const boardViewportRef = useRef<BoardViewportHandle>(null);
  const boardRef = useRef<View>(null);
  const boardTopInScrollRef = useRef(0);
  const boardOriginRef = useRef({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dropTargetKeyRef = useRef("");
  const dragStartScrollOffsetRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const scrollViewportHeightRef = useRef(0);
  const scrollContentHeightRef = useRef(0);
  const autoScrollPointerRef = useRef<{ x: number; y: number } | null>(null);
  const autoScrollFrameRef = useRef<number | null>(null);
  const autoScrollLastTsRef = useRef<number | null>(null);
  const dragTargetHapticAtRef = useRef(0);
  const dragXY = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const jiggle = useRef(new Animated.Value(0)).current;
  const jiggleLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const dropTargetLeft = useRef(new Animated.Value(0)).current;
  const dropTargetTop = useRef(new Animated.Value(0)).current;
  const dropTargetWidth = useRef(new Animated.Value(0)).current;
  const dropTargetHeight = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  const boardColumns = DEFAULT_BOARD_COLUMNS;
  const { cellWidth, rowHeight } = useMemo(
    () => getBoardMetrics(width, boardColumns),
    [width, boardColumns]
  );
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
  const jiggleRotation = jiggle.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-0.7deg", "0deg", "0.7deg"],
  });

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

  const cancelAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current !== null) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
    autoScrollLastTsRef.current = null;
    autoScrollPointerRef.current = null;
  }, []);

  const stopDragging = useCallback(() => {
    cancelAutoScroll();
    jiggleLoopRef.current?.stop();
    jiggleLoopRef.current = null;
    jiggle.setValue(0);
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
    dragTargetHapticAtRef.current = 0;
    dragStartScrollOffsetRef.current = scrollOffsetRef.current;
  }, [cancelAutoScroll, jiggle]);

  useEffect(() => () => {
    cancelAutoScroll();
  }, [cancelAutoScroll]);

  useEffect(() => {
    jiggleLoopRef.current?.stop();
    jiggleLoopRef.current = null;
    jiggle.setValue(0);

    if (!draggingId) return;
    const sequence = Animated.sequence([
      Animated.timing(jiggle, { toValue: -1, duration: 120, useNativeDriver: true }),
      Animated.timing(jiggle, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(jiggle, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]);
    const loop = Animated.loop(sequence);
    jiggleLoopRef.current = loop;
    loop.start();
  }, [draggingId, jiggle]);

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
      const maxCandidateY = Math.max(0, MAX_DRAG_ROW_COUNT - span.h);
      const cappedRowsToScan = Math.min(maxRowsToScan, maxCandidateY);

      let bestSlot: { x: number; y: number; distSq: number } | null = null;
      for (let candidateY = 0; candidateY <= cappedRowsToScan; candidateY += 1) {
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
        const prevKey = dropTargetKeyRef.current;
        dropTargetKeyRef.current = key;
        const now = Date.now();
        if (prevKey && now - dragTargetHapticAtRef.current >= HAPTIC_TICK_MIN_INTERVAL_MS) {
          dragTargetHapticAtRef.current = now;
          void Haptics.selectionAsync().catch(() => {});
        }
        const nextTarget = {
          x: desiredX,
          y: desiredY,
          w: desiredW,
          h: desiredH,
        };
        const nextConflictCells = getDropTargetConflictCells(
          boardGames,
          draggingGame.id,
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

  const positionDragAtPointer = useCallback(
    (pointerX: number, pointerY: number) => {
      if (!draggingId) return;
      const baseSpan = dragBaseSpanRef.current;
      const scrollDelta = scrollOffsetRef.current - dragStartScrollOffsetRef.current;
      const rawLeft = pointerX - boardOriginRef.current.x - dragOffsetRef.current.x;
      const rawTop = pointerY - boardOriginRef.current.y - dragOffsetRef.current.y + scrollDelta;
      const maxLeft =
        Math.max(0, boardColumns - baseSpan.w) * (cellWidth + BOARD_GAP);
      const maxTop =
        Math.max(0, MAX_DRAG_ROW_COUNT - baseSpan.h) * (rowHeight + BOARD_GAP);
      const left = Math.max(0, Math.min(maxLeft, rawLeft));
      const top = Math.max(0, Math.min(maxTop, rawTop));
      dragXY.setValue({ x: left, y: top });
      updateDropTarget(left, top);
    },
    [draggingId, boardColumns, cellWidth, rowHeight, dragXY, updateDropTarget]
  );

  const getAutoScrollVelocity = useCallback((pointerY: number, viewportHeight: number) => {
      const edgeThreshold = Math.min(
        AUTO_SCROLL_EDGE_THRESHOLD,
        Math.max(28, Math.floor(viewportHeight * 0.45))
      );
      const topEdge = edgeThreshold;
      const bottomEdge = viewportHeight - edgeThreshold;
      let direction = 0;
      let intensity = 0;

      if (pointerY < topEdge) {
        direction = -1;
        intensity = Math.min(1, (topEdge - pointerY) / edgeThreshold);
      } else if (pointerY > bottomEdge) {
        direction = 1;
        intensity = Math.min(1, (pointerY - bottomEdge) / edgeThreshold);
      } else {
        return 0;
      }

      const eased = intensity * intensity;
      const speed =
        AUTO_SCROLL_MIN_SPEED + (AUTO_SCROLL_MAX_SPEED - AUTO_SCROLL_MIN_SPEED) * eased;
      return direction * speed;
  }, []);

  const tickAutoScroll = useCallback(
    (timestamp: number) => {
      autoScrollFrameRef.current = null;
      if (!draggingId) {
        autoScrollLastTsRef.current = null;
        return;
      }
      const pointer = autoScrollPointerRef.current;
      if (!pointer) {
        autoScrollLastTsRef.current = null;
        autoScrollFrameRef.current = requestAnimationFrame(tickAutoScroll);
        return;
      }
      const viewportHeight = scrollViewportHeightRef.current || height;
      const contentHeight = scrollContentHeightRef.current;
      const contentMaxOffset = Math.max(0, contentHeight - viewportHeight);
      const maxGridHeight =
        MAX_DRAG_ROW_COUNT * rowHeight + (MAX_DRAG_ROW_COUNT - 1) * BOARD_GAP;
      const gridMaxOffset = Math.max(
        0,
        boardTopInScrollRef.current + maxGridHeight - viewportHeight
      );
      const maxOffset = Math.min(contentMaxOffset, gridMaxOffset);
      const velocity = getAutoScrollVelocity(pointer.y, viewportHeight);
      if (maxOffset <= 0 || velocity === 0) {
        autoScrollLastTsRef.current = null;
        return;
      }
      const previousTs = autoScrollLastTsRef.current;
      const dt =
        previousTs === null
          ? 1 / 60
          : Math.min(0.05, Math.max(0.001, (timestamp - previousTs) / 1000));
      autoScrollLastTsRef.current = timestamp;

      const remainingUp = scrollOffsetRef.current;
      const remainingDown = maxOffset - scrollOffsetRef.current;
      const remainingInDirection = velocity < 0 ? remainingUp : remainingDown;
      const capSlowdown = Math.min(1, remainingInDirection / AUTO_SCROLL_CAP_SLOWDOWN_PX);
      const adjustedVelocity = velocity * capSlowdown;
      const delta = adjustedVelocity * dt;
      if (Math.abs(delta) >= 0.1) {
        const nextOffset = Math.max(0, Math.min(maxOffset, scrollOffsetRef.current + delta));
        if (nextOffset !== scrollOffsetRef.current) {
          scrollOffsetRef.current = nextOffset;
          boardViewportRef.current?.scrollTo({ y: nextOffset, animated: false });
          positionDragAtPointer(pointer.x, pointer.y);
        }
      }
      autoScrollFrameRef.current = requestAnimationFrame(tickAutoScroll);
    },
    [draggingId, getAutoScrollVelocity, height, rowHeight, positionDragAtPointer]
  );

  const queueAutoScrollForPointer = useCallback(
    (pointerX: number, pointerY: number) => {
      autoScrollPointerRef.current = { x: pointerX, y: pointerY };
      if (autoScrollFrameRef.current === null) {
        autoScrollLastTsRef.current = null;
        autoScrollFrameRef.current = requestAnimationFrame(tickAutoScroll);
      }
    },
    [tickAutoScroll]
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
          queueAutoScrollForPointer(gestureState.moveX, gestureState.moveY);
          positionDragAtPointer(gestureState.moveX, gestureState.moveY);
        },
        onPanResponderRelease: () => {
          void handleDrop();
        },
        onPanResponderTerminate: () => {
          stopDragging();
        },
      }),
    [draggingId, handleDrop, positionDragAtPointer, queueAutoScrollForPointer, stopDragging]
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

  const handleBoardScrollOffsetChange = useCallback((offsetY: number) => {
    scrollOffsetRef.current = offsetY;
  }, []);

  const handleBoardViewportHeightChange = useCallback((viewportHeight: number) => {
    scrollViewportHeightRef.current = viewportHeight;
  }, []);

  const handleBoardContentHeightChange = useCallback((contentHeight: number) => {
    scrollContentHeightRef.current = contentHeight;
  }, []);

  return (
    <>
      <BoardViewport
        ref={boardViewportRef}
        testID="screen-home"
        style={styles.scroll}
        dragging={draggingId !== null}
        screenWidth={width}
        onScrollOffsetChange={handleBoardScrollOffsetChange}
        onViewportHeightChange={handleBoardViewportHeightChange}
        onContentHeightChange={handleBoardContentHeightChange}
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
            onLayout={(event) => {
              boardTopInScrollRef.current = event.nativeEvent.layout.y;
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
                      dragStartScrollOffsetRef.current = scrollOffsetRef.current;
                      dragTargetHapticAtRef.current = 0;
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
                        y: Math.min(
                          board.y,
                          Math.max(0, MAX_DRAG_ROW_COUNT - lockedSpan.h)
                        ),
                        w: lockedSpan.w,
                        h: lockedSpan.h,
                      };
                      const initialConflictCells = getDropTargetConflictCells(
                        boardGames,
                        game.id,
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
                      <Animated.View
                        style={{
                          transform: [
                            { scale },
                            {
                              rotate: draggingId === game.id
                                ? "0.8deg"
                                : draggingId
                                  ? jiggleRotation
                                  : "0deg",
                            },
                          ],
                        }}
                      >
                        {renderCardVisual(game, index)}
                      </Animated.View>
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
      </BoardViewport>

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
