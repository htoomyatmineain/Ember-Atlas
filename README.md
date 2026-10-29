# Ember Atlas

Archive compatibility update (29 October 2026): the importer supports the supplied MODIS `61.03` version and S-NPP `SNPP` labels through explicit adapter `firms-archive-v2`. Native labels are retained in ingestion manifests; canonical satellite names are used for observation identity. MODIS versions `6.1`/`61.03` and S-NPP versions `1`/`2` are explicitly supported; unknown versions and NRT data are rejected. Instrument labels, when present, must match the configured source. See DATA-REVIEW.md for the actual January 2025 import results.

A Next.js / TypeScript / Leaflet explorer for Myanmar historical burning activity, with Supabase Postgres/PostGIS persistence. The target period is **1 January 2015 through 31 December 2025: 11 calendar years inclusive**.

## Current status

The application runs in an explicit setup-required state until Supabase is configured and a genuine NASA archive slice is published. **January 2025 archives are prepared locally: 1,402 MODIS and 8,138 VIIRS observations.** Publication is a separate command; verify your Supabase project status. All unavailable calendar dates are null, not zero. No generated observations ship with the application. See HANDOFF.md for verification and remaining dependencies.

Implemented: public single-page explorer; responsive Leaflet map; genuine Myanmar boundary; full UTC year calendar; MODIS / VIIRS / experimental common-grid selection; selected-period summaries; source comparison; ingestion and agreement metrics; provenance panel; CSV export; shareable filters; local archive/API importer; immutable dataset publication; private base tables; Render configuration.

P1 baselines and subnational areas are intentionally unavailable. At least five complete other years are needed before implementing historical baseline analysis. No forecasting or operational alerting.

## Run locally

Use Node 22.16+ and npm. Package versions and the lockfile are pinned.

```powershell
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
# Fill .env locally. Never commit it.
npm run dev
```

Open http://localhost:3000. Missing credentials do not prevent interface development. Production: `npm run build`, then `npm start -- --port 3000`.

### Supabase setup

1. Create or open your Supabase project.
2. From project settings / API, copy the project URL and anon (or publishable) key to the corresponding `.env` entries.
3. Copy the service-role (or server secret) key to `SUPABASE_SERVICE_ROLE_KEY` **only in local/server environment configuration**. Do not send it in chat or expose it as a `NEXT_PUBLIC_` variable.
4. Run the four SQL files in `supabase/migrations` in numeric order using the project's SQL editor, or apply them with Supabase CLI migrations. They create PostGIS in `extensions`, scientific tables, private RLS configuration, and narrow service-only RPCs.
5. Restart the app after changing environment variables.

Public browser requests use the application's bounded GET routes. All base tables have RLS enabled and no anonymous/authenticated grants. Server requests use the server key, which stays out of client bundles. `supabase/verify.sql` and `npm run check:rls` provide live verification after setup. Live RLS verification has not yet been run because no project credentials are available.

## Obtain NASA data (first import)

Go to https://firms.modaps.eosdis.nasa.gov/download/ and authenticate through Earthdata or an emailed code. Request **Myanmar, 2025-01-01 through 2025-01-31, CSV**, separately for:

- **MODIS Collection 6.1**, combined Terra/Aqua standard-processing active-fire data.
- **SUOMI VIIRS Collection 2 / S-NPP 375 m**, standard-processing active-fire data. Do not choose NOAA-20 or NOAA-21.

NASA emails download instructions when requests finish. “Submitted” means the request is queued, not downloaded. Both requests must have the same dates; January 2026 is outside this product's archive period. Keep the downloaded original files in ignored `data/`, for example `data/modis-2025-01.csv` and `data/viirs-2025-01.csv`. Files can contain low-confidence observations; the importer applies the configured inclusion rules.

The CLI's explicit `--from` / `--to` declares the delivered file's complete requested source period. Use exactly the period and combined platform coverage confirmed by NASA's archive request. A hand-edited observation subset cannot establish completeness. Preserve NASA's request receipt with your raw files.

A MAP_KEY is optional for the local CSV path. Request a free key at https://firms.modaps.eosdis.nasa.gov/api/map_key/ using your email, then put it in `FIRMS_MAP_KEY` in `.env`. The API path checks source availability, requests daily chunks, caches CSVs, retries four times with bounded backoff, and supports resume. If historic country requests are unavailable, use the archive file path. Never paste credentials into shared URLs.

