"use client";

import {
  Briefcase,
  ExternalLink,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Share2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/admin/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/profile", label: "Profile", icon: UserRound },
  { href: "/admin/socials", label: "Socials", icon: Share2 },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/experience", label: "Experience", icon: Briefcase },
  { href: "/admin/education", label: "Education", icon: GraduationCap },
  { href: "/admin/blogs", label: "Blogs", icon: Newspaper },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <aside className="border-b border-border bg-card md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-4 py-3 md:py-5">
        <Link href="/admin" className="font-semibold tracking-tight">
          Portfolio CMS
        </Link>
        <div className="flex items-center md:hidden">
          <ThemeToggle />
          <form action={signOut}>
            <button type="submit" className="btn-icon" aria-label="Sign out">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:pb-0">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive(href) ? "bg-subtle font-medium text-foreground" : "text-muted hover:bg-subtle hover:text-foreground",
            )}
          >
            <Icon className="size-4" /> {label}
          </Link>
        ))}
      </nav>

      <div className="hidden flex-col gap-1 border-t border-border p-3 md:flex">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-subtle hover:text-foreground"
        >
          <ExternalLink className="size-4" /> View site
        </Link>
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <p className="truncate text-xs text-muted" title={email}>
            {email}
          </p>
          <ThemeToggle />
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-subtle hover:text-foreground"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
