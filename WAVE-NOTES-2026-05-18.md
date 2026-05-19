# Wave Notes — v3 "Complete Roofing Lexicon" Upgrade

**Date:** 2026-05-18
**Waves:** 1, 2, 3, and 3.1 (in-place upgrades to `index.html`)
**Driver prompt:** "Upgrade the Commercial Roofing Lexicon Into a Complete Roofing Training Platform"

---

## Wave 3.1 additions (2026-05-18, same day)

Deployment-ready: optional Supabase sync wiring + git/GitHub artifacts.

### Supabase sync in the Manager dashboard
- `@supabase/supabase-js@2` UMD bundle pulled from jsDelivr in `<head>` (defer). App degrades silently if the script fails to load.
- `state.prefs.supabase = {url, anonKey, enabled, schemaPrefix}` added to `defState()`. Default prefix `roofing_training_`, default `enabled:false`. Credentials live only on the manager's device in localStorage — never in source, never committed.
- New helpers in the script: `sbCfg()`, `sbAvailable()`, `getSb()` (lazily constructs and caches the client per URL+key), `sbTable(name)`, `sbTest()`, `sbInsert(table,row)`, `sbSyncCert(cert)`, `sbSyncRollup()`. All async helpers swallow errors and return `{ok, msg}` shape so the UI never throws.
- New Sync Settings panel inside the Manager dashboard (above the Settings panel): URL, anon key (password input), table prefix, Enable checkbox, Save / Test / Sync Roll-Up Now buttons, status line. Shows live status of whether the client library loaded.
- Cert completion handler now also calls `sbSyncCert(newCert)` if `state.prefs.supabase.enabled` is true. Failure is non-fatal and shows in the Plausible event stream as `Supabase Sync Failed`.
- New Plausible events: `Supabase Sync Tested`, `Supabase Sync Success`, `Supabase Sync Failed`.

### Deployment artifacts
- `.gitignore` — blocks `.env*`, common credential file patterns, OS junk, and the `.playwright-mcp/` test cache. Specifically prevents accidental key commits even though the app doesn't bundle them in the first place.
- `supabase-setup.sql` — three tables (`roofing_training_staff`, `roofing_training_progress`, `roofing_training_certifications`) with helpful indexes, plus commented-out RLS / anon-insert policies the operator can uncomment after the first run.
- The certifications table includes `role`, `company_location`, `level`, `level_name` columns matching the in-app schema.

### Browser-verified (playwright/Chromium)
- Supabase library loads from CDN (`window.supabase.createClient` available). ✓
- Sync Settings panel renders all 7 controls with default prefix `roofing_training_`. ✓
- Save persists `{url, anonKey, schemaPrefix, enabled}` to `state.prefs.supabase`. ✓
- Bogus URL test returns "TypeError: Failed to fetch" cleanly without crashing the app. ✓ (Network errors are expected and handled.)

---

## Wave 3 additions (2026-05-18, same day)

Hail Forensics module + role-based recommended curriculum.

### Hail Forensics — new dedicated tab
- New `HAIL_THRESHOLDS` reference data (11 materials with onset thresholds and contextual notes, attributed to industry data widely associated with Haag Engineering, with the standard "guides not guarantees" framing).
- New `TEST_CUT_STEPS` array — the 9-step destructive sampling protocol (owner permission → carrier permission → pre-photo → cut → measure → video → magnify → repair-photo → log).
- New `RENDER.hail` tab combines: hero with protocol progress bar, threshold reference table, interactive 9-step checklist with toggle/persist (state.tcDone), and a 4-card practice grid that deep-links into Hail Forensics flashcards, scenarios, claims report-language drills, and L3 cert.
- New track events: `Hail Protocol Reviewed` (fires when all 9 steps are checked off).
- `state.tcDone` added to `defState()` with loadState back-compat.

### Role-based recommended curriculum on Overview
- New `CURRICULA` dictionary maps each of 12 roles (Sales, Inspector, Estimator, Supplement Writer, Project Manager, Production, Business Development, Claims Support, Litigation Support, Manager, New Hire, Other) to a 5-step ordered path with deep-link targets.
- New `runCurriculumAction(a)` dispatcher handles direct view targets (`certify`, `hail`, `manager`), filtered-lexicon (`lex:hailforensics`), filtered-report (`rep:claims`), and flashcard-mode (`flash:t:1`).
- `RENDER.overview` now renders a `Recommended Path for {Role}` panel above the existing KPIs when the user has set a role in Profile. Falls back to the existing "weakest group" suggestion when no role is set.
- Each step click fires `Curriculum Step Clicked` and jumps the user to the correct module with the right pre-filter applied.

