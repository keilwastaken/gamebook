import { DEFAULT_BOARD_COLUMNS } from "@/lib/board-layout";
import type { Game } from "@/lib/types";

import {
  chooseNearestAllowedSpan,
  commitMoveStrictNoOverlap,
  getDropTargetConflictCells,
} from "../engine";

const BASE_GAMES: Game[] = [
  {
    id: "dragged",
    title: "Dragged",
    status: "playing",
    ticketType: "ticket",
    notes: [],
    board: { x: 0, y: 0, w: 2, h: 1, columns: DEFAULT_BOARD_COLUMNS },
  },
  {
    id: "cell",
    title: "Cell",
    status: "playing",
    ticketType: "minimal",
    notes: [],
    board: { x: 2, y: 0, w: 1, h: 1, columns: DEFAULT_BOARD_COLUMNS },
  },
  {
    id: "tail",
    title: "Tail",
    status: "playing",
    ticketType: "minimal",
    notes: [],
    board: { x: 3, y: 0, w: 1, h: 1, columns: DEFAULT_BOARD_COLUMNS },
  },
];

describe("board engine", () => {
  it("picks the exact span when available", () => {
    const span = chooseNearestAllowedSpan(
      [
        { w: 1, h: 1 },
        { w: 2, h: 1 },
      ],
      { w: 2, h: 1 },
      { w: 1, h: 1 }
    );

    expect(span).toEqual({ w: 2, h: 1 });
  });

  it("reports only overlapped cells for a target", () => {
    const conflicts = getDropTargetConflictCells(
      BASE_GAMES,
      "dragged",
      { x: 1, y: 0, w: 2, h: 1 },
      DEFAULT_BOARD_COLUMNS
    );

    expect(conflicts).toEqual([{ x: 2, y: 0 }]);
  });

  it("reports conflicts for occupied lower rows (down-grid boundary)", () => {
    const games: Game[] = [
      {
        id: "dragged",
        title: "Dragged",
        status: "playing",
        ticketType: "minimal",
        notes: [],
        board: { x: 0, y: 0, w: 1, h: 1, columns: DEFAULT_BOARD_COLUMNS },
      },
      {
        id: "lower-row-blocker",
        title: "Lower Row Blocker",
        status: "playing",
        ticketType: "minimal",
        notes: [],
        board: { x: 1, y: 4, w: 1, h: 1, columns: DEFAULT_BOARD_COLUMNS },
      },
    ];

    const conflicts = getDropTargetConflictCells(
      games,
      "dragged",
      { x: 1, y: 4, w: 1, h: 1 },
      DEFAULT_BOARD_COLUMNS
    );

    expect(conflicts).toEqual([{ x: 1, y: 4 }]);
  });

  it("commits only when target is empty and keeps neighbors static", () => {
    const next = commitMoveStrictNoOverlap(
      BASE_GAMES,
      "dragged",
      { x: 0, y: 1, w: 2, h: 1 },
      DEFAULT_BOARD_COLUMNS
    );

    expect(next.find((game) => game.id === "dragged")?.board).toMatchObject({
      x: 0,
      y: 1,
      w: 2,
      h: 1,
      columns: DEFAULT_BOARD_COLUMNS,
    });
    expect(next.find((game) => game.id === "cell")?.board).toMatchObject({
      x: 2,
      y: 0,
      w: 1,
      h: 1,
      columns: DEFAULT_BOARD_COLUMNS,
    });
  });

  it("rejects move when target overlaps existing cards", () => {
    const next = commitMoveStrictNoOverlap(
      BASE_GAMES,
      "dragged",
      { x: 1, y: 0, w: 2, h: 1 },
      DEFAULT_BOARD_COLUMNS
    );

    expect(next.find((game) => game.id === "dragged")?.board).toMatchObject({
      x: 0,
      y: 0,
      w: 2,
      h: 1,
      columns: DEFAULT_BOARD_COLUMNS,
    });
    expect(next.find((game) => game.id === "cell")?.board).toMatchObject({
      x: 2,
      y: 0,
      w: 1,
      h: 1,
      columns: DEFAULT_BOARD_COLUMNS,
    });
  });
});
