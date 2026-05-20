# Roofing Lexicon: Field Campaign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the v1 of *Roofing Lexicon: Field Campaign* — a magic-link-auth, mobile-first PWA at `play.justennewton.media` with 33 boss-fights across 3 zones, a stacked-rarity card collection, zone-mastery credentials, and a ported 223-term Library — replacing the current static Lexicon via hard-cutover redirect.

**Architecture:** Vite + React 18 + TypeScript SPA. Routing via React Router 6 (4 bottom tabs + boss + auth + welcome + cert). State via Context+reducer (Auth, Profile, Collection). Data via supabase-js v2 against self-hosted Supabase at `https://rkasupabase.zeabur.app` (3 `rlfc_*` tables, RLS on `user_id = auth.uid()`). Card catalog (33 records) lives in TypeScript, not DB. Plausible script tag wired at index.html. Static build deployed to a new Zeabur project; old Lexicon project becomes a 301 redirect on launch.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Tailwind v4, React Router 6, supabase-js v2, Framer Motion, Vitest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-05-20-field-campaign-design.md`

---

## File structure (locked)

```
roofing-lexicon-field-campaign/
├── public/
│   ├── manifest.webmanifest
│   ├── icons/{icon-192.png, icon-512.png, maskable.png}
│   └── og-cover.png
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css                    # Tailwind + design tokens
│   ├── types.ts                     # shared TS types (Zone, CompositeTier, etc.)
│   │
│   ├── lib/
│   │   ├── supabase.ts              # client + DB type aliases
│   │   ├── plausible.ts             # tiny event-fire helper
│   │   ├── date.ts                  # UTC ↔ player-local DATE helpers
│   │   ├── composite-tier.ts        # derive composite from (perfect, holo, legend)
│   │   └── streak.ts                # streak roll-over logic (pure)
│   │
│   ├── content/
│   │   ├── library.ts               # ported 223 TERMS + CATS + SCENARIOS + etc.
│   │   ├── cards.ts                 # 33 card definitions
│   │   └── bosses/                  # 33 boss Q-bank files, hand-authored later
│   │       ├── shingles/{01-...,11-mastery}.ts
│   │       ├── low-slope/{01-...,11-mastery}.ts
│   │       └── code/{01-...,11-mastery}.ts
│   │
│   ├── data/
│   │   ├── profiles.ts              # getProfile, createProfile, updateProfile
│   │   ├── earned-cards.ts          # earnCard, fetchEarnedCards
│   │   ├── attempts.ts              # logAttempt
│   │   └── credentials.ts           # checkAndIssueCredential
│   │
│   ├── state/
│   │   ├── AuthContext.tsx          # session + signIn + signOut
│   │   ├── ProfileContext.tsx       # profile row + streak + study_cred
│   │   └── CollectionContext.tsx    # earnedCards keyed by card_id
│   │
│   ├── routes/
│   │   ├── Login.tsx
│   │   ├── AuthCallback.tsx
│   │   ├── Welcome.tsx
│   │   ├── Map.tsx                  # home tab
│   │   ├── Collection.tsx
│   │   ├── Library.tsx
│   │   ├── Profile.tsx
│   │   ├── Boss.tsx                 # /boss/:id
│   │   └── Credential.tsx           # /credential/:zone (printable)
│   │
│   └── components/
│       ├── shell/
│       │   ├── TabBar.tsx
│       │   ├── ZoneSwitcher.tsx
│       │   └── RequireAuth.tsx
│       ├── card/
│       │   ├── Card.tsx             # renders composite tier
│       │   ├── CardSilhouette.tsx
│       │   └── CardDetail.tsx       # full-screen sheet
│       ├── map/
│       │   └── BossNode.tsx
│       ├── boss/
│       │   ├── BossRunner.tsx       # fight state machine
│       │   ├── ProgressBar.tsx
│       │   ├── RoundIntro.tsx
│       │   ├── R1RapidId.tsx
│       │   ├── R2Scenario.tsx
│       │   ├── R3ReportLang.tsx
│       │   ├── ResultScreen.tsx
│       │   └── ReviewScreen.tsx
│       ├── library/
│       │   ├── TermBrowser.tsx
│       │   ├── Flashcards.tsx
│       │   └── TroubleTerms.tsx
│       └── shared/
│           └── StreakBadge.tsx
│
├── tests/
│   └── unit/
│       ├── composite-tier.test.ts
│       ├── date.test.ts
│       ├── streak.test.ts
│       ├── credential.test.ts
│       └── boss-scoring.test.ts
│
├── rlfc-schema.sql
├── package.json
├── tsconfig.json
├── vite.config.ts
├── postcss.config.js
├── tailwind.config.ts
├── index.html
├── .env.example
├── .gitignore
└── README.md
```

---

## Phase 0 — Repo + scaffold

### Task 0.1: Create GitHub repo and clone

**Files:** none (provisioning)

- [ ] **Step 1: Create repo via gh**

Run:
```bash
gh repo create SlopesGuru77/roofing-lexicon-field-campaign --public --description "Roofing Lexicon: Field Campaign — gamified credentialing for roofing pros" --clone
```
Expected: repo created at `https://github.com/SlopesGuru77/roofing-lexicon-field-campaign`, cloned into current dir.

- [ ] **Step 2: cd into the new repo and verify**

```bash
cd roofing-lexicon-field-campaign
git remote -v
```
Expected: `origin` points to the new repo.

- [ ] **Step 3: Add baseline .gitignore**

Write `.gitignore`:
```
node_modules/
dist/
.env
.env.local
.DS_Store
*.log
.vite/
coverage/
```

- [ ] **Step 4: Initial commit**
```bash
git add .gitignore
git commit -m "chore: initial .gitignore"
git push -u origin main
```

### Task 0.2: Scaffold Vite + React + TS

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1: Run Vite scaffold**

```bash
npm create vite@latest . -- --template react-ts
```
Choose `y` when prompted to scaffold in non-empty dir.

- [ ] **Step 2: Install base deps**

```bash
npm install
```

- [ ] **Step 3: Smoke-test dev server**

```bash
npm run dev
```
Expected: Vite serves at http://localhost:5173, page renders "Vite + React".

Stop server (Ctrl+C).

- [ ] **Step 4: Commit scaffold**

```bash
git add .
git commit -m "chore: scaffold vite + react + ts"
```

### Task 0.3: Install runtime + dev deps

**Files:** `package.json`

- [ ] **Step 1: Install runtime deps**

```bash
npm install react-router-dom @supabase/supabase-js framer-motion
```

- [ ] **Step 2: Install dev deps**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom tailwindcss@next @tailwindcss/postcss@next postcss autoprefixer
```

- [ ] **Step 3: Verify package.json**

Open `package.json`. Confirm dependencies include `react-router-dom`, `@supabase/supabase-js`, `framer-motion`. devDependencies include `vitest`, `tailwindcss`, `@tailwindcss/postcss`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install runtime + dev deps"
```

### Task 0.4: Tailwind v4 config

**Files:**
- Create: `postcss.config.js`, `tailwind.config.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Write postcss.config.js**

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 2: Write tailwind.config.ts**

```ts
import type { Config } from 'tailwindcss';
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a0a',
        newsprint: '#f5f1e8',
        'paper-dark': '#ebe5d3',
        'paper-line': '#d4cdb7',
        card: '#fbf8ef',
        redline: '#b91c1c',
        footnote: '#475569',
        citation: '#92400e',
        good: '#1f5d3a',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        serif: ['"Cormorant Garamond"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
} satisfies Config;
```

- [ ] **Step 3: Replace src/index.css**

```css
@import "tailwindcss";

@theme {
  --color-ink: #0a0a0a;
  --color-newsprint: #f5f1e8;
}

html, body, #root { height: 100%; background: var(--color-newsprint); color: var(--color-ink); }
body { font-family: 'Inter', system-ui, sans-serif; }
```

- [ ] **Step 4: Replace src/App.tsx with smoke-test page**

```tsx
export default function App() {
  return (
    <div className="min-h-screen p-6">
      <h1 className="font-display text-3xl text-redline">Field Campaign</h1>
      <p className="font-serif">Tailwind is wired.</p>
    </div>
  );
}
```

- [ ] **Step 5: Run dev server and verify**

```bash
npm run dev
```
Expected: page shows red "Field Campaign" headline in serif font on cream background.

Stop server.

- [ ] **Step 6: Commit**

```bash
git add postcss.config.js tailwind.config.ts src/index.css src/App.tsx
git commit -m "chore: wire tailwind v4 + design tokens"
```

### Task 0.5: Vitest config

**Files:**
- Modify: `vite.config.ts`
- Create: `vitest.setup.ts`, `tests/unit/smoke.test.ts`

- [ ] **Step 1: Update vite.config.ts**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
});
```

- [ ] **Step 2: Create vitest.setup.ts**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 3: Add types reference**

In `tsconfig.json` add `"types": ["vitest/globals", "node"]` under `compilerOptions`.

- [ ] **Step 4: Write smoke test**

`tests/unit/smoke.test.ts`:
```ts
test('vitest runs', () => { expect(1 + 1).toBe(2); });
```

- [ ] **Step 5: Add test script + run**

In `package.json` `scripts`: `"test": "vitest run"`, `"test:watch": "vitest"`.

Run:
```bash
npm test
```
Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add vite.config.ts vitest.setup.ts tsconfig.json tests/unit/smoke.test.ts package.json
git commit -m "chore: wire vitest + jest-dom"
```

### Task 0.6: Environment file scaffold

**Files:**
- Create: `.env.example`, `.env.local` (gitignored)

- [ ] **Step 1: Write .env.example**

```
VITE_SUPABASE_URL=https://rkasupabase.zeabur.app
VITE_SUPABASE_ANON_KEY=<paste anon key>
VITE_PLAUSIBLE_DOMAIN=play.justennewton.media
```

- [ ] **Step 2: Write .env.local with real values**

Copy `.env.example` to `.env.local`, paste the current ANON_KEY from `HANDOFF-2026-05-19.md` §4 (or use the rotated key if rotation has happened).

- [ ] **Step 3: Commit example only**

```bash
git add .env.example
git commit -m "chore: add .env.example"
```

---

## Phase 1 — Database schema

### Task 1.1: Write rlfc-schema.sql

**Files:**
- Create: `rlfc-schema.sql`

- [ ] **Step 1: Write the schema**

```sql
-- Roofing Lexicon: Field Campaign — schema
-- Run via: npx zeabur@latest service exec --project-id 69c87cdba972bb88a7633301 --service-id 69c87cdca972bb88a7633302 -- psql -U postgres -d postgres -f rlfc-schema.sql

create extension if not exists "pgcrypto";

