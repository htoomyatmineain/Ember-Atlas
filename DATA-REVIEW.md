# MODIS and VIIRS archive review

Reviewed 29 October 2026. Original ZIPs remain unchanged; CSV members were extracted into the active workspace's ignored `data/source-archives-2025-01/` directory. The importer compatibility fix is now implemented and both sources have been imported into local normalized chunks. No Supabase publication performed.

## Completed compatibility fix — 29 October 2026

- Adapter `firms-archive-v2` explicitly supports MODIS native version `61.03` and VIIRS satellite/instrument label `SNPP`. Canonical satellite identity is normalized; original labels/versions remain in manifests and source files.
- Unsupported versions, platforms, inconsistent instrument labels, and NRT versions remain rejected. Adapter version participates in chunk identity so resume cannot reuse a chunk from the previous adapter.
- Both actual archive dry-runs and local imports passed with zero rejected rows and zero identity duplicates: MODIS 1,402 included; VIIRS 8,138 included.
- Publication dry-run: 9,540 raw observations, 31 area-day summaries, 7,935 occupied union cell-days. MODIS occupies 1,367 cell-days; VIIRS 6,790; both occupy 222. Same-day same-grid agreement is 222/7,935 = 2.80%, not scientific accuracy; grid edges, sensitivity and overpass differences affect it.
- Estimated aggregate/ledger JSON: 923,157 bytes, not a measured Postgres size. Row-budget checks passed.
- Verification: 11 automated tests passed; TypeScript and production build passed.
- Hotspot-type inclusion is unchanged from grid-v1. No live database writes were attempted.

## Findings

Original archives reside in `D:/SE Journey/NASA space app challenges/NASA first practice round/data/`:

- `DL_FIRE_M-C61_832909.zip`: `fire_archive_M-C61_832909.csv`, 1,488 records; 2025-01-01 through 2025-01-31; records on all 31 days. Terra 285, Aqua 1,203; instrument MODIS; native version `61.03`.
- `DL_FIRE_SV-C2_832912.zip`: `fire_archive_SV-C2_832912.csv`, 9,460 records; same dates and all 31 days. Satellite and instrument fields both say `SNPP`; native version `2`. Archive name identifies S-NPP VIIRS C2. Preserve this source metadata rather than rewriting the original CSV.

These are a suitable candidate overlapping first slice for the PRD. File names, metadata, and contents are consistent with archived FIRMS exports. Inspection does not independently authenticate their provenance or establish satellite observation completeness.

The VIIRS raw row count is approximately 6.36 times MODIS. This is a descriptive count difference, not a correction factor, precision score, or number of distinct fires.

## Validation performed

Both files parse as CSV. Both contain latitude, longitude, acquisition date/time, satellite, instrument, confidence, version, FRP, scan/track, brightness, day/night, and inferred hotspot type. Basic coordinate/date checks found no failures; full production timestamp/schema validation remains necessary. No exactly identical full CSV rows were found. This is distinct from the importer's observation-identity deduplication rule.

Existing PRD confidence rules and bundled Natural Earth Myanmar boundary yield:

- MODIS: 82 rows below confidence 30; 8 outside the bundled polygon; 1,402 pass both confidence and boundary checks.
- VIIRS: 1,219 low-confidence rows; 112 outside the bundled polygon; 8,138 pass both checks.

Exclusions overlap; do not subtract each category independently. These eligible counts precede production identity deduplication and any hotspot-type filter. Polygon exclusions are relative to the bundled generalized boundary, not proof that the source download selected the wrong country.

MODIS type counts: type 0 = 1,473; type 2 = 15. VIIRS type counts: type 0 = 9,339; type 2 = 99; type 3 = 22. NASA describes inferred types as presumed vegetation fire (0), active volcano (1), other static land source (2), and offshore detection (3). Preserve type in normalized records. Recommend a versioned vegetation-only default for burning analyses, with an explicit option for all thermal anomalies; do not silently introduce this change into the current grid-v1 counts.

Reference: [NASA MODIS fire user guide](https://www.earthdata.nasa.gov/s3fs-public/2023-09/MODIS_C6_C6.1_Fire_User_Guide_1.0.pdf) and [NASA VIIRS fire user guide](https://www.earthdata.nasa.gov/s3fs-public/imported/VIIRS_activefire_User_Guide.pdf).

## Original importer compatibility blocker (resolved above)

Current `lib/processing.ts` accepts only literal MODIS version `6.1`; this file uses `61.03`. It also accepts VIIRS satellite aliases `N`, `Suomi NPP`, and `S-NPP`, but not this export's `SNPP`. Consequently, the current importer would reject these observations, despite their matching target platform/date scope.

Before importing, add explicit, documented source adapter mappings with tests for these exact exports. Preserve native versions and validate product identity from archive metadata. Do not broadly accept arbitrary numeric versions or unknown satellites. The VIIRS export uses `brightness` and `bright_t31` rather than the alternate `bright_ti4`/`bright_ti5` names; the current core counting path does not require temperature columns, but future temperature use must be source-aware.

## Coverage and next steps

These files cover January 2025 only. February–December 2025 and all other target years remain unavailable until separately imported. All days containing rows does not prove a complete download; confirm the original archive request's country/date/product scope before marking ingestion complete. No multi-year seasonal baseline is supported by this slice.

Remaining steps: confirm the original archive request scope; choose and version any future hotspot-type filter; verify Supabase configuration/migrations and storage quota before publication. NASA API credentials are unnecessary for parsing these local archive files. Local chunks are prepared; live database readiness is not established by these checks.

## Extracted CSV SHA-256

- MODIS: `5bed9e40f9d317c2a95061f67aab9aab9e9050e1421903e622779942b198e65a`
- VIIRS: `743cda3e4a2b3331b045696a6e0688552be5d14547ab99a0e9dd66373b19d5ad`
