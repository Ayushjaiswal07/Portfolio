import { ProfileForm } from "@/components/admin/profile-form";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function AdminProfilePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profile").select("*").eq("id", 1).single();
  if (error || !data) {
    return (
      <p className="text-danger">
        Could not load the profile row. Did you run <code>supabase/schema.sql</code>? ({error?.message})
      </p>
    );
  }
  return <ProfileForm profile={data as Profile} />;
}
