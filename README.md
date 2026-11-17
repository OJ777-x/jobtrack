# JobTrack

A job tracking system for small UK businesses, built so it can be switched
between industries ("templates") without changing code. Built in phases as a
sales demo — see the main chat history for the full project brief.

This README is written for someone with no coding background. Follow it top
to bottom the first time.

## What's in this project right now (through Phase 6)

- Sign-in for three types of user: Manager, Worker and Customer, each with
  their own screens.
- A full database design (`supabase/schema.sql`) covering organisations,
  industry templates, customers, enquiries/quotes, jobs, tasks, notes,
  photos, parts awaited, customer updates and an AI action log — all with
  row-level security so each organisation only ever sees its own data.
- Two industry templates: **Engineering** (default demo company "Northfield
  Engineering Services Ltd") and **Plumbing & Heating** ("Clearflow Plumbing
  & Heating Ltd"). Only Engineering is active by default — a switcher
  between them is a Phase 7 feature.
- The full office workflow: customers → enquiries → quotes → approval →
  converting a quote into a job, with custom fields, a drag-and-drop job
  board, a filterable list view, a scheduling calendar, parts-awaited
  tracking, and a dashboard with real metrics (due this week, late, stuck,
  value of open work, on-time completion rate).
- A mobile-first worker view (one-tap stage advance, tasks, notes, photos,
  "flag a problem"), installable as a PWA on a phone or tablet.
- A read-only customer portal: their own jobs, a visual progress stepper,
  and any notes/updates marked visible to them.
- Four AI features under the **AI** tab (Manager): customer progress update
  drafts (human-approved before publishing), risk flags for jobs likely to
  run late, paste-in email/notes analysis (nothing saves without
  confirmation), and plain-English Q&A over your own job data. All four work
  with **no Anthropic API key** — see "AI features" below.
- A "Reset demo data" script that wipes and recreates the demo login
  accounts, organisation, and customers for whichever template you choose.

Still to come: the plumbing template switcher (Phase 7), and final polish —
demo script pages, Vercel deployment (Phase 8).

## One-time setup

### 1. Create a free Supabase account and project

Supabase is the hosted database + login system this app uses.

1. Go to [supabase.com](https://supabase.com) and sign up (free).
2. Click **New project**. Pick any name (e.g. "jobtrack-demo"), set a database
   password (save it somewhere, you likely won't need it again), pick any
   region, and click **Create new project**. Wait ~2 minutes for it to spin up.
3. In the left sidebar, go to **Project Settings -> API**. You'll need three
   values from this page in the next step:
   - **Project URL**
   - **anon public** key (under "Project API keys")
   - **service_role** key (also under "Project API keys" — click "Reveal" to see it)

### 2. Set up your environment variables

1. In the `jobtrack` folder, copy `.env.local.example` to a new file called
   `.env.local`.
2. Open `.env.local` and paste in the three Supabase values from step 1, and
   leave `ANTHROPIC_API_KEY` blank for now (demo mode doesn't need it).

`.env.local` is already excluded from git (see `.gitignore`), so these secret
values never get committed or uploaded anywhere.

### 3. Create the database tables

1. In your Supabase project, open **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open `supabase/schema.sql` in this project, copy its entire contents, and
   paste them into the SQL Editor.
4. Click **Run**. You should see "Success. No rows returned."

This creates every table the app needs, plus the security rules that keep
each organisation's data private.

### 3b. Set up photo/document storage (so photo upload works)

Run `supabase/phase2_storage.sql` the same way — SQL Editor → New query →
paste its contents → Run. This creates a private storage bucket for job
photos/documents and the rules controlling who can see what. Until this is
run, photo upload on a job will silently do nothing (everything else works
fine without it).

### 3c. Set up the organisation-settings fix and logo storage

Run these two files the same way, one after the other:

1. `supabase/phase8_org_update_policy.sql` — fixes a bug where the
   Settings page (company name/colours) looked like it saved but silently
   didn't (a missing permission). Without this, Settings won't actually save.
2. `supabase/phase8_org_logos.sql` — a public storage bucket for the
   company logo uploaded on the Settings page. Without this, logo upload
   silently does nothing (name/colours will still save fine once 3c.1 is run).

### 4. Load the demo data

In a terminal, inside the `jobtrack` folder, run:

```bash
npm run seed
```

This creates the demo organisation (Northfield Engineering, by default),
three login accounts (Manager, Worker, Customer), and a few demo customers.
It prints the login emails and password when it finishes.

You can re-run this any time to reset the demo back to a clean state.

## Running the app

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.
You'll land on the sign-in page — click "Log in as Manager", "Log in as
Worker" or "Log in as Customer" to see each view.

## Demo admin: switching templates & the demo script

Click **"Demo admin"** at the bottom of the sign-in page (or go to `/admin`).
The password defaults to `jobtrack-admin` — change it by setting
`ADMIN_PASSWORD` in `.env.local` before showing this to anyone outside your
own team.

From there you can:

- **Switch the whole demo** between Engineering and Plumbing & Heating —
  this wipes and recreates the demo organisation, logins and customers for
  whichever template you pick. Anyone currently signed in gets logged out;
  the one-click login buttons work immediately with the new template.
- **Reset the current template's demo data** back to a clean state (the
  same as `npm run seed`, without needing a terminal).
- **View the demo script** for whichever template is currently active — the
  steps to click through, in order, to show a prospect the wow moments in
  under 10 minutes. It's only reachable from the admin area, so it never
  shows up as a tab inside the demo itself.

## Deploying to Vercel (so you have a live link to share)

Vercel is free for this scale and is built by the same team as Next.js, so
deployment is simple. You'll need a **GitHub account** (to store the code)
and a **Vercel account** (sign up with GitHub — one click) — both free.

1. Create a new, empty repository on [github.com/new](https://github.com/new)
   (don't tick any of the "initialize with" checkboxes).
2. In a terminal, inside the `jobtrack` folder:
   ```bash
   git remote add origin <the URL GitHub gives you>
   git push -u origin main
   ```
3. Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub, and
   import that repository.
4. Before clicking Deploy, add your environment variables (Vercel calls this
   "Environment Variables" on the import screen) — copy every value from
   your local `.env.local` across: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `ANTHROPIC_API_KEY` (if you have one), `DEMO_PASSWORD`, `ADMIN_PASSWORD`.
5. Click **Deploy**. After a minute or two you'll get a live `.vercel.app`
   link you can share with prospects.

Any time you want to update the live version, just `git push` again — Vercel
redeploys automatically.

## AI features

The four AI features (under the **AI** tab when signed in as Manager) work
two ways:

- **Demo mode (default, no API key)** — drafts, answers and proposals are
  assembled directly from your real data using plain code (not a canned
  generic placeholder), so the demo is fully functional without any cost or
  setup. A banner on each AI page tells you when you're in demo mode.
- **With an Anthropic API key** — set `ANTHROPIC_API_KEY` in `.env.local`
  (get one at [console.anthropic.com](https://console.anthropic.com)) and
  restart `npm run dev`. The same features then call Claude (the cheap,
  fast `claude-haiku-4-5` model) to turn the same facts into more natural
  prose — it's always given the real data explicitly and told never to
  invent dates, prices, or promises beyond what's listed.

Every AI action — drafting, publishing, a paste-in analysis, a question
asked — is written to the `ai_action_log` table and visible at the bottom of
the AI hub page (`/manager/ai`), along with whether a human had to confirm
it. Nothing an AI feature does to your data (publishing an update, adding a
note, changing a stage) happens without an explicit confirm click.

## How the industry template system works

Everything specific to a trade — what a "job" is called, what stages a repair
goes through, what custom fields it has, what the AI's tone sounds like — is
stored as one JSON object per template, in the `industry_templates` database
table. The app's code never contains a hard-coded word like "engineer" or
"boiler" — it always reads the currently active template's config and renders
whatever that says.

The template source files (used to seed the database) live in
`src/lib/templates/`:

- `types.ts` — the shape every template must follow
- `engineering.ts` — the Engineering template
- `plumbing.ts` — the Plumbing & Heating template
- `index.ts` — the registry both templates are listed in

### Adding a new industry template (e.g. electricians, estate agents)

1. Duplicate `src/lib/templates/engineering.ts` as a new file, e.g.
   `electrical.ts`.
2. Change every piece of wording in `labels` to match the new trade (e.g.
   `worker: "Electrician"`).
3. Replace `jobTypes` with the job types for that trade, each with its own
   `stages`, `customFields`, and `defaultTasks` (the checklist that gets
   created automatically when a job reaches each stage).
4. Write an `aiTone` description in plain English — this gets fed into every
   AI prompt so customer updates sound right for that trade.
5. Fill in `demoData` with a fictional demo company name, a manager + worker,
   and a few example customers.
6. Add your new template to the list in `src/lib/templates/index.ts`.
7. Run `npm run seed -- <your-template-key>` to load it into the database as
   the active demo (e.g. `npm run seed -- electrical`).

No other code changes are needed — every screen reads from the template.

## Project structure (for reference)

```
src/
  app/
    admin/          Demo-control screens: switch template, reset data, demo script
    login/          Sign-in page + one-click demo logins
    manager/        Customers, enquiries, jobs, board, calendar, AI, settings
    worker/          Mobile-first "my jobs" view
    portal/          Read-only customer portal
  components/        Shared UI pieces (header, job board, AI chat widgets)
  lib/
    supabase/        Database connection helpers
    templates/        The industry template definitions
    ai/               AI feature logic (Claude client, demo-mode fallbacks, action logging)
    admin-auth.ts     The separate password gate for /admin
    org-context.ts    Loads "who is signed in, which org, which template" for every page
    job-helpers.ts    Template-aware lookups (stage labels, job type labels, etc.)
    seed-demo.ts      The logic behind `npm run seed` and the /admin template switcher
supabase/
  schema.sql                   The whole database design — run once per Supabase project
  phase2_storage.sql           Job photo/document storage bucket + access rules
  phase8_org_update_policy.sql Fixes a missing permission so Settings can save
  phase8_org_logos.sql         Storage bucket for the company logo in Settings
scripts/
  seed.ts             Command-line entry point for seeding demo data
  generate-icons.mjs  Regenerates the placeholder PWA icons (swap for a real logo later)
```

## Troubleshooting

- **"Demo login failed... Have you run the seed script yet?"** — run
  `npm run seed` (after completing steps 1-3 above).
- **Blank page / error about environment variables** — check `.env.local`
  exists and has real values (not left blank), then restart `npm run dev`.
- **Changed `schema.sql` and want a totally clean database** — just re-run
  the whole file in the SQL Editor again; it drops and recreates every table
  (you'll need to re-run the other `supabase/*.sql` files too, and `npm run seed`).
- **Settings page says it saved but nothing changed** — run
  `supabase/phase8_org_update_policy.sql` (see step 3c above).
