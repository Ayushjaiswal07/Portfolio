export interface Profile {
  id: number;
  full_name: string;
  headline: string;
  bio: string;
  location: string | null;
  availability: string | null;
  email: string | null;
  avatar_url: string | null;
  resume_url: string | null;
  updated_at: string;
}

export interface Social {
  id: string;
  platform: string;
  url: string;
  icon: string;
  sort_order: number;
}

export interface Project {
  id: string;
  name: string;
  short_description: string;
  description: string;
  tech_stack: string[];
  live_url: string | null;
  source_url: string | null;
  thumbnail_url: string | null;
  featured: boolean;
  sort_order: number;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  description: string;
  sort_order: number;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  start_year: number;
  end_year: number | null;
  details: string | null;
  sort_order: number;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  excerpt: string;
  content: string;
  published: boolean;
  published_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type ContentTable = "socials" | "projects" | "experience" | "education" | "blogs";
