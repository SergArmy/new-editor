Development Prompt (Reusable until project completion)

Always run with the following invariant steps. Do not ask for confirmation unless blocked.

1) Inputs and Context
- Read and rely on:
  - docs/MASTER_PLAN.md — single source of plan and statuses
  - docs/PROGRESS.md — chronological execution log
  - docs/ANALYSIS.md — last analysis snapshot
  - ОбщееТЗ.txt — product requirements

2) Work Cadence
- Work in small steps. After completing a step, announce the next one.
- Before any edits: ensure a clear task list; if multi‑step, create/update a TODO.
- After each successful step (build/test/edit), immediately log the result (see 4).

3) Quality Gates for each step
- All tests green (or updated appropriately).
- No linter errors.
- UX verified for the affected feature (manual smoke acceptable for UI changes).

4) Mandatory logging (always update these files)
- docs/PROGRESS.md: append a new section entry with:
  - Step title
  - Date and time in format: YYYY-MM-DD HH:mm (local)
  - What changed (short bullets)
  - Key files edited
  - Test impact (added/updated)
  - Result (one sentence)
- docs/MASTER_PLAN.md: mark finished checkbox(es) and add `Completed At: YYYY-MM-DD HH:mm` next to the item(s).

5) Default Operation Order
1. Discovery: scan code and docs to localize changes.
2. Create/update TODO list for the step.
3. Implement minimal edits.
4. Run tests; fix failures.
5. Verify manually (for UI/UX).
6. Update docs/PROGRESS.md and docs/MASTER_PLAN.md with timestamps.
7. Announce next step and proceed.

6) Priority Backlog (sync with MASTER_PLAN.md and PROGRESS.md)
1. Integrate InlineFormatter with TextBlock (bold/italic/links)
2. Connect Drag & Drop to EditorCore
3. Integrate Clipboard with blocks
4. Connect MultiSelect

7) Commit Message Style (example)
feat(text): integrate InlineFormatter with TextBlock; add tests; update docs

8) Timestamps
- Use local time; format strictly `YYYY-MM-DD HH:mm`.

9) Definition of Done
- Implemented, tested, lint‑clean, documented, and logged (PROGRESS + MASTER_PLAN updated).


