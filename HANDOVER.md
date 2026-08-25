# Handover

Current state of sas0, for whoever (human or AI) picks this up next.

## Status as of 2026-08-25

- **v0 is shipped and live**: [PR #1](https://github.com/dwg7/sas0/pull/1) merged to `main`, GitHub Pages enabled from `main`'s `docs/`, serving at <https://dwg7.github.io/sas0/>.
- **PR #1 as originally submitted did not actually render** — it hit four compounding Open MCT/CDN integration bugs (wrong version pin, missing clock plugin + wrong mount target, cross-origin `SharedWorker`, dead placeholder image URL). All were fixed in a follow-up commit before merging. Full detail and rationale: [DECISIONS.md](DECISIONS.md) D1–D6.
- **Open MCT is pinned to `4.3.0-rc1`** (the current release, bumped up from the `4.2.0` used in the initial fix once re-verified against it — [DECISIONS.md](DECISIONS.md) D8), and `openmct.start()` uses the newer selector-string form (`'#app'`).
- Both instruments render on the live site: **Today's Weather Chart** is now the actual, live [JMA surface weather chart](https://www.jma.go.jp/bosai/weather_map/) (fetched client-side, not a placeholder — [DECISIONS.md](DECISIONS.md) D6), and **Spiccato** is the iframe embed with its map UI (layer panel, Copy Map Intent/Copy Link buttons, basemap tiles) loading correctly.

## Known open items

1. **Open MCT's own chrome is visible.** The console currently renders inside Open MCT's standard browse bar / left-hand tree / inspector panel (see [DECISIONS.md](DECISIONS.md) D5), not as a bare two-panel view. The original design brief called for "not a GIS, not an admin dashboard" — closer to just the two panels. If that matters going forward, the next step is CSS to hide/collapse Open MCT's own UI regions (tree, inspector) rather than more startup-sequence changes, since the headless/no-chrome startup path was tried and hit unrelated internal Open MCT errors.
2. **One harmless console error at startup** (`Cannot read properties of undefined (reading 'key')`), fires once, doesn't block anything. See [DECISIONS.md](DECISIONS.md) D4. Confirmed present, unchanged, on `4.3.0-rc1` too — not version-specific, not chased further.
3. **Open MCT is pinned to a release candidate** (`4.3.0-rc1`, D8). RCs can change before final release; if a future bump throws on `openmct.start('#app')`, check whether selector-string support changed.
4. **Brave rendering fix is unverified in actual Brave.** A user reported Spiccato's map not rendering in Brave (MapLibre/WebGL), even with Brave's "Block fingerprinting" Shields setting turned off. Diagnosed as Brave's documented behavior of restricting sandboxed-but-first-party iframes lacking `allow-same-origin`; fixed by adding that token (D9). This repo's tooling has no Brave instance to confirm against — needs a real check in Brave. If the map still doesn't render there, revisit D9's fallback hypothesis (Brave's general third-party-iframe WebGL fingerprinting noise, independent of the sandbox issue).

## Where to look

- [README.md](README.md) — what sas0 is/isn't, roadmap, live site
- [DECISIONS.md](DECISIONS.md) — why things are built the way they are, especially the Open MCT/CDN gotchas in D1–D7
- [CLAUDE.md](CLAUDE.md) — working notes for AI coding assistants in this repo

## Roadmap reminder

`sas0 → sas1 → SAS Console → CSS` (Chat Context Sharing, explicitly out of scope for now). See [README.md](README.md#roadmap).
