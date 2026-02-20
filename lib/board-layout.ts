import type { Game, GridSizeId, GridSpan, TicketType } from "./types";

export const DEFAULT_BOARD_COLUMNS = 4;
export type HoverZone = "left" | "right" | "top" | "bottom" | "middle";

const GRID_UNITS = [1, 2, 3, 4] as const;
export const ALL_GRID_SIZE_IDS: GridSizeId[] = GRID_UNITS.flatMap((h) =>
  GRID_UNITS.map((w) => `${w}x${h}` as GridSizeId)
);

function gridSizeIdToSpan(sizeId: GridSizeId): GridSpan {
  const [w, h] = sizeId.split("x").map(Number);
  return { w, h };
}

const DEFAULT_GRID_SIZE_ID_BY_TICKET_TYPE: Record<TicketType, GridSizeId> = {
  polaroid: "1x1",
  postcard: "2x1",
  ticket: "2x1",
  minimal: "1x1",
  widget: "1x1",
};

const ALLOWED_GRID_SIZE_IDS_BY_TICKET_TYPE: Record<TicketType, GridSizeId[]> = {
  polaroid: ["1x1", "2x1", "1x2", "2x2"],
  postcard: ["2x1", "2x2"],
  ticket: ["2x1", "2x2"],
  minimal: ["1x1", "2x1", "1x2", "2x2"],
  widget: ["1x1", "2x1", "1x2", "2x2"],
};

export function getAllowedGridSizeIds(
  ticketType: TicketType | undefined
): GridSizeId[] {
  if (!ticketType) return ["1x1"];
  return ALLOWED_GRID_SIZE_IDS_BY_TICKET_TYPE[ticketType];
}

export function getCardSpan(ticketType: TicketType | undefined): {
  w: number;
  h: number;
} {
  if (!ticketType) return { w: 1, h: 1 };
  const sizeId = DEFAULT_GRID_SIZE_ID_BY_TICKET_TYPE[ticketType];
  return gridSizeIdToSpan(sizeId);
}

export function getCardSpanPresets(
  ticketType: TicketType | undefined,
  columns: number
): GridSpan[] {
  const maxW = Math.max(1, Math.min(columns, 4));
  const visible = getAllowedGridSizeIds(ticketType)
    .map((sizeId) => gridSizeIdToSpan(sizeId))
    .filter((preset) => preset.w <= maxW);
  return visible.length > 0 ? visible : [{ w: 1, h: 1 }];
}

export function constrainSpanForCard(
  ticketType: TicketType | undefined,
  desired: { w: number; h: number },
  columns: number
): { w: number; h: number } {
  const presets = getCardSpanPresets(ticketType, columns);
  const exact = presets.find((preset) => preset.w === desired.w && preset.h === desired.h);
  if (exact) return exact;

  const desiredArea = desired.w * desired.h;
  const largestPreset = presets.reduce((largest, preset) => {
    const area = preset.w * preset.h;
    const largestArea = largest.w * largest.h;
    return area > largestArea ? preset : largest;
  }, presets[0]);

  if (desiredArea > largestPreset.w * largestPreset.h) {
    return largestPreset;
  }

  return presets[0];
}

function clampSpan(span: { w: number; h: number }, columns: number): {
  w: number;
  h: number;
} {
  return {
    w: Math.max(1, Math.min(span.w, Math.min(columns, 4))),
    h: Math.max(1, Math.min(span.h, 4)),
  };
}

export function getEffectiveCardSpan(game: Game, columns: number): {
  w: number;
  h: number;
} {
  const explicit = game.board ? { w: game.board.w, h: game.board.h } : undefined;
  return constrainSpanForCard(
    game.ticketType,
    clampSpan(explicit ?? getCardSpan(game.ticketType), columns),
    columns
  );
}

