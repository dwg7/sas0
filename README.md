# sas0

sas0 stands for **Situational Awareness as a Service Console**.

It is a Version 0 experiment to explore public situational awareness as a shared public good using a lightweight mission-console style interface.

sas0 is a project of **DWG7 (UN Smart Maps Group)**, a Domain Working Group of the [UN Open GIS Initiative](https://unopengis.org/) — "keep web maps open for a better world."

## Live site

<https://dwg7.github.io/sas0/>

## What is sas0?

sas0 is a static GitHub Pages prototype built with Open MCT.

It asks a narrow question: can publicly available instruments be assembled into a calm, readable, shared awareness console without building command infrastructure?

Rather than a fixed layout, sas0 uses Open MCT's own browse tree as its navigation: each instrument is a separate object, one click away, grouped into folders by organization. The current tree (driven by a small Hokkaido disaster-preparedness use case, but arbitrary to extend):

```
状況認識サービス0 (sas0)
├─ 気象庁
│   ├─ 天気図                    — latest JMA surface weather chart, fetched live
│   ├─ 警報・注意報（北海道）      — active JMA advisories/warnings across Hokkaido's 8 forecast regions
│   ├─ 地震情報（北海道関連）      — recent earthquakes affecting Hokkaido
│   └─ 火山情報（北海道の火山）    — current alert level for Hokkaido's ~20 monitored volcanoes
├─ 北海道                        — external link card (embedding blocked by the prefecture's own site)
├─ 国土地理院
│   └─ ハザードマップポータル      — external link card (this app doesn't tolerate iframe sandboxing — D14)
├─ 市町村                        — grouped by 振興局 (subprefecture); starting with 札幌市, 釧路市
├─ 火山                          — one link per volcano with an established 火山防災協議会 (a
│                                   narrower, differently-organized set than 気象庁's alert list above)
└─ [Spiccato](https://dwg7.github.io/spiccato/) — embedded, unmodified, from its existing deployment
```

Each instrument is a single full-screen view — click it in the left-hand tree, look, click the next one. See [DECISIONS.md](DECISIONS.md) D10 for why this replaced the original fixed two-panel layout, and how to add another instrument or organization.

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

- `docs/index.html` — loads Open MCT from a pinned CDN version, then the scripts below, in order
- `docs/core.js` — Open MCT bootstrap; defines `SAS0.registerFolder()`/`SAS0.registerInstrument()` and the shared `getSafeUrl()`/`getSafeSandbox()`/`renderIframe()`/`renderLinkCard()` helpers
- `docs/folders.js` — declares the organization folders (気象庁, 北海道, 国土地理院, 市町村 and its 振興局 subfolders, 火山) that instruments attach to
- `docs/instruments/*.js` — one file per instrument or instrument group (weather, warnings, quake, volcano, spiccato, gsi-hazard, hokkaido-link, municipalities, volcano-councils), each calling `SAS0.registerInstrument()` (the last two loop over a `config.js` array to register several at once)
- `docs/boot.js` — calls `SAS0.start()`; must load last, after every instrument has registered
- `docs/config.js` — instrument titles, URLs, host allowlists, and iframe sandbox tokens
- `docs/style.css` — shared instrument layout and per-instrument styling (warning severity colors, link cards, etc.)

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
