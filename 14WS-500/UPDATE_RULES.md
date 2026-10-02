# 14WS unit challenges — data update rules

The page at https://pfra.app/14ws-500 shows one tab per monthly challenge.
`14WS-500/challenges.json` lists the tabs oldest first (left to right), and `current` names the
challenge that is live. **Updates go to the current challenge's data file**
(its `data` path in the manifest), never to an archived month.

| Challenge | File | Metric | Status |
|---|---|---|---|
| October 2026 — 20K push-ups | `challenges/2026-10-pushups.json` | push-ups | current |
| September 2026 — 1K miles | `data.json` | miles | final, archived |

Updates change only the challenge's data file. No HTML/CSS/JS edits, no
regression suite, no service-worker rebuild (challenge files are not
precached).

## Push-up challenges (all manual)

There is no app for push-ups. Every update is a manual ADD.

Input looks like `manual update: name: John Doe, push-ups: 150` (also `reps:`
or a bare number). Counts are whole numbers.

Participant shape:

    { "name": "John Doe", "count": 150,
      "entries": [ { "date": "YYYY-MM-DD", "count": 150 } ] }

- **Name already in the file** → append an entry, then recompute
  `count = sum(entries[].count)`.
- **Name not in the file** → add a participant with one entry.
- Recompute `total` as the sum of every participant's `count`.
- Set `updatedAt` to the current UTC timestamp.
- Set `statusNote` to "N members have logged push-ups" (N = members with
  count > 0).

The file's `metric` block tells the page what unit to show; leave it alone.

## Starting a new month

1. Create `challenges/<YYYY-MM>-<metric>.json` with `challengeName`, `metric`,
   `goal`, `startDate`, `endDate`, and an empty `participants` list.
2. Add it to the end of `challenges.json` (tab label "<Month> <YYYY>") and
   point `current` at it.
3. Set the finished month's `statusNote` to "Final results — N <participants>".
4. Update the table above. Adding a file and editing the manifest is a page
   change: run the full test suite before pushing.

# Mileage challenges (September 2026, archived)

The rest of this section describes the September mileage file, `data.json`.
It is final; keep these rules for reference and for any future mileage month.

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

Some participants ask to be shown as `Anonymous1`, `Anonymous2`, ... on the
public leaderboard. Their entry in the challenge file carries
`"anonymous": true`, and `name` holds only the alias. **Aliases carry over
between challenges:** the same person keeps the same alias every month, so a
push-up update for a mapped name goes to that alias in the current file. Everything else works the same — a runner can be anonymous
and still have `nikeMiles` and `manualAdjustments`.

**Never put a real name in any challenge file.** Every visitor to the page downloads
that file, so a name there is one devtools tab away even though the rendered
leaderboard shows only the alias.

Real names live in `14WS-500/_anon-map.json`. The page never fetches it —
`challenge.mjs` reads only `challenges.json` and the files it lists — and the leading underscore keeps Jekyll
from publishing it to pfra.app.

When the user gives a real name for a mileage update, look it up in
`_anon-map.json` and apply the miles to that alias. Add a mapping only when the
user says that runner wants to be anonymous, assigning the lowest unused
`AnonymousN`.

Alias lookup is case-insensitive: `jeffrey budai` resolves the same as
`Jeffrey Budai`.

**The lookup must fail closed.** Do not treat "not an exact key in the map" as
proof the runner is public — compare the given name against every mapped name and
stop to ask if it is a near miss (a changed letter, a nickname, a middle initial,
a transposition). A one-letter typo like `Jane Smitn` for a mapped `Jane Smith`
is exactly this case: an exact-match miss would create a *new participant under
the real name* and publish it to the leaderboard. Adding a wrong runner's miles is a number you can correct;
publishing a name someone asked you to hide cannot be taken back once the page
is live. When a near miss turns out to be the same person, add the variant
spelling to the map as another key for that alias, so it resolves next time.

`anonymous: true` is permanent unless the user says the runner opted back in.
Never infer a mapping from mileage, timing, or ordering — ask.

If an anonymous runner shows up in a Nike screenshot under their real name, set
`nikeMiles` on their alias entry. The real name still never enters `data.json`.

## Every mileage update

- Round all mileage to 2 decimals.
- Recalculate `totalMiles` as the sum of participants' `miles`.
- Set `updatedAt` to the current UTC timestamp.
- Set `statusNote` to "N runners have logged miles" (N = runners with miles > 0).
- Show a before/after diff per changed runner and the total before committing.
