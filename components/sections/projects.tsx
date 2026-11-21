import { ArrowUpRight, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FaGithub } from "react-icons/fa6";
import type { Project } from "@/lib/types";

function ProjectLinks({ project }: { project: Project }) {
  return (
    <div className="flex items-center gap-1">
      {project.source_url && (
        <a
          href={project.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-icon relative z-10"
          aria-label={`${project.name} source code`}
        >
          <FaGithub className="size-4" />
        </a>
      )}
      {project.live_url && (
        <a
          href={project.live_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-icon relative z-10"
          aria-label={`${project.name} live demo`}
        >
          <ExternalLink className="size-4" />
        </a>
      )}
    </div>
  );
}

function TechTags({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <li key={t} className="tag">
          {t}
        </li>
      ))}
    </ul>
  );
}

/** Card title links to the detail page when there is a long description. */
function ProjectTitle({ project }: { project: Project }) {
  if (!project.description.trim()) return <>{project.name}</>;
  return (
    <Link href={`/projects/${project.id}`} className="after:absolute after:inset-0 hover:text-accent">
      {project.name}
    </Link>
  );
}

function FeaturedCard({ project }: { project: Project }) {
  return (
    <article className="card group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <div className="relative aspect-[16/9] overflow-hidden border-b border-border bg-subtle">
        {project.thumbnail_url ? (
          <Image
            src={project.thumbnail_url}
            alt=""
            fill
            sizes="(min-width: 640px) 480px, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-3xl font-semibold text-muted/50">
            {project.name}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold">
            <ProjectTitle project={project} />
          </h3>
          <ProjectLinks project={project} />
        </div>
        <p className="flex-1 text-sm leading-relaxed text-muted">{project.short_description}</p>
        <TechTags tags={project.tech_stack} />
      </div>
    </article>
  );
}

function CompactCard({ project }: { project: Project }) {
  return (
    <article className="card relative flex flex-col gap-3 p-5 transition-colors hover:bg-subtle/50">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold">
          <ProjectTitle project={project} />
        </h3>
        <ProjectLinks project={project} />
      </div>
      <p className="flex-1 text-sm leading-relaxed text-muted">{project.short_description}</p>
      <TechTags tags={project.tech_stack} />
    </article>
  );
}

export function Projects({ projects }: { projects: Project[] }) {
  if (!projects.length) return null;
  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);

  return (
    <section id="projects" className="container-page scroll-mt-20 py-16">
      <h2 className="section-title">Projects</h2>
      {featured.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2">
          {featured.map((p) => (
            <FeaturedCard key={p.id} project={p} />
          ))}
        </div>
      )}
      {others.length > 0 && (
        <>
          {featured.length > 0 && (
            <h3 className="mb-4 mt-12 flex items-center gap-1 text-sm font-medium text-muted">
              More projects <ArrowUpRight className="size-4" />
            </h3>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((p) => (
              <CompactCard key={p.id} project={p} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
