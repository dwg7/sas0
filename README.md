# sas0

sas0 stands for **Situational Awareness as a Service Console**.

It is a Version 0 experiment to explore public situational awareness as a shared public good using a lightweight mission-console style interface.

sas0 is a project of **DWG7 (UN Smart Maps Group)**, a Domain Working Group of the [UN Open GIS Initiative](https://unopengis.org/) — "keep web maps open for a better world."

## Live site

<https://dwg7.github.io/sas0/>

## What is sas0?

sas0 is a static GitHub Pages prototype built with Open MCT.

It asks a narrow question: can publicly available instruments be assembled into a calm, readable, shared awareness console without building command infrastructure?

For this concept validation phase, sas0 intentionally stays minimal and displays exactly two instruments:

1. **Today's Weather Chart** (placeholder image-backed for now, designed for future daily integration)
2. **[Spiccato](https://dwg7.github.io/spiccato/)** (embedded, unmodified, from its existing deployment)

## What is not sas0?

sas0 is explicitly not:

- EOC software
- command-and-control software
- chat software
- GIS software
- incident management software

It also does not include backend services, databases, authentication, workflows, or user management.

## Inspiration

sas0 is inspired by ideas and ecosystems around:

- [Open MCT](https://nasa.github.io/openmct/) (NASA's mission control framework)
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

- `docs/index.html` — loads Open MCT from a pinned CDN version, then `config.js` and `app.js`
- `docs/app.js` — registers the `sas0.console` object type/view and starts Open MCT
- `docs/config.js` — instrument titles, URLs, and host allowlists
- `docs/style.css` — layout and theme for the two-panel view

Open MCT has a few integration quirks specific to loading it from a CDN into a static site (a wrong CDN pin will silently render a blank page) — see [DECISIONS.md](DECISIONS.md) before changing `docs/index.html` or `docs/app.js`.

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
