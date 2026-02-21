# Board Drag and Drop Architecture

This document is the implementation contract for Gamebook board drag/drop.
It is intentionally detailed because this system is production-critical and
has already gone through one behavior regression during refactor.

Use this with:

- `/Users/keilaloia/gamebook/docs/architecture.md`
- `/Users/keilaloia/gamebook/docs/testing-strategy.md`
- `/Users/keilaloia/gamebook/docs/exec-plans/completed/board-rearrange-and-dynamic-spans.md`

## Status Snapshot (2026-02-21)

Current product contract is **strict no-overlap placement**:

1. Dragging into an empty slot moves only the dragged card.
2. Dragging onto any occupied cell is rejected.
3. No auto-push, no insert+reflow, no implicit card swapping.
4. Conflict feedback is per-cell (only blocked grid cells are marked).
5. Home screen drag targeting/auto-scroll is capped to a fixed 4x6 board (6 rows).

## Why This Contract Exists

The earlier insert/reflow behavior was technically consistent but felt unstable
and confusing to users during drag. Users experienced card movement as
"automatic pushing" that was hard to predict.

The team intentionally optimized for:

- stable mental model
- low surprise during drag
- explicit user control over rearrangement
- safe production behavior over clever placement

## Non-Negotiable Behavior Contract

### 1) Static Board On Empty Drop

If target cells are empty, only the dragged card updates position/span.
All surrounding cards keep their exact coordinates.

### 2) Occupied Drop Is Denied

If any target cell overlaps another card, commit is rejected and board state
remains unchanged.

### 3) No Swap Path

Swap-on-overlap was explored and intentionally removed.
There is no accepted "unsafe swap" fallback.

### 4) Dynamic Span Intent Is Allowed During Hover

Hover can still morph `w/h` based on boundary intent and allowed presets.
This only affects the proposed target shape; commit still requires an empty
footprint.

### 5) Conflict Is Cell-Scoped, Not Whole-Target Scoped

When target overlaps, only the specific blocked cells are highlighted.
The entire target region is not globally marked invalid.

## Ownership Boundaries

### UI Boundary

- `/Users/keilaloia/gamebook/app/(tabs)/index.tsx`
- `/Users/keilaloia/gamebook/components/board/board-viewport.tsx`

Responsibilities:

- gesture capture (`PanResponder`)
- nearest-slot target selection + hysteresis
- drag overlay + drop target indicator rendering
- conflict-cell visualization
- dispatching drop intent

### Domain/Engine Boundary

- `/Users/keilaloia/gamebook/lib/board/engine.ts`
- `/Users/keilaloia/gamebook/lib/board/metrics.ts`
- `/Users/keilaloia/gamebook/lib/board-layout.ts`

Responsibilities:

- span constraints and allowed presets
- placement normalization and clamping
- overlap/conflict detection
- strict commit policy (accept empty, reject overlap)
- board geometry metrics

### Persistence Boundary

- `/Users/keilaloia/gamebook/lib/game-store.ts`

Responsibilities:

- load/migrate stored games
- expose `moveGameToBoardTarget`
- call strict commit engine and persist results

## Runtime Flow

### Drag Start

1. Long-press card in `/Users/keilaloia/gamebook/app/(tabs)/index.tsx`.
2. Base span is constrained via `constrainSpanForCard`.
3. Initial target is current card slot.
4. Conflict cells are computed immediately for the initial target.

### Drag Move (`updateDropTarget`)

1. Compute drag center in board pixels.
2. Compute intent span via `getAxisIntentSpan` (x and y independently).
3. Clamp intent to allowed card presets with `chooseNearestAllowedSpan`.
4. Enumerate candidate slots and choose nearest center.
5. Apply hysteresis to avoid jitter/flicker near boundaries.
6. Compute conflicts via `getDropTargetConflictCells`.
7. Update animated target indicator + per-cell conflict markers.
8. Trigger a haptic selection tick when the resolved slot key changes.
9. Apply edge auto-scroll when pointer nears top/bottom viewport edges.
10. Auto-scroll can use bottom content padding so row 6 cards can be re-grabbed above the tab bar.

### Drop Commit

1. UI calls `moveGameToBoardTarget(gameId, target, columns)`.
2. Store calls `commitMoveStrictNoOverlap`.
3. Engine behavior:
   - normalize origin/target
   - if same placement: no-op
   - if any overlap: no-op
   - else: update only moved card board placement
4. Persist updated list.

## Core Engine Functions

### `/Users/keilaloia/gamebook/lib/board/engine.ts`

