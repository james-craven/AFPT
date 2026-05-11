# Altitude Table Extraction Notes

**Source:** DAFMAN 36-2905, 24 March 2026, Attachment 3 (two PDF pages)
**OCR pipeline:** `pdftoppm -r 200 -png` → Python PIL + pytesseract
**Extracted text:** `standards/sources/extracted-text/dafman-36-2905-2.txt`

---

## A3.1 — Altitude Time Correction for 2.0 Mile Run

**Status: UNRESOLVED**

The OCR output for page 1 is completely garbled. The table headers are misread (e.g., "5350 ft - 5499 ft" where "5350" should be "5250"; "500 ft - 5999 ft" where the leading "5" was dropped). The correction values appear as disconnected fragments of numbers (`0:06`, `0:07`, `0:08`, ..., `0:13`, `0:18`, `0:19`, ...) with no reliable row associations. OCR rendering character sequences like `SIS/S/S/S4]4]4)y4ya` confirm the table structure was too complex for this OCR pass.

**Decision:** Do not create `altitude-run-2-mile.json`. Do not implement `applyRunAltitudeAdjustment()`. The run altitude correction requires manual inspection of the PDF image. This is documented as a pending subtask for Phase A.

**Impact:** `scoreRun()` (via `scoreFromTable()`) will not apply altitude adjustment until A3.1 is resolved. Walk and HAMR altitude adjustment proceed on schedule.

---

## A3.2 — Altitude Time Correction for 2.0 Kilometer Walk (Male)

**Status: CONFIRMED — high confidence**

OCR text (lines 102–114 of extracted file) is clean. All values cross-referenced against `af-pfra-2026.json`:
- The base column (group 0) exactly matches `maximumTimes.male` in the standards file.
- No corrections required.

| Age Group   | Base  | Gr1   | Gr2   | Gr3   | Gr4   |
|-------------|-------|-------|-------|-------|-------|
| under-30    | 16:16 | 16:18 | 16:22 | 16:25 | 16:31 |
| 30-39       | 16:18 | 16:20 | 16:24 | 16:27 | 16:33 |
| 40-49       | 16:23 | 16:25 | 16:28 | 16:31 | 16:37 |
| 50-59       | 16:40 | 16:42 | 16:45 | 16:48 | 16:53 |
| 60-and-over | 16:58 | 16:59 | 17:02 | 17:05 | 17:10 |

Stored in: `standards/extracted/tables/altitude-walk-2km-male.json`

---

## A3.3 — Altitude Time Correction for 2.0 Kilometer Walk (Female)

**Status: CONFIRMED with documented corrections — medium confidence**

OCR text (lines 115–127) is mostly clean. Three OCR artifacts corrected:

| Field | Raw OCR | Corrected | Basis |
|-------|---------|-----------|-------|
| 50-59, group 0 | `18:1` | `18:11` | Cross-reference: `af-pfra-2026.json` maximumTimes.female['50-59'] = `"18:11"` |
| 60-and-over, group 2 | `[8:58` | `18:58` | Leading `1` dropped by OCR; value consistent with +4s from Gr1 (18:54) |
| 60-and-over, group 3 | `[9:02` | `19:02` | Leading `1` dropped by OCR; consistent with +8s from Gr1 (18:54); gap to Gr4 (19:08) = +6s |

The `[` character preceding `8:58` and `9:02` is the OCR's misread of `1`. The leading digit drop is a known Tesseract artifact with certain font/alignment combinations.

Full table with corrections applied:

| Age Group   | Base  | Gr1   | Gr2   | Gr3   | Gr4   |
|-------------|-------|-------|-------|-------|-------|
| under-30    | 17:22 | 17:25 | 17:30 | 17:34 | 17:42 |
| 30-39       | 17:28 | 17:30 | 17:35 | 17:40 | 17:47 |
| 40-49       | 17:49 | 17:52 | 17:56 | 18:00 | 18:07 |
| 50-59       | 18:11 | 18:13 | 18:17 | 18:21 | 18:28 |
| 60-and-over | 18:53 | 18:54 | 18:58 | 19:02 | 19:08 |

Stored in: `standards/extracted/tables/altitude-walk-2km-female.json`

---

## A3.4 — Altitude Time Correction for HAMR

**Status: CONFIRMED — high confidence**

OCR text (lines 129–139) is crystal clear. Table is simple: one value per group.

| Group | Altitude Range | Add Shuttles |
|-------|---------------|--------------|
| 1 | 5,250 – 5,499 ft | +1 |
| 2 | 5,500 – 5,999 ft | +2 |
| 3 | 6,000 – 6,599 ft | +3 |
| 4 | ≥ 6,600 ft       | +4 |

Stored in: `standards/extracted/tables/altitude-hamr-20m.json`

---

## Altitude Group Boundaries

Source text (line 104): `5250 ft — 5500 ft — 6000 ft — 6600 ft`

Boundary interpretation (consistent across A3.2, A3.3, A3.4):
- Group 0: below 5,250 ft (no adjustment)
- Group 1: 5,250 – 5,499 ft
- Group 2: 5,500 – 5,999 ft
- Group 3: 6,000 – 6,599 ft
- Group 4: ≥ 6,600 ft

The OCR for A3.1 shows "5350 ft - 5499 ft" for Group 1 — this is an OCR misread of "5250". The boundary 5,250 ft is consistently used across the walk and HAMR tables and in the main body of DAFMAN 36-2905.
