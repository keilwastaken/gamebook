import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import HomeScreen from "../index";
import { useGamesContext } from "@/lib/games-context";
import * as BoardLayout from "@/lib/board-layout";

const mockUseGamesContext = useGamesContext as jest.MockedFunction<typeof useGamesContext>;
const mockSaveNote = jest.fn();
const mockMoveGameToBoardTarget = jest.fn();
const mockSetGameSpanPreset = jest.fn();

jest.mock("@/lib/games-context", () => ({
  useGamesContext: jest.fn(),
}));

jest.mock("@/components/cards", () => {
  const React = require("react");
  const { Text } = require("react-native");

  const MockCard = ({ game }: { game: { title: string } }) => (
    <Text testID={`mock-card-${game.title}`}>{game.title}</Text>
  );

  return {
    MinimalCard: MockCard,
    PolaroidCard: MockCard,
    PostcardCard: MockCard,
    TicketCard: MockCard,
    WidgetCard: MockCard,
  };
});

jest.mock("@/components/journal-overlay", () => ({
  JournalOverlay: ({
    game,
    onSave,
    onClose,
    onSelectSize,
  }: {
    game: { title: string };
    onSave: (note: { whereLeftOff: string; quickThought?: string }) => void;
    onClose: () => void;
    onSelectSize?: (
      preset: { w: number; h: number; id: string },
      movement: { x: number; y: number }
    ) => void;
  }) => {
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
        <Pressable
          testID="mock-journal-size"
          onPress={() => onSelectSize?.({ id: "full-grid", w: 2, h: 2 }, { x: 1, y: 0 })}
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
    saveNote: mockSaveNote,
    moveGameToBoardTarget: mockMoveGameToBoardTarget,
    setGameSpanPreset: mockSetGameSpanPreset,
    games: [],
    addGameWithInitialNote: jest.fn(),
    saveBoardPlacement: jest.fn(),
    reorderGame: jest.fn(),
    cycleGameSpanPreset: jest.fn(),
    ...overrides,
  } as ReturnType<typeof useGamesContext>;
}

describe("HomeScreen", () => {
  beforeEach(() => {
    mockSaveNote.mockReset().mockResolvedValue(undefined);
    mockMoveGameToBoardTarget.mockReset().mockResolvedValue(undefined);
    mockSetGameSpanPreset.mockReset().mockResolvedValue(undefined);
    mockUseGamesContext.mockReset();
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

  it("opens journal overlay from card press, saves note, and applies size preset movement", async () => {
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

    fireEvent.press(screen.getByTestId("mock-journal-size"));
    await waitFor(() =>
      expect(mockSetGameSpanPreset).toHaveBeenCalledWith(
        "game-1",
        { w: 2, h: 2 },
        4,
        { x: 1, y: 0 }
      )
    );

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
});
