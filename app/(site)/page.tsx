import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { BlogCard } from "@/components/blog-card";
import { Education } from "@/components/sections/education";
import { Experience } from "@/components/sections/experience";
import { Hero } from "@/components/sections/hero";
import { Projects } from "@/components/sections/projects";
import { getEducation, getExperience, getProfile, getProjects, getPublishedBlogs, getSocials } from "@/lib/data";

// Pages are static and refreshed on demand by the admin (revalidatePath).
// This is just a safety net in case an on-demand revalidation is missed.
export const revalidate = 3600;

export default async function HomePage() {
  const [profile, socials, projects, experience, education, posts] = await Promise.all([
    getProfile(),
    getSocials(),
    getProjects(),
    getExperience(),
    getEducation(),
    getPublishedBlogs(3),
  ]);

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.full_name,
    jobTitle: profile.headline,
    description: profile.bio,
    image: profile.avatar_url ?? undefined,
    sameAs: socials.filter((s) => s.url.startsWith("http")).map((s) => s.url),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd).replace(/</g, "\\u003c") }}
      />
      <Hero profile={profile} socials={socials} />
      <Projects projects={projects} />
      <Experience items={experience} />
      <Education items={education} />

      {posts.length > 0 && (
        <section id="blog" className="container-page scroll-mt-20 py-16">
          <div className="mb-8 flex items-baseline justify-between">
            <h2 className="section-title mb-0">Latest writing</h2>
            <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
              All posts <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="flex flex-col gap-8">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
