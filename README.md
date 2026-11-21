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
3. Open **Project Settings → API** (or **Connect**) and copy the **Project URL** and the **anon / publishable key**.

## 2. Set your admin login (automatic)

Your admin email and password live in env variables. Every `npm run build` (locally, on Vercel and in Docker)
first runs [`scripts/seed-admin.mjs`](scripts/seed-admin.mjs), which:

- creates the user if it doesn't exist (already confirmed, no email link needed)
- otherwise sets its password to the current `ADMIN_PASSWORD`, so the env file is the source of truth
- adds the user to the `admins` table

Add these three to `.env.local` (and to Vercel, see step 4):

```
SUPABASE_SERVICE_ROLE_KEY=...      # Project Settings → API Keys → service_role (or "secret") key
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=a-strong-password   # at least 8 characters
```

To run it without a full build:

```bash
npm run seed:admin
```

> **The service role key is a full-access secret.** Never prefix it with `NEXT_PUBLIC_`, never commit it,
> never paste it anywhere public. Only the seed script uses it; the website itself never does.

If you leave all three empty, the step is skipped and you can create the admin by hand instead: create a user
in **Authentication → Users** (tick **Auto Confirm User**), then run this in the **SQL Editor**:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'you@example.com';
```

Recommended: turn off public sign-ups in **Authentication → Sign In / Providers → Allow new users to sign up**.
Even with sign-ups on, a new account can't edit anything unless it's in `admins`.

## 3. Run locally

You need [Node.js](https://nodejs.org) 20.9 or newer.

```bash
npm install
```

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

```bash
npm run dev
```

Open <http://localhost:3000/admin>, sign in, and fill in your profile, socials, projects and so on.
The homepage is at <http://localhost:3000>.

> The anon key is meant to be public. Security comes from the RLS policies in `schema.sql`, not from hiding
> the key. Never put the `service_role` key in this project.

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

```bash
npx supabase status
```

Put the `API_URL`, `ANON_KEY` and `SERVICE_ROLE_KEY` values into `.env.local`. Keep your cloud values in
another file, for example `.env.supabase.local`, so you can switch back. The local dashboard (Studio) is at
<http://127.0.0.1:54323>. Stop everything with `npx supabase stop`.

## 4. Deploy for free on Vercel

1. Push this folder to a GitHub repository:

   ```bash
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

2. Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub and **Import** the repository.
   The framework preset (Next.js) is detected automatically.
3. Under **Environment Variables** add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `NEXT_PUBLIC_SITE_URL` (your Vercel URL, e.g. `https://your-name.vercel.app`, or your custom domain).
   Also add `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` so each deploy keeps your admin
   login in sync. Vercel keeps them server-side because they have no `NEXT_PUBLIC_` prefix.
4. Click **Deploy**. Later pushes to `main` redeploy automatically.
5. In Supabase, go to **Authentication → URL Configuration** and set **Site URL** to your Vercel URL.

Edits made in `/admin` on the live site show up immediately. You don't need to redeploy for content changes.

## 5. Run with Docker (optional)

Use this to self-host on any server or VPS, or to run the production build locally without installing Node.
You need [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine with Compose).

1. Create `.env.local` as in step 3. Docker reads your Supabase values from it.
2. Build and start the container:

   ```bash
   docker compose --env-file .env.local up -d --build
   ```

3. Open <http://localhost:3000>.

Everyday commands:

| Command | What it does |
| --- | --- |
| `docker compose --env-file .env.local up -d --build` | Rebuild and restart after code or `.env.local` changes |
| `docker compose logs -f` | Follow the server logs |
| `docker compose ps` | Show status and health |
| `docker compose down` | Stop and remove the container |
| `PORT=8080 docker compose --env-file .env.local up -d` | Serve on another host port |

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
- `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` are passed as **build secrets**. The admin
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
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Create/update the admin user from env, then production build |
| `npm run seed:admin` | Only create/update the admin user |
| `npm start` | Serve the production build |
| `npm run typecheck` | TypeScript check |
