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
} from "./board-layout";

const STORAGE_KEY = "@gamebook/games";
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
      const parsed = JSON.parse(raw) as Game[];
      const normalized = parsed.map((game) => ({
        ...game,
        ticketType: game.ticketType ?? DEFAULT_TICKET_TYPE,
        mountStyle: game.mountStyle ?? DEFAULT_CARD_MOUNT_STYLE,
        postcardSide: game.postcardSide ?? DEFAULT_POSTCARD_SIDE,
      }));
      const needsLayoutMigration = normalized.some(
        (game) =>
          !game.board ||
          game.board.columns !== DEFAULT_BOARD_COLUMNS
      );
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

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames().then((loaded) => {
      setGames(loaded);
      setLoading(false);
    });
  }, []);

  const playingGames = games.filter((g) => g.status === "playing");

  const saveNote = useCallback(
    async (
      gameId: string,
      note: Omit<GameNote, "id" | "timestamp">
    ): Promise<void> => {
      setGames((prev) => {
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
        persistGames(next);
        return next;
      });
    },
    []
  );

  const addGameWithInitialNote = useCallback(
    async (input: {
      title: string;
      whereLeftOff: string;
      quickThought?: string;
      ticketType?: Game["ticketType"];
      mountStyle?: Game["mountStyle"];
      postcardSide?: Game["postcardSide"];
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
      setGames((prev) => {
        const next = applyBoardLayout(
          [newGame, ...prev],
          DEFAULT_BOARD_COLUMNS
        );
        createdGame = next[0];
        persistGames(next);
        return next;
      });
      return createdGame;
    },
    []
  );

  const saveBoardPlacement = useCallback(
    async (gameId: string, board: BoardPlacement): Promise<void> => {
      setGames((prev) => {
        const next = prev.map((game) =>
          game.id === gameId ? { ...game, board } : game
        );
        persistGames(next);
        return next;
      });
    },
    []
  );

  const reorderGame = useCallback(
    async (
      gameId: string,
      toIndex: number,
      columns: number = DEFAULT_BOARD_COLUMNS,
      spanOverride?: { w: number; h: number }
    ): Promise<void> => {
      setGames((prev) => {
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
        persistGames(next);
        return next;
      });
    },
    []
  );

  const moveGameToBoardTarget = useCallback(
    async (
      gameId: string,
      target: { x: number; y: number; w: number; h: number },
      columns: number = DEFAULT_BOARD_COLUMNS
    ): Promise<void> => {
      setGames((prev) => {
        if (!prev.some((game) => game.id === gameId)) return prev;
        const next = applyBoardLayoutWithPinned(prev, gameId, target, columns);
        persistGames(next);
        return next;
      });
    },
    []
  );

  return {
    games,
    playingGames,
    loading,
    saveNote,
    addGameWithInitialNote,
    saveBoardPlacement,
    reorderGame,
    moveGameToBoardTarget,
  };
}
