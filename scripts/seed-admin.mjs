#!/usr/bin/env node
/**
 * Creates (or updates) the CMS admin user from environment variables.
 * Runs automatically before every `npm run build` (the "prebuild" script),
 * so it works locally, on Vercel and inside the Docker build.
 *
 * Needs:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (server-only secret, never NEXT_PUBLIC_)
 *   ADMIN_EMAIL
 *   ADMIN_PASSWORD              (min 8 characters)
 *
 * If ADMIN_EMAIL / ADMIN_PASSWORD / SUPABASE_SERVICE_ROLE_KEY are not set,
 * the script skips quietly so builds without them still work.
 * The env file is the source of truth: changing ADMIN_PASSWORD and
 * rebuilding changes the password. If it hasn't changed, nothing is touched
 * and you stay signed in.
 */
import { createClient } from "@supabase/supabase-js";

// Load .env.local / .env for local runs (Vercel and Docker pass real env vars,
// which are never overridden).
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file not present
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

const log = (msg) => console.log(`[seed-admin] ${msg}`);
const fail = (msg) => {
  console.error(`\n[seed-admin] ERROR: ${msg}\n`);
  process.exit(1);
};

if (!email && !password && !serviceKey) {
  log("ADMIN_EMAIL / ADMIN_PASSWORD / SUPABASE_SERVICE_ROLE_KEY not set, skipping.");
  process.exit(0);
}

const missing = [
  !url && "NEXT_PUBLIC_SUPABASE_URL",
  !serviceKey && "SUPABASE_SERVICE_ROLE_KEY",
  !email && "ADMIN_EMAIL",
  !password && "ADMIN_PASSWORD",
].filter(Boolean);
if (missing.length) fail(`Missing ${missing.join(", ")}. Set all of them, or none to skip this step.`);

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("ADMIN_EMAIL is not a valid email address.");
if (password.length < 8) fail("ADMIN_PASSWORD must be at least 8 characters.");
if (serviceKey === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
  fail("SUPABASE_SERVICE_ROLE_KEY is the anon key. Use the service_role / secret key instead.");
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUserByEmail(target) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === target);
    if (user) return user;
    if (data.users.length < 200) return null;
  }
}

try {
  let user = await findUserByEmail(email);

  if (user) {
    // Setting a password signs the user out everywhere, so only do it when the
    // env password doesn't already work (i.e. ADMIN_PASSWORD was changed).
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    let passwordWorks = false;
    if (anonKey && user.email_confirmed_at) {
      const probe = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data } = await probe.auth.signInWithPassword({ email, password });
      if (data.session) {
        passwordWorks = true;
        await probe.auth.signOut({ scope: "local" });
      }
    }
    if (passwordWorks) {
      log(`Admin user ${email} exists; password unchanged.`);
    } else {
      const { error } = await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
      if (error) throw error;
      log(`Admin user ${email} exists; password updated from env (existing sessions signed out).`);
    }
  } else {
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    user = data.user;
    log(`Created admin user ${email}.`);
  }

  const { error: adminError } = await supabase
    .from("admins")
    .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });

  if (adminError) {
    if (adminError.code === "42P01" || adminError.code === "PGRST205") {
      fail("Table public.admins not found. Run supabase/schema.sql in the Supabase SQL Editor first.");
    }
    throw adminError;
  }

  log(`${email} can sign in at /admin/login.`);
} catch (e) {
  const message = e?.message ?? String(e);
  if (/invalid api key|jwt|unauthorized|invalid.*key/i.test(message)) {
    fail(`Supabase rejected SUPABASE_SERVICE_ROLE_KEY (${message}). Copy the service_role / secret key again.`);
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED/i.test(message)) {
    fail(`Could not reach ${url} (${message}). Check NEXT_PUBLIC_SUPABASE_URL and that the project isn't paused.`);
  }
  fail(message);
}
