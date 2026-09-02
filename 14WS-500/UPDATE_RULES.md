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
   to that value (or `miles`, if the runner has no manual adjustments).
2. Runners showing **0.00** are not added to the file. Exception: a runner who
   already exists because of a manual adjustment stays, with `nikeMiles: 0`.
3. Runners absent from the screenshot are left untouched — never removed,
   renamed, or zeroed.
4. Recompute `miles` for anyone with manual adjustments.

## Applying a manual add

Append an entry to that runner's `manualAdjustments` (creating the array and
`nikeMiles` if this is their first one), then recompute `miles`.

    { "date": "YYYY-MM-DD", "miles": 1.15, "note": "why this was logged by hand" }

Caveat: this assumes the manual miles will *never* show up in NRC. If a manual
add was only covering a stale screenshot and the run later lands in Nike, drop
that entry when it does — otherwise it double-counts.

## Every update

- Round all mileage to 2 decimals.
- Recalculate `totalMiles` as the sum of participants' `miles`.
- Set `updatedAt` to the current UTC timestamp.
- Set `statusNote` to "N runners have logged miles" (N = runners with miles > 0).
- Show a before/after diff per changed runner and the total before committing.
