# Distribution Guide — The Complete Roofing Lexicon

The app is a single HTML file (`index.html`). All HTML, CSS, JS, data, and progress storage live inside it. No backend, no install, no build. Open it and it runs.

This guide covers three rollout patterns.

---

## 1. iPhone-to-iPhone single-file sharing

For one-off shares to staff who will train solo on their own device. Progress lives on each phone.

**You share the file once. Each recipient gets their own local progress.**

### AirDrop
1. AirDrop `index.html` from your Mac (or another iPhone) to the staff member's iPhone.
2. They tap the file → "Open in Safari" (or another browser).
3. The app loads. Their progress saves automatically on their device.

### iMessage / Email / Slack / Google Drive / Dropbox
1. Attach `index.html` to the message or upload it to the shared drive.
2. Recipient downloads, then opens with a browser (Safari on iOS, Chrome on Android).
3. Same single-device progress behavior.

**Caveats for the file-share method**
- Each device keeps its own progress in `localStorage`. There is no sync between devices.
- iOS Safari may sandbox `file://` storage on some versions — if a recipient says "nothing saves," host the file instead (next section).
- Updates require resharing the file. Old copies will not refresh.

---

## 2. Hosted QR-code rollout (recommended for teams)

Host the file once at a URL and put the URL behind a QR code. Staff scan, train, and the URL keeps updating in the background.

### Zeabur (the current configured target — see `CLAUDE_CODE_HANDOFF.md` §2)
1. Push to GitHub. Zeabur auto-detects a no-language repo as a static site.
2. Zeabur serves `index.html` at the project URL.
3. Each push redeploys automatically.

### Alternative hosts (all work the same way)
- **Netlify Drop:** drag `index.html` onto netlify.com/drop → get a URL → done.
- **Cloudflare Pages:** connect the repo, framework preset = "None," output = root.
- **GitHub Pages:** Settings → Pages → Source: `main` / `/`.
- **Vercel:** import the repo, framework = "Other," output = root.
- **Company website:** drop `index.html` into the web root.

### QR code
1. Open the hosted URL in any browser.
2. Go to the **About** tab → "Share this reference."
3. Paste the URL into the field (it auto-fills from `location.href` when hosted) and click **Generate QR**.
4. Screenshot or print the QR, or text it to staff. They scan, the app opens.

**Caveats**
- Progress is still per-device (per-browser, per-installation). A staff member training on phone + iPad sees them as two separate progress records.
- For cross-device sync or manager visibility across staff, use the Supabase pattern (next section) or have staff Export their progress JSON to the manager.

---

## 3. Manager-tracked rollout (optional Supabase sync)

The single-file app does **not** ship with Supabase wired in. The hooks are designed-in; the wiring is a future wave. Below is the pattern when you're ready.

### Local-only manager (works today)
1. Host the app (Section 2).
2. Staff use the app on their devices. Each device's progress saves locally.
3. In **Profile**, each staff member clicks **Export Progress JSON** and emails the file to the manager.
4. Manager opens **Manager** (passcode `ROOF123`), reviews each file by importing it via **Import Progress JSON**, exports the **Summary CSV** for the record.
5. Manager can change the default passcode in **Manager → Settings**.

This is the workflow today. It's manual but auditable.

### Supabase-sync pattern (future wave)

When you're ready to wire it:

1. Create a Supabase project at supabase.com.
2. In the SQL editor, run a schema along these lines (adapt to your needs):

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

3. Add Row Level Security policies appropriate to your environment (read for authenticated staff, write own-rows-only is a starting point).
4. In a future build of `index.html`, add a Manager → Sync Settings panel that takes the Supabase URL and anon key, stores them in `state.prefs.supabase`, and posts cert and progress events to the `roofing_training_progress` table on save.

Do not commit Supabase URLs or keys into the file. They belong in `state.prefs`, entered locally by the manager on each device.

---

## Updating the app

- **File share method:** re-share the new `index.html`. Tell staff to delete the old copy.
- **Hosted method:** push to the host. Staff browsers pick up the new version on their next page load.
- **Progress survives upgrades** as long as the storage key (`crl_v2_state`) is not changed. The v3 build keeps the v2 key on purpose for this reason.

---

## QA checklist before each release

Run the checks in `QA_REPORT.md`.
