# Ember Atlas — Product Requirements Document

Version 1.0 · 28 October 2026 · Implementation-ready MVP specification

## 1. Product decision

Build a public, single-page burning-activity explorer for Myanmar. Users select an area and year, inspect a twelve-month daily calendar, and explore synchronized satellite hotspot data on an interactive map. The system makes MODIS–VIIRS differences visible and provides a reproducible common-grid activity record with transparent provenance and quality metrics.

The intended audience is researchers, land managers, and emergency responders. The initial release is a research-oriented historical MVP, not an operational emergency alert service. It supports seasonal preparedness and retrospective anomaly investigation. It does not predict future fires or claim that historical anomalies describe current conditions.

The initial data period is 1 January 2015 through 31 December 2025: **11 calendar years inclusive**. The interface must use this wording. Do not silently change the period to ten years.

Country: Myanmar, ISO3 MMR. Myanmar is chosen for user relevance and a substantial regional fire record, not because its dataset is small. A published regional study reports substantially more VIIRS than MODIS detections in Myanmar, making it a useful case for demonstrating sensor differences [S1]. Those published ratios are contextual evidence, never a correction factor for this application.

## 2. Delivery constraints and definition of success

One developer/code agent has approximately two hours for implementation and testing. Build a narrow vertical slice first. Do not promise that downloading, processing, and validating eleven years of national data will finish within this window.

A successful MVP has:

- A deployed or deployment-ready Next.js application using Supabase and OpenStreetMap.
- At least one genuine, overlapping MODIS and VIIRS historical period imported, when source access is available.
- Map, year calendar, source comparison, quality metrics, provenance, CSV export, and shareable filters driven by the same dataset and filter state.
- A resumable import path for the entire 2015–2025 archive.
- Explicit coverage states for unimported periods; no generated records masquerading as satellite observations.
- A README documenting setup, imported coverage, limitations, commands, tests, and deployment status.

Full-period coverage is the target dataset, not a condition to fabricate success. If access credentials or archive processing prevent real-data ingestion, deliver the working interface and importer with a visible setup-required state and report the blocked dependency. Synthetic fixtures are allowed only in tests, never as public scientific data.

## 3. Scope and priority

### P0 — complete first

1. Public exploration without sign-in.
2. Myanmar country selection; optional subareas only if genuine boundaries are imported.
3. Pan/zoom map with OpenStreetMap attribution and selectable hotspot/grid features.
4. Year dropdown, twelve-month daily calendar, month/day selection, and clear-date action.
5. MODIS, VIIRS, and harmonized common-grid views.
6. Source counts, occupied cell-days, ingestion coverage, cross-sensor agreement, and methodology explanations.
7. Local import scripts, Supabase schema/migrations, source manifests, reproducible aggregation.
8. CSV export and URL-persisted selections.
9. Responsive layout, loading/error/partial/empty states, accessible controls, reduced motion.

### P1 — only after P0 works

- State/region dropdown using licensed administrative polygons.
- Leave-one-year-out seasonal baseline, monthly anomalies, and historically critical months. These require adequate multi-year imports; keep them disabled with a specific explanation until eligible.
- Additional monthly comparison chart and detailed raw-record inspection.

### Later release

Recent-data ingestion, scheduled updates, subscriptions, notifications, custom drawn areas, calibrated cross-sensor modeling, uncertainty estimates, exports beyond CSV, additional countries, land-cover/weather integration, and production operational validation.

No login flow, chat assistant, public upload portal, prediction model, incident dispatch, or admin dashboard in the two-hour MVP. Data administration uses authenticated local commands.

## 4. User journeys

### Explore seasonal activity

Open the application → see Myanmar and the latest imported year → select a year → inspect the full calendar → click a month → map and summary update to that month → click a day → inspect that day's detections → clear the date selection to return to the full year.

### Compare sensors

Choose the same area/date → select MODIS and note raw detections and occupied cell-days → select VIIRS → select Harmonized → read common-grid counts and agreement. The UI explains that raw point counts are sensor-dependent and cannot be interpreted as equal-sized fires.

### Inspect evidence

