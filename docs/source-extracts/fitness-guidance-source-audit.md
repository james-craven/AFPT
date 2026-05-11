# Source Audit: AFMAN 36-2905, 24 March 2026

**Audited files:**
- `standards/sources/Pages from DAFMAN 36-2905.pdf` — 13 pages (Chapter 3 excerpt)
- `standards/sources/Pages from DAFMAN 36-2905-2.pdf` — 2 pages (Attachment 3: Altitude Tables)

**Method:** Image PDFs (Microsoft Print to PDF). OCR via pytesseract + Pillow at 200 dpi.
**Date audited:** 2026-05-11

---

## 1. Altitude / Elevation Adjustment

**Finding: YES — fully documented in the source.**

Policy trigger (dafman-36-2905.txt, lines 615–617):
> "When performed at elevation levels > 5,250 feet, refer to the altitude adjustment chart at Attachment 3."

Also applies to ARC members who commute from lower altitude to duty station above 5,250 ft (line 617).

Altitude also mentioned in the context of official travel (line 274): members on TDY where altitude changes may use adjustment.

**Altitude bands (from Attachment 3, dafman-36-2905-2.txt):**

| Group | Altitude range |
|-------|---------------|
| 1     | 5,250 – 5,499 ft |
| 2     | 5,500 – 5,999 ft |
| 3     | 6,000 – 6,599 ft |
| 4     | ≥ 6,600 ft |

**Events with altitude adjustment:**

| Event | Table | Adjustment type |
|-------|-------|----------------|
| 2.0-mile run | A3.1 | Time added (sec) per group |
| 2.0-km walk (male) | A3.2 | Maximum walk time extended per group + age |
| 2.0-km walk (female) | A3.3 | Maximum walk time extended per group + age |
| 20-meter HAMR | A3.4 | Shuttles added: +1 / +2 / +3 / +4 per group |

Walk tables (OCR-confirmed values):
- Male, Age <30: base 16:16, Group 1 16:18, Group 2 16:22, Group 3 16:25, Group 4 16:31
- Female, Age <30: base 17:22, Group 1 17:25, Group 2 17:30, Group 3 17:34, Group 4 17:42

**Events with NO altitude adjustment:** Body composition, muscular strength, core endurance.

---

## 2. Waist-to-Height Ratio (WHtR)

**Finding: YES — WHtR is the sole body composition metric.**

Key references (dafman-36-2905.txt):
- Line 21: `WHtR > .55` = high risk; Tier 2 BFA required if composite PFRA not met
- Line 28: "Body composition will be assessed using WHtR"
- Lines 509–510: "WHtR is calculated by dividing Waist Circumference Measurement (WCM) by height. WHtR results are truncated (not rounded) to the first two [decimal places]"
- Line 13: "The Air Force body composition assessment and standards are agnostic" (age-agnostic)

BMI is not mentioned. Circumference is part of WHtR only (waist / height).

---

## 3. Cardiorespiratory Fitness Events

**Finding: Three events; walk is medical-only.**

Lines 47–48:
> "Cardiorespiratory Fitness: 2.0-mile run, 20-meter High Aerobic Multi-shuttle Run (HAMR) or the 2 kilometer walk (if not medically cleared to run)."

- 2.0-mile run: standard event; 8 laps + 61 ft (indoor), 3,520 yd / 3,219 m (outdoor)
- 20m HAMR: alternative to run; also available indoors; mandatory for AFR when weather/track unavailable (line 139)
- 2.0-km walk: medically exempt only (AF Form 469); pass/fail — no points awarded; does not count toward Excellent (line 174)

---

## 4. Scoring Rules

**Finding: Fully documented.**

Lines 161–164:
> "Members achieve a composite score from 0 to 100 based on the following maximum component scores with component minimums: 50 points for Cardiorespiratory, 20 points for Body Composition (does not have a minimum requirement), 15 points for Muscular Strength, and 15 points for Core Endurance."

| Component | Max pts | Minimum required |
|-----------|---------|-----------------|
| Cardiorespiratory | 50 | Yes |
| Body Composition | 20 | No |
| Muscular Strength | 15 | Yes |
| Core Endurance | 15 | Yes |
| **Total** | **100** | |

Score categories (line 152–153):
- Excellent: > 90
- Satisfactory: 75 – 89.9
- Unsatisfactory: ≤ 74.9 and/or any component minimum not met

Overall pass threshold: composite > 75 (line 12).

---

## 5. Core Endurance Events

Lines 44–45:
> "Core Endurance: 1-minute sit-ups, 2-minute cross leg reverse crunch (CLRC), or [third option not fully captured by OCR]"

At least two modalities: sit-ups and CLRC.

---

## 6. Exemptions / Profiles / AF Form 469

- AF Form 469 is the medical exemption form (lines 141, 147, 264, 321)
- Members may be exempt from specific component modalities but still test on approved ones
- Walk-only members are "component exempt" for cardiorespiratory (line 156)
- Component exempt scoring handled per paragraph 3.9 (line 225)
- Members on PFRA Hold (Not Ready): all with one or more component exemptions (line 260)
- Commanders may request exemptions via "tier waiver process" (line 147)

---

## 7. PFRA vs Legacy Fitness Test

The document consistently uses "PFRA" (Physical Fitness Readiness Assessment). No mention of the old "FA" (Fitness Assessment) terminology in these pages, confirming this is the current/active standard as of 24 March 2026.

---

## OCR Quality Notes

- Main PDF (13 pages): OCR quality good for prose; tables partially garbled (altitude correction seconds table A3.1 row values not reliably parsed)
- Attachment 3 PDF (2 pages): Walk and HAMR table structures captured; run correction values (seconds per group) not reliable from OCR due to multi-column table formatting
- All policy text and key numbers are considered reliable

---

## Raw extracted text location

- `standards/sources/extracted-text/dafman-36-2905.txt` (648 lines)
- `standards/sources/extracted-text/dafman-36-2905-2.txt` (140 lines)
