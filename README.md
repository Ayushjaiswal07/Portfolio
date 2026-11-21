# Portfolio + Admin CMS

A full-stack personal portfolio with a private admin dashboard. Everything runs on free tiers.

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS 4
- **Supabase**: Postgres for content, Storage for your photo, resume and images, Auth for admin login
- **Vercel** for hosting

Public pages are pre-rendered static HTML (fast, SEO-friendly). When you save something in `/admin`, the
site is regenerated with `revalidatePath`, so changes appear right away.

## Features

| Public site | Admin (`/admin`) |
| --- | --- |
| Hero with photo, bio, availability badge, resume view/download, socials | Email/password login (Supabase Auth), protected by `proxy.ts` and an `admins` allow-list |
| Featured + other projects, with a detail page for long Markdown write-ups | Edit profile, upload/replace photo and resume PDF |
| Experience timeline, education | Create, edit, reorder and delete socials, projects, experience and education |
| `/blog` and `/blog/[slug]` with Markdown + syntax highlighting | Blog editor with Markdown live preview (write / preview / split), drafts and publishing |
| Dark/light mode, Open Graph tags, JSON-LD, `sitemap.xml`, `robots.txt` | Validation (shared client/server Zod schemas) and toast notifications |

## Project structure

```
app/
  (site)/              public pages: /, /blog, /blog/[slug], /projects/[id]
  admin/
    login/             /admin/login
    (dashboard)/       /admin, /admin/profile, /admin/[entity]  (socials, projects, experience, education, blogs)
    actions.ts         server actions: save, delete, reorder, profile (+ revalidatePath)
components/
  sections/            homepage sections
  admin/               CMS UI: CRUD manager, form fields, uploads, Markdown editor
lib/
  admin/entities.ts    one definition per table: drives admin forms, lists and validation
  supabase/            browser, server, public (cookie-less) and proxy clients
  data.ts              public data loaders
proxy.ts               redirects signed-out users away from /admin (Next 16's name for middleware.ts)
supabase/schema.sql    tables, RLS policies, storage buckets
```

## 1. Create the free Supabase project

