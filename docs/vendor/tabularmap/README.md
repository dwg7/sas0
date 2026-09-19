# tabularmaps/do — vendored

Vendored from https://github.com/tabularmaps/do at commit
`1042202cce54d2d224708d9d740c4a2ded06d863` (2026-09-19). Not sas0's own code —
see [DECISIONS.md](../../../DECISIONS.md) D77 for why it's vendored (not
loaded at runtime from tabularmaps.github.io) and how sas0 wires it into the
警報・注意報 instrument (`docs/instruments/warnings.js`).

To pick up an update from upstream, re-fetch these files at a newer commit
and re-check D77's integration points (`fetchJson`/`codesUrl`/`colors`
options into `TabularMapsJmaWarnings.create()`, the `.tm-dark` class forcing
dark palette regardless of OS `prefers-color-scheme`, and the container
height requirement noted in `tabularmap.js`'s own header comment).
