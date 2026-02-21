# Plan: Board Scroll Polish And Cap Consistency

**Status:** active
**Owner:** Codex
**Created:** 2026-02-21

## Goal

Make drag auto-scroll feel natural and fully consistent with the 12-row board cap, with no visual/placement mismatch at boundaries.

## Steps

- [ ] Reproduce and document edge scenarios (drag near top/bottom, long hold at cap, release after scroll).
- [ ] Align visual, target, and commit boundaries so the drag overlay never suggests a drop outside the 12-row cap.
- [ ] Tune auto-scroll acceleration/deceleration curve near edges and near the 12-row cap for smoother motion.
- [ ] Validate that auto-scroll cannot expose or depend on rows beyond the capped drop domain.
- [ ] Add or tighten regression tests for: capped Y target, capped overlay motion, and no snap-back on release.
- [ ] Update drag/drop docs with final scroll behavior constants and user-facing interaction contract.

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-21 | Keep strict no-overlap drop policy unchanged while polishing scroll feel | Scroll polish should not alter commit safety contract |
| 2026-02-21 | Keep drag/drop cap at 12 rows | Preserve explicit board depth constraint and avoid unbounded drag domain |

## Notes

- Scope is polish and consistency only.
- Out of scope: reflow/swap behavior changes and board contract changes.
- Primary files expected:
  - `/Users/keilaloia/gamebook/app/(tabs)/index.tsx`
  - `/Users/keilaloia/gamebook/components/board/board-viewport.tsx`
  - `/Users/keilaloia/gamebook/app/(tabs)/__tests__/index.test.tsx`
  - `/Users/keilaloia/gamebook/docs/drag-and-drop.md`
- Primary verification path:
  - `pnpm test --watchman=false --runTestsByPath 'app/(tabs)/__tests__/index.test.tsx'`
  - `pnpm test:dragdrop:regression`
