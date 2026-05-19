# CLAUDE CODE HANDOFF — The Complete Roofing Lexicon

**Project:** The Complete Roofing Lexicon (formerly "The Commercial Roofing Lexicon" v1/v2) — a single-file, static web app.
**Owner:** Justen Newton / Justen Newton Media (justennewton.media)
**Current version:** v3 (waves 1–3, completed 2026-05-18)
**Authoritative wave-by-wave details:** `WAVE-NOTES-2026-05-18.md`

> **First action for a new session:** read this file end-to-end, then `WAVE-NOTES-2026-05-18.md` for wave specifics, then `index.html` itself before changing anything. Confirm any structural change with Justen before building.

---

## 1. What the app is (current state)

A public, branded **training, drill, and certification platform** for roofing — commercial, residential, hail forensics, insurance restoration, and litigation support. It teaches the working vocabulary of the trade to building owners, property managers, estimators, crews, adjusters, public adjusters, supplement writers, attorneys, and roofing-company staff at every level. It is intentionally *not* a sales page; the credibility is the conversion.

It is **one file** — `index.html` (~2,150 lines) — with all HTML, CSS, JavaScript, and content data inlined. No build step, no framework, no package manager. The only external runtime dependencies are Google Fonts and the `qrious` script from cdnjs (both with graceful fallbacks), the optional Plausible analytics script, and (added in the Supabase wiring) the `@supabase/supabase-js` UMD bundle pulled from a CDN.

### What's inside (cumulative state, v3)

- **13 top-level tabs:** Overview · Lexicon · Flashcards · Quiz · Scenarios · Compatibility · Hail Forensics · Plain English · Report Lang · Certify · Profile · Manager · About.
- **223 defined terms** across **17 category groups**, original wording, tier-tagged (1=Apprentice / 2=Journeyman / 3=Forensic). Time-sensitive items carry a `vf:1` "Verify Current Spec" flag.
- **15 inspection & claim scenarios**, multi-choice with reasoned feedback.
- **25 compatibility-drill items** ("sound assembly or flag it?").
- **41-entry Plain-English dictionary** — each entry gives a conversational owner-facing translation of the term plus a "don't say this" counter-example.
- **20-topic Report Language Trainer** — three escalating versions of each documentation finding (poor / better / best) with the reasoning for the best version, filterable by inspection / claims / estimate.
- **Hail Forensics module** — dedicated tab with an 11-row threshold reference table, an interactive 9-step destructive-test-cut protocol checklist, and a 4-card practice grid that deep-links into Hail flashcards, claims scenarios, claims report-language, and the L3 cert.
- **3-level certification system** — L1 Apprentice (16 Q, tier-1, 80% pass), L2 Field Roofing Professional (20 Q, tier 1-2, 85% pass), L3 Claims & Forensics Specialist (22 Q, all tiers including forensic, 90% pass). Each level produces a level-named printable certificate with a deterministic JNM-CRL reference number.
- **Leitner spaced-repetition flashcards**, 4 quiz modes including a 60-second Speed Round, persistent device-local progress, and per-card `{box, seen, missed, last}` counters that both flashcards and the quiz now write to.
- **Staff Profile** — name, role (12-option preset list), company/location, dark-mode toggle, Export / Import progress JSON, and a Reset Progress option that keeps identity fields.
- **Manager dashboard** — passcode-gated (default `ROOF123`, change in-app), shows group mastery with bar viz, most-missed terms with miss counts, certification history with Level / Score / Result columns, plus Download Summary CSV and Download Full Progress JSON.
- **Role-based recommended curriculum** — when a user picks a role in Profile, the Overview shows a "Recommended Path for {Role}" panel with 5 ordered steps that deep-link into the right module with the right pre-filter (e.g., Inspector step 1 jumps to Lexicon → Hail Forensics group).
- **Optional Supabase sync** (wiring landed v3.1; configured per-device via Manager → Sync Settings; default off; never stores keys in code).
- **QR / share section** in About, generated on demand via `qrious`.
- **Dark mode** via `html.dark` class.
- **Print stylesheet** that prints only the certificate.
- **Plausible analytics** with custom events for major completions (see §6).

