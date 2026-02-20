import React from "react";
import { renderHook } from "@testing-library/react-native";

import { GamesProvider, useGamesContext } from "../games-context";
import { useGames } from "../game-store";

jest.mock("../game-store", () => ({
  useGames: jest.fn(),
}));

const mockUseGames = useGames as jest.MockedFunction<typeof useGames>;

describe("games-context", () => {
  beforeEach(() => {
    mockUseGames.mockReset();
  });

  it("throws outside provider boundary", () => {
    expect(() => renderHook(() => useGamesContext())).toThrow(
      "useGamesContext must be used within GamesProvider"
    );
  });

  it("provides the exact useGames value", () => {
    const mockValue = {
      games: [],
      playingGames: [],
      loading: false,
      saveNote: jest.fn(),
      addGameWithInitialNote: jest.fn(),
      saveBoardPlacement: jest.fn(),
      reorderGame: jest.fn(),
      moveGameToBoardTarget: jest.fn(),
      cycleGameSpanPreset: jest.fn(),
      setGameSpanPreset: jest.fn(),
    };
    mockUseGames.mockReturnValue(mockValue as ReturnType<typeof useGames>);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GamesProvider>{children}</GamesProvider>
    );

    const { result } = renderHook(() => useGamesContext(), { wrapper });
    expect(result.current).toBe(mockValue);
  });
});
