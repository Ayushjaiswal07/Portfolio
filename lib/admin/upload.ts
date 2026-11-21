"use client";

import { createClient } from "@/lib/supabase/client";

export type Bucket = "avatars" | "resumes" | "media";

/**
 * Uploads straight from the browser to Supabase Storage. Storage RLS only lets
 * admins write, and this avoids Vercel's 4.5 MB serverless request body limit.
 */
export async function uploadFile(bucket: Bucket, file: File, folder?: string) {
  const supabase = createClient();
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${folder ? `${folder}/` : ""}${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Best-effort removal of a file previously uploaded to one of our buckets. */
export async function removeFileByUrl(url: string | null | undefined) {
  if (!url) return;
  const match = url.match(/\/storage\/v1\/object\/public\/(avatars|resumes|media)\/([^?#]+)/);
  if (!match) return;
  const supabase = createClient();
  await supabase.storage.from(match[1]).remove([decodeURIComponent(match[2])]);
}