---

## 2. Repo & deployment pipeline

- **Repo layout:** single `index.html` at the project root. The other tracked files are docs (`CLAUDE.md`, `CLAUDE_CODE_HANDOFF.md`, `WAVE-NOTES-*.md`, `distribution-guide.md`, `QA_REPORT.md`), the optional `supabase-setup.sql`, and `.gitignore`. Keep it that way. The app itself stays single-file (see hard rule §3.2).
- **Host:** GitHub → **Zeabur**. Zeabur auto-detects a no-language repo as a static site, serves `index.html` as the homepage, and auto-redeploys on every push. No Dockerfile, no Vite config, no Node build.
- **Backend (Supabase):** self-hosted Supabase running on the same Zeabur account. Sync is opt-in per device through the Manager dashboard. The app never bundles the URL or key — the manager enters them at runtime into `state.prefs.supabase`, stored only in localStorage on that device.
- **Domain:** placeholder `lexicon.justennewton.media` is still in the `<head>` meta tags and Plausible `data-domain`. **Confirm the real subdomain with Justen and replace all occurrences** before launch. (Carried open item from v2.)
- **Security:** Zeabur's deploy scanner blocks pushes that look like they contain secrets. Never commit `.env`/keys/JWT/anon keys. The `.gitignore` in the repo enforces this; the in-app Sync Settings panel keeps real credentials out of the source tree by design.
- **`og-cover.png` is still missing.** The `<head>` references `https://lexicon.justennewton.media/og-cover.png` (1200×630). Until that file is created and committed, shared links render with a broken social card.

### Deployment steps (sequence to launch)