Click a grid cell → see dates, contributing sensor families, contributing raw counts, cell ID, method version, source products, quality caveats, and selected-period coverage → open Quality & Method for formulas → export the filtered aggregate.

### Investigate unusual seasons

Where P1 eligibility is satisfied, choose a year and month → compare monthly activity with other imported years for the same month → see baseline sample size and empirical percentile → follow a highlighted calendar period to the map. Label the result historical, never live warning.

## 5. Interface and visual design

Working name: Ember Atlas. Subtitle: “Myanmar burning activity · MODIS + VIIRS”. Single route `/`; sidebar buttons change panels without navigating away or resetting filters.

Desktop layout:

- Header: product identity, area dropdown, year dropdown, coverage badge, Share, Export.
- Left sidebar approximately 280 px: Explore, Compare Sensors, Quality & Method; active controls and compact summaries below navigation.
- Main workspace: map occupies roughly the upper 60% of available workspace; the twelve-month calendar remains visible below, with vertical scrolling where necessary.
- Small contextual detail drawer overlays the map after feature selection.
- Always-visible map legend and attribution; controls must not obscure them.

At widths below 900 px, collapse the sidebar into a drawer, place filters above the map, and show calendar months in two columns. Below 600 px use one column; all twelve months remain accessible through normal page scrolling. Minimum map height 320 px. Avoid nested scroll traps.

Design tokens: warm canvas #FAF9F6; surface #FFFFFF; primary text #20201E; secondary text #595954; border #D9D7D0; Claude-inspired orange #D97757; darker interactive orange #9A4329; hotspot red #C62828. Orange is for selection and brand, red for hotspot activity. Test actual foreground/background combinations: use white button text on the darker orange, not automatically on the lighter brand orange.

Typography: system sans-serif or locally bundled Inter, no blocking external font dependency. Body 16 px, controls at least 14 px, product title 24–28 px, section headings 18–20 px; tabular numerals for metrics. Use spacing and weight before adding decorative boxes. Strong focus rings, visible labels, 44 px touch targets where practical, WCAG AA contrast.

### Map behavior

- Use Leaflet with a client-only Next.js component; OpenStreetMap provides the basemap, not the map interaction engine.
- Initial fit: Myanmar boundary. Area selection fits that boundary. Panning does not change the analysis area or totals. Display “Statistics cover selected area; map shows current viewport.”
- Raw mode: red detection markers with source identified in tooltip/details; group dense points or use canvas rendering.
- Harmonized mode: draw common-grid cells or centroids with activity intensity; explain aggregation in legend.
- Red circles with outward wave animation on hovered/selected features, maximum 20 animated features simultaneously. Other marks remain static for performance. Animations never imply a live fire. Historical label remains visible.
- Circle visual radius is a screen-space marker, not a burn perimeter, measured fire radius, or danger zone. State this in legend/details.
- Honor `prefers-reduced-motion`; provide a pause-animation toggle.
- At high density use server aggregation rather than thousands of DOM elements. Never silently truncate results; return representation and aggregation metadata.

### Calendar behavior

- Twelve labeled month panels, Monday-first weekday columns, real dates including leap days.
- Each date has one intensity cell, keyboard accessible, with tooltip and accessible name containing date, metric, value, and coverage state.
- One orange sequential scale for activity, neutral outline for observed zero, hatched/marked gray for unavailable or incomplete source ingestion. Do not render unavailable dates as zero.
- Scale remains fixed across years for the same area/mode/dataset version, using complete imported days and documented quantile thresholds; recompute only when area, mode, or dataset version changes. Show thresholds and units in legend.
- Month label selects that month; day selects that day. Clicking the selected day returns to its month. “Whole year” clears both. Date range uses UTC, displayed clearly.
- Changing year preserves the selected month but clears day selection; clear invalid dates. Changing source or area preserves valid date filters. URL reflects the resolved state.

## 6. Dataset acquisition and provenance

Use real NASA FIRMS archived standard-processing active-fire records:

- MODIS Collection 6.1, Terra and Aqua, with satellite identity retained.
- VIIRS S-NPP 375 m only in the initial comparison. S-NPP overlaps the requested period; adding NOAA-20/21 midway would change the number of observing platforms. Additional platforms require a separate method version and explicit sensitivity analysis.