export function applyBoardLayout(games: Game[], columns: number): Game[] {
  const occupied = new Set<string>();

  const isFree = (x: number, y: number, w: number, h: number) => {
    for (let row = y; row < y + h; row += 1) {
      for (let col = x; col < x + w; col += 1) {
        if (occupied.has(`${col},${row}`)) return false;
      }
    }
    return true;
  };

  const markUsed = (x: number, y: number, w: number, h: number) => {
    for (let row = y; row < y + h; row += 1) {
      for (let col = x; col < x + w; col += 1) {
        occupied.add(`${col},${row}`);
      }
    }
  };

  return games.map((game) => {
    const span = getEffectiveCardSpan(game, columns);
    const w = Math.min(span.w, columns);

    let y = 0;
    let x = 0;
    let placed = false;

    while (!placed) {
      for (let candidateX = 0; candidateX <= columns - w; candidateX += 1) {
        if (isFree(candidateX, y, w, span.h)) {
          x = candidateX;
          placed = true;
          break;
        }
      }
      if (!placed) y += 1;
    }

    markUsed(x, y, w, span.h);

    return {
      ...game,
      board: { x, y, w, h: span.h, columns },
    };
  });
}

export function applyBoardLayoutWithPinned(
  games: Game[],
  pinnedGameId: string,
  pinnedTarget: { x: number; y: number; w: number; h: number },
  columns: number
): Game[] {
  const pinnedGame = games.find((game) => game.id === pinnedGameId);
  if (!pinnedGame) return applyBoardLayout(games, columns);

  const occupied = new Set<string>();
  const placements = new Map<string, Game["board"]>();

  const isFree = (x: number, y: number, w: number, h: number) => {
    for (let row = y; row < y + h; row += 1) {
      for (let col = x; col < x + w; col += 1) {
        if (occupied.has(`${col},${row}`)) return false;
      }
    }
    return true;
  };

  const markUsed = (x: number, y: number, w: number, h: number) => {
    for (let row = y; row < y + h; row += 1) {
      for (let col = x; col < x + w; col += 1) {
        occupied.add(`${col},${row}`);
      }
    }
  };

  const pinnedSpan = constrainSpanForCard(
    pinnedGame.ticketType,
    clampSpan({ w: pinnedTarget.w, h: pinnedTarget.h }, columns),
    columns
  );
  const pinnedX = Math.max(0, Math.min(columns - pinnedSpan.w, pinnedTarget.x));
  const pinnedY = Math.max(0, pinnedTarget.y);
  markUsed(pinnedX, pinnedY, pinnedSpan.w, pinnedSpan.h);
  placements.set(pinnedGameId, {
    x: pinnedX,
    y: pinnedY,
    w: pinnedSpan.w,
    h: pinnedSpan.h,
    columns,
  });

  for (const game of games) {
    if (game.id === pinnedGameId) continue;
    const span = getEffectiveCardSpan(game, columns);
    const w = Math.min(span.w, columns);

    let y = 0;
    let x = 0;
    let placed = false;

    while (!placed) {
      for (let candidateX = 0; candidateX <= columns - w; candidateX += 1) {
        if (isFree(candidateX, y, w, span.h)) {
          x = candidateX;
          placed = true;
          break;
        }
      }
      if (!placed) y += 1;
    }

    markUsed(x, y, w, span.h);
    placements.set(game.id, { x, y, w, h: span.h, columns });
  }

  return games.map((game) => ({
    ...game,
    board: placements.get(game.id) ?? game.board,
  }));
}

export function previewInsertionAtIndex(
  games: Game[],
  gameId: string,
  insertionIndex: number,
  columns: number,
  spanOverride?: { w: number; h: number }
): {
  insertionIndex: number;
  target: { x: number; y: number; w: number; h: number };
} {
  const movingOriginal = games.find((game) => game.id === gameId);
  if (!movingOriginal) {
    return {
      insertionIndex: 0,
      target: { x: 0, y: 0, w: 1, h: 1 },
    };
  }

  const moving = spanOverride
    ? {
        ...movingOriginal,
        board: {
          ...(movingOriginal.board ?? {
            x: 0,
            y: 0,
            columns,
          }),
          ...constrainSpanForCard(
            movingOriginal.ticketType,
            clampSpan(spanOverride, columns),
            columns
          ),
          columns,
        },
      }
    : movingOriginal;

  const withoutMoving = games.filter((game) => game.id !== gameId);
  const clampedIndex = Math.max(0, Math.min(insertionIndex, withoutMoving.length));
  const candidateOrder = [...withoutMoving];
  candidateOrder.splice(clampedIndex, 0, moving);
  const laidOut = applyBoardLayout(candidateOrder, columns);
  const placed = laidOut.find((game) => game.id === gameId);
  const board = placed?.board ?? { x: 0, y: 0, w: 1, h: 1, columns };

  return {
    insertionIndex: clampedIndex,
    target: { x: board.x, y: board.y, w: board.w, h: board.h },
  };
}