1. `git init` inside this project folder. (Currently the folder has no `.git/` and git commands resolve to a broken orphan repo in `C:\Users\roofk\` — see §3 hazard note.)
2. `git add` only the intended files (`index.html`, the four docs, `supabase-setup.sql`, `.gitignore`). Never `git add .` from this directory without confirming what would be staged.
3. `git commit` with a descriptive message; user info already set as `justennewton`.
4. Create / point at the GitHub repo on `SlopesGuru77`. Add as `origin`. Push `main`.
5. In Zeabur: New Service → from GitHub → select this repo → static-site auto-detection should pick `index.html`. Confirm port / public root.
6. Bind the custom domain (whatever the real subdomain is).
7. In the deployed app: open **Manager**, enter passcode, open **Sync Settings**, paste the self-hosted Supabase URL + anon key, click Test → Save. Confirm a write lands in `roofing_training_progress` from a test cert.
8. Replace placeholder `og-cover.png` and the placeholder domain in `<head>` + Plausible `data-domain`; redeploy.

---

## 3. Hard rules — do not violate

1. **Copyright / originality.** Term scope was *informed by* Brian Lemke's "Building Owners Guide To Commercial Roofing," plus NRCA, IIBEC, ASTM, FM Approvals, and UL references. **Every definition, scenario, plain-English entry, and report-language pair in the app was written independently and must stay that way.** When extending the content, write all wording in the existing voice; never copy or closely paraphrase source text. Lemke / NRCA / ASTM / FM / UL are credited as reference sources in the About page and footer; keep that credit. This is non-negotiable.
2. **Single-file architecture.** Everything stays in `index.html`. External dependencies are Google Fonts, `qrious` (cdnjs), the Plausible script, and (optional) `@supabase/supabase-js` UMD via CDN — all loaded with graceful fallbacks. **Do not add a build step, a bundler, a framework, a server-side render, or separate `data/*.json` source files.** If a future request demands React or split data files, treat it as a scope conflict and stop to confirm.
3. **Don't rewrite the file wholesale.** It is now ~2,150 lines. Edit in place with targeted changes anchored on the `/* ===== Section ===== */` block comments. (Past full-file rewrites truncated; that is why this app was built in chunks and now in waves.)
4. **Storage compatibility.** The `Store` wrapper does localStorage with an in-memory fallback, so the app runs in sandboxed previews. State key is `crl_v2_state` (kept on v2 even though `state.v=3`, so existing users' progress carries over). `loadState` deep-merges the new `prefs` and `streak` objects, so adding new keys is forward-compatible. If you change a *value's* shape (not just add new keys), bump `state.v` and write a migration block in `loadState`.
5. **Verify dated facts.** Source material is years old in places. Industry facts change — e.g., "Firestone Building Products" is now Elevate (Holcim); ASTM revisions; code editions. **Tag every term, threshold, or scenario citing a code/standard/figure with `vf:1`** so the "Verify Current Spec" badge appears. Use this aggressively in any future content additions.
6. **Never commit secrets.** Supabase URL + anon key are entered by the manager at runtime into `state.prefs.supabase` and live in localStorage on each device. They never appear in the file, in a `.env`, or in git history. The `.gitignore` lists `.env*` and common credential file patterns. The Plausible `data-domain` is the only externalized identifier in the file, and that is a domain, not a secret.
7. **Pre-existing git hazard (CRITICAL for any session).** There is a broken / orphan git repository at `C:\Users\roofk\.git` whose working tree is the entire home directory. From inside this project folder, before you run `git status`, `git add`, or `git commit`, always run `git rev-parse --git-dir` and confirm the result is `.git` (project-local) and NOT `C:/Users/roofk/.git`. If it points to the home directory, **do not commit** — run `git init` in the project folder first, then operate. The user's global CLAUDE.md documents this hazard.

---

## 4. Architecture inside `index.html`

Single `<script>` block at the bottom of the file, structured in this order:

### 4a. Data layer (top of script)

| Symbol | Shape | Count | Anchor comment |
|---|---|---|---|
| `CATS` | `{id, num, name}[]` | 17 | top of script |
| `TIER_NAME` | `{1,2,3}` | — | follows CATS |
| `TERMS` | `{t, c, tier, d, n?, vf?, see?}[]` | 223 | `/* ===== Residential & Steep-Slope ===== */` etc. block comments mark sub-sections added in v3 |
| `SCENARIOS` | `{s, q, o:[{t,ok,w}], l}[]` | 15 | |
| `COMPAT` | `{a, ok, e}[]` | 25 | |
| `PLAIN_ENGLISH` | `{term: {pe, nts}}` map | 41 | `/* ===== Building-Owner Translation Mode ===== */` |
| `REPORT_PAIRS` | `{topic, rel, poor, better, best, why}[]` | 20 | `/* ===== Report Language Trainer ===== */` |
| `HAIL_THRESHOLDS` | `{material, size, notes}[]` | 11 | `/* ===== Hail Forensics — reference data ===== */` |
| `TEST_CUT_STEPS` | `{id, label, detail}[]` | 9 | (same block) |
| `LEVELS` | `{1,2,3} → {key,name,desc,pass,tierMax,nTerms,nScen,nComp,credTitle,credBody}` | 3 | `/* ===== Multi-level Certification ===== */` (in cert section) |
| `CURRICULA` | `{role: [{l, a}]}` | 12 roles × 5 steps | inside Overview section |

Term object fields:
- `t` (term, also the unique key)
- `c` (category id, matches `CATS[i].id`)
- `tier` (1–3)
- `d` (definition — original wording, 1–2 sentences)
- `n` (optional Field Note italic block)
- `vf` (optional `1` flag → renders "Verify Current Spec" badge)
- `see` (optional array of related term names; render as cross-reference link in Lexicon)

### 4b. Engine

- `Store` — localStorage with in-memory fallback. `Store.persistent` is `true` when localStorage works on this device.
- `KEY = "crl_v2_state"` — never change this without writing a migration. Even though `state.v` is 3, the key stays v2 so v2 users carry forward.
- `defState()` — returns the default state. Includes `prefs:{dark, passcode, supabase:{url, anonKey, enabled, schemaPrefix}}` and `mgrUnlocked`, `tcDone`, `quizMissed`, `missedCount`, `certs`, `bestSpeed`, `scenDone`, `compatDone`, `streak`, `view`, plus identity `name`/`role`/`location` and per-card `cards`.
- `loadState()` — Object.assign over `defState()`, then deep-merges `prefs` and `streak` keys to add forward-compatible fields without dropping the user's saved values. Initializes `tcDone` if missing. Bumps daily streak. Calls `applyTheme()`. Always saves on exit.
- `applyTheme()` — toggles `html.dark` based on `state.prefs.dark`.
- `track(name)` — Plausible custom event helper; swallows errors.
- `VIEWS` — array of `[id, label]` for the nav. Tab order is intentional (study → drill → trainers → cert → config).
- `renderNav()` / `go(view)` — nav rendering and navigation. `go(v)` saves the new view in state, swaps `.show`, calls `RENDER[v]()`, scrolls to top.

### 4c. Module render functions (one per tab)

| Function | Purpose | Notes |
|---|---|---|
| `RENDER.overview` | KPIs + role-based curriculum panel + name input + next-best-move + content summary | Curriculum panel appears only when `state.role` is set; otherwise falls back to the weakest-group suggestion. |
| `RENDER.lexicon` (+ `drawLex`, `termCard`) | Searchable / filterable grouped term browser | Filter chips for category and tier; cross-reference `see` links. |
| `RENDER.flash` | Leitner spaced-repetition flashcards | Modes: All / per-category / per-tier / Missed-in-Quizzes. Updates `state.cards[t].{box,seen,missed}` per flip. |
| `RENDER.quiz` | 4 quiz modes incl. 60-second Speed Round | Quiz answer handler now also bumps `state.cards[t].{seen,missed}` for cross-mode mastery tracking. |
| `RENDER.scenarios` | One scenario at a time with reasoned feedback | Tracks `state.scenDone` indices. |
| `RENDER.compat` | "Sound assembly or flag it?" drill | Tracks `state.compatDone` indices. |
| `RENDER.hail` | Hail Forensics dedicated module | Hero w/ progress bar, threshold table, interactive 9-step protocol checklist (persisted to `state.tcDone`), 4 practice deep-link cards. |
| `RENDER.owner` | Plain-English drill | Walks `PLAIN_ENGLISH` entries with prev / reveal / next / shuffle. Reveal shows the conversational version + the "don't say this" block. |
| `RENDER.report` | Report Language Trainer | Step-reveal: Poor → +Better → +Best → All + Why. Filter chips: All / Inspection / Claims / Estimate. |
| `RENDER.certify` (+ `buildCert(level)`, `refNo()`) | 3-level certification | Level picker with cards for L1/L2/L3, then `buildCert(level)` filters `TERMS` by tier and assembles a mixed Term + Scenario + Compatibility exam. Passes the level's `pass` threshold to set `cert.pass`; certificate template shows the level name and credential title; cert ref number is deterministic over `name + score + date + level`. Saves `{score, pass, at, level, levelName}` to `state.certs`. |
| `RENDER.profile` | Staff identity + display + backup/transfer | Name, role dropdown (12 presets), location, dark-mode toggle, Export/Import progress JSON, Reset Progress (keeps identity). |
| `RENDER.manager` | Passcode-gated dashboard | Locked: passcode input (default `ROOF123`). Unlocked: group mastery table, most-missed terms table (uses `state.cards[t].missed`), cert history with Level column, Download Summary CSV, Download Full Progress JSON, Change Passcode, Sign Out. Also hosts the Sync Settings panel (Supabase URL / anon key / table prefix / Enable / Test / Sync now). |
| `RENDER.about` | Colophon + QR sharing | Plausible already wired; QR via `qrious`. |

### 4d. Curriculum dispatcher

`runCurriculumAction(action)` translates a curriculum step's shorthand:
- `"lexicon"` / `"certify"` / `"hail"` / etc. → `go(view)`
- `"lex:hailforensics"` → set `lexCat="hailforensics"`, then `go("lexicon")`
- `"rep:claims"` → set `reportFilter="claims"`, `reportIdx=0`, `reportShow="poor"`, then `go("report")`
- `"flash:t:1"` → set `fcMode="t:1"`, `fcCard=null`, then `go("flash")`

Mutating these top-level lets at runtime is intentional — they are declared with `let` higher in the script, and event handlers run only after script load (no TDZ issue).

### 4e. Init (bottom of script)

```js
loadState();
renderNav();
go(VIEWS.some(v=>v[0]===state.view)?state.view:"overview");
```

When adding a module: register it in `VIEWS`, add a `<section id="…" class="view">` in the body, add a `RENDER.<key>` function, and fire a `track("…")` event for any meaningful completion so Justen can wire it to a Plausible goal.

---

## 5. State shape (current v3)

```js
{
  v: 3,
  name: "",
  role: "",            // one of ROLES, e.g. "Inspector"
  location: "",
  cards: {              // per-term — both flashcards and quiz write here
    [termName]: { box: 0..5, seen: n, missed: n, last: timestamp }
  },
  quizMissed: [termName, ...],   // capped at 60, used by Flashcards "Missed" deck
  missedCount: {},               // reserved (currently unused)
  certs: [
    { score: pct, pass: bool, at: "YYYY-MM-DD", level: 1|2|3, levelName: "Apprentice" }
  ],   // most-recent first, capped at 8
  bestSpeed: n,                  // best 60-second Speed Round score
  scenDone: [idx, ...],          // indices into SCENARIOS
  compatDone: [idx, ...],        // indices into COMPAT
  tcDone: [stepId, ...],         // hail-forensics protocol step ids
  streak: { n: dayCount, last: "YYYY-MM-DD" },
  view: "overview",              // last-active tab id
  prefs: {
    dark: false,
    passcode: "ROOF123",
    supabase: {
      url: "",
      anonKey: "",
      enabled: false,
      schemaPrefix: "roofing_training_"
    }
  },
  mgrUnlocked: false
}
```

Storage key: `crl_v2_state` (do not change).

---

## 6. Plausible analytics events

Existing custom events fired by the app (configure goals in Plausible to match):

- `Quiz Completed`
- `Certification L1 Started`, `Certification L2 Started`, `Certification L3 Started`
- `Certification L1 Passed`, `Certification L2 Passed`, `Certification L3 Passed`
- `Certification L1 Attempted`, `Certification L2 Attempted`, `Certification L3 Attempted`
- `Plain English Revealed`
- `Report Language All Revealed`
- `Hail Protocol Reviewed` (fires when all 9 test-cut steps are checked off)
- `Curriculum Step Clicked`
- `Profile Saved`
- `Theme Toggled`
- `Progress Exported`, `Progress Imported`
- `Manager Signed In`
- `Manager CSV Exported`, `Manager JSON Exported`
- `Supabase Sync Tested`, `Supabase Sync Success`, `Supabase Sync Failed` (added with sync wiring)

---

## 7. Supabase integration (v3.1 wiring)

### 7a. How it's wired in the app

- `@supabase/supabase-js` UMD bundle is loaded from a CDN in `<head>` with `defer`, alongside `qrious`. If the script fails to load, `window.supabase` is undefined and the app simply doesn't sync — every other feature continues to work.
- The Manager dashboard exposes a **Sync Settings** panel: URL, anon key (password input), table prefix (default `roofing_training_`), Enable toggle, Test button, and a manual "Sync Now" button.
- Credentials live in `state.prefs.supabase` in localStorage on the manager's device only. Never bundled, never logged, never committed.
- When `state.prefs.supabase.enabled` is true and a client successfully constructs, the cert-completion handler in `RENDER.certify` also posts the new cert to `{prefix}certifications`. The manual Sync Now button posts a single `roll_up` progress event with the full per-group mastery snapshot + the latest cert.
- Sync is intentionally minimal in v3.1: it fires-and-forgets to the table, swallows errors, and shows a status line in the Sync Settings panel. The goal is auditable per-staff records on the manager's server, not full event streaming.

### 7b. Schema (also in `supabase-setup.sql`)

```sql
create table if not exists roofing_training_staff (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  staff_name text,
  role text,
  company_location text,
  active boolean default true
);

create table if not exists roofing_training_progress (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  staff_name text,
  role text,
  company_location text,
  event_type text,
  module text,
  score numeric,
  payload jsonb
);

create table if not exists roofing_training_certifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  staff_name text,
  level text,
  score numeric,
  passed boolean,
  weak_modules jsonb,
  payload jsonb
);
```

Recommended RLS: enable RLS on each table, allow `insert` for anon users (since the app posts with the anon key), and restrict `select` to authenticated users (the manager's separate analytics queries should run authenticated).

### 7c. Configuration steps for the operator (one-time)

1. In self-hosted Supabase on Zeabur: open SQL editor, paste `supabase-setup.sql`, run.
2. (Recommended) Enable RLS on all three tables; add an `insert` policy for the anon role.
3. Copy the project URL and the anon (public) key.
4. In the deployed app: open Manager → enter passcode → expand Sync Settings → paste URL + anon key → Test → Save → Enable.
5. Do one cert run on the same device; confirm a row appears in `roofing_training_certifications`.

### 7d. Out of scope (v3.1)

- Multi-device aggregation in the app's own UI (the Manager view is still a single-device roll-up). Aggregation lives in Supabase / your own analytics dashboards.
- Auth / per-staff accounts. The schema uses `staff_name` text — uniqueness is by-convention, not enforced.
- Live event streaming. Sync fires on cert completion and on manual Sync Now; nothing else.

---

## 8. Wave history (what changed when)

Concise pointer; full per-wave detail in `WAVE-NOTES-2026-05-18.md`.

| Wave | Date | Headline |
|---|---|---|
| v1/v2 (pre-handoff) | 2026 (earlier) | Original Commercial Roofing Lexicon — 12 categories, ~146 terms, 10 scenarios, 16 compat items, Leitner flashcards, 4 quiz modes, single 80% cert, QR/share, Plausible. |
| **Wave 1** | 2026-05-18 | Rename to "The Complete Roofing Lexicon"; add 5 categories (Residential & Steep-Slope, Tile/Slate/Specialty, Ventilation, Hail Forensics, Insurance Restoration); +77 original terms; +5 scenarios; +9 compat items; new **Profile** tab (name/role/location/theme/export/import) and **Manager** tab (passcode `ROOF123`, group mastery, most-missed terms, cert history, CSV+JSON exports); dark mode; quiz handler bumps per-card `seen`/`missed`. |
| **Wave 2** | 2026-05-18 | Three high-leverage additions. **Plain English** tab (41-entry dictionary of conversational translations + don't-say-this counter-examples). **Report Language** tab (20 documentation topics × poor/better/best with reasoning). **3-level certification** (L1 Apprentice 80% / L2 Field Roofing Professional 85% / L3 Claims & Forensics Specialist 90%) with level-named credentials. Manager cert table grew a Level column. |
| **Wave 3** | 2026-05-18 | **Hail Forensics** dedicated tab (11-row threshold reference, interactive 9-step test-cut protocol checklist, 4 practice deep-link cards). **Role-based recommended curriculum** — when role is set in Profile, Overview shows a 5-step path tuned to that role with deep-link buttons (e.g., Inspector step 1 → Lexicon pre-filtered to Hail Forensics group). |
| **Wave 3.1 (this update)** | 2026-05-18 | Optional **Supabase sync** wiring in Manager dashboard; `supabase-setup.sql`; `.gitignore`; deployment-ready for GitHub → Zeabur. |

Each wave has been smoke-tested live in Chromium (Playwright) against a local Python http.server — zero console errors, all flows verified end-to-end.

---

## 9. Open tasks (carried forward)

| # | Item | Wave | Status |
|---|---|---|---|
| 1 | Create and commit `og-cover.png` (1200×630, editorial-forensic style per §10) | from v2 | Open — broken social cards until done |
| 2 | Replace placeholder domain `lexicon.justennewton.media` in `<head>` meta + Plausible `data-domain` with the real custom subdomain | from v2 | Open — owner decision |
| 3 | Initialize a project-local git repo, push to GitHub | v3.1 | Pending — see §2 deploy steps |
| 4 | Bind real custom domain on Zeabur after first deploy | v3.1 | Pending |
| 5 | Run `supabase-setup.sql` against self-hosted Supabase + enable RLS + configure Sync Settings on a manager device | v3.1 | Pending |
| 6 | Verify on real iOS Safari (especially print stylesheet for the new L1/L2/L3 certificates) | from QA | Open |

### Next-wave candidates (when ready)

1. **Wind Forensics module** — parallel structure to Hail Forensics: threshold/zone reference, ASCE 7 wind-design overview, edge-metal failure protocol.
2. **Speed-round per-module banks** + cross-staff leaderboard (requires Supabase already in place).
3. **Recommended-path completion tracking** — visually mark curriculum steps as done.
4. **Public-adjuster / contractor licensing reference** (state-by-state).
5. **Mobile-specific UX pass** — bigger tap targets, sticky search.

---

## 10. Brand system (preserved from v2)

- **Fonts:** Playfair Display (900/700, display + the JN logo), Cormorant Garamond (body / editorial, including italic), JetBrains Mono (labels / metadata), Inter (UI).
- **Light palette:** Press Ink `#0a0a0a`, Newsprint paper `#f5f1e8`, paper-dark `#ebe5d3`, paper-line `#d4cdb7`, card `#fbf8ef`, Redline `#b91c1c`, Footnote Gray `#475569`, Citation Gold `#92400e`, good-green `#1f5d3a`.
- **Dark palette:** ink `#e8e6df`, paper `#0b0d10`, paper-dark `#15181d`, paper-line `#2a2e36`, card `#13161b`, redline `#ef6b6b`, gray `#9aa0ad`, gold `#d4a35a`, good `#5cc28d`. Activated by `html.dark`.
- **Logo:** the "JN" monogram seal is built in CSS (black square, cream serif "JN", "MMXXVI" year mark) — no image file. Reuse `.seal` classes with `.s44`/`.s64`/`.s90` size variants and `.inv` for the inverted (light-on-dark) form.
- **Voice:** confident, precise, educational; lead-magnet without being salesy; forensic literacy. Definitions are 1–2 sentences. Use **Field Notes** (the `.note` block, term `n` field) for practitioner insight and **"Verify Current Spec"** flags on time-sensitive items. Scenarios are educational, not legal advice. Plain-English entries deliberately give a "don't say this" line so the staff learns the trap, not just the script.
- **OG cover image (still to create):** editorial-forensic — ink/newsprint palette, the JN seal, the title "The Complete Roofing Lexicon," restrained typographic layout. No stock-photo contractor clichés.

