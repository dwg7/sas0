# CLAUDE.md

Working notes for AI coding assistants in this repo. See [README.md](README.md) for what sas0 is, [DECISIONS.md](DECISIONS.md) for why it's built this way, and [HANDOVER.md](HANDOVER.md) for current state and open items.

## What this repo is

sas0 is a project of DWG7 (UN Smart Maps Group), a Domain Working Group of the [UN Open GIS Initiative](https://unopengis.org/). It is a static, zero-build GitHub Pages site — everything served lives under `docs/`, deployed straight from `main`, no bundler, no `package.json`, no CI.

## Before making changes

- **Read [DECISIONS.md](DECISIONS.md) before touching `docs/index.html` or `docs/core.js`.** The Open MCT bootstrap has several non-obvious constraints (CDN version pinning, `SharedWorker` disabling, the standard vs. headless start path) that silently produce a blank page if violated. This isn't hypothetical — the PR that introduced this code shipped broken in exactly these ways.
- Keep the scope minimal. The founding brief for this project explicitly rules out building an EOC, command-and-control software, chat/social software, workflow engines, databases, backend services, or auth/user management — see README's "What is not sas0?" section. When in doubt, prefer not adding a feature.
- **To add a new instrument**: create `docs/instruments/<name>.js` calling `SAS0.registerInstrument({ key, name, parentKey, render })`, add a `<script>` tag for it in `docs/index.html` *before* `boot.js`, and add any config it needs to `docs/config.js`. To add a new organization/grouping, call `SAS0.registerFolder({ key, name, parentKey })` in `docs/folders.js` first, then point instruments at it via `parentKey`. See [DECISIONS.md](DECISIONS.md) D10.
- Set `autoRefresh: false` on `registerInstrument()` for anything the user actively interacts with (an embedded map, an iframe) — the default periodic re-render (D10) will otherwise reset it mid-use. Only data-driven instruments (a fetched image, a fetched list) should auto-refresh.
- **Data that can be drawn on a map should go on the (eventual) shared map, not become its own tree instrument.** The tree/folder structure (D10) is for what can't be overlaid — warnings lists, quake logs, volcano tables. See [DECISIONS.md](DECISIONS.md) D13.
- Any new instrument source URL (image, iframe, etc.) needs a corresponding `allowedHosts` entry in `docs/config.js` and must go through `SAS0.getSafeUrl()` — don't assign to `.src` directly. See [DECISIONS.md](DECISIONS.md) D7.
- Before committing any change to a hardcoded external URL (a CDN pin, a placeholder image, an embed target), verify it actually resolves: `curl -sI <url>`. Several of the bugs fixed in this repo's history were exactly this — a URL that looked right but 404'd.
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
