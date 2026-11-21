import { cache } from "react";
import { createPublicClient } from "./supabase/public";
import type { Blog, Education, Experience, Profile, Project, Social } from "./types";

const FALLBACK_PROFILE: Profile = {
  id: 1,
  full_name: "Your Name",
  headline: "Full-Stack Developer",
  bio: "Connect Supabase and sign in at /admin to edit this portfolio.",
  location: null,
  availability: null,
  email: null,
  avatar_url: null,
  resume_url: null,
  updated_at: new Date(0).toISOString(),
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function listOrdered<T>(table: string): Promise<T[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error(`Failed to load ${table}:`, error.message);
    return [];
  }
  return (data ?? []) as T[];
}

export const getProfile = cache(async (): Promise<Profile> => {
  const supabase = createPublicClient();
  if (!supabase) return FALLBACK_PROFILE;
  const { data, error } = await supabase.from("profile").select("*").eq("id", 1).maybeSingle();
  if (error) console.error("Failed to load profile:", error.message);
  return (data as Profile | null) ?? FALLBACK_PROFILE;
});

export const getSocials = cache(() => listOrdered<Social>("socials"));
export const getProjects = cache(() => listOrdered<Project>("projects"));
export const getExperience = cache(() => listOrdered<Experience>("experience"));
export const getEducation = cache(() => listOrdered<Education>("education"));

export const getProject = cache(async (id: string) => {
  const supabase = createPublicClient();
  if (!supabase || !UUID.test(id)) return null;
  const { data } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  return data as Project | null;
});

export const getPublishedBlogs = cache(async (limit?: number): Promise<Blog[]> => {
  const supabase = createPublicClient();
  if (!supabase) return [];
  let query = supabase
    .from("blogs")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) console.error("Failed to load blogs:", error.message);
  return (data ?? []) as Blog[];
});

export const getBlogBySlug = cache(async (slug: string) => {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return data as Blog | null;
});
