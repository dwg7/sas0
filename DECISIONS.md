# Decisions

Why sas0 is built the way it is. Numbered so other docs and commit messages can point at a specific entry (`see D3`).

## D1: Open MCT is loaded from a CDN, not vendored

sas0 is a zero-build static site (`docs/` served as-is by GitHub Pages), and the [original prompt](https://github.com/dwg7/sas0/pull/1) that kicked off this project explicitly ruled out backend/build infrastructure. Loading `openmct.js`/`espressoTheme.css` from unpkg keeps the repo free of a multi-MB vendored `dist/`, at the cost of a few CDN-specific integration issues — see D2–D5.

## D2: The Open MCT version is pinned to an exact, verified-to-exist release

The version that first shipped in PR #1 (`openmct@3.3.0`) does not exist on npm/unpkg — the CDN URL 404'd, so nothing loaded at all. `docs/index.html` currently pins `openmct@4.3.0-rc1` (bumped from the initial fix's `4.2.0` once the RC was confirmed to work end-to-end — see D8).

**Before bumping this version**, verify both of these resolve (a 404 on either means a silent blank page, since `docs/core.js` doesn't surface CDN load failures beyond a generic "Open MCT failed to load" throw):

```bash
curl -sI "https://unpkg.com/openmct@<version>/dist/openmct.js"
curl -sI "https://unpkg.com/openmct@<version>/dist/espressoTheme.css"
```

Note the CSS file is `espressoTheme.css`, not `openmct.css` — that filename changed at some point between the 3.x and 4.x series and isn't obvious from the package name.

## D3: `window.SharedWorker` is disabled before Open MCT loads

Open MCT's built-in search indexer (`InMemorySearchProvider`) unconditionally starts a `SharedWorker` pointed at its own asset path — i.e. the CDN origin (`unpkg.com`), not the site's own origin (`dwg7.github.io`). Browsers block constructing a `SharedWorker` from a cross-origin script URL, which throws a synchronous `SecurityError` inside `openmct.start()` and aborts the whole bootstrap before anything renders.

Open MCT already has a fallback for this exact situation (`typeof SharedWorker === 'undefined'` → synchronous local-index search, meant for iOS which lacks `SharedWorker`). `docs/index.html` deliberately forces that fallback:

```js
window.SharedWorker = undefined;
```

This is the CDN-loading equivalent of iOS's own constraint — Open MCT already handles the "no SharedWorker" case, it just doesn't know that a cross-origin CDN load needs the same treatment. The tradeoff is losing background/threaded search indexing; sas0 has exactly one fixed non-searchable object, so this costs nothing here.

## D4: A minor Open MCT search-indexer error is left unaddressed

With D3's fallback active, Open MCT logs one console error at startup — `Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'key')` — from somewhere inside the local-search indexing path. It fires exactly once per page load (confirmed by watching the console for several seconds after start), doesn't recur, and doesn't block rendering, tree navigation, or the inspector panel.

This looks like a latent edge case in Open MCT's own local-search fallback (plausibly triggered by indexing the single custom `sas0.console` root object, which lacks fields a normal composed object would have) rather than something sas0's code does wrong. It's left as a known, harmless console error rather than chased further; confirmed still present, unchanged, after the 4.2.0 → 4.3.0-rc1 bump (D8), so it isn't specific to one Open MCT version.

## D5: Open MCT starts in its standard (non-headless) mode, with a router redirect

The first fix attempt used `openmct.startHeadless()` plus manually calling the registered view provider's `show()` — skipping Open MCT's own tree/browse-bar/inspector chrome, to match the "two panels only, no GIS-admin chrome" design intent from the [original prompt](https://github.com/dwg7/sas0/pull/1). That path hit unrelated internal Open MCT errors and never rendered anything.

The app's bootstrap (at the time, `docs/app.js`; today the same call lives in `docs/core.js`'s `start()`, D10) uses the standard, supported path instead:

```js
openmct.start(document.getElementById('app'));
openmct.on('start', () => {
  openmct.router.setPath(`/browse/${NAMESPACE}:${CONSOLE_IDENTIFIER.key}`);
});
```

(Shown as originally written — D8 later switched the first line to the selector-string form, and D10 replaced the single hardcoded `CONSOLE_IDENTIFIER` with the tree's actual root path. The underlying decision this entry documents — standard `start()`, not headless — still stands unchanged.)

This means Open MCT's own browse bar, left-hand tree, and inspector panel are visible around the instrument views — a real deviation from the original "calm two-panel mission console, not GIS/admin dashboard" brief. That deviation turned out to be the right call anyway: D10 embraces this tree/chrome as the actual navigation mechanism, once the console grew past two fixed instruments.

## D6: The weather chart is live JMA data, fetched client-side, not a static placeholder

The placeholder URL shipped in PR #1 (`.../thumb/6/6f/Synoptic_weather_map.png/1280px-Synoptic_weather_map.png`) 404'd; it was briefly replaced with a working but still-static Wikimedia Commons file, then replaced again with the Japan Meteorological Agency's actual surface weather chart (天気図) — matching the "designed for future daily integration" intent from the original v0 scope instead of deferring it.

JMA does not publish a stable `latest.png`. `https://www.jma.go.jp/bosai/weather_map/data/list.json` is a JSON index of currently-available chart filenames (refreshed every few hours, oldest-first); the actual chart image lives at `https://www.jma.go.jp/bosai/weather_map/data/png/<filename>`. Both endpoints send `Access-Control-Allow-Origin: *`, so `docs/instruments/weather.js`'s `render()` can `fetch()` the list client-side and set `<img src>` to `imageBaseUrl + timeline[timeline.length - 1]` (the last, i.e. most recent, entry in `near.now`) — no backend, no build step, no hardcoded filename to go stale.

If that fetch fails (offline, JMA outage, CORS policy change) it fails silently to an empty `<img>` — no fallback image, since JMA is now the only intended source. `weather.imageBaseUrl`/`weather.listUrl` in `docs/config.js` still go through the same `getSafeUrl()` host-allowlist check as any other instrument source (D7).

**Attribution**: JMA content is licensed under Japan's "公共データ利用規約（第1.0版）" (Public Data License v1.0), which requires a specific citation format — `出典：気象庁ホームページ　（当該ページのURL）`. `weather.sourceLabel` in `docs/config.js` uses that exact template and is rendered as a link to `weather.sourceUrl`, deliberately in Japanese even though the rest of the UI is English, since it's a legal citation requirement, not UI copy. Don't reword it.

## D7: Instrument sources are constrained to an explicit host allowlist

`docs/core.js`'s `getSafeUrl()` (shared by every instrument) only assigns a source URL if its protocol is `https:` and its hostname is in `config.js`'s `allowedHosts` for that instrument — otherwise it silently falls back to `''` / `about:blank`. This was already in place from PR #1 and is worth preserving as new instruments are added: `config.js` should never be trusted to only ever contain safe values, since it's the one file most likely to get casually hand-edited later.

## D8: Open MCT is pinned to the current release candidate, and `start()` uses the selector form

Once the D1–D5 fixes were confirmed working end-to-end on `openmct@4.2.0` (the latest non-RC release at the time), the pin was bumped to `openmct@4.3.0-rc1` — the newest release on npm overall — and re-verified against the same checklist (D2), including a fresh check of D3's `SharedWorker` behavior and D4's harmless indexer error, both unchanged.

The bump surfaced one genuine API improvement worth adopting: `openmct.start()` on 4.3 accepts a CSS selector string, not just an `Element`, and defers its own bootstrap until `DOMContentLoaded` if called while the document is still loading. The bootstrap now calls `openmct.start('#app')` instead of `openmct.start(document.getElementById('app'))` — one less DOM lookup to keep in sync with `docs/index.html`'s markup, and it degrades to a clear thrown error (rather than a silent no-op) if `#app` is ever removed from `docs/index.html`.

Being on an RC means the next Open MCT release could change or remove that selector-string support before it's finalized — if a future version bump ever throws on `openmct.start('#app')`, that's the first thing to check.

## D9: The Spiccato iframe's sandbox includes `allow-same-origin`

Reported symptom: Spiccato's MapLibre GL JS map didn't render in Brave, and turning off Brave's "Block fingerprinting" Shields setting didn't fix it — ruling out the general WebGL-fingerprinting-protection explanation (Brave issue [#4400](https://github.com/brave/brave-browser/issues/4400) and friends).

The actual cause is specific to how this iframe is embedded: `dwg7.github.io/spiccato/` and `dwg7.github.io/sas0/` are the same origin in production (origin is scheme+host+port, not path), but `docs/config.js`'s `sandbox` value originally omitted `allow-same-origin`, which forces a sandboxed iframe into an opaque, unique origin regardless of where it's actually served from. Per Brave's own documented behavior, "if an iframe is first party to the top-level origin and the sandbox attribute is set, it will be blocked unless `sandbox="allow-same-origin"` is set" — Brave can't distinguish "deliberately extra-sandboxed same-site content" from "genuinely third-party content," and applies its stricter third-party WebGL/fingerprinting restrictions to the opaque-origin frame either way, independent of the page-level Shields toggle.

Fix: `spiccato.sandbox` in `docs/config.js` is now `'allow-scripts allow-forms allow-same-origin'`, and `getSafeSandbox()`'s token allowlist in `docs/core.js` was extended to permit `allow-same-origin`. This is safe specifically *because* Spiccato is same-origin with sas0 in production — `allow-same-origin` would be a real isolation reduction for a genuinely third-party embed, but grants nothing here that the browser's own same-origin policy wasn't already going to allow.

**Confirmed fixed** in an actual Brave browser after deploying — vector tiles render correctly. The fingerprinting-protection explanation (Brave issue [#4400](https://github.com/brave/brave-browser/issues/4400)) was a red herring for this particular report; the sandbox/`allow-same-origin` interaction was the real cause.

## D10: Instruments are a tree (folders + composition), not a fixed layout

The original v0 brief called for exactly two instruments side by side. In practice, for a daily-use disaster-preparedness console (the Hokkaido regional survey department use case this was designed around), a fixed two-panel grid doesn't scale past two things, and doesn't match how the intended user described actually wanting to use it: click one thing in a list, look at it full-screen, click the next thing. That's exactly what Open MCT's own browse tree already does — see the ["What is sas0?"](README.md#what-is-sas0) tree diagram for the current shape.

`docs/core.js` now exposes two registration functions instead of one hardcoded view:

```js
SAS0.registerFolder({ key, name, parentKey })       // a tree node with children
SAS0.registerInstrument({ key, name, parentKey, render, autoRefresh })  // a leaf, full-screen view
```

Internally these just populate two `Map`s (`objectsByKey`, `childrenByKey`) that a single `openmct.objects.addProvider` / `openmct.composition.addProvider` pair reads from — the same pattern as NASA's own [`openmct-tutorial`](https://github.com/nasa/openmct-tutorial) (`dictionary-plugin.js`'s `compositionProvider`). Adding a new instrument or organization means adding one more `registerFolder`/`registerInstrument` call, not touching the provider wiring.

**`autoRefresh` matters**: `registerInstrument` re-invokes `render()` on a shared timer (currently 12 minutes, see D11) by default. This is right for data-driven instruments (weather image, warnings, quake, volcano) but wrong for anything the user is actively interacting with — an iframe'd map (Spiccato, the GSI hazard portal) must **not** be torn down and rebuilt every 12 minutes, since that would reset pan/zoom/layer state mid-use. Those two set `autoRefresh: false` and render exactly once per visit. Any future iframe-based instrument should do the same.

`docs/app.js` is retired; its logic is split across `docs/core.js` (bootstrap + shared helpers, `getSafeUrl`/`getSafeSandbox`/`renderIframe`/`renderLinkCard`), `docs/folders.js` (organization folders), and one file per instrument under `docs/instruments/`. Script load order in `docs/index.html` matters: `core.js` first (defines `window.SAS0`), then `config.js`, then `folders.js`, then every `instruments/*.js` (each registers itself — order among these doesn't matter), then `boot.js` last (calls `SAS0.start()`, which is what actually calls `openmct.start()` — this must happen only after every instrument has registered, or the tree would be missing whatever hadn't loaded yet).

## D11: Hokkaido disaster-info instruments and their data sources

Three new instruments under the 気象庁 folder, added for a daily disaster-preparedness use case (heavy rain/flash-flood, earthquake, volcano — see [HANDOVER.md](HANDOVER.md) for the fuller consulting context). All verified live and CORS-open (`Access-Control-Allow-Origin: *`) before use, same discipline as D6.

- **警報・注意報（北海道）** (`docs/instruments/warnings.js`): Hokkaido has no single JMA office code — it's 8 forecast regions under center code `010100`. Each region's current advisories/warnings live at `https://www.jma.go.jp/bosai/warning/data/r8/{officeCode}.json`; the office-code list and the `kind.code` → Japanese-name table (35 entries, sourced from JMA's own [warning_kind.html](https://www.jma.go.jp/jma/kishou/know/bosai/warning_kind.html) plus community documentation) are hardcoded in the instrument file. Only `class10Items` (region-level) are used, not `class20Items` (municipality-level) — deliberately coarser, to match "macro trend at a glance" rather than a full drill-down. Entries with status `解除` (rescinded) are dropped rather than shown, so the view only ever shows what's *currently* in effect.
- **地震情報（北海道関連）** (`docs/instruments/quake.js`): `https://www.jma.go.jp/bosai/quake/data/list.json` is nationwide, most-recent-first. Filtered to entries whose epicenter name contains "北海道" *or* whose affected-area JIS city codes start with `01` (Hokkaido's prefecture-level JIS X 0402 code) — this also catches quakes centered elsewhere that were still felt in Hokkaido.
- **火山情報（北海道の火山）** (`docs/instruments/volcano.js`): `volcano_list.json` (all ~120 monitored volcanoes nationwide) filtered to codes `101`–`120` (Hokkaido mainland only, confirmed scope — the Kuril/Chishima chain, codes `151`+, is deliberately excluded). Cross-referenced against `warning.json`, which only lists volcanoes currently *above* baseline alert level; anything not in that list is rendered as `平常` (normal).

All three, plus the weather chart, share the same 12-minute auto-refresh (D10) rather than a per-instrument interval — deliberately simple over disaster-type-tuned, per the same "confirmed" tradeoff recorded in [HANDOVER.md](HANDOVER.md).

## D12: GSI's hazard map portal is embedded, but its cross-origin rendering is unconfirmed

`docs/instruments/gsi-hazard.js` embeds `https://disaportal.gsi.go.jp/maps/` (GSI's own "重ねるハザードマップ" hazard-overlay portal) via `SAS0.renderIframe`, `sandbox="allow-scripts allow-forms"` — deliberately **without** `allow-same-origin`, unlike Spiccato (D9): this site is genuinely third-party (not `dwg7.github.io`), so granting it would be a real isolation reduction, not a no-op.

In this repo's own test tooling, the embedded map area rendered gray/blank while the page chrome (header, search box) loaded fine — the same symptom Spiccato showed here before its production deployment turned out to render correctly (see D9's history). No blocking `X-Frame-Options`/CSP was found on the page, in headers or as a meta tag, and the site renders a full interactive map when loaded standalone (non-framed). This is left as **unconfirmed on the actual production deployment** — check `https://dwg7.github.io/sas0/` directly (ハザードマップポータル under 国土地理院) before trusting this instrument works for end users.

## D13: Mappable data stays on one map; the tree is for what isn't mappable

Working principle for future instruments (recorded from a design conversation, not yet fully realized in code): sas0's tree-of-instruments approach (D10) is for information that doesn't naturally overlay on a map — warnings lists, earthquake logs, volcano status tables. Anything that *can* be represented as a map layer (hazard extents, observation points, imagery) should instead be composited onto a single shared map, in the classic GIS "overlay everything" style, rather than fragmented into separate non-map instruments.

Spiccato currently fills that "the mappable stuff goes here" role, but it was only ever a placeholder to confirm MapLibre GL JS itself works end-to-end in this iframe-embedded, CDN-loaded, Brave-compatible setup (D9) — its current content (a blank-map / administrative-boundary style from `layers-martin`) doesn't yet reflect this dashboard's actual use case. A dedicated MapLibre GL JS site built for sas0's own map layer needs, potentially drawing on the tile catalog at <https://stars.optgeo.org/?tab=tiles>, is a plausible next step; Spiccato stays in the meantime because "some map, embedded" is still more useful than no map at all.

## D14: GSI's hazard map portal is a link card, not an iframe — `sandbox` alone breaks it

Following on D12: the GSI hazard map portal (`https://disaportal.gsi.go.jp/maps/`) was tested embedded, in this repo's own tooling *and* on the live production deployment — both showed the same result, so this isn't another case of D9's "works in production, not in test tooling" pattern. It's a genuine incompatibility.

Isolated by testing the *individual* iframe attributes sas0 normally sets (`sandbox`, `loading="lazy"`, `referrerpolicy="no-referrer"`) one at a time: `sandbox="allow-scripts allow-forms"` **alone** — with no other restriction — is sufficient to break it; `loading="lazy"` and `referrerpolicy="no-referrer"` are both fine on their own. The site is an older jQuery + Leaflet 1.9.3 application (`jquery.cookie.js` is loaded directly), and sandboxing forces it into an opaque, unique origin (same underlying mechanism as D9) — its cookie/storage-dependent init appears to fail silently, leaving the map canvas gray forever with the surrounding page chrome still rendering fine.

Unlike D9's Spiccato case, granting `allow-same-origin` here would be a real isolation reduction: `disaportal.gsi.go.jp` is genuinely third-party, not `dwg7.github.io`. Asked directly, the call was to keep the sandbox principle intact and give up the iframe embed rather than carve out another exception — `docs/instruments/gsi-hazard.js` now renders a `SAS0.renderLinkCard()` (same pattern as D-original 北海道) instead of `SAS0.renderIframe()`. If a future instrument hits this same wall, that's the fork to weigh again: isolation vs. embedding, decided per-source, not by relaxing the default.

## D15: Municipality and volcano instruments are scoped to what's actually organized, not everything that exists

Two new instrument groups, both deliberately narrow rather than exhaustive:

- **市町村 (municipalities)**: Hokkaido has 179 municipalities — far too many for a flat list under one folder. `docs/folders.js` groups them by 振興局 (subprefecture, Hokkaido's own 14-way regional division), and a subprefecture folder is only created once it actually has a municipality registered under it (same "don't create empty folders" discipline as the original 開発局/札幌市 decision in HANDOVER.md). Initially only 札幌市 (石狩振興局) and 釧路市 (釧路総合振興局) were populated; D18 extended this to one representative city/town per subprefecture (14 of 179 municipalities, all 14 subprefectures represented). `docs/instruments/municipalities.js` reads `config.municipalities` (an array of `{folderKey, key, title, description, url}`) and registers one link-card instrument per entry, so adding the next municipality is one array entry, not new code.
- **火山 (volcano councils)**: a *different* grouping from the existing 火山情報（北海道の火山） status list (D11) — that one shows current alert level for all ~20 monitored Hokkaido-mainland volcanoes; this one is specifically about each volcano's 火山防災協議会 (disaster prevention council) and its evacuation planning, and is scoped to the **9 volcanoes that actually have one established**: アトサヌプリ, 雌阿寒岳, 大雪山, 十勝岳, 樽前山, 倶多楽, 有珠山, 北海道駒ヶ岳, 恵山 (Hokkaido's 常時観測火山, "constantly monitored" volcanoes — council establishment tracks this designation, not the full monitored-volcano list). Originally each linked to JMA's own summary page for that volcano's council; D18 replaced all nine with links to each council's (or its secretariat municipality's) own published evacuation-plan material.

Both use `docs/instruments/*.js` files that loop over a `config.js` array and call `SAS0.registerInstrument()` once per entry — the same registry primitives as every other instrument (D10), just driven by a list instead of one call per file.

## D18: Municipality coverage extended to all 14 subprefectures; volcano council links point to each council's own material, not JMA's summary

Two follow-ups to D15, both resolving items tracked in HANDOVER.md's "Known open items":

- **市町村**: added one representative city/town per remaining 振興局 — 函館市 (渡島), 江差町 (檜山), 倶知安町 (後志), 岩見沢市 (空知), 旭川市 (上川), 留萌市 (留萌), 稚内市 (宗谷), 北見市 (オホーツク), 室蘭市 (胆振), 浦河町 (日高), 帯広市 (十勝), 根室市 (根室) — bringing coverage from 2 to 14 of Hokkaido's 179 municipalities, with every subprefecture now represented at least once. Each URL was verified to resolve (`curl -sIL`, all HTTP 200) on the municipality's own official domain before being added, per CLAUDE.md's URL-verification discipline. Two entries fall back to a general 防災 (disaster-prevention) page rather than a single hazard-map portal, because the city doesn't publish one: 倶知安町 (flood/landslide/volcano info is scattered across separate pages) and 旭川市 (flood and landslide maps live on separate index pages — its comprehensive "これ一冊まとまっぷ" guide page was used instead as the closer match to the single-portal style of the other entries). Scaling past these 14 (toward the remaining ~165 municipalities) is still open — see HANDOVER.md.
- **火山**: replaced all nine JMA council-summary links (D15's original choice) with links to each council's own — or its secretariat/member municipality's own — published evacuation-plan material, closing HANDOVER.md open item #4. All nine were found to have some form of own material publicly available (no JMA fallback was needed), verified live (`curl -sIL`, all HTTP 200):
  - 大雪山 and 十勝岳: no dedicated council portal page exists for either; the best available public document is a direct PDF, authored in the council's name — hosted by 北海道 prefecture for 大雪山, and by the council secretariat municipality (上富良野町) for 十勝岳.
  - 恵山: the volcano's former dedicated council was folded into 函館市防災会議 following municipal mergers — there's no longer an independently-run council site, so the link points to 函館市's own hub page for 恵山 volcanic-disaster measures (which includes the evacuation plan), documented as such rather than presented as an active standalone council.
  - The other six (アトサヌプリ, 雌阿寒岳, 樽前山, 倶多楽, 有珠山, 北海道駒ヶ岳) each link to a proper council or member-municipality page for that volcano's own evacuation plan / hazard map / council portal.

## D19: Four new sources from [issue #2](https://github.com/dwg7/sas0/issues/2) — two new organization folders, a live disaster portal on top of two existing folders, and `renderLinkCard`'s first `http:`-only exception

[Issue #2](https://github.com/dwg7/sas0/issues/2) asked for three specific sources to be reviewed and incorporated "with attention to the information hierarchy" (情報組織の階層性), plus a separate request for NIED's realtime seismic monitor. Each was checked against sas0's existing framing rules (D7 host/protocol allowlisting, D9/D12/D14's iframe-vs-link-card call, D13's mappable/non-mappable split) before deciding where and how it attaches to the tree — not added as a flat list.

- **強震モニタ** (`http://www.kmoni.bosai.go.jp/`), from 国立研究開発法人防災科学技術研究所 (NIED) — a live, nationwide observed-seismic-intensity map. This is genuinely mappable telemetry (D13), but Spiccato isn't yet a general layer host (D13's own open item) and this is a third-party app UI, not raw tile/data we can composite — so, consistent with every other "can't embed" source in this repo (北海道, GSI hazard portal), it's a link card. New wrinkle: `curl -v` against port 443 times out — this domain has **no HTTPS endpoint at all**, not just a missing redirect. `renderLinkCard`'s `getSafeUrl` call was hardcoded to `allowedProtocols: ['https:']` (D7), which would silently disable this one link. `renderLinkCard` now accepts an optional `allowedProtocols` override (`docs/core.js`); only `docs/instruments/kmoni.js` uses it, passing `['http:']` explicitly and only for this instrument — the default for every other link card is untouched. NIED doesn't have an existing folder in this tree, so a new one was added: `防災科学技術研究所`, parallel to 気象庁/国土地理院 (D10's "one folder per publishing organization").
- **北海道防災ポータル** (`https://www.bousai-hokkaido.jp/`), from 北海道総務部危機対策課 — a live, map-based dashboard covering evacuation orders, shelters, rainfall, river levels, landslide risk, and volcano status for all 179 Hokkaido municipalities at once. This is a materially richer, disaster-specific view than the existing 北海道 folder's single link card (`hokkaidoLink`, which just points at the prefecture's generic homepage) — added as a second instrument under the same `hokkaido` folder rather than replacing the first, since the two serve different purposes (general prefecture site vs. dedicated live disaster board). Sends `X-Frame-Options: SAMEORIGIN`, so it's a link card, same reasoning as D14. The URL includes the map's `l=`/`ll=`/`z=` query parameters as given in issue #2 (layer selection + Hokkaido-wide initial view) — `getSafeUrl` preserves query strings, so this "opens already zoomed to Hokkaido with the right layers on" rather than the portal's bare default.
- **さっぽろ防災ポータル** (`https://bousai.city.sapporo.jp/`), from 札幌市 — the same kind of live per-ward disaster dashboard (evacuation status, rainfall, river levels, landslide risk by 区), but for Sapporo specifically. This is a municipality-level source, so it attaches where 札幌市 already lives — a second entry in `config.municipalities` under `shien-ishikari`, alongside (not replacing) the existing static hazard-map link card, following the same `folderKey`/`key`/`title`/`description`/`url` shape as every other municipality entry (D15). Also `X-Frame-Options: SAMEORIGIN` → link card. Query parameters (layer selection + Sapporo city-center view) preserved from issue #2, same reasoning as the prefecture portal above.
- **北海道 旅の安全情報** (`https://hokkaido-safe-travel.mlit.go.jp/`), from 北海道運輸局 (Hokkaido District Transport Bureau, a regional office of MLIT/国土交通省) — a multilingual portal aggregating live transport-disruption and weather status (flights, ferries, rail, bus, roads) for travelers in Hokkaido. A distinct publishing organization not otherwise represented in the tree, so it gets its own new top-level folder, `北海道運輸局`, parallel to the other organization folders (D10). No blocking frame headers were found, but given the site sets session cookies (`XSRF-TOKEN`, `safety_travel_session`) suggesting server-side state the sandboxed-iframe pattern has broken before (D14), it's a link card rather than a first iframe experiment for this source.

All four URLs were verified live (`curl -sI`/`curl -sIL`, `curl -v` for the kmoni HTTPS check) before being added, per CLAUDE.md's URL-verification discipline (D2's checklist, applied here to non-CDN sources).

## D16: Why Open MCT

Not a constraint to work around, but a deliberate choice worth stating: Open MCT is NASA's own mission-control framework, built for and proven in genuinely high-stakes operations (spacecraft and ground-system monitoring, where a confusing or unreliable display has real consequences) — not a toy or a generic admin-dashboard template. Its core abstraction (D10: Object API + Composition API + View API, decoupling *what data is* from *how it's organized* from *how it's shown*) is exactly the right shape for "many heterogeneous sources, one operator, switch between them at a glance," whether that operator is monitoring a spacecraft or a regional government's disaster status board.

Using it here is also a small demonstration of something DWG7 cares about directly: that the same open-source engine NASA built for an elite, high-stakes mission works, unmodified at its core, for grassroots civilian public-safety awareness — the object/composition/view model doesn't care whether the "telemetry" is a spacecraft's battery temperature or a JMA warning feed. That's a concrete instance of "keep web maps open for a better world," not just a slogan: adopting and crediting NASA's own open engine, rather than reinventing a bespoke one, is itself an act of interoperability.

## D17: Open data only — and why that's a feature, not a gap

sas0 deliberately aggregates only data that is already, genuinely publicly accessible — JMA's public JSON feeds, GSI's public hazard map portal, municipalities' own published hazard map pages. It does not integrate, and is not the place to integrate, any organization's internal, restricted, or otherwise protected situational information, even if a future user of this codebase has access to such data and is tempted to add it.

This is a deliberate boundary, not a limitation to eventually remove, for two reasons:

1. **Respect for protected information and the missions that handle it.** This project takes no position on, and makes no claim to, the internal operational systems that actual disaster response depends on — see README's "What is not sas0?" (not an EOC, not command-and-control software). Blurring that line, even with good intentions, would misrepresent both what sas0 is and the seriousness of the systems it deliberately doesn't touch.
2. **The open-only scope is itself the useful output.** Proving that a click-through, Open MCT-based instrument architecture (D10) can be built entirely from public data, with no backend and no build step (D1), is a piece of technology validation in its own right. If an organization later needs an *internal* service that integrates its own non-public situational data, the architecture proven here — not sas0 itself, and not its data — is the reusable part. That hypothetical internal service would be a separate, appropriately access-controlled system; sas0's job is to make sure the underlying pattern is already known to work.

This follows directly from DWG7's own stated mission ("keep web maps open for a better world") and its practice of testing new technology in the open (D16) — the contribution here is to access and interoperability in the open-data space, made in a way that doesn't presume to speak for, or reach into, the protected space.

## D20: Occasional-vs-daily link redesign — `renderLinkList` replaces `renderLinkCard`, 市町村/火山 flatten to root, and why the obvious CORS win isn't available

By the time D19 landed, 27 of sas0's instruments were link cards (`renderLinkCard`, `.sas0-link-card`: a single ~480px-wide centered box, one per instrument) reached through multi-level folder navigation — 市町村's 15 links sat behind 14 subprefecture folders, 火山's 9 behind one folder. Feedback: too much of the dashboard is this pattern, and it costs more clicks/space than the content is worth for information that's only ever consulted when researching one specific place or event, not read on a routine basis.

The fix was framed as two categories, and applied by actually re-examining every link-based instrument against them rather than assuming the split up front:

**1. Occasional-reference links** (a specific municipality's hazard map, a specific volcano's evacuation plan, GSI's portal, kmoni, MLIT's travel-safety site) — these stay links, but in a denser format. New `SAS0.renderLinkList(container, { groups })` (`docs/core.js`) replaces `renderLinkCard` everywhere: each item renders as one compact row (title + one-line description + a small "開く ↗" text link), optionally grouped under a heading, in a bordered box styled like the existing `.sas0-quake-list`/`.sas0-volcano-list` pattern rather than a centered hero card. `renderLinkCard` was deleted outright (not deprecated in place) once every call site migrated — CLAUDE.md's "don't keep unused back-compat code" applies here too.

   One CSS trap surfaced building this: `.sas0-link-list` has `overflow: hidden` (to clip child rows to its `border-radius`), and `.sas0-instrument` (its ancestor) is a flex column with `overflow: auto`. A flex item's `min-height: auto` resolves to its content size *only* when the item's own `overflow` is `visible`; with `overflow: hidden` it resolves to `0`, so once total instrument content exceeded the viewport, `.sas0-link-list` got flex-shrunk to ~2px instead of the parent scrolling as intended — the rows were present in the DOM (confirmed via `getBoundingClientRect`) but invisible. Fixed with an explicit `flex-shrink: 0` on `.sas0-link-list`. Worth remembering for any future flex-child element that also needs `overflow` for its own reasons (rounded corners, truncation, etc.).

   市町村 and 火山 don't actually fit D10's "one folder per organization" model — every municipality and every volcano council is its own distinct organization, so the folder was never grouping an organization's outputs, just adding navigation depth. Both were flattened: `docs/folders.js` no longer registers `municipalities`/`shien-*` (14 of them) or `volcano-councils` as folders; `docs/instruments/municipalities.js` and `volcano-councils.js` now each register a single instrument directly under `root` (`市町村`, `火山`) whose `render()` groups the existing `config.js` arrays into one scrollable `renderLinkList` (市町村 groups by subprefecture heading — the display-name table moved from `folders.js` into `municipalities.js` itself, and `config.municipalities`' `folderKey` field was renamed `regionKey` since it no longer names an Open MCT folder; 火山 is one ungrouped list of 9). This both shrinks each row *and* removes 2 clicks of navigation (市町村: 4 clicks → 2; 火山: 3 → 2) — scales better too, since adding municipality #15 is one more array row rather than a new subprefecture folder plus a new leaf.

   Folders that genuinely represent one publishing organization (北海道, 国土地理院, 防災科学技術研究所, 北海道運輸局, and the new 国土交通省 below) were kept as folders, on the theory that org identity still matters for attribution and leaves room for a future digested instrument to join a link instrument under the same org — but 北海道's two links (`hokkaidoLink` + `hokkaidoBousaiPortal`) were merged from two leaves into one `renderLinkList` instrument (`docs/instruments/hokkaido.js`, replacing the deleted `hokkaido-link.js`/`hokkaido-portal.js`), since they're both occasional-reference links to the same org and gain nothing from being separate tree nodes.

**2. Daily-monitoring candidates** — data that would ideally be digested into a real read-in-place instrument, the way `warnings.js`/`quake.js`/`volcano.js` already do for JMA data (D11). The two portals added in D19 (北海道防災ポータル, さっぽろ防災ポータル) were re-examined as the obvious candidates, since both show live evacuation/rainfall/river-level/landslide-risk data. Their Network tabs were inspected directly (both run the same "IDIS" municipal-portal platform) and expose plain JSON — `bousai-hokkaido.jp/data/top/topdata.json`, `.../data/evacorder/evacorder.json`, `bousai.city.sapporo.jp/data/evacorder/evacorder.json`, `.../data/river/data.json`, etc. — but **none of it carries an `Access-Control-Allow-Origin` header** (`curl -sI -H "Origin: https://dwg7.github.io" <url>`, checked directly). Without CORS, a static, backend-less site (D1/D17 — non-negotiable) cannot read these responses via client-side `fetch()`, no matter how public/unauthenticated the data is. The same check against MLIT's `river.go.jp` ("川の防災情報," a new source added below) found the identical gap on its `kawabou/file/files/rw/lvl/.../rwLv.json` water-level feed.

   This makes JMA's `bosai.*` endpoints (D6/D11), which do send `Access-Control-Allow-Origin: *`, the *only* confirmed CORS-open source so far — not a coincidence to route around, but a real constraint on what "digest it into a calm instrument" can mean for a project that has ruled out a backend on principle. Checking `docs/instruments/warnings.js`'s warning-kind table also showed that 洪水警報/注意報 (codes `04`/`18`) and 土砂災害警報/注意報 (`09`/`29`/`39`/`49`) are already included — so the region-level version of "is there a flood/landslide warning right now" that 北海道防災ポータル would otherwise add is already covered, just at JMA's coarser 8-region granularity rather than per-municipality. What genuinely isn't covered anywhere in sas0 — precise river-level numbers, evacuation orders/open-shelter lists — stays inaccessible without either a CORS change on the source's end or a backend on sas0's end, and both are outside this project's control/scope respectively. Recorded here rather than silently dropped, so a future maintainer doesn't have to rediscover the same dead end: if any of these sources ever adds `Access-Control-Allow-Origin`, digesting it into a real instrument (parallel to `warnings.js`) becomes straightforward and would be a genuine upgrade.

**New source added under category 1**: 国土交通省 (MLIT proper, distinct from the regional 北海道運輸局 added in D19) — 川の防災情報 (`https://www.river.go.jp/`), linked as `docs/instruments/river-info.js` under a new `mlit` folder. Chosen specifically because it's the direct source for the one gap identified above (precise river water levels) that sas0 can't digest itself. Its homepage `curl -I`s to a bot-filtered `403` (verified via real browser navigation instead — `200`, and its `kawabou/...` JSON assets also curl clean with a browser-like `User-Agent`) — noted here so a future URL re-check doesn't mistake that for the page being down.

## D21: 北海道開発局 gets its own folder, and one curated portal link, not its individual sub-systems

HANDOVER.md's open item #2 since D19: 北海道開発局 (the MLIT regional bureau managing Hokkaido's national roads, rivers, and ports) didn't have a folder yet, blocked only on finding the right page to link — its homepage doesn't send blocking framing headers, but which specific page is disaster-relevant wasn't identified.

Its own `防災・災害情報` page (`https://www.hkd.mlit.go.jp/ky/saigai/ud49g7000000o5ac.html`) links out to several of the bureau's own systems: `北海道開発局　河川リアルタイム情報` (river/dam levels + CCTV, a *different* system from D20's `river.go.jp`, run by this bureau specifically for the rivers/dams it manages), a road-closure system, and — most usefully — its own `北海道開発局防災情報ポータルサイト` (`https://www.hkd.mlit.go.jp/ky/saigai/splaat0000001sq7.html`), a curated link collection covering 河川/土砂災害/道路/港湾/漁港/交通/気象/地震津波/火山/関係機関/開発建設部の災害情報 all on one page. That portal page was linked rather than the narrower river-realtime system, for the same reason 北海道運輸局's own portal was chosen over any one of the individual transit-status feeds it aggregates (D19): a new single-item organization folder should point at that organization's *best entry point*, not force a choice among several of its sub-systems. New folder `kaihatsukyoku` (`北海道開発局`), one instrument (`docs/instruments/hokkaido-development-bureau.js`), same `renderLinkList` single-row pattern as every other single-link org folder (D20).

This is a third distinct MLIT-family folder in the tree now (北海道運輸局 — D19, 国土交通省/river.go.jp — D20, 北海道開発局 — this entry) — worth remembering they're genuinely different organizations (regional transport bureau / the ministry's own national system / regional development bureau) with different remits, not three names for the same thing.

## D22: A manual `scripts/check-links.sh`, not a CI link-checker, for detecting stale outbound links

As the number of outbound links has grown (~40 across `config.js` and the instrument files, after D18–D21), so has the chance that one of them goes stale — a government site restructures its URLs, a page gets moved or removed, a PDF gets renamed. Worth a deliberate answer for how staleness gets *noticed*, not just verified once at add-time (which is all D2/D6/D18–D21's `curl -sI` discipline has done so far).

**What "stale" can mean, and what's actually detectable**: a dead domain, an HTTP error (404/410), a redirect to an unrelated page, or — hardest — a page that still 200s but its content silently changed (hazard map removed, replaced with something else). Only the first two are checkable without literally reading the page.

**Client-side detection was considered and rejected as the primary mechanism.** A `fetch(url, { mode: 'no-cors' })` from the browser at render time is the only option that fits sas0's no-backend constraint (D1/D17) without any new infrastructure, but it's a weak signal: cross-origin `no-cors` responses are opaque — the script can observe that the promise *rejected* (DNS failure, connection refused, timeout) but never the actual HTTP status, so a 404 (the most common real-world staleness — a page moved, not a domain that vanished) is indistinguishable from a healthy 200. It would also add a network request per link on every page visit for a marginal, mostly-false-negative signal. Not worth it as the primary mechanism; not implemented.

**What was built instead**: `scripts/check-links.sh` — a dependency-free bash script (grep + curl, no `package.json`, no build step) that extracts every `https?://` URL referenced in `docs/config.js` and `docs/instruments/*.js`, requests each with a browser-like `User-Agent` (river.go.jp's bot-filtering — D20 — means a bare `curl` UA gives false FAILs), and reports non-2xx/3xx as `FAIL`. This is explicitly a **manual maintenance tool**, run by hand (or by an AI assistant picking the repo back up), never wired into any automated pipeline — sas0 deliberately has no CI (CLAUDE.md), and this doesn't change that. It's the same category of tool as the `python3 -m http.server` local-preview command already documented in CLAUDE.md: a helper for whoever is working on the repo, not part of what ships.

Running it against the full current link set found 38/40 clean and exactly 2 expected false positives, both structural rather than real: `warnings.js`'s JMA endpoint template (`.../r8/${code}.json`) and `weather.js`'s `imageBaseUrl` are both base-URL prefixes meant for runtime string concatenation, not standalone fetchable pages — they'll always show `FAIL` here and that's correct to ignore, not a bug to chase. The regex also has to explicitly stop at Japanese closing punctuation (`）`, `、`, `。`, `」`) in addition to the obvious quote/space characters, because D6's citation-format comments embed URLs as `（https://...）` — without that, the trailing `）` gets swallowed into the "URL" and every citation link false-fails.

**Left open, not decided here**: whether to go further and add a *scheduled* GitHub Actions workflow (e.g. a weekly cron running this same check and filing an Issue on failure) for detection that doesn't depend on a human remembering to run it. That would be automatic in a way the script alone isn't, but it would also be the first CI this repo has ever had, in direct tension with CLAUDE.md's explicit "no CI" framing of what sas0 *is* — whether "no CI" was meant to rule out a deploy/build pipeline specifically (which this wouldn't touch — Pages still serves `docs/` unbuilt either way) or automation of any kind in the repo is a real scope question for whoever maintains sas0 next, not something to resolve unilaterally by adding it. `scripts/check-links.sh` works standalone either way — it's the dependency a future Actions workflow would call, if that line ever gets crossed deliberately.

## D23: 市町村 extended from 14 to 22 — depth within subprefectures, not just breadth, and a live example of why D22 exists

D18 brought every one of Hokkaido's 14 振興局 up to one municipality each; this round adds a second (or third) city to 6 of those subprefectures — 苫小牧市 and 伊達市 (胆振, alongside 室蘭市), 小樽市 (後志, alongside 倶知安町), 千歳市 and 江別市 (石狩, alongside 札幌市/さっぽろ防災ポータル), 網走市 (オホーツク, alongside 北見市), 名寄市 (上川, alongside 旭川市), and 滝川市 (空知, alongside 岩見沢市) — prioritized by population, since a disaster-preparedness tool should cover where people actually are before covering every remaining town. 14 → 22 of 179. All eight verified live (`curl -sIL` with a browser `User-Agent`) before being added, same discipline as D18/D19.

Two follow the now-familiar "no single hazard-map portal" fallback pattern from D18 (倶知安町, 旭川市): **千歳市** and **伊達市** each have their hazard maps split across separate pages (flood/landslide in one place, the relevant volcano's map — 樽前山 for 千歳市, 有珠山 for 伊達市 — elsewhere), so both link to a broader disaster-information page that connects to all of them, not a narrower single-topic page that would miss the volcano map.

**名寄市** doesn't serve its hazard-map page over HTTPS at all — not a missing redirect, but a TLS/SNI mismatch (`curl -v` shows the handshake failing with "unrecognized name"), the same practical effect as kmoni's complete absence of HTTPS (D19) even though the underlying cause is different. `renderLinkList`'s per-item `allowedProtocols` override (D19, generalized in D20's `renderLinkList`) already supported exactly this case with no code change — 名寄市's `config.js` entry just sets `allowedProtocols: ['http:']`, same narrow one-item exception pattern as kmoni.

**網走市** is worth recording on its own: the URL that search results turn up for its hazard map (`.../005emergency/saigai/hazardmap/index.html`) turned out to already be stale — it meta-refreshes to a `www2.city.abashiri.hokkaido.jp` subdomain that no longer resolves at all. The correct current page was found by navigating the live site's own 防災 menu rather than trusting the search result. This isn't a link sas0 ever published — no entry for it existed before this batch — but it's a concrete, found-in-the-wild example of exactly what D22's `scripts/check-links.sh` exists to catch *after* a link is added: government sites restructure without leaving a working redirect often enough that periodic re-verification (not just verification at add-time) has real value, not just theoretical value.

## D24: Batch process for municipality coverage — 22 → 30, repeatable in ~8-city increments rather than all at once

Following D23, the intent going forward is to keep extending 市町村 toward all 179 municipalities, but deliberately in repeated batches of roughly 8 rather than one large push — each batch gets its own research pass, independent verification, browser walkthrough, and a DECISIONS.md entry recording whatever that batch's cities turned up, rather than bulk-adding many entries with no record of the individual judgment calls behind them. This entry documents batch 3 (the pattern the same shape as every future batch is expected to follow) and the two things it surfaced worth carrying forward.

Batch 3 added a second (or third) municipality to six subprefectures that were thin (one or two entries), again by population within each: 音更町 (十勝, alongside 帯広市 — a town, not a city, but larger than several of the 市 already in the tree), 北斗市 (渡島, alongside 函館市), 恵庭市 (石狩), 富良野市 (上川, another "no single hazard-map page" fallback case — see D18/D23's pattern, its 防災計画・ハザードマップ等 category page was used instead), 紋別市 (オホーツク), 中標津町 (根室), 新ひだか町 (日高), and 深川市 (空知). 22 → 30 of 179. All eight independently re-verified (`curl -sIL` with a browser `User-Agent`, plus a spot-check of 音更町's actual page content against its claimed description) before being added — not just trusting the research pass's own verification, the same double-check discipline as every batch so far.

**深川市 repeated the 網走市 pattern from D23**: the URL surfacing at the top of search results (`.../uo2pli000000cjuz.html`, a page literally titled 深川市ハザードマップ) now 301-redirects to a generic department-listing page with no hazard-map content — already stale by the time this batch was researched. The actual current content lives at a different URL (`.../uo2pli000000ck2a.html`), found by tracing the site's own navigation rather than trusting the search hit. Two batches in a row hitting this same failure mode (a specific page URL rotting out from under a still-live domain, search engines still indexing the old one) is worth treating as a real, recurring pattern for Hokkaido municipal sites specifically — not a one-off. It reinforces D22's `scripts/check-links.sh` further: the same kind of drift that shows up *while researching new entries* will keep happening to entries already in `config.js` after they're added, which is exactly what that script exists to catch on a later pass.

**No new `allowedProtocols` exceptions needed this batch** (unlike 名寄市 in D23) — all eight municipalities had working HTTPS. Worth noting as a small process refinement: this batch's research explicitly asked for an HTTPS-specific check (not just "does *some* URL resolve") precisely because D23's 名寄市 case showed a municipality can look fine in a plain `curl -sIL` while still failing HTTPS specifically if the fallback isn't followed correctly — asking for that distinction up front, rather than discovering it during independent re-verification, is now part of the batch's standard research prompt going forward.

## D25: Batch 4 — every subprefecture now has at least 2 entries; two recurring failure modes confirmed, not one-offs

30 → 38 of 179. This batch closed the last gap from D18/D23/D24: the four subprefectures still sitting at exactly one entry (釧路総合振興局, 檜山振興局, 留萌振興局, 宗谷総合振興局) each got a second, population-priority pick — 釧路町 (alongside 釧路市), せたな町 (alongside 江差町), 羽幌町 (alongside 留萌市), 枝幸町 (alongside 稚内市) — bringing every one of Hokkaido's 14 subprefectures to 2+ municipalities for the first time. The remaining four slots went to the largest not-yet-covered municipalities regardless of region: 北広島市 and 登別市 (both comfortably larger than several 市 already in the tree), plus 幕別町 and 別海町. By this batch's research prompt, both the HTTPS-specific check and the "don't trust the search result, confirm via the site's own nav menu" instruction (added after D23/D24) were both applied *proactively* rather than caught on independent re-verification — the batch process is converging.

Two things D23/D24 each flagged as "maybe a pattern" now have a second occurrence each, upgrading them from "worth watching" to "expect this every batch":

- **HTTPS/SNI failures**: 釧路町's site fails the exact same way 名寄市's did (D23) — `curl -v` on port 443 gives `TLSV1_ALERT_UNRECOGNIZED_NAME`, not a missing HTTPS listener but a misconfigured one. Notably, `curl -v` resolves 釧路町's domain to the *same IP address* (`45.60.112.77`) as 名寄市's — strong evidence both towns' official sites sit behind the same hosting platform/CDN with a shared SNI misconfiguration, not two unrelated incidents. Worth actively checking for this specific failure on every future batch's municipalities, not just as a surprise when it happens — the `allowedProtocols: ['http:']` per-item override (D19) continues to need zero code changes to absorb it.
- **Stale search-result URLs**: none of this batch's 8 final URLs were stale, but that's *because* every one was cross-checked against the municipality's own site navigation before being finalized (per the sharpened research prompt) — three candidates (幕別町, 羽幌町, せたな町) were caught and corrected during that step rather than after. D23 (網走市) and D24 (深川市) each found one stale link per batch; this batch found (and fixed pre-emptively) three, suggesting the actual rate is closer to "expect several per batch" than "rare edge case" — the sharpened prompt is earning its keep, not just theoretically useful.

## D26: Polygons as a linking anchor — a `*_hkd.pmtiles` pair built for a future shared map, outside this repo

D13 left an open question: what should the eventual shared map (replacing Spiccato's placeholder content) actually show. The answer that emerged in conversation: administrative/forecast-region **polygons are not themselves the information** — they're a *依代* (an anchor/vessel), a way to let a point on a map resolve to an identity (a JMA forecast region, a municipality) that other already-digested sas0 data (警報・注意報, ハザードマップ links) can then be joined against. Concretely: warning severity could style a forecast-region polygon; clicking a municipality polygon could jump to its `config.js` hazard-map link. This entry records the first working step toward that — building the two source vector-tile layers — deliberately scoped to Hokkaido only (`_hkd` suffix, so a future nationwide version doesn't collide) for build speed, matching sas0's own Hokkaido-only scope.

**This work happened outside the sas0 repo.** The actual output — PMTiles files served by [Martin](https://maplibre.org/martin/) — belongs on `~/stars` (`git@github.com:hfu/stars`, a separate repository/host: Martin + cloudflared on a Raspberry Pi, published at stars.optgeo.org, referenced already in D13). sas0 itself gains nothing to commit from this step; this entry exists so a future maintainer working in sas0 understands what already exists to build against, and where.

**Tooling**: this machine already has `ogr2ogr`/`gdalinfo` (GDAL 3.13.1), `tippecanoe` (v2.79.0, supports direct `.pmtiles` output), and the `pmtiles` CLI installed — no new dependencies needed.

**Layer 1 — JMA forecast regions** (`jma_1saibun_hkd.pmtiles`, ~558KB, z0–10, 16 features): sourced from JMA's own `一次細分区域等` shapefile (`data.jma.go.jp/developer/gis/20190125_AreaForecastLocalM_1saibun_GIS.zip`, one of four forecast-region tiers JMA publishes — the others, 全国・地方予報区/府県予報区等/市町村等をまとめた地域等, weren't used). Confirmed by cross-referencing JMA's own `bosai/common/const/area.json` and a live warning response that this shapefile's `code` field is the **class10** tier, which is one level *finer* than `docs/instruments/warnings.js`'s existing per-office fetch (`HOKKAIDO_OFFICES`, 8 codes) — e.g. office `012000` (上川・留萌地方) splits into class10 codes `012010`/`012020` (上川地方/留萌地方) in this shapefile. That's actually the right granularity, not a mismatch: a live warning response's `class10Items[].areaCode` (verified via `jma.go.jp/bosai/warning/data/r8/016000.json`) matches this shapefile's `code` field exactly, 1:1 — so this polygon layer can join directly against data `warnings.js` already fetches, at *finer* resolution than the office-level grouping the UI currently shows. Filtered from 143 nationwide features down to the 16 under Hokkaido's 8 offices via an attribute `-where` (not a spatial bbox clip, since the exact code list was already known from `area.json`). No declared SRS in the shapefile; treated as JGD2011 (EPSG:6668) per JMA's stated datum, reprojected to EPSG:4326 for GeoJSON/tiling (the two are near-identical at this precision). Properties: `code`, `name`, plus `office_code`/`office_name` (the parent office, joined in from `area.json`, so a consumer doesn't have to fetch that separately just to know the office-level grouping).

**Layer 2 — municipality polygons** (`ksj_n03_hkd.pmtiles`, ~2.3MB, z0–12, 194 features): sourced from 国土数値情報's N03 行政区域データ, the Hokkaido prefecture extract (`nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2023/N03-20230101_01_GML.zip`, 2023-01-01 reference date, the current version at time of writing). Unlike the JMA shapefile, this one ships a proper `.prj` (JGD2011/EPSG:6668) and DBF text in CP932 (Shift-JIS) — needs `SHAPE_ENCODING=CP932` set for `ogrinfo`/`ogr2ogr` to read the Japanese attribute values correctly, same underlying issue as D23-era zip filename mojibake (Info-Zip's default extraction also mis-decodes CP932 filenames as CP437; both zips in this entry were extracted with a small Python script re-decoding `cp437→cp932` instead of using `unzip` directly). The raw shapefile has 9575 records for only 194 distinct administrative codes — heavily fragmented (islands, complex coastline, disconnected parts each stored as their own record) — dissolved down to one feature per code via `ogr2ogr -dialect sqlite -sql "SELECT ST_Union(geometry) ... GROUP BY N03_007"`. Properties renamed from N03's cryptic field codes to `code` (N03_007, the 5-digit JIS admin code), `pref` (N03_001), `subprefecture` (N03_002 — 振興局, matches `docs/instruments/municipalities.js`'s 14-region grouping exactly), `county_or_city` (N03_003), `municipality` (N03_004).

**札幌市's 10 wards are already separate features** in this layer (N03's native granularity, not merged into one 札幌市 polygon) — this wasn't a deliberate design choice for this entry so much as just not fighting the source data's own granularity, but it directly sets up the still-open follow-up noted in HANDOVER.md (checking whether Sapporo's wards publish their own hazard-map pages): the polygon layer will visually distinguish wards on a map before any ward-level link data exists in `config.js`.

Both files: placed in `~/stars/data/` (git-ignored — see the handoff to the dedicated `~/stars` session for why that's expected, not a gap), registered as explicit sources in `~/stars/config/martin.yaml` (also git-ignored/local) under `pmtiles_jma_1saibun_hkd`/`pmtiles_ksj_n03_hkd`, and verified end-to-end with a local `martin --config config/martin.yaml` — `/catalog` lists both, and a sample tile from each returns real MVT data (`200`, non-trivial byte count). Deploying to the actual production host (`spacex.optgeo.org`, publicly served at `stars.optgeo.org`) was explicitly left to `~/stars`'s own dedicated session rather than done from here — that session has since confirmed both are live: `/catalog` lists both sources on the public endpoint, sample Hokkaido tiles from each return real data, and the production files' SHA-256 checksums match the local ones byte-for-byte. Both layers are now live at `https://stars.optgeo.org/pmtiles_jma_1saibun_hkd/{z}/{x}/{y}` and `https://stars.optgeo.org/pmtiles_ksj_n03_hkd/{z}/{x}/{y}`, ready for a future sas0-side map to consume.

**Not yet done, deliberately left for later**: actually wiring either layer into a map (Spiccato replacement or otherwise), styling by warning status, or click-to-link behavior connecting a polygon to `config.js`'s existing hazard-map entries — this entry is the data layer only, per the user's own framing ("まずはベクトルタイルを作ることになると思う").

## D27: 地図 — a native MapLibre instrument replaces Spiccato, closing the mappable-data loop from D26

D26 built the data layer (two Hokkaido-only PMTiles, live on `~/stars`); this entry wires it into an actual, interactive map and retires Spiccato, whose entire reason for existing (D9: proving a complex CDN-loaded MapLibre GL JS site can run embedded in Open MCT at all, sandboxing and Brave compatibility included) had already been answered and stayed answered.

**Spiccato is not replaced with another iframe.** The new instrument (`docs/instruments/hkd-map.js`, key `hkd-map`) renders a MapLibre GL JS map directly into its own container `<div>` — no `<iframe>`, no cross-origin boundary, and therefore none of D9/D12's `sandbox`/`allow-same-origin` questions apply to it at all; that entire category of complexity, specific to embedding *another site*, simply doesn't exist for a map that *is* sas0. `renderIframe`/`getSafeSandbox` (`docs/core.js`) had exactly one caller each — `spiccato.js` — so both were deleted outright rather than left as unused code (CLAUDE.md's "delete completely, no back-compat hacks"), along with the now-dead `.sas0-iframe`/`.sas0-spiccato-frame`/`.sas0-hazard-frame` CSS (the last of those three had already been dead since D14 switched GSI's hazard portal from iframe to link, well before this cleanup).

**Instrument naming**: the obvious name, 北海道地図, collides with an existing company name (北海道地図株式会社) — avoided. Named plainly **地図** for now; revisit once the instrument's role is more settled (candidates once it does more than base map + two overlays: something naming what it's actually for, not just what it technically is).

**`docs/core.js` gained one small capability**: `registerInstrument`'s `autoRefresh: false` path now treats a function returned from `render()` as a teardown callback, invoked from the view's `destroy()`. Every other instrument returns nothing from `render()`, so this is purely additive. It exists because a MapLibre `Map` holds a WebGL context, timers, and event listeners that `map.remove()` needs to release explicitly — without this hook, navigating to 地図 and away repeatedly would leak a WebGL context each time (browsers cap the number of live contexts; enough leaked visits eventually breaks rendering entirely, not just on this instrument). Verified by cycling into and out of 地図 several times in a row and confirming no new console warnings accumulate beyond the one already-known D4 error.

**Basemap**: `https://stars.optgeo.org/style/bvmap-dark`, fetched live at render time (same "always pull from the authoritative source, never vendor a copy" discipline as D6's weather chart) — a ready-made, 123-layer dark-themed MapLibre style for GSI's 最適化ベクトルタイル (bvmap), already hosted on `~/stars` and pointing at `~/stars`'s own `https://stars.optgeo.org/bvmap` vector source. This mattered more than it sounds: GSI's own `optimal_bvmap` repository ships a lighter reference style (`skeleton.json`, 39 layers) whose source references bvmap's raw PMTiles archive directly via a `pmtiles://` URL scheme, which would have required adding the `pmtiles` MapLibre-protocol JS library as a second CDN dependency just to resolve it. Because `~/stars` already re-serves bvmap through Martin as a normal TileJSON/HTTP vector source (no `pmtiles://` scheme involved — Martin does that resolution server-side), using `bvmap-dark` sidesteps that dependency entirely: the whole map, base layer included, is built from plain `https://` vector sources, exactly like every other fetch in this codebase.

Both of sas0's own layers get merged into the fetched style at render time as ordinary `type: 'vector', url: ...` sources (`https://stars.optgeo.org/pmtiles_jma_1saibun_hkd`, `https://stars.optgeo.org/pmtiles_ksj_n03_hkd` — Martin serves these as plain TileJSON endpoints regardless of the PMTiles storage underneath, same as `bvmap`), each with a fill layer (for styling/click targeting), an outline layer, and — for the municipality layer — a zoom-gated label layer using the `municipality` property.

**MapLibre GL JS is pinned to v5.24.0, not the newer v6.x.** v6 dropped the plain-`<script>`/`window.maplibregl` UMD bundle in favor of ES-modules-only distribution (verified: `unpkg.com/maplibre-gl@6.6.0/dist/maplibre-gl.js` 404s; the file simply isn't shipped anymore, only `.mjs` files are) — v5.24.0 is the newest release that still ships it. Every other CDN-loaded piece in this codebase (Open MCT itself, D1) uses the plain-script-tag/global-variable pattern; switching this one instrument to `<script type="module">`/`import` syntax would have been a structurally different loading convention for no functional benefit, so the version pin follows the pattern instead of the newest number. CDN URLs verified live via `curl -sI` per D2's checklist before pinning.

**警報スタイリング（依代その1）**: `map.on('load', ...)` triggers a fetch of the same 8 Hokkaido office JSONs `warnings.js` already fetches (`https://www.jma.go.jp/bosai/warning/data/r8/{code}.json`) — duplicated locally in `hkd-map.js` rather than shared, since instrument files are self-contained by convention (D10) and there's no module system to share a constant across plain `<script>` tags anyway. Each office report's `class10Items[].areaCode` — confirmed in D26 to match the JMA polygon layer's `code` property 1:1 — gets its highest-severity active warning (mirroring `warnings.js`'s own `severityClass` logic exactly, same three tiers), which becomes a MapLibre `['match', ['get','code'], ...]` expression applied via `setPaintProperty` to the JMA fill layer. Colors reused verbatim from `.sas0-severity-advisory`/`-warning`/`-special` in `style.css` (`#e4c74a`/`#e46a4a`/`#d24aa8`) so the map agrees visually with the existing 警報・注意報 instrument rather than inventing a second palette. Verified against live data: at test time 十勝地方 (大雨注意報) rendered yellow and 釧路地方/根室地方 (大雨警報, the more severe tier) rendered orange-red, exactly matching what 警報・注意報 showed for the same offices at the same moment, and clicking either JMA region opens a popup with its name and current warning text (reusing the same fetched data, no extra request).

**市町村クリックリンク（依代その2）**: clicking the municipality fill layer reads `feature.properties.county_or_city || feature.properties.municipality`（falling back to the bare municipality/ward name when there's no parent city — most entries — and to the parent city name for 札幌市's wards）and looks it up by exact string match against `window.SAS0_CONFIG.municipalities[].title` — **directly, with no fetch at all**, since `config.js` is already loaded into the same page (`hkd-map.js` is a native sas0 instrument, not a separate site, so it shares `window` with everything else). A match opens a popup built from the same `title`/`description`/`url` shape `renderLinkList`'s row already uses (same `.sas0-link-row` HTML/CSS, reused for visual consistency, hand-built here rather than calling `renderLinkList` since a MapLibre popup needs an HTML string, not a live DOM node to append to); no match shows a plain "この市町村はまだリンク未登録です" message rather than nothing. Verified against a covered municipality (旭川市 — popped up its existing hazard-guide link correctly).

**Scope deliberately left for later**: this is base map + two overlays + warning styling + click-to-link, nothing more. No layer-toggle UI, no search/geocoding, no time-travel through past warnings, no attempt yet to surface uncovered municipalities differently from covered ones beyond the popup text. The instrument's name (地図) staying deliberately generic reflects that this is still an early step, not a finished product.

## D28: Root folder reorganized around daily-use vs. occasional-reference, `order` added to core.js, 火山情報 filtered to the 9 常時観測火山

Feedback after living with the tree for a while, in five parts: 気象庁 and 地図 are used daily and deserve top billing; link-only sources that aren't actually live status information should be demoted into a dedicated collection rather than sitting at the same level as daily instruments; 火山情報（北海道の火山）mixes in volcanoes that aren't under continuous observation; and the organization ordering should follow the conventions people already carry from elsewhere — 建制順 (rough government precedence) and 省庁→都道府県→市町村 (national ministries, then prefecture, then municipality).

**The tree order was an accident of `<script>` tag sequence, not a decision.** `docs/folders.js` runs before every instrument file, so every org folder always lands before any root-level instrument in `childrenByKey`'s push order, regardless of which folder or instrument "should" come first — there was no way to put 地図 (registered by `hkd-map.js`, necessarily after `folders.js`) ahead of, say, 北海道開発局 (a folder, registered *within* `folders.js`) without literally restructuring which file registers what. That's a real limitation, not a preference to route around case-by-case, so `docs/core.js`'s `registerFolder`/`registerInstrument` gained an optional `order` (a number; lower sorts first). `childrenByKey` buckets now hold `{identifier, order}`, with an auto-incrementing counter used whenever `order` is omitted — this keeps every existing call site's relative order exactly as it was (registration order), so `order` only needed to be added where a deliberate override was wanted, not everywhere.

**Root order**, only where 気象庁 and 地図 are pinned ahead of strict precedence for daily-use reasons (explicit user request, not derived from 建制順) — everything else follows 文部科学省→国土交通省 (本省 before its own 地方支分部局) → 都道府県:

```
気象庁            order 1   (unchanged position, pinned for daily use)
地図              order 2   (pinned for daily use — see hkd-map.js's registerInstrument)
防災科学技術研究所  order 3   (文部科学省系, precedes 国交省系 in Cabinet Act order)
国土交通省         order 4   (本省)
北海道開発局       order 5   (国交省地方支分部局)
北海道            order 6   (都道府県)
リンク集           order 9   (new folder, see below)
```

Nesting 気象庁/国土地理院 literally under a 国土交通省 umbrella (true to the actual 外局/特別の機関 org chart) was considered and rejected — it would bury the single most-used folder a click deeper for org-chart purity the daily-use request explicitly argues against. Flat root, ordered by convention, was judged the better fit for CLAUDE.md's "keep scope minimal."

**リンク集 (new folder, key `reference`)**: holds sources whose content is a one-time reference resource rather than live situational status, regardless of how "official" the source is. 国土地理院 (ハザードマップポータル — a static risk-map tool, not current status) and 北海道運輸局 (旅の安全情報 — transit schedule/operating status aimed at travelers, not disaster response) moved here as whole folders (`parentKey` changed in `docs/folders.js`; their own instrument files, `gsi-hazard.js`/`hokkaido-safe-travel.js`, needed no changes — `registerFolder`'s nesting already worked generically, 気象庁 itself being proof). `docs/instruments/municipalities.js` (市町村) and `volcano-councils.js` (火山) also moved here (`parentKey: 'reference'` instead of `'root'`) — both stay the single flattened list instruments D20 already made them; only the parent changed, not the flattening. 北海道防災ポータル・川の防災情報・北海道開発局の防災情報ポータルサイト・強震モニタ stayed at their existing root-level folders (北海道/国土交通省/北海道開発局/防災科学技術研究所) despite also being link-only — their content genuinely is live status (evacuation orders, water levels, warnings, real-time seismic intensity), just not embeddable for CORS/sandbox reasons already documented (D14, D19, D20); being a link rather than an embedded instrument was never the same question as being reference material rather than status.

**火山情報 filtered to the 9 officially continuously-monitored volcanoes.** `docs/instruments/volcano.js` previously kept anything in JMA's volcano code range 101–120 (all 20 of Hokkaido mainland's active volcanoes), which includes 11 that aren't under continuous observation (知床硫黄山・羅臼岳・摩周・丸山・恵庭岳・渡島大島・利尻山・羊蹄山・ニセコ・天頂山・雄阿寒岳) and therefore have no 噴火警戒レベル in operation at all — showing them in an instrument whose whole purpose is "current alert level" read as noise, not coverage. Replaced the min/max range filter with an explicit 9-code allowlist (104, 105, 107–109, 111–114) confirmed against JMA's own published 常時観測火山 designation. This set is, not coincidentally, exactly `docs/config.js`'s `volcanoCouncils` array (D18) — every volcano with an established 火山防災協議会 is one of the 9 continuously monitored — so 気象庁＞火山情報 and リンク集＞火山 now cover identical volcanoes with complementary information (live alert level vs. each council's own evacuation plan) rather than two overlapping-but-not-quite-matching lists.

## D29: 地図のホバー／クリックUX — 固定情報ペインとリンク専用の吹き出しに分離

D27で作った地図計器は、`ksj-n03-fill`（市町村）と`jma-warning-fill`（警報区域）の2つのfillレイヤーが北海道全域で重なっており、それぞれに独立した`map.on('click', layerId, ...)`を登録していたため、1回のクリックで両方のハンドラが発火し、`maplibregl.Popup`が2つ重なって出てしまい実用にならなかった（レイヤーごとのクリックハンドラという設計そのものが、重なり合うレイヤーでは根本的に噛み合わない）。

**設計方針**：Open MCTのInspectorパターン（選択/ホバー対象の詳細を、浮動するチップではなく固定のドッキングペインに出す）を参考に、ホバー（受動的・非ブロッキングな情報表示）とクリック（能動的・目的を持ったアクション）を役割で分離した。ただしOpen MCT自体のInspectorプラグインには統合していない — Open MCTのInspectorはオブジェクト選択モデルに深く結合しており、生のMapLibreキャンバスのホバーイベントに接続するのは今回の規模に見合わないため、同じ視覚言語（固定ペイン、常時表示）を`hkd-map.js`内にネイティブに実装するにとどめた。

- **ホバー**：`map.on('mousemove', ...)`を地図全体に1つだけ登録し、`map.queryRenderedFeatures(event.point, { layers: ['ksj-n03-fill', 'jma-warning-fill'] })`で両レイヤーを同時に問い合わせる。市町村名と警報状況を1つの固定ペイン（`.sas0-map-info`、地図の右側にドッキング、常時表示）にまとめて表示する（例：「音更町／十勝地方／現在、発表されている警報・注意報はありません。」）。マウスが地図キャンバスの外に出たら（`mapDiv`へのネイティブ`mouseleave`リスナー）プレースホルダ文言に戻す。
- **クリック**：`ksj-n03-fill`のみにハンドラを残し、`jma-warning-fill`のクリックハンドラは削除した。ヒットした市町村に`config.js`の`municipalities`該当行がある場合のみ、そのリンク行（`linkRowHtml`）を吹き出しで出す。未登録市町村はクリックしても吹き出しを出さない — ホバーペインが既にその市町村名と「リンクがある/ない」相当の情報（警報状況）を伝えているため、クリックは「開くものが実際にある時だけ」に限定した。これにより、吹き出しが重なって出る構造的な原因（2つの独立したクリックハンドラ）自体がなくなった。

DOM構造は`.sas0-map`（既存、MapLibreキャンバスのホスト）を`.sas0-map-wrap`（flex行）でラップし、新規`.sas0-map-info`（固定幅240px、ダークテーマ、`.sas0-link-row`と統一感のあるパディング・文字色）を隣に並べる形に変更した。実機（ブラウザ）で、登録済み市町村（富良野市）でクリック時に吹き出しが1つだけ出ること、未登録市町村（足寄町・美瑛町）でホバー時にペインへ情報は出るがクリックしても何も起きないこと、`document.querySelectorAll('.maplibregl-popup').length`が常に1以下であることを確認した。

**副次的に見つかった既存バグも同時に修正**：`buildFillColorExpression`は北海道内のどのオフィスにも警報・注意報が一つも出ていない時（本セッションでの検証中、実際にその状態だった）、MapLibreの`match`式が要求する最低4引数（入力・ラベル1・出力1・フォールバック）を満たさない`['match', ['get','code'], NO_WARNING_COLOR]`（2引数相当）を生成し、コンソールに`Expected at least 4 arguments, but found only 2`エラーを出していた。`byAreaCode.size === 0`の場合は`match`式を組み立てず`NO_WARNING_COLOR`を直接返すよう修正。D27時点のテストでは北海道内に警報が発表中だったため露見していなかった、今回初めて踏んだエッジケース。

## D30: 札幌市の区 — 10区中2区のみ、区独自の価値ある資料を確認

HANDOVER.mdで「カバレッジが進んだ段階での確認事項」として保留していた調査：札幌市の10区（中央・北・東・白石・豊平・南・西・厚別・手稲・清田）が、既存の2件（citywide のハザードマップ、さっぽろ防災ポータルの区別ライブ表示）とは別に、区独自の防災資料を公開しているか。

**結果：10区中2区（豊平区・清田区）のみ、独自の価値ある資料を確認した。** 残り8区（中央・北・東・白石・南・西・厚別・手稲）の区ページは防災カテゴリを持つものの、中身は citywide の`kikikanri`資料への案内（避難の考え方・チェックリスト等）に留まり、区独自のデータではない。西区は`/nishi/`配下に詳細な土砂災害ハザードマップ（13枚のPDF）へのリンクを持つが、そのPDF自体は`/kikikanri/...`（citywideハザードマップ体系の区別章）にホストされており、「区独自のページ」の基準を満たさない。

追加した2件：
- **豊平区**（https://www.city.sapporo.jp/toyohira/bousai/index.html）— 地区別の「防災ウォーキングマップ」PDF（最寄りの避難所までの徒歩ルート・危険箇所を示す）、避難所開設運営ガイドブック等、区が独自に作成した資料。
- **清田区**（https://www.city.sapporo.jp/kiyota/chiiki-anzen/hinan/index.html）— 清田区防災マップPDFに加え、地区別（北野・清田中央・平岡・清田・里塚美しが丘）の避難施設一覧（施設ごとにGoogle Mapsリンク付き）。さっぽろ防災ポータルより粒度が細かい。

いずれもHTTPSで問題なく解決すること（`curl -sIL`で200）を確認済み。残り8区は追加しなかった — CLAUDE.mdの最小スコープ方針に沿い、citywide資料の再掲にしかならない低価値なエントリで10行水増しするより、実際に価値のある2件だけを追加する判断。

## D31: Batch 5 — 全35市の網羅を完了（38→47）

D18から続く市町村バッチのうち初めて、区域（振興局）ではなく「まだカバーされていない市」を基準に選んだバッチ：北海道35市のうち残っていた9市（夕張市・美唄市・芦別市・赤平市・三笠市・砂川市・歌志内市 ＝ すべて空知総合振興局、士別市 ＝ 上川総合振興局、石狩市 ＝ 石狩振興局）を追加し、35市すべてに公式ハザードマップ／防災情報ページのリンクが揃った。38 → 47 / 179。

空知振興局に7市が集中しているのは、同振興局が北海道の旧産炭地（夕張・美唄・芦別・赤平・三笠・歌志内）を含むためで、地理的な調査バイアスではない。

D22で確立した「検索結果の上位URLが既にstaleな場合がある」パターンが今回も2件見つかった：**士別市**は検索結果に出るURL（`.../www/contents/1334832392813/index.html`）が既に404（ページ削除済み）で、市サイトの検索から現行ページを再発見した。**歌志内市**は検索エンジンに個別ページが一切ヒットせず（防災ポータルの汎用ページのみ）、市サイト自身の「暮らし＞防災」カテゴリページを直接たどって該当ページを特定した — D24/D25で「稀に起きる」としていたこのパターンが、5バッチ連続で最低1件発生しており、もはや例外ではなく毎回チェックすべき既定動作であることが確定した。

HTTPS/SNI不一致（名寄市・釧路町のパターン）は今回0件 — 9市すべてHTTPSで問題なく解決した。倶知安町・千歳市・伊達市・富良野市と同様、単一のハザードマップ統合ページを持たない市が1件（**石狩市** — 地区防災ガイド・防災GIS・3D浸水ハザードマップ・土砂災害ハザードマップが別ページに分かれている）あり、それら全てへの導線がある計画ページを案内した。

全9件、`curl -sIL`（ブラウザUser-Agent）でHTTPS 200を確認し、さらに各ページの`<title>`タグを取得してエージェントの報告内容と一致することを個別に再検証した（研究エージェント自身の検証結果を鵜呑みにしない、これまでの全バッチと同じ規律）。

## D32: Batch 6 — 47→57、全35市の完了後、初めて町のみを対象にした人口優先バッチ

D31で全35市の網羅を終えたことで、以降のバッチは必然的に町・村のみが対象になる。この最初の町バッチでは、振興局ごとの手薄さではなく「未収録の中で人口が多い順」を基準に選んだ：七飯町（渡島, 26,966人）・芽室町（十勝, 17,242人）・遠軽町（オホーツク, 17,047人）・美幌町（オホーツク, 16,707人）・余市町（後志, 16,486人）・当別町（石狩, 14,949人）・八雲町（渡島, 14,813人）・白老町（胆振, 14,582人）・森町（渡島, 12,852人）・斜里町（オホーツク, 10,717人）。人口は北海道総合政策部計画局統計課「令和7年国勢調査速報」に基づく。47 → 57 / 179。

**HTTPS/SNI不一致が今回2件**（七飯町・美幌町、いずれも`www2.`/`bousai.`サブドメイン）— 名寄市・釧路町（D23, D25）と同一の失敗モードで、`allowedProtocols: ['http:']`で吸収。これで名寄市・釧路町・七飯町・美幌町の4件がこの例外パターンとなり、Hokkaidoの町村サイトで珍しくない構成問題であることがより明確になった。

**検索結果の上位URLがstaleなケースが今回3件**（当別町・森町・斜里町、いずれも検索結果のURLが404で、各町サイト自身のナビゲーションから現行ページを特定）— D22以降の全バッチで発生しており、もはや「稀」ではなく「毎回チェックすべき既定動作」として確定した。**余市町**は検索結果に個別ページが一切ヒットせず、町サイトの防災カテゴリページを直接たどって特定した（歌志内市＝D31と同じパターン）。

全10件、`curl -sIL`（ブラウザUser-Agent）で再検証し、HTTPS版は200、HTTP専用版2件（七飯町・美幌町）はHTTP 200／HTTPS接続失敗（`curl`のSSL接続エラー、exit 35）をそれぞれ個別に確認。各ページの`<title>`タグも取得しエージェントの報告と一致することを確認した（七飯町のみ`<title>`が空だが、これはページ側の実装漏れであり、`<body>`の内容（土砂災害／洪水／噴火・地震の3ボタン選択画面）自体は正しいハザードマップ選択ページであることを直接確認した）。

## D33: Batch 7 — 北海道15村すべてを追加、村の網羅を完了（57→72）

D31で全35市、その後バッチ6で町を10件追加した流れの続きとして、今回は北海道の15村すべてを一括で対象にした — 村は数が少なく（15のみ）、全件を一度に扱う方が「まだ残っている村」を後続バッチで個別に気にし続けるより効率的と判断した。57 → 72 / 179。全15村の一覧はWikipediaのカテゴリ「北海道の村」から取得（記憶に頼らず出典を確認）：赤井川村・音威子府村・神恵内村・更別村・猿払村・島牧村（後志3件, 上川1件, 十勝1件, 宗谷1件）・占冠村（上川）・初山別村（留萌）・新篠津村（石狩）・鶴居村（釧路）・泊村（後志）・中札内村（十勝）・西興部村（オホーツク）・真狩村・留寿都村（後志）。後志総合振興局が7村中6村を占める偏りは地理的事実（後志は北海道で最も村の数が多い振興局）であり、調査バイアスではない。

**今回はHTTPS/SNI不一致・stale検索結果のいずれも0件** — これまでのバッチで確立した2つの既知失敗モードがどちらも発生しなかった、初めてのバッチ。一方で新しいドメインパターンの罠が見つかった：多くの村サイトは`vill.◯◯.hokkaido.jp`ではなく`vill.◯◯.lg.jp`（占冠村・島牧村・初山別村・鶴居村・西興部村・真狩村・留寿都村の7村）を使っており、`.hokkaido.jp`側のホスト名はDNS解決自体が失敗する（これはHTTPS特有の失敗ではなく、単に存在しないホスト名を推測した結果であり、D23/D25のSNI不一致パターンとは別種のミス）。赤井川村・更別村はさらに独自ドメイン（akaigawa.com, sarabetsu.jp）を使っており、村サイトのドメインパターンは統一されていないことが分かった。

**真狩村・中札内村・音威子府村は単一のハザードマップ統合ページを持たない**（倶知安町・千歳市等と同じパターン）ため、それぞれ避難場所一覧ページ・防災カテゴリページ・防災情報ページを案内する。**島牧村**は`<title>`タグが「島牧村」とだけ書かれた薄い実装（CMSの制約と思われる）だが、本文には津波・洪水・土砂災害の各ハザードマップPDFへの実リンクが確認できたため採用した。

全15件、`curl -sIL`（ブラウザUser-Agent）でHTTPS 200を確認し、`<title>`タグの照合（島牧村を除く14件で一致、島牧村は本文のハザードマップ関連キーワードで内容を直接確認）を実施した。

## D34: Batch 8 — 72→82、町のみを対象にした2巡目の人口優先バッチ

全35市・全15村の網羅後、町のみが対象になる中でのバッチ2巡目。既収録22町を除いた人口上位10町を追加：栗山町（空知, 10,405人）・岩内町（後志, 10,365人）・日高町（日高, 10,298人）・東神楽町（上川, 9,588人）・長沼町（空知, 9,479人）・美瑛町（上川, 9,337人）・上富良野町（上川, 9,150人）・東川町（上川, 8,726人）・清水町（十勝, 8,368人）・厚岸町（釧路, 7,861人）。人口は北海道総合政策部計画局統計課「令和7年国勢調査速報」（D32と同一シリーズ）に基づく。72 → 82 / 179。

**上川総合振興局に5町が集中**（東神楽町・美瑛町・上富良野町・東川町、旭川市周辺）— 旭川都市圏の人口密度を反映した地理的事実で、調査バイアスではない。

**検索結果の上位URLがstaleなケースが今回2件**（東神楽町・長沼町、いずれも404で、町サイト自身のナビゲーションから現行ページを特定）— D22以降、ほぼ全バッチで発生している。HTTPS/SNI不一致は今回0件。

**独自ドメインパターンが今回3件**（長沼町=maoi-net.jp、東川町=higashikawa-town.jp、厚岸町=akkeshi-town.jp）— D33で初めて確認した「`town.◯◯.hokkaido.jp`という命名規則を前提にしない」という教訓が、村だけでなく町でも同様に当てはまることを確認した。**東川町**は`<title>`タグがサイト全体共通の汎用文言（「写真の町 東川町」）を返すJS駆動のパネル型サイトだったため、`<title>`照合の代わりに本文のキーワード（洪水ハザード・大雪山・旭岳・避難所等）を直接確認して正当性を判断した — 島牧村（D33）に続き、`<title>`だけに頼らない検証が必要なケースがこれで2件目。

全10件、`curl -sIL`（ブラウザUser-Agent）でHTTPS 200を確認し、9件は`<title>`タグの照合、東川町は本文キーワードでの確認を実施した。岩内町のURLは日本語パスを含むため、`SAS0.getSafeUrl()`が使う`URL`コンストラクタが正しくパーセントエンコードすることを確認済み（既存の火山防災協議会PDFリンク（D15）で日本語パスは既に実績あり、新規の懸念ではない）。

## D35: Batch 9 — 82→92、町のみを対象にした3巡目の人口優先バッチ

既収録32町を除いた人口上位10町を追加：南幌町（空知, 7,890人）・洞爺湖町（胆振, 7,826人）・湧別町（オホーツク, 7,538人）・むかわ町（胆振, 7,154人）・安平町（胆振, 6,955人）・白糠町（釧路, 6,615人）・標茶町（釧路, 6,517人）・弟子屈町（釧路, 6,247人）・大空町（オホーツク, 6,183人）・鷹栖町（上川, 6,173人）。人口は北海道総合政策部計画局統計課「令和7年国勢調査速報」（D32/D34と同一シリーズ、リサーチエージェントが今回`pdftotext`で数値を直接抽出）に基づく。82 → 92 / 179。

**胆振総合振興局に3町が集中**（洞爺湖町・むかわ町・安平町）、**釧路総合振興局にも3町**（白糠町・標茶町・弟子屈町）— いずれも地理的事実で調査バイアスではない。

**洞爺湖町はHTTPS/SNI不一致**（`.hokkaido.jp`・`.lg.jp`いずれも失敗）— 名寄市・釧路町・七飯町・美幌町に続き5件目のこのパターン。**標茶町**は観光用サイトが行政サイトとは別ドメイン（`hokkaido.shibecha.jp`）にあり、行政サイト自体（`town.shibecha.hokkaido.jp`）はトップページの「行政情報」リンク経由でしか辿れない — D33/D34で確立した「ドメインパターンを前提にしない」教訓の新しい変種（今回は命名パターンの違いではなく、同一町に複数の別ドメインサイトが存在するケース）。**大空町・鷹栖町**は検索結果の上位URLが既にstale（鷹栖町はサイトのURL体系自体が移行済み）で、町サイト自身のナビゲーションから現行ページを特定した。

全10件、`curl -sIL`（ブラウザUser-Agent）で再検証し、HTTPS版9件は200、洞爺湖町はHTTP 200／HTTPS接続失敗（exit 35）を確認。9件は`<title>`タグの照合、南幌町のみ`<title>`が空だったため本文中の「ハザードマップ」関連キーワード（表面・裏面PDFへのリンク等）で内容を直接確認した。

## D36: Batch 10 — 92→102、100市町村を突破（町のみ4巡目）

既収録42町を除いた人口上位10町を追加：新十津川町（空知, 6,114人）・共和町（後志, 5,989人）・当麻町（上川, 5,826人）・本別町（十勝, 5,695人）・足寄町（十勝, 5,613人）・池田町（十勝, 5,592人）・広尾町（十勝, 5,506人）・士幌町（十勝, 5,385人）・ニセコ町（後志, 5,370人）・長万部町（渡島, 5,310人）。人口は北海道総合政策部計画局統計課「令和7年国勢調査速報」に基づく。92 → 102 / 179 — 全体の過半数を突破。

**十勝総合振興局に5町が集中**（本別町・足寄町・池田町・広尾町・士幌町）— 地理的事実で調査バイアスではない。

**ドメイン推測の罠が3件**（D33/D34/D35で確立したパターンの継続）：当麻町は`town.tohma.hokkaido.jp`（`toma`ではなく`tohma`のローマ字表記）、池田町は`hokkaido-ikeda.lg.jp`（長野県池田町と同名のため町名だけでは検索が曖昧になる）、士幌町は`shihoro.jp`（隣接する上士幌町の`kamishihoro.jp`と混同しやすい）。**当麻町**はJS駆動のOpenLayers製WebGISアプリで、素のHTMLの`<title>`は空（島牧村＝D33、東川町＝D34に続き3件目のこのパターン）— ブラウザでレンダリングした上でページタイトルが「当麻町洪水ハザードマップ」に変わることを確認して検証した。**足寄町・ニセコ町**は検索結果の上位ページがハザードマップ本体へのリンクを持たない薄いページで、町サイト自身のナビゲーションから本体を特定した。**共和町**は単一のハザードマップ統合ページを持たず、防災対策ページを案内する（倶知安町・千歳市等と同じフォールバックパターン）。

**HTTPS/SNI不一致は今回0件** — 全10件HTTPS 200で問題なし。全10件、`curl -sIL`（ブラウザUser-Agent）で再検証し、9件は`<title>`タグの照合、当麻町のみ実ブラウザでのレンダリング後のタイトルで確認した。

## D37: Batch 11 — 102→112、町のみ5巡目

既収録52町を除いた人口上位10町を追加：松前町（渡島, 5,263人）・新得町（十勝, 5,224人）・浜中町（釧路, 5,144人）・大樹町（十勝, 5,127人）・鹿追町（十勝, 4,861人）・新冠町（日高, 4,759人）・標津町（根室, 4,612人）・奈井江町（空知, 4,543人）・上士幌町（十勝, 4,472人）・今金町（檜山, 4,393人）。人口は北海道総合政策部計画局統計課「令和7年国勢調査速報」に基づく。102 → 112 / 179。

十勝総合振興局に4町（新得町・大樹町・鹿追町・上士幌町）が集中 — これで十勝は音更町・幕別町・清水町・芽室町・足寄町・池田町・広尾町・士幌町と合わせて12町村を収録、他振興局より突出して多いが、これは十勝地方が北海道内で最も町の数が多い振興局であるという地理的事実による。

**検索結果の上位URLがstaleなケースが今回2件**（松前町・標津町、いずれも404）。**標津町**は特に、防災情報専用の別ドメイン（`shibetsutown-bousai.jp`）が町の本体サイトとは別に存在するパターン（D35の標茶町と同種）で、本体サイトのリンクを辿って発見した。既収録の「中標津町」（別の自治体）と紛らわしい名前のため取り違えに注意した。**松前町**はブラウザが表示するURLが`www`なしに正規化される（Imperva CDNの挙動）が、実際にDNS解決するのは`www`付きのホストのみという逆パターンの罠を確認した。

**HTTPS/SNI不一致は今回0件**。**単一のハザードマップ統合ページを持たない町が1件**（今金町 — 防災情報カテゴリページを案内、倶知安町等と同じフォールバック）。標津町のみ`<title>`がJS描画のため空だったが、実ブラウザでの確認で「標津町Web版ハザードマップ」と正しく表示されることを確認した。

全10件、`curl -sIL`（ブラウザUser-Agent）でHTTPS 200を確認し、9件は`<title>`タグの照合、標津町は実ブラウザでの確認を実施した。

## D38: Batch 12 — 112→122、町のみ6巡目

既収録62町を除いた人口上位10町を追加：由仁町（空知, 4,349人）・蘭越町（後志, 4,346人）・佐呂間町（オホーツク, 4,339人）・平取町（日高, 4,332人）・中富良野町（上川, 4,285人）・訓子府町（オホーツク, 4,245人）・小清水町（オホーツク, 4,195人）・厚真町（胆振, 4,159人）・羅臼町（根室, 4,027人）・雄武町（オホーツク, 3,861人）。人口は北海道総合政策部計画局統計課「令和7年国勢調査速報」に基づく。112 → 122 / 179。オホーツク総合振興局に4町（佐呂間町・訓子府町・小清水町・雄武町）が集中 — 地理的事実。

**平取町**は、リサーチが最初に見つけた具体的な改定版ニュース記事（「2025年11月改訂版」）ではなく、その記事が属する恒久的なカテゴリページを採用した — 改定のたびにニュース記事のURLが変わりリンク切れになる将来のstale化を、追加時点で先回りして避ける判断。これはD24以降の「stale検索結果を避ける」教訓の一歩先（既に見つけたリンクの中でも、より安定した形を選ぶ）。

**厚真町・羅臼町**はいずれも防災専用の別ドメイン／サブドメインを持つパターン（標茶町＝D35、標津町＝D37に続く）で、厚真町はJS駆動で`<title>`が空、羅臼町も同様に空だったため、両方とも実ブラウザでレンダリングした上でタイトルが正しく表示されることを確認した。羅臼町にはさらに別ドメイン（`rausutown-bousai.jp`）にWeb版地図もあったが、「町自身の公式ドメイン」という基準を優先し、`rausu-town.jp`上のページを採用した。

**雄武町のハザードマップ本体（`www1.town.oumu.hokkaido.jp`）はHTTPS/SNI不一致**（これで6件目のこのパターン）だが、今回は`allowedProtocols: ['http:']`の例外を追加する代わりに、同じ地図へリンクするHTTPS版の防災ページ（`www.town.oumu.hokkaido.jp/.../2585.html`）を案内先として採用した — 内容は実質同じで、例外を1件増やさずに済む選択肢がある場合はそちらを優先するという初めての判断。

全10件、`curl -sIL`（ブラウザUser-Agent）でHTTPS 200を確認し、8件は`<title>`タグの照合、厚真町・羅臼町は実ブラウザでの確認を実施した。

## D39: Batch 13 — 122→132、町のみ7巡目

既収録72町を除いた人口上位10町を追加：浦幌町（十勝, 3,855人）・津別町（オホーツク, 3,774人）・えりも町（日高, 3,738人）・様似町（日高, 3,665人）・上ノ国町（檜山, 3,658人）・知内町（渡島, 3,654人）・美深町（上川, 3,635人）・清里町（オホーツク, 3,571人）・豊富町（宗谷, 3,431人）・豊浦町（胆振, 3,409人）。人口は北海道総合政策部計画局統計課「令和7年国勢調査速報」に基づく。122 → 132 / 179。

**様似町はHTTPS/SNI不一致**（`www.samani.jp`）で、これで7件目のこのパターン — `curl -v`で確認したところ名寄市・釧路町・深川市と**同一IPアドレス（45.60.112.77）**上にあり、D25で推測した「共有ホスティング基盤の設定不備」という仮説をさらに裏付ける。D38の雄武町のようなHTTPS代替ページは存在しなかったため、`allowedProtocols: ['http:']`の例外を追加した。

**浦幌町・津別町は検索結果の上位URLが既にstale**（いずれも404）で、町サイト自身のナビゲーションから現行ページを特定した。**美深町・清里町は洪水のみが実際に地図として整備**されており（土砂災害情報は地図でない告知の形で別途公開）、説明文を洪水のみに限定して誇張を避けた。

全10件、`curl -sIL`（ブラウザUser-Agent）で再検証し、9件はHTTPS 200、様似町はHTTP 200／HTTPS接続失敗（SNI不一致、名寄市等と同一IP）を確認。全10件、`<title>`タグの照合を実施した。

## D40: Batch 14 — 132→142、町のみ8巡目

既収録82町を除いた人口上位10町を追加：興部町（オホーツク, 3,356人）・鹿部町（渡島, 3,347人）・増毛町（留萌, 3,343人）・比布町（上川, 3,261人）・木古内町（渡島, 3,258人）・仁木町（後志, 3,188人）・福島町（渡島, 3,184人）・上川町（上川, 3,170人）・厚沢部町（檜山, 3,099人）・浜頓別町（宗谷, 3,039人）。人口は北海道総合政策部計画局統計課「令和7年国勢調査速報」に基づく。132 → 142 / 179。

**浜頓別町はHTTPS/SNI不一致**（8件目、名寄市・釧路町・深川市・様似町と同一IP 45.60.112.77）— `allowedProtocols: ['http:']`が必要。**増毛町・比布町はJS駆動のWebGISアプリ**で素のHTMLの`<title>`が空（これで5・6件目のこのパターン）、実ブラウザでのレンダリングでそれぞれ「増毛町WEB版防災ハザードマップ」「比布町防災マップ」と正しく表示されることを確認した。

**鹿部町は洪水マップが未整備**（土砂災害・津波のみ）、**上川町は土砂災害情報が地図でないテキストの注意喚起のみ**（水害マップのみ実在）— いずれも説明文を実際に地図化されている災害種別のみに限定し、誇張を避けた（D39で確立した方針の継続）。

全10件、`curl -sIL`（ブラウザUser-Agent）で再検証し、9件はHTTPS 200、浜頓別町はHTTP 200（`-I`ヘッドリクエストがこのサーバでは不安定だったため`-s`の通常GETで確認）／HTTPS接続失敗を確認。8件は`<title>`タグの照合、増毛町・比布町は実ブラウザでの確認を実施した。

## D41: Batch 15 — 142→154、残りが少なくなったため12件のやや大きめバッチ

既収録92町を除いた人口上位12町を追加：月形町（空知, 2,993人）・乙部町（檜山, 2,937人）・京極町（後志, 2,809人）・下川町（上川, 2,744人）・豊頃町（十勝, 2,704人）・和寒町（上川, 2,669人）・沼田町（空知, 2,654人）・黒松内町（後志, 2,643人）・剣淵町（上川, 2,640人）・小平町（留萌, 2,562人）・苫前町（留萌, 2,560人）・天塩町（留萌, 2,535人）。人口は北海道総合政策部計画局統計課「令和7年国勢調査速報」に基づく。142 → 154 / 179。残り25市町村がすべて町のみとなり、バッチサイズを10から12へ拡大した（179に近づくにつれ、標準の10件バッチを維持する必然性が薄れたため）。

**黒松内町・苫前町はいずれもHTTPS/SNI不一致**（9・10件目、同一IP 45.60.112.77）— ドメイン全体（ルートパスも含め）でHTTPSが機能せず、代替のHTTPSページも存在しないため、両方とも`allowedProtocols: ['http:']`が必要。これで累計10市町村がこのパターンに該当し、共有ホスティング基盤の設定不備という仮説（D25）がさらに強く裏付けられた。

**和寒町は検索結果の上位URLが旧URL体系（301リダイレクト）**で、リダイレクト先の現行URLを採用した。**剣淵町は検索エンジンに一切ヒットせず**、町サイト自身のメニューツリーから発見 — D24以降で確立した「検索結果を鵜呑みにしない」の最も極端な事例（ヒット自体が存在しないケース）。**小平町**は具体的な改定版ニュース記事ではなく恒久的なカテゴリページを採用（D38の平取町、D40の鹿部町と同じ「将来のリンク切れを先回りして避ける」判断）。

**京極町・下川町は洪水のみが地図として整備**され、**剣淵町は土砂災害マップが未整備**（警戒区域指定の告知のみ）— いずれも説明文を実際に地図化されている内容に限定した。

全12件、`curl -sIL`（ブラウザUser-Agent）で再検証し、10件はHTTPS 200、黒松内町・苫前町はHTTP 200／HTTPS接続失敗（SNI不一致）を確認。全12件、`<title>`タグの照合を実施した（今回はJS駆動の空`<title>`ケースは0件）。

## D42: 最終バッチ — 154→179、市町村の全179カバレッジを達成

残っていた25町すべてを一括で追加し、北海道179市町村（35市・15村・129町）のハザードマップ/防災情報リンクを完全に網羅した。D18（14/179）から始まった市町村バッチの最終回。人口順ではなく「残り全件」を対象とした唯一のバッチで、リサーチはWikipediaの北海道市町村一覧から129町の完全なリストを取得し、既収録104町を差し引いて残り25町を導出（期待値と一致することを確認済み）。

内訳：上川総合振興局4件（愛別町・中川町・幌加内町・南富良野町）、後志総合振興局4件（喜茂別町・積丹町・寿都町・古平町）、空知総合振興局6件（浦臼町・雨竜町・上砂川町・秩父別町・北竜町・妹背牛町）、宗谷振興局5件（中頓別町・幌延町・利尻町・利尻富士町・礼文町）、オホーツク総合振興局2件（置戸町・滝上町）、胆振総合振興局1件（壮瞥町）、十勝総合振興局1件（陸別町）、留萌振興局1件（遠別町）、檜山振興局1件（奥尻町）。空知総合振興局が最多（6件）となったのは、同振興局に町の数自体が多いという地理的事実による。

**幌加内町**は地理的には空知地方に位置するが、行政区分上は上川総合振興局に属する — 珍しい越境的な区分だが、既存の`REGIONS`定義（`municipalities.js`）の`shien-kamikawa`にそのまま合致する。

**寿都町はHTTPS/SNI不一致**（11件目、名寄市等と同一IP 45.60.112.77）で`allowedProtocols: ['http:']`が必要。ローマ字表記は「suttu」（「suttsu」ではない）という表記の罠も確認した。**陸別町**は独自ドメイン（`rikubetsu.jp`）。**利尻町**は旧`town.rishiri.hokkaido.jp`が独自ドメイン（`rishiri-town.jp`）へ完全移行済みという、これまでで最も大きな移行パターン（サブパスの変更ではなくドメイン自体の全面移転）。**利尻富士町**はJS駆動のWeb版地図（`/hazardmap/`）が空のシェル状態で不安定だったため、静的な内容を持つ親ページ（説明ページ）を採用した — 従来の「JS駆動ページは実ブラウザで確認する」対応とは異なり、今回は「不安定なJS版を避けて安定した代替ページを選ぶ」という新しい判断パターン。

**礼文町は津波のみ、遠別町は土砂災害のみが地図として整備**されており、説明文をそれぞれ実際の内容に限定した。**滝上町**は検索結果の上位に不動産・観光サイトが並び町公式サイトが埋もれるという、これまでにないタイプの検索汚染に遭遇し、町公式サイトへ直接ナビゲートして特定した。**北竜町**は検索結果上位URLが301後に404という、二重のstaleパターン。

全25件、`curl -sIL`（ブラウザUser-Agent）で再検証し、24件はHTTPS 200、寿都町はHTTP 200／HTTPS接続失敗（`dig`で同一IP 45.60.112.77を確認）を確認。全25件、`<title>`タグの照合を実施した。

**これで市町村は179/179、北海道全市町村のハザードマップ/防災情報リンクが揃った。** D18開始時の14件から、D23〜D25・D31〜D42の合計16バッチを経ての完了。今後の主なメンテナンス方針は新規追加ではなく、既存179件の`scripts/check-links.sh`による定期的な再検証（D22）に移る。

**全179件の完了確認中に、実データの重複バグを1件発見・修正した**：士別市（`shien-kamikawa`, D31）と標津町（`shien-nemuro`, D37）が、どちらも同じローマ字表記「shibetsu」から`key: 'shibetsu'`を独立に割り当てられており、`key`が衝突していた（現在のレンダリングロジックは`title`で照合するため実害はなかったが、`key`をキーとして使う将来のコードに対する潜在的なデータ不整合）。標津町を`key: 'shibetsu-cho'`に変更して解消。ブラウザで`window.SAS0_CONFIG.municipalities`から`key`の重複がないこと、実データが正確に179件であることを直接検証して確認した — 16バッチにわたる手作業のkeyの命名で、初めて発生した衝突。

## D43: 単一計器フォルダをすべて解消 — 「フォルダは2計器以上を束ねる時だけ」

D28のルート再編成後、市町村バッチ完了を経てユーザーから追加のフィードバックがあった：「気象庁は完成度が高くフォルダのままでよいが、他の北海道〜北海道開発局は、地図〜火山と同様にリンク集にして良いのではないか。現在のメニューだと、フォルダになっている必然性がない」。

D28時点のルート直下フォルダを実際に数えると、原因は一貫していた：フォルダの中身が1計器しかないケースが大半を占めていた。

- `気象庁`（jma）: 4計器 — フォルダである必然性がある
- `防災科学技術研究所`（nied）・`国土交通省`（mlit）・`北海道開発局`（kaihatsukyoku）・`北海道`（hokkaido）: いずれも1計器のみ
- `リンク集`内の`国土地理院`（gsi）・`北海道運輸局`（unyukyoku）: いずれも1計器のみ

1計器しかないフォルダは、開いても中に1行しか出てこない — フォルダアイコンをクリックするワンクッションが常に無駄になる。採用した基準はシンプル：**フォルダは2計器以上を束ねる時だけ作る**。1計器しかないフォルダは解消し、その計器を元のフォルダの位置（同じ`parentKey`・同じ`order`）へ直接昇格させる。

これはD28の「状況情報はルート直下・参照情報はリンク集」という分類軸自体は変更していない — 強震モニタ・川の防災情報・北海道開発局 防災情報ポータルサイト・北海道 防災情報は引き続きルート直下（状況情報）、ハザードマップポータル・北海道 旅の安全情報は引き続きリンク集直下（参照情報）のまま。変えたのは「フォルダというラッパーが要るかどうか」という、D28の分類軸とは独立したもう一段構造上の基準。

**実装**：`docs/folders.js`から`nied`・`mlit`・`kaihatsukyoku`・`hokkaido`・`gsi`・`unyukyoku`の6つの`registerFolder`呼び出しを削除。各フォルダが持っていた`order`値（3, 4, 5, 6）を、そのフォルダ配下だった計器（`kmoni.js`・`river-info.js`・`hokkaido-development-bureau.js`・`hokkaido.js`）の`registerInstrument`呼び出しに移し、`parentKey`を`'root'`に変更。`gsi-hazard.js`・`hokkaido-safe-travel.js`は`parentKey`を`'reference'`に変更（明示的な`order`は不要 — 既存の市町村・火山と同じく登録順のまま）。`気象庁`（order 1）と`リンク集`（order 9）は変更なし。

**計器名の調整**：フォルダ名が消えると、計器名だけでは組織の文脈が失われるものが2件あった。`hokkaido.js`の計器名は汎用的な`'防災情報'`のままだったため、`docs/config.js`の`hokkaidoLink.title`と表記を揃えて`'北海道 防災情報'`に変更。`hokkaido-development-bureau.js`は`config.hokkaidoDevelopmentBureau.title`（`'防災情報ポータルサイト'`）をそのまま使っていたため、他の「防災情報」系の計器名（`北海道 防災情報`・`川の防災情報`）と横に並んだ時に紛らわしくならないよう、`docs/config.js`側で`'北海道開発局 防災情報ポータルサイト'`に変更した（この値は計器名にもリンク集アイテムのタイトルとしても使われる唯一の情報源のため、config.js側の1箇所を直すだけで両方に反映される）。`強震モニタ`・`川の防災情報`・`ハザードマップポータル`・`北海道 旅の安全情報`は既に他と紛れない固有名のため変更していない。

**結果のルート直下**：気象庁（フォルダ, 4計器）→ 地図 → 強震モニタ → 川の防災情報 → 北海道開発局 防災情報ポータルサイト → 北海道 防災情報 → リンク集（フォルダ, 4項目：ハザードマップポータル・北海道 旅の安全情報・市町村・火山）。フォルダアイコンは気象庁とリンク集の2つだけになり、それ以外はすべて1クリックで開く計器として並ぶ。ブラウザで確認済み — フォルダ数・各フォルダの中身・並び順（D28通り）・コンソールエラー（既知のD4のみ）を確認した。

## D44: 地図の情報ペーンを右側から下側へ、控えめな高さに変更

D29でホバー時の固定情報ペインを追加した際、右側に固定幅240pxで配置していたが、ユーザーから「地図の表示面積が狭く感じられる」というフィードバックがあった。地図（面）の視認性が情報ペイン（テキスト）より優先されるべきという判断で、配置を右側→下側に変更した。

`docs/style.css`のみの変更（`docs/instruments/hkd-map.js`のDOM構造・イベントハンドラは無変更 — `mapWrap > mapDiv + infoPanel`という親子関係、`renderInfoPanel`のロジックはそのまま）。`.sas0-map-wrap`の`flex-direction`を`row`（デフォルト）から`column`に変更し、`.sas0-map-info`を`width: 240px; height: 100%; border-left`から`width: 100%; height: 110px; border-top`に変更した。高さ110pxは、市町村名・振興局名・警報状況の3行が収まりつつ、地図の表示面積を最大限確保する値として選んだ。

ブラウザで確認：地図の表示面積が明らかに広がったこと、下部の情報ペインでホバー時に市町村名・振興局名・警報状況が正しく表示されること（例：「赤平市／空知地方／現在、発表されている警報・注意報はありません。」）、コンソールエラーが既知のD4のみであることを確認した。

## D45: 保守タスクの確認結果 + sas0初のCI（週次リンクチェック）

D42/D43完了後、次の作業としてユーザーと相談した小さな保守タスクの確認結果と、以前D22で保留していた「CIを追加するか」という方針判断の実施記録。

**確認結果（コード変更なし）**：
- **Open MCTの正式版**：`nasa/openmct`のGitHub Releasesを確認したところ、最新の正式リリースはv4.2.0（2025-02-04公開）で、現在ピンしている`4.3.0-rc1`より古い。`unpkg.com/openmct@4.3.0/dist/openmct.js`は404で、v4.3.0の正式版はまだ存在しない。RCトラックの方が正式リリースより先行している状態のため、ピン変更は不要 — 「まだ出ていないことを確認した」こと自体が今回の結果。
- **3ポータルのCORS**：北海道防災ポータル・さっぽろ防災ポータル・川の防災情報（river.go.jp）に`Origin`ヘッダ付きでリクエストしたが、いずれも`Access-Control-Allow-Origin`は返らず、D20時点から変化なし。引き続きリンクのままが正しい。

**CI追加の方針判断**：D22で「メンテナが決めること」として保留していた質問をユーザーに投げたところ、「このorganizationでGitHub Actionsが問題なく実行できるようであれば、低頻度（週1回程度）で追加する」との回答を得た。事前に`gh api repos/dwg7/sas0`でActionsが有効（`enabled: true, allowed_actions: "all"`）であることを確認し、条件を満たすと判断して追加した。

**`scripts/check-links.sh`に2つの改善**（CI専用ではなく手動実行にも効く）：
1. 既知の恒久的false positive（JMAの2つのURLテンプレート）を`FAIL`ではなく`SKIP`として扱う明示的な除外リストを追加 — これらはランタイム文字列結合用のベースURLで、そもそも取得可能なページではない（D22で既に文書化済み）。
2. 初回失敗時に3秒待って1回だけリトライする — Incapsula等のbot保護による一時的なflaky応答を吸収する。ただし今回の検証中、岩内町・利尻町（いずれも日本語パスを含むURL）で単発の`FAIL`が再現したが、直後に同一URLを単独で`curl`すると200が返る、純粋な一時的flakeであることを確認済み（このセッションでの繰り返しテストによる負荷が原因で、週次の実運用では起きにくいはず）。

**新規ワークフロー `.github/workflows/check-links.yml`**：`schedule`（毎週月曜20:00 UTC＝火曜05:00 JST）と`workflow_dispatch`（手動実行）の両方でトリガー。`check-links.sh`を実行し、非ゼロ終了時のみ`gh issue`でFAIL一覧を報告する — 同じ固定タイトルの既存オープンIssueがあればコメント追記、なければ新規作成し、毎週同じ内容でIssueが増殖しないようにした。`permissions: issues: write`を明示。

これがsas0にとって初めてのCIとなる。CLAUDE.mdの「sas0はビルド・デプロイパイプラインを持たない」という原則とは抵触しない — GitHub PagesはこれまでどおりビルドなしのDocs/を配信し続け、このワークフローはリンクの生存確認だけを行う、ビルド・デプロイに関与しない補助ジョブという整理。追加後、`workflow_dispatch`で1回手動実行し正常終了することを確認した。

## D46: 市町村ハザードマップの形式調査が裏付けたこと — 重ね合わせは重ね合わせが必要な時だけ

D13は当初から「地図に重ねられるデータ」と「重ねられないデータ」を分け、後者を計器の木（tree-of-instruments）で扱うという設計原則を立てていた。179市町村のハザードマップ形式調査（D42後の予備調査、Artifactとして公開）の結果は、この原則を経験的に裏付けるものになった。

179件のうち、PDF単独が101件（56%）、Web地図単独が27件（15%）、両方を持つものが39件（22%）、索引ページ等その他が12件（7%）。過半数がPDF単独という事実に加え、Web地図を持つ66件（単独＋混在）も実装がバラバラ — ArcGIS Experience Builder、OpenLayers、Leaflet、自治体ごとの独自JSアプリが混在し、共通の技術基盤も無ければ、同じ振興局内の隣接自治体同士でも形式が揃わない。これらを1枚の共有地図へレイヤーとして統合しようとすれば、179通りの個別対応が要ることになる。

さらに本質的なのは、これらハザードマップの中身が「今の状況」ではなく「あらかじめ用意された参照資料」であるという点 — 動的に重ね合わせて初めて意味を持つ生きたデータ（警報の発表状況など）ではなく、平時に一度確認しておく静的な資料である。重ね合わせという操作は、本来「今どうなっているか」を空間的に統合して把握するために要る手段であって、参照資料を並べる手段ではない。

これはD26/D27で既に体現されていた設計と一致する：地図（`docs/instruments/hkd-map.js`）が実際に重ね合わせているのは、警報区域ポリゴン（気象庁の生きた警報データで塗り分けられる、まさに「今の状況」）と市町村境界ポリゴン（クリックで`config.js`の既存リンクへジャンプする「依代」であり、ポリゴン自体が情報ではない）の2層だけで、ハザードマップの中身そのものを地図側に取り込もうとはしていない。今回の調査結果は、この境界線をこのまま維持してよいという判断を確定させるものであり、**179件のハザードマップの実際のコンテンツ（PDF/Web地図）を地図に統合する方向には進まない**。参照資料は`市町村`（リンク集）が担い、地図（MCT）は「今の状況」の空間的把握に徹する、という役割分担がこれで裏付けられた。

HANDOVER.mdの「Open design thread: mappable vs. non-mappable data」のうち、外部ハザードマップの統合方針についてはこれで解決 — 残る未解決は、`warnings.js`/`quake.js`/`volcano.js`自身の（sas0が既に digest 済みの）生きたデータを、今以上に地図へ反映すべきかという、別の問いだけである。

## D47: リンクのみの情報源の計器化調査、および地震・火山ポイントを地図へ追加

D46でハザードマップ統合の方針が決着した後、残った「D46の続き」（`warnings.js`/`quake.js`/`volcano.js`自身のライブデータをどこまで地図に出すか）に着手する前に、その前提として、まだリンクのままの情報源のうちどれが計器化（fetchしてUIに digest する）できるのかを調査した。

**調査結果：JMA以外はすべて計器化不可能。** 強震モニタ（kmoni.bosai.go.jp）はHTTPS自体が存在せず、HTTPSの本サイトから`fetch`すると混在コンテンツとしてブラウザに問答無用でブロックされる — CORS以前の壁。北海道開発局 防災情報ポータルサイトはそれ自体がリンク集ページで単独のデータフィードを持たず、そのページが指す個別システム（ドラぷら道路情報XML、NOWPHAS波浪情報等）も個別に`curl -H "Origin: ..."`で確認したが`Access-Control-Allow-Origin`なし。北海道 旅の安全情報のページ内に北海道電力(HEPCO)停電情報RSS・札幌市新着情報XML等へのリンクを発見したが、これらも同様にCORSヘッダなし。川の防災情報・北海道防災ポータル・さっぽろ防災ポータルは既知（D20/D45）で変化なし。都合8件の非JMA情報源を新たに確認したが、CORSが開いていたものはゼロだった。

対照的に、**JMAの`bosai`API系統は全パスで`access-control-allow-origin: *`を返す**（404応答にすら付与されることを確認）。既にsas0が使っている天気図・警報・地震・火山の4系統に加え、未使用のアメダス（`bosai/amedas/`、観測点別の実況値）もCORSオープンを確認した。つまりsas0が計器を新設・拡張できる余地は、実質的にJMAの`bosai`API内に限られる — この静的・バックエンドなしのアーキテクチャの下では、日本の行政・インフラ系サイトのほぼ全てがCORSを開けていないという構造的制約が効いている。

**この調査から直接導かれた発見**：`quake.js`が使う`bosai/quake/data/list.json`の各エントリには`cod`フィールド（例：`"+43.5+142.9-10000/"`、ISO-6709ライク形式の緯度・経度・深さ）が、`volcano.js`が使う`bosai/volcano/const/volcano_list.json`の各火山には`latlon`フィールドが、**どちらも既に含まれている**。つまり地図に地震・火山のライブ状況をポイントとして重ねるのに、新規のデータ取得は不要——既存の2計器が使っているものと同じJSONを地図側でも独立にfetchするだけで済む。

**実装**：`docs/instruments/hkd-map.js`に`quake_points`/`volcano_points`の2つのGeoJSONソースと、`quake-epicenter`（円、色は`mag`によらず単色`#f5c542`、半径はmagで補間）・`volcano-point`（円、警戒レベル発表中は警報色`#e46a4a`、平常時は`#5c7089`）の2つのcircleレイヤーを追加。`fetchQuakePoints()`/`fetchVolcanoPoints()`は`quake.js`/`volcano.js`のフィルタ・整形ロジック（`isHokkaidoRelatedQuake`・`maxHokkaidoIntensity`・`HOKKAIDO_MONITORED_VOLCANO_CODES`・`extractVolcanoLevelName`）を独立に複製している——共有モジュール化はしていない。D10の「計器ファイルは自己完結」という既存方針（このファイル自体、既に`warnings.js`のHOKKAIDO_OFFICES/WARNING_KIND_NAMESを複製している）に揃えた。

**ホバー挙動**：既存の`mousemove`ハンドラに`quake-epicenter`・`volcano-point`をポリゴン層より優先してクエリするよう追加——カーソル直下に地震・火山ポイントがあればそれを最優先で表示し（カーソルに最も近い、より具体的な情報という位置づけ）、なければ従来通り市町村・警報ポリゴンの情報を表示する。クリック操作は追加していない——`ksj-n03-fill`（市町村ポリゴン）と違い、地震・火山ポイントには単一の明確なリンク先がなく（火山は既に`火山`（リンク集）が個別の協議会リンクを持っている）、ホバーのみで十分と判断した。

ブラウザで確認：地震ポイント（例：「根室半島南東沖／2026-08-25T18:07:00+09:00／M4.8　北海道内最大震度3」）・火山ポイント（例：「十勝岳／レベル２（火口周辺規制）」、警報色で着色）とも正しくホバー表示されること、市町村ポリゴンのクリック（リンクポップアップ）が引き続き正常に動作すること、コンソールエラーが既知のD4のみであることを確認した。

アメダス（観測点別の実況値）の計器化は、地震・火山ポイントより規模の異なる作業（新規計器の追加）であり、今回のスコープには含めていない——次に検討する候補として残す。

## D48: 地図を状況図に改称し、ルート先頭（気象庁より前）へ昇格

D47で地震・火山のポイントレイヤーを追加したことで、地図は「北海道の気象警報区域・市町村界を表示する」道具から「北海道の状況を空間的に把握する道具」へと役割が広がった。「地図」という名前はレンダリングしているものをそのまま説明しているだけで、この役割の広がりを表していない。ユーザーの判断で「状況図」に改称し、あわせて掲載順を気象庁より前（ルート先頭）に上げた。

**改称**：`docs/config.js`の`hkdMap.title`を`'地図'`から`'状況図'`に変更（`docs/instruments/hkd-map.js`の`registerInstrument`は`config.title || '状況図'`としており、config.js側が唯一の情報源）。

**並び替え**：`docs/core.js`の`order`フィールド（D28）はそのまま利用し、`docs/instruments/hkd-map.js`の`order`を2→1に、`docs/folders.js`の`気象庁`フォルダの`order`を1→2に入れ替えた。他の計器（強震モニタ以降）の`order`は変更していない——状況図と気象庁の2つだけが入れ替わり、それ以外の並びはD28/D43のまま。

D27以来の名称変更だが、D43の`hokkaido.js`（`防災情報`→`北海道 防災情報`）と同様、変更は`config.js`の1箇所（表示名の唯一の情報源）と`order`の2箇所（folders.js・hkd-map.js）に閉じており、DOM構造・イベントハンドラ・データ取得ロジックには一切手を入れていない。過去のDECISIONS.mdの記述（D26〜D47）は当時の名称「地図」のまま残す——決定の記録はその時点の状態を正確に描写すべきという方針（D43で確立済み）に従う。README.md/HANDOVER.md/CLAUDE.mdの現状記述は本コミットで「状況図」に更新した。

## D49: 火山ポイントの枠線を赤に — 地震ポイントとの見分けをつける

D47で追加した地震・火山の2つのポイントレイヤーは、どちらも似た大きさの円で、塗り色だけで区別する設計だった（地震：常に`#f5c542`、火山：警戒時`#e46a4a`／平常時`#5c7089`）。実際に状況図で両方が同時に画面に出た状態を見たユーザーから、「地震と火山の区別がつく方がいい」というフィードバックがあり、火山ポイントの`circle-stroke-color`を地震と共通だった`#0d1117`（背景に馴染む暗色）から赤`#e5484d`に変更した（`circle-stroke-width`も1.5→2に増やし、赤枠を視認しやすくした）。塗り色（警戒時/平常時）はそのまま——赤い枠線は「これは火山」という種別の識別だけを担い、警戒状態の表現とは独立させた。

`docs/instruments/hkd-map.js`の`volcano-point`レイヤーのpaint定義のみの変更。ブラウザで確認：大雪山（平常、灰色の塗り＋赤枠）・十勝岳（レベル2警戒、警報色の塗り＋赤枠）の両方で赤枠が正しく表示され、地震ポイント（黄色い塗り、暗色の枠のまま）と視覚的に見分けがつくことを確認した。

## D50: 警報なしの塗り色をグレーから淡い緑へ — 配色理論の整理

ユーザーから状況図についてフィードバックがあった：「警報が出ていないところの予報区・市区町村は灰色だけど、青森の白と比べて『無効なところ』という印象になっている。淡くて綺麗な緑色にして、アクティブに見ている・安心していい、というニュアンスにしよう」。

**根本原因**：警報なし状態の塗り色（旧`NO_WARNING_COLOR = '#243247'`、暗い紺グレー）が、`style.css`で罫線・区切り線などUIchrome全般に使っている中立色と偶然まったく同じ値だった。つまり「意図的な状態表示色」のつもりで選んだ色が、実際には「UIの背景・枠線」と視覚的に区別がつかず、結果として「この区域は何も表示していない＝機能していない」という誤読を招いていた。

**採用した配色理論**：色相（hue）でカテゴリを、不透明度（opacity）で強度を表す2チャンネル構成に整理した。

- **色相＝状態の種類**：`平常`（緑, 新規）→`注意報`（黄`#e4c74a`, 既存）→`警報`（オレンジ`#e46a4a`, 既存）→`特別警報`（マゼンタ`#d24aa8`, 既存）。これは気象庁自身の慣行（注意報＝黄、警報＝赤系、特別警報＝紫系）にほぼ従う既存の3色に、sas0独自の第4の色（平常＝緑）を足したもの——JMAの警報データ自体は「警報が出ている区域」しか列挙せず「平常」という状態そのものは存在しないため、地図上で全区域に必ず何らかの色を塗る以上、その"ゼロ点"の色はsas0が独自に決める必要がある。緑を選んだのは、信号機や一般的なステータスダッシュボードの「問題なし＝緑」という広く通用する慣習に合わせるため。
- **不透明度＝深刻度**：`平常`（0.4）→`注意報`（0.35→0.35のまま）→`警報`（0.35→0.42）→`特別警報`（0.35→0.5）と、警報レベルが上がるほど塗りが濃くなるようにした（`buildFillOpacityExpression`を新設、`buildFillColorExpression`と同じ`match`式パターン）。これにより「本当に危険な区域ほど視覚的に主張する」という優先順位が色だけでなく強さでも表現される。平常の0.4は他の階級より高いが、これは理論上の強度ランクとは別の実務的な理由——後述。

**実装上の発見**：ブラウザで実際に確認したところ、`stars.optgeo.org`の`bvmap-dark`ベースマップは名前に反して実際には白〜淡いグレーの明るい地色だった（スタイルJSON自体の`background-color`を確認して判明）。暗い背景を前提に低い不透明度で「淡い緑」を作ると、白背景の上ではほぼ白に埋もれて見えなくなってしまう——これはまさにユーザーが指摘した「無効に見える」問題を色を変えただけで再発させることになる。そのため`CALM_OPACITY`は他の階級より高め（0.4）に設定し、白背景上でも明確に「意図的な淡いミントグリーン」として視認できる値に調整した。色自体（`#5fae8c`）と不透明度の組み合わせは実機のブラウザで見比べながら決めた。

**適用範囲**：`jma-warning-fill`（予報区ポリゴン）に加え、火山ポイント（`volcano-point`）の「平常」時の塗り色も同じ`CALM_COLOR`に統一した——同じ「平常＝緑」という意味を地図全体で一貫させるため。D49で追加した赤い枠線（火山という種別の識別）とは独立して、塗り色は状態（平常/警戒）を表す。

`docs/instruments/hkd-map.js`の`SEVERITY_COLOR`/`SEVERITY_OPACITY`/`CALM_COLOR`/`CALM_OPACITY`定数と、`buildFillColorExpression`（`NO_WARNING_COLOR`→`CALM_COLOR`に改名）、新設`buildFillOpacityExpression`のみの変更。ブラウザで確認：北海道全域が青森（基本地図のまま、白）と明確に区別できる淡いミントグリーンで塗られること、市町村ホバー時の情報表示（例：「上川町／上川地方／現在、発表されている警報・注意報はありません。」）が引き続き正しく動作することを確認した。

## D51: 情報源拡張の調査（日赤・NPO・L-Alert・国交省内閣府系・在外公館・報道）— 「開放性」と「取り込まれたい度」は別軸という結論

D47（JMA以外はCORSが閉じている）を受け、ユーザーから「全国展開はまだ早い。他の主体からの情報の取り込みを考えたい」との提案があった。災害対策基本法の指定機関等（警察・消防・自衛隊・日赤・電力・通信会社）、有力NPO、札幌医大病院、国交省・内閣府の「取り込まれることを求めているサービス」、在札幌各国公館、国際系情報源を候補に、北海道限定・オープンデータのみ・取り込まれることを望まない主体は除外、という条件で調査した（後日、報道機関も追加調査）。

**警察・消防・自衛隊**：そもそも調査対象から外した——リアルタイム運用情報が公開されている前提自体が成立せず、仮にあったとしてもsas0が明言する「実際のEOC/C2/ミッション運営とは距離を置く」という立場（README「What is not sas0?」）と衝突するため、調査するまでもなく対象外と判断した。

**日本赤十字社北海道支部・道内NPO**（日赤北海道支部、北の国災害サポートチーム＝きたさぽ、北海道災害ボランティアセンター）：いずれも実在確認済みだが、更新はSNSや不定期掲示板頼りで構造化データ配信なし。**対象外〜参考程度**。

**L-Alert（公共情報コモンズ）**：総務省消防庁所管、都道府県・市町村等が発信する情報をテレビ・アプリ等の「利用者」に配信する基盤——設計思想としては「他システムへの再配信を前提」だが、実際の利用には運営団体（マルチメディア振興センター、2026年12月に総務省へ移管予定）への**利用者登録・契約が必須**で、無償・無登録の公開APIは存在しない。「取り込まれることを求めているように見える仕組みほど、実際には契約前提だった」という発見。**不採用**（D17の無登録原則に抵触）。

**国交省「不動産情報ライブラリ」防災系API**（洪水・高潮・津波浸水想定、土砂災害警戒区域等）：登録制のAPIキー発行が必須な上、公式マニュアルが「CORSエラー防止のためブラウザからAPIリクエストを送信しないこと」と明記——**登録必須・CORS非対応の二重の壁**。**不採用**。

**在札幌各国公館**：ユーザーは「米国や欧州、中国」を想定していたが、実際に札幌市公式ページ（`city.sapporo.jp/kokusai/consulate/`）で確認したところ、札幌に総領事館を置くのは**米国・韓国・ロシア・中国の4カ国のみで、欧州の国は皆無**だった（想定と異なる事実）。在札幌米国総領事館（`jp.usembassy.gov/alerts/`）は地震・津波等の個別事案アラートを実際に発信しており内容の質は良いが、在留米国人向けであり北海道全域向けではない。韓国・ロシア・中国の各総領事館サイトには防災専用セクションが見当たらなかった。**いずれもリンクどまりが妥当、新規計器化は不採用**。

**報道機関（NHK・北海道新聞）**：ユーザーの追加の問いを受けて調査。NHKはRSSを配信しているが利用規約で「転載・複製・二次利用」を明示的に禁止（NHK財団インターネットサービス利用規約）。北海道新聞はRSS（`hokkaido-np.co.jp/output/7/free/index.ad.xml`）自体は誰でも取得できるが`curl`で確認した結果CORSヘッダーなし、かつ規約に「見出し・本文をウェブサイト上などに公開する行為は許可されておりません」と明記——**技術的にも規約的にも二重に閉じている**。公共放送であっても商業紙であっても同じ結果になった。

**総括——2軸モデルの発見**：この調査全体から、情報源を評価する上で有用な一般原則が見えてきた。「アクセスの開放性（誰でも無登録で読めるか）」と「二次利用・再配信への意欲（取り込まれたいかどうか）」は、独立した別々の軸であり、経験的にはむしろ逆相関する傾向がある：

- 報道機関（NHK・北海道新聞）：アクセスは開いている（誰でもRSSを読める）が、二次利用は明示的に禁止——収益が情報の独占的な提示（広告・購読）に依存するため、他所での再利用は競合への無償供給になる。
- L-Alert・国交省API：二次利用は制度設計として前提（配信・再配信のための仕組み）だが、アクセス自体は登録・契約で閉じている——おそらく責任分界・品質管理のための門番。
- 気象庁・国土地理院：アクセスが開いていて（無登録・CORSオープン）、かつ二次利用も明示的に歓迎——この組み合わせは、収益構造が情報の独占に依存しない、法定インフラ的な公共任務を持つ組織に特有の性質であり、今回調査した中では他に見つからなかった。

この「開放性×取り込まれたい度」の2軸モデルは、今後sas0に新しい情報源を検討する際の判断基準として使える——両方が揃う情報源は稀少であり、見つけるたびに特筆すべき発見になる。北海道限定・オープンデータのみという制約の中では、情報源の「種類」を増やす拡張は当面手詰まりに近く、次の拡張は情報源を増やさない方向（表示・機能面の改善）を検討することとした。

## D52: 「北風と太陽」— 開放を促す二つの戦略の中で sas0/DWG7 が試みていること

D51の2軸モデル（開放性と、取り込まれたい度は独立した別軸）を踏まえ、この構造がより広い文脈でどう位置づけられるかをユーザーと検討した。この節はコードや機能の決定を記録するものではなく、プロジェクトの価値構造についての考察として残す。

地理空間情報の世界には、長らく「統合型GIS」「ジオポータル」——あらゆる主体のデータを標準化されたプロトコルで発見・結合可能にする——という理想があった。国家空間データ基盤の構築や、法制度・指令・ガイドラインによって参加を促す枠組みは、この理想を実現するための一つの戦略であり、いわば「北風」型——制度的な力によって、本来は関係的価値（データの価値がその内容そのものではなく、発信主体との関係性・帰属・説明責任に根ざしている場合）を守りたい主体にも開放を求めるアプローチである。

これに対しDWG7/sas0が実践しているのは、方向性としてその逆——「太陽」型の戦略である。強制はせず、すでに構造的にエゴレス（データの価値が発信主体との関係性に依存しない、fungibleな公共インフラ的性質を持つ）な情報源を正確に見極め、そこにだけ最大限投資して、強制なしに成立する有用なものを組み立てる。sas0のアーキテクチャそのものがこれを体現している：状況図が実際に重ね合わせているのは、fungibleな気象庁の警報データと、情報そのものではなく依代として使う市町村ポリゴンだけで、それ以外（関係的価値を持つ情報源）は統合しようとせず、リンクとしてその関係性を保ったまま外部に委ねる（D26/D27/D46）。

どちらの戦略が優れているという話ではない——北風と太陽は、同じ目標（地理空間情報の活用をより開かれたものにする）に対する異なる仮説であり、両方を試す価値がある。DWG7（UN Smart Maps Group）の "keep web maps open for a better world" という理念の中で、sas0は「強制なしにどこまで到達できるか」という、太陽型戦略の小さな実証実験として位置づけられる——あらゆるものを無理やり統合したジオポータルではなく、気象庁・国土地理院のような性格を持つ情報源が実在すれば、バックエンドも交渉も不要でこれだけのものが作れる、という最小限の存在証明。

一つ、留意点として残しておく：太陽型戦略には長期的な緊張がある。フラグメンテーションした情報源をリンクとして心地よく使えるものにしてしまうことは、実務的には正しい判断である一方、標準化・開放そのものへの圧力を弱めてしまう可能性もある。DWG7がこの緊張にどう向き合うか——たとえばD51の2軸モデルを、エゴのある主体に「気象庁・国土地理院型になることの具体的な利点」を示す説得材料として使う道はあるか——は、今後の検討課題として残しておく。
