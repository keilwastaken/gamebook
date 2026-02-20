import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Game, GameNote } from "./types";

const STORAGE_KEY = "@gamebook/games";

const SEED_GAMES: Game[] = [
  {
    id: "seed-stardew",
    title: "Stardew Valley",
    playtime: "24h 12m",
    progress: 0.6,
    status: "playing",
    lastNote: {
      id: "note-1",
      timestamp: Date.now() - 86400000,
      whereLeftOff: "Just finished the Community Center bundles, heading to Ginger Island next",
      progress: 0.6,
    },
    notes: [],
  },
  {
    id: "seed-spiritfarer",
    title: "Spiritfarer",
    playtime: "8h 45m",
    progress: 0.3,
    status: "playing",
    lastNote: {
      id: "note-2",
      timestamp: Date.now() - 172800000,
      whereLeftOff: "Atul just left... need a moment before continuing",
      quickThought: "This game makes me feel things",
      progress: 0.3,
    },
    notes: [],
  },
];

async function loadGames(): Promise<Game[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as Game[];
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
            progress: note.progress,
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
      progress: number;
      whereLeftOff: string;
      quickThought?: string;
    }): Promise<Game> => {
      const ts = Date.now();
      const noteId = `note-${ts}`;
      const gameId = `game-${ts}`;
      const newNote: GameNote = {
        id: noteId,
        timestamp: ts,
        whereLeftOff: input.whereLeftOff.trim(),
        quickThought: input.quickThought?.trim() || undefined,
        progress: input.progress,
      };
      const newGame: Game = {
        id: gameId,
        title: input.title.trim(),
        progress: input.progress,
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
