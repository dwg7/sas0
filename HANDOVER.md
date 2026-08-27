# Handover

Current state of sas0, for whoever (human or AI) picks this up next.

## Status as of 2026-08-27

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
  ├─ 北海道
  │   └─ 防災情報                   — one compact link list: pref homepage (framing blocked) +
  │                                     北海道防災ポータル (live 179-municipality evacuation/warning/
  │                                     river/landslide/volcano status on one map, D19)
  ├─ 国土地理院
  │   └─ ハザードマップポータル      — link (D14 — embedding breaks it)
  ├─ 防災科学技術研究所
  │   └─ 強震モニタ                 — link; nationwide realtime seismic intensity; this source is
  │                                     HTTP-only, no HTTPS at all (D19)
  ├─ 北海道運輸局
  │   └─ 北海道 旅の安全情報         — link; multilingual transport-disruption/weather status (D19)
  ├─ 国土交通省
  │   └─ 川の防災情報               — link; national river water-level/flood-forecast portal (D20)
  ├─ 市町村                        — single grouped link list (NOT a folder tree — flattened in D20),
  │                                   14 of Hokkaido's 179 municipalities, one row per subprefecture
  │                                   heading; 石狩振興局 has both 札幌市's static hazard map and
  │                                   さっぽろ防災ポータル's live per-ward dashboard (D19)
  ├─ 火山                          — single link list (flattened in D20), 9 rows, one per volcano
  │                                   with an established 火山防災協議会 (D15), each linking to that
  │                                   council's own evacuation-plan material rather than JMA's
  │                                   summary (D18) — a different grouping from 気象庁's list above
  └─ Spiccato                     — embedded map, still a placeholder (see below)
  ```

  All four 気象庁 instruments were verified against live data while building this (including two Hokkaido volcanoes that happened to be at an elevated alert level at the time — レベル２, correctly rendered).

- **UI language unified to Japanese.** Instrument names, alt text, and copy were a mix of English and Japanese through the first build-out; all user-facing strings are Japanese now (proper nouns like "Spiccato" excepted). The root folder is named 状況認識サービス0 rather than the bare identifier `sas0`. This repo's own docs (this file included) stay in English by prior decision — see [CLAUDE.md](CLAUDE.md)'s "Project philosophy" section for the reasoning and the audience split.
- **Project philosophy formalized**: why open-data-only is a permanent boundary rather than a gap, why Open MCT specifically, and how this connects to DWG7's own mission — see [DECISIONS.md](DECISIONS.md) D16–D17 and README's "Why open data only?". Read this before adding any data source that isn't already genuinely public.

## Resolved since last handover

- **Link-heavy folders redesigned around an occasional-vs-daily split**: `renderLinkCard` (one big centered card per instrument) is gone, replaced by `renderLinkList` (dense, grouped rows) for every occasional-reference source; 市町村 and 火山 stopped being folder trees and became single root-level list instruments (fewer clicks, and scales cleanly as more municipalities are added). Investigated whether any of this could instead be *digested* (daily-monitoring style, like 気象庁's instruments) — found that 北海道防災ポータル/さっぽろ防災ポータル/川の防災情報 all publish live JSON but none of it sends CORS headers, so client-side `fetch()` from a backend-less static site can't read it; only JMA's `bosai.*` feeds are CORS-open. Full writeup, including a flexbox/`overflow:hidden` rendering bug hit along the way: [DECISIONS.md](DECISIONS.md) D20.
- **New source**: 国土交通省 (MLIT) 川の防災情報 (river.go.jp), added as a link under a new `国土交通省` folder — the closest available answer to the one genuine gap D20's CORS investigation surfaced (precise river water levels). See D20.
- **GSI hazard map iframe** — confirmed broken on the actual production deployment, not just local test tooling. Root cause isolated precisely: the `sandbox` attribute alone (even `allow-scripts allow-forms` with nothing else) breaks this specific old jQuery/Leaflet app, independent of `loading="lazy"` or `referrerpolicy`. Fixed by switching to an external link rather than weakening the sandbox for third-party content. Full writeup: [DECISIONS.md](DECISIONS.md) D14.
- **火山's 9 council links now point at each council's own evacuation-plan material**, not JMA's summary page — closes open item #4 below. See [DECISIONS.md](DECISIONS.md) D18 for the per-volcano source notes (two use a PDF authored by the council since no council portal page exists; 恵山's link goes to 函館市 since its council was folded into the city's disaster-prevention council after municipal mergers).
- **市町村 extended from 2 to 14 municipalities**, one per 振興局 — every subprefecture now has at least one entry. Still far from all 179; see open item #3 below, now updated. [DECISIONS.md](DECISIONS.md) D18.
- **[Issue #2](https://github.com/dwg7/sas0/issues/2) closed** — added 強震モニタ (NIED, new `防災科学技術研究所` folder), 北海道防災ポータル (北海道's second link, now merged into one list instrument, D20), さっぽろ防災ポータル (second entry for 札幌市 under 市町村), and 北海道 旅の安全情報 (MLIT's Hokkaido transport bureau, new `北海道運輸局` folder). kmoni required a first-of-its-kind change: it has no HTTPS endpoint at all, so the link renderer gained an opt-in `allowedProtocols` override, used only by that one instrument. See [DECISIONS.md](DECISIONS.md) D19.

## Open design thread: mappable vs. non-mappable data

A guiding principle surfaced during this work, not yet fully realized in code ([DECISIONS.md](DECISIONS.md) D13): the tree-of-instruments approach here is meant for data that **can't** be overlaid on a map (warning lists, quake logs, volcano tables, link cards). Data that **can** be represented as a map layer should instead be composited onto one shared map, classic-GIS "overlay everything" style — not fragmented into more non-map tree instruments.

Spiccato currently occupies the "the mappable stuff goes here" slot, but it was only ever built to confirm MapLibre GL JS itself works in this iframe-embedded/CDN-loaded/Brave-compatible setup (D9) — its current content (an administrative-boundary basemap from `layers-martin`) doesn't reflect this dashboard's actual use case yet. Candidate next step: a dedicated MapLibre GL JS site built for sas0, drawing on the tile catalog at <https://stars.optgeo.org/?tab=tiles>. Not started.

## Known open items

1. **Spiccato is a placeholder**, not yet serving this dashboard's actual mapping needs (see "mappable vs. non-mappable" above / D13).
2. **北海道開発局 doesn't have a folder/instrument yet.** Its top-level site doesn't send blocking framing headers, but the specific disaster-relevant page to link hasn't been identified. Note this is a distinct organization from 北海道運輸局 (D19) — 開発局 (development bureau, roads/rivers/ports) vs 運輸局 (transport bureau) — both are regional MLIT offices but not interchangeable; adding 開発局 means a new folder, not another instrument under the existing 北海道運輸局 one.
3. **市町村 has only 14 of Hokkaido's 179 municipalities** (one per 振興局 — D15, D18). Adding the next city is one `config.js` array entry (`regionKey` + the usual fields) — the grouped-list rendering (D20) scales to far more rows than the old folder tree did without any structural change needed. Two of the current 14 (倶知安町, 旭川市) fall back to a general 防災 page rather than a single hazard-map portal, since their own sites don't publish one (D18) — worth revisiting if a better single page turns up later.
4. ~~火山's 9 council links point at JMA's own summary page~~ — resolved, see D18.
5. **One harmless console error at startup** (`Cannot read properties of undefined (reading 'key')`), fires once, doesn't block anything. See [DECISIONS.md](DECISIONS.md) D4. Confirmed present, unchanged, across every Open MCT version used so far.
6. **Open MCT is pinned to a release candidate** (`4.3.0-rc1`, D8). If a future bump throws on `openmct.start('#app')`, check whether selector-string support changed.
7. **北海道防災ポータル / さっぽろ防災ポータル / 川の防災情報 stay links, not digested instruments, because none of their JSON sends `Access-Control-Allow-Origin`** (D20). If any of the three ever adds CORS, building a proper instrument for it (river levels and/or evacuation orders/shelters — the two things not covered anywhere else in sas0) would be a genuine upgrade over today's link. Worth an occasional re-check (`curl -sI -H "Origin: https://dwg7.github.io" <data-url>`) rather than assuming this stays closed forever.

## Where to look

- [README.md](README.md) — what sas0 is/isn't, why it's open-data-only, current instrument tree, roadmap, live site
- [DECISIONS.md](DECISIONS.md) — why things are built the way they are; D10–D17 cover the tree/instrument-registry architecture, the Hokkaido data sources, and the project's guiding philosophy; D18–D19 cover the municipality/volcano-council expansion and the issue #2 sources; D20 covers the `renderLinkList` redesign, the 市町村/火山 flattening, and the CORS investigation into daily-monitoring digestion
- [CLAUDE.md](CLAUDE.md) — working notes for AI coding assistants in this repo, including how to add a new instrument or organization folder, and the philosophy section to read first

## Roadmap reminder

`sas0 → sas1 → SAS Console → CSS` (Chat Context Sharing, explicitly out of scope for now). See [README.md](README.md#roadmap).
