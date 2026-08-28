# Handover

Current state of sas0, for whoever (human or AI) picks this up next.

## Status as of 2026-08-28

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
  ├─ 北海道開発局
  │   └─ 防災情報ポータルサイト      — link; the bureau's own curated portal (河川/土砂災害/道路/港湾/
  │                                     気象/地震津波/火山), a third distinct MLIT-family org
  │                                     alongside 北海道運輸局 and 国土交通省 above (D21)
  ├─ 市町村                        — single grouped link list (NOT a folder tree — flattened in D20),
  │                                   38 of Hokkaido's 179 municipalities, one row per subprefecture
  │                                   heading; every subprefecture has 2+ entries now, larger ones up
  │                                   to 5 (D23–D25 — extended in repeatable ~8-city batches);
  │                                   石狩振興局 has both 札幌市's static hazard map and さっぽろ
  │                                   防災ポータル's live per-ward dashboard (D19)
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

- **北海道開発局 folder added** — closes open item #2 below. Its own `防災・災害情報` page links to several of the bureau's own systems (a river/dam real-time monitor distinct from D20's river.go.jp, a road-closure system, and its own curated `防災情報ポータルサイト`); linked the portal page, the bureau's single best entry point, same reasoning as why 北海道運輸局's own portal was chosen over its individual sub-feeds (D19). See [DECISIONS.md](DECISIONS.md) D21.
- **Stale-link detection considered** — as outbound links grew past ~40, worth a deliberate answer for *noticing* staleness later, not just verifying at add-time. Client-side detection (`fetch(..., {mode:'no-cors'})`) was ruled out as too weak (opaque responses can't distinguish a 404 from a 200, the most common real-world case). Built `scripts/check-links.sh` instead — a manual, dependency-free bash tool (not CI) that greps every outbound URL out of `docs/config.js`/`docs/instruments/*.js` and curls each. Left open: whether a *scheduled* GitHub Actions check would be worth crossing this repo's stated "no CI" line for — a real scope decision, not made here. See [DECISIONS.md](DECISIONS.md) D22.
- **Link-heavy folders redesigned around an occasional-vs-daily split**: `renderLinkCard` (one big centered card per instrument) is gone, replaced by `renderLinkList` (dense, grouped rows) for every occasional-reference source; 市町村 and 火山 stopped being folder trees and became single root-level list instruments (fewer clicks, and scales cleanly as more municipalities are added). Investigated whether any of this could instead be *digested* (daily-monitoring style, like 気象庁's instruments) — found that 北海道防災ポータル/さっぽろ防災ポータル/川の防災情報 all publish live JSON but none of it sends CORS headers, so client-side `fetch()` from a backend-less static site can't read it; only JMA's `bosai.*` feeds are CORS-open. Full writeup, including a flexbox/`overflow:hidden` rendering bug hit along the way: [DECISIONS.md](DECISIONS.md) D20.
- **New source**: 国土交通省 (MLIT) 川の防災情報 (river.go.jp), added as a link under a new `国土交通省` folder — the closest available answer to the one genuine gap D20's CORS investigation surfaced (precise river water levels). See D20.
- **GSI hazard map iframe** — confirmed broken on the actual production deployment, not just local test tooling. Root cause isolated precisely: the `sandbox` attribute alone (even `allow-scripts allow-forms` with nothing else) breaks this specific old jQuery/Leaflet app, independent of `loading="lazy"` or `referrerpolicy`. Fixed by switching to an external link rather than weakening the sandbox for third-party content. Full writeup: [DECISIONS.md](DECISIONS.md) D14.
- **火山's 9 council links now point at each council's own evacuation-plan material**, not JMA's summary page — closes open item #4 below. See [DECISIONS.md](DECISIONS.md) D18 for the per-volcano source notes (two use a PDF authored by the council since no council portal page exists; 恵山's link goes to 函館市 since its council was folded into the city's disaster-prevention council after municipal mergers).
- **市町村 extended from 30 to 38 municipalities (batch 4)** — closed the last gap: 釧路町/せたな町/羽幌町/枝幸町 gave every one of the 14 subprefectures 2+ entries for the first time; 北広島市/登別市/幕別町/別海町 added by population. 釧路町 hit the identical HTTPS/TLS-SNI failure as 名寄市 (D23) — same failure mode *and same IP address*, pointing at a shared hosting platform issue across multiple Hokkaido municipal sites, not isolated incidents. Three more stale-search-result URLs were caught and corrected proactively (幕別町, 羽幌町, せたな町) after the research prompt was sharpened post-D24. Both are now treated as expected-every-batch, not occasional surprises. See [DECISIONS.md](DECISIONS.md) D25.
- **市町村 extended from 22 to 30 municipalities (batch 3 of an ongoing series)** — 音更町/北斗市/恵庭市/富良野市/紋別市/中標津町/新ひだか町/深川市, again population-prioritized within thin subprefectures. 深川市 repeated batch 2's 網走市 pattern: the top search result for its hazard map was already stale (301s to a generic page), the real one found by navigating the site's own menu — two batches running into the same failure mode is now flagged as a recurring characteristic of Hokkaido municipal sites, not a one-off. See [DECISIONS.md](DECISIONS.md) D24.
- **市町村 extended from 14 to 22 municipalities** — 6 of the 14 subprefectures now have a second or third entry (population-prioritized: 苫小牧市/伊達市, 小樽市, 千歳市/江別市, 網走市, 名寄市, 滝川市). 名寄市's page has no working HTTPS (TLS/SNI mismatch, not just a missing redirect) — reused the `allowedProtocols: ['http:']` per-item override built for kmoni (D19) with no code change needed. [DECISIONS.md](DECISIONS.md) D23.
- **市町村 extended from 2 to 14 municipalities**, one per 振興局 — every subprefecture now has at least one entry. [DECISIONS.md](DECISIONS.md) D18.
- **[Issue #2](https://github.com/dwg7/sas0/issues/2) closed** — added 強震モニタ (NIED, new `防災科学技術研究所` folder), 北海道防災ポータル (北海道's second link, now merged into one list instrument, D20), さっぽろ防災ポータル (second entry for 札幌市 under 市町村), and 北海道 旅の安全情報 (MLIT's Hokkaido transport bureau, new `北海道運輸局` folder). kmoni required a first-of-its-kind change: it has no HTTPS endpoint at all, so the link renderer gained an opt-in `allowedProtocols` override, used only by that one instrument. See [DECISIONS.md](DECISIONS.md) D19.

## Open design thread: mappable vs. non-mappable data

A guiding principle surfaced during this work, not yet fully realized in code ([DECISIONS.md](DECISIONS.md) D13): the tree-of-instruments approach here is meant for data that **can't** be overlaid on a map (warning lists, quake logs, volcano tables, link cards). Data that **can** be represented as a map layer should instead be composited onto one shared map, classic-GIS "overlay everything" style — not fragmented into more non-map tree instruments.

Spiccato currently occupies the "the mappable stuff goes here" slot, but it was only ever built to confirm MapLibre GL JS itself works in this iframe-embedded/CDN-loaded/Brave-compatible setup (D9) — its current content (an administrative-boundary basemap from `layers-martin`) doesn't reflect this dashboard's actual use case yet.

**First concrete step taken** (D26): the design now has a specific shape — polygons as a *依代* (linking anchor), not information in themselves. A warning-region polygon's styling comes from `warnings.js`'s already-fetched data; a municipality polygon's click behavior would jump to its existing `config.js` hazard-map link. Two Hokkaido-only vector-tile layers were built to back this (`jma_1saibun_hkd.pmtiles` — JMA class10 forecast regions, joins 1:1 against live warning JSON; `ksj_n03_hkd.pmtiles` — 国土数値情報 N03 municipality polygons, includes 札幌市's 10 wards as separate features already) — see D26 for the full pipeline. Both are now **live in production** at `https://stars.optgeo.org/pmtiles_jma_1saibun_hkd/{z}/{x}/{y}` and `https://stars.optgeo.org/pmtiles_ksj_n03_hkd/{z}/{x}/{y}` (deployed and checksum-verified via `~/stars`'s own dedicated session, a separate repo/host from sas0). Not yet wired into any actual map, and not yet styled/linked — this is the data layer only.

## Known open items

1. **Spiccato is a placeholder**, not yet serving this dashboard's actual mapping needs (see "mappable vs. non-mappable" above / D13, D26). Two polygon vector-tile layers now exist (D26) to build the eventual replacement against, on `~/stars`, but no map has been built to consume them yet.
2. ~~北海道開発局 doesn't have a folder/instrument yet~~ — resolved, see D21.
3. **市町村 has only 38 of Hokkaido's 179 municipalities.** Deliberately being extended in repeatable ~8-city batches rather than all at once (D23–D25) — each batch gets independent URL re-verification, a browser walkthrough, and its own DECISIONS.md entry recording whatever judgment calls that batch's cities needed, rather than one large low-context bulk add. Every subprefecture now has 2+ entries (as of batch 4); further batches will keep adding by population regardless of region. Adding the next city is one `config.js` array entry (`regionKey` + the usual fields); the grouped-list rendering (D20) scales to far more rows than the old folder tree did without any structural change needed. Five of the current 38 (倶知安町, 旭川市, 千歳市, 伊達市, 富良野市) fall back to a general 防災 page rather than a single hazard-map portal (D18, D23, D24). Two recurring failure modes to actively check for on every future batch, not just react to (D25): (a) a municipality's HTTPS failing with a TLS/SNI mismatch even though the domain otherwise resolves fine (名寄市, 釧路町 — both on the same IP, so likely more Hokkaido municipal sites share this) — needs `allowedProtocols: ['http:']`, no code change; (b) the top search result for a hazard-map page already being stale (網走市, 深川市, and three more caught pre-emptively in batch 4) — always confirm via the municipality's own site navigation, not the search hit. Planned follow-up once coverage is further along: check whether 札幌市's individual 区 (wards) publish their own hazard-map pages beyond the citywide one already linked.
4. ~~火山's 9 council links point at JMA's own summary page~~ — resolved, see D18.
5. **One harmless console error at startup** (`Cannot read properties of undefined (reading 'key')`), fires once, doesn't block anything. See [DECISIONS.md](DECISIONS.md) D4. Confirmed present, unchanged, across every Open MCT version used so far.
6. **Open MCT is pinned to a release candidate** (`4.3.0-rc1`, D8). If a future bump throws on `openmct.start('#app')`, check whether selector-string support changed.
7. **北海道防災ポータル / さっぽろ防災ポータル / 川の防災情報 stay links, not digested instruments, because none of their JSON sends `Access-Control-Allow-Origin`** (D20). If any of the three ever adds CORS, building a proper instrument for it (river levels and/or evacuation orders/shelters — the two things not covered anywhere else in sas0) would be a genuine upgrade over today's link. Worth an occasional re-check (`curl -sI -H "Origin: https://dwg7.github.io" <data-url>`) rather than assuming this stays closed forever.
8. **Whether to add a scheduled CI-based link checker is an open policy question, not decided** (D22). `scripts/check-links.sh` exists and works stand-alone; wiring it into a scheduled GitHub Actions workflow would be this repo's first CI, in tension with CLAUDE.md's stated "no CI." Worth a deliberate call from whoever maintains sas0 next, not something to add quietly.

## Where to look

- [README.md](README.md) — what sas0 is/isn't, why it's open-data-only, current instrument tree, roadmap, live site
- [DECISIONS.md](DECISIONS.md) — why things are built the way they are; D10–D17 cover the tree/instrument-registry architecture, the Hokkaido data sources, and the project's guiding philosophy; D18–D19 cover the municipality/volcano-council expansion and the issue #2 sources; D20 covers the `renderLinkList` redesign, the 市町村/火山 flattening, and the CORS investigation into daily-monitoring digestion; D21 covers 北海道開発局; D22 covers `scripts/check-links.sh` and the stale-link detection design; D23–D25 cover the 14→22→30→38 municipality batches, the repeatable-batch process itself, and the two recurring failure modes (HTTPS/SNI, stale search results) found along the way; D26 covers the two Hokkaido-only vector-tile layers built on `~/stars` toward replacing Spiccato
- [CLAUDE.md](CLAUDE.md) — working notes for AI coding assistants in this repo, including how to add a new instrument or organization folder, and the philosophy section to read first

## Roadmap reminder

`sas0 → sas1 → SAS Console → CSS` (Chat Context Sharing, explicitly out of scope for now). See [README.md](README.md#roadmap).
