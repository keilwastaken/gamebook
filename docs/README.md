# Gamebook Docs Index

This directory is the versioned system of record for Gamebook.
Agents and humans should start here, then follow links to deeper docs.

## Navigation

| Doc | Purpose |
|-----|---------|
| [architecture.md](architecture.md) | App structure, layers, and dependency rules |
| [testing-strategy.md](testing-strategy.md) | Test harness overview: unit, component, E2E |
| [ci-gates.md](ci-gates.md) | CI jobs, pass criteria, and how to add gates |
| [exec-plans/](exec-plans/) | Execution plans for in-flight and completed work |

## Conventions

- Keep docs short and verifiable; prefer code-enforced rules over prose.
- Every new architectural boundary or testing pattern gets a doc here.
- Stale docs are worse than no docs — update or delete promptly.
