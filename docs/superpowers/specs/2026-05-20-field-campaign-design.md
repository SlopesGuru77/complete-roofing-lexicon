# Roofing Lexicon: Field Campaign — Design Spec

**Date:** 2026-05-20
**Status:** Brainstorm-locked, awaiting user spec review
**Predecessor handoff:** `HANDOFF-2026-05-19.md`
**Sibling repo (not yet created):** `SlopesGuru77/roofing-lexicon-field-campaign`
**Target domain:** `play.justennewton.media`

---

## 1. Overview

Field Campaign is a login-gated, gamified training and credentialing web app for working roofing professionals — estimators, supplement writers, inspectors, claims adjusters, public adjusters. It replaces the current static single-file lexicon at `complete-roofing-lexicon.zeabur.app`. The static app's 223 terms and supporting datasets are ported wholesale into a Library tab; new boss-fight content is hand-authored on top.

Players progress by clearing **bosses** (short 3-round skill challenges). Clearing a boss earns the corresponding **card** in the player's collection. Owning every card in a zone plus passing the zone's **mastery exam** issues a **credential** — the résumé-worthy win condition. There is no XP and no consumable economy.

---

## 2. Scope

### In v1

- Magic-link signup/login
- 3 zones: Shingles, Low-Slope (SPF/TPO/EPDM), Code (IECC/IBC/IRC)
- 33 bosses total (10 standard + 1 mastery per zone)
- 33-card collection with 6 stacked composite rarity displays
- Streak mechanic with 7-day Holo / 30-day Legend unlocks
- Library tab: ported 223 terms + Leitner SRS flashcards + auto-curated "Trouble Terms" deck
- Study Cred meter unlocking cosmetic card frames
- 3 issued credentials (one per zone)
- Mobile-first PWA, bottom-tab navigation
- 301 redirect from old domain on launch day

### Out of v1 (explicitly deferred)

- Stripe / paid gating (designed-for via flag system, not built)
- Manager / company-seat licensing
- Native mobile (PWA only)
- Leaderboards / social
- Boss-level engagement analytics (only signup + outcomes wired)
- Multi-language

---

## 3. Stack & repo

- **Framework:** Vite 5 + React 18 + TypeScript
- **Styling:** Tailwind v4
- **Router:** React Router 6
- **State:** React Context + reducer
- **Animation:** Framer Motion
- **Testing:** Vitest (unit) — no E2E in v1
- **Backend:** Supabase (existing self-hosted at `https://rkasupabase.zeabur.app`); `supabase-js` v2
- **Deploy:** Static build pushed to Zeabur (new project, sibling to current Lexicon)
- **Analytics:** Plausible (new `data-domain=play.justennewton.media`)
- **PWA:** manifest + installable; no service-worker game state sync in v1

Repo to be created at `SlopesGuru77/roofing-lexicon-field-campaign` (public).

---

## 4. Auth flow

Single-screen magic-link only. No password, no OAuth, no Apple/Microsoft.

```
/login            → email field + "Send link"
/auth/callback    → Supabase redirect handler
  ├─ first login → /welcome (collect display_name + role)
  └─ returning   → /map
/welcome          → 2 fields, then /map
```

All in-game routes wrapped in `<RequireAuth>`. Unauthed access redirects to `/login` with the originally-requested path preserved as a query param for post-auth redirect.

**Blocker for first deploy:** Supabase Auth SMTP must be configured on the `auth` service (`69c87cdca972bb88a7633356`) — `GOTRUE_SMTP_HOST`, `GOTRUE_SMTP_USER`, `GOTRUE_SMTP_PASS`, `GOTRUE_SMTP_SENDER_NAME`, `GOTRUE_SMTP_ADMIN_EMAIL`. Suggested provider: Resend.

---

## 5. Data model

Three tables, all prefixed `rlfc_`. RLS enabled on all; each user sees only rows where `user_id = auth.uid()`. Card catalog (the 33 card definitions, zones, term keys, copy) lives in TypeScript at `src/content/cards.ts`, **not in the DB** — the DB only records what each user has earned.

### `rlfc_profiles` (1:1 with `auth.users`)

