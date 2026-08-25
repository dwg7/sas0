# Decisions

Why sas0 is built the way it is. Numbered so other docs and commit messages can point at a specific entry (`see D3`).

## D1: Open MCT is loaded from a CDN, not vendored

sas0 is a zero-build static site (`docs/` served as-is by GitHub Pages), and the [original prompt](https://github.com/dwg7/sas0/pull/1) that kicked off this project explicitly ruled out backend/build infrastructure. Loading `openmct.js`/`espressoTheme.css` from unpkg keeps the repo free of a multi-MB vendored `dist/`, at the cost of a few CDN-specific integration issues — see D2–D5.

## D2: The Open MCT version is pinned to an exact, verified-to-exist release

The version that first shipped in PR #1 (`openmct@3.3.0`) does not exist on npm/unpkg — the CDN URL 404'd, so nothing loaded at all. `docs/index.html` currently pins `openmct@4.3.0-rc1` (bumped from the initial fix's `4.2.0` once the RC was confirmed to work end-to-end — see D8).

**Before bumping this version**, verify both of these resolve (a 404 on either means a silent blank page, since `docs/app.js` doesn't surface CDN load failures beyond a generic "Open MCT failed to load" throw):

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

`docs/app.js` now uses the standard, supported path instead:

```js
openmct.start(document.getElementById('app'));
openmct.on('start', () => {
  openmct.router.setPath(`/browse/${NAMESPACE}:${CONSOLE_IDENTIFIER.key}`);
});
```

This means Open MCT's own browse bar, left-hand tree, and inspector panel are visible around the two custom panels — a real deviation from "calm two-panel mission console, not GIS/admin dashboard." That's a known, accepted tradeoff for now: it's the code path Open MCT actually supports, versus more headless-mode debugging with no guarantee of success. If a chrome-free console remains a goal, the next step is probably CSS to hide/collapse Open MCT's own UI regions rather than bypassing its startup sequence.

## D6: The weather chart is live JMA data, fetched client-side, not a static placeholder

The placeholder URL shipped in PR #1 (`.../thumb/6/6f/Synoptic_weather_map.png/1280px-Synoptic_weather_map.png`) 404'd; it was briefly replaced with a working but still-static Wikimedia Commons file, then replaced again with the Japan Meteorological Agency's actual surface weather chart (天気図) — matching the "designed for future daily integration" intent from the original v0 scope instead of deferring it.

JMA does not publish a stable `latest.png`. `https://www.jma.go.jp/bosai/weather_map/data/list.json` is a JSON index of currently-available chart filenames (refreshed every few hours, oldest-first); the actual chart image lives at `https://www.jma.go.jp/bosai/weather_map/data/png/<filename>`. Both endpoints send `Access-Control-Allow-Origin: *`, so `docs/app.js`'s `loadLatestWeatherChart()` can `fetch()` the list client-side and set `<img src>` to `imageBaseUrl + timeline[timeline.length - 1]` (the last, i.e. most recent, entry in `near.now`) — no backend, no build step, no hardcoded filename to go stale.

If that fetch fails (offline, JMA outage, CORS policy change) it fails silently to an empty `<img>` — no fallback image, since JMA is now the only intended source. `weather.imageBaseUrl`/`weather.listUrl` in `docs/config.js` still go through the same `getSafeUrl()` host-allowlist check as any other instrument source (D7).

**Attribution**: JMA content is licensed under Japan's "公共データ利用規約（第1.0版）" (Public Data License v1.0), which requires a specific citation format — `出典：気象庁ホームページ　（当該ページのURL）`. `weather.sourceLabel` in `docs/config.js` uses that exact template and is rendered as a link to `weather.sourceUrl`, deliberately in Japanese even though the rest of the UI is English, since it's a legal citation requirement, not UI copy. Don't reword it.

## D7: Instrument sources are constrained to an explicit host allowlist

`docs/app.js`'s `getSafeUrl()` only assigns `weatherImage.src` / `spiccatoFrame.src` if the URL's protocol is `https:` and its hostname is in `config.js`'s `allowedHosts` for that instrument — otherwise it silently falls back to `''` / `about:blank`. This was already in place from PR #1 and is worth preserving as new instruments are added: `config.js` should never be trusted to only ever contain safe values, since it's the one file most likely to get casually hand-edited later.

## D8: Open MCT is pinned to the current release candidate, and `start()` uses the selector form

Once the D1–D5 fixes were confirmed working end-to-end on `openmct@4.2.0` (the latest non-RC release at the time), the pin was bumped to `openmct@4.3.0-rc1` — the newest release on npm overall — and re-verified against the same checklist (D2), including a fresh check of D3's `SharedWorker` behavior and D4's harmless indexer error, both unchanged.

The bump surfaced one genuine API improvement worth adopting: `openmct.start()` on 4.3 accepts a CSS selector string, not just an `Element`, and defers its own bootstrap until `DOMContentLoaded` if called while the document is still loading. `docs/app.js` now calls `openmct.start('#app')` instead of `openmct.start(document.getElementById('app'))` — one less DOM lookup to keep in sync with `docs/index.html`'s markup, and it degrades to a clear thrown error (rather than a silent no-op) if `#app` is ever removed from `docs/index.html`.

Being on an RC means the next Open MCT release could change or remove that selector-string support before it's finalized — if a future version bump ever throws on `openmct.start('#app')`, that's the first thing to check.

## D9: The Spiccato iframe's sandbox includes `allow-same-origin`

Reported symptom: Spiccato's MapLibre GL JS map didn't render in Brave, and turning off Brave's "Block fingerprinting" Shields setting didn't fix it — ruling out the general WebGL-fingerprinting-protection explanation (Brave issue [#4400](https://github.com/brave/brave-browser/issues/4400) and friends).

The actual cause is specific to how this iframe is embedded: `dwg7.github.io/spiccato/` and `dwg7.github.io/sas0/` are the same origin in production (origin is scheme+host+port, not path), but `docs/config.js`'s `sandbox` value originally omitted `allow-same-origin`, which forces a sandboxed iframe into an opaque, unique origin regardless of where it's actually served from. Per Brave's own documented behavior, "if an iframe is first party to the top-level origin and the sandbox attribute is set, it will be blocked unless `sandbox="allow-same-origin"` is set" — Brave can't distinguish "deliberately extra-sandboxed same-site content" from "genuinely third-party content," and applies its stricter third-party WebGL/fingerprinting restrictions to the opaque-origin frame either way, independent of the page-level Shields toggle.

Fix: `spiccato.sandbox` in `docs/config.js` is now `'allow-scripts allow-forms allow-same-origin'`, and `getSafeSandbox()`'s token allowlist in `docs/app.js` was extended to permit `allow-same-origin`. This is safe specifically *because* Spiccato is same-origin with sas0 in production — `allow-same-origin` would be a real isolation reduction for a genuinely third-party embed, but grants nothing here that the browser's own same-origin policy wasn't already going to allow.

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

- **市町村 (municipalities)**: Hokkaido has 179 municipalities — far too many for a flat list under one folder. `docs/folders.js` groups them by 振興局 (subprefecture, Hokkaido's own 14-way regional division), and a subprefecture folder is only created once it actually has a municipality registered under it (same "don't create empty folders" discipline as the original 開発局/札幌市 decision in HANDOVER.md). Only 札幌市 (石狩振興局) and 釧路市 (釧路総合振興局) are populated so far, each linking to that city's own hazard map page — `docs/instruments/municipalities.js` reads `config.municipalities` (an array of `{folderKey, key, title, description, url}`) and registers one link-card instrument per entry, so adding the next municipality is one array entry, not new code.
- **火山 (volcano councils)**: a *different* grouping from the existing 火山情報（北海道の火山） status list (D11) — that one shows current alert level for all ~20 monitored Hokkaido-mainland volcanoes; this one is specifically about each volcano's 火山防災協議会 (disaster prevention council) and its evacuation planning, and is scoped to the **9 volcanoes that actually have one established**: アトサヌプリ, 雌阿寒岳, 大雪山, 十勝岳, 樽前山, 倶多楽, 有珠山, 北海道駒ヶ岳, 恵山 (Hokkaido's 常時観測火山, "constantly monitored" volcanoes — council establishment tracks this designation, not the full monitored-volcano list). Each links to JMA's own summary page for that volcano's council (`https://www.data.jma.go.jp/vois/data/sapporo/{code}_{slug}/{code}_bousai.html`, verified individually — two of the nine had a different URL slug than the naive romanization, `108_Tokachi` and `113_Komagatake` rather than `_Tokachidake`/`_Hokkaidokoma`). This is JMA's council-overview page, not necessarily the council's own published evacuation-plan document directly — finding and linking each council's actual deliverables (not just JMA's summary of them) is a further refinement, not yet done.

Both use `docs/instruments/*.js` files that loop over a `config.js` array and call `SAS0.registerInstrument()` once per entry — the same registry primitives as every other instrument (D10), just driven by a list instead of one call per file.

## D16: Why Open MCT

Not a constraint to work around, but a deliberate choice worth stating: Open MCT is NASA's own mission-control framework, built for and proven in genuinely high-stakes operations (spacecraft and ground-system monitoring, where a confusing or unreliable display has real consequences) — not a toy or a generic admin-dashboard template. Its core abstraction (D10: Object API + Composition API + View API, decoupling *what data is* from *how it's organized* from *how it's shown*) is exactly the right shape for "many heterogeneous sources, one operator, switch between them at a glance," whether that operator is monitoring a spacecraft or a regional government's disaster status board.

Using it here is also a small demonstration of something DWG7 cares about directly: that the same open-source engine NASA built for an elite, high-stakes mission works, unmodified at its core, for grassroots civilian public-safety awareness — the object/composition/view model doesn't care whether the "telemetry" is a spacecraft's battery temperature or a JMA warning feed. That's a concrete instance of "keep web maps open for a better world," not just a slogan: adopting and crediting NASA's own open engine, rather than reinventing a bespoke one, is itself an act of interoperability.

## D17: Open data only — and why that's a feature, not a gap

sas0 deliberately aggregates only data that is already, genuinely publicly accessible — JMA's public JSON feeds, GSI's public hazard map portal, municipalities' own published hazard map pages. It does not integrate, and is not the place to integrate, any organization's internal, restricted, or otherwise protected situational information, even if a future user of this codebase has access to such data and is tempted to add it.

This is a deliberate boundary, not a limitation to eventually remove, for two reasons:

1. **Respect for protected information and the missions that handle it.** This project takes no position on, and makes no claim to, the internal operational systems that actual disaster response depends on — see README's "What is not sas0?" (not an EOC, not command-and-control software). Blurring that line, even with good intentions, would misrepresent both what sas0 is and the seriousness of the systems it deliberately doesn't touch.
2. **The open-only scope is itself the useful output.** Proving that a click-through, Open MCT-based instrument architecture (D10) can be built entirely from public data, with no backend and no build step (D1), is a piece of technology validation in its own right. If an organization later needs an *internal* service that integrates its own non-public situational data, the architecture proven here — not sas0 itself, and not its data — is the reusable part. That hypothetical internal service would be a separate, appropriately access-controlled system; sas0's job is to make sure the underlying pattern is already known to work.

This follows directly from DWG7's own stated mission ("keep web maps open for a better world") and its practice of testing new technology in the open (D16) — the contribution here is to access and interoperability in the open-data space, made in a way that doesn't presume to speak for, or reach into, the protected space.
