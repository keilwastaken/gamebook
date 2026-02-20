# Execution Plans

This directory holds execution plans for non-trivial work items.
Plans are versioned artifacts — they capture intent, progress, and decisions
so agents and humans can pick up context without Slack threads or tribal knowledge.

## Structure

```
exec-plans/
├── active/           # Plans currently being worked on
├── completed/        # Finished plans (kept for decision history)
├── tech-debt.md      # Running tracker of known debt and cleanup tasks
├── _template.md      # Copy this to start a new plan
└── README.md         # You are here
```

## Workflow

1. **Starting work**: copy `_template.md` into `active/<slug>.md`.
2. **During work**: update the checklist and log decisions as they happen.
3. **Finishing work**: move the file from `active/` to `completed/`.
4. **Tech debt**: if you notice debt during a plan, add it to `tech-debt.md`.

## Rules

- One plan per feature or non-trivial task.
- Keep plans concise (under ~100 lines). Break large efforts into sub-plans.
- Plans in `active/` should have at most one owner at a time.
- Completed plans are never deleted — they're the decision log.
