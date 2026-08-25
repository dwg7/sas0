# Handover

Current state of sas0, for whoever (human or AI) picks this up next.

## Status as of 2026-08-26

- **v0 shipped and live**: [PR #1](https://github.com/dwg7/sas0/pull/1) merged to `main`, GitHub Pages serving at <https://dwg7.github.io/sas0/>. It originally shipped broken (four compounding Open MCT/CDN bugs — [DECISIONS.md](DECISIONS.md) D1–D6), fixed before/shortly after merge.
- **Open MCT pinned to `4.3.0-rc1`**, using the current selector-string `start('#app')` form ([DECISIONS.md](DECISIONS.md) D8).
- **Architecture is Open MCT's own browse tree** (D10), following a UX consulting pass for a concrete daily-use case: a Hokkaido regional survey department director who wants to check a handful of disaster-related sources by clicking through a list, not stare at a fixed grid. Every instrument is a single full-screen view, one click away. Current shape:

  ```
  状況認識サービス0 (sas0)
  ├─ 気象庁
  │   ├─ 天気図                    — live JMA surface weather chart
  │   ├─ 警報・注意報（北海道）      — active advisories/warnings, 8 forecast regions
  │   ├─ 地震情報（北海道関連）      — recent Hokkaido-relevant earthquakes
  │   └─ 火山情報（北海道の火山）    — current alert level, ~20 monitored volcanoes
  ├─ 北海道                        — external link card (pref site blocks framing)
  ├─ 国土地理院
  │   └─ ハザードマップポータル      — external link card (D14 — embedding breaks it)
  ├─ 市町村
  │   ├─ 石狩振興局 → 札幌市        — external link card to the city's own hazard map
  │   └─ 釧路総合振興局 → 釧路市     — same
  ├─ 火山                          — 9 link cards, one per volcano with an established
  │                                   火山防災協議会 (D15) — a different grouping from
  │                                   気象庁's alert-level list above
  └─ Spiccato                     — embedded map, still a placeholder (see below)
  ```

  All four 気象庁 instruments were verified against live data while building this (including two Hokkaido volcanoes that happened to be at an elevated alert level at the time — レベル２, correctly rendered).

- **UI language unified to Japanese.** Instrument names, alt text, and copy were a mix of English and Japanese through the first build-out; all user-facing strings are Japanese now (proper nouns like "Spiccato" excepted). The root folder is named 状況認識サービス0 rather than the bare identifier `sas0`. This repo's own docs (this file included) stay in English by prior decision — see [CLAUDE.md](CLAUDE.md)'s "Project philosophy" section for the reasoning and the audience split.
- **Project philosophy formalized**: why open-data-only is a permanent boundary rather than a gap, why Open MCT specifically, and how this connects to DWG7's own mission — see [DECISIONS.md](DECISIONS.md) D16–D17 and README's "Why open data only?". Read this before adding any data source that isn't already genuinely public.

## Resolved since last handover

- **GSI hazard map iframe** — confirmed broken on the actual production deployment, not just local test tooling. Root cause isolated precisely: the `sandbox` attribute alone (even `allow-scripts allow-forms` with nothing else) breaks this specific old jQuery/Leaflet app, independent of `loading="lazy"` or `referrerpolicy`. Fixed by switching to an external link card rather than weakening the sandbox for third-party content. Full writeup: [DECISIONS.md](DECISIONS.md) D14.

## Open design thread: mappable vs. non-mappable data

A guiding principle surfaced during this work, not yet fully realized in code ([DECISIONS.md](DECISIONS.md) D13): the tree-of-instruments approach here is meant for data that **can't** be overlaid on a map (warning lists, quake logs, volcano tables, link cards). Data that **can** be represented as a map layer should instead be composited onto one shared map, classic-GIS "overlay everything" style — not fragmented into more non-map tree instruments.

Spiccato currently occupies the "the mappable stuff goes here" slot, but it was only ever built to confirm MapLibre GL JS itself works in this iframe-embedded/CDN-loaded/Brave-compatible setup (D9) — its current content (an administrative-boundary basemap from `layers-martin`) doesn't reflect this dashboard's actual use case yet. Candidate next step: a dedicated MapLibre GL JS site built for sas0, drawing on the tile catalog at <https://stars.optgeo.org/?tab=tiles>. Not started.

## Known open items

1. **Spiccato is a placeholder**, not yet serving this dashboard's actual mapping needs (see "mappable vs. non-mappable" above / D13).
2. **北海道開発局 doesn't have a folder/instrument yet.** Its top-level site doesn't send blocking framing headers, but the specific disaster-relevant page to link hasn't been identified.
3. **市町村 has only 2 of Hokkaido's 179 municipalities** (札幌市, 釧路市 — D15). The folder-per-振興局 structure is in place to scale; adding the next city is one `config.js` array entry (`docs/instruments/municipalities.js`).
4. **火山's 9 council links point at JMA's own summary page for each volcano**, not necessarily each council's own published evacuation-plan document — finding and linking the actual deliverables per volcano (D15) is a further refinement.
5. **One harmless console error at startup** (`Cannot read properties of undefined (reading 'key')`), fires once, doesn't block anything. See [DECISIONS.md](DECISIONS.md) D4. Confirmed present, unchanged, across every Open MCT version used so far.
6. **Open MCT is pinned to a release candidate** (`4.3.0-rc1`, D8). If a future bump throws on `openmct.start('#app')`, check whether selector-string support changed.

## Where to look

- [README.md](README.md) — what sas0 is/isn't, why it's open-data-only, current instrument tree, roadmap, live site
- [DECISIONS.md](DECISIONS.md) — why things are built the way they are; D10–D17 cover the tree/instrument-registry architecture, the Hokkaido data sources, and the project's guiding philosophy
- [CLAUDE.md](CLAUDE.md) — working notes for AI coding assistants in this repo, including how to add a new instrument or organization folder, and the philosophy section to read first

## Roadmap reminder

`sas0 → sas1 → SAS Console → CSS` (Chat Context Sharing, explicitly out of scope for now). See [README.md](README.md#roadmap).