| Column | Type | Notes |
|---|---|---|
| user_id | uuid PK FK → auth.users.id | |
| display_name | text not null | collected at /welcome |
| role | text not null | enum-validated client-side: estimator \| supplement_writer \| inspector \| claims_adjuster \| public_adjuster \| other |
| streak_days | int not null default 0 | |
| last_played_at | date | nullable; used to compute streak continuation |
| study_cred | int not null default 0 | meter for cosmetic frames |
| mastery_passed_zones | text[] not null default '{}' | e.g., `{shingles, code}` |
| created_at | timestamptz not null default now() | |
| updated_at | timestamptz not null default now() | trigger |

### `rlfc_earned_cards`

| Column | Type | Notes |
|---|---|---|
| user_id | uuid FK | |
| card_id | text | matches `src/content/cards.ts` key |
| perfect_ever | bool not null default false | ever cleared with zero wrong |
| holo_ever | bool not null default false | ever cleared on 7-day streak |
| legend_ever | bool not null default false | ever cleared on 30-day streak OR via mastery exam |
| first_earned_at | timestamptz not null | |
| last_earned_at | timestamptz not null | |
| PRIMARY KEY (user_id, card_id) | | |

Composite tier is **derived at render time** from the three booleans; never stored.

### `rlfc_attempts`

| Column | Type | Notes |
|---|---|---|
| id | uuid PK default gen_random_uuid() | |
| user_id | uuid FK | |
| boss_id | text | |
| is_mastery_exam | bool not null default false | |
| score | int not null | 0–100 |
| passed | bool not null | score ≥ pass_threshold for that boss type |
| was_perfect | bool not null | zero wrong answers |
| streak_days_at_attempt | int not null | snapshot at fight start |
| missed_term_keys | text[] not null default '{}' | feeds Trouble Terms deck |
| attempted_at | timestamptz not null default now() | |

Indexes: `(user_id, attempted_at desc)`, `(user_id, boss_id)`.

### RLS policies

- `rlfc_profiles`: SELECT/INSERT/UPDATE allowed where `user_id = auth.uid()`
- `rlfc_earned_cards`: SELECT/INSERT/UPDATE allowed where `user_id = auth.uid()`
- `rlfc_attempts`: SELECT/INSERT allowed where `user_id = auth.uid()`; no UPDATE/DELETE

The full SQL goes in `rlfc-schema.sql` at repo root.

---

## 6. Game loop

### Boss format (standard)

- 3 rounds, ~5–7 minutes total
- **R1** rapid term ID (multiple choice, 6–8 questions, ~10s each)
- **R2** scenario decision (3–4 short scenarios with branching answer choices)
- **R3** report-language gauntlet (pick best phrasing from poor/better/best variants, 4–5 prompts)
- Hearts ALLOWED inside a single fight (player can miss several before failing; specifics deferred to implementation — recommended: 5 hearts, 1 lost per wrong answer)
- Pass threshold: **≥85% aggregate** across all rounds
- Fail = reset that fight only; progress (cards earned, streak, etc.) is preserved

### Boss format (mastery exam)

- 5 rounds, same round types but pulls questions from across the entire zone (random sampling, not just the latest boss)
- Pass threshold: **≥90% aggregate**
- **No hints, no tokens, no consumables.** Pure skill.

### Play model

- **Unlimited.** No energy, no daily cap, no hearts outside a fight.
- A player can attempt any boss any number of times back-to-back.

### Card earn paths (stacked)

Each clear updates the booleans on `rlfc_earned_cards`:

| Earn path | Sets | Notes |
|---|---|---|
| Clear (any score ≥ pass) | inserts row if missing | sets first_earned_at if first time |
| Perfect run (zero wrong) | `perfect_ever = true` | |
| Clear on 7-day streak | `holo_ever = true` | streak_days_at_attempt ≥ 7 |
| Clear on 30-day streak | `legend_ever = true` | streak_days_at_attempt ≥ 30 |
| Pass mastery exam | `legend_ever = true` on the exam's card | |

### Composite tier (derived at render)

| perfect | holo | legend | Display |
|---|---|---|---|
| F | F | F | Common |
| T | F | F | Rare |
| F | T | F | Holo |
| T | T | F | Rare Holo |
| F | F | T | Legend |
| F | T | T | Legend |
| T | F | T | Legendary Master |
| T | T | T | Legendary Master |