NASA's archive lists source temporal availability and supports historical downloads with authentication [S2]. Do not assume archive delivery is immediate or that a recent rolling CSV provides eleven years of history.

Acquisition order:

1. Check current FIRMS availability for required standard-processing products. Record requested and actual date ranges.
2. Use authenticated FIRMS API country/area historical requests where supported, respecting current source identifiers, request limits, and rate limits [S3]. Query short chunks, cache downloads, retry boundedly with backoff, resume completed chunks.
3. If API access is unsuitable, request archive CSVs through the FIRMS archive and import local files once delivered.
4. Acquire and record a licensed Myanmar polygon. Bounding-box downloads must be clipped to the polygon; a bounding box is not a country boundary. If the boundary is unavailable, label the area as a bounding-box study area and do not call its totals Myanmar totals.

Required user setup: a Supabase project with URL and keys; a FIRMS MAP_KEY if using its API, or archive files obtained via NASA's authentication flow. Never invent credentials, register accounts, or put secrets in the browser. The code agent should complete independent code work while identifying missing setup precisely.

Store a source manifest for each file/request: product, collection/version, satellite coverage, URL without credentials, requested period, actual ingestion period, country/geometry version, fetched timestamp, SHA-256, row count, import state, errors, method version. Preserve raw files outside Git when large and retain their checksums. Confirm licensing and attribution for boundaries separately.

## 7. Harmonization specification — method `grid-v1`

The MVP implements **schema, temporal, and spatial harmonization**, not validated equal-detection sensitivity. Call the result “Common-grid activity (experimental)”. Never label it calibrated fire counts, burned area, fire probability, scientific precision, or corrected ground truth.

### Normalize and filter

- Stream CSVs; validate required headers using source-specific adapters. Coordinates WGS84; dates and acquisition times parsed as UTC, preserving leading-zero HHMM values. Store original source confidence values and source product version.
- Reject invalid coordinates/timestamps; report rejected rows. A structurally invalid file fails its chunk rather than marking it complete.
- Keep MODIS confidence >=30; keep VIIRS nominal/high (`n`/`h`), excluding low. These are product-specific inclusion rules, not equivalent probabilities. Record this configuration and reject unknown confidence codes for review.
- Retain FRP where available, with its source units and null for missing values. Do not substitute zero, add FRP across overlapping observations as energy, or make FRP the default harmonized measure.
- Deduplicate exact repeated observations using a hash over product, satellite, acquisition UTC, coordinates, and native identifying fields. Do not collapse distinct detections just because they are close together.
- Clip to selected country polygon. Assign optional subareas using a deterministic boundary-inclusive spatial join and a documented tie-break for border points.

### Common spatial and temporal units

Project coordinates into EPSG:6933 and assign a deterministic 1,000 m square grid: `ix=floor(x/1000)`, `iy=floor(y/1000)`, ID `6933:1000:ix:iy`. Use UTC calendar date. Equal-area grid size is an analysis choice, not a claim that VIIRS resolution becomes MODIS resolution.

For each cell and UTC day, store MODIS raw included count M and S-NPP VIIRS raw included count V. Define MODIS presence as M>0, VIIRS presence as V>0, and harmonized presence as either. A **union occupied cell-day** counts once regardless of the number of records or sensors contributing. Repeated burning across days counts separate cell-days; it does not identify separate fires.

Monthly/yearly harmonized totals are sums of occupied cell-days, not unique cell counts. Map cell intensity is the number of active days within the selected period. Calendar intensity is occupied cells for that date. Raw-mode default calendar metric is raw included detections; show the unit prominently. Compare panel also shows sensor-specific occupied cell-days on the same grid.

Store sensor presence flags so the union never double-counts cross-sensor co-detections. Same-day grid agreement is sensitive to grid edges, overpass times, clouds, and sensor sensitivity. Explain these limitations; do not multiply MODIS counts by a literature ratio or average source confidence fields.

### Missing data

Separate ingestion completeness from satellite observability. A successfully retrieved, validated empty chunk establishes zero records returned, not cloud-free observation or absence of fire. A failed/unrequested chunk establishes unknown ingestion status.

