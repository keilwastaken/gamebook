import AsyncStorage from "@react-native-async-storage/async-storage";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useGames } from "../game-store";
import { DEFAULT_CARD_MOUNT_STYLE, DEFAULT_TICKET_TYPE } from "../types";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;

beforeEach(() => {
  mockGetItem.mockReset();
  mockSetItem.mockReset().mockResolvedValue(undefined);
});

describe("useGames", () => {
  it("seeds default games when storage is empty", async () => {
    mockGetItem.mockResolvedValue(null);

    const { result } = renderHook(() => useGames());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.games.length).toBe(5);
    expect(result.current.playingGames.length).toBe(5);
    expect(mockSetItem).toHaveBeenCalled();
  });

  it("loads games from storage when present", async () => {
    const stored = [
      {
        id: "g1",
        title: "Test Game",
        status: "playing",
        notes: [],
      },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.games[0]).toMatchObject({
      ...stored[0],
      ticketType: DEFAULT_TICKET_TYPE,
      mountStyle: DEFAULT_CARD_MOUNT_STYLE,
    });
    expect(result.current.playingGames.length).toBe(1);
  });

  it("filters playingGames by status", async () => {
    const stored = [
      { id: "g1", title: "Playing", status: "playing", notes: [] },
      { id: "g2", title: "Finished", status: "finished", notes: [] },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.playingGames.length).toBe(1);
    expect(result.current.playingGames[0].title).toBe("Playing");
  });

  it("saveNote persists a new note", async () => {
    const stored = [
      { id: "g1", title: "Game", status: "playing", notes: [] },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.saveNote("g1", {
        whereLeftOff: "At the castle",
        quickThought: "Love it",
      });
    });

    const updated = result.current.games[0];
    expect(updated.lastNote?.whereLeftOff).toBe("At the castle");
    expect(updated.lastNote?.quickThought).toBe("Love it");
    expect(updated.notes.length).toBe(1);
    expect(mockSetItem).toHaveBeenCalled();
  });

  it("addGameWithInitialNote creates game with status playing and seeds first note", async () => {
    mockGetItem.mockResolvedValue(JSON.stringify([]));

    const { result } = renderHook(() => useGames());

    await waitFor(() => expect(result.current.loading).toBe(false));

    let newGame: { id: string };
    await act(async () => {
      newGame = await result.current.addGameWithInitialNote!({
        title: "New Game",
        whereLeftOff: "Just started",
        quickThought: "Excited",
      });
    });

    expect(result.current.games.length).toBe(1);
    const game = result.current.games[0];
    expect(game.title).toBe("New Game");
    expect(game.status).toBe("playing");
    expect(game.ticketType).toBe(DEFAULT_TICKET_TYPE);
    expect(game.mountStyle).toBe(DEFAULT_CARD_MOUNT_STYLE);
    expect(game.lastNote?.whereLeftOff).toBe("Just started");
    expect(game.lastNote?.quickThought).toBe("Excited");
    expect(game.notes.length).toBe(1);
    expect(game.notes[0].whereLeftOff).toBe("Just started");
    expect(newGame!.id).toBe(game.id);
    expect(mockSetItem).toHaveBeenCalled();
  });

  it("addGameWithInitialNote persists to AsyncStorage", async () => {
    mockGetItem.mockResolvedValue(null);

    const { result } = renderHook(() => useGames());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addGameWithInitialNote!({
        title: "Persisted",
        whereLeftOff: "Mid game",
      });
    });

    expect(mockSetItem).toHaveBeenCalled();
    const stored = JSON.parse(mockSetItem.mock.calls[mockSetItem.mock.calls.length - 1][1]);
    expect(stored.length).toBe(6); // 5 seed + 1 new
    const added = stored.find((g: { title: string }) => g.title === "Persisted");
    expect(added).toBeDefined();
    expect(added.lastNote.whereLeftOff).toBe("Mid game");
    expect(added.ticketType).toBe(DEFAULT_TICKET_TYPE);
    expect(added.mountStyle).toBe(DEFAULT_CARD_MOUNT_STYLE);
  });
});
