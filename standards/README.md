# Standards Data

This folder is the bridge between the current hardcoded calculator and a future standards-import/update system.

## Current official source

Primary source:

- AFPC PFRA Scoring Charts: https://www.afpc.af.mil/Portals/70/documents/FITNESS/PFRA%20Scoring%20Charts.pdf

Policy/context sources:

- AFPC Fitness Program: https://www.afpc.af.mil/Career-Management/Fitness-Program/
- AFPC Unit Fitness Program: https://www.afpc.af.mil/Career-Management/Fitness-Program/UnitFA/
- AFMAN/DAFMAN 36-2905: https://www.afpc.af.mil/Portals/70/documents/FITNESS/afman36-2905.pdf

Note: AFPC blocked direct command-line PDF downloads from this environment with an access-denied page. A manually downloaded copy of the same PDF has been added at `sources/PFRA-Scoring-Charts.pdf`.

## Extraction status

- `af-pfra-2026.json` is a source-mapped scaffold, not yet a complete score table.
- `sources/PFRA-Scoring-Charts.pdf` is the manually downloaded source PDF.
- `extracted/PFRA-Scoring-Charts.txt` is text extracted from that PDF for table parsing.
- Waist-to-height ratio scoring and 2.0 kilometer walk maximums are captured because they are compact and uniform.
- Event table extraction is still needed for push-up, hand-release push-up, sit-up, reverse crunch, plank, 2-mile run, and HAMR.

## Implementation direction

The calculator should eventually load a standards file like `af-pfra-2026.json` instead of reading hardcoded tables from `main2.js`. Once that works for one component, we can migrate the rest incrementally.