### Browser-verified (playwright/Chromium)
- 13 tabs total, "Hail Forensics" tab in the correct position. ✓
- Hail Forensics view: hero, 11 threshold rows, 9 protocol steps, 4 practice cards. ✓
- Protocol checkbox toggling persists in `state.tcDone`. ✓
- Curriculum panel appears when role set to "Inspector" with the 5 expected step labels. ✓
- Step 1 click navigates to Lexicon with the Hail Forensics & Test Cuts category chip active. ✓
- 0 console errors.

---

## Wave 2 additions (2026-05-18, same day)

Added three high-leverage items from the wave-1 "next-wave candidates" list.

### Plain English (Building-Owner Translation) — new tab
- New `PLAIN_ENGLISH` dictionary with **41 entries** covering the highest-value terms an owner is likely to hear (TPO, EPDM, BUR, polyiso, hail damage threshold, RCV/ACV, ordinance or law, matching, kick-out flashing, ice dam, etc.).
- Each entry: technical definition (pulled from existing TERMS), conversational plain-English version, and a "Don't say this" counter-example.
- New `RENDER.owner` tab walks staff through entries one by one with prev / reveal / next / shuffle. Track event: `Plain English Revealed`.

### Report Language Trainer — new tab
- New `REPORT_PAIRS` array with **20 documentation topics**, each as three escalating versions (poor / better / best) with the reasoning for the best version. Topics span inspection, claims, and estimate documentation.
- New `RENDER.report` tab shows topics one at a time with step buttons that reveal Poor → +Better → +Best → All+Why. Filter chips for All / Inspection / Claims / Estimate. Track event: `Report Language All Revealed`.

### Multi-level Certification — Certify refactored
- `LEVELS` config drives three paths:
  - **L1 Apprentice** — 16 questions (12 terms + 2 scenarios + 2 compat), tier-1 terms only, 80% pass.
  - **L2 Field Roofing Professional** — 20 questions, tier 1–2 terms, 85% pass.
  - **L3 Claims & Forensics Specialist** — 22 questions, all tiers, 90% pass.
- Certify view now shows a level picker with three cards instead of a single Begin button.
- Certificate template now displays the level name and credential title (`Apprentice Certificate of Completion` / `Field Roofing Professional` / `Claims & Forensics Specialist`).
- `state.certs` entries now stamp `level` and `levelName` (back-compat: older v3 entries without these still render).
- Manager dashboard certification table grew a "Level" column; CSV export includes the level.
- New Plausible events: `Certification L1/L2/L3 Started`, `Certification L1/L2/L3 Passed`, `Certification L1/L2/L3 Attempted`.

### Browser-verified
Loaded the built file in playwright (Chromium) against the local server:
- 12 tabs render, all in expected order including new Plain English + Report Lang.
- Plain English: first card = "TPO", reveal exposes plain-English text + "Don't say this" block. ✓
- Report Language: first topic = "Ponding water", step buttons cycle Poor→All+Why correctly. ✓
- Certify: 3 level cards present with correct names and pass-score metadata. ✓
- Full L1 exam end-to-end: 16 questions, failure path shows "80% needed for L1," saved cert in localStorage carries `{level:1, levelName:"Apprentice"}`. ✓
- 0 console errors. Plausible "ignoring localhost" warning expected.

---

## What changed in wave 1

### Branding
- Title → **The Complete Roofing Lexicon**
- Subtitle: *Commercial, Residential, Claims, Code, Damage, and Field Training*
- Meta tags, masthead, footer copy all updated. Plausible `data-domain` placeholder untouched (still `lexicon.justennewton.media` — pending owner confirmation per original handoff §2).
- `og-cover.png` still missing — open task carried forward from v2.

### Data (~75 new original terms, 6 new scenarios, 10 new compatibility items)
- **5 new category groups (13–17):** Residential & Steep-Slope, Tile/Slate/Specialty, Ventilation & Attic Systems, Hail Forensics & Test Cuts, Insurance Restoration & Coverage.
- **Term additions** spread across new groups plus deeper coverage of existing ones — insulation (LTTR, ASTM C1289, 20 psi, separator sheet, vapor drive), metal (R-panel, snap vs. mechanical lock, expansion clip), flashing (kick-out, two-piece counter, through-wall), industry bodies/codes (IBC, IRC, ASCE 7, IBHS/FORTIFIED, Haag certified).
- Every time-sensitive term carries `vf:1` ("Verify Current Spec") per the originality + verification rules.
- **6 new scenarios:** EPDM lab-threshold rebuttal, hail test-cut permissions, residential chimney rot (cricket/kick-out/step), attic ventilation short-circuit, wear-and-tear exclusion response, hidden hail damage in polyiso.
- **10 new compatibility items:** power-vent without intake, gable + ridge short-circuit, missing starter shingle, Class 4 discount without carrier confirm, unauthorized test cut, snap-lock in high-wind coastal, kick-out installation, ice-and-water coverage in cold climates.

