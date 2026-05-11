# Source of Truth Manifest

Every scoring rule, event option, exemption, pass/fail threshold, and timing rule in this app
must be traceable to an entry in this document. If a rule is not in this manifest, it must not
be in the app.

**Governing principle:** The official Air Force guidance documents are the source of truth.
Neither legacy code nor Claude's assumptions substitute for them.

---

## Source Documents

### Source 1 — PFRA Scoring Charts (primary, verified locally)

| Field | Value |
|-------|-------|
| Title | USAF Physical Fitness Readiness Assessment Scoring |
| Effective date | 1 March 2026 |
| Publisher | Air Force Personnel Center (AFPC) |
| Source URL | https://www.afpc.af.mil/Portals/70/documents/FITNESS/PFRA%20Scoring%20Charts.pdf |
| Local path | `standards/sources/PFRA-Scoring-Charts.pdf` |
| Pages | 11 |
| SHA-256 | `9ee7689f8f52e48e060cb88846d2dfc2bccab76ae41d2a433d08f2ac7e89aea3` |
| PDF creation date | 2026-02-06 |
| PDF modified date | 2026-02-18 |
| Extraction status | Fully extracted; all 9 scoring tables in `standards/extracted/tables/` |
| Local metadata | `standards/af-pfra-2026.json`, `standards/extracted/PFRA-Scoring-Charts.notes.md` |

**What this source governs:**

| Feature | Covered? | Notes |
|---------|----------|-------|
| WHtR body composition scoring | Yes | Uniform across sex/age; 20 points max |
| Push-up scoring | Yes | 15 points max; extracted to `push-up.json` |
| Hand-release push-up scoring | Yes | 15 points max; extracted to `hand-release-push-up.json` |
| Sit-up scoring | Yes | 15 points max; extracted to `sit-up.json` |
| Cross-leg reverse crunch scoring | Yes | 15 points max; extracted to `cross-leg-reverse-crunch.json` |
| Forearm plank scoring | Yes | 15 points max; extracted to `forearm-plank.json` |
| 2-mile run scoring | Yes | 50 points max; extracted to `two-mile-run.json` |
| 20-meter HAMR scoring | Yes | 50 points max; extracted to `hamr-20-meter.json` |
| 2.0 km walk (pass/fail thresholds) | Yes | Maximum times by sex and age group |
| Score categories (Excellent/Satisfactory/Unsatisfactory) | Yes | ≥90 / 75–89.9 / <75 |
| **Altitude adjustment** | **No** | See altitude audit below |
| Lap/timing guidance (8 laps for 2-mile) | No | Not in scoring charts; see Source 3 |
| Exemption guidance | No | See Source 2 |
| Walk scoring (points) | No | Walk is pass/fail in this source |

---

### Source 2 — DAFMAN 36-2905 (policy document, not yet locally verified)

| Field | Value |
|-------|-------|
| Title | DAFMAN 36-2905, Department of the Air Force Manual — Physical Fitness |
| Publisher | Department of the Air Force / AFPC |
| Source URL | https://www.afpc.af.mil/Portals/70/documents/FITNESS/afman36-2905.pdf |
| Local path | Not yet downloaded — AFPC blocks automated PDF downloads |
| Verification status | **UNVERIFIED — requires manual download and review** |

**What this source is expected to govern:**

| Feature | Expected? | Verification status |
|---------|-----------|---------------------|
| Exemption rules (medical, deployment, pregnancy) | Likely | Unverified |
| Altitude adjustment | Unknown | **See altitude audit — must verify** |
| Diagnostic vs scored testing windows | Likely | Unverified |
| Special populations / waivers | Likely | Unverified |
| Tie-breaking or rounding rules | Possible | Unverified |

**Action required:** A human must manually download and review this PDF before any
exemption or altitude behavior is added, changed, or removed. Do not rely on legacy
`main2.js` behavior as a proxy for DAFMAN 36-2905 content.

---

### Source 3 — AFPC Fitness Program page (not yet verified)

| Field | Value |
|-------|-------|
| Title | AFPC Career Management — Fitness Program |
| Source URL | https://www.afpc.af.mil/Career-Management/Fitness-Program/ |
| Local path | Not fetched — AFPC returns 403 to automated requests |
| Verification status | **UNVERIFIED — requires manual browser review** |

**What this source may govern:**
- Lap/timing guidance for the 2-mile run
- Transition timeline (diagnostic Mar 1–Jun 30 2026; official testing Jul 1 2026)
- Links to current attachments, DTMs, or updated scoring charts

