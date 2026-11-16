# JobTrack

A job tracking system for small UK businesses, built so it can be switched
between industries ("templates") without changing code. Built in phases as a
sales demo — see the main chat history for the full project brief.

This README is written for someone with no coding background. Follow it top
to bottom the first time.

## What's in this project right now (end of Phase 1)

- A working Next.js app with sign-in for three types of user: Manager, Worker
  and Customer.
- A database design (in `supabase/schema.sql`) covering organisations,
  industry templates, customers, jobs, tasks, notes, photos and more —
  built now so later phases don't need to redesign the database.
- Two industry templates already written: **Engineering** (default demo
  company "Northfield Engineering Services Ltd") and **Plumbing & Heating**
  ("Clearflow Plumbing & Heating Ltd"). Only Engineering is switched on by
  default — switching between them is a Phase 7 feature.
- A "Reset demo data" script that wipes and recreates the demo login
  accounts, organisation, and customers for whichever template you choose.

Nothing about jobs, quotes, the job board, scheduling, the customer portal's
real content, or the AI features exists yet — those are later phases.

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
  app/            Pages — login, manager dashboard, worker dashboard, customer portal
  components/      Shared UI pieces (e.g. the top header bar)
  lib/
    supabase/      Database connection helpers
    templates/      The industry template definitions
    org-context.ts  Loads "who is signed in, which org, which template" for every page
    seed-demo.ts    The logic behind `npm run seed` and the future admin reset button
supabase/
  schema.sql        The whole database design — run this once per Supabase project
scripts/
  seed.ts           Command-line entry point for seeding demo data
```

## Troubleshooting

- **"Demo login failed... Have you run the seed script yet?"** — run
  `npm run seed` (after completing steps 1-3 above).
- **Blank page / error about environment variables** — check `.env.local`
  exists and has real values (not left blank), then restart `npm run dev`.
- **Changed `schema.sql` and want a totally clean database** — just re-run
  the whole file in the SQL Editor again; it drops and recreates every table.