1. Sign up at [supabase.com](https://supabase.com) and click **New project**. Pick any name and region and
   save the database password somewhere safe.
2. When it's ready, open **SQL Editor → New query**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql)
   and click **Run**. This creates:
   - tables `profile`, `socials`, `projects`, `experience`, `education`, `blogs`, `admins`
   - Row Level Security: anyone can read content (blogs only when published); only admins can write
   - public storage buckets `avatars`, `resumes` and `media`, which only admins can upload to

   The script is safe to run again later.
3. Open **Project Settings → API Keys** and copy the **Project URL** and the **Publishable key**
   (`sb_publishable_...`). If you only see a **Create new API keys** button, click it first. The legacy `anon`
   key also works, but Supabase is retiring the legacy `anon` and `service_role` keys, so use the new ones.

## 2. Create your admin login

Pick one option.

### Option A: by hand in Supabase (recommended, no secrets on your PC)

1. In **Authentication → Users**, click **Add user → Create new user**, enter your email and password, tick
   **Auto Confirm User** and click **Create user**.
2. In **SQL Editor → New query**, run (with your email):

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

   The editor shows "Success. No rows returned" whether or not a row was added. To check, run:

   ```sql
   select u.email, a.user_id is not null as is_admin
   from auth.users u
   left join public.admins a on a.user_id = u.id;
   ```

   Your email should show `is_admin = true`.

To change the password later, open your user in **Authentication → Users** and send a password recovery email
(set the **Site URL** first, see step 4).

### Option B: automatic from env variables

Every `npm run build` (locally, on Vercel and in Docker) first runs
[`scripts/seed-admin.mjs`](scripts/seed-admin.mjs). If these three are set, it creates the user (already
confirmed), resets its password to `ADMIN_PASSWORD` when that changes, and adds it to `admins`:

```
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...   # Project Settings → API Keys → Secret key (or legacy service_role)
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=a-strong-password          # at least 8 characters
```

Set all three or none: if only some are set, the build stops with a "Missing ..." error. With none set, the
step is skipped. To run it without a full build: `npm run seed:admin`.

> **The secret / service role key has full access to your project.** Never prefix it with `NEXT_PUBLIC_`,
> never commit it, never paste it anywhere public. Only the seed script uses it; the website itself never does.

### Either way

Turn off public sign-ups in **Authentication → Sign In / Providers → Allow new users to sign up**.
Even with sign-ups on, a new account can't edit anything unless it's in `admins`.

## 3. Run locally

You need [Node.js](https://nodejs.org) 20.12 or newer (the admin seed script uses `process.loadEnvFile`).

> **Windows:** the commands below work in Git Bash and PowerShell unless a block is marked otherwise.
> PowerShell lines are shown separately where the syntax differs.

```bash
npm install
```

```bash
cp .env.example .env.local
```

Skip this if `.env.local` already exists.

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

That's all you need with option A. With option B, also add the three admin variables.

```bash
npm run dev
```

Open <http://localhost:3000/admin>, sign in, and fill in your profile, socials, projects and so on.
The homepage is at <http://localhost:3000>.

> The publishable (anon) key is meant to be public. Security comes from the RLS policies in `schema.sql`, not
> from hiding the key. The secret / `service_role` key is only ever read by the optional seed script.

### Optional: a local Supabase in Docker

To develop offline, or test without touching your real data, run Supabase on your PC
(the first start downloads about 1 GB):

```bash
npx supabase start -x realtime,edge-runtime,logflare,vector,imgproxy,supavisor --ignore-health-check
```

Then apply the schema and print the local URL and keys:

```bash
docker exec -i supabase_db_ayush-portfolio psql -U postgres -d postgres < supabase/schema.sql
```

PowerShell has no `<` redirection, so there use:

```powershell
Get-Content supabase/schema.sql -Raw | docker exec -i supabase_db_ayush-portfolio psql -U postgres -d postgres
```

```bash
npx supabase status
```

Put the `API_URL`, `ANON_KEY` and `SERVICE_ROLE_KEY` values into `.env.local`. Keep your cloud values in
another file, for example `.env.supabase.local`, so you can switch back. The local dashboard (Studio) is at
<http://127.0.0.1:54323>. Stop everything with `npx supabase stop`.

## 4. Deploy for free on Vercel

1. Push this folder to a GitHub repository:

   ```bash
   git init                # skip if the folder is already a git repository
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

   If git says **"detected dubious ownership in repository"** (the folder was created by another Windows
   user), mark it as safe once and run the commands again:

   ```bash
   git config --global --add safe.directory "D:/Ayush Portfolio"
   ```

   If `git remote add` says the remote already exists, use `git remote set-url origin <url>` instead.

2. Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub and **Import** the repository.
   The framework preset (Next.js) is detected automatically.
3. Under **Environment Variables** add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `NEXT_PUBLIC_SITE_URL` (your Vercel URL, e.g. `https://your-name.vercel.app`, or your custom domain).
   Only if you use option B for the admin login, also add `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL` and
   `ADMIN_PASSWORD`. Vercel keeps them server-side because they have no `NEXT_PUBLIC_` prefix.
4. Click **Deploy**. Later pushes to `main` redeploy automatically. If you change `NEXT_PUBLIC_SITE_URL`
   afterwards (for example once you know your Vercel URL), redeploy: `NEXT_PUBLIC_*` values are built in.
5. In Supabase, go to **Authentication → URL Configuration** and set **Site URL** to your Vercel URL.

Edits made in `/admin` on the live site show up immediately. You don't need to redeploy for content changes.

## 5. Run with Docker (optional)

Use this to self-host on any server or VPS, or to run the production build locally without installing Node.
You need [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine with Compose).

1. Create `.env.local` as in step 3. Docker reads your Supabase values from it.
2. Stop `npm run dev` if it's running (both use port 3000).
3. **Only for admin login option B:** load `.env.local` into your shell, so the build can create your admin
   user from the `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` build secrets.
   With option A, skip this step. If `docker compose` then complains that a secret's environment variable is
   not set, use the plain `docker build` / `docker run` commands further down instead: they don't need the
   admin secrets.

   Git Bash / macOS / Linux:

   ```bash
   set -a; source .env.local; set +a
   ```

   PowerShell:

   ```powershell
   Get-Content .env.local | ForEach-Object {
     if ($_ -match '^\s*([^#=\s][^=]*)=(.*)$') {
       [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
     }
   }
   ```

   This only lasts for the current terminal window. If you skip it, the site still builds but the admin
   seed step is skipped.

4. Build and start the container:

   ```bash
   docker compose --env-file .env.local up -d --build
   ```

5. Open <http://localhost:3000>.

Everyday commands:

| Command | What it does |
| --- | --- |
| `docker compose --env-file .env.local up -d --build` | Rebuild and restart after code or `.env.local` changes |
| `docker compose logs -f` | Follow the server logs |
| `docker compose ps` | Show status and health |
| `docker compose down` | Stop and remove the container |
| `PORT=8080 docker compose --env-file .env.local up -d` | Serve on another host port (Git Bash) |
| `$env:PORT=8080; docker compose --env-file .env.local up -d` | Serve on another host port (PowerShell) |

Without Compose:

```bash
docker build -t portfolio --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key --build-arg NEXT_PUBLIC_SITE_URL=http://localhost:3000 .
```

```bash
docker run -d --name portfolio -p 3000:3000 --restart unless-stopped portfolio
```

How it works:
- `NEXT_PUBLIC_*` values are **baked in when the image is built**, not read when the container starts. If you
  change them, rebuild the image.
- With option B, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` are passed as **build secrets**. The admin
  seed runs during the build, and these values are never stored in the image. With plain `docker build`,
  pass them with
  `--secret id=SUPABASE_SERVICE_ROLE_KEY,env=SUPABASE_SERVICE_ROLE_KEY --secret id=ADMIN_EMAIL,env=ADMIN_EMAIL --secret id=ADMIN_PASSWORD,env=ADMIN_PASSWORD`
  after setting those variables in your shell.
- The build pre-renders the public pages, so it needs internet access to reach Supabase.
- The image uses Next.js's `standalone` output and runs as a non-root user. It's about 310 MB.
- Admin edits update pages inside the running container. A rebuild starts again from freshly built pages,
  which also read the latest content, so nothing is lost.
- Vercel doesn't use the Docker files, so step 4 is unchanged.

## Notes

- **Free-tier limits.** Supabase free projects pause after about a week with no activity. Opening the
  dashboard (or any visit to the admin) wakes them. The public pages are cached by Vercel, so the site stays
  up, but run a quick visit now and then if you don't edit content often.
- **Uploads** go straight from the browser to Supabase Storage (5 MB images, 10 MB PDFs), so Vercel's request
  size limit doesn't apply. Replacing your photo or resume deletes the old file; images removed from projects
  or posts are left in the `media` bucket, which you can clean up in Supabase Storage.
- **Resume download** uses Supabase's `?download=` parameter, so the button saves the file as
  `Your-Name-Resume.pdf`. The View button opens it in the browser.
- **Adding a field**: add the column in Supabase, add it to the type in `lib/types.ts`, and add a field to
  the table's entry in `lib/admin/entities.ts`. The admin form and validation pick it up automatically.
- **Social icons** come from `react-icons` (Lucide no longer ships brand logos). Add more in
  `lib/social-icons.ts` and `components/social-icon.tsx`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server on port 3000 (Ctrl+C to stop) |
| `npm run build` | Create/update the admin user from env, then production build |
| `npm run seed:admin` | Only create/update the admin user |
| `npm start` | Serve the production build |
| `npm run typecheck` | TypeScript check |
