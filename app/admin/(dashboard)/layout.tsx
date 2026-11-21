import { ShieldAlert } from "lucide-react";
import { redirect } from "next/navigation";
import { signOut } from "@/app/admin/actions";
import { AdminSidebar } from "@/components/admin/sidebar";
import { SetupNotice } from "@/components/admin/setup-notice";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <SetupNotice />
      </div>
    );
  }

  // The proxy already redirects signed-out visitors; this is the real check.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <div className="card max-w-lg p-6">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="size-5 text-danger" /> Not an admin
          </div>
          <p className="mt-2 text-sm text-muted">
            You are signed in as <strong>{user.email}</strong>, but this account is not in the{" "}
            <code>admins</code> table. Run this in the Supabase SQL Editor, then reload:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-subtle p-3 text-xs">
            {`insert into public.admins (user_id)\nvalues ('${user.id}');`}
          </pre>
          <form action={signOut} className="mt-4">
            <button type="submit" className="btn btn-secondary">
              Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh md:flex">
      <AdminSidebar email={user.email ?? ""} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">{children}</div>
      </main>
    </div>
  );
}