### New views + state
- **Profile** (new tab): name, role (12 preset roles), company/location, dark-mode toggle, export/import progress JSON, reset progress.
- **Manager** (new tab, passcode-gated, default `ROOF123`): per-group mastery table with bar viz, most-missed terms ranked by miss count, certification history, summary CSV export, full JSON export, change-passcode setting. Manager view is a single-device roll-up; multi-staff aggregation requires offline combination of exports or wiring optional Supabase sync (see `distribution-guide.md`).
- **Dark mode**: full theme palette via `html.dark` class, toggled from Profile, persisted in `state.prefs.dark`.

### Engine changes
- `defState()` now includes `role, location, prefs:{dark, passcode}, mgrUnlocked, missedCount`. `state.v` bumped to 3 but the storage key stays `crl_v2_state` so existing users' progress carries over.
- `loadState()` deep-merges `prefs` and `streak` to keep v2-shaped saves forward-compatible.
- Quiz answer handler now bumps `state.cards[term].missed/seen` per answer (previously only flashcards wrote to those counters), powering the Manager's most-missed table.
- New `applyTheme()` helper.

### CSS additions
- Manager table styles (`.mgr-table`, `.mgr-bar`, `.lock-card`, `.io-row`)
- Dark mode tokens + element overrides under `html.dark`
- New Plausible events fired: `Profile Saved`, `Theme Toggled`, `Progress Exported`, `Progress Imported`, `Manager Signed In`, `Manager CSV Exported`, `Manager JSON Exported`. Add matching goals in the Plausible dashboard.

---

## What was deferred and why

These items from the master prompt were **not** built in this wave; reasons noted so the next session can decide whether to lift them or build them separately.

| Master-prompt item | Status | Reason |
|---|---|---|
| Separate React app (`react-app/`) | Skipped | Handoff §3.2: single-file architecture is non-negotiable. The new prompt marks React as optional. Lift it into a sibling folder only if owner confirms the single-file rule has been relaxed. |
| `data/*.json` files | Skipped | Same single-file rule — data is embedded. Exposing as JSON would mean a dual source of truth. |
| Supabase backend / `supabase-setup.sql` | Skipped (documented as future) | No project, no env, conflicts with no-backend rule. Distribution guide documents how to wire it later. |
| 1,000+ flashcards / 500+ MCQs / etc. (master prompt §19) | Partial — added ~75 high-quality terms | Originality rule (handoff §3.1) plus verification rule (§3.5) make it irresponsible to mass-generate technical claims without source grounding. The referenced source PDFs (Roofers Should Know, EPDM Hail, Insulation Pages) are not present in the repo. |
| Multi-level certification (Level 1/2/3) | Skipped this wave | Existing single certification works; tiering needs separate question banks per level — natural fit for wave 2 once additional terms are added. |
| Report Sentence Builder, Building-Owner Translation Mode, Daily Pre-Shift Challenge, Speed Round per-module banks, Leaderboards | Skipped this wave | Each is a new game-mode module that meaningfully expands scope. Build one per wave with the brainstorming skill so requirements are firm before implementation. |
| Source-map JSON / verified-claims / update-log | Skipped | Source files not present. `vf:1` flag on every time-sensitive term is the in-app substitute for now. |
| Manager: multi-staff aggregation, leaderboard across staff | Documented as "Export and combine offline" | No backend; per the rules above. Pattern: each device exports `crl-progress-<name>-<date>.json`; manager imports/aggregates externally or via optional Supabase sync. |

---

## Open tasks carried from v2

1. **`og-cover.png`** still missing — link previews render broken card.
2. **`lexicon.justennewton.media`** is still the placeholder domain in meta + Plausible. Replace once the real subdomain is confirmed.
3. **§7 structural decision** from original handoff was answered de facto: this wave kept categories (Option A) and tiers (Option B) and added new categories rather than rebuilding into sections. If owner wants a hard "sections" reorg later, that is a separate wave.

## Next-wave candidates (ranked)

1. **Hail Forensics module** as its own top-level section (dedicated landing, ordered curriculum, dedicated mini-cert) — biggest litigation-positioning value.
2. **Building-Owner Translation Mode** — high practical value for sales, low technical risk.
3. **Report Sentence Builder** — poor/better/best language pairs already drafted in master prompt §21.
4. **Multi-level certification (Level 1/2/3)** with role-based recommended paths.
5. **Optional Supabase sync wiring** so the manager dashboard can aggregate across staff.

---

## Verification status of new content

All new terms with measurable technical claims (R-values, code edition references, FM ratings, ASTM spec numbers, discount percentages, fire classes, ventilation ratios) carry `vf:1`. The flag exposes the "Verify Current Spec" badge on the term card. Owner / SME should walk the list before any printed/litigation use.

No third-party text reproduced. Definitions written independently per handoff §3.1.
