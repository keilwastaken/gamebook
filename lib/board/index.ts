export {
  getDragConflictScopeGames,
} from "./conflict-scope";
export {
  chooseNearestAllowedSpan,
  commitMoveStrictNoOverlap,
  getDropTargetConflictCells,
  normalizePlacementForGame,
  normalizePlacementForGameTarget,
  normalizePlacementForTicketTarget,
  samePlacement,
  type GridCell,
  type GridRect,
} from "./engine";
export {
  BOARD_GAP,
  BOARD_MAX_WIDTH,
  BOARD_MIN_WIDTH,
  BOARD_ROW_HEIGHT_RATIO,
  BOARD_SIDE_PADDING,
  BOARD_TOP_PADDING,
  getBoardMetrics,
  getBoardScrollBottomPadding,
  getBoardWidth,
} from "./metrics";
