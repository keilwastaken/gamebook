# Plan: Board Rearrangement And Dynamic Spans

**Status:** completed
**Owner:** Codex
**Created:** 2026-02-20
**Last Updated:** 2026-02-21
**Completed:** 2026-02-21

## Goal

Ship a smooth board customization flow where drag behavior is predictable,
legible, and safe for production changes.

## Current Contract (Shipping)

1. Drag to empty grid cells: move succeeds; only dragged card changes.
2. Drag to occupied cells: move is rejected; board remains unchanged.
3. No auto-push, no insert+reflow drop behavior, no swap fallback.
4. Conflict feedback is per-cell so users can see the exact blocked region.
5. Dynamic span intent remains enabled, constrained by per-card presets.

## Progress

### Completed

- [x] Define and implement dynamic span takeover intent model (`1x1 -> 2x1/2x2` where allowed)
- [x] Persist explicit span changes in board placement (`w`, `h`)
- [x] Move commit policy to board engine boundary (`commitMoveStrictNoOverlap`)
- [x] Enforce strict no-overlap commit rule across UI -> store path
- [x] Add overlap rejection scenarios in store tests
- [x] Add conflict-cell feedback (cell-level invalid indicators)
- [x] Add fast local drag/drop regression command for sub-1-minute feedback
- [x] Add mutation-testing guardrail for drag/drop core logic (`board-layout`, `game-store`)
- [x] Add CI mutation gate with timeout budget and artifact upload
- [x] Retire unused insertion/reflow helper path (`findBestInsertion`, `previewInsertionAtIndex`) and associated tests

### Deferred Follow-Ups (Out of Completed Scope)

- [ ] Add drag polish: haptic tick when drop target cell changes
- [ ] Add drag polish: auto-scroll when dragging near top/bottom edges
- [ ] Add drag polish: subtle "jiggle mode" while dragging

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-20 | Use long-press as rearrange trigger | Avoid explicit mode toggles; keep interaction direct |
| 2026-02-20 | Enable dynamic hover span intent | Allows expressive sizing without separate resize mode |
| 2026-02-21 | Replace insert+reflow drop commit with strict no-overlap commit | Users found automatic pushing confusing and hard to predict |
| 2026-02-21 | Reject occupied drops instead of swap fallback | Simpler mental model and lower accidental rearrangement risk |
| 2026-02-21 | Show cell-level conflict indicators instead of broad invalid target tint | More actionable error feedback for mixed-span drops |
| 2026-02-21 | Remove legacy insertion helper functions and tests | Prevent accidental reintroduction of retired behavior during refactors |

## Why We Pivoted From Reflow

Insert+reflow made the board feel "alive" but not always controllable.
In user interaction, this was perceived as forced movement and hidden side
effects. The strict no-overlap model trades some convenience for clarity:
users now explicitly make room before dropping into contested space.

## Implementation Notes

- UI target selection + visualization:
  `/Users/keilaloia/gamebook/app/(tabs)/index.tsx`
- Viewport containment boundary:
  `/Users/keilaloia/gamebook/components/board/board-viewport.tsx`
- Commit/conflict engine:
  `/Users/keilaloia/gamebook/lib/board/engine.ts`
- Span/layout primitives:
  `/Users/keilaloia/gamebook/lib/board-layout.ts`
- Store integration:
  `/Users/keilaloia/gamebook/lib/game-store.ts`

## Verification Baseline

Primary suites:

- `/Users/keilaloia/gamebook/app/(tabs)/__tests__/index.test.tsx`
- `/Users/keilaloia/gamebook/lib/__tests__/game-store.test.ts`
- `/Users/keilaloia/gamebook/lib/__tests__/board-layout.test.ts`

Engine precision suite:

- `/Users/keilaloia/gamebook/lib/board/__tests__/engine.test.ts`

Core local command:

```bash
pnpm test:dragdrop:regression
```

Recommended full drag/drop check before merging contract changes:

```bash
pnpm test --watchman=false --runTestsByPath \
  'app/(tabs)/__tests__/index.test.tsx' \
  'lib/__tests__/board-layout.test.ts' \
  'lib/__tests__/game-store.test.ts' \
  'lib/board/__tests__/engine.test.ts'
```

## Next Actions

1. Land optional drag polish tasks without changing commit contract.
2. Keep docs/tests/mutation scope aligned whenever behavior changes.
3. Open a new plan if product intentionally revisits swap/reflow behavior.
