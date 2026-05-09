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

- `af-pfra-2026.json` is the long-term PFRA standards source of truth for metadata, source files, body composition scoring, walk thresholds, and table file references.
- `sources/PFRA-Scoring-Charts.pdf` is the manually downloaded source PDF.
- `extracted/PFRA-Scoring-Charts.txt` is text extracted from that PDF for table parsing.
- `extracted/tables/` contains generated structured tables from `npm run extract:standards`.
- Waist-to-height ratio scoring and 2.0 kilometer walk maximums are captured because they are compact and uniform.
- Event table extraction has been completed for push-up, hand-release push-up, sit-up, reverse crunch, plank, 2-mile run, and HAMR.

## Implementation direction

The PFRA calculator now loads `af-pfra-2026.json` and the extracted table files through `src/pfra/standards.mjs`. Legacy standards still live in `main2.js` until they are migrated into versioned data.

## Validation

Run:

```sh
npm test
```

This checks representative scoring examples against the extracted PFRA tables.

The PFRA examples live in `tools/fixtures/pfra-scoring-examples.json` so source-backed scoring coverage can be reviewed without reading test code. Current fixture coverage includes direct table scores, WHtR, 2 km walk pass/fail thresholds, and full-assessment totals.
