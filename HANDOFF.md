# Handoff — 28 October 2026

## Update — 29 October 2026

The January 2025 MODIS and S-NPP archive compatibility issue is fixed in source adapter `firms-archive-v2`. Both source files now pass validation and have local normalized chunks: 1,402 MODIS and 8,138 VIIRS observations. Publication dry-run produces 31 area-day summaries and 7,935 union cell-days, within configured row budgets. All 11 tests, typecheck, and production build pass. No live database publication was performed. See DATA-REVIEW.md for filenames, checksums, metrics, and limitations. The older zero-import status below describes the original delivery; local preparation has since advanced, while live publication/deployment remains unverified.

## Delivered

Next.js App Router / TypeScript application with Leaflet and OpenStreetMap, public exploration, twelve-month UTC calendar, shared URL filters, source comparison, quality/method/provenance panel, feature detail, bounded CSV exports, and explicit setup/unavailable/partial states. Includes pinned dependencies/lockfile, four Supabase PostGIS migrations, private-table RLS/grants, authenticated local archive/API import, resumable chunks, deduplication and EPSG:6933 harmonization, immutable draft-to-published dataset workflow, row-budget gates, actual-size SQL checks, and Render configuration.

Country boundary: Natural Earth v5.1.2 1:10m admin-0 Myanmar feature; source URL, public-domain license, timestamp and checksum in public/boundaries/manifest.json. Generalized coastline and de facto borders limit geographic detail.

## Actual data and deployment status

- Imported/published NASA observations: **0**.
- Imported source/date coverage: **none**.
- Calendar/spatial-detail coverage: **none**; dates are unavailable, never zero.
- Supabase migrations and anonymous write denial: prepared but **not executed against a live project**; URL/keys pending.
- NASA first slice: user has requested archives; matching January 2025 MODIS C6.1 and standard-processing Suomi NPP VIIRS files remain pending.
- Deployment: **deployment-ready source; not deployed**. No Render access or connected repository deployment target supplied.
- Scientific validation: **not externally validated**. No precision/forecast claims.

A supplied file was found outside the active workspace at `D:\SE Journey\NASA space app challenges\NASA first practice round\data\DL_FIRE_J2V-C2_819887 (1)\fire_nrt_J2V-C2_819887.csv`. Streaming inspection found **574,606 rows**, **2024-01-17 through 2025-12-31**, satellite **N21 (NOAA-21)**, version **2.0NRT**, instrument **VIIRS**. It is genuine-looking FIRMS-format data but is the wrong platform and processing class for the PRD's S-NPP standard-processing comparison. It was left unchanged and was not imported, copied, or published. Observation authenticity beyond file/schema inspection has not been independently verified.

## Verification

- `npm test`: **10 tests passed**. Includes real Myanmar clipping, boundary inclusion, source-specific confidence/version rejection, exact duplicates and union counts, leap dates, UTC filters, CSV escaping, reproducible quantiles, zero-vs-missing coverage, paired-source agreement, and importer dry-run checks for valid/duplicate/header-only/malformed/rejected input. Synthetic inputs exist only in temporary test directories and were never published.
- `npm run typecheck`: passed.
- `npm run build`: passed; final repeat recorded after UI/API refinements.
- Ten HTTP smoke checks passed against a local production build: catalog, leap-year calendar, selected-day summary/map/export, and invalid-filter/viewport/range rejection.
- Browser journey verified 366 days and twelve months in 2024; 29 February selection; clicking selected day returns to month; year change preserves February and clears day; VIIRS change preserves month; shareable URL survives refresh.
- Responsive browser checks: at a 390px viewport, document width and scroll width both 375px (scrollbar excluded), one calendar column, twelve months retained. At 1440px, document/scroll width both 1425px, four columns. No horizontal page overflow in these checks.
- Browser map status: setup-required message shown; browser error log empty during final check. Country outline and controls are available without observations. Tile availability depends on provider/network.
- No live database, dataset-size, raw-point rendering with real records, complete imported zero-day display, publication transaction, or deployed cold-start verification is claimed.

Initial local HTTP timings with **zero imported observations**: catalog 267ms / 419 bytes; leap-year calendar 19ms / 74,660 bytes; one-day summary 14ms / 573 bytes; unavailable map 16ms / 326 bytes; one-day CSV 13ms / 311 bytes. These are setup-state measurements, not evidence of national-data query performance. Cold starts and real-data performance remain unmeasured.

## Next commands

Active application workspace: `D:\SE Journey\NASA space app challenges\NASA first practice round`. The original D: folder currently contains the supplied PRD and the unsuitable NOAA-21 archive, not the application source. The importer can read archive files from either location using an absolute `--file` path.

1. Fill the ignored `.env` in the active workspace; blank configuration has been created. Keep privileged keys out of chat.
2. Apply `supabase/migrations/001_initial.sql` through `004_native_grid_map.sql` in numeric order in Supabase SQL editor.
3. Obtain matching January 2025 source archives. Follow README.md's exact two import commands, with their actual filenames. The bundled boundary and license manifest are ready.
4. `npm run publish:data -- --spatial-year 2025 --dry-run` — review measured counts and current project quota.
5. `npm run publish:data -- --spatial-year 2025`, then `npm run check:rls` and the actual-size SQL queries in `supabase/verify.sql`.
6. Restart with `npm run dev`, verify actual source/date coverage and export consistency, then deploy via Render using render.yaml.

## Remaining limits

P1 baseline analysis and subnational boundaries are deferred. Baselines remain disabled with eligibility explanation. Spatial detail is budgeted to one published year; raw points are all-or-none for that year below an explicit row cap, otherwise count-preserving grid/display aggregation is returned with representation metadata. Display coarsening uses angular bins and reports degrees; the underlying scientific grid remains 1 km EPSG:6933.

CSV parsing is streamed, but normalized chunks and publication aggregation still use memory. Use short import chunks; eleven-year national scale has not been measured and may require disk-backed aggregation on low-memory machines. Raw-source files stay local/private, not on Render's ephemeral filesystem. Old immutable dataset versions consume storage and require an intentional retention policy. SQL migrations and publication checks require live project validation before treating the data path as production-tested.


## Project location correction — 29 October 2026

Canonical project: `D:\SE Journey\NASA space app challenges\NASA first practice round`. Application, source archives, normalized chunks, dependencies, and Git metadata migrated from the former C: workspace. Use `.env` only. All 11 tests passed from D:. The original D: configuration was preserved and missing nonempty source settings merged without exposing secrets.
