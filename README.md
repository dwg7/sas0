# sas0

sas0 stands for **Situational Awareness as a Service Console**.

It is a Version 0 experiment to explore public situational awareness as a shared public good using a lightweight mission-console style interface.

## What is sas0?

sas0 is a static GitHub Pages prototype built with Open MCT.

It asks a narrow question: can publicly available instruments be assembled into a calm, readable, shared awareness console without building command infrastructure?

For this concept validation phase, sas0 intentionally stays minimal and displays exactly two instruments:

1. **Today's Weather Chart** (placeholder image-backed for now, designed for future daily integration)
2. **Spiccato** (embedded from the existing deployment)

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

- Open MCT
- DWG7
- UN Open GIS

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

This repository is GitHub Pages oriented and static-only.

All deployable application files live in `docs/`:

- `docs/index.html`
- `docs/app.js`
- `docs/style.css`
- `docs/config.js`