For harmonized comparisons, a complete day requires both configured source families successfully ingested for that day. Partial days may show available detections with a partial label but are excluded from agreement, baselines, and complete-period comparisons. Full-year totals over partial coverage must be labeled “available-data total” with complete-day denominator.

## 8. Quality metrics and historical analysis

No overall “precision percentage” in MVP. Show separate auditable metrics with numerators, denominators, date scope, method version, and tooltips:

- **Ingestion completeness %:** complete expected source-days / expected source-days ×100. For MODIS the manifest must establish both Terra/Aqua coverage, even when NASA packages them together. Also show days with both source families complete / selected days.
- **Schema validity %:** valid parsed rows / parsed rows ×100 before geographic/confidence exclusions. Invalid headers yield unavailable, not a misleading percentage.
- **Cross-sensor grid agreement %:** occupied cell-days present in both source families / occupied cell-days in either ×100, restricted to complete paired days. Both zero → N/A, not 100%. Label agreement, never accuracy.
- **Validation status:** “Not externally validated” until independently evaluated. External ground truth accuracy is unavailable in this MVP.

Optional historical baseline P1:

- For each selected year/month, compare total union occupied cell-days against the same month in other years, excluding the selected year. Require complete ingestion for every day of that month in each contributing year and at least five eligible other years.
- Display reference years, sample size, median, absolute difference, and empirical percentile `100*(number below target + 0.5*number equal target)/n`.
- If baseline median >0, show percent difference. If zero, show absolute difference and “percent change undefined”.
- Label “Historically elevated” when target exceeds the reference 90th percentile, using an explicit documented quantile implementation. This is exploratory and uncalibrated; always show the sample size. Do not calculate a daily forecast from this monthly flag.
- Historically critical months are the three highest reference median months, excluding the selected year, only where every month has >=5 eligible reference years. Describe as seasonal context, not predicted events.
- Missing baseline → “Insufficient comparable history”; keep the actual observed-data map usable.

## 9. Architecture and persistence

Next.js App Router with TypeScript; Tailwind or simple CSS tokens; Leaflet; Supabase Postgres/PostGIS; Render free web service. Pin compatible package versions in the lockfile after checking current documentation. Use one application, no separate background service.

Local Node/TypeScript scripts perform downloading, parsing, clipping, projection, and aggregation. Do not run eleven-year backfills in browser requests or on application startup. Use streaming/batched operations and atomic publication: a dataset version becomes visible only after its aggregates and manifests are consistent.

Supabase logical tables:

- `areas`: ID, ISO3, name, parent ID, geometry, bbox, boundary source/license/version.
- `datasets`: ID/version, method/config hash, date range, status, published_at.
- `ingestion_chunks`: dataset, source, requested start/end, status, counts, checksum, errors, fetched_at, source metadata.
- `daily_source_status`: dataset, source/platform, date, import status; authoritative ledger for missingness.
- `cell_days`: dataset, date, cell ID, cell centroid/polygon, area ID, M, V, presence flags; unique(dataset,date,cell_id).
- `area_days`: dataset, area, date, source raw counts, occupied counts, both/union counts, source completeness; unique(dataset,area,date).
- `raw_detections`: optional compact recent/detail subset; full raw archives remain local or private object storage if budget allows. Do not require millions of raw rows for public aggregate exploration.

Add appropriate date/area indexes and spatial indexes. Geometry setup must follow Supabase PostGIS guidance [S4]. Keep raw ingestion tables private; expose curated reads through narrow routes/RPC. Public users cannot insert/update/delete. Enable RLS on exposed tables and test anonymous write denial. Service-role keys remain server/local only. Bind SQL parameters; cap date and viewport query ranges.

Free-tier budget gate: measure actual aggregate row counts, database size, and response sizes after the first import. Compare with current project quotas. Do not assume the entire eleven-year cell-day archive fits. If projected storage exceeds quota, retain area-day summaries for imported years and load spatial detail one published year at a time; expose spatial availability separately from calendar availability. Provide a documented command to switch spatial year. Never silently downsample scientific totals.

## 10. API and shared state contracts