### Credentials

A credential is issued (entry pushed to `rlfc_profiles.mastery_passed_zones[]`) when both:

1. Player owns every card in the zone (all 11 rows present in `rlfc_earned_cards` for that zone's `card_id`s)
2. Player has passed the zone's mastery exam (entry already in `mastery_passed_zones[]`)

Credential issuance triggers the `credential_issued` Plausible event and renders a printable cert page (mirrors current Lexicon's L1/L2/L3 cert format, with `JNM-FC-XXXXXX` ID).

### Streak

- Computed from `last_played_at` vs. today.
- "Played" = at least one boss attempt OR at least one Library card review that day.
- `last_played_at` is stored as a DATE (no time component) in UTC. "Today" for roll-over is computed in **player local time** client-side, then converted to a UTC date before write. This avoids a player on the West Coast playing at 11pm Pacific from being credited for the next UTC day.
- Roll over: if `last_played_at` is yesterday (player local), `streak_days++`; if today, no-op; otherwise reset to 1.
- Streak is checked on every authenticated mutation and shown on Profile, Map, and Collection screens.

### Failure flow

- Streak survives (the attempt itself counts as "played today")
- Post-fight review screen lists every missed question with the correct answer and a link to the related term in Library
- Missed term keys are written to `rlfc_attempts.missed_term_keys` and aggregated client-side into a **Trouble Terms** Leitner deck in Library
- Player can immediately retry from the review screen

### Library + Study Cred

- Library tab is reference + Leitner SRS (ported from current Lexicon's flashcard system)
- Reviewing a Library card counts toward streak and increments `study_cred`
- Study Cred milestones unlock **cosmetic frames** for cards the player already owns (no gameplay effect)
- Study Cred does NOT issue hints, tokens, or any in-fight assistance

---

## 7. Card system

### Catalog shape

- **33 cards = 33 bosses**
- 10 standard + 1 mastery exam per zone × 3 zones
- Card definitions live in `src/content/cards.ts` keyed by `card_id` (string slug, matches `boss_id`)
- Each card record: `{ id, zone, name, term_key, illustration_path, is_mastery, blurb }`

### Art treatment

- **One illustration per card** (33 total), AI-generated via the existing nano-banana pipeline
- Tier differentiation is pure CSS overlay on the same illustration:
  - **Common:** matte newsprint frame, no foil
  - **Rare:** redline-accent frame (`#b91c1c`), subtle shadow
  - **Holo:** animated foil gradient overlay
  - **Legend:** gold (`#92400e`) frame + ember glow
  - **Rare Holo / Legendary Master:** combine effects (perfect-run frame on top of foil/gold)
- Unearned cards: silhouette with greyed term name visible (so the player knows what they're chasing)
- Composite tier shown on the live card; small corner badges:
  - "P" badge for `perfect_ever`
  - flame icon for any streak earn (`holo_ever || legend_ever`)
  - mastery seal for cards earned via mastery exam

### Zone-mastery progress

Collection screen surfaces per-zone progress: `cards earned / 11`. When all 11 are owned, the mastery exam node on the Map lights up. When the exam is also passed, the credential badge appears on the Profile.

---

## 8. UI surfaces

### Routes

```
PUBLIC
  /login              magic-link email input
  /auth/callback      Supabase redirect handler

GATED (RequireAuth)
  /welcome            first-login only: display_name + role
  /map                home tab (zone switcher + boss path)
  /collection         card grid per zone
  /library            term browser + flashcards + Trouble Terms
  /profile            streak, study cred, credential badges, settings
  /boss/:id           full-screen 3-round fight (no tab bar)
  /credential/:zone   printable cert page (read-only)
```

### Navigation

- **Mobile-first.** 4 bottom tabs: **Map** (home) / **Collection** / **Library** / **Profile**.
- Tab bar persistent on all gated routes EXCEPT `/boss/:id` and `/credential/:zone` (both full-screen takeover).
- No hamburger, no sidebar, no responsive desktop sidebar in v1 — design responsively but ship one layout.

### Map (home tab)

- Top: segmented zone switcher (Shingles / Low-Slope / Code)
- Body: vertical winding 11-node path (Duolingo-style) — 10 standard bosses (in lesson-design order) → mastery exam node at the bottom
- All 10 standard bosses unlocked from the start (adult-pro freedom)
- Mastery exam node visually locked until all 10 standard bosses cleared at least once
- Node states: unlocked-not-cleared, cleared-Common-only, cleared-Rare, cleared-Holo, cleared-Legend (color/halo reflects the player's highest composite earned on that card)
- Tap a node → `/boss/:id`

### Collection (tab)

- Same zone-switcher pattern as Map
- 3-wide grid of 11 cards per zone
- Each cell shows the live composite-tier render of the card OR a silhouette+greyed term name if unearned
- Tap a card → full-screen detail modal/sheet: definition + composite tier + "View boss" deep link to Map node + (if earned) date first earned + (if owned) Study Cred frame selector

### Library (tab)

- Term browser: searchable list of 223 ported terms (matches current Lexicon's `drawLex` UX)
- Tap a term → detail card (definition, field notes, related terms)
- Top toolbar tab: **Flashcards** (Leitner SRS, ported), **Trouble Terms** (auto-deck of recently missed)
- Library reviews count toward streak + Study Cred

### Profile (tab)

- Display name + role (editable)
- Streak counter ("17-day streak 🔥")
- Study Cred meter (progress to next cosmetic frame milestone)
- 3 credential badges (Shingles / Low-Slope / Code), each showing earned-or-locked state with a "View certificate" link when issued
- Settings: log out, theme, account deletion request

### Boss-fight (`/boss/:id`)

- Full-screen takeover, no tab bar
- Top: thin progress bar (round indicator + score-so-far)
- Body: question presentation (R1 multiple choice, R2 scenario branching, R3 report-language pick)
- Between rounds: brief transition card ("Round 2 — Scenario")
- End screen:
  - **On pass:** score, composite-tier reveal animation for the earned card, "Add to collection" → returns to Map
  - **On fail:** score, "Review" CTA → review screen → "Retry" or "Back to Map"

### Welcome (`/welcome`)

- First login only (detected by missing `rlfc_profiles` row)
- Two fields: display_name (text) + role (select, 6 options)
- Submit → INSERT `rlfc_profiles` → fire `signup_completed` Plausible event with `role` property → `/map`

### Credential (`/credential/:zone`)

- Read-only printable cert page
- Mirrors current Lexicon's L1/L2/L3 cert visual format
- ID format: `JNM-FC-XXXXXX` (deterministic from user_id + zone)
- Print stylesheet for clean letter-sized output

---

## 9. Content migration

### Direct port

The following datasets from the current `index.html` move into `src/content/` as typed TS modules, with **no behavioral changes**:

| Source | Destination | Notes |
|---|---|---|
| `TERMS` (223 entries) | `src/content/library.ts` `TERMS` | Same shape `{t, c, tier, d, n?, vf?, see?}` |
| `CATS` | `src/content/library.ts` `CATS` | Category groups |
| `SCENARIOS` | `src/content/library.ts` `SCENARIOS` | |
| `COMPAT` | `src/content/library.ts` `COMPAT` | Compatibility pairs |
| `PLAIN_ENGLISH` | `src/content/library.ts` `PLAIN_ENGLISH` | |
| `REPORT_PAIRS` | `src/content/library.ts` `REPORT_PAIRS` | |
| `HAIL_THRESHOLDS` | `src/content/library.ts` `HAIL_THRESHOLDS` | |
| `TEST_CUT_STEPS` | `src/content/library.ts` `TEST_CUT_STEPS` | |
| `CURRICULA` | `src/content/library.ts` `CURRICULA` | Kept for v2 role-tracks; not surfaced in v1 UI |

### New content (hand-authored)

- `src/content/cards.ts` — 33 card definitions (id, zone, name, term_key reference, illustration_path, is_mastery, blurb)
- `src/content/bosses/` — 33 boss question banks, one file per boss, each exporting `{ round1, round2, round3 }` arrays
- `src/content/illustrations/` — 33 base illustrations generated via nano-banana

**Authoring burden:** 33 × 3 = 99 round-question-sets. R1 needs ~6–8 MC questions per boss (≈ 200 MCs total); R2 needs 3–4 scenarios per boss (≈ 100 scenarios); R3 needs 4–5 report-language prompts per boss (≈ 130 prompts). All hand-authored from the term pool by the owner. No auto-generation.

---

## 10. Analytics (Plausible)

`data-domain="play.justennewton.media"`. Three goals wired on day 1:

| Event | Props | Fires when |
|---|---|---|
| `signup_completed` | `role` | First-login `/welcome` form submitted successfully |
| `card_earned` | `rarity`, `composite_tier`, `boss_id`, `zone` | After a passing boss-fight, when the row is INSERTed (or a boolean flipped from false→true on UPDATE) |
| `credential_issued` | `zone` | When all 11 cards owned + mastery passed in a zone |

Deferred to v2: boss-level engagement (`boss_attempt_started`, `boss_cleared`, `boss_failed`), retention (`daily_streak_milestone`), library usage (`library_term_viewed`, `library_deck_mastered`).

---

## 11. Launch posture

**Hard cutover on day 1.** No parallel-run period.

1. New Zeabur project deployed at `play.justennewton.media`
2. Current Lexicon Zeabur project (`6a0bec24c08ad7fb8a7dbb3a`) reconfigured to return a `301 Moved Permanently` to `https://play.justennewton.media` for all paths
3. Custom domain `complete-roofing-lexicon.zeabur.app` (or whichever public URL the static app is on) bound to that redirect
4. Plausible goal for the OLD domain decommissioned; new goals provisioned on the new domain

### Pre-launch checklist

- [ ] Sibling repo created and pushed (`SlopesGuru77/roofing-lexicon-field-campaign`)
- [ ] Supabase Auth SMTP configured + test magic-link delivered
- [ ] `rlfc-schema.sql` executed against Supabase Postgres + RLS verified
- [ ] All 33 boss question banks authored
- [ ] All 33 base illustrations generated and committed
- [ ] Plausible goals (signup_completed, card_earned, credential_issued) created in Plausible UI
- [ ] PWA manifest + favicon
- [ ] og-cover.png for `play.justennewton.media` (1200×630)
- [ ] Smoke test: full signup → first boss clear → credential issue on a single zone
- [ ] iOS Safari print stylesheet check for `/credential/:zone`

---

## 12. Non-obvious decisions worth flagging

- **No XP system.** Card collection is the sole progression. Validate this holds up once playtesters touch it; if engagement drops because there's "no number going up between cards," revisit by re-introducing XP as a cosmetic-rank-only layer (the §5 fallback option).
- **No consumable economy.** No hint tokens, no power-ups, no boosts. Mastery exam is raw skill. Trade-off: less long-tail "I'm grinding to buy something" engagement, but strongest fit for adult professional credibility.
- **Stacked rarity composites (6 displays).** More complex than 4 flat tiers but yields collection moments that reward both consistency (streak) and mastery (perfect runs).
- **Map: all-unlocked-at-start.** Respects expertise; loses some "world to conquer" tension. Bet here is that pros will self-pace.
- **Hard cutover.** Highest-risk launch posture chosen deliberately to avoid splitting attention/SEO across two domains. Requires day-1 stability.

---

## 13. Open items (do NOT block spec approval; resolve during implementation planning)

- Heart count and behavior inside a single fight (recommend 5 hearts, 1 lost per wrong, fight over at 0)
- Specific Study Cred milestones (recommend 10 / 25 / 50 / 100 term reviews → frame unlocks)
- Boss naming convention (recommend: term keys from the existing 223 — e.g., "Termination Bar", "Cricket", "Drip Edge")
- Mapping of which 30 of the 223 terms become the 30 standard bosses (10 per zone) + which 3 are the mastery exam slots
- Whether the streak counter shows on every screen or only Profile/Map/Collection (recommend the three listed)
- Specific Resend / SendGrid / Mailgun pick for Supabase Auth SMTP

---

## 14. Carry-over open items from prior session (still open, not part of this design)

These predate the brainstorm and remain open regardless of Field Campaign:

- Rotate all secrets pasted into chat 2026-05-19 (see `HANDOFF-2026-05-19.md` §4)
- The current static Lexicon's domain + og-cover.png are made moot by the hard-cutover decision
- iOS Safari smoke test of the OLD Lexicon's L1/L2/L3 print stylesheet — moot if old Lexicon is retired
