import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type BoardPlacement,
  DEFAULT_CARD_MOUNT_STYLE,
  DEFAULT_POSTCARD_SIDE,
  DEFAULT_TICKET_TYPE,
  type Game,
  type GameNote,
} from "./types";
import {
  applyBoardLayout,
  applyBoardLayoutWithPinned,
  DEFAULT_BOARD_COLUMNS,
  getCardSpanPresets,
  constrainSpanForCard,
  getCardSpan,
} from "./board-layout";
import { commitMoveStrictNoOverlap } from "./board/engine";
import { decodeStoredGames } from "./game-storage-codec";

const STORAGE_KEY = "@gamebook/games";
const HOME_BOARD_PAGE_ROW_COUNT = 6;
let clientIdSequence = 0;

function createClientId(prefix: "game" | "note"): string {
  clientIdSequence = (clientIdSequence + 1) % 1_000_000;
  const ts = Date.now().toString(36);
  const seq = clientIdSequence.toString(36).padStart(4, "0");
  return `tmp_${prefix}_${ts}_${seq}`;
}

const SEED_GAMES: Game[] = [
  {
    id: "seed-stardew",
    title: "Stardew Valley",
    ticketType: "polaroid",
    mountStyle: "tape",
    playtime: "24h 12m",
    status: "playing",
    lastNote: {
      id: "note-1",
      timestamp: Date.now() - 86400000,
      whereLeftOff: "Just finished the Community Center bundles, heading to Ginger Island next",
    },
    notes: [],
  },
  {
    id: "seed-spiritfarer",
    title: "Spiritfarer",
    ticketType: "postcard",
    postcardSide: "front",
    playtime: "8h 45m",
    status: "playing",
    lastNote: {
      id: "note-2",
      timestamp: Date.now() - 172800000,
      whereLeftOff: "Atul just left... need a moment before continuing",
      quickThought: "This game makes me feel things",
    },
    notes: [],
  },
  {
    id: "seed-hades",
    title: "Hades",
    ticketType: "widget",
    playtime: "6h 10m",
    status: "playing",
    lastNote: {
      id: "note-3",
      timestamp: Date.now() - 3600000 * 30,
      whereLeftOff: "Unlocked new Arcana cards and beat Chronos phase one",
    },
    notes: [],
  },
  {
    id: "seed-celeste",
    title: "Celeste",
    ticketType: "ticket",
    playtime: "3h 55m",
    status: "playing",
    lastNote: {
      id: "note-4",
      timestamp: Date.now() - 3600000 * 12,
      whereLeftOff: "Reached Reflection and found two hidden strawberries",
    },
    notes: [],
  },
  {
    id: "seed-outerwilds",
    title: "Outer Wilds",
    ticketType: "minimal",
    playtime: "11h 03m",
    status: "playing",
    lastNote: {
      id: "note-5",
      timestamp: Date.now() - 3600000 * 54,
      whereLeftOff: "Tracked signal to Dark Bramble and marked the vessel route",
    },
    notes: [],
  },
];

