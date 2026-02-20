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

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-20 | Use long-press as rearrange trigger | Avoid additional mode toggles and keep board interaction direct |
| 2026-02-20 | Use insert + reflow instead of nearest free slot | Produces predictable mixed-span behavior and supports top-left repositioning |

## Notes

- Current baseline: all cards draggable, insert+reflow enabled, placement persisted.
- Dynamic span takeover applies to all card types and uses push/reflow placement.
