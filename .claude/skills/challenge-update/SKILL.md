---
name: challenge-update
description: Update a 14WS unit challenge leaderboard on pfra.app/14ws-500 (14WS-500/). Use whenever the user sends a manual update line like "manual update: name: John Doe, push-ups: 150" or "manual update: name: John Doe, miles: 2.34", drops a Nike Run Club leaderboard screenshot, or otherwise asks to add or update a participant's push-ups, reps or miles for the 14WS challenge.
---

# 14WS challenge update

Read `14WS-500/UPDATE_RULES.md` first. It is the authoritative spec for the data
shapes and the SET-vs-ADD logic. This file only covers how to run the task.

1. Read `14WS-500/UPDATE_RULES.md` and `14WS-500/challenges.json`. The manifest's
   `current` challenge is the file to update. Never write to an archived month.
2. Apply the update to that file:
   - **Push-ups (current challenge type)** → every update is a manual ADD:
     append `{date, count}` to the member's `entries` (or create the member),
     recompute their `count` and the file's `total`.
   - **Mileage** (archived September file, `data.json`) → screenshot values
     REPLACE `nikeMiles`; manual lines APPEND to `manualAdjustments`.
3. Set `updatedAt` to the current UTC timestamp and refresh `statusNote` as the
   rules describe.
4. Show the user a before/after table for each changed participant plus the total.
5. Fetch first, then commit and push to the working branch.

Only the challenge data file changes. Do not edit HTML/CSS/JS, do not run
`npm test`, do not rebuild `sw.js`. Challenge files are not precached.

Some participants are shown as `Anonymous1`, `Anonymous2`, ... and their entry
carries `"anonymous": true` and holds only the alias. Real names live in
`14WS-500/_anon-map.json`, and aliases carry over between months. Check the map
whenever the user gives a name, and never write a real name into a challenge file
(the page downloads it).

That lookup fails CLOSED. A name that is not an exact key in the map is not
automatically public. Compare it against every mapped name first, and ask when it
is a near miss (changed letter, nickname, middle initial). Creating a participant
under a real name that was meant to be hidden is the one error here that cannot
be undone once the page is live.

Name matching against existing participants is case-insensitive but otherwise
exact. If a name is close to but not identical to an existing entry (nickname,
middle initial, spelling), ask rather than guess. A wrong match silently moves
someone's total.
