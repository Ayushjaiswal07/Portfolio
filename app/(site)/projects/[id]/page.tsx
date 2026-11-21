import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaGithub } from "react-icons/fa6";
import { Markdown } from "@/components/markdown";
import { getProject, getProjects } from "@/lib/data";

export const revalidate = 3600;

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.filter((p) => p.description.trim()).map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[id]">): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return { title: "Project not found" };
  return {
    title: project.name,
    description: project.short_description,
    openGraph: {
      title: project.name,
      description: project.short_description,
      images: project.thumbnail_url ? [{ url: project.thumbnail_url }] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <article className="container-page max-w-3xl py-12 sm:py-16">
      <Link href="/#projects" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" /> All projects
      </Link>

      <header className="mb-10 mt-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{project.name}</h1>
        <p className="mt-3 text-lg text-muted">{project.short_description}</p>
        {project.tech_stack.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {project.tech_stack.map((t) => (
              <li key={t} className="tag">
                {t}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {project.live_url && (
            <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <ExternalLink className="size-4" /> Live demo
            </a>
          )}
          {project.source_url && (
            <a href={project.source_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              <FaGithub className="size-4" /> Source code
            </a>
          )}
        </div>
      </header>

      {project.thumbnail_url && (
        <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-xl border border-border bg-subtle">
          <Image
            src={project.thumbnail_url}
            alt={project.name}
            fill
            preload
            sizes="(min-width: 768px) 720px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      {project.description.trim() && <Markdown>{project.description}</Markdown>}
    </article>
  );
}