### Country boundary

`public/boundaries/MMR.geojson` is the actual Myanmar feature from Natural Earth v5.1.2 1:10m admin-0 countries, public domain. The adjacent manifest records the upstream URL, license, fetch date, and SHA-256. Attribution: **Made with Natural Earth**. This is a generalized cartographic, de facto boundary; coastal and border detail is limited. Points exactly on its border are included. There are no optional subareas, so no subarea tie-break is needed.

Reacquire the pinned boundary with `node scripts/boundary.mjs` if necessary. The importer accepts a Polygon/MultiPolygon GeoJSON Feature and an explicit boundary manifest; never substitute a rectangle for Myanmar. Natural Earth terms: https://www.naturalearthdata.com/about/terms-of-use/.

### Validate and import each source

```powershell
npm run import -- --help
npm run import -- --from 2025-01-01 --to 2025-01-31 --source modis --file data/modis-2025-01.csv --boundary public/boundaries/MMR.geojson --boundary-manifest public/boundaries/manifest.json --dry-run
npm run import -- --from 2025-01-01 --to 2025-01-31 --source modis --file data/modis-2025-01.csv --boundary public/boundaries/MMR.geojson --boundary-manifest public/boundaries/manifest.json --resume
npm run import -- --from 2025-01-01 --to 2025-01-31 --source viirs --file data/viirs-2025-01.csv --boundary public/boundaries/MMR.geojson --boundary-manifest public/boundaries/manifest.json --resume
```

Omit `--file` to request the same dates using the authenticated FIRMS API. Source IDs are `MODIS_SP` and `VIIRS_SNPP_SP`. The requested range is validated against the source's live availability response. API request credentials are omitted from persisted manifests. Original downloads and local normalized chunks are ignored by Git.

Headers are validated even for successful empty files. An empty body or invalid headers fails the chunk. Invalid coordinates, UTC timestamps, satellites, confidence codes, FRP, and nonstandard versions are rejected; a chunk with rejected rows is held for review and cannot publish. Low confidence and outside-polygon rows are separately excluded. Exact observations are deduplicated with a SHA-256 identity; nearby distinct detections remain distinct. Missing FRP stays null, in MW when present.

Manifests retain requested and actual observation dates, product/platform/version, boundary provenance, SHA-256, row counts, UTC fetch time, configuration, errors, and state. Every retained normalized observation resides beside its source manifest. Full source files must remain retained locally/private storage. The local importer streams CSV parsing, but normalized chunks and publication aggregates currently use memory; import short chunks and measure memory before national backfills. A disk-backed aggregation replacement may be needed for an eleven-year publication on a low-memory machine.

### Publish and switch the spatial year

```powershell
npm run publish:data -- --spatial-year 2025 --dry-run
# Review counts, estimated payload bytes, and project quota before proceeding.
npm run publish:data -- --spatial-year 2025
npm run check:rls
```

The publisher deduplicates across overlapping chunks and computes cell/area/day summaries. It writes a new draft dataset and publishes it only after all tables are populated and SQL checks agree with the completeness ledger and spatial summaries. A failed draft stays hidden; rerunning rebuilds it. A deterministic published version is idempotent.

All imported years retain area-day calendar summaries. One selected year has cell-day spatial detail. A compact raw-point year is also stored when its entire included raw record count is at most `--max-raw-rows` (default 50,000). Above that budget, source modes explicitly use count-preserving spatial bins. No subset is silently presented as full coverage. The spatial row budget defaults to 150,000; deliberately adjust `--max-spatial-rows` only after checking current project quotas. Changing `--spatial-year` publishes a new immutable version and switches detail without discarding previous published versions. Old versions occupy storage; inspect actual database size before importing more and apply a deliberate retention policy.

`supabase/verify.sql` measures table/index and whole-database sizes. The dry-run's serialized byte estimate is not a Postgres storage measurement or a quota guarantee. No eleven-year fit or throughput claim has been verified.

## Method grid-v1

Inclusion: MODIS C6.1 confidence >=30; VIIRS S-NPP nominal/high. These are product-specific rules, not equivalent probabilities. Satellite identity and native confidence are retained. Unknown confidence values are rejected for review.