export function findBestInsertion(
  games: Game[],
  gameId: string,
  desiredX: number,
  desiredY: number,
  columns: number,
  spanOverride?: { w: number; h: number }
): {
  insertionIndex: number;
  target: { x: number; y: number; w: number; h: number };
} {
  const movingOriginal = games.find((game) => game.id === gameId);
  if (!movingOriginal) {
    return {
      insertionIndex: 0,
      target: { x: 0, y: 0, w: 1, h: 1 },
    };
  }
  const moving = spanOverride
    ? {
        ...movingOriginal,
        board: {
          ...(movingOriginal.board ?? {
            x: 0,
            y: 0,
            columns,
          }),
          ...constrainSpanForCard(
            movingOriginal.ticketType,
            clampSpan(spanOverride, columns),
            columns
          ),
          columns,
        },
      }
    : movingOriginal;
  const withoutMoving = games.filter((game) => game.id !== gameId);
  const desiredW = moving.board?.w ?? 1;
  const desiredH = moving.board?.h ?? 1;

  const getOverlapArea = (
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number }
  ): number => {
    const left = Math.max(a.x, b.x);
    const top = Math.max(a.y, b.y);
    const right = Math.min(a.x + a.w, b.x + b.w);
    const bottom = Math.min(a.y + a.h, b.y + b.h);
    if (right <= left || bottom <= top) return 0;
    return (right - left) * (bottom - top);
  };

  const desiredRect = { x: desiredX, y: desiredY, w: desiredW, h: desiredH };
  let best: {
    insertionIndex: number;
    distance: number;
    overlap: number;
    target: { x: number; y: number; w: number; h: number };
  } | null = null;

  for (let insertionIndex = 0; insertionIndex <= withoutMoving.length; insertionIndex += 1) {
    const preview = previewInsertionAtIndex(
      games,
      gameId,
      insertionIndex,
      columns,
      spanOverride
    );
    const board = preview.target;
    const targetRect = { x: board.x, y: board.y, w: board.w, h: board.h };
    const overlap = getOverlapArea(desiredRect, targetRect);
    const distance =
      Math.abs(desiredX + desiredW / 2 - (board.x + board.w / 2)) +
      Math.abs(desiredY + desiredH / 2 - (board.y + board.h / 2));

    if (
      !best ||
      overlap > best.overlap ||
      (overlap === best.overlap && distance < best.distance) ||
      (overlap === best.overlap &&
        distance === best.distance &&
        insertionIndex < best.insertionIndex)
    ) {
      best = {
        insertionIndex: preview.insertionIndex,
        distance,
        overlap,
        target: { x: board.x, y: board.y, w: board.w, h: board.h },
      };
    }
  }

  return (
    best ?? {
      insertionIndex: 0,
      target: { x: 0, y: 0, w: 1, h: 1 },
    }
  );
}

export function getAxisIntentSpan(
  pointer: number,
  stride: number,
  maxSpan: number = 4
): number {
  if (stride <= 0) return 1;
  const normalized = pointer / stride;
  const distanceToLine = Math.abs(normalized - Math.round(normalized));
  const cap = Math.max(1, Math.min(maxSpan, 4));

  if (distanceToLine <= 0.015 && cap >= 4) return 4;
  if (distanceToLine <= 0.035 && cap >= 3) return 3;
  if (distanceToLine <= 0.075 && cap >= 2) return 2;
  return 1;
}

export function getHoverZone(
  normalizedX: number,
  normalizedY: number,
  edgeThreshold: number = 0.22
): HoverZone {
  const x = Math.max(0, Math.min(1, normalizedX));
  const y = Math.max(0, Math.min(1, normalizedY));
  const edge = Math.max(0.05, Math.min(0.45, edgeThreshold));

  const distances: Array<{ zone: Exclude<HoverZone, "middle">; distance: number }> = [
    { zone: "left", distance: x },
    { zone: "right", distance: 1 - x },
    { zone: "top", distance: y },
    { zone: "bottom", distance: 1 - y },
  ];
  distances.sort((a, b) => a.distance - b.distance);
  const nearest = distances[0];

  if (nearest.distance <= edge) return nearest.zone;
  return "middle";
}