---

## 11. Historical appendix — v2 content folded in (DONE)

The original v2 handoff queued two content drops and one structural decision. All three are now in the file. Preserved here for archeological clarity.

### §5 (original) — EPDM deep-dive

Folded into the existing `bitumen`, `insulation`, `forensics`, and (new) `hailforensics` categories. Terms added in waves 1 and 3 include: EPDM hail resistance and the 2009 Koontz/Hutchinson study context, separator-sheet compatibility, polyiso hail crushing, facer separation, EPDM threshold per Haag reference data, and the EPDM lab-threshold scenario.

### §6 (original) — Hail Forensics

Now its own dedicated tab (`RENDER.hail`) in wave 3, with: 11-row threshold reference table, interactive 9-step destructive test-cut protocol, 4 practice deep-link cards. Backing data is `HAIL_THRESHOLDS` and `TEST_CUT_STEPS`. Also expressed as: a `hailforensics` lexicon category (12 terms), scenarios on EPDM lab thresholds / hidden polyiso damage / test-cut permission, and report-language pairs on impact bruising / functional damage / scrim fracture / facer separation / polyiso crushing.

### §7 (original) — Structural decision: Sections vs. Levels vs. Phases

Resolved de facto. The waves preserved the existing 17-category + 3-tier structure (Option A + B from the original handoff) and added two **modules** as dedicated tabs (Hail Forensics; Plain English; Report Lang — Option-A-style sections without renaming the existing groups). The Recommended Curriculum in wave 3 is the "phases / guided path" answer (Option C) but driven by role rather than by a fixed sequence. If the owner ever wants a hard sections reorg of the Lexicon itself, that is a separate wave; the current shape is intentional.

---

*End of handoff. Current `index.html` is deployable as-is on Zeabur. The path from "deployable" to "live with Supabase tracking" is in §2's deployment steps and §7c's Supabase configuration steps.*