-- ============================================================
-- rlfc_profiles  (1:1 with auth.users)
-- ============================================================
create table if not exists public.rlfc_profiles (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  display_name         text not null check (char_length(display_name) between 1 and 60),
  role                 text not null check (role in (
    'estimator','supplement_writer','inspector',
    'claims_adjuster','public_adjuster','other'
  )),
  streak_days          int not null default 0 check (streak_days >= 0),
  last_played_at       date,
  study_cred           int not null default 0 check (study_cred >= 0),
  mastery_passed_zones text[] not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists trg_rlfc_profiles_updated_at on public.rlfc_profiles;
create trigger trg_rlfc_profiles_updated_at
  before update on public.rlfc_profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- rlfc_earned_cards  (one row per (user, card))
-- ============================================================
create table if not exists public.rlfc_earned_cards (
  user_id         uuid not null references auth.users(id) on delete cascade,
  card_id         text not null,
  perfect_ever    boolean not null default false,
  holo_ever       boolean not null default false,
  legend_ever     boolean not null default false,
  first_earned_at timestamptz not null default now(),
  last_earned_at  timestamptz not null default now(),
  primary key (user_id, card_id)
);

create index if not exists idx_rlfc_earned_cards_user on public.rlfc_earned_cards(user_id);

-- ============================================================
-- rlfc_attempts  (immutable log)
-- ============================================================
create table if not exists public.rlfc_attempts (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  boss_id                text not null,
  is_mastery_exam        boolean not null default false,
  score                  int not null check (score between 0 and 100),
  passed                 boolean not null,
  was_perfect            boolean not null,
  streak_days_at_attempt int not null default 0,
  missed_term_keys       text[] not null default '{}',
  attempted_at           timestamptz not null default now()
);

create index if not exists idx_rlfc_attempts_user_time on public.rlfc_attempts(user_id, attempted_at desc);
create index if not exists idx_rlfc_attempts_user_boss on public.rlfc_attempts(user_id, boss_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.rlfc_profiles      enable row level security;
alter table public.rlfc_earned_cards  enable row level security;
alter table public.rlfc_attempts      enable row level security;

-- profiles: SELECT/INSERT/UPDATE own row
drop policy if exists rlfc_profiles_select_own on public.rlfc_profiles;
drop policy if exists rlfc_profiles_insert_own on public.rlfc_profiles;
drop policy if exists rlfc_profiles_update_own on public.rlfc_profiles;
create policy rlfc_profiles_select_own on public.rlfc_profiles
  for select using (auth.uid() = user_id);
create policy rlfc_profiles_insert_own on public.rlfc_profiles
  for insert with check (auth.uid() = user_id);
create policy rlfc_profiles_update_own on public.rlfc_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- earned_cards: SELECT/INSERT/UPDATE own rows
drop policy if exists rlfc_earned_select_own on public.rlfc_earned_cards;
drop policy if exists rlfc_earned_insert_own on public.rlfc_earned_cards;
drop policy if exists rlfc_earned_update_own on public.rlfc_earned_cards;
create policy rlfc_earned_select_own on public.rlfc_earned_cards
  for select using (auth.uid() = user_id);
create policy rlfc_earned_insert_own on public.rlfc_earned_cards
  for insert with check (auth.uid() = user_id);
create policy rlfc_earned_update_own on public.rlfc_earned_cards
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- attempts: SELECT/INSERT own rows; no UPDATE/DELETE
drop policy if exists rlfc_attempts_select_own on public.rlfc_attempts;
drop policy if exists rlfc_attempts_insert_own on public.rlfc_attempts;
create policy rlfc_attempts_select_own on public.rlfc_attempts
  for select using (auth.uid() = user_id);
create policy rlfc_attempts_insert_own on public.rlfc_attempts
  for insert with check (auth.uid() = user_id);
```

- [ ] **Step 2: Commit**

```bash
git add rlfc-schema.sql
git commit -m "feat(db): rlfc schema with RLS"
```

### Task 1.2: Execute schema against Supabase

**Files:** none (operational)

- [ ] **Step 1: Copy schema into Postgres container and run**

```bash
npx zeabur@latest service exec --project-id 69c87cdba972bb88a7633301 --service-id 69c87cdca972bb88a7633302 -- bash -lc "cat > /tmp/rlfc.sql <<'SQL'
$(Get-Content rlfc-schema.sql -Raw)
SQL
psql -U postgres -d postgres -f /tmp/rlfc.sql"
```

(If the heredoc with backticks is awkward in PowerShell, instead: paste the SQL contents into Supabase Studio SQL Editor at the Studio URL and run.)

Expected: `CREATE TABLE`, `CREATE INDEX`, `ALTER TABLE`, `CREATE POLICY` messages with no errors.

- [ ] **Step 2: Verify with psql query**

```bash
npx zeabur@latest service exec --project-id 69c87cdba972bb88a7633301 --service-id 69c87cdca972bb88a7633302 -- psql -U postgres -d postgres -c "\dt rlfc_*"
```
Expected: three tables listed: `rlfc_attempts`, `rlfc_earned_cards`, `rlfc_profiles`.

- [ ] **Step 3: Verify RLS enabled**

```bash
npx zeabur@latest service exec --project-id 69c87cdba972bb88a7633301 --service-id 69c87cdca972bb88a7633302 -- psql -U postgres -d postgres -c "select schemaname, tablename, rowsecurity from pg_tables where tablename like 'rlfc_%';"
```
Expected: all three tables show `rowsecurity = t`.

---

## Phase 2 — Pure logic libraries (TDD)

### Task 2.1: Shared types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write types**

```ts
export type Zone = 'shingles' | 'low-slope' | 'code';

export type Role =
  | 'estimator'
  | 'supplement_writer'
  | 'inspector'
  | 'claims_adjuster'
  | 'public_adjuster'
  | 'other';

export type CompositeTier =
  | 'common'
  | 'rare'
  | 'holo'
  | 'rare-holo'
  | 'legend'
  | 'legendary-master';

export interface CardDef {
  id: string;
  zone: Zone;
  name: string;
  termKey: string;
  illustrationPath: string;
  isMastery: boolean;
  blurb: string;
}

export interface EarnedCard {
  cardId: string;
  perfectEver: boolean;
  holoEver: boolean;
  legendEver: boolean;
  firstEarnedAt: string;
  lastEarnedAt: string;
}

export interface ProfileRow {
  userId: string;
  displayName: string;
  role: Role;
  streakDays: number;
  lastPlayedAt: string | null;
  studyCred: number;
  masteryPassedZones: Zone[];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: shared TS types"
```

### Task 2.2: composite-tier (derives display from booleans)

**Files:**
- Create: `src/lib/composite-tier.ts`
- Create: `tests/unit/composite-tier.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/unit/composite-tier.test.ts`:
```ts
import { compositeTier } from '../../src/lib/composite-tier';

test('all false → common', () => {
  expect(compositeTier({ perfect: false, holo: false, legend: false })).toBe('common');
});
test('perfect only → rare', () => {
  expect(compositeTier({ perfect: true, holo: false, legend: false })).toBe('rare');
});
test('holo only → holo', () => {
  expect(compositeTier({ perfect: false, holo: true, legend: false })).toBe('holo');
});
test('perfect + holo → rare-holo', () => {
  expect(compositeTier({ perfect: true, holo: true, legend: false })).toBe('rare-holo');
});
test('legend (no perfect) → legend regardless of holo', () => {
  expect(compositeTier({ perfect: false, holo: false, legend: true })).toBe('legend');
  expect(compositeTier({ perfect: false, holo: true, legend: true })).toBe('legend');
});
test('perfect + legend → legendary-master regardless of holo', () => {
  expect(compositeTier({ perfect: true, holo: false, legend: true })).toBe('legendary-master');
  expect(compositeTier({ perfect: true, holo: true, legend: true })).toBe('legendary-master');
});
```

- [ ] **Step 2: Run tests, expect fail**

```bash
npm test -- composite-tier
```
Expected: 6 failed (module not found).

- [ ] **Step 3: Write implementation**

`src/lib/composite-tier.ts`:
```ts
import type { CompositeTier } from '../types';

interface Booleans { perfect: boolean; holo: boolean; legend: boolean; }

export function compositeTier({ perfect, holo, legend }: Booleans): CompositeTier {
  if (legend && perfect) return 'legendary-master';
  if (legend) return 'legend';
  if (perfect && holo) return 'rare-holo';
  if (holo) return 'holo';
  if (perfect) return 'rare';
  return 'common';
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
npm test -- composite-tier
```
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/composite-tier.ts tests/unit/composite-tier.test.ts
git commit -m "feat(lib): compositeTier derivation"
```

### Task 2.3: date helpers (UTC ↔ player-local DATE)

**Files:**
- Create: `src/lib/date.ts`
- Create: `tests/unit/date.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/unit/date.test.ts`:
```ts
import { localTodayISO, isYesterday } from '../../src/lib/date';

test('localTodayISO returns ISO date string from a Date', () => {
  // 2026-05-20 18:00 in any timezone should produce 2026-05-20 in player local
  const d = new Date('2026-05-20T18:00:00');
  expect(localTodayISO(d)).toMatch(/^2026-05-\d{2}$/);
});
test('isYesterday: 2026-05-19 vs today 2026-05-20 → true', () => {
  expect(isYesterday('2026-05-19', '2026-05-20')).toBe(true);
});
test('isYesterday: same day → false', () => {
  expect(isYesterday('2026-05-20', '2026-05-20')).toBe(false);
});
test('isYesterday: 2 days ago → false', () => {
  expect(isYesterday('2026-05-18', '2026-05-20')).toBe(false);
});
test('isYesterday handles month boundary', () => {
  expect(isYesterday('2026-04-30', '2026-05-01')).toBe(true);
});
test('isYesterday handles year boundary', () => {
  expect(isYesterday('2025-12-31', '2026-01-01')).toBe(true);
});
```

- [ ] **Step 2: Run tests, expect fail**

```bash
npm test -- date
```

- [ ] **Step 3: Implement**

`src/lib/date.ts`:
```ts
export function localTodayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isYesterday(maybeYesterday: string, today: string): boolean {
  const t = new Date(`${today}T00:00:00`);
  const prior = new Date(t.getTime() - 24 * 60 * 60 * 1000);
  return localTodayISO(prior) === maybeYesterday;
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
npm test -- date
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/date.ts tests/unit/date.test.ts
git commit -m "feat(lib): local date + isYesterday helpers"
```

### Task 2.4: streak roll-over logic

**Files:**
- Create: `src/lib/streak.ts`
- Create: `tests/unit/streak.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/unit/streak.test.ts`:
```ts
import { nextStreak } from '../../src/lib/streak';

test('first play ever → 1', () => {
  expect(nextStreak({ streakDays: 0, lastPlayedAt: null, today: '2026-05-20' }))
    .toEqual({ streakDays: 1, lastPlayedAt: '2026-05-20', didIncrement: true });
});
test('already played today → no-op', () => {
  expect(nextStreak({ streakDays: 5, lastPlayedAt: '2026-05-20', today: '2026-05-20' }))
    .toEqual({ streakDays: 5, lastPlayedAt: '2026-05-20', didIncrement: false });
});
test('played yesterday → increment', () => {
  expect(nextStreak({ streakDays: 5, lastPlayedAt: '2026-05-19', today: '2026-05-20' }))
    .toEqual({ streakDays: 6, lastPlayedAt: '2026-05-20', didIncrement: true });
});
test('gap of 2+ days → reset to 1', () => {
  expect(nextStreak({ streakDays: 12, lastPlayedAt: '2026-05-17', today: '2026-05-20' }))
    .toEqual({ streakDays: 1, lastPlayedAt: '2026-05-20', didIncrement: true });
});
```

- [ ] **Step 2: Run tests, expect fail**

```bash
npm test -- streak
```

- [ ] **Step 3: Implement**

`src/lib/streak.ts`:
```ts
import { isYesterday } from './date';

interface Input { streakDays: number; lastPlayedAt: string | null; today: string; }
interface Output { streakDays: number; lastPlayedAt: string; didIncrement: boolean; }

export function nextStreak({ streakDays, lastPlayedAt, today }: Input): Output {
  if (lastPlayedAt === today) {
    return { streakDays, lastPlayedAt, didIncrement: false };
  }
  if (lastPlayedAt && isYesterday(lastPlayedAt, today)) {
    return { streakDays: streakDays + 1, lastPlayedAt: today, didIncrement: true };
  }
  return { streakDays: 1, lastPlayedAt: today, didIncrement: true };
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
npm test -- streak
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/streak.ts tests/unit/streak.test.ts
git commit -m "feat(lib): streak roll-over (pure)"
```

### Task 2.5: boss-scoring (aggregate + perfect detection)

**Files:**
- Create: `src/lib/boss-scoring.ts`
- Create: `tests/unit/boss-scoring.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/unit/boss-scoring.test.ts`:
```ts
import { scoreFight, FightAnswer } from '../../src/lib/boss-scoring';

const allCorrect: FightAnswer[] = [
  { termKey: 'a', correct: true }, { termKey: 'b', correct: true }, { termKey: 'c', correct: true },
];
const oneWrong: FightAnswer[] = [
  { termKey: 'a', correct: true }, { termKey: 'b', correct: false }, { termKey: 'c', correct: true },
];

test('all correct → 100, passed=true (standard 85), perfect=true', () => {
  expect(scoreFight(allCorrect, 85))
    .toEqual({ score: 100, passed: true, wasPerfect: true, missedTermKeys: [] });
});
test('one wrong of three → 67, passed=false (85), perfect=false', () => {
  expect(scoreFight(oneWrong, 85))
    .toEqual({ score: 67, passed: false, wasPerfect: false, missedTermKeys: ['b'] });
});
test('86% threshold: 9/10 = 90 → passed', () => {
  const answers: FightAnswer[] = Array.from({ length: 10 }, (_, i) =>
    ({ termKey: `t${i}`, correct: i !== 0 }));
  const result = scoreFight(answers, 85);
  expect(result.score).toBe(90);
  expect(result.passed).toBe(true);
  expect(result.wasPerfect).toBe(false);
});
test('mastery exam threshold 90: 89% fails', () => {
  // 89/100 misses by 1
  const answers: FightAnswer[] = Array.from({ length: 100 }, (_, i) =>
    ({ termKey: `t${i}`, correct: i >= 11 }));
  const result = scoreFight(answers, 90);
  expect(result.score).toBe(89);
  expect(result.passed).toBe(false);
});
```

- [ ] **Step 2: Run tests, expect fail**

```bash
npm test -- boss-scoring
```

- [ ] **Step 3: Implement**

`src/lib/boss-scoring.ts`:
```ts
export interface FightAnswer { termKey: string; correct: boolean; }
export interface FightResult {
  score: number;
  passed: boolean;
  wasPerfect: boolean;
  missedTermKeys: string[];
}

export function scoreFight(answers: FightAnswer[], passThreshold: number): FightResult {
  const total = answers.length;
  const correctCount = answers.filter(a => a.correct).length;
  const score = Math.round((correctCount / total) * 100);
  return {
    score,
    passed: score >= passThreshold,
    wasPerfect: correctCount === total,
    missedTermKeys: answers.filter(a => !a.correct).map(a => a.termKey),
  };
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
npm test -- boss-scoring
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/boss-scoring.ts tests/unit/boss-scoring.test.ts
git commit -m "feat(lib): boss fight scoring (pure)"
```

### Task 2.6: credential issuance check

**Files:**
- Create: `src/lib/credential.ts`
- Create: `tests/unit/credential.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/unit/credential.test.ts`:
```ts
import { shouldIssueCredential } from '../../src/lib/credential';

const shinglesCardIds = ['s01','s02','s03','s04','s05','s06','s07','s08','s09','s10','s11-mastery'];

test('all 11 owned + mastery passed → true', () => {
  expect(shouldIssueCredential({
    zone: 'shingles',
    ownedCardIds: shinglesCardIds,
    zoneCardIds: shinglesCardIds,
    masteryPassedZones: ['shingles'],
  })).toBe(true);
});
test('missing 1 card → false', () => {
  expect(shouldIssueCredential({
    zone: 'shingles',
    ownedCardIds: shinglesCardIds.slice(0, 10),
    zoneCardIds: shinglesCardIds,
    masteryPassedZones: ['shingles'],
  })).toBe(false);
});
test('all owned but mastery not passed → false', () => {
  expect(shouldIssueCredential({
    zone: 'shingles',
    ownedCardIds: shinglesCardIds,
    zoneCardIds: shinglesCardIds,
    masteryPassedZones: [],
  })).toBe(false);
});
test('different zone in mastery list does not count', () => {
  expect(shouldIssueCredential({
    zone: 'shingles',
    ownedCardIds: shinglesCardIds,
    zoneCardIds: shinglesCardIds,
    masteryPassedZones: ['code'],
  })).toBe(false);
});
```

- [ ] **Step 2: Run tests, expect fail**

```bash
npm test -- credential
```

- [ ] **Step 3: Implement**

`src/lib/credential.ts`:
```ts
import type { Zone } from '../types';

interface Input {
  zone: Zone;
  ownedCardIds: string[];
  zoneCardIds: string[];
  masteryPassedZones: Zone[];
}

export function shouldIssueCredential({ zone, ownedCardIds, zoneCardIds, masteryPassedZones }: Input): boolean {
  if (!masteryPassedZones.includes(zone)) return false;
  const owned = new Set(ownedCardIds);
  return zoneCardIds.every(id => owned.has(id));
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
npm test -- credential
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/credential.ts tests/unit/credential.test.ts
git commit -m "feat(lib): credential issuance check (pure)"
```

---

## Phase 3 — Content port

### Task 3.1: Port library.ts from current index.html

**Files:**
- Create: `src/content/library.ts`
- Read source from: `../The Commercial Roofing Lexicon/index.html` (the current static app)

- [ ] **Step 1: Extract data blocks**

In the source `index.html`, locate the data blocks (see project CLAUDE.md anchors: `/* ===== Residential & Steep-Slope ===== */` etc.). Copy these arrays/objects into `src/content/library.ts`:
- `CATS`, `TIER_NAME`, `TERMS`, `SCENARIOS`, `COMPAT`, `PLAIN_ENGLISH`, `REPORT_PAIRS`, `HAIL_THRESHOLDS`, `TEST_CUT_STEPS`, `CURRICULA`

- [ ] **Step 2: Add TypeScript types**

At the top of `src/content/library.ts`:
```ts
export interface Term {
  t: string;       // unique term key
  c: string;       // category
  tier: 1 | 2 | 3; // Apprentice / Journeyman / Forensic
  d: string;       // definition
  n?: string;      // optional field notes
  vf?: boolean;    // "verify current spec" flag
  see?: string[];  // related terms
}

export interface Scenario { /* ...from source shape... */ }
// ...etc., one type per dataset
```

Type each exported array.

- [ ] **Step 3: Verify count**

```ts
// At bottom of file (delete before commit):
console.log('TERMS count:', TERMS.length);
```

Run a quick `tsx src/content/library.ts` or just `npx tsc --noEmit` to ensure no type errors. Expected: 223 terms.

- [ ] **Step 4: Remove the console.log**

- [ ] **Step 5: Commit**

```bash
git add src/content/library.ts
git commit -m "feat(content): port 223 terms + companion datasets to TS"
```

### Task 3.2: Stub src/content/cards.ts

**Files:**
- Create: `src/content/cards.ts`

- [ ] **Step 1: Write the catalog skeleton**

```ts
import type { CardDef, Zone } from '../types';

// 33 cards = 10 standard + 1 mastery per zone × 3 zones.
// Card IDs use the pattern: <zone-slug>-<NN>[-mastery]
// term_key references must match a TERMS[].t value in library.ts
// Owner to finalize specific term selections; placeholders shown for shape.

export const CARDS: CardDef[] = [
  // ---------- Shingles ----------
  { id: 'shingles-01', zone: 'shingles', name: 'TBD-term', termKey: 'TBD', illustrationPath: '/illustrations/shingles-01.png', isMastery: false, blurb: '' },
  // ... 9 more shingles standard
  { id: 'shingles-11-mastery', zone: 'shingles', name: 'Shingles Mastery', termKey: '__mastery__', illustrationPath: '/illustrations/shingles-mastery.png', isMastery: true, blurb: 'Final exam across the Shingles zone.' },

  // ---------- Low-Slope ----------
  // ... 10 + 1 mastery

  // ---------- Code ----------
  // ... 10 + 1 mastery
];

export const ZONES: Zone[] = ['shingles', 'low-slope', 'code'];

export const ZONE_LABEL: Record<Zone, string> = {
  shingles: 'Shingles',
  'low-slope': 'Low-Slope',
  code: 'Code',
};

export function cardsByZone(zone: Zone): CardDef[] {
  return CARDS.filter(c => c.zone === zone);
}

export function cardById(id: string): CardDef | undefined {
  return CARDS.find(c => c.id === id);
}

export function masteryCard(zone: Zone): CardDef | undefined {
  return CARDS.find(c => c.zone === zone && c.isMastery);
}
```

Note: the TBD term keys are deliberate. They'll be filled when the boss banks are authored (see Phase 16). The catalog SHAPE is locked here so all downstream UI compiles.

- [ ] **Step 2: Commit**

```bash
git add src/content/cards.ts
git commit -m "feat(content): cards catalog skeleton (33 slots, term keys TBD)"
```

### Task 3.3: Boss-bank file scaffolding

**Files:**
- Create: `src/content/bosses/index.ts`
- Create: `src/content/bosses/types.ts`

- [ ] **Step 1: Define question types**

`src/content/bosses/types.ts`:
```ts
export interface R1Question {
  prompt: string;         // "Which term means…"
  termKey: string;        // correct answer term key
  choices: string[];      // includes correct + 3 distractors
}

export interface R2Scenario {
  prompt: string;         // a short field scenario
  choices: { text: string; correct: boolean }[];
  relatedTermKey?: string; // for review screen linking
}

export interface R3Prompt {
  topic: string;
  poor: string;
  better: string;
  best: string;
  why: string;
  relatedTermKey?: string;
}

export interface BossBank {
  bossId: string;
  round1: R1Question[];   // ~6-8 items
  round2: R2Scenario[];   // ~3-4 items
  round3: R3Prompt[];     // ~4-5 items
}

export interface MasteryBank extends BossBank {
  isMastery: true;
  // pulls from across zone; same shape but 5 rounds of ~larger banks
}
```

- [ ] **Step 2: Write the registry**

`src/content/bosses/index.ts`:
```ts
import type { BossBank } from './types';
// Imports for each of the 33 boss bank files go here when they are authored.
// e.g., import { shingles01 } from './shingles/01';
export const BOSS_BANKS: Record<string, BossBank> = {
  // 'shingles-01': shingles01,
};

export function bossBank(bossId: string): BossBank | undefined {
  return BOSS_BANKS[bossId];
}
```

- [ ] **Step 3: Commit**

```bash
git add src/content/bosses
git commit -m "feat(content): boss-bank registry + question types"
```

---

## Phase 4 — Supabase client + auth

### Task 4.1: Supabase client singleton

**Files:**
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Write client**

```ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
}

export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "feat(lib): supabase client singleton"
```

### Task 4.2: AuthContext + provider

**Files:**
- Create: `src/state/AuthContext.tsx`

- [ ] **Step 1: Write context**

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthCtx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signInWithEmail(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    return error ? { error: error.message } : {};
  }

  async function signOut() { await supabase.auth.signOut(); }

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, loading, signInWithEmail, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/state/AuthContext.tsx
git commit -m "feat(state): AuthContext with magic-link signIn"
```

### Task 4.3: RequireAuth wrapper

**Files:**
- Create: `src/components/shell/RequireAuth.tsx`

- [ ] **Step 1: Write component**

```tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext';
import { ReactNode } from 'react';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="p-6">Loading…</div>;
  if (!session) {
    const redirect = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return <>{children}</>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shell/RequireAuth.tsx
git commit -m "feat(shell): RequireAuth route guard"
```

### Task 4.4: Login route

**Files:**
- Create: `src/routes/Login.tsx`

- [ ] **Step 1: Write Login**

```tsx
import { useState } from 'react';
import { useAuth } from '../state/AuthContext';

export default function Login() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const { error } = await signInWithEmail(email);
    if (error) { setError(error); setStatus('error'); }
    else { setStatus('sent'); }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="font-display text-4xl text-redline mb-2">Field Campaign</h1>
      <p className="font-serif text-footnote mb-8">Sign in with a magic link.</p>
      {status === 'sent' ? (
        <p className="text-good font-mono">Check your inbox at {email}.</p>
      ) : (
        <form onSubmit={submit} className="flex flex-col w-full max-w-sm gap-3">
          <input
            type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="border border-paper-line bg-card px-3 py-2 font-mono"
          />
          <button
            type="submit" disabled={status === 'sending'}
            className="bg-ink text-newsprint py-2 font-mono uppercase tracking-wide"
          >{status === 'sending' ? 'Sending…' : 'Send link'}</button>
          {error && <p className="text-redline font-mono text-sm">{error}</p>}
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/Login.tsx
git commit -m "feat(route): Login (magic-link single field)"
```

### Task 4.5: AuthCallback route

**Files:**
- Create: `src/routes/AuthCallback.tsx`

- [ ] **Step 1: Write component**

```tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { getProfile } from '../data/profiles';

export default function AuthCallback() {
  const { session, loading } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect');

  useEffect(() => {
    if (loading) return;
    if (!session) { nav('/login', { replace: true }); return; }
    (async () => {
      const profile = await getProfile(session.user.id);
      if (!profile) nav('/welcome', { replace: true });
      else nav(redirect || '/map', { replace: true });
    })();
  }, [loading, session, redirect, nav]);

  return <div className="p-6">Signing you in…</div>;
}
```

(`getProfile` defined in Task 5.1; this file will fail compile until then — acceptable to defer compile-checking until Phase 5.)

- [ ] **Step 2: Commit**

```bash
git add src/routes/AuthCallback.tsx
git commit -m "feat(route): AuthCallback redirect to /welcome or /map"
```

---

## Phase 5 — Data access layer

### Task 5.1: profiles.ts

**Files:**
- Create: `src/data/profiles.ts`

- [ ] **Step 1: Write CRUD functions**

```ts
import { supabase } from '../lib/supabase';
import type { ProfileRow, Role, Zone } from '../types';

const TABLE = 'rlfc_profiles';

function fromRow(r: any): ProfileRow {
  return {
    userId: r.user_id,
    displayName: r.display_name,
    role: r.role,
    streakDays: r.streak_days,
    lastPlayedAt: r.last_played_at,
    studyCred: r.study_cred,
    masteryPassedZones: r.mastery_passed_zones ?? [],
  };
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

export async function createProfile(input: { userId: string; displayName: string; role: Role }): Promise<ProfileRow> {
  const { data, error } = await supabase.from(TABLE).insert({
    user_id: input.userId,
    display_name: input.displayName,
    role: input.role,
  }).select().single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateStreak(userId: string, streakDays: number, lastPlayedAt: string): Promise<void> {
  const { error } = await supabase.from(TABLE)
    .update({ streak_days: streakDays, last_played_at: lastPlayedAt })
    .eq('user_id', userId);
  if (error) throw error;
}

export async function incrementStudyCred(userId: string, by: number): Promise<void> {
  // Read-modify-write (study_cred is small, conflicts unlikely; if it matters, move to a SQL function later)
  const { data, error } = await supabase.from(TABLE).select('study_cred').eq('user_id', userId).single();
  if (error) throw error;
  const next = (data.study_cred ?? 0) + by;
  const { error: e2 } = await supabase.from(TABLE).update({ study_cred: next }).eq('user_id', userId);
  if (e2) throw e2;
}

export async function addMasteryZone(userId: string, zone: Zone): Promise<void> {
  // Append zone if not present
  const { data, error } = await supabase.from(TABLE).select('mastery_passed_zones').eq('user_id', userId).single();
  if (error) throw error;
  const cur = (data.mastery_passed_zones ?? []) as Zone[];
  if (cur.includes(zone)) return;
  const { error: e2 } = await supabase.from(TABLE)
    .update({ mastery_passed_zones: [...cur, zone] })
    .eq('user_id', userId);
  if (e2) throw e2;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/profiles.ts
git commit -m "feat(data): profile CRUD + streak/study-cred/mastery helpers"
```

### Task 5.2: earned-cards.ts

**Files:**
- Create: `src/data/earned-cards.ts`

- [ ] **Step 1: Write functions**

```ts
import { supabase } from '../lib/supabase';
import type { EarnedCard } from '../types';

const TABLE = 'rlfc_earned_cards';

function fromRow(r: any): EarnedCard {
  return {
    cardId: r.card_id,
    perfectEver: r.perfect_ever,
    holoEver: r.holo_ever,
    legendEver: r.legend_ever,
    firstEarnedAt: r.first_earned_at,
    lastEarnedAt: r.last_earned_at,
  };
}

export async function fetchEarnedCards(userId: string): Promise<EarnedCard[]> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

interface EarnInput {
  userId: string;
  cardId: string;
  wasPerfect: boolean;
  holoEarned: boolean;
  legendEarned: boolean;
}

// Upserts: insert with these flags if missing, else OR-merge into existing booleans.
export async function earnCard({ userId, cardId, wasPerfect, holoEarned, legendEarned }: EarnInput): Promise<EarnedCard> {
  // Try fetch first
  const { data: existing } = await supabase.from(TABLE)
    .select('*').eq('user_id', userId).eq('card_id', cardId).maybeSingle();

  const now = new Date().toISOString();

  if (!existing) {
    const { data, error } = await supabase.from(TABLE).insert({
      user_id: userId, card_id: cardId,
      perfect_ever: wasPerfect, holo_ever: holoEarned, legend_ever: legendEarned,
      first_earned_at: now, last_earned_at: now,
    }).select().single();
    if (error) throw error;
    return fromRow(data);
  }

  const { data, error } = await supabase.from(TABLE).update({
    perfect_ever: existing.perfect_ever || wasPerfect,
    holo_ever:    existing.holo_ever    || holoEarned,
    legend_ever:  existing.legend_ever  || legendEarned,
    last_earned_at: now,
  }).eq('user_id', userId).eq('card_id', cardId).select().single();
  if (error) throw error;
  return fromRow(data);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/earned-cards.ts
git commit -m "feat(data): earnCard upsert (OR-merges booleans) + fetchEarnedCards"
```

### Task 5.3: attempts.ts

**Files:**
- Create: `src/data/attempts.ts`

- [ ] **Step 1: Write log function**

```ts
import { supabase } from '../lib/supabase';

const TABLE = 'rlfc_attempts';

export interface AttemptInput {
  userId: string;
  bossId: string;
  isMasteryExam: boolean;
  score: number;
  passed: boolean;
  wasPerfect: boolean;
  streakDaysAtAttempt: number;
  missedTermKeys: string[];
}

export async function logAttempt(a: AttemptInput): Promise<void> {
  const { error } = await supabase.from(TABLE).insert({
    user_id: a.userId, boss_id: a.bossId, is_mastery_exam: a.isMasteryExam,
    score: a.score, passed: a.passed, was_perfect: a.wasPerfect,
    streak_days_at_attempt: a.streakDaysAtAttempt, missed_term_keys: a.missedTermKeys,
  });
  if (error) throw error;
}

export async function recentMissedTermKeys(userId: string, sinceDays = 14): Promise<string[]> {
  const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString();
  const { data, error } = await supabase.from(TABLE)
    .select('missed_term_keys')
    .eq('user_id', userId)
    .gte('attempted_at', since);
  if (error) throw error;
  const all = (data ?? []).flatMap(r => r.missed_term_keys as string[]);
  return Array.from(new Set(all));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/attempts.ts
git commit -m "feat(data): attempts log + recent missed terms query"
```

### Task 5.4: credentials.ts

**Files:**
- Create: `src/data/credentials.ts`

- [ ] **Step 1: Write the orchestrator**

```ts
import type { Zone, ProfileRow, EarnedCard } from '../types';
import { cardsByZone } from '../content/cards';
import { shouldIssueCredential } from '../lib/credential';
import { addMasteryZone } from './profiles';

interface CheckInput {
  profile: ProfileRow;
  earned: EarnedCard[];
  zone: Zone;
}

// Returns true if a new credential was just issued (caller fires Plausible event).
export async function checkAndIssueCredential({ profile, earned, zone }: CheckInput): Promise<boolean> {
  if (profile.masteryPassedZones.includes(zone)) return false; // already had it
  const zoneCardIds = cardsByZone(zone).map(c => c.id);
  const ownedIds = earned.map(e => e.cardId);
  const issue = shouldIssueCredential({
    zone,
    ownedCardIds: ownedIds,
    zoneCardIds,
    masteryPassedZones: [...profile.masteryPassedZones, zone],
  });
  if (issue) {
    await addMasteryZone(profile.userId, zone);
    return true;
  }
  return false;
}
```

Note: the mastery exam pass itself is recorded by writing the zone into `masteryPassedZones` (via `addMasteryZone`). Then this checker is called to verify all 11 cards are owned.

- [ ] **Step 2: Commit**

```bash
git add src/data/credentials.ts
git commit -m "feat(data): credential issuance orchestrator"
```

---

## Phase 6 — App shell + routing

### Task 6.1: ProfileContext + CollectionContext

**Files:**
- Create: `src/state/ProfileContext.tsx`
- Create: `src/state/CollectionContext.tsx`

- [ ] **Step 1: Write ProfileContext**

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getProfile } from '../data/profiles';
import type { ProfileRow } from '../types';

interface Ctx {
  profile: ProfileRow | null;
  loading: boolean;
  reload: () => Promise<void>;
}
const C = createContext<Ctx | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(false);

  async function reload() {
    if (!user) { setProfile(null); return; }
    setLoading(true);
    setProfile(await getProfile(user.id));
    setLoading(false);
  }
  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  return <C.Provider value={{ profile, loading, reload }}>{children}</C.Provider>;
}
export function useProfile() {
  const v = useContext(C);
  if (!v) throw new Error('useProfile must be inside ProfileProvider');
  return v;
}
```

- [ ] **Step 2: Write CollectionContext**

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { fetchEarnedCards } from '../data/earned-cards';
import type { EarnedCard } from '../types';

interface Ctx {
  earned: EarnedCard[];
  loading: boolean;
  reload: () => Promise<void>;
}
const C = createContext<Ctx | null>(null);

export function CollectionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [earned, setEarned] = useState<EarnedCard[]>([]);
  const [loading, setLoading] = useState(false);

  async function reload() {
    if (!user) { setEarned([]); return; }
    setLoading(true);
    setEarned(await fetchEarnedCards(user.id));
    setLoading(false);
  }
  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  return <C.Provider value={{ earned, loading, reload }}>{children}</C.Provider>;
}
export function useCollection() {
  const v = useContext(C);
  if (!v) throw new Error('useCollection must be inside CollectionProvider');
  return v;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/state/ProfileContext.tsx src/state/CollectionContext.tsx
git commit -m "feat(state): Profile + Collection contexts"
```

### Task 6.2: TabBar + AppShell

**Files:**
- Create: `src/components/shell/TabBar.tsx`
- Create: `src/components/shell/AppShell.tsx`

- [ ] **Step 1: Write TabBar**

```tsx
import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/map', label: 'Map' },
  { to: '/collection', label: 'Collection' },
  { to: '/library', label: 'Library' },
  { to: '/profile', label: 'Profile' },
];

export function TabBar() {
  return (
    <nav className="fixed bottom-0 inset-x-0 border-t border-paper-line bg-newsprint flex">
      {TABS.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            `flex-1 py-3 text-center font-mono text-sm uppercase tracking-wider ${
              isActive ? 'text-redline' : 'text-footnote'
            }`
          }
        >{t.label}</NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Write AppShell**

```tsx
import { Outlet } from 'react-router-dom';
import { TabBar } from './TabBar';

export function AppShell() {
  return (
    <div className="min-h-screen pb-16">
      <main className="px-4 pt-4"><Outlet /></main>
      <TabBar />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/shell/TabBar.tsx src/components/shell/AppShell.tsx
git commit -m "feat(shell): TabBar + AppShell"
```

### Task 6.3: Wire router in App.tsx

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: Update App.tsx**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './state/AuthContext';
import { ProfileProvider } from './state/ProfileContext';
import { CollectionProvider } from './state/CollectionContext';
import { RequireAuth } from './components/shell/RequireAuth';
import { AppShell } from './components/shell/AppShell';
import Login from './routes/Login';
import AuthCallback from './routes/AuthCallback';
import Welcome from './routes/Welcome';
import Map from './routes/Map';
import Collection from './routes/Collection';
import Library from './routes/Library';
import Profile from './routes/Profile';
import Boss from './routes/Boss';
import Credential from './routes/Credential';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <CollectionProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/welcome" element={<RequireAuth><Welcome /></RequireAuth>} />
              <Route path="/boss/:id" element={<RequireAuth><Boss /></RequireAuth>} />
              <Route path="/credential/:zone" element={<RequireAuth><Credential /></RequireAuth>} />
              <Route element={<RequireAuth><AppShell /></RequireAuth>}>
                <Route path="/map" element={<Map />} />
                <Route path="/collection" element={<Collection />} />
                <Route path="/library" element={<Library />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route path="*" element={<Navigate to="/map" replace />} />
            </Routes>
          </CollectionProvider>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Stub the route files (so it compiles)**

For each of `Welcome`, `Map`, `Collection`, `Library`, `Profile`, `Boss`, `Credential` create `src/routes/<Name>.tsx` with:

```tsx
export default function Welcome() { return <div>Welcome — TODO</div>; }
```
(matching name per file)

- [ ] **Step 3: Run typecheck + dev**

```bash
npx tsc --noEmit
npm run dev
```
Expected: compiles. Navigating to `/` → redirects to `/login` (no session yet).

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/routes
git commit -m "feat(app): wire router + provider tree + route stubs"
```

---

## Phase 7 — Welcome flow

### Task 7.1: Welcome route

**Files:**
- Modify: `src/routes/Welcome.tsx`

- [ ] **Step 1: Implement form**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { useProfile } from '../state/ProfileContext';
import { createProfile } from '../data/profiles';
import { fire } from '../lib/plausible';
import type { Role } from '../types';

const ROLES: { value: Role; label: string }[] = [
  { value: 'estimator', label: 'Estimator' },
  { value: 'supplement_writer', label: 'Supplement Writer' },
  { value: 'inspector', label: 'Inspector' },
  { value: 'claims_adjuster', label: 'Claims Adjuster' },
  { value: 'public_adjuster', label: 'Public Adjuster' },
  { value: 'other', label: 'Other' },
];

export default function Welcome() {
  const { user } = useAuth();
  const { reload } = useProfile();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('estimator');
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await createProfile({ userId: user.id, displayName: name.trim(), role });
    fire('signup_completed', { role });
    await reload();
    nav('/map', { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="font-display text-3xl text-redline mb-6">Welcome.</h1>
      <form onSubmit={submit} className="flex flex-col w-full max-w-sm gap-3">
        <label className="font-mono text-sm uppercase">What should we call you?</label>
        <input
          required minLength={1} maxLength={60}
          value={name} onChange={e => setName(e.target.value)}
          className="border border-paper-line bg-card px-3 py-2 font-serif"
        />
        <label className="font-mono text-sm uppercase mt-3">Your role</label>
        <select value={role} onChange={e => setRole(e.target.value as Role)}
          className="border border-paper-line bg-card px-3 py-2 font-serif">
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <button type="submit" disabled={submitting}
          className="mt-4 bg-ink text-newsprint py-2 font-mono uppercase">
          {submitting ? 'Saving…' : 'Start'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Create lib/plausible.ts (used above)**

```ts
type PlausibleFn = (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
declare global { interface Window { plausible?: PlausibleFn; } }
export function fire(event: string, props?: Record<string, string | number | boolean>): void {
  window.plausible?.(event, props ? { props } : undefined);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/Welcome.tsx src/lib/plausible.ts
git commit -m "feat(route): Welcome form + plausible fire helper"
```

---

## Phase 8 — Profile tab

### Task 8.1: Profile route

**Files:**
- Modify: `src/routes/Profile.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useProfile } from '../state/ProfileContext';
import { useAuth } from '../state/AuthContext';
import { useCollection } from '../state/CollectionContext';
import { cardsByZone, ZONES, ZONE_LABEL } from '../content/cards';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { profile, loading } = useProfile();
  const { earned } = useCollection();
  const { signOut } = useAuth();
  if (loading || !profile) return <div>Loading…</div>;

  const earnedByZone = (zone: typeof ZONES[number]) => {
    const ids = new Set(earned.map(e => e.cardId));
    return cardsByZone(zone).filter(c => ids.has(c.id)).length;
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-3xl">{profile.displayName}</h1>
      <p className="font-mono text-footnote text-sm uppercase">{profile.role.replace('_', ' ')}</p>

      <div className="mt-6 flex gap-4">
        <div><div className="font-display text-2xl text-redline">{profile.streakDays}</div><div className="font-mono text-xs uppercase">Streak</div></div>
        <div><div className="font-display text-2xl">{profile.studyCred}</div><div className="font-mono text-xs uppercase">Study Cred</div></div>
      </div>

      <h2 className="font-display text-xl mt-8 mb-3">Credentials</h2>
      <ul className="space-y-2">
        {ZONES.map(z => {
          const total = cardsByZone(z).length;
          const have = earnedByZone(z);
          const issued = profile.masteryPassedZones.includes(z) && have === total;
          return (
            <li key={z} className="flex justify-between border-b border-paper-line py-2">
              <span className="font-serif">{ZONE_LABEL[z]} Mastery</span>
              <span className="font-mono text-sm">
                {issued
                  ? <Link to={`/credential/${z}`} className="text-good">Issued — view</Link>
                  : `${have}/${total}`}
              </span>
            </li>
          );
        })}
      </ul>

      <button onClick={signOut}
        className="mt-10 border border-paper-line px-4 py-2 font-mono text-sm uppercase">
        Sign out
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/Profile.tsx
git commit -m "feat(route): Profile (streak, study cred, credential list, sign out)"
```

---

## Phase 9 — Library tab

### Task 9.1: TermBrowser

**Files:**
- Create: `src/components/library/TermBrowser.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useMemo, useState } from 'react';
import { TERMS } from '../../content/library';

export function TermBrowser() {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return TERMS;
    return TERMS.filter(t => t.t.toLowerCase().includes(needle) || t.d.toLowerCase().includes(needle));
  }, [q]);

  return (
    <div>
      <input value={q} onChange={e => setQ(e.target.value)}
        placeholder="Search 223 terms…"
        className="w-full border border-paper-line bg-card px-3 py-2 font-mono"/>
      <ul className="mt-3 divide-y divide-paper-line">
        {filtered.map(t => (
          <li key={t.t} className="py-3">
            <div className="font-display text-lg">{t.t}</div>
            <div className="font-mono text-xs uppercase text-footnote">{t.c} · Tier {t.tier}</div>
            <p className="font-serif text-sm mt-1">{t.d}</p>
            {t.n && <p className="font-serif text-xs text-footnote italic mt-1">Field note: {t.n}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/library/TermBrowser.tsx
git commit -m "feat(library): TermBrowser (search-as-you-type)"
```

### Task 9.2: Flashcards (Leitner)

**Files:**
- Create: `src/components/library/Flashcards.tsx`

- [ ] **Step 1: Implement minimum Leitner**

```tsx
import { useState, useEffect } from 'react';
import { TERMS } from '../../content/library';
import { useProfile } from '../../state/ProfileContext';
import { incrementStudyCred, updateStreak } from '../../data/profiles';
import { nextStreak } from '../../lib/streak';
import { localTodayISO } from '../../lib/date';

interface Card { termKey: string; box: 0|1|2|3|4|5; }
const LS_KEY = 'rlfc_leitner';

function load(): Record<string, Card> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function save(s: Record<string, Card>) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

export function Flashcards() {
  const [state, setState] = useState<Record<string, Card>>(load);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const { profile, reload } = useProfile();

  const deck = TERMS.filter(t => (state[t.t]?.box ?? 0) < 5);
  const term = deck[idx % Math.max(1, deck.length)];

  useEffect(() => { save(state); }, [state]);

  async function mark(correct: boolean) {
    if (!term) return;
    const cur = state[term.t] ?? { termKey: term.t, box: 0 };
    const nextBox = Math.max(0, Math.min(5, cur.box + (correct ? 1 : -1))) as Card['box'];
    setState({ ...state, [term.t]: { ...cur, box: nextBox } });
    setShowBack(false);
    setIdx(i => i + 1);

    // streak + study cred
    if (profile && correct) {
      const today = localTodayISO();
      const ns = nextStreak({ streakDays: profile.streakDays, lastPlayedAt: profile.lastPlayedAt, today });
      await updateStreak(profile.userId, ns.streakDays, ns.lastPlayedAt);
      await incrementStudyCred(profile.userId, 1);
      await reload();
    }
  }

  if (!term) return <p className="font-serif">All mastered. Try Trouble Terms.</p>;

  return (
    <div className="border border-paper-line bg-card p-4">
      <div className="font-mono text-xs text-footnote uppercase">{term.c} · Tier {term.tier}</div>
      <div className="font-display text-2xl mt-2">{term.t}</div>
      {showBack
        ? <>
            <p className="font-serif mt-3">{term.d}</p>
            <div className="mt-4 flex gap-3">
              <button onClick={() => mark(false)} className="flex-1 border border-redline py-2 font-mono uppercase">Missed</button>
              <button onClick={() => mark(true)}  className="flex-1 bg-good text-newsprint py-2 font-mono uppercase">Got it</button>
            </div>
          </>
        : <button onClick={() => setShowBack(true)} className="mt-6 bg-ink text-newsprint w-full py-2 font-mono uppercase">Reveal</button>
      }
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/library/Flashcards.tsx
git commit -m "feat(library): Flashcards (Leitner SRS in localStorage)"
```

### Task 9.3: TroubleTerms deck

**Files:**
- Create: `src/components/library/TroubleTerms.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../state/AuthContext';
import { recentMissedTermKeys } from '../../data/attempts';
import { TERMS } from '../../content/library';

export function TroubleTerms() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<string[]>([]);
  useEffect(() => {
    if (!user) return;
    recentMissedTermKeys(user.id, 14).then(setKeys);
  }, [user?.id]);

  if (!keys.length) return <p className="font-serif text-footnote">No trouble terms yet — failed boss questions land here.</p>;
  const cards = TERMS.filter(t => keys.includes(t.t));
  return (
    <ul className="divide-y divide-paper-line">
      {cards.map(t => (
        <li key={t.t} className="py-3">
          <div className="font-display text-lg">{t.t}</div>
          <p className="font-serif text-sm">{t.d}</p>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/library/TroubleTerms.tsx
git commit -m "feat(library): TroubleTerms (recent missed from attempts)"
```

### Task 9.4: Library route with sub-tabs

**Files:**
- Modify: `src/routes/Library.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useState } from 'react';
import { TermBrowser } from '../components/library/TermBrowser';
import { Flashcards } from '../components/library/Flashcards';
import { TroubleTerms } from '../components/library/TroubleTerms';

type Sub = 'browse' | 'flashcards' | 'trouble';

export default function Library() {
  const [sub, setSub] = useState<Sub>('browse');
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex gap-2 mb-4">
        {(['browse','flashcards','trouble'] as Sub[]).map(s => (
          <button key={s} onClick={() => setSub(s)}
            className={`flex-1 py-2 font-mono uppercase text-sm border-b-2 ${
              sub === s ? 'border-redline text-redline' : 'border-paper-line text-footnote'
            }`}>{s === 'browse' ? 'Terms' : s === 'flashcards' ? 'Flashcards' : 'Trouble'}</button>
        ))}
      </div>
      {sub === 'browse'     && <TermBrowser />}
      {sub === 'flashcards' && <Flashcards />}
      {sub === 'trouble'    && <TroubleTerms />}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/Library.tsx
git commit -m "feat(route): Library with 3 sub-tabs"
```

---

## Phase 10 — Map tab

### Task 10.1: ZoneSwitcher

**Files:**
- Create: `src/components/shell/ZoneSwitcher.tsx`

- [ ] **Step 1: Implement**

```tsx
import { ZONES, ZONE_LABEL } from '../../content/cards';
import type { Zone } from '../../types';

export function ZoneSwitcher({ value, onChange }: { value: Zone; onChange: (z: Zone) => void }) {
  return (
    <div className="flex border border-paper-line">
      {ZONES.map(z => (
        <button key={z} onClick={() => onChange(z)}
          className={`flex-1 py-2 font-mono uppercase text-sm ${
            value === z ? 'bg-ink text-newsprint' : 'text-footnote'
          }`}>{ZONE_LABEL[z]}</button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shell/ZoneSwitcher.tsx
git commit -m "feat(shell): ZoneSwitcher segmented control"
```

### Task 10.2: BossNode

**Files:**
- Create: `src/components/map/BossNode.tsx`

- [ ] **Step 1: Implement**

```tsx
import { Link } from 'react-router-dom';
import type { CardDef } from '../../types';
import type { EarnedCard } from '../../types';
import { compositeTier } from '../../lib/composite-tier';

interface Props { card: CardDef; earned?: EarnedCard; locked?: boolean; }

const TIER_HALO: Record<string, string> = {
  common: 'shadow-none',
  rare: 'shadow-[0_0_0_2px_var(--color-redline,#b91c1c)]',
  holo: 'shadow-[0_0_12px_4px_rgba(180,180,255,0.6)]',
  'rare-holo': 'shadow-[0_0_14px_4px_rgba(255,200,200,0.7)]',
  legend: 'shadow-[0_0_20px_6px_rgba(255,200,80,0.7)]',
  'legendary-master': 'shadow-[0_0_24px_8px_rgba(255,220,120,0.85)]',
};

export function BossNode({ card, earned, locked }: Props) {
  const tier = earned
    ? compositeTier({ perfect: earned.perfectEver, holo: earned.holoEver, legend: earned.legendEver })
    : 'common';
  const halo = earned ? TIER_HALO[tier] : '';
  const base = `block w-20 h-20 rounded-full border-2 flex items-center justify-center font-display text-xs text-center ${halo}`;
  const styles = locked
    ? `${base} border-paper-line bg-paper-dark text-footnote opacity-50`
    : earned
      ? `${base} border-ink bg-card`
      : `${base} border-ink bg-newsprint`;

  if (locked) {
    return <div className={styles}>Locked</div>;
  }
  return <Link to={`/boss/${card.id}`} className={styles}>{card.name}</Link>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/map/BossNode.tsx
git commit -m "feat(map): BossNode with tier-aware halo"
```

### Task 10.3: Map route

**Files:**
- Modify: `src/routes/Map.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useState } from 'react';
import { ZoneSwitcher } from '../components/shell/ZoneSwitcher';
import { BossNode } from '../components/map/BossNode';
import { cardsByZone } from '../content/cards';
import { useCollection } from '../state/CollectionContext';
import type { Zone } from '../types';

export default function Map() {
  const [zone, setZone] = useState<Zone>('shingles');
  const { earned } = useCollection();
  const cards = cardsByZone(zone);
  const ownedIds = new Set(earned.map(e => e.cardId));
  const standardCleared = cards.filter(c => !c.isMastery && ownedIds.has(c.id)).length;
  const allStandardCleared = cards.filter(c => !c.isMastery).every(c => ownedIds.has(c.id));

  return (
    <div className="max-w-md mx-auto">
      <ZoneSwitcher value={zone} onChange={setZone} />
      <p className="font-mono text-xs text-footnote uppercase mt-3 text-center">
        {standardCleared} / 10 standard cleared
      </p>
      <div className="mt-6 flex flex-col items-center gap-6">
        {cards.map((c, i) => (
          <div key={c.id} className={i % 2 === 0 ? 'self-start ml-6' : 'self-end mr-6'}>
            <BossNode
              card={c}
              earned={earned.find(e => e.cardId === c.id)}
              locked={c.isMastery && !allStandardCleared}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/Map.tsx
git commit -m "feat(route): Map (zone switcher + winding 11-node path)"
```

---

## Phase 11 — Collection tab

### Task 11.1: Card render component

**Files:**
- Create: `src/components/card/Card.tsx`
- Create: `src/components/card/CardSilhouette.tsx`

- [ ] **Step 1: Implement Card**

```tsx
import type { CardDef, EarnedCard } from '../../types';
import { compositeTier } from '../../lib/composite-tier';

const FRAME: Record<string, string> = {
  common: 'border-2 border-ink bg-card',
  rare: 'border-2 border-redline bg-card',
  holo: 'border-2 border-ink bg-card bg-gradient-to-br from-card via-paper-dark to-card',
  'rare-holo': 'border-2 border-redline bg-gradient-to-br from-card via-paper-dark to-card',
  legend: 'border-2 border-citation bg-card shadow-[0_0_12px_4px_rgba(255,200,80,0.45)]',
  'legendary-master': 'border-4 border-citation bg-card shadow-[0_0_18px_6px_rgba(255,210,100,0.65)]',
};

export function Card({ card, earned }: { card: CardDef; earned: EarnedCard }) {
  const tier = compositeTier({ perfect: earned.perfectEver, holo: earned.holoEver, legend: earned.legendEver });
  return (
    <div className={`aspect-[3/4] p-2 flex flex-col ${FRAME[tier]}`}>
      <div className="font-mono text-[10px] uppercase text-footnote">{card.zone}</div>
      <div className="font-display text-sm mt-1 flex-1">{card.name}</div>
      <div className="font-mono text-[10px] uppercase text-citation mt-1">{tier.replace('-', ' ')}</div>
      <div className="flex gap-1 text-[10px]">
        {earned.perfectEver && <span title="Perfect run">P</span>}
        {(earned.holoEver || earned.legendEver) && <span title="Streak earned">🔥</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement Silhouette**

```tsx
import type { CardDef } from '../../types';
export function CardSilhouette({ card }: { card: CardDef }) {
  return (
    <div className="aspect-[3/4] p-2 border border-paper-line bg-paper-dark flex flex-col opacity-60">
      <div className="font-mono text-[10px] uppercase text-footnote">{card.zone}</div>
      <div className="font-display text-sm mt-1 flex-1 text-footnote">{card.name}</div>
      <div className="font-mono text-[10px] uppercase text-footnote">unearned</div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/card
git commit -m "feat(card): Card + Silhouette renderers"
```

### Task 11.2: Collection route

**Files:**
- Modify: `src/routes/Collection.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useState } from 'react';
import { ZoneSwitcher } from '../components/shell/ZoneSwitcher';
import { Card } from '../components/card/Card';
import { CardSilhouette } from '../components/card/CardSilhouette';
import { cardsByZone, ZONE_LABEL } from '../content/cards';
import { useCollection } from '../state/CollectionContext';
import type { Zone } from '../types';

export default function Collection() {
  const [zone, setZone] = useState<Zone>('shingles');
  const { earned } = useCollection();
  const cards = cardsByZone(zone);
  const byId = new Map(earned.map(e => [e.cardId, e]));
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-2xl mb-2">{ZONE_LABEL[zone]} Collection</h1>
      <ZoneSwitcher value={zone} onChange={setZone} />
      <div className="grid grid-cols-3 gap-3 mt-6">
        {cards.map(c => {
          const e = byId.get(c.id);
          return e ? <Card key={c.id} card={c} earned={e}/> : <CardSilhouette key={c.id} card={c}/>;
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/Collection.tsx
git commit -m "feat(route): Collection (zone-segmented 11-card grid)"
```

---

## Phase 12 — Boss-fight engine

### Task 12.1: ProgressBar + RoundIntro

**Files:**
- Create: `src/components/boss/ProgressBar.tsx`
- Create: `src/components/boss/RoundIntro.tsx`

- [ ] **Step 1: Implement**

```tsx
// ProgressBar.tsx
export function ProgressBar({ round, totalRounds, scoreSoFar }:
  { round: number; totalRounds: number; scoreSoFar: number }) {
  return (
    <div className="border-b border-paper-line py-2 px-4 flex justify-between font-mono text-xs uppercase">
      <span>Round {round} / {totalRounds}</span>
      <span>{scoreSoFar} pt</span>
    </div>
  );
}
```

```tsx
// RoundIntro.tsx
export function RoundIntro({ round, title, onStart }: { round: number; title: string; onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="font-mono uppercase text-footnote">Round {round}</div>
      <div className="font-display text-3xl my-3">{title}</div>
      <button onClick={onStart} className="mt-6 bg-ink text-newsprint px-6 py-2 font-mono uppercase">Start</button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/boss/ProgressBar.tsx src/components/boss/RoundIntro.tsx
git commit -m "feat(boss): ProgressBar + RoundIntro"
```

### Task 12.2: R1RapidId, R2Scenario, R3ReportLang round components

**Files:**
- Create: `src/components/boss/R1RapidId.tsx`
- Create: `src/components/boss/R2Scenario.tsx`
- Create: `src/components/boss/R3ReportLang.tsx`

- [ ] **Step 1: R1**

```tsx
import { useState } from 'react';
import type { R1Question } from '../../content/bosses/types';
import type { FightAnswer } from '../../lib/boss-scoring';

export function R1RapidId({ qs, onComplete }: { qs: R1Question[]; onComplete: (a: FightAnswer[]) => void }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<FightAnswer[]>([]);
  const q = qs[i];

  function pick(choice: string) {
    const next = [...answers, { termKey: q.termKey, correct: choice === q.termKey }];
    if (i + 1 >= qs.length) onComplete(next);
    else { setAnswers(next); setI(i + 1); }
  }

  return (
    <div className="p-6">
      <p className="font-mono text-xs text-footnote uppercase">Term {i+1} / {qs.length}</p>
      <h2 className="font-display text-xl mt-2 mb-4">{q.prompt}</h2>
      <div className="grid gap-2">
        {q.choices.map(c => (
          <button key={c} onClick={() => pick(c)}
            className="border border-paper-line bg-card px-3 py-3 text-left font-serif">{c}</button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: R2**

```tsx
import { useState } from 'react';
import type { R2Scenario } from '../../content/bosses/types';
import type { FightAnswer } from '../../lib/boss-scoring';

export function R2ScenarioRound({ qs, onComplete }: { qs: R2Scenario[]; onComplete: (a: FightAnswer[]) => void }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<FightAnswer[]>([]);
  const q = qs[i];

  function pick(idx: number) {
    const choice = q.choices[idx];
    const next = [...answers, { termKey: q.relatedTermKey ?? `scenario-${i}`, correct: choice.correct }];
    if (i + 1 >= qs.length) onComplete(next);
    else { setAnswers(next); setI(i + 1); }
  }

  return (
    <div className="p-6">
      <p className="font-mono text-xs text-footnote uppercase">Scenario {i+1} / {qs.length}</p>
      <p className="font-serif mt-2 mb-4">{q.prompt}</p>
      <div className="grid gap-2">
        {q.choices.map((c, idx) => (
          <button key={idx} onClick={() => pick(idx)}
            className="border border-paper-line bg-card px-3 py-3 text-left font-serif">{c.text}</button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: R3**

```tsx
import { useState } from 'react';
import type { R3Prompt } from '../../content/bosses/types';
import type { FightAnswer } from '../../lib/boss-scoring';

export function R3ReportLang({ qs, onComplete }: { qs: R3Prompt[]; onComplete: (a: FightAnswer[]) => void }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<FightAnswer[]>([]);
  const q = qs[i];

  function pick(level: 'poor' | 'better' | 'best') {
    const next = [...answers, { termKey: q.relatedTermKey ?? `report-${i}`, correct: level === 'best' }];
    if (i + 1 >= qs.length) onComplete(next);
    else { setAnswers(next); setI(i + 1); }
  }

  return (
    <div className="p-6">
      <p className="font-mono text-xs text-footnote uppercase">Topic {i+1} / {qs.length}</p>
      <h2 className="font-display text-lg mt-2 mb-3">{q.topic}</h2>
      <div className="grid gap-2">
        {(['poor','better','best'] as const).map(level => (
          <button key={level} onClick={() => pick(level)}
            className="border border-paper-line bg-card px-3 py-3 text-left font-serif">
            <span className="font-mono text-xs uppercase text-footnote mr-2">{level}</span>{q[level]}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/boss/R1RapidId.tsx src/components/boss/R2Scenario.tsx src/components/boss/R3ReportLang.tsx
git commit -m "feat(boss): R1/R2/R3 round components"
```

### Task 12.3: ResultScreen + ReviewScreen

**Files:**
- Create: `src/components/boss/ResultScreen.tsx`
- Create: `src/components/boss/ReviewScreen.tsx`

- [ ] **Step 1: ResultScreen**

```tsx
import { Link } from 'react-router-dom';
import type { CardDef, EarnedCard } from '../../types';
import { Card } from '../card/Card';

interface Props {
  passed: boolean;
  score: number;
  card: CardDef;
  earned?: EarnedCard;          // present on pass
  onReview: () => void;          // shown on fail
  onRetry: () => void;
}

export function ResultScreen({ passed, score, card, earned, onReview, onRetry }: Props) {
  return (
    <div className="p-6 flex flex-col items-center min-h-[80vh]">
      <div className="font-mono uppercase text-footnote">{passed ? 'Cleared' : 'Failed'}</div>
      <div className="font-display text-5xl my-3">{score}</div>
      {passed && earned && (
        <div className="w-32 my-4">
          <Card card={card} earned={earned} />
        </div>
      )}
      <div className="flex gap-3 mt-6">
        {!passed && (
          <button onClick={onReview} className="border border-ink px-4 py-2 font-mono uppercase">Review</button>
        )}
        <button onClick={onRetry} className="border border-ink px-4 py-2 font-mono uppercase">Retry</button>
        <Link to="/map" className="bg-ink text-newsprint px-4 py-2 font-mono uppercase">Back to Map</Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: ReviewScreen**

```tsx
import { Link } from 'react-router-dom';
import { TERMS } from '../../content/library';
import type { FightAnswer } from '../../lib/boss-scoring';

export function ReviewScreen({ answers, onClose }: { answers: FightAnswer[]; onClose: () => void }) {
  const missed = answers.filter(a => !a.correct);
  return (
    <div className="p-6">
      <h2 className="font-display text-2xl mb-3">Review</h2>
      <ul className="divide-y divide-paper-line">
        {missed.map(a => {
          const t = TERMS.find(t => t.t === a.termKey);
          return (
            <li key={a.termKey} className="py-3">
              <div className="font-display">{t?.t ?? a.termKey}</div>
              <p className="font-serif text-sm">{t?.d ?? '(no entry in library — scenario or report-language item)'}</p>
              {t && <Link to={`/library?q=${encodeURIComponent(t.t)}`} className="font-mono text-xs uppercase text-citation">Open in Library →</Link>}
            </li>
          );
        })}
      </ul>
      <button onClick={onClose} className="mt-6 bg-ink text-newsprint px-4 py-2 font-mono uppercase">Done</button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/boss/ResultScreen.tsx src/components/boss/ReviewScreen.tsx
git commit -m "feat(boss): Result + Review screens"
```

### Task 12.4: BossRunner state machine

**Files:**
- Create: `src/components/boss/BossRunner.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BossBank } from '../../content/bosses/types';
import type { CardDef, EarnedCard } from '../../types';
import { ProgressBar } from './ProgressBar';
import { RoundIntro } from './RoundIntro';
import { R1RapidId } from './R1RapidId';
import { R2ScenarioRound } from './R2Scenario';
import { R3ReportLang } from './R3ReportLang';
import { ResultScreen } from './ResultScreen';
import { ReviewScreen } from './ReviewScreen';
import { scoreFight, FightAnswer } from '../../lib/boss-scoring';
import { useProfile } from '../../state/ProfileContext';
import { useAuth } from '../../state/AuthContext';
import { useCollection } from '../../state/CollectionContext';
import { logAttempt } from '../../data/attempts';
import { earnCard } from '../../data/earned-cards';
import { updateStreak } from '../../data/profiles';
import { nextStreak } from '../../lib/streak';
import { localTodayISO } from '../../lib/date';
import { fire } from '../../lib/plausible';
import { compositeTier } from '../../lib/composite-tier';
import { checkAndIssueCredential } from '../../data/credentials';
import { addMasteryZone } from '../../data/profiles';

type Phase = 'intro-1' | 'r1' | 'intro-2' | 'r2' | 'intro-3' | 'r3' | 'result' | 'review';

interface Props { card: CardDef; bank: BossBank; }

const PASS = (isMastery: boolean) => isMastery ? 90 : 85;

export function BossRunner({ card, bank }: Props) {
  const nav = useNavigate();
  const { user } = useAuth();
  const { profile, reload: reloadProfile } = useProfile();
  const { earned, reload: reloadCollection } = useCollection();

  const [phase, setPhase] = useState<Phase>('intro-1');
  const [answers, setAnswers] = useState<FightAnswer[]>([]);
  const [result, setResult] = useState<ReturnType<typeof scoreFight> | null>(null);
  const [earnedRow, setEarnedRow] = useState<EarnedCard | null>(null);

  function appendRound(a: FightAnswer[], nextPhase: Phase) {
    setAnswers(prev => [...prev, ...a]);
    setPhase(nextPhase);
  }

  async function finishFight(allAnswers: FightAnswer[]) {
    if (!user || !profile) return;
    const r = scoreFight(allAnswers, PASS(card.isMastery));
    setResult(r);

    // streak roll-over
    const today = localTodayISO();
    const ns = nextStreak({ streakDays: profile.streakDays, lastPlayedAt: profile.lastPlayedAt, today });
    await updateStreak(profile.userId, ns.streakDays, ns.lastPlayedAt);
    const streakUsed = ns.streakDays;

    await logAttempt({
      userId: user.id, bossId: card.id, isMasteryExam: card.isMastery,
      score: r.score, passed: r.passed, wasPerfect: r.wasPerfect,
      streakDaysAtAttempt: streakUsed, missedTermKeys: r.missedTermKeys,
    });

    if (r.passed) {
      // card earn flags
      const holoEarned = streakUsed >= 7;
      const legendEarned = streakUsed >= 30 || card.isMastery;
      const earned = await earnCard({
        userId: user.id, cardId: card.id,
        wasPerfect: r.wasPerfect, holoEarned, legendEarned,
      });
      setEarnedRow(earned);
      const tier = compositeTier({ perfect: earned.perfectEver, holo: earned.holoEver, legend: earned.legendEver });
      fire('card_earned', { rarity: tier, composite_tier: tier, boss_id: card.id, zone: card.zone });

      if (card.isMastery) {
        await addMasteryZone(user.id, card.zone);
      }

      // After collection + profile refresh, check credential
      await reloadProfile();
      await reloadCollection();
      const refreshedProfile = (await import('../../data/profiles')).getProfile(user.id);
      const refreshedEarned  = (await import('../../data/earned-cards')).fetchEarnedCards(user.id);
      const [p, e] = await Promise.all([refreshedProfile, refreshedEarned]);
      if (p) {
        const issued = await checkAndIssueCredential({ profile: p, earned: e, zone: card.zone });
        if (issued) fire('credential_issued', { zone: card.zone });
      }
    }
    setPhase('result');
  }

  const scoreSoFar = answers.filter(a => a.correct).length;
  const totalRounds = 3;

  return (
    <div className="min-h-screen flex flex-col">
      {phase !== 'result' && phase !== 'review' && (
        <ProgressBar
          round={phase === 'r1' || phase === 'intro-1' ? 1 : phase === 'r2' || phase === 'intro-2' ? 2 : 3}
          totalRounds={totalRounds}
          scoreSoFar={scoreSoFar}
        />
      )}

      {phase === 'intro-1' && <RoundIntro round={1} title="Rapid term ID" onStart={() => setPhase('r1')} />}
      {phase === 'r1' && <R1RapidId qs={bank.round1} onComplete={a => appendRound(a, 'intro-2')} />}
      {phase === 'intro-2' && <RoundIntro round={2} title="Scenario decision" onStart={() => setPhase('r2')} />}
      {phase === 'r2' && <R2ScenarioRound qs={bank.round2} onComplete={a => appendRound(a, 'intro-3')} />}
      {phase === 'intro-3' && <RoundIntro round={3} title="Report language" onStart={() => setPhase('r3')} />}
      {phase === 'r3' && <R3ReportLang qs={bank.round3} onComplete={a => {
        const all = [...answers, ...a];
        setAnswers(all);
        finishFight(all);
      }}/>}
      {phase === 'result' && result && (
        <ResultScreen
          passed={result.passed}
          score={result.score}
          card={card}
          earned={earnedRow ?? undefined}
          onReview={() => setPhase('review')}
          onRetry={() => { setPhase('intro-1'); setAnswers([]); setResult(null); setEarnedRow(null); }}
        />
      )}
      {phase === 'review' && (
        <ReviewScreen answers={answers} onClose={() => setPhase('result')} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/boss/BossRunner.tsx
git commit -m "feat(boss): BossRunner state machine (3 rounds + result + review)"
```

### Task 12.5: Boss route

**Files:**
- Modify: `src/routes/Boss.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useParams, Navigate } from 'react-router-dom';
import { cardById } from '../content/cards';
import { bossBank } from '../content/bosses';
import { BossRunner } from '../components/boss/BossRunner';

export default function Boss() {
  const { id = '' } = useParams();
  const card = cardById(id);
  const bank = bossBank(id);
  if (!card || !bank) return <Navigate to="/map" replace />;
  return <BossRunner card={card} bank={bank} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/Boss.tsx
git commit -m "feat(route): Boss (loads card + bank, hands to BossRunner)"
```

---

## Phase 13 — Credential cert page

### Task 13.1: Credential route

**Files:**
- Modify: `src/routes/Credential.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useParams, Link, Navigate } from 'react-router-dom';
import { useProfile } from '../state/ProfileContext';
import { ZONE_LABEL } from '../content/cards';
import type { Zone } from '../types';

function refNo(userId: string, zone: Zone): string {
  // Deterministic 6-char ref from userId+zone (FNV-1a-ish)
  let hash = 2166136261;
  for (const ch of (userId + zone)) hash = ((hash ^ ch.charCodeAt(0)) * 16777619) >>> 0;
  return ('00000' + hash.toString(36).toUpperCase()).slice(-6);
}

export default function Credential() {
  const { zone = '' } = useParams();
  const { profile } = useProfile();
  if (!profile) return null;
  const z = zone as Zone;
  if (!profile.masteryPassedZones.includes(z)) return <Navigate to="/profile" replace />;

  return (
    <div className="min-h-screen bg-newsprint p-10 print:p-0">
      <div className="max-w-2xl mx-auto border-4 border-ink p-10 bg-card">
        <div className="text-center">
          <div className="font-mono text-xs uppercase text-footnote">Justen Newton Media</div>
          <div className="font-display text-4xl mt-2">Certificate of Mastery</div>
          <div className="font-serif italic mt-1">Roofing Lexicon: Field Campaign</div>
        </div>
        <hr className="my-6 border-paper-line" />
        <p className="font-serif text-center">
          This certifies that
        </p>
        <p className="font-display text-3xl text-center my-3">{profile.displayName}</p>
        <p className="font-serif text-center">
          has completed the <strong>{ZONE_LABEL[z]}</strong> mastery track,
          collecting every card in the zone and passing the mastery exam at 90% or above.
        </p>
        <div className="mt-10 flex justify-between font-mono text-xs uppercase">
          <span>JNM-FC-{refNo(profile.userId, z)}</span>
          <span>{new Date().toISOString().slice(0,10)}</span>
        </div>
      </div>
      <div className="text-center mt-6 print:hidden">
        <Link to="/profile" className="font-mono text-sm uppercase mr-3">Back</Link>
        <button onClick={() => window.print()} className="bg-ink text-newsprint px-4 py-2 font-mono uppercase">Print</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add print stylesheet override in index.css**

Append to `src/index.css`:
```css
@media print {
  body { background: white; }
  .print\:hidden { display: none; }
  .print\:p-0 { padding: 0; }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/Credential.tsx src/index.css
git commit -m "feat(route): Credential cert page with deterministic ref + print stylesheet"
```

---

## Phase 14 — Plausible script + index.html

### Task 14.1: Wire Plausible

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add script tag to head**

```html
<script defer
  data-domain="play.justennewton.media"
  src="https://plausible.io/js/script.tagged-events.outbound-links.js">
</script>
<script>window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }</script>
```

- [ ] **Step 2: Update <title> and meta**

```html
<title>Roofing Lexicon: Field Campaign</title>
<meta name="description" content="Gamified credentialing for roofing professionals." />
<meta property="og:title" content="Roofing Lexicon: Field Campaign" />
<meta property="og:description" content="Sharpen your craft. Earn cards. Stack credentials." />
<meta property="og:image" content="/og-cover.png" />
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(html): Plausible script + meta tags"
```

---

## Phase 15 — PWA + deploy

### Task 15.1: PWA manifest

**Files:**
- Create: `public/manifest.webmanifest`
- Modify: `index.html`

- [ ] **Step 1: Write manifest**

```json
{
  "name": "Roofing Lexicon: Field Campaign",
  "short_name": "Field Campaign",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f5f1e8",
  "theme_color": "#0a0a0a",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 2: Link from index.html**

In `<head>`:
```html
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
```

- [ ] **Step 3: Generate placeholder icons**

Generate via nano-banana pipeline (per user's existing setup, see memory note). Save to `public/icons/`. For initial deploy a single solid-color PNG with the JN seal is acceptable; iterate later.

- [ ] **Step 4: Commit**

```bash
git add public/manifest.webmanifest index.html public/icons
git commit -m "feat(pwa): manifest + icons + link tags"
```

### Task 15.2: Build + Zeabur project

**Files:** none (operational)

- [ ] **Step 1: Local production build**

```bash
npm run build
```
Expected: `dist/` produced, no errors. Note: this will fail until at least ONE boss bank is authored (since `bossBank()` returns undefined for IDs not in the registry; the route handles this with a redirect). The build itself should succeed even with empty bank registry.

- [ ] **Step 2: Preview locally**

```bash
npm run preview
```
Smoke-check at http://localhost:4173 — login screen renders.

- [ ] **Step 3: Create Zeabur project + service**

Use the `zeabur:zeabur-project-create` skill (or web UI) to create a new project: `complete-roofing-lexicon-field-campaign`. Then deploy the GitHub repo as a service (Git template, branch `main`).

- [ ] **Step 4: Configure env vars on the service**

Set:
- `VITE_SUPABASE_URL = https://rkasupabase.zeabur.app`
- `VITE_SUPABASE_ANON_KEY = <current anon key>`
- `VITE_PLAUSIBLE_DOMAIN = play.justennewton.media`

- [ ] **Step 5: Wait for deploy + smoke-test**

Verify deploy succeeded via `zeabur-deployment-logs` skill. Open the temporary Zeabur subdomain in a browser; verify login screen renders.

- [ ] **Step 6: Bind custom domain `play.justennewton.media`**

Via `zeabur-domain-url` skill or web UI. Update DNS at registrar.

- [ ] **Step 7: Smoke-test full magic-link flow**

(Requires Supabase Auth SMTP configured — see carry-over from `HANDOFF-2026-05-19.md`.)
- Visit https://play.justennewton.media/login
- Enter email
- Confirm magic-link email arrives
- Click link → land on `/welcome`
- Complete welcome → land on `/map`

---

## Phase 16 — Content authoring (parallel content track)

This phase is **owner / content work**, not engineering. It can run in parallel with Phase 1–15 once Phases 0–3 are complete. The plan tracks the deliverables; the work itself is hand-authoring decisions.

### Task 16.1: Finalize 33 boss term-key assignments

Choose which 30 of the 223 ported terms are the standard bosses (10 per zone) and which 3 mastery exam slots cover the whole zone. Update `src/content/cards.ts` to replace TBD term keys with real ones. Recommended convention: boss `id` = `kebab-case` of term name; `name` = the term itself.

### Task 16.2: Author 33 × R1 question banks

For each boss, write 6–8 multiple-choice questions where the correct answer is the boss's `termKey` and 3 distractors come from same-zone terms. Files: `src/content/bosses/<zone>/NN.ts` exporting `{ bossId, round1: R1Question[], round2, round3 }`. Register each in `src/content/bosses/index.ts`.

### Task 16.3: Author 33 × R2 scenario banks

3–4 short field scenarios per boss with 3–4 answer choices each, exactly one marked `correct: true`.

### Task 16.4: Author 33 × R3 report-language banks

4–5 prompts per boss. Each prompt has poor/better/best phrasings (port the structure from current Lexicon's `REPORT_PAIRS`). The "best" choice is the correct one.

### Task 16.5: Author 3 × mastery banks

Each mastery bank pulls from across the zone (no single termKey). 5 rounds of ~12–15 items each. Structure: alternate R1/R2/R3 patterns across the 5 rounds.

### Task 16.6: Generate 33 base illustrations

Via nano-banana pipeline (see memory note `reference_nano_banana_gemini.md`). Save to `public/illustrations/` matching `illustrationPath` in each card.

---

## Phase 17 — Hard cutover

### Task 17.1: Redirect old Lexicon

**Files:** the OLD repo `complete-roofing-lexicon` (separate working dir)

- [ ] **Step 1: Replace old `index.html` body with a meta refresh**

Edit `index.html` in the OLD repo to contain only:
```html
<!doctype html>
<html><head>
<meta charset="utf-8">
<title>Moved — Roofing Lexicon</title>
<meta http-equiv="refresh" content="0; url=https://play.justennewton.media/">
<link rel="canonical" href="https://play.justennewton.media/">
</head><body>
<p>The Lexicon has moved. <a href="https://play.justennewton.media/">Continue →</a></p>
</body></html>
```

- [ ] **Step 2: Commit + push old repo**

```bash
cd "../complete-roofing-lexicon"   # whatever the path is
git add index.html
git commit -m "chore: redirect to play.justennewton.media (Field Campaign launch)"
git push
```

Zeabur auto-redeploys → old domain now redirects to new.

- [ ] **Step 3: Verify**

```bash
curl -I https://complete-roofing-lexicon.zeabur.app/
```
Expected: HTML body contains the meta refresh; visiting in a browser bounces to `play.justennewton.media`.

(For true 301 status-code redirect rather than meta refresh, configure a Zeabur redirect rule via dashboard — preferred but optional.)

---

## Self-review

**Spec coverage check.** Every section in the spec maps to a task:
- Auth flow (§4) → Phase 4 (Tasks 4.1–4.5) + Phase 7 (Welcome)
- Data model (§5) → Phase 1 (schema) + Phase 5 (data access layer)
- Game loop (§6) → Phase 12 (BossRunner) + lib functions in Phase 2 (composite-tier, streak, boss-scoring, credential)
- Card system (§7) → Phase 3 (cards.ts) + Phase 11 (Card render) + Phase 12 (earn logic in BossRunner)
- UI surfaces (§8) → Phase 6 (shell + routes) + Phases 7–13 (one per route)
- Content migration (§9) → Phase 3.1 (library port) + Phase 16 (boss banks owner-track)
- Analytics (§10) → Phase 14 (Plausible script) + fire() calls in Welcome (signup_completed) and BossRunner (card_earned, credential_issued)
- Launch posture (§11) → Phase 17 (cutover)
- Open items (§13) → Heart count is NOT implemented in this plan — see "Known gap" below.

**Known gap — hearts inside a fight.** Spec §6 says "Hearts ALLOWED inside a single fight" with the count/behavior in §13 open items. This plan implements rounds with NO hearts (player answers all questions in each round regardless of misses); failure is determined by aggregate score against the pass threshold. This is intentionally simpler than a hearts system; if hearts are desired later, the BossRunner state machine in Task 12.4 is the surface area to modify. Document this decision in the spec's §13 when revisiting.

**Placeholder scan.** No "TBD" / "TODO" in implementation steps. The card `termKey` values in `src/content/cards.ts` are explicitly TBD (Task 3.2) — but the SHAPE is locked and Phase 16 closes them with owner work; this is content debt, not plan placeholder debt.

**Type consistency.** `BossBank` uses `bossId` consistently across `src/content/bosses/types.ts`, `BOSS_BANKS` keys, and `bossBank()` lookup. `EarnedCard` shape matches between `src/types.ts`, `earned-cards.ts` `fromRow`, and `Card.tsx` consumption. `ProfileRow.masteryPassedZones` is `Zone[]` everywhere. `compositeTier()` signature matches every caller.

**Scope check.** Single cohesive v1 app, not separable subsystems. Plan stays as one file.

---

## Execution choice

Plan complete and saved to `docs/superpowers/plans/2026-05-20-field-campaign.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best fit when tasks are independent and we want clean context per task.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints. Best fit when context across tasks is valuable and the iteration is tight.

**Which approach?**
