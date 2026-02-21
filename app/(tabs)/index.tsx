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
import { CaretDownIcon, CaretUpIcon } from "phosphor-react-native";

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
  getBoardWidth,
  getDropTargetConflictCells,
  type GridCell,
} from "@/lib/board";
import {
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
const HOME_BOARD_COLUMN_COUNT = 4;
const HOME_BOARD_ROW_COUNT = 6;
const HAPTIC_TICK_MIN_INTERVAL_MS = 45;
const BOARD_PAGE_SWIPE_LOCK_DISTANCE_PX = 14;
const BOARD_PAGE_SWIPE_LOCK_AXIS_RATIO = 1.3;
const BOARD_PAGE_SWIPE_DISTANCE_PX = 68;
const BOARD_PAGE_SWIPE_VELOCITY_PX = 0.42;
const BOARD_PAGE_SWIPE_EDGE_RESISTANCE = 0.32;
const BOARD_PAGE_TRACK_GAP_PX = 18;
const BOARD_PAGE_DRAG_SWITCH_EDGE_RATIO = 0.075;
const BOARD_PAGE_DRAG_SWITCH_MIN_PX = 34;
const BOARD_PAGE_DRAG_SWITCH_MAX_PX = 72;
const BOARD_PAGE_DRAG_SWITCH_DWELL_MS = 180;
const BOARD_PAGE_DRAG_SWITCH_COOLDOWN_MS = 560;

export default function HomeScreen() {
  const {
    playingGames,
    loading,
    currentHomePage,
    setCurrentHomePage,
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
  const dragPointerRef = useRef<{ x: number; y: number } | null>(null);
  const dragPageSwitchAtRef = useRef(0);
  const dragPageSwitchEdgeIntentRef = useRef<{ direction: -1 | 1; enteredAt: number } | null>(
    null
  );
  const pageTrackX = useRef(new Animated.Value(0)).current;
  const pageGestureActiveRef = useRef(false);
  const pageAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const pageAnimationInFlightRef = useRef(false);
  const dragXY = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const jiggle = useRef(new Animated.Value(0)).current;
  const jiggleLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const dropTargetLeft = useRef(new Animated.Value(0)).current;
  const dropTargetTop = useRef(new Animated.Value(0)).current;
  const dropTargetWidth = useRef(new Animated.Value(0)).current;
  const dropTargetHeight = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  const boardColumns = HOME_BOARD_COLUMN_COUNT;
  const [activePage, setActivePage] = useState(currentHomePage);
  const [pageMenuOpen, setPageMenuOpen] = useState(false);
  const [manualPageCount, setManualPageCount] = useState(1);
  const [draggingGameSnapshot, setDraggingGameSnapshot] = useState<Game | null>(null);
  const boardWidth = useMemo(() => getBoardWidth(width), [width]);
  const pageStride = boardWidth + BOARD_PAGE_TRACK_GAP_PX;
  const { cellWidth, rowHeight } = useMemo(
    () => getBoardMetrics(width, boardColumns),
    [width, boardColumns]
  );
  const laidOutBoardGames = useMemo(
    () =>
      playingGames.some((game) => !game.board)
        ? applyBoardLayout(playingGames, boardColumns)
        : playingGames,
    [playingGames, boardColumns]
  );
  const pageCountFromGames = useMemo(
    () =>
      laidOutBoardGames.reduce((maxPages, game) => {
        const row = Math.max(0, game.board?.y ?? 0);
        const pageIndex = Math.floor(row / HOME_BOARD_ROW_COUNT);
        return Math.max(maxPages, pageIndex + 1);
      }, 1),
    [laidOutBoardGames]
  );
  const pageCount = Math.max(pageCountFromGames, manualPageCount);
  const pageRowOffset = activePage * HOME_BOARD_ROW_COUNT;
  const boardGamesByPage = useMemo(() => {
    const byPage = new Map<number, Game[]>();
    laidOutBoardGames.forEach((game) => {
      if (!game.board) {
        const pageZeroGames = byPage.get(0) ?? [];
        pageZeroGames.push(game);
        byPage.set(0, pageZeroGames);
        return;
      }

      const sourceRow = Math.max(0, game.board.y);
      const pageIndex = Math.floor(sourceRow / HOME_BOARD_ROW_COUNT);
      const pageStartRow = pageIndex * HOME_BOARD_ROW_COUNT;
      const pageGames = byPage.get(pageIndex) ?? [];
      pageGames.push({
        ...game,
        board: {
          ...game.board,
          y: Math.max(0, sourceRow - pageStartRow),
        },
      });
      byPage.set(pageIndex, pageGames);
    });
    return byPage;
  }, [laidOutBoardGames]);
  const boardGames = useMemo(
    () => boardGamesByPage.get(activePage) ?? [],
    [boardGamesByPage, activePage]
  );
  const boardHeight =
    HOME_BOARD_ROW_COUNT > 0
      ? HOME_BOARD_ROW_COUNT * rowHeight + (HOME_BOARD_ROW_COUNT - 1) * BOARD_GAP
      : 0;
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
    setActivePage((prev) => Math.max(0, Math.min(prev, pageCount - 1)));
  }, [pageCount]);

  useEffect(() => {
    setCurrentHomePage(activePage);
  }, [activePage, setCurrentHomePage]);

  useEffect(() => {
    if (!activeGame) return;
    const latest = laidOutBoardGames.find((game) => game.id === activeGame.id);
    if (latest && latest !== activeGame) {
      setActiveGame(latest);
    }
  }, [laidOutBoardGames, activeGame]);

  const stopPageTrackAnimation = useCallback(() => {
    pageAnimationRef.current?.stop();
    pageAnimationRef.current = null;
    pageAnimationInFlightRef.current = false;
  }, []);

  const animatePageTrackTo = useCallback(
    (toValue: number, onSettled?: () => void) => {
      stopPageTrackAnimation();
      if (process.env.NODE_ENV === "test") {
        pageTrackX.setValue(toValue);
        onSettled?.();
        return;
      }
      pageAnimationInFlightRef.current = true;
      const animation = Animated.spring(pageTrackX, {
        toValue,
        damping: 32,
        stiffness: 210,
        mass: 0.9,
        useNativeDriver: true,
      });
      pageAnimationRef.current = animation;
      animation.start(() => {
        if (pageAnimationRef.current === animation) {
          pageAnimationRef.current = null;
          pageAnimationInFlightRef.current = false;
        }
        onSettled?.();
      });
    },
    [pageTrackX, stopPageTrackAnimation]
  );

  const handleGoToPage = useCallback(
    (pageIndex: number) => {
      const nextPage = Math.max(0, Math.min(pageCount - 1, pageIndex));
      setActivePage(nextPage);
      animatePageTrackTo(-nextPage * pageStride);
    },
    [animatePageTrackTo, pageCount, pageStride]
  );

  const handleCreatePage = useCallback(() => {
    const nextPage = pageCount;
    setManualPageCount(pageCount + 1);
    setPageMenuOpen(false);
    setActivePage(nextPage);
    animatePageTrackTo(-nextPage * pageStride);
  }, [animatePageTrackTo, pageCount, pageStride]);

  const handleSelectPage = useCallback(
    (pageIndex: number) => {
      setPageMenuOpen(false);
      handleGoToPage(pageIndex);
    },
    [handleGoToPage]
  );

  useEffect(() => {
    if (pageGestureActiveRef.current || pageAnimationInFlightRef.current) return;
    pageTrackX.setValue(-activePage * pageStride);
  }, [activePage, pageStride, pageTrackX]);

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
    dragPointerRef.current = null;
    dragPageSwitchAtRef.current = 0;
    dragPageSwitchEdgeIntentRef.current = null;
    setDraggingGameSnapshot(null);
    dragStartScrollOffsetRef.current = scrollOffsetRef.current;
  }, [cancelAutoScroll, jiggle]);

  useEffect(() => () => {
    cancelAutoScroll();
    stopPageTrackAnimation();
  }, [cancelAutoScroll, stopPageTrackAnimation]);

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
      const draggingGame = laidOutBoardGames.find((game) => game.id === draggingId);
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
      const maxCandidateY = Math.max(0, HOME_BOARD_ROW_COUNT - span.h);

      let bestSlot: { x: number; y: number; distSq: number } | null = null;
      for (let candidateY = 0; candidateY <= maxCandidateY; candidateY += 1) {
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
        // When dragging across pages, the source card may not be in this page's list yet.
        // Include a synthetic copy so conflict detection still resolves span/ticket rules.
        const conflictScopeGames = boardGames.some((game) => game.id === draggingGame.id)
          ? boardGames
          : [
              ...boardGames,
              {
                ...draggingGame,
                board: {
                  x: 0,
                  y: 0,
                  w: baseSpan.w,
                  h: baseSpan.h,
                  columns: boardColumns,
                },
              },
            ];
        const nextConflictCells = getDropTargetConflictCells(
          conflictScopeGames,
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
      boardGames,
      laidOutBoardGames,
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
        Math.max(0, HOME_BOARD_ROW_COUNT - baseSpan.h) * (rowHeight + BOARD_GAP);
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
      const maxOffset = contentMaxOffset;
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
    [draggingId, getAutoScrollVelocity, height, positionDragAtPointer]
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

  const maybeSwitchPageWhileDragging = useCallback(
    (pointerX: number, pointerY: number) => {
      if (!draggingId || pageCount <= 1) return;
      const edgeThreshold = Math.min(
        BOARD_PAGE_DRAG_SWITCH_MAX_PX,
        Math.max(BOARD_PAGE_DRAG_SWITCH_MIN_PX, width * BOARD_PAGE_DRAG_SWITCH_EDGE_RATIO)
      );

      let direction: -1 | 1 | 0 = 0;
      if (pointerX <= edgeThreshold) direction = -1;
      if (pointerX >= width - edgeThreshold) direction = 1;
      if (direction === 0) {
        dragPageSwitchEdgeIntentRef.current = null;
        return;
      }

      const nextPage = Math.max(0, Math.min(pageCount - 1, activePage + direction));
      const now = Date.now();
      const priorIntent = dragPageSwitchEdgeIntentRef.current;
      if (!priorIntent || priorIntent.direction !== direction) {
        dragPageSwitchEdgeIntentRef.current = { direction, enteredAt: now };
        return;
      }
      if (now - priorIntent.enteredAt < BOARD_PAGE_DRAG_SWITCH_DWELL_MS) return;
      if (nextPage === activePage) return;
      if (now - dragPageSwitchAtRef.current < BOARD_PAGE_DRAG_SWITCH_COOLDOWN_MS) return;

      dragPageSwitchAtRef.current = now;
      dragPageSwitchEdgeIntentRef.current = { direction, enteredAt: now };
      dragPointerRef.current = { x: pointerX, y: pointerY };
      setPageMenuOpen(false);
      setActivePage(nextPage);
      animatePageTrackTo(-nextPage * pageStride);
      void Haptics.selectionAsync().catch(() => {});
    },
    [draggingId, pageCount, width, activePage, pageStride, animatePageTrackTo]
  );

  useEffect(() => {
    if (!draggingId) return;
    const pointer = dragPointerRef.current;
    if (!pointer) return;

    const frame = requestAnimationFrame(() => {
      boardRef.current?.measureInWindow((x, y) => {
        boardOriginRef.current = { x, y };
        positionDragAtPointer(pointer.x, pointer.y);
      });
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [activePage, draggingId, positionDragAtPointer]);

  useEffect(() => {
    if (!draggingId) return;

    let frame: number;
    const tick = () => {
      const pointer = dragPointerRef.current;
      if (pointer) {
        maybeSwitchPageWhileDragging(pointer.x, pointer.y);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [draggingId, maybeSwitchPageWhileDragging]);

  const handleDrop = useCallback(async () => {
    const currentTarget = dropTargetRef.current;
    if (!draggingId || !currentTarget) return;
    await moveGameToBoardTarget(
      draggingId,
      {
        ...currentTarget,
        y: currentTarget.y + pageRowOffset,
      },
      boardColumns
    );
    stopDragging();
  }, [
    draggingId,
    moveGameToBoardTarget,
    pageRowOffset,
    boardColumns,
    stopDragging,
  ]);

  const getSwipeDxWithResistance = useCallback(
    (dx: number) => {
      if (dx > 0 && activePage <= 0) return dx * BOARD_PAGE_SWIPE_EDGE_RESISTANCE;
      if (dx < 0 && activePage >= pageCount - 1) return dx * BOARD_PAGE_SWIPE_EDGE_RESISTANCE;
      return dx;
    },
    [activePage, pageCount]
  );

  const handlePageSwipeMove = useCallback(
    (gestureState?: { dx?: number }) => {
      if (draggingId || pageMenuOpen || activeGame || pageCount <= 1) return;
      const rawDx = gestureState?.dx ?? 0;
      const adjustedDx = getSwipeDxWithResistance(rawDx);
      pageGestureActiveRef.current = true;
      stopPageTrackAnimation();
      pageTrackX.setValue(-activePage * pageStride + adjustedDx);
    },
    [
      draggingId,
      pageMenuOpen,
      activeGame,
      pageCount,
      getSwipeDxWithResistance,
      stopPageTrackAnimation,
      pageTrackX,
      activePage,
      pageStride,
    ]
  );

  const handlePageSwipeRelease = useCallback(
    (gestureState?: { dx?: number; vx?: number }) => {
      if (draggingId || pageMenuOpen || activeGame || pageCount <= 1) {
        pageGestureActiveRef.current = false;
        return;
      }

      pageGestureActiveRef.current = false;
      const dx = gestureState?.dx ?? 0;
      const vx = gestureState?.vx ?? 0;
      const canGoPrev = activePage > 0;
      const canGoNext = activePage < pageCount - 1;
      const shouldAdvance =
        dx <= -BOARD_PAGE_SWIPE_DISTANCE_PX || vx <= -BOARD_PAGE_SWIPE_VELOCITY_PX;
      const shouldRetreat =
        dx >= BOARD_PAGE_SWIPE_DISTANCE_PX || vx >= BOARD_PAGE_SWIPE_VELOCITY_PX;

      let nextPage = activePage;
      if (shouldAdvance && canGoNext) nextPage = activePage + 1;
      if (shouldRetreat && canGoPrev) nextPage = activePage - 1;

      animatePageTrackTo(-nextPage * pageStride);
      if (nextPage !== activePage) {
        setPageMenuOpen(false);
        setActivePage(nextPage);
        void Haptics.selectionAsync().catch(() => {});
      }
    },
    [
      draggingId,
      pageMenuOpen,
      activeGame,
      pageCount,
      activePage,
      pageStride,
      animatePageTrackTo,
    ]
  );

  const boardPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () => draggingId !== null,
        onMoveShouldSetPanResponderCapture: (_evt, gestureState) => {
          if (draggingId !== null) return true;
          if (pageMenuOpen || activeGame || pageCount <= 1 || pageAnimationInFlightRef.current) {
            return false;
          }
          const dx = Math.abs(gestureState?.dx ?? 0);
          const dy = Math.abs(gestureState?.dy ?? 0);
          if (dx < BOARD_PAGE_SWIPE_LOCK_DISTANCE_PX) return false;
          return dx > dy * BOARD_PAGE_SWIPE_LOCK_AXIS_RATIO;
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_evt, gestureState) => {
          if (draggingId) {
            const pointerX = gestureState.moveX;
            const pointerY = gestureState.moveY;
            dragPointerRef.current = { x: pointerX, y: pointerY };
            queueAutoScrollForPointer(pointerX, pointerY);
            positionDragAtPointer(pointerX, pointerY);
            maybeSwitchPageWhileDragging(pointerX, pointerY);
            return;
          }
          handlePageSwipeMove(gestureState);
        },
        onPanResponderRelease: (_evt, gestureState) => {
          if (draggingId) {
            void handleDrop();
            return;
          }
          handlePageSwipeRelease(gestureState);
        },
        onPanResponderTerminate: () => {
          if (draggingId) {
            stopDragging();
            return;
          }
          handlePageSwipeRelease();
        },
      }),
    [
      draggingId,
      pageMenuOpen,
      activeGame,
      pageCount,
      handleDrop,
      handlePageSwipeMove,
      handlePageSwipeRelease,
      maybeSwitchPageWhileDragging,
      positionDragAtPointer,
      queueAutoScrollForPointer,
      stopDragging,
    ]
  );

  const draggingGame = useMemo(() => {
    if (!draggingId) return null;
    return laidOutBoardGames.find((game) => game.id === draggingId) ?? draggingGameSnapshot;
  }, [draggingId, laidOutBoardGames, draggingGameSnapshot]);

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

  const renderBoardPage = (pageIndex: number) => {
    const pageGames = boardGamesByPage.get(pageIndex) ?? [];
    const isActivePage = pageIndex === activePage;

    return (
      <View
        key={`page-${pageIndex + 1}`}
        style={[
          styles.pagePane,
          { width: boardWidth },
          pageIndex < pageCount - 1 ? styles.pagePaneGap : null,
        ]}
        pointerEvents={isActivePage ? "auto" : "none"}
      >
        <View
          ref={isActivePage ? boardRef : undefined}
          style={[styles.board, { height: boardHeight }]}
          onLayout={
            isActivePage
              ? () => {
                  boardRef.current?.measureInWindow((x, y) => {
                    boardOriginRef.current = { x, y };
                  });
                }
              : undefined
          }
        >
          {pageGames.map((game, index) => {
            const board = game.board ?? { x: 0, y: index, w: 1, h: 1 };
            const ticketType = game.ticketType ?? DEFAULT_TICKET_TYPE;
            const slotWidth = board.w * cellWidth + (board.w - 1) * BOARD_GAP;
            const slotHeight = board.h * rowHeight + (board.h - 1) * BOARD_GAP;
            const scale = getCardRenderScale(ticketType);
            const slotLeft = board.x * (cellWidth + BOARD_GAP);
            const slotTop = board.y * (rowHeight + BOARD_GAP);
            const isDragging = isActivePage && draggingId === game.id;

            return (
              <View key={game.id}>
                <Pressable
                  disabled={!isActivePage}
                  onPress={
                    isActivePage
                      ? () => {
                          if (consumeNextPress.current || draggingId) {
                            consumeNextPress.current = false;
                            return;
                          }
                          handleAddNote(game.id);
                        }
                      : undefined
                  }
                  onLongPress={
                    isActivePage
                      ? (event) => {
                          const locationX = event.nativeEvent.locationX;
                          const locationY = event.nativeEvent.locationY;
                          setPageMenuOpen(false);
                          consumeNextPress.current = true;
                          dragStartScrollOffsetRef.current = scrollOffsetRef.current;
                          dragTargetHapticAtRef.current = 0;
                          dragPageSwitchAtRef.current = 0;
                          dragPageSwitchEdgeIntentRef.current = null;
                          boardRef.current?.measureInWindow((x, y) => {
                            boardOriginRef.current = { x, y };
                          });
                          dragOffsetRef.current = { x: locationX, y: locationY };
                          dragXY.setValue({ x: slotLeft, y: slotTop });
                          setDraggingId(game.id);
                          setDraggingGameSnapshot(game);
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
                              Math.max(0, HOME_BOARD_ROW_COUNT - lockedSpan.h)
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
                        }
                      : undefined
                  }
                  delayLongPress={220}
                  testID={isActivePage ? `playing-card-add-${game.id}` : undefined}
                  accessibilityLabel={isActivePage ? `Update bookmark for ${game.title}` : undefined}
                  accessibilityRole={isActivePage ? "button" : undefined}
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
                  <View
                    style={styles.slotCenter}
                    testID={isActivePage ? `playing-card-${game.id}` : undefined}
                  >
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
          {isActivePage && draggingGame ? (
            <View pointerEvents="none" style={styles.gridOverlay}>
              {Array.from({ length: HOME_BOARD_ROW_COUNT * boardColumns }).map((_, index) => {
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
          {isActivePage && draggingGame ? (
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
                <View style={{ transform: [{ scale: dragVisualScale }, { rotate: "0.8deg" }] }}>
                  {renderCardVisual(draggingGame, dragIndex)}
                </View>
              </View>
            </Animated.View>
          ) : null}
          {pageGames.length === 0 && !(isActivePage && draggingGame) ? (
            <View pointerEvents="none" style={styles.emptyBoardOverlay}>
              <Text style={styles.emptyText}>
                No games pinned yet.{"\n"}Add one to start your journey!
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

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
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.title}>Currently Playing</Text>
              <View style={styles.pageMenuWrap}>
                <Pressable
                  testID="home-page-menu-trigger"
                  accessibilityLabel="Board pages"
                  accessibilityRole="button"
                  onPress={() => setPageMenuOpen((open) => !open)}
                  style={styles.pageMenuTrigger}
                >
                  {pageMenuOpen ? (
                    <CaretUpIcon size={13} weight="bold" color={palette.warm[600]} />
                  ) : (
                    <CaretDownIcon size={13} weight="bold" color={palette.warm[600]} />
                  )}
                </Pressable>
                {pageMenuOpen ? (
                  <View style={styles.pageMenuDropdown}>
                    {Array.from({ length: pageCount }).map((_, index) => {
                      const selected = index === activePage;
                      return (
                        <Pressable
                          key={`page-option-${index + 1}`}
                          testID={`home-page-option-${index + 1}`}
                          accessibilityRole="button"
                          onPress={() => handleSelectPage(index)}
                          style={[
                            styles.pageMenuItem,
                            selected ? styles.pageMenuItemSelected : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.pageMenuItemText,
                              selected ? styles.pageMenuItemTextSelected : null,
                            ]}
                          >
                            Page {index + 1}
                          </Text>
                        </Pressable>
                      );
                    })}
                    <View style={styles.pageMenuDivider} />
                    <Pressable
                      testID="home-page-create"
                      accessibilityLabel="Add new board page"
                      accessibilityRole="button"
                      onPress={handleCreatePage}
                      style={styles.pageMenuItem}
                    >
                      <Text style={styles.pageMenuCreateText}>+ New page</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
          <Text style={styles.subtitle}>
            {loading
              ? "Loading..."
              : `${boardGames.length} game${boardGames.length !== 1 ? "s" : ""} | Page ${
                  activePage + 1
                } of ${pageCount}`}
          </Text>
        </View>

        <View style={[styles.pageContent, { width: boardWidth }]} {...boardPanResponder.panHandlers}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={palette.sage[400]} size="large" />
            </View>
          ) : (
            <View style={styles.pageViewport}>
              <Animated.View
                style={[
                  styles.pageTrack,
                  {
                    transform: [{ translateX: pageTrackX }],
                  },
                ]}
              >
                {Array.from({ length: pageCount }).map((_, pageIndex) =>
                  renderBoardPage(pageIndex)
                )}
              </Animated.View>
            </View>
          )}
        </View>
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
    position: "relative",
    zIndex: 40,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  pageMenuWrap: {
    position: "relative",
    marginLeft: 2,
  },
  pageMenuTrigger: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.9,
  },
  pageMenuDropdown: {
    position: "absolute",
    left: -10,
    top: 28,
    minWidth: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.warm[300],
    backgroundColor: palette.cream.DEFAULT,
    overflow: "hidden",
    shadowColor: palette.sage[700],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 60,
  },
  pageMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pageMenuItemSelected: {
    backgroundColor: palette.sage[100],
  },
  pageMenuItemText: {
    fontSize: 13,
    fontFamily: "Nunito",
    color: palette.warm[600],
  },
  pageMenuItemTextSelected: {
    fontWeight: "700",
    color: palette.sage[700],
  },
  pageMenuDivider: {
    height: 1,
    backgroundColor: palette.warm[200],
  },
  pageMenuCreateText: {
    fontSize: 13,
    fontFamily: "Nunito",
    fontWeight: "700",
    color: palette.sage[700],
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
  emptyBoardOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Nunito",
    color: palette.warm[600],
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 22,
  },
  pageContent: {
    minHeight: 1,
  },
  pageViewport: {
    overflow: "hidden",
  },
  pageTrack: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  pagePane: {
    minHeight: 1,
  },
  pagePaneGap: {
    marginRight: BOARD_PAGE_TRACK_GAP_PX,
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
