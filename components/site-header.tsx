import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/#projects", label: "Projects" },
  { href: "/#experience", label: "Experience" },
  { href: "/#education", label: "Education" },
  { href: "/blog", label: "Blog" },
];

export function SiteHeader({ name }: { name: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container-page flex h-14 items-center justify-between gap-4">
        <Link href="/" className="truncate font-semibold tracking-tight">
          {name}
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hidden rounded-md px-3 py-1.5 text-muted transition-colors hover:text-foreground sm:block"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/blog"
            className="rounded-md px-3 py-1.5 text-muted transition-colors hover:text-foreground sm:hidden"
          >
            Blog
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
