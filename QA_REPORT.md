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
