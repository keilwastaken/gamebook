import React from "react";
import { PanResponder } from "react-native";
import * as ReactNative from "react-native";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";

import HomeScreen from "../index";
import { palette } from "@/constants/palette";
import { useGamesContext } from "@/lib/games-context";
import * as BoardLayout from "@/lib/board-layout";

const mockUseGamesContext = useGamesContext as jest.MockedFunction<typeof useGamesContext>;
const mockSaveNote = jest.fn();
const mockMoveGameToBoardTarget = jest.fn();

jest.mock("@/lib/games-context", () => ({
  useGamesContext: jest.fn(),
}));

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/components/cards", () => {
  const React = require("react");
  const { Text } = require("react-native");

  const makeCard = (kind: string) => {
    const Card = ({ game }: { game: { id?: string; title: string } }) => (
      <Text testID={`mock-card-${kind}-${game.id ?? game.title}`}>{game.title}</Text>
    );
    Card.displayName = `Mock${kind}Card`;
    return Card;
  };

  return {
    MinimalCard: makeCard("minimal"),
    PolaroidCard: makeCard("polaroid"),
    PostcardCard: makeCard("postcard"),
    TicketCard: makeCard("ticket"),
    WidgetCard: makeCard("widget"),
  };
});

jest.mock("@/components/journal-overlay", () => ({
  JournalOverlay: function JournalOverlayMock({
    game,
    onSave,
    onClose,
  }: {
    game: { title: string };
    onSave: (note: { whereLeftOff: string; quickThought?: string }) => void;
    onClose: () => void;
  }) {
    const React = require("react");
    const { Pressable, Text, View } = require("react-native");
    return (
      <View testID="mock-journal-overlay">
        <Text>{game.title}</Text>
        <Pressable
          testID="mock-journal-save"
          onPress={() =>
            onSave({ whereLeftOff: "Saved checkpoint", quickThought: "Nice loop" })
          }
        />
        <Pressable testID="mock-journal-close" onPress={onClose} />
      </View>
    );
  },
}));

function makeContext(overrides: Partial<ReturnType<typeof useGamesContext>> = {}) {
  return {
    playingGames: [],
    loading: false,
    currentHomePage: 0,
    setCurrentHomePage: jest.fn(),
    saveNote: mockSaveNote,
    moveGameToBoardTarget: mockMoveGameToBoardTarget,
    games: [],
    addGameWithInitialNote: jest.fn(),
    saveBoardPlacement: jest.fn(),
    reorderGame: jest.fn(),
    cycleGameSpanPreset: jest.fn(),
    ...overrides,
  } as ReturnType<typeof useGamesContext>;
}

