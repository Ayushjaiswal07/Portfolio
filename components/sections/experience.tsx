import { MapPin } from "lucide-react";
import type { Experience as ExperienceRow } from "@/lib/types";
import { formatMonthYear } from "@/lib/utils";
import { Markdown } from "../markdown";

export function Experience({ items }: { items: ExperienceRow[] }) {
  if (!items.length) return null;
  return (
    <section id="experience" className="container-page scroll-mt-20 py-16">
      <h2 className="section-title">Experience</h2>
      <ol className="relative ml-1.5 border-l border-border">
        {items.map((item) => (
          <li key={item.id} className="relative pb-10 pl-8 last:pb-0">
            <span
              className={`absolute -left-[7px] top-1.5 size-3.5 rounded-full border-2 border-background ${
                item.end_date ? "bg-border" : "bg-accent"
              }`}
            />
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <h3 className="font-semibold">
                {item.role} <span className="text-muted">· {item.company}</span>
              </h3>
              <time className="shrink-0 text-sm tabular-nums text-muted">
                {formatMonthYear(item.start_date)} – {item.end_date ? formatMonthYear(item.end_date) : "Present"}
              </time>
            </div>
            {item.location && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
                <MapPin className="size-3" /> {item.location}
              </p>
            )}
            {item.description.trim() && (
              <Markdown className="prose-sm mt-3 text-muted prose-li:my-0.5">{item.description}</Markdown>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