- `getDropTargetConflictCells(games, draggingGameId, target, columns)`
  - returns exact overlapped cells
  - used for UI invalid-cell feedback

- `commitMoveStrictNoOverlap(games, gameId, target, columns)`
  - single source of truth for drop commit policy
  - rejects overlap and keeps neighbors static

- `chooseNearestAllowedSpan(presets, intent, fallback)`
  - converts raw hover intent into valid preset span

### `/Users/keilaloia/gamebook/lib/board-layout.ts`

Still authoritative for:

- `getCardSpan`
- `getCardSpanPresets`
- `constrainSpanForCard`
- `applyBoardLayout`
- `applyBoardLayoutWithPinned` (used by span-cycling flows)
- `getAxisIntentSpan`
- `getHoverZone`

## Retired Path (Do Not Reintroduce Accidentally)

The following functions were removed on 2026-02-21 as part of the strict
no-overlap contract cleanup:

- `findBestInsertion`
- `previewInsertionAtIndex`

Reason:

- They represented insertion/reflow planning that no longer matches runtime
  behavior.
- Keeping them created architectural drift and made refactors likely to restore
  legacy behavior by accident.

If a future feature needs insertion/reflow again, it must be a deliberate
product decision with:

1. updated contract docs
2. explicit new engine boundary API
3. rewritten regression/mutation expectations

## Visual Feedback Model

During drag:

- Neutral grid cells are always rendered as board scaffolding.
- Active target rectangle animates with spring motion.
- Occupied overlap cells render as explicit conflict cells.
- Non-dragged cards run a subtle jiggle animation while drag is active.
- Dropping target-cell transitions emit light haptic ticks for wayfinding.

This keeps feedback local and actionable: users see exactly which cells block a
commit.

## Persistence + Migration Notes

`/Users/keilaloia/gamebook/lib/game-store.ts` load path still normalizes:

- missing type defaults
- unsupported legacy ticket types
- invalid spans
- missing/outdated board placements

Drop commit uses strict engine policy regardless of stored payload shape.

## Production-Critical Test Map

These tests are the release guardrail for drag/drop behavior.

### Primary guardrail suites

- `/Users/keilaloia/gamebook/app/(tabs)/__tests__/index.test.tsx`
  - pan responder drag flow
  - dynamic span morph behavior
  - haptic selection tick on target transitions
  - overlap cell highlighting contract
  - drop target payload passed to store

- `/Users/keilaloia/gamebook/lib/__tests__/game-store.test.ts`
  - `moveGameToBoardTarget` static-board behavior
  - overlap rejection no-op behavior
  - mixed-span overlap pressure scenarios
  - migration and normalization around persisted board fields

- `/Users/keilaloia/gamebook/lib/__tests__/board-layout.test.ts`
  - span/preset constraints
  - deterministic base layout and pinned layout behavior
  - hover intent primitives

### Additional engine-focused suite

- `/Users/keilaloia/gamebook/lib/board/__tests__/engine.test.ts`
  - conflict-cell precision
  - strict accept/reject commit behavior in pure logic form

## Command Checklist

Fast local regression (default):

```bash
pnpm test:dragdrop:regression
```

Recommended pre-merge drag/drop run:

```bash
pnpm test --watchman=false --runTestsByPath \
  'app/(tabs)/__tests__/index.test.tsx' \
  'lib/__tests__/board-layout.test.ts' \
  'lib/__tests__/game-store.test.ts' \
  'lib/board/__tests__/engine.test.ts'
```

Mutation guardrail:

```bash
pnpm test:mutation:dragdrop
pnpm test:mutation:dragdrop:ci
```

## Change Protocol For Future Work

If you change drag/drop behavior, do all of the following in the same PR:

1. Update this document first (contract section + runtime flow section).
2. Update `/Users/keilaloia/gamebook/docs/architecture.md` if boundaries move.
3. Update or add regression tests in all affected layers.
4. Re-run mutation checks and attach score delta if material.
5. Call out contract changes explicitly in PR summary.

## Quick Decision Table

Use this when implementing feature requests quickly:

| Requested behavior | Current answer |
|--------------------|----------------|
| Drop into empty space | Allowed; moved card only |
| Drop over occupied cell | Rejected; no board change |
| Auto-push neighbors | Not supported |
| Auto-swap two cards | Not supported |
| Dynamic hover span intent | Supported within allowed presets |
| Highlight invalid target | Supported at conflicting cell level |

When in doubt, prefer the strict no-overlap contract over convenience logic.
