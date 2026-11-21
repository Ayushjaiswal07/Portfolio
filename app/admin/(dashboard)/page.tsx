import { ArrowRight, Briefcase, FolderKanban, GraduationCap, Newspaper, Share2, UserRound } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function count(table: string, filter?: { column: string; value: boolean }) {
  const supabase = await createClient();
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) query = query.eq(filter.column, filter.value);
  const { count } = await query;
  return count ?? 0;
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const [{ data: profile }, socials, projects, experience, education, published, drafts] = await Promise.all([
    supabase.from("profile").select("full_name, avatar_url, resume_url").eq("id", 1).maybeSingle(),
    count("socials"),
    count("projects"),
    count("experience"),
    count("education"),
    count("blogs", { column: "published", value: true }),
    count("blogs", { column: "published", value: false }),
  ]);

  const cards = [
    {
      href: "/admin/profile",
      label: "Profile",
      icon: UserRound,
      stat: profile?.full_name ?? "—",
      hint: [!profile?.avatar_url && "no photo", !profile?.resume_url && "no resume"].filter(Boolean).join(", ") || "Complete",
    },
    { href: "/admin/socials", label: "Social links", icon: Share2, stat: socials, hint: "links" },
    { href: "/admin/projects", label: "Projects", icon: FolderKanban, stat: projects, hint: "projects" },
    { href: "/admin/experience", label: "Experience", icon: Briefcase, stat: experience, hint: "roles" },
    { href: "/admin/education", label: "Education", icon: GraduationCap, stat: education, hint: "entries" },
    { href: "/admin/blogs", label: "Blog posts", icon: Newspaper, stat: published, hint: `published · ${drafts} drafts` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-muted">Changes you save here appear on the public site right away.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ href, label, icon: Icon, stat, hint }) => (
          <Link key={href} href={href} className="card group flex flex-col gap-3 p-5 transition-colors hover:bg-subtle/60">
            <div className="flex items-center justify-between text-muted">
              <span className="flex items-center gap-2 text-sm">
                <Icon className="size-4" /> {label}
              </span>
              <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="truncate text-2xl font-semibold">{stat}</p>
            <p className="text-xs text-muted">{hint}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