Use route handlers or equivalent tested RPC wrappers:

- `GET /api/catalog`: published dataset version, areas, years, daily ingestion coverage, available spatial-detail years, metric definitions and configuration.
- `GET /api/calendar?area=MMR&year=2025&mode=harmonized`: every actual date, value or null, completeness, counts, unit, scale thresholds, dataset version. Include full-year data independent of selected month/day so calendar context remains stable.
- `GET /api/map?area=MMR&start=...&end=...&mode=...&bbox=...&zoom=...`: GeoJSON features, representation, complete/partial status, aggregation resolution, version. Up to 5,000 features; aggregate into coarser display bins when needed and preserve counts. Coarse display bins must not change the underlying 1 km metric.
- `GET /api/summary`: selected area/period/source totals, quality numerator/denominators, and optional baseline eligibility/results. Exclude viewport from analytical totals.
- `GET /api/export`: bounded CSV of area-day summaries for the selected date filter and source. Include raw counts, occupied counts, completeness, method and dataset versions; escape CSV correctly. Spatial/raw bulk export is later scope.

All successful analytical responses include `dataset_version`, `method_version`, `unit`, and actual coverage. Use 400 for invalid filters, 503 for unavailable infrastructure, and an explicit structured unavailable-data result for valid unimported periods. Never turn query failures into empty successful data.

Persist `area`, `year`, `month`, `day`, `mode`, `panel` in the URL; optionally center/zoom. Validate all URL values. Defaults: Myanmar, newest year with imported data within 2015–2025, full year, harmonized, Explore. No imported data → 2025 with setup-required state. Use one shared filter model; cancel stale requests to prevent racing responses from mixing years/sources. Keep the last successful response visible with a loading label when refreshing.

## 11. Operational behavior and deployment

Provide `.env.example` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, server/local `SUPABASE_SERVICE_ROLE_KEY`, local `FIRMS_MAP_KEY`, and configurable basemap URL/attribution. Never include actual secrets in Git, logs, exports, or shared URLs. Public browser-visible keys must be protected by RLS, not treated as secrets.

Render: use a free web service; documented build command using the committed lockfile, production start bound to `0.0.0.0` and Render's `PORT`, plus health endpoint. Commit `render.yaml` if supported by the selected configuration. Durable data belongs in Supabase, not Render's local filesystem. Render free web services idle down and can cold-start; no continuous ingestion or alert-delivery promise [S5].

Basemap: visible OpenStreetMap attribution, normal browser caching, valid referrer, no bulk tile prefetch/download. Make the tile provider configurable [S6]. Tile failure displays an explanation and keeps overlays/calendar available. Add boundary/source citations in the Method panel.

Error states: missing Supabase config, invalid NASA credentials during import, rate limiting, malformed CSV, missing boundary, partial archive coverage, absent spatial year, empty valid source response, request timeout, tile failure, and expired/unavailable backend. Each has a specific message and retry/setup guidance. User-facing errors never expose secrets or stack traces.

## 12. Acceptance criteria

1. Real NASA rows drive the public dataset; source manifests identify precisely what was imported. No random hotspot generation in production.
2. Each imported observation is traceable to its source file/request and processing configuration; repeat imports are idempotent.
3. A test fixture containing repeated rows and same-cell same-day observations produces one union cell-day, with correct independent source counts.
4. Failed imports render unavailable dates, distinct from successful empty dates. Paired-source completeness gates agreement and baselines.
5. MODIS/VIIRS source switches preserve area/date filters and update map, metrics, legends, and calendar consistently.
6. Calendar renders all 365/366 days accurately, including 29 February 2016/2020/2024; selecting a date filters the map correctly in UTC.
7. Country clipping excludes points inside the download bbox but outside Myanmar. Border handling is deterministic.
8. An agreement denominator of zero displays N/A; no UI claims a precision or forecast percentage.
9. Map pan/zoom works and does not unexpectedly change national statistics. Dense data uses explicit aggregation without truncating totals.
10. Export matches selected analytical filters and includes units, completeness, and version metadata. Share URL reproduces the selection after refresh.
11. Reduced motion disables waves. Main controls/calendar work with keyboard and visible focus; mobile layout has no horizontal page overflow.
12. Anonymous writes fail; privileged keys do not appear in client bundles. Invalid API query parameters fail safely.
13. On a warm service and ordinary broadband, initial published calendar/summary and map queries target <3 seconds each; filter interaction targets <2 seconds. Report observed values and dataset size. Cold starts are measured separately.
14. Build/typecheck pass, plus focused processing tests, API validation checks, and one browser smoke journey. If deployment credentials are absent, report deployment-ready status rather than claiming a live release.

