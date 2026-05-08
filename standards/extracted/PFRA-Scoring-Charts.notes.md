# PFRA Scoring Charts Extraction Notes

Source: https://www.afpc.af.mil/Portals/70/documents/FITNESS/PFRA%20Scoring%20Charts.pdf

Local source PDF: `../sources/PFRA-Scoring-Charts.pdf`

Extracted text: `PFRA-Scoring-Charts.txt`

Observed metadata:

- Title text: `USAF Physical Fitness Readiness Assessment Scoring`
- Effective date shown in chart: `Effective 1 Mar 26`
- PDF length observed through browser extraction: 11 pages
- Local PDF SHA-256: `9ee7689f8f52e48e060cb88846d2dfc2bccab76ae41d2a433d08f2ac7e89aea3`

Observed components:

- Waist-to-height ratio, max 20 points
- Push-up, max 15 points
- Hand-release push-up, max 15 points
- Sit-up, max 15 points
- Cross-leg reverse crunch, max 15 points
- Forearm plank, max 15 points
- 2-mile run, max 50 points
- 20-meter HAMR, max 50 points
- 2.0 kilometer walk, pass/fail maximum time table

Compact extracted tables:

## Waist-to-height ratio

The WHtR table is uniform across age and sex:

| Points | Ratio |
| --- | --- |
| 20.0 | <= 0.49 |
| 19.0 | 0.50 |
| 18.0 | 0.51 |
| 17.0 | 0.52 |
| 16.0 | 0.53 |
| 15.0 | 0.54 |
| 12.5 | 0.55 |
| 10.0 | 0.56 |
| 7.5 | 0.57 |
| 5.0 | 0.58 |
| 2.5 | 0.59 |
| 0 | >= 0.60 |

## 2.0 kilometer walk

| Sex | Age | Maximum time |
| --- | --- | --- |
| Male | < 30 | 16:16 |
| Male | 30-39 | 16:18 |
| Male | 40-49 | 16:23 |
| Male | 50-59 | 16:40 |
| Male | 60+ | 16:58 |
| Female | < 30 | 17:22 |
| Female | 30-39 | 17:28 |
| Female | 40-49 | 17:49 |
| Female | 50-59 | 18:11 |
| Female | 60+ | 18:53 |

## Next extraction targets

1. Add validation tests that compare known source examples against calculator output.
2. Wire one extracted table into the app as the first data-driven component.

## Generated tables

- `tables/push-up.json`: extracted with `npm run extract:standards`.
- `tables/hand-release-push-up.json`: extracted with `npm run extract:standards`.
- `tables/sit-up.json`: extracted with `npm run extract:standards`.
- `tables/cross-leg-reverse-crunch.json`: extracted with `npm run extract:standards`.
- `tables/forearm-plank.json`: extracted with `npm run extract:standards`.
- `tables/two-mile-run.json`: extracted with `npm run extract:standards`.
- `tables/hamr-20-meter.json`: extracted with `npm run extract:standards`.

## Visual verification

The PDF text extractor places table headings after the page's table data. To avoid one-page-shifted table labels, `tools/extract-pfra-tables.mjs` maps tables by rendered PDF page number.

Rendered page checks:

- Page 2: Push-up
- Page 3: Hand-release push-up
- Page 4: Sit-up
- Page 5: Cross-leg reverse crunch
- Page 6: Forearm plank
- Page 7: 2-mile run
- Page 8: 20-meter HAMR
