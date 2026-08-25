# Handover

Current state of sas0, for whoever (human or AI) picks this up next.

## Status as of 2026-08-26

- **v0 shipped and live**: [PR #1](https://github.com/dwg7/sas0/pull/1) merged to `main`, GitHub Pages serving at <https://dwg7.github.io/sas0/>. It originally shipped broken (four compounding Open MCT/CDN bugs — [DECISIONS.md](DECISIONS.md) D1–D6), fixed before/shortly after merge.
- **Open MCT pinned to `4.3.0-rc1`**, using the current selector-string `start('#app')` form ([DECISIONS.md](DECISIONS.md) D8).
- **Architecture rebuilt around Open MCT's own browse tree** (D10), following a UX consulting pass for a concrete daily-use case: a Hokkaido regional survey department director who wants to check a handful of disaster-related sources by clicking through a list, not stare at a fixed grid. The former fixed "two panels side by side" layout is gone; every instrument is now a single full-screen view, one click away in the left-hand tree:

  ```
  sas0
  ├─ 気象庁 (JMA)
  │   ├─ Today's Weather Chart   — live 天気図
  │   ├─ 警報・注意報（北海道）      — active advisories/warnings, 8 forecast regions
  │   ├─ 地震情報（北海道関連）      — recent Hokkaido-relevant earthquakes
  │   └─ 火山情報（北海道の火山）    — current alert level, ~20 volcanoes
  ├─ 北海道                        — external link card (pref site blocks framing)
  ├─ 国土地理院 (GSI)
  │   └─ ハザードマップポータル      — embedded hazard map portal
  └─ Spiccato                     — embedded map, still a placeholder (see below)
  ```

  All four JMA instruments were verified against live data while building this (including two Hokkaido volcanoes that happened to be at an elevated alert level at the time — レベル２, correctly rendered). Full data-source detail: [DECISIONS.md](DECISIONS.md) D11.

- **Not yet reconfirmed on the actual production deployment**: the GSI hazard map iframe rendered gray/blank in this repo's own test tooling (same "works standalone, blank when embedded in this particular test harness" symptom Spiccato showed before its own production check turned out fine — D9's history). No blocking header or CSP was found. Needs a look at the live site before trusting it. See [DECISIONS.md](DECISIONS.md) D12.

## Open design thread: mappable vs. non-mappable data

A guiding principle surfaced during this work, not yet fully realized in code ([DECISIONS.md](DECISIONS.md) D13): the tree-of-instruments approach here is meant for data that **can't** be overlaid on a map (warning lists, quake logs, volcano tables). Data that **can** be represented as a map layer should instead be composited onto one shared map, classic-GIS "overlay everything" style — not fragmented into more non-map tree instruments.

Spiccato currently occupies the "the mappable stuff goes here" slot, but it was only ever built to confirm MapLibre GL JS itself works in this iframe-embedded/CDN-loaded/Brave-compatible setup (D9) — its current content (an administrative-boundary basemap from `layers-martin`) doesn't reflect this dashboard's actual use case yet. Candidate next step: a dedicated MapLibre GL JS site built for sas0, drawing on the tile catalog at <https://stars.optgeo.org/?tab=tiles>. Not started.

## Known open items

1. **GSI hazard map iframe rendering unconfirmed in production** (see above / D12).
2. **Spiccato is a placeholder**, not yet serving this dashboard's actual mapping needs (see "mappable vs. non-mappable" above / D13).
3. **北海道開発局 and 札幌市 don't have folders/instruments yet.** Their top-level sites don't send blocking framing headers, but the specific disaster-relevant pages to embed haven't been identified — needs the same `curl -sI` verification discipline as everything else here before adding.
4. **One harmless console error at startup** (`Cannot read properties of undefined (reading 'key')`), fires once, doesn't block anything. See [DECISIONS.md](DECISIONS.md) D4. Confirmed present, unchanged, across every Open MCT version used so far.
5. **Open MCT is pinned to a release candidate** (`4.3.0-rc1`, D8). If a future bump throws on `openmct.start('#app')`, check whether selector-string support changed.

## Where to look

- [README.md](README.md) — what sas0 is/isn't, current instrument tree, roadmap, live site
- [DECISIONS.md](DECISIONS.md) — why things are built the way they are; D10–D13 cover the tree/instrument-registry architecture and the Hokkaido data sources
- [CLAUDE.md](CLAUDE.md) — working notes for AI coding assistants in this repo, including how to add a new instrument or organization folder

## Roadmap reminder

`sas0 → sas1 → SAS Console → CSS` (Chat Context Sharing, explicitly out of scope for now). See [README.md](README.md#roadmap).