## 13. Two-hour execution order

Timeboxes guide tradeoffs; external downloads may run longer.

- Minutes 0–15: scaffold app, migration, configuration checks; establish real-data source access and boundary; begin the smallest overlapping historical import available. Prefer a full 2025 month if immediately accessible; otherwise use an accessible archived overlapping period and label exact coverage.
- Minutes 15–40: implement idempotent importer, grid aggregation, manifests, coverage ledger; publish first real slice. Start resumable additional imports independently of UI requests.
- Minutes 40–75: map, shared filters, twelve-month calendar, summary, source views, selection detail, truthful missing-data states.
- Minutes 75–95: quality/method panel, CSV/share, responsive layout, accessibility and animation controls.
- Minutes 95–115: processing/coverage tests, browser smoke test, build, Render configuration/deployment where access exists.
- Minutes 115–120: verify displayed coverage; write handoff with what works, imported dates, measured limits, blockers, and exact next commands.

If behind schedule, omit P1 analyses and subnational selection first. Retain real-data ingestion, provenance, missingness, source comparison, and a working core interaction. No artificial accuracy metric or placeholder scientific results to fill missing features.

## 14. Required repository deliverables

- Application source, lockfile, reproducible build/start commands.
- Supabase migrations and RLS policies.
- Import CLI supporting local archive CSV and authenticated API chunks; `--from`, `--to`, `--source`, `--resume`, `--dry-run`; clear help and documented actual invocation.
- Harmonization configuration and method version; boundary manifest and required attribution.
- Tests for meaningful scientific/data edge cases identified above.
- `.env.example`, Render deployment configuration, README, source manifest example with no secrets.
- Handoff report stating imported source/date coverage, spatial-detail coverage, processing counts, test results, deployment URL or blocker, and limitations.

## 15. Sources and evidence boundary

These sources support dataset/platform decisions. Grid size, inclusion rules, UX, API contracts, and thresholds above are proposed product methodology and must be presented as such. No independent ground-truth validation has been conducted for this PRD.

- [S1: Regional MODIS/VIIRS study, NOAA-hosted full text](https://repository.library.noaa.gov/view/noaa/64540/noaa_64540_DS1.pdf) — evidence that Myanmar provides a substantial comparative record; do not reuse study ratios as calibration.
- [S2: NASA FIRMS archive](https://firms.modaps.eosdis.nasa.gov/download/) — archive access and source temporal coverage.
- [S3: NASA FIRMS API tutorial](https://firms.modaps.eosdis.nasa.gov/content/academy/data_api/firms_api_use.html) — MAP_KEY, product availability, and historical request mechanisms. Check live limits/source IDs during implementation.
- [S4: Supabase PostGIS documentation](https://supabase.com/docs/guides/database/extensions/postgis) — spatial storage and querying.
- [S5: Render free service documentation](https://render.com/docs/free) — free-service operating constraints.
- [S6: OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/) — basemap usage and attribution obligations.
- [S7: NASA FIRMS detection guidance](https://firms2.modaps.eosdis.nasa.gov/alerts/notes.php) — sensor sensitivity and confidence interpretation limitations.

## 16. Instruction to the implementation agent

Implement this PRD as a working MVP; do not substitute a landing page or static visual mockup. Make routine implementation decisions autonomously. Verify source schemas and current package compatibility before coding adapters. Start with a real overlapping data slice, then extend imports without blocking interactive requests. Preserve the explicit distinction between aggregation and scientific calibration. Do not claim whole-period coverage, operational readiness, deployment, or completed validation unless verified. If a credential is unavailable, finish independent work and state exactly which setup is needed and which functionality remains blocked.