// Regression contract: drag/drop UI interaction tests for the board screen.
describe("[dragdrop-regression] HomeScreen", () => {
  let capturedPanResponderConfig: any;
  let panResponderSpy: jest.SpyInstance;

  beforeEach(() => {
    mockSaveNote.mockReset().mockResolvedValue(undefined);
    mockMoveGameToBoardTarget.mockReset().mockResolvedValue(undefined);
    mockUseGamesContext.mockReset();
    (Haptics.selectionAsync as jest.Mock).mockClear();
    capturedPanResponderConfig = null;
    panResponderSpy = jest.spyOn(PanResponder, "create").mockImplementation((config) => {
      capturedPanResponderConfig = config;
      return { panHandlers: {} } as any;
    });
  });

  afterEach(() => {
    panResponderSpy.mockRestore();
  });

  it("shows loading state", () => {
    mockUseGamesContext.mockReturnValue(makeContext({ loading: true }));
    render(<HomeScreen />);
    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("shows empty state when there are no games", () => {
    mockUseGamesContext.mockReturnValue(makeContext({ loading: false, playingGames: [] }));
    render(<HomeScreen />);
    expect(screen.getByText(/No games pinned yet/i)).toBeTruthy();
  });

  it("creates a new page from the header menu and switches to it", () => {
    mockUseGamesContext.mockReturnValue(makeContext({ loading: false, playingGames: [] }));

    render(<HomeScreen />);
    expect(screen.getByText("0 games | Page 1 of 1")).toBeTruthy();

    fireEvent.press(screen.getByTestId("home-page-menu-trigger"));
    fireEvent.press(screen.getByTestId("home-page-create"));

    expect(screen.getByText("0 games | Page 2 of 2")).toBeTruthy();
  });

  it("switches board view between pages from the header menu", () => {
    mockUseGamesContext.mockReturnValue(
      makeContext({
        loading: false,
        playingGames: [
          {
            id: "page-1-game",
            title: "Page One Game",
            status: "playing",
            ticketType: "minimal",
            board: { x: 0, y: 0, w: 1, h: 1, columns: 4 },
            notes: [],
          },
          {
            id: "page-2-game",
            title: "Page Two Game",
            status: "playing",
            ticketType: "minimal",
            board: { x: 0, y: 6, w: 1, h: 1, columns: 4 },
            notes: [],
          },
        ],
      })
    );

    render(<HomeScreen />);
    expect(screen.getByTestId("playing-card-add-page-1-game")).toBeTruthy();
    expect(screen.queryByTestId("playing-card-add-page-2-game")).toBeNull();

    fireEvent.press(screen.getByTestId("home-page-menu-trigger"));
    fireEvent.press(screen.getByTestId("home-page-option-2"));

    expect(screen.queryByTestId("playing-card-add-page-1-game")).toBeNull();
    expect(screen.getByTestId("playing-card-add-page-2-game")).toBeTruthy();
    expect(screen.getByText("1 game | Page 2 of 2")).toBeTruthy();
  });

  it("opens journal overlay from card press and saves note", async () => {
    mockUseGamesContext.mockReturnValue(
      makeContext({
        loading: false,
        playingGames: [
          {
            id: "game-1",
            title: "Hades",
            status: "playing",
            ticketType: "polaroid",
            board: { x: 0, y: 0, w: 1, h: 1, columns: 4 },
            notes: [],
          },
        ],
      })
    );

    render(<HomeScreen />);
    fireEvent.press(screen.getByTestId("playing-card-add-game-1"));
    expect(screen.getByTestId("mock-journal-overlay")).toBeTruthy();

    fireEvent.press(screen.getByTestId("mock-journal-save"));
    await waitFor(() =>
      expect(mockSaveNote).toHaveBeenCalledWith("game-1", {
        whereLeftOff: "Saved checkpoint",
        quickThought: "Nice loop",
      })
    );
  });

  it("uses board layout migration when playing game has no board placement", () => {
    const applyBoardLayoutSpy = jest
      .spyOn(BoardLayout, "applyBoardLayout")
      .mockImplementation((games) =>
        games.map((game) => ({
          ...game,
          board: { x: 0, y: 0, w: 1, h: 1, columns: 4 },
        }))
      );

    try {
      mockUseGamesContext.mockReturnValue(
        makeContext({
          loading: false,
          playingGames: [
            {
              id: "no-board",
              title: "No Board Yet",
              status: "playing",
              ticketType: "widget",
              notes: [],
            },
          ],
        })
      );
      render(<HomeScreen />);
      expect(applyBoardLayoutSpy).toHaveBeenCalled();
      expect(screen.getByTestId("playing-card-add-no-board")).toBeTruthy();
    } finally {
      applyBoardLayoutSpy.mockRestore();
    }
  });

  it("closes journal overlay via onClose handler", () => {
    mockUseGamesContext.mockReturnValue(
      makeContext({
        loading: false,
        playingGames: [
          {
            id: "game-2",
            title: "Celeste",
            status: "playing",
            ticketType: "ticket",
            board: { x: 0, y: 0, w: 2, h: 1, columns: 4 },
            notes: [],
          },
        ],
      })
    );

    render(<HomeScreen />);
    fireEvent.press(screen.getByTestId("playing-card-add-game-2"));
    expect(screen.getByTestId("mock-journal-overlay")).toBeTruthy();

    fireEvent.press(screen.getByTestId("mock-journal-close"));
    expect(screen.queryByTestId("mock-journal-overlay")).toBeNull();
  });

  it("routes each ticket type to the correct visual card component", () => {
    mockUseGamesContext.mockReturnValue(
      makeContext({
        loading: false,
        playingGames: [
          { id: "p", title: "Polaroid", status: "playing", ticketType: "polaroid", notes: [] },
          { id: "pc", title: "Postcard", status: "playing", ticketType: "postcard", notes: [] },
          { id: "w", title: "Widget", status: "playing", ticketType: "widget", notes: [] },
          { id: "t", title: "Ticket", status: "playing", ticketType: "ticket", notes: [] },
          { id: "m", title: "Minimal", status: "playing", ticketType: "minimal", notes: [] },
          { id: "d", title: "Default", status: "playing", notes: [] },
        ],
      })
    );

    render(<HomeScreen />);

    expect(screen.getByTestId("mock-card-polaroid-p")).toBeTruthy();
    expect(screen.getByTestId("mock-card-postcard-pc")).toBeTruthy();
    expect(screen.getByTestId("mock-card-widget-w")).toBeTruthy();
    expect(screen.getByTestId("mock-card-ticket-t")).toBeTruthy();
    expect(screen.getByTestId("mock-card-minimal-m")).toBeTruthy();
    expect(screen.getByTestId("mock-card-polaroid-d")).toBeTruthy();
  });

  it("runs pan responder drag flow and drop move target", async () => {
    mockUseGamesContext.mockReturnValue(
      makeContext({
        loading: false,
        playingGames: [
          {
            id: "drag-1",
            title: "Drag",
            status: "playing",
            ticketType: "polaroid",
            board: { x: 0, y: 0, w: 1, h: 1, columns: 4 },
            notes: [],
          },
        ],
      })
    );

    render(<HomeScreen />);
    expect(capturedPanResponderConfig).toBeTruthy();

    expect(capturedPanResponderConfig.onStartShouldSetPanResponderCapture()).toBe(false);
    expect(capturedPanResponderConfig.onMoveShouldSetPanResponderCapture()).toBe(false);

    await act(async () => {
      capturedPanResponderConfig.onPanResponderMove({}, { moveX: 50, moveY: 50 });
      capturedPanResponderConfig.onPanResponderRelease();
    });

    fireEvent(screen.getByTestId("playing-card-add-drag-1"), "longPress", {
      nativeEvent: { locationX: 8, locationY: 8 },
    });

    expect(capturedPanResponderConfig.onStartShouldSetPanResponderCapture()).toBe(true);
    expect(capturedPanResponderConfig.onMoveShouldSetPanResponderCapture()).toBe(true);

    await act(async () => {
      capturedPanResponderConfig.onPanResponderMove({}, { moveX: 140, moveY: 180 });
      capturedPanResponderConfig.onPanResponderRelease();
    });

    await waitFor(() =>
      expect(mockMoveGameToBoardTarget).toHaveBeenCalledWith(
        "drag-1",
        expect.objectContaining({ w: 1, h: 1 }),
        4
      )
    );
    expect(Haptics.selectionAsync).toHaveBeenCalled();

    await act(async () => {
      capturedPanResponderConfig.onPanResponderTerminate();
    });
  });

  it("allows dragging a wide card over a single-cell occupied slot and still commits drop", async () => {
    const windowSpy = jest
      .spyOn(ReactNative, "useWindowDimensions")
      .mockReturnValue({ width: 232, height: 900, scale: 2, fontScale: 1 });

    try {
      mockUseGamesContext.mockReturnValue(
        makeContext({
          loading: false,
          playingGames: [
            {
              id: "drag-wide-overlap",
              title: "Drag Wide Overlap",
              status: "playing",
              ticketType: "ticket",
              board: { x: 0, y: 0, w: 2, h: 1, columns: 4 },
              notes: [],
            },
            {
              id: "target-cell",
              title: "Target Cell",
              status: "playing",
              ticketType: "minimal",
              board: { x: 2, y: 0, w: 1, h: 1, columns: 4 },
              notes: [],
            },
          ],
        })
      );

      render(<HomeScreen />);
      fireEvent(screen.getByTestId("playing-card-add-drag-wide-overlap"), "longPress", {
        nativeEvent: { locationX: 8, locationY: 8 },
      });

      await waitFor(() =>
        expect(capturedPanResponderConfig.onMoveShouldSetPanResponderCapture()).toBe(true)
      );

      await act(async () => {
        capturedPanResponderConfig.onPanResponderMove({}, { moveX: 120, moveY: 8 });
        capturedPanResponderConfig.onPanResponderRelease();
      });

      await waitFor(() => expect(mockMoveGameToBoardTarget).toHaveBeenCalledTimes(1));
      const [gameId, target, columns] =
        mockMoveGameToBoardTarget.mock.calls[mockMoveGameToBoardTarget.mock.calls.length - 1];
      expect(gameId).toBe("drag-wide-overlap");
      expect(columns).toBe(4);
      expect(target).toEqual(expect.objectContaining({ y: 0, w: 2, h: 1 }));
      expect(target.x).toBeGreaterThanOrEqual(1);
    } finally {
      windowSpy.mockRestore();
    }
  });

  it("applies active page row offset when dropping on page two", async () => {
    const windowSpy = jest
      .spyOn(ReactNative, "useWindowDimensions")
      .mockReturnValue({ width: 232, height: 900, scale: 2, fontScale: 1 });

    try {
      mockUseGamesContext.mockReturnValue(
        makeContext({
          loading: false,
          playingGames: [
            {
              id: "page-two-drag",
              title: "Page Two Drag",
              status: "playing",
              ticketType: "minimal",
              board: { x: 0, y: 6, w: 1, h: 1, columns: 4 },
              notes: [],
            },
          ],
        })
      );

      render(<HomeScreen />);
      fireEvent.press(screen.getByTestId("home-page-menu-trigger"));
      fireEvent.press(screen.getByTestId("home-page-option-2"));

      fireEvent(screen.getByTestId("playing-card-add-page-two-drag"), "longPress", {
        nativeEvent: { locationX: 8, locationY: 8 },
      });

      await waitFor(() =>
        expect(capturedPanResponderConfig.onMoveShouldSetPanResponderCapture()).toBe(true)
      );

      await act(async () => {
        capturedPanResponderConfig.onPanResponderRelease();
      });

      await waitFor(() => expect(mockMoveGameToBoardTarget).toHaveBeenCalled());
      const [, target] =
        mockMoveGameToBoardTarget.mock.calls[mockMoveGameToBoardTarget.mock.calls.length - 1];
      expect(target.y).toBeGreaterThanOrEqual(6);
    } finally {
      windowSpy.mockRestore();
    }
  });

  it("morphs drop target span near a column boundary for 1x1 cards", async () => {
    const windowSpy = jest
      .spyOn(ReactNative, "useWindowDimensions")
      .mockReturnValue({ width: 232, height: 900, scale: 2, fontScale: 1 });

    try {
      mockUseGamesContext.mockReturnValue(
        makeContext({
          loading: false,
          playingGames: [
            {
              id: "drag-dynamic",
              title: "Dynamic",
              status: "playing",
              ticketType: "minimal",
              board: { x: 0, y: 0, w: 1, h: 1, columns: 4 },
              notes: [],
            },
          ],
        })
      );

      render(<HomeScreen />);
      fireEvent(screen.getByTestId("playing-card-add-drag-dynamic"), "longPress", {
        nativeEvent: { locationX: 8, locationY: 8 },
      });

      await waitFor(() =>
        expect(capturedPanResponderConfig.onMoveShouldSetPanResponderCapture()).toBe(true)
      );

      await act(async () => {
        capturedPanResponderConfig.onPanResponderMove({}, { moveX: 90, moveY: 100 });
        capturedPanResponderConfig.onPanResponderRelease();
      });

      await waitFor(() =>
        expect(mockMoveGameToBoardTarget).toHaveBeenCalledWith(
          "drag-dynamic",
          expect.objectContaining({ w: 2, h: 1 }),
          4
        )
      );
    } finally {
      windowSpy.mockRestore();
    }
  });

  it("caps drag drop target within the 6-row home grid", async () => {
    const windowSpy = jest
      .spyOn(ReactNative, "useWindowDimensions")
      .mockReturnValue({ width: 232, height: 900, scale: 2, fontScale: 1 });

    try {
      mockUseGamesContext.mockReturnValue(
        makeContext({
          loading: false,
          playingGames: [
            {
              id: "drag-cap",
              title: "Drag Cap",
              status: "playing",
              ticketType: "minimal",
              board: { x: 0, y: 0, w: 1, h: 1, columns: 4 },
              notes: [],
            },
          ],
        })
      );

      render(<HomeScreen />);
      fireEvent(screen.getByTestId("playing-card-add-drag-cap"), "longPress", {
        nativeEvent: { locationX: 8, locationY: 8 },
      });

      await waitFor(() =>
        expect(capturedPanResponderConfig.onMoveShouldSetPanResponderCapture()).toBe(true)
      );

      await act(async () => {
        capturedPanResponderConfig.onPanResponderMove({}, { moveX: 90, moveY: 9999 });
        capturedPanResponderConfig.onPanResponderRelease();
      });

      await waitFor(() => expect(mockMoveGameToBoardTarget).toHaveBeenCalled());
      const [, target] =
        mockMoveGameToBoardTarget.mock.calls[mockMoveGameToBoardTarget.mock.calls.length - 1];
      expect(target.y).toBeLessThanOrEqual(5);
      expect(target.y + target.h).toBeLessThanOrEqual(6);
    } finally {
      windowSpy.mockRestore();
    }
  });

  it("allows re-grabbing a card after dropping it on the bottom row", async () => {
    const windowSpy = jest
      .spyOn(ReactNative, "useWindowDimensions")
      .mockReturnValue({ width: 232, height: 900, scale: 2, fontScale: 1 });

    try {
      const game = {
        id: "drag-bottom-regrab",
        title: "Bottom Regrab",
        status: "playing" as const,
        ticketType: "minimal" as const,
        board: { x: 0, y: 0, w: 1, h: 1, columns: 4 },
        notes: [],
      };

      mockUseGamesContext.mockReturnValue(
        makeContext({
          loading: false,
          playingGames: [game],
        })
      );

      const { rerender } = render(<HomeScreen />);
      fireEvent(screen.getByTestId("playing-card-add-drag-bottom-regrab"), "longPress", {
        nativeEvent: { locationX: 8, locationY: 8 },
      });

      await waitFor(() =>
        expect(capturedPanResponderConfig.onMoveShouldSetPanResponderCapture()).toBe(true)
      );

      await act(async () => {
        capturedPanResponderConfig.onPanResponderMove({}, { moveX: 90, moveY: 9999 });
        capturedPanResponderConfig.onPanResponderRelease();
      });

      await waitFor(() => expect(mockMoveGameToBoardTarget).toHaveBeenCalled());
      const [, target] =
        mockMoveGameToBoardTarget.mock.calls[mockMoveGameToBoardTarget.mock.calls.length - 1];
      expect(target.y).toBeLessThanOrEqual(5);
      expect(target.y + target.h).toBeLessThanOrEqual(6);

      mockUseGamesContext.mockReturnValue(
        makeContext({
          loading: false,
          playingGames: [
            {
              ...game,
              board: { x: target.x, y: target.y, w: target.w, h: target.h, columns: 4 },
            },
          ],
        })
      );
      rerender(<HomeScreen />);

      expect(capturedPanResponderConfig.onMoveShouldSetPanResponderCapture()).toBe(false);

      fireEvent(screen.getByTestId("playing-card-add-drag-bottom-regrab"), "longPress", {
        nativeEvent: { locationX: 8, locationY: 8 },
      });

      await waitFor(() =>
        expect(capturedPanResponderConfig.onMoveShouldSetPanResponderCapture()).toBe(true)
      );
    } finally {
      windowSpy.mockRestore();
    }
  });

  it("highlights only the conflicting grid cell instead of tinting the whole target red", async () => {
    const windowSpy = jest
      .spyOn(ReactNative, "useWindowDimensions")
      .mockReturnValue({ width: 232, height: 900, scale: 2, fontScale: 1 });

    try {
      mockUseGamesContext.mockReturnValue(
        makeContext({
          loading: false,
          playingGames: [
            {
              id: "dragged",
              title: "Dragged",
              status: "playing",
              ticketType: "ticket",
              board: { x: 0, y: 0, w: 2, h: 1, columns: 4 },
              notes: [],
            },
            {
              id: "blocker",
              title: "Blocker",
              status: "playing",
              ticketType: "minimal",
              board: { x: 3, y: 0, w: 1, h: 1, columns: 4 },
              notes: [],
            },
          ],
        })
      );

      render(<HomeScreen />);
      fireEvent(screen.getByTestId("playing-card-add-dragged"), "longPress", {
        nativeEvent: { locationX: 8, locationY: 8 },
      });

      await waitFor(() =>
        expect(capturedPanResponderConfig.onMoveShouldSetPanResponderCapture()).toBe(true)
      );

      await act(async () => {
        capturedPanResponderConfig.onPanResponderMove({}, { moveX: 300, moveY: 8 });
      });

      const indicator = screen.getByTestId("drop-target-indicator");
      const style = ReactNative.StyleSheet.flatten(indicator.props.style);
      expect(style.borderColor).toBe(palette.sage[500]);
      expect(screen.getByTestId("drop-target-conflict-3-0")).toBeTruthy();
      expect(screen.queryByTestId("drop-target-conflict-2-0")).toBeNull();
    } finally {
      windowSpy.mockRestore();
    }
  });

  it.each([
    {
      id: "drag-wide",
      title: "Drag Wide",
      ticketType: "ticket" as const,
      board: { x: 0, y: 0, w: 2, h: 1, columns: 4 },
      moveX: 90,
      moveY: 100,
      scenario: "keeps wide span when hovering near a column boundary",
      expectedSpan: { w: 2, h: 1 },
    },
    {
      id: "drag-tall",
      title: "Drag Tall",
      ticketType: "minimal" as const,
      board: { x: 0, y: 0, w: 1, h: 2, columns: 4 },
      moveX: 70,
      moveY: 76,
      scenario: "can morph tall span down when hovering a 1x1 target",
      expectedSpan: { w: 1, h: 1 },
    },
  ])(
    "$scenario",
    async ({ id, title, ticketType, board, moveX, moveY, expectedSpan }) => {
      const windowSpy = jest
        .spyOn(ReactNative, "useWindowDimensions")
        .mockReturnValue({ width: 232, height: 900, scale: 2, fontScale: 1 });

      try {
        mockUseGamesContext.mockReturnValue(
          makeContext({
            loading: false,
            playingGames: [
              {
                id,
                title,
                status: "playing",
                ticketType,
                board,
                notes: [],
              },
            ],
          })
        );

        render(<HomeScreen />);
        expect(capturedPanResponderConfig).toBeTruthy();

        fireEvent(screen.getByTestId(`playing-card-add-${id}`), "longPress", {
          nativeEvent: { locationX: 8, locationY: 8 },
        });

        await waitFor(() =>
          expect(capturedPanResponderConfig.onMoveShouldSetPanResponderCapture()).toBe(true)
        );

        await act(async () => {
          capturedPanResponderConfig.onPanResponderMove({}, { moveX, moveY });
          capturedPanResponderConfig.onPanResponderRelease();
        });

        await waitFor(() =>
          expect(mockMoveGameToBoardTarget).toHaveBeenCalledWith(
            id,
            expect.objectContaining(expectedSpan),
            4
          )
        );
      } finally {
        windowSpy.mockRestore();
      }
    }
  );

  it("ignores tap immediately after long press, then allows tap after drag ends", () => {
    mockUseGamesContext.mockReturnValue(
      makeContext({
        loading: false,
        playingGames: [
          {
            id: "drag-2",
            title: "Drag 2",
            status: "playing",
            ticketType: "minimal",
            board: { x: 0, y: 0, w: 1, h: 1, columns: 4 },
            notes: [],
          },
        ],
      })
    );

    render(<HomeScreen />);
    const card = screen.getByTestId("playing-card-add-drag-2");
    fireEvent(card, "longPress", { nativeEvent: { locationX: 6, locationY: 6 } });
    fireEvent.press(card);
    expect(screen.queryByTestId("mock-journal-overlay")).toBeNull();

    act(() => {
      capturedPanResponderConfig.onPanResponderTerminate();
    });
    fireEvent.press(card);
    fireEvent.press(card);
    expect(screen.getByTestId("mock-journal-overlay")).toBeTruthy();
  });

  it("refreshes active game when latest board game reference changes", async () => {
    const first = makeContext({
      loading: false,
      playingGames: [
        {
          id: "same-id",
          title: "Old Title",
          status: "playing",
          ticketType: "ticket",
          board: { x: 0, y: 0, w: 2, h: 1, columns: 4 },
          notes: [],
        },
      ],
    });
    const second = makeContext({
      loading: false,
      playingGames: [
        {
          id: "same-id",
          title: "New Title",
          status: "playing",
          ticketType: "ticket",
          board: { x: 0, y: 0, w: 2, h: 1, columns: 4 },
          notes: [],
        },
      ],
    });

    let current = first;
    mockUseGamesContext.mockImplementation(() => current);

    const view = render(<HomeScreen />);
    fireEvent.press(screen.getByTestId("playing-card-add-same-id"));
    expect(screen.queryAllByText("Old Title").length).toBeGreaterThan(0);

    current = second;
    view.rerender(<HomeScreen />);
    await waitFor(() =>
      expect(screen.queryAllByText("New Title").length).toBeGreaterThan(0)
    );
  });
});
