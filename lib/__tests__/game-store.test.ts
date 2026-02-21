import AsyncStorage from "@react-native-async-storage/async-storage";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useGames } from "../game-store";
import {
  DEFAULT_CARD_MOUNT_STYLE,
  DEFAULT_POSTCARD_SIDE,
  DEFAULT_TICKET_TYPE,
} from "../types";

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
      postcardSide: DEFAULT_POSTCARD_SIDE,
    });
    expect(result.current.playingGames.length).toBe(1);
  });

  it("falls back to seed data when stored payload fails validation", async () => {
    const stored = [
      {
        id: "g1",
        title: "Broken",
        status: "playing",
        notes: [
          {
            id: "n1",
            timestamp: "not-a-number",
            whereLeftOff: "Saved point",
          },
        ],
      },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.games).toHaveLength(5);
    expect(result.current.games[0].id).toBe("seed-stardew");
    expect(mockSetItem).toHaveBeenCalled();
  });

  it("normalizes unsupported stored ticket types to defaults", async () => {
    const stored = [
      {
        id: "g1",
        title: "Legacy",
        status: "playing",
        ticketType: "legacy",
        notes: [],
      },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.games[0].ticketType).toBe(DEFAULT_TICKET_TYPE);
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
    expect(game.postcardSide).toBe(DEFAULT_POSTCARD_SIDE);
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
    expect(added.postcardSide).toBe(DEFAULT_POSTCARD_SIDE);
  });

  it("generates unique IDs even when Date.now returns same value", async () => {
    mockGetItem.mockResolvedValue(JSON.stringify([]));
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1700000000000);

    try {
      const { result } = renderHook(() => useGames());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.addGameWithInitialNote!({
          title: "Game One",
          whereLeftOff: "Start",
        });
        await result.current.addGameWithInitialNote!({
          title: "Game Two",
          whereLeftOff: "Start",
        });
      });

      const ids = result.current.games.map((game) => game.id);
      expect(new Set(ids).size).toBe(ids.length);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it("places newest game at top-left and reflows existing board layout", async () => {
    mockGetItem.mockResolvedValue(JSON.stringify([]));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addGameWithInitialNote!({
        title: "Older",
        whereLeftOff: "Saved",
        ticketType: "ticket",
      });
      await result.current.addGameWithInitialNote!({
        title: "Newest",
        whereLeftOff: "Start",
        ticketType: "polaroid",
      });
    });

    const newest = result.current.games.find((game) => game.title === "Newest");
    const older = result.current.games.find((game) => game.title === "Older");

    expect(newest?.board).toMatchObject({ x: 0, y: 0 });
    expect(older?.board).not.toMatchObject({ x: 0, y: 0 });
  });

  it("saveBoardPlacement persists explicit board coordinates", async () => {
    const stored = [
      {
        id: "g1",
        title: "Game",
        status: "playing",
        ticketType: "polaroid",
        notes: [],
        board: { x: 0, y: 0, w: 1, h: 2, columns: 4 },
      },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.saveBoardPlacement!("g1", {
        x: 2,
        y: 3,
        w: 1,
        h: 2,
        columns: 4,
      });
    });

    expect(result.current.games[0].board).toMatchObject({
      x: 2,
      y: 3,
      w: 1,
      h: 2,
      columns: 4,
    });
    expect(mockSetItem).toHaveBeenCalled();
  });

  it("reorderGame inserts card at target index and reapplies layout", async () => {
    const stored = [
      {
        id: "g1",
        title: "One",
        status: "playing",
        ticketType: "ticket",
        notes: [],
      },
      {
        id: "g2",
        title: "Two",
        status: "playing",
        ticketType: "polaroid",
        notes: [],
      },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.reorderGame!("g2", 0, 4);
    });

    expect(result.current.games[0].id).toBe("g2");
    expect(result.current.games[0].board).toMatchObject({ x: 0, y: 0 });
    expect(mockSetItem).toHaveBeenCalled();
  });

  it.each([
    { id: "g-polaroid", type: "polaroid" },
    { id: "g-postcard", type: "postcard" },
    { id: "g-widget", type: "widget" },
    { id: "g-ticket", type: "ticket" },
    { id: "g-minimal", type: "minimal" },
  ])("reorderGame can move $type to top-left", async ({ id, type }) => {
    const stored = [
      { id: "g-a", title: "A", status: "playing", ticketType: "ticket", notes: [] },
      { id, title: "Target", status: "playing", ticketType: type, notes: [] },
      { id: "g-b", title: "B", status: "playing", ticketType: "widget", notes: [] },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.reorderGame!(id, 0, 4);
    });

    expect(result.current.games[0].id).toBe(id);
    expect(result.current.games[0].board?.x).toBe(0);
    expect(result.current.games[0].board?.y).toBe(0);
  });

  it("reorderGame applies span override so moved card can occupy more slots", async () => {
    const stored = [
      { id: "g1", title: "One", status: "playing", ticketType: "ticket", notes: [] },
      { id: "g2", title: "Two", status: "playing", ticketType: "minimal", notes: [] },
      { id: "g3", title: "Three", status: "playing", ticketType: "widget", notes: [] },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.reorderGame!("g2", 0, 4, { w: 2, h: 2 });
    });

    const moved = result.current.games.find((game) => game.id === "g2");
    expect(moved?.board).toMatchObject({ x: 0, y: 0, w: 2, h: 2, columns: 4 });
    expect(mockSetItem).toHaveBeenCalled();
  });

  it("moveGameToBoardTarget pins card at requested coordinates", async () => {
    const stored = [
      { id: "g1", title: "One", status: "playing", ticketType: "postcard", notes: [] },
      { id: "g2", title: "Two", status: "playing", ticketType: "minimal", notes: [] },
      { id: "g3", title: "Three", status: "playing", ticketType: "widget", notes: [] },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.moveGameToBoardTarget!("g1", { x: 2, y: 3, w: 2, h: 1 }, 4);
    });

    const moved = result.current.games.find((game) => game.id === "g1");
    expect(moved?.board).toMatchObject({ x: 2, y: 3, w: 2, h: 1, columns: 4 });
    expect(mockSetItem).toHaveBeenCalled();
  });

  it("moveGameToBoardTarget reflows neighbors deterministically around the pinned target", async () => {
    const stored = [
      {
        id: "dragged",
        title: "Dragged",
        status: "playing",
        ticketType: "ticket",
        notes: [],
        board: { x: 0, y: 0, w: 2, h: 1, columns: 4 },
      },
      {
        id: "cell",
        title: "Cell",
        status: "playing",
        ticketType: "minimal",
        notes: [],
        board: { x: 2, y: 0, w: 1, h: 1, columns: 4 },
      },
      {
        id: "tail",
        title: "Tail",
        status: "playing",
        ticketType: "minimal",
        notes: [],
        board: { x: 3, y: 0, w: 1, h: 1, columns: 4 },
      },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.moveGameToBoardTarget!(
        "dragged",
        { x: 1, y: 0, w: 2, h: 1 },
        4
      );
    });

    const dragged = result.current.games.find((game) => game.id === "dragged");
    const cell = result.current.games.find((game) => game.id === "cell");
    const tail = result.current.games.find((game) => game.id === "tail");

    expect(dragged?.board).toMatchObject({ x: 1, y: 0, w: 2, h: 1, columns: 4 });
    expect(cell?.board).toMatchObject({ x: 0, y: 0, w: 1, h: 1, columns: 4 });
    expect(tail?.board).toMatchObject({ x: 3, y: 0, w: 1, h: 1, columns: 4 });
  });

  it("moveGameToBoardTarget constrains pinned span to the card's allowed presets", async () => {
    const stored = [
      {
        id: "postcard",
        title: "Postcard",
        status: "playing",
        ticketType: "postcard",
        notes: [],
        board: { x: 0, y: 0, w: 2, h: 1, columns: 4 },
      },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.moveGameToBoardTarget!(
        "postcard",
        { x: 3, y: 2, w: 1, h: 1 },
        4
      );
    });

    const postcard = result.current.games.find((game) => game.id === "postcard");
    expect(postcard?.board).toMatchObject({ x: 2, y: 2, w: 2, h: 1, columns: 4 });
  });

  it("normalizes legacy invalid spans on load", async () => {
    const stored = [
      {
        id: "g1",
        title: "Legacy Polaroid",
        status: "playing",
        ticketType: "polaroid",
        notes: [],
        board: { x: 0, y: 0, w: 5, h: 5, columns: 4 },
      },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.games[0].board).toMatchObject({ w: 2, h: 2, columns: 4 });
    expect(mockSetItem).toHaveBeenCalled();
  });

  it("cycleGameSpanPreset cycles through allowed spans for a card type", async () => {
    const stored = [
      {
        id: "g1",
        title: "Polaroid",
        status: "playing",
        ticketType: "polaroid",
        notes: [],
        board: { x: 0, y: 0, w: 1, h: 1, columns: 4 },
      },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.cycleGameSpanPreset!("g1", 4);
    });
    expect(result.current.games[0].board).toMatchObject({ w: 2, h: 1, columns: 4 });

    await act(async () => {
      await result.current.cycleGameSpanPreset!("g1", 4);
    });
    expect(result.current.games[0].board).toMatchObject({ w: 1, h: 2, columns: 4 });
    expect(mockSetItem).toHaveBeenCalled();
  });

  it("setGameSpanPreset applies explicit preset span", async () => {
    const stored = [
      {
        id: "g1",
        title: "Postcard",
        status: "playing",
        ticketType: "postcard",
        notes: [],
        board: { x: 1, y: 1, w: 2, h: 1, columns: 4 },
      },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.setGameSpanPreset!("g1", { w: 2, h: 2 }, 4);
    });

    expect(result.current.games[0].board).toMatchObject({ w: 2, h: 2, columns: 4 });
    expect(mockSetItem).toHaveBeenCalled();
  });

  it("setGameSpanPreset repositions same-span card with movement offset and reflows neighbors", async () => {
    const stored = [
      {
        id: "left",
        title: "Left",
        status: "playing",
        ticketType: "minimal",
        notes: [],
        board: { x: 0, y: 0, w: 1, h: 1, columns: 4 },
      },
      {
        id: "right",
        title: "Right",
        status: "playing",
        ticketType: "minimal",
        notes: [],
        board: { x: 1, y: 0, w: 1, h: 1, columns: 4 },
      },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.setGameSpanPreset!(
        "left",
        { w: 1, h: 1 },
        4,
        { x: 1, y: 0 }
      );
    });

    const left = result.current.games.find((game) => game.id === "left");
    const right = result.current.games.find((game) => game.id === "right");
    expect(left?.board).toMatchObject({ x: 1, y: 0, w: 1, h: 1, columns: 4 });
    expect(right?.board).toMatchObject({ x: 0, y: 0, w: 1, h: 1, columns: 4 });
    expect(mockSetItem).toHaveBeenCalled();
  });

  it("setGameSpanPreset applies offset and reflows overlapping neighbors", async () => {
    const stored = [
      {
        id: "left",
        title: "Left",
        status: "playing",
        ticketType: "minimal",
        notes: [],
        board: { x: 0, y: 0, w: 1, h: 1, columns: 4 },
      },
      {
        id: "right",
        title: "Right",
        status: "playing",
        ticketType: "minimal",
        notes: [],
        board: { x: 1, y: 0, w: 1, h: 1, columns: 4 },
      },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.setGameSpanPreset!(
        "left",
        { w: 1, h: 2 },
        4,
        { x: 1, y: 0 }
      );
    });

    const left = result.current.games.find((game) => game.id === "left");
    const right = result.current.games.find((game) => game.id === "right");
    expect(left?.board).toMatchObject({ x: 1, y: 0, w: 1, h: 2, columns: 4 });
    expect(right?.board).toMatchObject({ x: 0, y: 0, w: 1, h: 1, columns: 4 });
    expect(mockSetItem).toHaveBeenCalled();
  });

  it("reorderGame is a no-op when game id is missing", async () => {
    const stored = [
      { id: "g1", title: "One", status: "playing", ticketType: "ticket", notes: [] },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));
    mockSetItem.mockClear();

    await act(async () => {
      await result.current.reorderGame!("missing", 0, 4);
    });

    expect(result.current.games[0].id).toBe("g1");
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it("moveGameToBoardTarget is a no-op when game id is missing", async () => {
    const stored = [
      { id: "g1", title: "One", status: "playing", ticketType: "ticket", notes: [] },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));
    mockSetItem.mockClear();

    await act(async () => {
      await result.current.moveGameToBoardTarget!("missing", { x: 1, y: 1, w: 1, h: 1 }, 4);
    });

    expect(result.current.games[0].id).toBe("g1");
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it("cycleGameSpanPreset is a no-op when no matching game exists", async () => {
    const stored = [
      { id: "g1", title: "One", status: "playing", ticketType: "ticket", notes: [] },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));
    mockSetItem.mockClear();

    await act(async () => {
      await result.current.cycleGameSpanPreset!("missing", 4);
    });

    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it("cycleGameSpanPreset is a no-op when only one preset is available", async () => {
    const stored = [
      {
        id: "g1",
        title: "Postcard",
        status: "playing",
        ticketType: "postcard",
        notes: [],
        board: { x: 0, y: 0, w: 2, h: 1, columns: 4 },
      },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));
    mockSetItem.mockClear();

    await act(async () => {
      await result.current.cycleGameSpanPreset!("g1", 1);
    });

    expect(result.current.games[0].board).toMatchObject({ w: 2, h: 1, columns: 4 });
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it("setGameSpanPreset is a no-op when game id is missing", async () => {
    const stored = [
      {
        id: "g1",
        title: "Postcard",
        status: "playing",
        ticketType: "postcard",
        notes: [],
        board: { x: 1, y: 1, w: 2, h: 1, columns: 4 },
      },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(stored));

    const { result } = renderHook(() => useGames());
    await waitFor(() => expect(result.current.loading).toBe(false));
    mockSetItem.mockClear();

    await act(async () => {
      await result.current.setGameSpanPreset!("missing", { w: 2, h: 2 }, 4);
    });

    expect(mockSetItem).not.toHaveBeenCalled();
  });
});
