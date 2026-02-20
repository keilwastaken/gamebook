# Board Drag and Drop Architecture

This document is the implementation-level reference for the board system:

- grid placement
- drag and drop target selection
- card span presets/resizing
- persistence and migration

Use this with `docs/architecture.md` and the active execution plan in
`docs/exec-plans/active/board-rearrange-and-dynamic-spans.md`.

## Goals

1. Every created card is immutable and gets a unique ID.
2. Reordering never mutates card identity, only placement.
3. Placement is deterministic from game order + span constraints.
4. Drag feedback is stable (no flicker/jump while hovering near boundaries).
5. Size updates are accessible from the note flow, not a separate mode.

## Data Model

Source of truth:

- `lib/types.ts`
- `lib/game-store.ts`
- `lib/board-layout.ts`

Key structures:

- `Game.id`: stable unique ID for each card.
- `Game.board`: `{ x, y, w, h, columns }` placement in grid units.
- `Game.ticketType`: controls default card span + allowed presets.

Notes and games currently use local client IDs:

- `tmp_game_<ts>_<seq>`
- `tmp_note_<ts>_<seq>`

This keeps creation behavior close to future backend semantics: every new object
is net-new and never overwrites an existing object by ID.

## Grid Model

- Board is currently fixed at `4` columns (`DEFAULT_BOARD_COLUMNS`).
- Coordinates are grid-space, not pixels.
- `w` and `h` are occupancy spans (how many cells a card consumes).
- Screen rendering computes pixel slots from:
  - `cellWidth = (boardWidth - gaps) / columns`
  - `rowHeight = cellWidth * 1.28`

## Span Policy

Defined in `getCardSpan()` and `getCardSpanPresets()` in `lib/board-layout.ts`.

Current defaults and presets:

| Type | Default | Allowed presets |
|------|---------|-----------------|
| polaroid | 1x2 | 1x2, 2x2 |
| postcard | 2x1 | 2x1, 2x2 |
| ticket | 2x1 | 2x1, 2x2 |
| minimal | 1x1 | 1x1, 2x1, 2x2 |
| widget | 1x1 | 1x1, 2x1, 2x2 |

Rules:

1. `constrainSpanForCard()` only allows preset values per card type.
2. Legacy spans are normalized on load.
3. During drag, hover highlight is locked to current card span.
4. Span change is explicit from note overlay size control.

## Placement Algorithms

Implemented in `lib/board-layout.ts`.

### `applyBoardLayout(games, columns)`

Deterministic packer:

1. Iterate games in array order.
2. For each game, compute effective span.
3. Scan rows top-down and columns left-right.
4. Place at first free rectangle that fits.
5. Mark occupied cells.

This means order in the array is the visual priority order.

### `applyBoardLayoutWithPinned(games, pinnedGameId, pinnedTarget, columns)`

Pinned reflow:

1. Reserve the pinned card at target `x/y/w/h` (after constraints).
2. Re-layout all other cards around it using same first-fit scan.
3. Return full board placements.

This is used for:

- drag drop commit
- explicit size changes
- span cycling

## Drag and Drop Flow

Primary code path: `app/(tabs)/index.tsx`.

Interaction model:

1. Tap card: open `JournalOverlay` (note + size).
2. Long press card: start drag.
3. Move finger: update drag overlay and drop target.
4. Release: commit by pinning dragged card into target + full reflow.

### Target Selection (current behavior)

The board uses distance-based snapping, not overlap-based snapping.

Algorithm in `updateDropTarget()`:

1. Compute dragged card center in pixel space.
2. Enumerate candidate slot anchors for current span.
3. Select nearest slot center (`distSq`).
4. Apply hysteresis against previous slot to prevent rapid flip-flop.
5. Animate highlight box with spring values (`Animated.spring`).

Why this is stable:

- nearest-center changes at natural halfway boundaries
- hysteresis dampens boundary jitter
- highlight movement is animated instead of teleported

## Note Overlay + Size UX

`components/journal-overlay.tsx` now owns size access:

- top-right `Size` button inside note sheet header
- inline preset buttons (small 2x2 glyphs)
- selecting a preset calls `onSelectSize`

`app/(tabs)/index.tsx` provides:

- `sizePresets`: per active game type
- `currentSize`: constrained current board span
- `onSelectSize`: `setGameSpanPreset(activeGame.id, span, columns)`

This keeps note + size in one flow and avoids extra quick-menu state.

## Persistence and Migration

Storage key: `@gamebook/games` in AsyncStorage.

Load migration in `loadGames()`:

1. Fill missing defaults (`ticketType`, `mountStyle`, `postcardSide`).
2. Normalize invalid legacy spans.
3. Re-layout if board placement is missing/outdated (`columns` mismatch).
4. Persist migrated result.

This allows iterative UX changes without stale local data breaking layout.

## Testing Map

Core suites:

- `lib/__tests__/board-layout.test.ts`
  - span constraints
  - layout behavior
  - insertion helpers
- `lib/__tests__/game-store.test.ts`
  - immutable create IDs
  - migration behavior
  - span update APIs
- `components/__tests__/journal-overlay.test.tsx`
  - note fields
  - save behavior
  - size button/options/callback

Recommended when editing this subsystem:

```bash
pnpm typecheck
pnpm exec jest --watchman=false \
  lib/__tests__/board-layout.test.ts \
  lib/__tests__/game-store.test.ts \
  components/__tests__/journal-overlay.test.tsx
```

## Known Constraints and Follow-ups

Current constraints:

- fixed 4-column board
- no auto-scroll while dragging
- no haptic tick on cell transitions
- no drag "jiggle mode"

Active follow-ups are tracked in:

- `docs/exec-plans/active/board-rearrange-and-dynamic-spans.md`