Coordinates are projected to EPSG:6933; `ix=floor(x/1000)`, `iy=floor(y/1000)`, cell ID `6933:1000:ix:iy`. Each cell/UTC day has independent MODIS M and VIIRS V counts. Common-grid presence is `M>0 OR V>0`, counted once per cell/day. Monthly/yearly values sum occupied cell-days; the map reports active days per cell/bin. Raw calendars count included detections.

Completeness is ingestion, not satellite observability. MODIS completeness establishes both Terra and Aqua coverage; VIIRS establishes S-NPP coverage. Both are required for complete paired days. Empty validated source periods establish zero returned records, not absence of clouds or fire. Partial totals are labeled available-data totals. Agreement is `both / union` on paired complete days; zero denominator is N/A. Ingestion completeness is completed platform-days / expected platform-days (Terra, Aqua, S-NPP). Schema validity is valid parsed rows / parsed rows before geography/confidence exclusions; empty files have no schema-validity percentage.

Calendar scale thresholds are computed once per dataset/area/source from all complete imported days, at p=.25/.5/.75/.95 with sorted index floor((n−1)p). The same thresholds apply across years; month/day selections do not rescale. Raw observations are sensor dependent. Common-grid activity is experimental and is not calibrated fire counts, probability, burned area, precision, or ground truth. No external validation was conducted.

## API contracts

- `GET /api/catalog`: latest published version, imported years, complete-day ledger, spatial/raw year availability, source manifests, configuration.
- `GET /api/calendar?area=MMR&year=2025&mode=harmonized`: full year independent of selected month/day; all actual dates, nullable values, completeness, fixed scale.
- `GET /api/summary`: same shared filters; scope is the selected analytical area, not map viewport.
- `GET /api/map`: same filters plus optional start/end, bbox west,south,east,north and zoom. Raw mode returns actual observations when available and <=5,000 viewport records; otherwise returns aggregated centroids. Display bins preserve counts, report resolution, and do not change the analytical 1 km grid. No feature list is silently truncated.
- `GET /api/export`: bounded area-day CSV for the selected filters; source, units, both raw counts, occupied counts, completeness, method/dataset versions. Unknown counts remain blank.
- `GET /api/health`: process health and configuration presence, not a claim of live database health.

Shared URL values: area, year, month, day, mode, panel. Only Myanmar and years 2015–2025 are accepted. Invalid filters return 400; query failures return a sanitized 503 rather than fake empty data. Valid unimported dates are structured unavailable results. Requests are canceled on filter changes; last successful summaries remain visible while loading. Map panning does not modify national statistics. Successful analytical responses contain method/dataset version, units, and coverage. Dates and time ranges are UTC.

## Map and accessibility

Leaflet uses canvas rendering. Only hovered features animate; the pause control and reduced-motion preference disable animation. Visual marker radius is screen-space, not a burn perimeter. Raw modes preserve true point coordinates where raw detail is available; aggregate markers are centroids. No real-time fire implication. OpenStreetMap attribution remains visible, and basemap tile errors leave scientific overlays/calendar available. Tile URL and attribution are configurable; no prefetch, no cache bypass, normal browser referrer. OSM policy: https://operations.osmfoundation.org/policies/tiles/.

Native labeled controls, keyboard-operable calendar buttons, focus rings, responsive sidebar drawer, one/two-column mobile calendars, and normal page scrolling are implemented. Browser checks cover mobile overflow and date/source interactions, not a full WCAG audit.

## Tests and deployment

```powershell
npm test
npm run typecheck
npm run build
npm run smoke:api
# Against another running server:
$env:SMOKE_BASE_URL='http://localhost:3000'
npm run smoke:api
```

Fixtures are generated only inside OS temporary directories for tests and never published. Tests cover leap dates, UTC filters, duplicate/union counts, product confidence, invalid data, border clipping, genuine country clipping, CSV escaping, quantiles, complete empty data, and paired-source gating. API smoke tests check validation, nullable setup state, and CSV date matching. Live Supabase/RLS and real NASA import verification remain pending.

`render.yaml` targets a free Render Node web service. Connect this repository in Render and set environment values there. Build: `npm ci && npm run build`; start: `npm start -- --port $PORT`, bound to `0.0.0.0`; health: `/api/health`. Data belongs in Supabase. Import scripts run locally, never during startup or web requests. Free services idle down and cold-start: https://render.com/docs/free. No Render account/repository deployment access is currently connected, so this is deployment-ready source, not a verified live release.
