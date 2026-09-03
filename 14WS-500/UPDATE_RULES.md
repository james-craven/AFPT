# 14WS 500-Mile Challenge — data update rules

Only `14WS-500/data.json` changes for mileage updates. No HTML/CSS/JS edits, no
regression suite, no service-worker rebuild (`data.json` is not precached).

## How a runner's total is computed

    miles = nikeMiles + sum(manualAdjustments[].miles)

- `nikeMiles` — the runner's cumulative total from the Nike Run Club leaderboard.
  A screenshot **replaces** this value.
- `manualAdjustments` — miles logged outside NRC (app failed, watch died, etc.).
  These are **append-only**. A screenshot never overwrites or clears them.
- `miles` — the rendered total. Always recompute it; never hand-edit it on a
  runner that has manual adjustments.

Runners with no manual adjustments carry only `name` and `miles`; for them
`nikeMiles` is implicitly equal to `miles`. The presence of `manualAdjustments`
is what marks a runner as needing ADD-not-REPLACE handling.

## Applying a Nike screenshot

1. For each runner in the screenshot with a **non-zero** value, set `nikeMiles`
   to that value (or `miles`, if the runner has no manual adjustments). The
   screenshot value always REPLACES `nikeMiles`; it never touches
   `manualAdjustments`.
2. Runners showing **0.00** are not added to the file. Exception: a runner who
   already exists because of a manual adjustment stays, with `nikeMiles: 0`.
3. Runners absent from the screenshot are left untouched — never removed,
   renamed, or zeroed.
4. Recompute `miles` for anyone with manual adjustments.

## Applying a manual add

Input looks like `manual update: name: John Doe, miles: 2.34` — bare name and
miles, nothing else required.

- **Name already in the file** → append an entry to that runner's
  `manualAdjustments` (creating the array and `nikeMiles: <their current miles>`
  if this is their first one), then recompute `miles`.
- **Name not in the file** → add a new participant with `nikeMiles: 0`, one
  manual entry, and `miles` equal to that entry.

Entry shape (`note` optional — omit it if the user gave no reason):

    { "date": "YYYY-MM-DD", "miles": 2.34, "note": "why this was logged by hand" }

Manual miles never double-count. Nike Run Club challenges only count live GPS
runs, so a hand-logged run will never appear in a later screenshot. Manual
entries are permanent and are never removed by a snapshot.

## Anonymous runners

Some runners ask to be shown as `Anonymous1`, `Anonymous2`, ... instead of their
real name. Their participant entry carries `"anonymous": true`, and `name` holds
only the alias.

**This repository is public. A real name must never appear in it** — not in
`data.json`, not in a mapping file, not in a commit message, not in a note field.
Committing one is not undoable: it stays in git history even after a later edit.

The user supplies the real name in chat when logging miles and states which
alias it belongs to. Ask which alias if they don't say — never guess, and never
infer a mapping from mileage, timing, or ordering.

Aliases are assigned in order of first request: the next new anonymous runner
gets the lowest unused `AnonymousN`. `anonymous: true` is what marks an entry as
alias-only; treat it as permanent unless the user says the runner opted back in.

## Every update

- Round all mileage to 2 decimals.
- Recalculate `totalMiles` as the sum of participants' `miles`.
- Set `updatedAt` to the current UTC timestamp.
- Set `statusNote` to "N runners have logged miles" (N = runners with miles > 0).
- Show a before/after diff per changed runner and the total before committing.
