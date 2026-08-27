# CLAUDE.md

Working notes for AI coding assistants in this repo. See [README.md](README.md) for what sas0 is, [DECISIONS.md](DECISIONS.md) for why it's built this way, and [HANDOVER.md](HANDOVER.md) for current state and open items.

## What this repo is

sas0 is a project of DWG7 (UN Smart Maps Group), a Domain Working Group of the [UN Open GIS Initiative](https://unopengis.org/). It is a static, zero-build GitHub Pages site — everything served lives under `docs/`, deployed straight from `main`, no bundler, no `package.json`, no CI. `scripts/check-links.sh` (D22) is a manual maintenance tool run by hand, not an exception to this — nothing in the repo invokes it automatically.

## Project philosophy — read before adding a data source

- **Open data only, as a hard boundary, not a TODO.** Every instrument here (D11, D15) pulls from data that's already genuinely public — JMA's feeds, GSI's portal, municipalities' own published pages. Never add an authenticated, internal, or otherwise non-public data source to sas0, even if a future maintainer happens to have access to one. This isn't an oversight to eventually fix — see [DECISIONS.md](DECISIONS.md) D17 for why: the open-only scope is itself the point (proving the architecture works from public data, no backend), and a future *internal* service integrating protected data would be a separate, properly access-controlled project, not a mode of this one.
- **Respect for protected information and the missions that handle it.** sas0 deliberately stays out of the way of real EOC/command-and-control/incident-management systems (README's "What is not sas0?"). When writing anything user-facing — an instrument description, a doc, a commit message — don't imply this project has, needs, or should have access to operational/restricted systems, and don't understate what's actually at stake for the real missions it deliberately doesn't touch.
- **Why Open MCT specifically** is not incidental — see [DECISIONS.md](DECISIONS.md) D16. Keep that framing (NASA's own mission-control engine, reused unmodified for open civilian data) in mind when it's relevant, rather than treating Open MCT as an interchangeable dashboard library.
- **User-facing text is Japanese**, including instrument names, descriptions, and UI copy — this project's primary audience reads Japanese, and mixing languages in the running UI reads as unfinished. Proper nouns that are genuinely names (e.g. "Spiccato") stay as-is. This repo's own docs (README/DECISIONS/HANDOVER/CLAUDE) stay in English by prior decision — the language split is by audience (docs = maintainers, UI = end users), not inconsistency.

## Before making changes

- **Read [DECISIONS.md](DECISIONS.md) before touching `docs/index.html` or `docs/core.js`.** The Open MCT bootstrap has several non-obvious constraints (CDN version pinning, `SharedWorker` disabling, the standard vs. headless start path) that silently produce a blank page if violated. This isn't hypothetical — the PR that introduced this code shipped broken in exactly these ways.
- Keep the scope minimal. The founding brief for this project explicitly rules out building an EOC, command-and-control software, chat/social software, workflow engines, databases, backend services, or auth/user management — see README's "What is not sas0?" section. When in doubt, prefer not adding a feature.
- **To add a new instrument**: create `docs/instruments/<name>.js` calling `SAS0.registerInstrument({ key, name, parentKey, render })`, add a `<script>` tag for it in `docs/index.html` *before* `boot.js`, and add any config it needs to `docs/config.js`. To add a new organization/grouping, call `SAS0.registerFolder({ key, name, parentKey })` in `docs/folders.js` first, then point instruments at it via `parentKey`. See [DECISIONS.md](DECISIONS.md) D10.
- Set `autoRefresh: false` on `registerInstrument()` for anything the user actively interacts with (an embedded map, an iframe) — the default periodic re-render (D10) will otherwise reset it mid-use. Only data-driven instruments (a fetched image, a fetched list) should auto-refresh.
- **Data that can be drawn on a map should go on the (eventual) shared map, not become its own tree instrument.** The tree/folder structure (D10) is for what can't be overlaid — warnings lists, quake logs, volcano tables. See [DECISIONS.md](DECISIONS.md) D13.
- Any new instrument source URL (image, iframe, etc.) needs a corresponding `allowedHosts` entry in `docs/config.js` and must go through `SAS0.getSafeUrl()` — don't assign to `.src` directly. See [DECISIONS.md](DECISIONS.md) D7.
- Before committing any change to a hardcoded external URL (a CDN pin, a placeholder image, an embed target), verify it actually resolves: `curl -sI <url>`. Several of the bugs fixed in this repo's history were exactly this — a URL that looked right but 404'd.
- **When picking up this repo after a gap, or after adding several new outbound links in one session, run `./scripts/check-links.sh`** to re-verify every URL in `docs/config.js`/`docs/instruments/*.js` still resolves — links added correctly can still go stale later (a page moves, a site restructures). This is a manual tool, not CI (see below) — it doesn't run itself, so re-running it periodically is the only thing that makes it useful. A `FAIL` isn't automatically real: check `warnings.js`'s JMA URL template and `weather.js`'s `imageBaseUrl` are expected permanent false positives (base URLs for runtime concatenation, not fetchable pages), and some sites bot-block plain `curl` even when fine in a real browser (D20's river.go.jp). See [DECISIONS.md](DECISIONS.md) D22 for the full reasoning, including why client-side/automatic detection isn't used instead.
- If an iframe's `sandbox` needs a new token, add it to `getSafeSandbox()`'s allowlist in `docs/core.js`, not just `config.js` — the allowlist is what actually gets applied. Only add `allow-same-origin` for a source that's genuinely same-origin with sas0 in production (see [DECISIONS.md](DECISIONS.md) D9); for anything actually third-party (D12), granting it would be a real isolation loss, not a no-op.
- `docs/index.html` currently pins Open MCT to a release candidate (`4.3.0-rc1`, D8), not a final release. Re-run D2's `curl -sI` checklist before bumping it, and don't assume this stays a placeholder concern forever — check whether the RC has since gone final.

## Local preview

No build step. Serve `docs/` directly:

```bash
cd docs && python3 -m http.server 8000
```

Then open `http://localhost:8000/index.html`. Check the browser console — Open MCT bootstrap failures are often silent beyond a generic thrown error, so console errors are the primary signal something's wrong.

## License and attribution

CC0 1.0 Universal ([LICENSE](LICENSE)) — public domain. No attribution is legally required, but this is DWG7/UN Open GIS Initiative work; keep that context in README-facing docs rather than stripping it out.
