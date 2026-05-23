# QA Report — v3 Wave 1

**Build:** "The Complete Roofing Lexicon" v3, `index.html`
**Date:** 2026-05-18
**Tester:** This wave was authored without running the file in a browser. Items marked **Unverified** require a manual pass before release.

---

## Smoke-test checklist

Run these in order, on the device you plan to ship from. Each takes < 30 seconds.

### Loads and renders

- [ ] **Unverified** — Open `index.html` in Chrome on desktop. Page loads, masthead reads "The Complete Roofing Lexicon," nav shows 10 tabs (Overview · Lexicon · Flashcards · Quiz · Scenarios · Compatibility · Certify · Profile · Manager · About).
- [ ] **Unverified** — Open `index.html` on iOS Safari. Layout reflows correctly, tabs scroll horizontally on narrow screens.

### Data sanity

- [ ] **Unverified** — Overview KPI tile "Terms Studied" starts at 0. Stat line at bottom reads roughly "200 defined terms in 17 groups · spaced-repetition flashcards · four quiz modes · 16 inspection & claim scenarios · a 26-item compatibility drill · a printable certification."
- [ ] **Unverified** — Lexicon tab: all 17 groups are present with non-zero term counts. Filter chips show expected counts.

### Profile

- [ ] **Unverified** — Profile tab: name, role dropdown (12 options), and location field accept input and save (button shows "Profile saved.").
- [ ] **Unverified** — Theme toggle switches to dark mode; toggle text flips to "Switch to Light." Reload — dark mode persists.
- [ ] **Unverified** — Export Progress JSON downloads a `crl-progress-…json` file containing your state.
- [ ] **Unverified** — Reset Progress button asks for confirmation, then zeros mastery while keeping name/role.
- [ ] **Unverified** — Import Progress JSON accepts the file you just exported and restores state.

### Manager

- [ ] **Unverified** — Manager tab shows the lock card; passcode `ROOF123` unlocks the dashboard.
- [ ] **Unverified** — Group Mastery table renders with one row per category, bar widths roughly match the percentages.
- [ ] **Unverified** — After running a quiz with at least one wrong answer, the Most-Missed Terms table populates with that term and `Missed` ≥ 1.
- [ ] **Unverified** — Download Summary CSV → CSV opens in Excel/Numbers with one row per metric.
- [ ] **Unverified** — Download Full Progress JSON → matches the Profile export.
- [ ] **Unverified** — Change Passcode → save → Sign Out → re-enter with new passcode. Sign Out without saving keeps the prior passcode.

### Existing modules still work (regression check)

- [ ] **Unverified** — Flashcards: pick a category, run 3 cards, mark good/bad. Mastery counter updates.
- [ ] **Unverified** — Quiz: complete one full quiz in each of the 4 modes. Speed round saves a new best if applicable.
- [ ] **Unverified** — Scenarios: pick a new (post-v2) scenario like the EPDM lab-threshold one; answer; explanation renders.
- [ ] **Unverified** — Compatibility: complete several drill items including new ones (power vent, kick-out, ice & water shield).
- [ ] **Unverified** — Certify: take the full exam → 80% threshold → printable certificate renders with your name. Reset and retake.

### Dark mode visual check

- [ ] **Unverified** — In dark mode, every tab is readable. Term cards, flashcards, quiz options, manager tables all have appropriate contrast. Watch for white-on-white in any spot.

### Print stylesheet

- [ ] **Unverified** — On the Certify tab after passing, print preview shows only the certificate.

---

## Known risks / soft spots

1. **iOS file:// localStorage** — Some iOS Safari versions do not persist `localStorage` for `file://`-loaded HTML. If a staff member reports "nothing saves" from an AirDropped copy, host the file (per `distribution-guide.md` §2). The app's `Store` wrapper degrades to an in-memory fallback in that case.
2. **`v3` state on top of `v2` storage key** — the key is deliberately kept as `crl_v2_state` so existing users' progress carries forward. `loadState` deep-merges `prefs` to add new keys without dropping old ones. Verify on a real returning-user device before announcing the upgrade.
3. **CSV/JSON export uses `Blob` + anchor click** — works in modern browsers; very old Safari may swallow it. Acceptable for the target audience.
4. **QR generation** still depends on the cdnjs `qrious` script. If offline, the About tab shows "QR library unavailable" — by design.
5. **`og-cover.png` still missing** — link previews on social/iMessage render a broken card. Open task carried from v2.
6. **`vf:1` terms** carry the "Verify Current Spec" badge. Owner/SME should walk that list before any printed/litigation use; the values are best-of-known-industry but can shift between code editions, ASTM revisions, and policy forms.

---

## Pass criteria

Release when every "Unverified" box above is checked off on at least one desktop browser and one iOS Safari device.

---

## Update — 2026-05-23: automated test suite + pre-launch hardening

The "Unverified" manual checklist above is preserved for record. As of this date the project now ships with an automated test harness; many of those items are covered by Playwright. Manual verification on iOS Safari is still required before public push (Playwright runs headless Chromium only).

### Automated coverage

Run: `npm install` (one time), then `npm test`. 28 specs, all green at commit `29ae434`.

