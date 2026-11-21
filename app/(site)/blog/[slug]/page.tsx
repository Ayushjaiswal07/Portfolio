import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { getBlogBySlug, getProfile, getPublishedBlogs } from "@/lib/data";
import { formatDate, readingTime } from "@/lib/utils";

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getPublishedBlogs();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt || undefined,
    keywords: post.tags,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt || undefined,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      tags: post.tags,
      images: post.cover_url ? [{ url: post.cover_url }] : undefined,
    },
    twitter: { card: post.cover_url ? "summary_large_image" : "summary" },
  };
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const [post, profile] = await Promise.all([getBlogBySlug(slug), getProfile()]);
  if (!post) notFound();

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.cover_url ?? undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at,
    author: { "@type": "Person", name: profile.full_name },
    keywords: post.tags.join(", "),
  };

  return (
    <article className="container-page max-w-3xl py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd).replace(/</g, "\\u003c") }}
      />
      <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" /> All posts
      </Link>

      <header className="mb-10 mt-8">
        <p className="text-sm text-muted">
          {post.published_at && <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>}
          {" · "}
          {readingTime(post.content)} min read
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
        {post.excerpt && <p className="mt-4 text-lg text-muted">{post.excerpt}</p>}
        {post.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <li key={t} className="tag">
                #{t}
              </li>
            ))}
          </ul>
        )}
      </header>

      {post.cover_url && (
        <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-xl border border-border bg-subtle">
          <Image src={post.cover_url} alt="" fill preload sizes="(min-width: 768px) 720px, 100vw" className="object-cover" />
        </div>
      )}

      <Markdown>{post.content}</Markdown>
    </article>
  );
}
