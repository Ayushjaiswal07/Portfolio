import Image from "next/image";
import Link from "next/link";
import type { Blog } from "@/lib/types";
import { formatDate, readingTime } from "@/lib/utils";

export function BlogCard({ post }: { post: Blog }) {
  return (
    <article className="group relative flex flex-col gap-4 sm:flex-row sm:items-start">
      {post.cover_url && (
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-lg border border-border bg-subtle sm:w-48">
          <Image src={post.cover_url} alt="" fill sizes="(min-width: 640px) 192px, 100vw" className="object-cover" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">
          {post.published_at && <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>}
          {" · "}
          {readingTime(post.content)} min read
        </p>
        <h3 className="mt-1 text-lg font-semibold group-hover:text-accent">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted">{post.excerpt}</p>}
        {post.tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <li key={t} className="tag">
                #{t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
