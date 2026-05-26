# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read this first

`CLAUDE_CODE_HANDOFF.md` is the authoritative spec for the original v2 — content rules, brand system, and the §7 structural fork. `WAVE-NOTES-2026-05-18.md` documents the v3 upgrade ("The Complete Roofing Lexicon"). Read both before editing.

## What this repo is

A single-file static web app: a branded training + certification platform ("The Complete Roofing Lexicon") for Justen Newton Media — covering commercial, residential, hail forensics (dedicated module with threshold reference + 9-step test-cut protocol), insurance restoration, claims vocabulary, plain-English translation drills, pro-grade report-language coaching, and role-based recommended curricula. Everything — HTML, CSS, all JS, all data — lives in `index.html` (~2,500 lines).

**Test harness, but no build.** As of 2026-05-23 the repo has a `package.json` + `playwright.config.js` + `tests/` for an automated test suite (28 specs). The app itself is still buildless — `package.json` exists only to install Playwright and a static file server. There is no transpilation, no bundling, no dev server for the app. The PWA layer adds `manifest.json`, `sw.js`, and three PNG icons in the repo root.

The app has three certification levels: L1 Apprentice (80%, tier-1 vocab, 16 Q), L2 Field Roofing Professional (85%, tier 1–2, 20 Q), L3 Claims & Forensics Specialist (90%, all tiers including forensic, 22 Q). When a user sets a role in Profile, the Overview shows a 5-step recommended path tuned to that role with deep-links into the right module + pre-filter.

Deployment: GitHub push → Zeabur auto-detects as a static site and redeploys `index.html` at the placeholder domain `lexicon.justennewton.media`. External runtime deps: Google Fonts and `qrious` from cdnjs (both have graceful fallbacks); Plausible analytics is wired in `<head>`.

## How to run / iterate

- **Preview:** open `index.html` directly in a browser, or `python -m http.server 8000` from the repo root and visit `localhost:8000`. There is no dev server, no hot reload, no linter for the app itself.
- **Test:** `npm install` (one time), then `npm test` to run the full Playwright suite (28 specs, ~30 s). `npm run test:ui` opens the Playwright UI; `npm run test:headed` shows the browser. Tests serve the repo root over `http-server` on port 8765 — same fixture you'd open manually.
- **Deploy:** `git push`. Zeabur handles the rest. No Dockerfile, no config file.
- **No build step exists for the app. Do not add one** (see hard rule §3.2 in the handoff). `package.json` is test-only and explicitly declares `"private": true`.
- **Regenerate PWA icons** if the brand colors or seal letterforms change: `node tools/generate-icons.js`. Outputs `icon-192.png`, `icon-512.png`, `icon-maskable.png` to repo root.

## Architecture inside `index.html`

Single `<script>` block, ordered:

1. **Data**: `CATS` (17 category groups), `TIER_NAME` (1=Apprentice, 2=Journeyman, 3=Forensic), `TERMS` (~223, shape `{t, c, tier, d, n?, vf?, see?}` — `t` is the unique key), `SCENARIOS` (16), `COMPAT` (26), `PLAIN_ENGLISH` (41-entry dictionary keyed by term name, shape `{pe, nts}`), `REPORT_PAIRS` (20-entry array, shape `{topic, rel, poor, better, best, why}`), `LEVELS` (3-entry config for L1/L2/L3 certifications), `HAIL_THRESHOLDS` (11-row reference table), `TEST_CUT_STEPS` (9-step protocol checklist), `CURRICULA` (role→5-step path map for 12 roles). Anchor on the `/* ===== Residential & Steep-Slope ===== */`, `/* ===== Hail Forensics — reference data ===== */`, `/* ===== Building-Owner Translation Mode ===== */`, etc. block comments when locating sections.
2. **Engine**: `Store` (localStorage wrapper with in-memory fallback; state key `crl_v2_state` — kept on v2 even though `state.v=3`, so existing users' progress survives), `defState()` (now includes `role, location, prefs:{dark,passcode}, mgrUnlocked`), `loadState`/`saveState` (deep-merges `prefs` for forward compatibility), `applyTheme()` (toggles `html.dark`), `state`, `RENDER` map, `track(n)` Plausible helper, `VIEWS` nav array, `renderNav`, `go(v)`.
3. **Modules** (13 tabs in `VIEWS`): `RENDER.overview` (renders the role-based curriculum panel when `state.role` is set), `RENDER.lexicon` (+ `drawLex`, `termCard`), `RENDER.flash` (Leitner SRS), `RENDER.quiz` (4 modes incl. Speed Round; bumps `state.cards[t].missed/seen` per answer), `RENDER.scenarios`, `RENDER.compat`, `RENDER.hail` (wave 3 — threshold table + interactive 9-step protocol + 4 practice deep-link cards), `RENDER.owner` (wave 2 — Plain-English drill with reveal + don't-say-this), `RENDER.report` (wave 2 — poor/better/best step-reveal with filter chips), `RENDER.certify` (wave 2 refactor — 3-level picker, `buildCert(level)`, level-aware certificate, `refNo` → JNM-CRL-XXXXXX IDs), `RENDER.profile`, `RENDER.manager` (passcode-gated, default `ROOF123`, exports CSV/JSON, cert table has Level column), `RENDER.about` (QR via qrious).

Curriculum dispatcher is `runCurriculumAction(a)`. Action shorthand: `lexicon`/`certify`/etc. (bare view), `lex:hailforensics` (Lexicon + pre-filtered to group), `rep:claims` (Report Lang + filter), `flash:t:1` (Flashcards + Apprentice-tier deck).
4. **Init** at file end.

When adding a module: register it in `VIEWS`, add a `<section id="…" class="view">` in the body, add a `RENDER.<key>` function, and fire a `track("…")` event for any meaningful completion so Justen can wire it to a Plausible goal.

Per-card schema is `{box, seen, missed, last}` (Leitner: box 0–5, mastered at ≥5). Both flashcards (`fcMark`) and quizzes write to it. The Manager's "most-missed" table reads `.missed`/`.seen`.

## Editing rules (non-obvious, easy to break)

- **Edit in place. Never rewrite the file wholesale** — past full-file rewrites truncated. Use targeted `Edit` calls.
- **Originality is a legal requirement.** Term scope was *informed by* Brian Lemke's Building Owners Guide, plus NRCA/ASTM. Every definition was written independently and must stay that way. Credit Lemke / NRCA / ASTM as references in About + footer; never copy or closely paraphrase source text. See handoff §3.1.
- **Verify dated facts before writing definitions.** Source material is years old (e.g., "Firestone Building Products" is now Elevate/Holcim; ASTM specs get revised). Use the existing `vf` "Verify Current Spec" flag on time-sensitive terms.
- **Storage compatibility.** `Store` must keep its in-memory fallback so the app runs in sandboxed previews where localStorage throws. If you change the `state` shape, bump a version in the key or migrate on load.
- **Domain + assets are live:** App is bound at `https://lexicon.justennewton.media` (apex `justennewton.media` registered at Namecheap; CNAME → `complete-roofing-lexicon.zeabur.app`; Caddy auto-issues TLS). `og-cover.png` (1200×630) is committed in repo root and serves from the live host.
- **PWA layer exists.** `manifest.json` + `sw.js` + `icon-{192,512,maskable}.png` ship to the same origin. Service worker version constant in `sw.js` (`VERSION`) must be bumped any time the shell changes (HTML, icons, og-cover, manifest) — otherwise existing installs stay on the previous shell.
- **Testing surface.** `window.__crl` exposes a curated set of pure functions + data (`TERMS, CATS, LEVELS, SCENARIOS, COMPAT, TEST_CUT_STEPS, HAIL_THRESHOLDS, buildCert, sbParseAnonKey, sbCleanKey, outboxPush, outboxRead, outboxFlush, outboxPending, OUTBOX_KEY, sbInsert, sbCfg`). Adding a new pure helper that needs a Playwright test? Append it to that object near the end of the script block. No secrets or mutable app state ever go on `window.__crl`.

## Brand / voice (when generating UI or copy)

Editorial-forensic, not salesy. Fonts: Playfair Display, Cormorant Garamond, JetBrains Mono, Inter. Palette: ink `#0a0a0a`, newsprint `#f5f1e8`, paper-dark `#ebe5d3`, paper-line `#d4cdb7`, card `#fbf8ef`, redline `#b91c1c`, footnote gray `#475569`, citation gold `#92400e`, good-green `#1f5d3a`. JN monogram seal is pure CSS (`.seal` classes) — no image asset. Definitions: 1–2 sentences. Use **Field Notes** (`n`) for practitioner insight. Full brand system in handoff §9.

## Zeabur Deployment (active, v3)

- **Project ID:** `6a0bec24c08ad7fb8a7dbb3a`
- **Project name:** `complete-roofing-lexicon`
- **Service ID:** `6a0bec48c08ad7fb8a7dbb40` — pass `--service-id` on every subsequent deploy to update in place (omitting it creates a duplicate service)
- **Server:** `server-69c6266d726b928734624537` (Hetzner 007Server)
- **GitHub repo:** `SlopesGuru77/complete-roofing-lexicon` (public)
- **GitHub repo numeric ID:** `1243057448`
- **Deploy template:** GIT — Zeabur auto-redeploys on every push to `main`.
- **Dashboard:** https://zeabur.com/projects/6a0bec24c08ad7fb8a7dbb3a

To check build/runtime logs use the `zeabur-deployment-logs` skill. To redeploy via CLI (rarely needed since Git-deploy auto-redeploys on push):

```bash
npx zeabur@latest deploy --project-id 6a0bec24c08ad7fb8a7dbb3a --service-id 6a0bec48c08ad7fb8a7dbb40 --json
```

## Pending post-deploy work

1. ~~Bind real custom subdomain on Zeabur.~~ **Done 2026-05-22.** Live at `https://lexicon.justennewton.media`.
2. Run `supabase-setup.sql` in self-hosted Supabase, then enter URL + anon key in deployed app → Manager → Sync Settings. *(SQL already executed 2026-05-19; sync code fixed in `37456ca`; awaiting first real cert-sync round-trip from owner device. As of 2026-05-23 every sync now queues on failure via the outbox in `crl_outbox_v1` — a queued cert run is no longer lost when the manager finally tests.)*
3. ~~Create and commit `og-cover.png`~~ **Done 2026-05-22** (commit `646f344`).
4. ~~Re-enable canonical + og:url~~ **Done 2026-05-22** alongside domain bind.
5. ~~Fix L1 certification distractor bug.~~ **Done 2026-05-23** (commit `be235f7`).
6. ~~Add automated test suite.~~ **Done 2026-05-23** (commit `a773eee`, 28 specs).
7. ~~PWA support (manifest, sw, icons, install prompt).~~ **Done 2026-05-23** (commits `e1e0850`, `29ae434`).
8. ~~Mobile touch targets + reduced-motion + system color-scheme.~~ **Done 2026-05-23** (commit `3aa2a3e`).
9. ~~Sync outbox with offline retry.~~ **Done 2026-05-23** (commit `60fdc3d`).
10. ~~Lazy-load supabase-js + qrious; preconnect fonts.~~ **Done 2026-05-23** (commit `0b2ecc8`).
11. ~~`vf` term verification workflow with annual cadence + manager queue.~~ **Done 2026-05-23** — `state.vf={[termKey]:{date,by}}`, 365-day freshness window via `VF_STALE_DAYS`, dynamic Lexicon badge (`Verify Current Spec` / `Verified YYYY-MM` / `Verification Stale`), Manager → Term Verification Queue panel with per-row + bulk verify. Exposed `vfStatus`, `markVerified`, `unmarkVerified`, `VF_STALE_DAYS`, `vfState` on `window.__crl`. New spec: `tests/term-verification.spec.js` (6 tests, all green).
12. ~~Team roll-up (offline / JSON-import path).~~ **Done 2026-05-23** — `crl_team_v1` localStorage holds imported per-device snapshots; `teamImport`/`teamRead`/`teamRemove`/`teamClear`/`teamCombinedCerts` helpers. Manager → "Team Roll-Up (Import)" section: multi-file JSON upload, imported-devices table with Remove, Combined Certifications table (local + imports, sorted by date). Dedupe by `name|role|location`. Decision context: supabase-setup.sql intentionally does **not** grant SELECT to anon (write-only schema), so a Supabase READ path requires a schema change. The JSON-import flow ships team value without that dependency and is forward-compatible. New spec: `tests/team-import.spec.js` (7 tests).

**Still open** (queued for Phase 2 of the review plan):

- Verifiable certs (HMAC + public verify page).
- Team rollup via Supabase SELECT (requires schema change to grant anon SELECT or a `SECURITY DEFINER` RPC, plus auth model decision).
- Tier surface (Free / Pro / Team) — no paywalls yet, just signposted upgrade paths.
