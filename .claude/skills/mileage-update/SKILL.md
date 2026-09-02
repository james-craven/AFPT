---
name: mileage-update
description: Update the 14WS 500-Mile Challenge leaderboard at 14WS-500/data.json. Use whenever the user drops a Nike Run Club leaderboard screenshot, or a manual mileage line like "manual update: name: John Doe, miles: 2.34", or otherwise asks to add/update runner miles for the 14WS challenge or pfra.app/14ws-500.
---

# 14WS mileage update

Read `14WS-500/UPDATE_RULES.md` first — it is the authoritative spec for the
data shape and the SET-vs-ADD logic. This file only covers how to run the task.

1. Read `14WS-500/UPDATE_RULES.md` and the current `14WS-500/data.json`.
2. Apply the update:
   - **Screenshot** → each non-zero runner's value REPLACES their `nikeMiles`.
     Runners at 0.00 are not added. Runners absent from the screenshot are left
     alone — never removed, renamed, or zeroed.
   - **Manual line** → APPEND to that runner's `manualAdjustments`, or create the
     runner if the name is new.
   - Recompute `miles = nikeMiles + sum(manualAdjustments[].miles)` for every
     runner carrying manual entries. Round to 2 decimals.
3. Recompute `totalMiles`, set `updatedAt` to the current UTC timestamp, and set
   `statusNote` to "N runners have logged miles" (N = runners with miles > 0).
4. Show the user a before/after table for each changed runner plus the total.
5. Commit and push to the working branch.

Only `14WS-500/data.json` changes. Do not edit HTML/CSS/JS, do not run
`npm test`, do not rebuild `sw.js` — `data.json` is not precached, and
`challenge.mjs` reads only `name` and `miles` (extra fields are inert).

Name matching is by exact display name. If a screenshot name is close to but not
identical to an existing entry (nickname, middle initial, spelling), ask rather
than guessing — a wrong match silently overwrites someone's total.
