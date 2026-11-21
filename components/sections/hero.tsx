import { Download, FileText, Mail, MapPin } from "lucide-react";
import Image from "next/image";
import type { Profile, Social } from "@/lib/types";
import { SocialLinks } from "../social-links";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Hero({ profile, socials }: { profile: Profile; socials: Social[] }) {
  // Supabase Storage forces a download when ?download= is present.
  const downloadUrl = profile.resume_url
    ? `${profile.resume_url}${profile.resume_url.includes("?") ? "&" : "?"}download=${encodeURIComponent(
        `${profile.full_name.replace(/\s+/g, "-")}-Resume.pdf`,
      )}`
    : null;

  return (
    <section className="container-page pb-16 pt-16 sm:pt-24">
      <div className="flex flex-col-reverse gap-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          {profile.availability && (
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              {profile.availability}
            </p>
          )}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{profile.full_name}</h1>
          <p className="mt-3 text-lg text-accent sm:text-xl">{profile.headline}</p>
          {profile.location && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="size-4" /> {profile.location}
            </p>
          )}
          {profile.bio && (
            <p className="mt-6 whitespace-pre-line leading-relaxed text-muted">{profile.bio}</p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {downloadUrl && (
              <>
                <a href={downloadUrl} className="btn btn-primary">
                  <Download className="size-4" /> Download Resume
                </a>
                <a href={profile.resume_url!} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  <FileText className="size-4" /> View
                </a>
              </>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="btn btn-secondary">
                <Mail className="size-4" /> Contact
              </a>
            )}
          </div>

          <SocialLinks socials={socials} className="-ml-2 mt-6" />
        </div>

        <div className="shrink-0">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name}
              width={176}
              height={176}
              preload
              className="size-32 rounded-full border border-border object-cover shadow-sm sm:size-44"
            />
          ) : (
            <div className="flex size-32 items-center justify-center rounded-full border border-border bg-subtle text-3xl font-semibold text-muted sm:size-44 sm:text-4xl">
              {initials(profile.full_name)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
