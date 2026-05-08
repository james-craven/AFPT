# Standards Data

This folder is the bridge between the current hardcoded calculator and a future standards-import/update system.

## Current official source

Primary source:

- AFPC PFRA Scoring Charts: https://www.afpc.af.mil/Portals/70/documents/FITNESS/PFRA%20Scoring%20Charts.pdf

Policy/context sources:

- AFPC Fitness Program: https://www.afpc.af.mil/Career-Management/Fitness-Program/
- AFPC Unit Fitness Program: https://www.afpc.af.mil/Career-Management/Fitness-Program/UnitFA/
- AFMAN/DAFMAN 36-2905: https://www.afpc.af.mil/Portals/70/documents/FITNESS/afman36-2905.pdf

Note: AFPC blocks direct command-line PDF downloads from this environment with an access-denied page. The official PDF is still readable through browser/search extraction, so this folder tracks source URLs and extracted facts until we add a more robust import pipeline.

## Extraction status

- `af-pfra-2026.json` is a source-mapped scaffold, not yet a complete score table.
- Waist-to-height ratio scoring and 2.0 kilometer walk maximums are captured because they are compact and uniform.
- Event table extraction is still needed for push-up, hand-release push-up, sit-up, reverse crunch, plank, 2-mile run, and HAMR.

## Implementation direction

The calculator should eventually load a standards file like `af-pfra-2026.json` instead of reading hardcoded tables from `main2.js`. Once that works for one component, we can migrate the rest incrementally.
