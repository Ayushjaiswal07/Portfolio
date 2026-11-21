import type { MetadataRoute } from "next";
import { getProjects, getPublishedBlogs } from "@/lib/data";
import { siteUrl } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects] = await Promise.all([getPublishedBlogs(), getProjects()]);
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/blog`, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((p) => ({
      url: `${siteUrl}/blog/${p.slug}`,
      lastModified: p.updated_at,
      priority: 0.6,
    })),
    ...projects
      .filter((p) => p.description.trim())
      .map((p) => ({ url: `${siteUrl}/projects/${p.id}`, priority: 0.5 })),
  ];
}
