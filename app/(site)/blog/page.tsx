import type { Metadata } from "next";
import { BlogCard } from "@/components/blog-card";
import { getPublishedBlogs } from "@/lib/data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog",
  description: "Articles and notes.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage() {
  const posts = await getPublishedBlogs();
  return (
    <div className="container-page py-16">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Blog</h1>
      <p className="mt-2 text-muted">Articles, notes and things I&apos;ve learned.</p>
      <div className="mt-12 flex flex-col gap-10">
        {posts.length ? (
          posts.map((post) => <BlogCard key={post.id} post={post} />)
        ) : (
          <p className="text-muted">No posts yet. Check back soon.</p>
        )}
      </div>
    </div>
  );
}
