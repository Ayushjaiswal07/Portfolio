"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ENTITIES, PROFILE_FIELDS, isContentTable, validateEntity, validateFields } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import { isValidUrl, slugify } from "@/lib/utils";

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You are signed out. Please sign in again.");
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) throw new Error("This account is not an admin.");
  return supabase;
}

/** Refresh every public page so changes appear immediately. */
function revalidatePublic() {
  revalidatePath("/", "layout");
}

function fail(e: unknown): ActionResult<never> {
  const message = e instanceof Error ? e.message : "Something went wrong";
  return { ok: false, error: message };
}

export async function saveEntity(
  table: string,
  id: string | null,
  values: Record<string, unknown>,
): Promise<ActionResult<Record<string, unknown>>> {
  try {
    if (!isContentTable(table)) return { ok: false, error: "Unknown table" };
    const supabase = await requireAdmin();

    const parsed = validateEntity(table, values);
    if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields", fieldErrors: parsed.errors };
    const data = { ...parsed.data };

    if (table === "blogs") {
      if (!data.slug) data.slug = slugify(String(data.title)) || `post-${Date.now()}`;
      if (data.published && !data.published_at) data.published_at = new Date().toISOString().slice(0, 10);
    }

    if (!id && ENTITIES[table].orderable) {
      const { data: last } = await supabase
        .from(table)
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      data.sort_order = ((last?.sort_order as number | undefined) ?? -1) + 1;
    }

    const query = id
      ? supabase.from(table).update(data).eq("id", id).select().single()
      : supabase.from(table).insert(data).select().single();
    const { data: row, error } = await query;

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "That slug is already used", fieldErrors: { slug: "Already used by another post" } };
      }
      return { ok: false, error: error.message };
    }

    revalidatePublic();
    return { ok: true, data: row };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteEntity(table: string, id: string): Promise<ActionResult> {
  try {
    if (!isContentTable(table)) return { ok: false, error: "Unknown table" };
    const supabase = await requireAdmin();
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePublic();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function reorderEntity(table: string, ids: string[]): Promise<ActionResult> {
  try {
    if (!isContentTable(table) || !ENTITIES[table].orderable) return { ok: false, error: "Not reorderable" };
    const supabase = await requireAdmin();
    const results = await Promise.all(
      ids.map((id, index) => supabase.from(table).update({ sort_order: index }).eq("id", id)),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) return { ok: false, error: failed.error.message };
    revalidatePublic();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function saveProfile(values: Record<string, unknown>): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin();
    const parsed = validateFields(PROFILE_FIELDS, values);
    if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields", fieldErrors: parsed.errors };

    const email = parsed.data.email as string | null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: "Please fix the highlighted fields", fieldErrors: { email: "Enter a valid email" } };
    }

    const { error } = await supabase.from("profile").update(parsed.data).eq("id", 1);
    if (error) return { ok: false, error: error.message };
    revalidatePublic();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Save the URL of an uploaded avatar/resume (or null to remove it). */
export async function saveProfileFile(field: "avatar_url" | "resume_url", url: string | null): Promise<ActionResult> {
  try {
    if (field !== "avatar_url" && field !== "resume_url") return { ok: false, error: "Invalid field" };
    if (url !== null && !isValidUrl(url)) return { ok: false, error: "Invalid file URL" };
    const supabase = await requireAdmin();
    const { error } = await supabase.from("profile").update({ [field]: url }).eq("id", 1);
    if (error) return { ok: false, error: error.message };
    revalidatePublic();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
