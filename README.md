# sas0

sas0 stands for **Situational Awareness as a Service Console**.

It is a Version 0 experiment to explore public situational awareness as a shared public good using a lightweight mission-console style interface.

sas0 is a project of **DWG7 (UN Smart Maps Group)**, a Domain Working Group of the [UN Open GIS Initiative](https://unopengis.org/) — "keep web maps open for a better world."

## Live site

<https://dwg7.github.io/sas0/>

## What is sas0?

sas0 is a static GitHub Pages prototype built with Open MCT.

It asks a narrow question: can publicly available instruments be assembled into a calm, readable, shared awareness console without building command infrastructure?

Rather than a fixed layout, sas0 uses Open MCT's own browse tree as its navigation: each instrument is a separate object, one click away. The current tree (driven by a small Hokkaido disaster-preparedness use case, but arbitrary to extend):

Root order follows daily-use priority first, with occasional-reference sources bucketed at the end (D28). As of D54, リンク集 is the only folder in the whole tree — everything else the user checks daily sits flat at root, one click away, per a direct usability request to make frequent items feel like a one-click ops console:

```
状況認識サービス0 (sas0)
├─ 状況図                        — native MapLibre GL JS map (no iframe — D27), replaces the old
│                                   Spiccato placeholder (D9); JMA forecast-region polygons colored
│                                   live by warning severity, municipality polygons clickable through
│                                   to their 市町村 hazard-map link when one exists (D26's polygons
│                                   used as a linking anchor); hover shows a docked info panel, click
│                                   opens a link-only popup (D29); also plots recent quake epicenters
│                                   and the 9 volcanoes' locations as point layers, reusing 地震/火山's
│                                   own JMA data, no new source (D47), plus a third point layer of
│                                   電子基準点 (GEONET) locations from GSI's own CORS-open tile GeoJSON
│                                   (D53). Named 地図 ("map") until D48 moved it ahead of 気象庁 (itself
│                                   dissolved in D54) and renamed it 状況図 ("situation map")
├─ 天気図                        — latest JMA surface weather chart, fetched live; scrubbable across
│                                   the recent frames JMA's own feed already provides (D53). Promoted
│                                   from the now-dissolved 気象庁 folder to root in D54
├─ 警報・注意報                  — active JMA advisories/warnings across Hokkaido's 8 forecast regions.
│                                   Renamed from 「警報・注意報（北海道）」, promoted to root in D54
├─ 地震                          — recent earthquakes affecting Hokkaido. Renamed from
│                                   「地震情報（北海道関連）」, promoted to root in D54
├─ 火山                          — current alert level for the 9 volcanoes JMA continuously monitors
│                                   in Hokkaido (filtered from the wider 20-volcano code range — D28).
│                                   Renamed from 「火山情報（北海道の火山）」, promoted to root in D54
├─ 地震の規模推移（北海道関連） — SVG scatter of magnitude vs. time, reusing 地震's own fetched data
│                                   (D53); promoted to root in D54
├─ 変化の記録                    — local-only (no backend) log of changes in 警報・地震・火山 since the
│                                   last manual refresh (D53); promoted to root in D54
└─ リンク集                      — occasional-reference sources, not live status (D28); sas0's only
                                    folder as of D54, holding 8 instruments: the original 4 below plus
                                    強震モニタ・川の防災情報・北海道開発局 防災情報ポータルサイト・
                                    北海道 防災情報, moved here from root in D54
    ├─ ハザードマップポータル      — link (this app doesn't tolerate iframe sandboxing — D14)
    ├─ 北海道 防災情報            — a compact link list: the prefecture's homepage (embedding blocked)
    │                               and 北海道防災ポータル (179-municipality live evacuation/warning/
    │                               river/landslide/volcano status, on one map)
    ├─ 北海道 旅の安全情報         — link; multilingual transport-disruption/weather status
    ├─ 北海道開発局 防災情報ポータルサイト — link; the bureau's own curated portal (river/road/port/
    │                               weather/quake/volcano status), distinct from both 北海道運輸局 and
    │                               国土交通省 (D21)
    ├─ 強震モニタ                — link; nationwide realtime seismic-intensity map (this source has
    │                               no HTTPS at all — D19)
    ├─ 川の防災情報               — link; national river water-level/flood-forecast portal (D20)
    ├─ 市町村                    — a single grouped link list (by 振興局/subprefecture), not a folder
    │                               tree; all 179 of Hokkaido's municipalities (35 cities, 15
    │                               villages, 129 towns), built up over sixteen repeatable batches
    │                               (D18, D23–D25, D31–D42) and complete as of D42; plus a live
    │                               city-run disaster portal for 札幌市 and two of its wards (D30)
    └─ 火山                      — a single link list, one row per volcano with an established
                                    火山防災協議会, to that council's own evacuation-plan material
                                    (the same 9 volcanoes as the root-level 火山 instrument above,
                                    complementary rather than duplicate information — D28)
```

Each instrument is a single full-screen view — click it in the left-hand tree, look, click the next one. See [DECISIONS.md](DECISIONS.md) D10 for why this replaced the original fixed two-panel layout, and how to add another instrument or organization. Occasional-reference sources (anything above rendered as a link) use the compact `renderLinkList` row format rather than a folder tree per item — see D20 for why, and D20 also covers why the two live prefecture/city disaster portals above stayed links instead of becoming digested instruments (no CORS on their data).

## What is not sas0?

sas0 is explicitly not:

- EOC software
- command-and-control software
- chat software
- GIS software
- incident management software

It also does not include backend services, databases, authentication, workflows, or user management.

## Why open data only?

Every instrument in sas0 pulls from data that's already genuinely public — national and local government sources, published as-is. That's a deliberate boundary, not a gap to close later: sas0 respects the protected, operational systems that real disaster response actually runs on, and doesn't try to stand in for them or blur the line by reaching into non-public information. See [DECISIONS.md](DECISIONS.md) D17.

Working entirely from open data, with no backend (this whole site is static — see [Deployment](#deployment) below), is also the point of the exercise: it's a demonstration that a click-through, mission-console-style architecture can be built from public sources alone. If an organization later needs to integrate its own non-public situational data internally, that's properly a separate, access-controlled service — this project's contribution is making sure the underlying pattern already works.

## Inspiration

sas0 is inspired by ideas and ecosystems around:

- [Open MCT](https://nasa.github.io/openmct/) — NASA's own mission-control framework, open-sourced. Using it here, unmodified at its core, for open civilian disaster data is itself a small demonstration of "keep web maps open for a better world": the same object/composition/view model that runs spacecraft ground systems works, as-is, for a regional government's public awareness dashboard.
- [DWG7 / UN Smart Maps](https://github.com/dwg7)
- [UN Open GIS Initiative](https://unopengis.org/)

The project does not attempt to reproduce those systems.

## Roadmap

A possible evolution path is:

**sas0 → sas1 → SAS Console → CSS**

Where:

- **sas0** is concept validation
- **sas1** can refine instrument composition
- **SAS Console** can mature the mission-console model
- **CSS (Chat Context Sharing)** is intentionally outside the scope of sas0

## Deployment

This repository is GitHub Pages oriented and static-only: `main`'s `docs/` directory is served directly, with no build step.

- `docs/index.html` — loads Open MCT and MapLibre GL JS from pinned CDN versions, then the scripts below, in order
- `docs/core.js` — Open MCT bootstrap; defines `SAS0.registerFolder()`/`SAS0.registerInstrument()` (both take an optional `order` to control display order independent of `<script>` load order — D28) and the shared `getSafeUrl()`/`renderLinkList()` helpers
- `docs/folders.js` — declares リンク集, sas0's only remaining folder (D54 dissolved 気象庁, the other one), and the root-level `order` values that place root instruments (D28). A folder is only created where it groups 2+ instruments (D43) — 防災科学技術研究所/国土交通省/北海道開発局/北海道/国土地理院/北海道運輸局/気象庁 used to each wrap a set of instruments in their own folder and were all dissolved; their instruments now register directly with `parentKey: 'root'` or `parentKey: 'reference'` and an explicit `order` where one is needed
- `docs/instruments/*.js` — one file per instrument or instrument group (weather, warnings, quake, volcano, quake-trend, change-log, hkd-map, gsi-hazard, hokkaido, hokkaido-safe-travel, hokkaido-development-bureau, kmoni, river-info, municipalities, volcano-councils), each calling `SAS0.registerInstrument()` (municipalities/volcano-councils loop over a `config.js` array and render one grouped `renderLinkList()`; hkd-map builds a MapLibre style at render time from a fetched basemap plus three vector/GeoJSON sources hosted on `stars.optgeo.org` and `cyberjapandata.gsi.go.jp`, D26/D27/D53; quake-trend renders a plain SVG chart, not Open MCT's native Plot view — see D53 for why)
- `docs/boot.js` — calls `SAS0.start()`; must load last, after every instrument has registered
- `docs/config.js` — instrument titles, URLs, and host allowlists
- `docs/style.css` — shared instrument layout and per-instrument styling (warning severity colors, link lists, etc.)
- `scripts/check-links.sh` — re-verifies every outbound URL in `docs/config.js`/`docs/instruments/*.js` still resolves; runs both by hand (D22) and weekly via `.github/workflows/check-links.yml`, sas0's one CI job (D45)

Open MCT has a few integration quirks specific to loading it from a CDN into a static site (a wrong CDN pin will silently render a blank page) — see [DECISIONS.md](DECISIONS.md) before changing `docs/index.html` or `docs/core.js`.

To preview locally:

```bash
cd docs && python3 -m http.server 8000
```

## License

[CC0 1.0 Universal](LICENSE) — public domain.

## Project docs

- [DECISIONS.md](DECISIONS.md) — why things are built the way they are, including the Open MCT/CDN gotchas found while getting this to actually render
- [HANDOVER.md](HANDOVER.md) — current state and open next steps
- [CLAUDE.md](CLAUDE.md) — working notes for AI coding assistants in this repo
