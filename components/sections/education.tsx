import { GraduationCap } from "lucide-react";
import type { Education as EducationRow } from "@/lib/types";

export function Education({ items }: { items: EducationRow[] }) {
  if (!items.length) return null;
  return (
    <section id="education" className="container-page scroll-mt-20 py-16">
      <h2 className="section-title">Education</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="card flex gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-subtle text-accent">
              <GraduationCap className="size-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold">{item.institution}</h3>
              <p className="text-sm">{item.degree}</p>
              <p className="mt-1 text-sm tabular-nums text-muted">
                {item.start_year} – {item.end_year ?? "Present"}
              </p>
              {item.details && <p className="mt-2 whitespace-pre-line text-sm text-muted">{item.details}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
