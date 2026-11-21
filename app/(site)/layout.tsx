import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import { getProfile, getSocials } from "@/lib/data";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [profile, socials] = await Promise.all([getProfile(), getSocials()]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader name={profile.full_name} />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/60">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} {profile.full_name}
          </p>
          <SocialLinks socials={socials} />
        </div>
      </footer>
    </div>
  );
}
