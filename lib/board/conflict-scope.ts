import type { Game } from "@/lib/types";

/**
 * Ensures conflict detection has a representation of the actively dragged game.
 * During cross-page drag, the source card may not be present in destination-page games.
 */
export function getDragConflictScopeGames(
  pageGames: Game[],
  draggingGame: Game,
  baseSpan: { w: number; h: number },
  columns: number
): Game[] {
  if (pageGames.some((game) => game.id === draggingGame.id)) {
    return pageGames;
  }

  return [
    ...pageGames,
    {
      ...draggingGame,
      board: {
        x: 0,
        y: 0,
        w: baseSpan.w,
        h: baseSpan.h,
        columns,
      },
    },
  ];
}