| File | Tests | What it locks in |
|---|---:|---|
| `tests/smoke.spec.js` | 13 | Every VIEW (`overview, lexicon, flash, quiz, scenarios, compat, hail, owner, report, certify, profile, manager, about`) opens, renders an expected marker, throws zero JS errors (CDN noise filtered). |
| `tests/cert-l1-distractors.spec.js` | 2 | Regression for the L1 distractor bug. 25 runs of `buildCert(1)` and `buildCert(2)` — every distractor must respect the level's tier cap. |
| `tests/sync-key-validation.spec.js` | 2 | 7 anon-key variants vs `sbParseAnonKey` (empty / malformed / service_role / valid anon / expired / wrong role) + `sbCleanKey` whitespace stripping. |
| `tests/manager-passcode.spec.js` | 2 | Wrong pin → error message. Right pin (`ROOF123`) → dashboard. Sign-Out → re-lock. |
| `tests/outbox.spec.js` | 4 | `outboxPush` + `outboxRead` append correctly. Queue survives `page.reload()`. `outboxFlush` correctly reports `skipped: sync disabled`. `sbInsert` queues without throwing when the target is unreachable. |
| `tests/pwa.spec.js` | 5 | `/manifest.json` valid + maskable icon present. `/sw.js` declares the three lifecycle listeners. `/icon-{192,512,maskable}.png` served as PNG with non-empty bodies. `<link rel=manifest>` + apple-touch-icon in `<head>`. SW registers without console errors. |

### Bugs fixed in this wave

1. **L1 certification distractor bug** (commit `be235f7`). `buildCert(level)` was sampling 3 distractors from the unfiltered `TERMS` list, so an Apprentice exam could surface forensic-tier-3 wrong answers like Hypalon (CSPE) or Cutbacks. Fix: distractors now drawn from the tier-filtered `src` pool (falling back to `TERMS` only when `src.length < 4`). Regression locked in by `cert-l1-distractors.spec.js`.

### Hardening shipped

- **Touch targets**: `.btn`, `.chip`, `nav.tabs button` now hit WCAG 2.5.5 (40–44 px). `:hover` affordances mirrored to `:active` / `:focus-visible` so touch users get the same visual feedback.
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` zeroes transitions/animations; flashcard flip becomes an instant swap.
- **System theme**: New `state.prefs.themeManual` flag distinguishes user-chosen from system-following. Default for new users is now follow-system; existing dark-mode users keep dark via a one-time migration. Profile panel exposes a "Use System Theme" reset.
- **Performance**: Fonts moved from `@import` to `<link>` + 3 preconnects. `supabase-js` and `qrious` lazy-loaded on first nav to Manager/About — saves ~60 KB on first paint for users who only read the Lexicon.
- **Sync outbox**: `sbInsert` no longer silently drops on failure. Queues in localStorage (`crl_outbox_v1`, max 500 items), auto-flushes on `window 'online'` and on Manager open, drops items after 8 retries with a `Outbox Dropped` Plausible event. Manager Sync Settings shows live pending count + manual "Flush Queue" button.
- **PWA**: `manifest.json` + `sw.js` + 3 icons + apple-touch-icon. Service worker precaches the shell (`/`, index.html, og-cover, icons, manifest), uses cache-first for Google Fonts, bypasses Supabase/Plausible/CDN scripts. Install prompt captured and surfaced as a button in the Profile panel.
- **Analytics**: `track(n,p)` now accepts custom-props. 7 new events (Term Mastered, Scenarios Completed, Compatibility Completed, Test-Cut Step Checked, Lexicon Search, Sync Queued, Outbox Flushed/Dropped, PWA Install Available/Clicked/Accepted/Dismissed/Installed) + existing cert/quiz events now carry `{level, score, role, mode, group}` props for Plausible cohorting.

### Manual verification still required

Headless Chromium is not iOS Safari. Before any public push, run the original "Unverified" checklist above on:

- iPhone (real device or Xcode simulator), iOS 17+ Safari
- iPad (real device or simulator), Safari + Safari "Add to Home Screen" install path
- Android Chrome, install via beforeinstallprompt → confirm app opens standalone with the JN seal icon
- Desktop Chrome + Firefox

Specifically verify:
- `localStorage` persistence on iOS Safari over `https://` (not `file://`)
- PWA install on Android Chrome and confirm maskable icon renders correctly inside the system's adaptive icon mask
- Print preview of a passing cert (`#certPrint` print stylesheet)
- Dark mode contrast on iOS Safari (forced colors, increased contrast accessibility settings)
- iOS Safari "Reduced Motion" accessibility toggle disables the flashcard flip animation

### Known risks (updated)

1. **iOS file:// localStorage** — unchanged. Solved by hosting; the app degrades gracefully when storage throws.
2. **`v3` state on `v2` key** — unchanged. The new `prefs.themeManual` field defaults safely via the deep-merge in `loadState`; the explicit migration block in `loadState` preserves explicit dark-mode preference.
3. **CSV/JSON export via Blob** — unchanged.
4. **QR generation** — now lazy-loaded. First click on About may briefly show "Loading QR library…" while qrious downloads.
5. **`og-cover.png`** — RESOLVED (commit `646f344`).
6. **`vf:1` terms** — unchanged. Phase 2 plan (per the review) adds a `vfDate` field and verification workflow; until then, SME review of `vf:1` terms before any litigation reference is still owner-mandatory.
7. **Cert credibility** — unchanged. `state.name` is free-text and `refNo()` is a non-cryptographic hash. HMAC + public verify page is queued for Phase 2.
8. **Manager dashboard is single-device** — unchanged. Team rollup (read from Supabase) is queued for Phase 2.
