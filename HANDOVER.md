# Handover

Current state of sas0, for whoever (human or AI) picks this up next.

## Status as of 2026-08-25

- **v0 is shipped and live**: [PR #1](https://github.com/dwg7/sas0/pull/1) merged to `main`, GitHub Pages enabled from `main`'s `docs/`, serving at <https://dwg7.github.io/sas0/>.
- **PR #1 as originally submitted did not actually render** — it hit four compounding Open MCT/CDN integration bugs (wrong version pin, missing clock plugin + wrong mount target, cross-origin `SharedWorker`, dead placeholder image URL). All were fixed in a follow-up commit before merging. Full detail and rationale: [DECISIONS.md](DECISIONS.md) D1–D6.
- Both instruments render: **Today's Weather Chart** (static placeholder image) and **Spiccato** (iframe embed). Confirmed on the live GitHub Pages site itself, not just a local test server — both the weather chart image and Spiccato's map UI (layer panel, Copy Map Intent/Copy Link buttons, basemap tiles) load correctly.

## Known open items

1. **Open MCT's own chrome is visible.** The console currently renders inside Open MCT's standard browse bar / left-hand tree / inspector panel (see [DECISIONS.md](DECISIONS.md) D5), not as a bare two-panel view. The original design brief called for "not a GIS, not an admin dashboard" — closer to just the two panels. If that matters going forward, the next step is CSS to hide/collapse Open MCT's own UI regions (tree, inspector) rather than more startup-sequence changes, since the headless/no-chrome startup path was tried and hit unrelated internal Open MCT errors.
2. **One harmless console error at startup** (`Cannot read properties of undefined (reading 'key')`), fires once, doesn't block anything. See [DECISIONS.md](DECISIONS.md) D4. Not chased further; worth re-checking if the Open MCT version is ever bumped.
3. **Weather chart is a static placeholder**, not live data — this was always the stated intent for v0 ("designed for future daily integration," see README).
4. **Repository homepage URL** (the GitHub repo metadata field, distinct from GitHub Pages itself) is not yet set to `https://dwg7.github.io/sas0/`. Cosmetic; someone with repo settings access can set it.

## Where to look

- [README.md](README.md) — what sas0 is/isn't, roadmap, live site
- [DECISIONS.md](DECISIONS.md) — why things are built the way they are, especially the Open MCT/CDN gotchas in D1–D7
- [CLAUDE.md](CLAUDE.md) — working notes for AI coding assistants in this repo

## Roadmap reminder

`sas0 → sas1 → SAS Console → CSS` (Chat Context Sharing, explicitly out of scope for now). See [README.md](README.md#roadmap).
