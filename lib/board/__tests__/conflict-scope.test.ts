import type { Game } from "@/lib/types";

import { getDragConflictScopeGames } from "../conflict-scope";

const DRAGGED: Game = {
  id: "dragged",
  title: "Dragged",
  status: "playing",
  ticketType: "minimal",
  notes: [],
  board: { x: 2, y: 7, w: 1, h: 1, columns: 4 },
};

describe("board conflict scope", () => {
  it("returns original page games when dragging card already exists on page", () => {
    const pageGames = [DRAGGED];
    const scoped = getDragConflictScopeGames(pageGames, DRAGGED, { w: 1, h: 1 }, 4);

    expect(scoped).toBe(pageGames);
  });

  it("adds a synthetic dragged card when dragging card is absent from page", () => {
    const pageGames: Game[] = [
      {
        id: "page-card",
        title: "Page Card",
        status: "playing",
        ticketType: "minimal",
        notes: [],
        board: { x: 0, y: 0, w: 1, h: 1, columns: 4 },
      },
    ];

    const scoped = getDragConflictScopeGames(pageGames, DRAGGED, { w: 2, h: 1 }, 4);

    expect(scoped).toHaveLength(2);
    expect(scoped[0].id).toBe("page-card");
    expect(scoped[1]).toMatchObject({
      id: "dragged",
      board: { x: 0, y: 0, w: 2, h: 1, columns: 4 },
    });
  });

  it("does not mutate the original page games array", () => {
    const pageGames: Game[] = [];
    const scoped = getDragConflictScopeGames(pageGames, DRAGGED, { w: 1, h: 2 }, 4);

    expect(pageGames).toEqual([]);
    expect(scoped).not.toBe(pageGames);
  });
});
