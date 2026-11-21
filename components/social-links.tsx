import type { Social } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SocialIcon } from "./social-icon";

export function SocialLinks({ socials, className }: { socials: Social[]; className?: string }) {
  if (!socials.length) return null;
  return (
    <ul className={cn("flex flex-wrap items-center gap-1", className)}>
      {socials.map((s) => (
        <li key={s.id}>
          <a
            href={s.url}
            target={s.url.startsWith("mailto:") ? undefined : "_blank"}
            rel="noopener noreferrer me"
            aria-label={s.platform}
            title={s.platform}
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-subtle hover:text-foreground"
          >
            <SocialIcon icon={s.icon} className="size-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  );
}
