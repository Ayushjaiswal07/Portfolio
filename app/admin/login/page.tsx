import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";
import { SetupNotice } from "@/components/admin/setup-notice";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      {isSupabaseConfigured ? (
        <div className="card w-full max-w-sm p-6 sm:p-8">
          <h1 className="text-xl font-bold tracking-tight">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted">Manage your portfolio content.</p>
          <LoginForm next={nextPath} />
        </div>
      ) : (
        <SetupNotice />
      )}
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← Back to site
      </Link>
    </div>
  );
}
