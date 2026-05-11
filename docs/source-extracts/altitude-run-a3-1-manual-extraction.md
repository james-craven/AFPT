# Altitude Table A3.1 — Manual Extraction Notes
## 2.0 Mile Run Altitude Time Correction

**Source:** DAFMAN 36-2905, 24 March 2026, Attachment 3, Table A3.1
**Source PDF:** `standards/sources/Pages from DAFMAN 36-2905-2.pdf`, page 1 (PDF page 1)
**Extraction method:** `pdftoppm -r 300 -png` → Read tool visual inspection of cropped regions
**Extraction date:** 2026-05-11
**Reference images:** `standards/sources/a31-crops/`

---

## Source Document Header Errors

The A3.1 table header contains two errors in the source PDF itself (not OCR artifacts — the PDF
renders them this way):

| Column | Printed in PDF | Correct value | Basis |
|--------|---------------|---------------|-------|
| Group 1 lower bound | "5350 ft" | **5250 ft** | Matches Group 1 in A3.2, A3.3, A3.4 throughout same document |
| Group 4 boundary | "5350 ft - 5499 ft" | **≥ 6600 ft** | Group 4 is "at or greater than 6600 ft" in all other tables; the displayed value is identical to Group 1 (logically impossible) |

All other boundary labels (Group 2: 5500–5999 ft; Group 3: 6000–6599 ft) are consistent with the
rest of the document and are correct. The Group 1 and Group 4 boundaries applied in code use the
corrected values from A3.2–A3.4.

---

## Altitude Group Definitions (Corrected)

| Group | Altitude Range |
|-------|---------------|
| 0 | Below 5,250 ft — no correction applied |
| 1 | 5,250 ft – 5,499 ft |
| 2 | 5,500 ft – 5,999 ft |
| 3 | 6,000 ft – 6,599 ft |
| 4 | ≥ 6,600 ft |

---

## How the Correction Works

The correction values are added to the time limit for each scoring band (equivalently: subtracted
from the runner's actual time before looking up their score). A runner at altitude gets credit for
the extra effort: their effective sea-level time = actual time − correction.

The correction value depends on the runner's actual performance time (faster runners → smaller
correction; slower runners → larger correction). The run time column defines the performance band
boundary; the correction for a given runner is the row where their actual time ≤ the listed value.

---

## Extracted Table

Corrections are expressed in min:sec. All values read from high-resolution PNG crops with
independent verification passes for each row segment.

Note on last three run-time values: the source PDF displays "24:00:00", "24:48:00", "25:00:00"
in h:mm:ss format — a PDF formatting error. Stored as "24:00", "24:48", "25:00".

| Run Time (≤) | Gr1 | Gr2 | Gr3 | Gr4 | Notes |
|-------------|-----|-----|-----|-----|-------|
| 13:25 | 0:02 | 0:06 | 0:11 | 0:18 | First row; "≤13:25" (at-or-faster) |
| 13:55 | 0:02 | 0:06 | 0:11 | 0:19 | |
| 14:12 | 0:02 | 0:07 | 0:12 | 0:20 | |
| 14:27 | 0:02 | 0:07 | 0:12 | 0:20 | |
| 14:41 | 0:02 | 0:07 | 0:12 | 0:20 | |
| 15:05 | 0:02 | 0:07 | 0:12 | 0:21 | Verified via a31-rows-15b.png |
| 15:17 | 0:02 | 0:07 | 0:12 | 0:21 | |
| 15:28 | 0:02 | 0:08 | 0:13 | 0:22 | |
| 15:38 | 0:02 | 0:08 | 0:13 | 0:22 | |
| 16:09 | 0:02 | 0:08 | 0:13 | 0:22 | |
| 16:29 | 0:03 | 0:08 | 0:14 | 0:23 | |
| 16:49 | 0:03 | 0:09 | 0:15 | 0:24 | |
| 17:08 | 0:03 | 0:09 | 0:15 | 0:25 | |
| 17:18 | 0:03 | 0:09 | 0:15 | 0:26 | |
| 17:37 | 0:03 | 0:09 | 0:16 | 0:26 | |
| 17:55 | 0:03 | 0:09 | 0:16 | 0:27 | |
| 18:23 | 0:03 | 0:10 | 0:16 | 0:28 | |
| 18:39 | 0:03 | 0:10 | 0:17 | 0:28 | Verified via a31-gap-18-19.png |
| 19:07 | 0:03 | 0:10 | 0:17 | 0:29 | |
| 19:36 | 0:03 | 0:11 | 0:18 | 0:31 | |
| 19:45 | 0:03 | 0:11 | 0:18 | 0:31 | |
| 20:06 | 0:04 | 0:11 | 0:19 | 0:32 | |
| 20:44 | 0:04 | 0:12 | 0:20 | 0:34 | |
| 21:09 | 0:05 | 0:13 | 0:21 | 0:36 | |
| 22:04 | 0:05 | 0:13 | 0:22 | 0:37 | |
| 22:28 | 0:05 | 0:14 | 0:23 | 0:38 | |
| 22:45 | 0:05 | 0:14 | 0:24 | 0:40 | |
| 22:50 | 0:05 | 0:15 | 0:25 | 0:42 | |
| 22:58 | 0:05 | 0:15 | 0:26 | 0:43 | |
| 23:15 | 0:06 | 0:17 | 0:28 | 0:46 | |
| 23:30 | 0:06 | 0:18 | 0:29 | 0:49 | |
| 23:36 | 0:06 | 0:18 | 0:31 | 0:51 | |
| 24:00 | 0:06 | 0:19 | 0:32 | 0:54 | PDF shows "24:00:00" — stored as "24:00" |
| 24:48 | 0:07 | 0:20 | 0:34 | 0:57 | PDF shows "24:48:00" — stored as "24:48" |
| 25:00 | 0:08 | 0:22 | 0:37 | 1:02 | PDF shows "25:00:00" — stored as "25:00" |

**Total rows: 35**

---

## Uncertain Cells

None. All 35 × 4 = 140 correction values were read cleanly from the high-resolution crop images.
Multiple crop passes were used to verify every row, with overlapping regions for cross-check:

- `a31-rows-top.png` — rows ≤13:25 through 14:41 (+ partial 15:05)
- `a31-rows-15b.png` — rows 14:12 through 15:28 (confirms 15:05)
- `a31-rows-mid.png` — rows 15:17 through 18:39 (partial)
- `a31-gap-18-19.png` — rows 18:23 through 19:36 (confirms 18:39 and gap)
- `a31-rows-lower.png` — rows 19:07 through 23:15
- `a31-rows-22plus.png` — rows 22:28 through 24:48 (confirms 22:xx values)
- `a31-rows-bottom.png` — rows 23:30 through 25:00

---

## Confidence

**High.** All values verified visually at 300 DPI with multiple independent crop passes covering
all table segments. No OCR was used for data extraction — values were read directly from rendered
PNG images. The only uncertainties are:
1. Group 1 lower bound ("5350" vs "5250") — **documented as source PDF error**; corrected to 5250 ft
2. Group 4 boundary ("5350–5499 ft") — **documented as source PDF error**; corrected to ≥6600 ft

These are header label errors in the source document; the correction data values themselves are
unambiguous and confirmed.

---

## Implementation Status

- [x] Manual extraction complete
- [x] JSON table created: `standards/extracted/tables/altitude-run-2-mile.json`
- [ ] Scoring function `applyRunAltitudeAdjustment()` — pending (Phase A continuation)
- [ ] Modified `scoreRun()` to accept `altitudeGroup` — pending