---

### Source 4 — SAF-MR DTM on PFRA Program Changes (not yet located)

| Field | Value |
|-------|-------|
| Title | SAF-MR Directive-Type Memorandum — changes to the USAF Physical Fitness Readiness Assessment Program |
| Source URL | Unknown — not yet located |
| Verification status | **NOT YET LOCATED** |

**What this source may govern:**
- Authority for removing legacy 1.5-mile run
- Altitude adjustment policy under PFRA
- Effective dates for mandatory vs diagnostic testing

---

## Altitude Adjustment Audit

### Question
Does the current official USAF fitness assessment guidance include altitude adjustment for any event?

### What was searched

| Source | Method | Terms searched |
|--------|--------|---------------|
| `standards/extracted/PFRA-Scoring-Charts.txt` | `grep -i` | altitude, elevat, adjustment, 5250, 5499, 5500, 6000, 6600, run adjustment, walk adjustment, HAMR adjustment |
| `standards/extracted/PFRA-Scoring-Charts.notes.md` | Manual read | All content |
| `standards/af-pfra-2026.json` | Manual read | All content |

### Findings

**PFRA Scoring Charts PDF (verified):** Zero matches for all altitude/elevation/adjustment
keywords. The 11-page document contains scoring tables for 9 events (WHtR, push-up, HR push-up,
sit-up, CLRC, forearm plank, 2-mile run, HAMR, 2km walk) with no altitude correction column,
footnote, or table.

**DAFMAN 36-2905 (unverified):** Not yet downloaded. Cannot confirm or deny altitude guidance
at the policy level.

**AFPC Fitness Program page (unverified):** 403 returned to automated fetches. Cannot confirm.

**Legacy code context:** The altitude adjustment in `main2.js` (`calculateAltitudeDiff()`,
`#alt-select` element) was implemented for the **old 1.5-mile run AFT standard**, not PFRA.
It applied time credits (in seconds) for four altitude groups:
- Group 1: 5,250–5,499 ft
- Group 2: 5,500–5,999 ft
- Group 3: 6,000–6,599 ft
- Group 4: >6,600 ft

The old 1.5-mile run no longer exists in PFRA. The equivalent cardio events (2-mile run, HAMR)
have no altitude table in the PFRA Scoring Charts PDF.

### Current finding
**The PFRA Scoring Charts contain no altitude adjustment.**

### What this does NOT yet prove
Whether DAFMAN 36-2905 or a current DTM includes altitude adjustment guidance for the 2-mile
run or HAMR. The scoring charts show points per performance; the policy document may specify
whether performance is adjusted before lookup.

### Required action before altitude decision
A human must manually download and review:
1. `https://www.afpc.af.mil/Portals/70/documents/FITNESS/afman36-2905.pdf`
2. Any linked attachments or DTMs on the AFPC Fitness Program page

Search those documents for altitude, elevation, adjustment, and the altitude group thresholds
(5250/5500/6000/6600 ft). Document the finding and update this manifest.

### Interim rule
**Do not remove `#alt-select` or the altitude adjustment charts (`runAltitudeAdjust.webp`,
`walkAltitudeAdjust.webp`) until DAFMAN 36-2905 has been manually reviewed and the audit
finding is recorded here.**

If DAFMAN 36-2905 confirms altitude adjustment applies to current PFRA events:
- Implement in `src/pfra/scoring.mjs` with source-backed fixture tests
- Update `af-pfra-2026.json` with altitude group definitions and applicable events

If DAFMAN 36-2905 confirms no altitude adjustment under PFRA:
- Remove `#alt-select` from `index.html`
- Remove altitude adjustment charts from SW cache
- Remove `calculateAltitudeDiff()` and related code from `main2.js`
- Document the removal in this manifest and in `docs/SESSION_LOG.md`

---

## Required Standards for New Features

### Test standard
Every scoring rule in the app must have a source-backed fixture test in
`tools/fixtures/pfra-scoring-examples.json`. A fixture test must include:
- The source document and section it traces to
- The input values
- The expected output

"Source-backed" means the expected value was read from an official document, not computed by
the app and then tested against itself.

### UI standard
The app must display the current official USAF assessment only. It must not show outdated
legacy standards (1.5-mile run, old score tables) as an active option. If historical access
is ever needed, it must be clearly labeled as deprecated.

### Change standard
No scoring behavior, event option, exemption behavior, timing rule, or pass/fail threshold
may be added, removed, or changed unless the change is traced to a source document listed in
this manifest. Changes must update this manifest.