async function loadGames(): Promise<Game[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const normalized = decodeStoredGames(raw);
      if (!normalized) {
        throw new Error("Invalid stored games payload");
      }
      const needsSpanNormalization = normalized.some((game) => {
        if (!game.board) return false;
        const constrained = constrainSpanForCard(
          game.ticketType,
          { w: game.board.w, h: game.board.h },
          DEFAULT_BOARD_COLUMNS
        );
        return constrained.w !== game.board.w || constrained.h !== game.board.h;
      });
      const needsLayoutMigration = normalized.some(
        (game) =>
          !game.board ||
          game.board.columns !== DEFAULT_BOARD_COLUMNS
      ) || needsSpanNormalization;
      const withLayout = needsLayoutMigration
        ? applyBoardLayout(normalized, DEFAULT_BOARD_COLUMNS)
        : normalized;
      if (needsLayoutMigration) {
        await persistGames(withLayout);
      }
      return withLayout;
    }
  } catch {
    // Fall through to seed data
  }
  const seeded = applyBoardLayout(SEED_GAMES, DEFAULT_BOARD_COLUMNS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

async function persistGames(games: Game[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

function overlaps(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function findFirstOpenSlot(
  games: Game[],
  span: { w: number; h: number },
  columns: number,
  startY: number,
  endYExclusive: number
): { x: number; y: number } | null {
  const occupied = games
    .filter((game) => game.board)
    .map((game) => {
      const board = game.board!;
      const constrained = constrainSpanForCard(
        game.ticketType,
        { w: board.w, h: board.h },
        columns
      );
      const maxX = Math.max(0, columns - constrained.w);
      return {
        x: Math.max(0, Math.min(board.x, maxX)),
        y: Math.max(0, board.y),
        w: constrained.w,
        h: constrained.h,
      };
    });

  const maxCandidateY = Math.max(startY, endYExclusive - span.h);
  for (let y = startY; y <= maxCandidateY; y += 1) {
    for (let x = 0; x <= columns - span.w; x += 1) {
      const candidate = { x, y, w: span.w, h: span.h };
      if (!occupied.some((cell) => overlaps(cell, candidate))) {
        return { x, y };
      }
    }
  }
  return null;
}

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentHomePage, setCurrentHomePageState] = useState(0);

  const setGamesWithPersistence = useCallback(
    (update: (prev: Game[]) => Game[]) => {
      setGames((prev) => {
        const next = update(prev);
        if (next !== prev) {
          void persistGames(next);
        }
        return next;
      });
    },
    []
  );

  useEffect(() => {
    loadGames().then((loaded) => {
      setGames(loaded);
      setLoading(false);
    });
  }, []);

  const playingGames = games.filter((g) => g.status === "playing");
  const setCurrentHomePage = useCallback((page: number) => {
    const safePage = Number.isFinite(page) ? Math.max(0, Math.floor(page)) : 0;
    setCurrentHomePageState(safePage);
  }, []);

  const saveNote = useCallback(
    async (
      gameId: string,
      note: Omit<GameNote, "id" | "timestamp">
    ): Promise<void> => {
      setGamesWithPersistence((prev) => {
        const next = prev.map((g) => {
          if (g.id !== gameId) return g;
          const ts = Date.now();
          const newNote: GameNote = {
            ...note,
            id: createClientId("note"),
            timestamp: ts,
          };
          return {
            ...g,
            lastNote: newNote,
            notes: [newNote, ...g.notes],
          };
        });
        return next;
      });
    },
    [setGamesWithPersistence]
  );

  const addGameWithInitialNote = useCallback(
    async (input: {
      title: string;
      whereLeftOff: string;
      quickThought?: string;
      ticketType?: Game["ticketType"];
      mountStyle?: Game["mountStyle"];
      postcardSide?: Game["postcardSide"];
      boardPage?: number;
    }): Promise<Game> => {
      const ts = Date.now();
      const noteId = createClientId("note");
      const gameId = createClientId("game");
      const newNote: GameNote = {
        id: noteId,
        timestamp: ts,
        whereLeftOff: input.whereLeftOff.trim(),
        quickThought: input.quickThought?.trim() || undefined,
      };
      const newGame: Game = {
        id: gameId,
        title: input.title.trim(),
        ticketType: input.ticketType ?? DEFAULT_TICKET_TYPE,
        mountStyle: input.mountStyle ?? DEFAULT_CARD_MOUNT_STYLE,
        postcardSide: input.postcardSide ?? DEFAULT_POSTCARD_SIDE,
        status: "playing",
        lastNote: newNote,
        notes: [newNote],
      };
      let createdGame: Game = newGame;
      setGamesWithPersistence((prev) => {
        if (input.boardPage !== undefined) {
          const targetPage = Math.max(0, Math.floor(input.boardPage));
          const span = constrainSpanForCard(
            newGame.ticketType,
            getCardSpan(newGame.ticketType),
            DEFAULT_BOARD_COLUMNS
          );
          const pageStartY = targetPage * HOME_BOARD_PAGE_ROW_COUNT;
          const pageEndExclusive = pageStartY + HOME_BOARD_PAGE_ROW_COUNT;
          const pageSlot = findFirstOpenSlot(
            prev,
            span,
            DEFAULT_BOARD_COLUMNS,
            pageStartY,
            pageEndExclusive
          );

          const maxBottom = prev.reduce((max, game) => {
            if (!game.board) return max;
            return Math.max(max, game.board.y + game.board.h);
          }, pageEndExclusive);
          const fallbackEndExclusive = Math.max(
            maxBottom + HOME_BOARD_PAGE_ROW_COUNT * 2,
            pageEndExclusive + HOME_BOARD_PAGE_ROW_COUNT * 2
          );
          const fallbackSlot =
            pageSlot ??
            findFirstOpenSlot(
              prev,
              span,
              DEFAULT_BOARD_COLUMNS,
              pageEndExclusive,
              fallbackEndExclusive
            );

          if (fallbackSlot) {
            createdGame = {
              ...newGame,
              board: {
                x: fallbackSlot.x,
                y: fallbackSlot.y,
                w: span.w,
                h: span.h,
                columns: DEFAULT_BOARD_COLUMNS,
              },
            };
            return [createdGame, ...prev];
          }
        }

        const next = applyBoardLayout(
          [newGame, ...prev],
          DEFAULT_BOARD_COLUMNS
        );
        createdGame = next[0];
        return next;
      });
      return createdGame;
    },
    [setGamesWithPersistence]
  );

  const saveBoardPlacement = useCallback(
    async (gameId: string, board: BoardPlacement): Promise<void> => {
      setGamesWithPersistence((prev) => {
        const next = prev.map((game) =>
          game.id === gameId ? { ...game, board } : game
        );
        return next;
      });
    },
    [setGamesWithPersistence]
  );

  const reorderGame = useCallback(
    async (
      gameId: string,
      toIndex: number,
      columns: number = DEFAULT_BOARD_COLUMNS,
      spanOverride?: { w: number; h: number }
    ): Promise<void> => {
      setGamesWithPersistence((prev) => {
        const fromIndex = prev.findIndex((game) => game.id === gameId);
        if (fromIndex === -1) return prev;
        const ordered = [...prev];
        const [moved] = ordered.splice(fromIndex, 1);
        const movedWithSpan = spanOverride
          ? {
              ...moved,
              board: {
                ...(moved.board ?? { x: 0, y: 0, columns }),
                w: spanOverride.w,
                h: spanOverride.h,
                columns,
              },
            }
          : moved;
        const clampedIndex = Math.max(0, Math.min(toIndex, ordered.length));
        ordered.splice(clampedIndex, 0, movedWithSpan);
        const next = applyBoardLayout(ordered, columns);
        return next;
      });
    },
    [setGamesWithPersistence]
  );

  const moveGameToBoardTarget = useCallback(
    async (
      gameId: string,
      target: { x: number; y: number; w: number; h: number },
      columns: number = DEFAULT_BOARD_COLUMNS
    ): Promise<void> => {
      setGamesWithPersistence((prev) => {
        return commitMoveStrictNoOverlap(prev, gameId, target, columns);
      });
    },
    [setGamesWithPersistence]
  );

  const cycleGameSpanPreset = useCallback(
    async (
      gameId: string,
      columns: number = DEFAULT_BOARD_COLUMNS
    ): Promise<void> => {
      setGamesWithPersistence((prev) => {
        const game = prev.find((item) => item.id === gameId);
        if (!game) return prev;

        const presets = getCardSpanPresets(game.ticketType, columns);
        if (presets.length <= 1) return prev;

        const currentSpan = constrainSpanForCard(
          game.ticketType,
          game.board
            ? { w: game.board.w, h: game.board.h }
            : getCardSpan(game.ticketType),
          columns
        );
        const currentIndex = presets.findIndex(
          (preset) => preset.w === currentSpan.w && preset.h === currentSpan.h
        );
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % presets.length : 0;
        const nextSpan = presets[nextIndex];
        const targetX = game.board?.x ?? 0;
        const targetY = game.board?.y ?? 0;

        const next = applyBoardLayoutWithPinned(
          prev,
          gameId,
          { x: targetX, y: targetY, w: nextSpan.w, h: nextSpan.h },
          columns
        );
        return next;
      });
    },
    [setGamesWithPersistence]
  );

  const setGameSpanPreset = useCallback(
    async (
      gameId: string,
      span: { w: number; h: number },
      columns: number = DEFAULT_BOARD_COLUMNS,
      offset?: { x: number; y: number }
    ): Promise<void> => {
      setGamesWithPersistence((prev) => {
        const game = prev.find((item) => item.id === gameId);
        if (!game) return prev;

        const targetSpan = constrainSpanForCard(game.ticketType, span, columns);
        const targetX = (game.board?.x ?? 0) + (offset?.x ?? 0);
        const targetY = (game.board?.y ?? 0) + (offset?.y ?? 0);
        const next = applyBoardLayoutWithPinned(
          prev,
          gameId,
          { x: targetX, y: targetY, w: targetSpan.w, h: targetSpan.h },
          columns
        );
        return next;
      });
    },
    [setGamesWithPersistence]
  );

  return {
    games,
    playingGames,
    loading,
    currentHomePage,
    setCurrentHomePage,
    saveNote,
    addGameWithInitialNote,
    saveBoardPlacement,
    reorderGame,
    moveGameToBoardTarget,
    cycleGameSpanPreset,
    setGameSpanPreset,
  };
}
