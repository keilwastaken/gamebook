import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_CARD_MOUNT_STYLE,
  DEFAULT_POSTCARD_SIDE,
  DEFAULT_TICKET_TYPE,
  type Game,
  type GameNote,
} from "./types";

const STORAGE_KEY = "@gamebook/games";

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
      return parsed.map((game) => ({
        ...game,
        ticketType: game.ticketType ?? DEFAULT_TICKET_TYPE,
        mountStyle: game.mountStyle ?? DEFAULT_CARD_MOUNT_STYLE,
        postcardSide: game.postcardSide ?? DEFAULT_POSTCARD_SIDE,
      }));
    }
  } catch {
    // Fall through to seed data
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_GAMES));
  return SEED_GAMES;
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
          const newNote: GameNote = {
            ...note,
            id: `note-${Date.now()}`,
            timestamp: Date.now(),
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
      const noteId = `note-${ts}`;
      const gameId = `game-${ts}`;
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
      setGames((prev) => {
        const next = [newGame, ...prev];
        persistGames(next);
        return next;
      });
      return newGame;
    },
    []
  );

  return { games, playingGames, loading, saveNote, addGameWithInitialNote };
}
