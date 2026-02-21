# Plan: Board Rearrangement And Dynamic Spans

**Status:** active
**Owner:** Codex
**Created:** 2026-02-20

## Goal

Ship a smooth, intuitive board customization flow where users can rearrange mixed-size cards and optionally resize card span by drop intent.

## Steps

- [ ] Add drag polish: haptic tick when drop target cell changes
- [ ] Add drag polish: auto-scroll when dragging near top/bottom edges
- [ ] Add drag polish: subtle "jiggle mode" while dragging
- [x] Define and implement dynamic span takeover intent model (`1x1 -> 2x1/2x2`)
- [x] Persist explicit span changes in game board placement (`w`,`h`) and keep insert+reflow behavior
- [x] Add scenario-driven tests for all card types and span transitions
- [x] Add fast local drag/drop regression command for sub-1-minute feedback
- [x] Add mutation-testing guardrail for drag/drop core logic (`board-layout`, `game-store`)
- [x] Add CI mutation gate with a 10-minute timeout budget and artifact upload

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-20 | Use long-press as rearrange trigger | Avoid additional mode toggles and keep board interaction direct |
| 2026-02-20 | Use insert + reflow instead of nearest free slot | Produces predictable mixed-span behavior and supports top-left repositioning |
| 2026-02-21 | Keep local drag/drop validation fast and move deep mutation runs to CI | Preserves dev velocity while still guarding against logic regressions |

## Notes

- Current baseline: all cards draggable, insert+reflow enabled, placement persisted.
- Dynamic span takeover applies to all card types and uses push/reflow placement.
- Local drag/drop check path is now `pnpm test:dragdrop:regression` plus `pnpm test:mutation:dragdrop` (dry-run).
- CI enforces `pnpm test:mutation:dragdrop:ci` with a 10-minute job timeout.
