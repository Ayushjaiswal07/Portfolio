import { TriangleAlert } from "lucide-react";

export function SetupNotice() {
  return (
    <div className="card mx-auto max-w-lg p-6">
      <div className="flex items-center gap-2 font-semibold">
        <TriangleAlert className="size-5 text-amber-500" /> Supabase is not configured
      </div>
      <p className="mt-2 text-sm text-muted">
        Copy <code>.env.example</code> to <code>.env.local</code>, fill in <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then restart the dev server. On Vercel, add them under Project
        Settings → Environment Variables and redeploy.
      </p>
    </div>
  );
}
