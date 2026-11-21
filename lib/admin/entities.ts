import { z } from "zod";
import { SOCIAL_ICON_OPTIONS } from "../social-icons";
import type { ContentTable } from "../types";
import { formatMonthYear, isValidUrl } from "../utils";

/**
 * One definition per CMS table. It drives the admin list, the edit form and
 * validation on both the client and the server, so they never drift apart.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "markdown"
  | "url"
  | "date"
  | "number"
  | "tags"
  | "image"
  | "toggle"
  | "select"
  | "slug"
  | "email";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** store "" as null (always true for url/date/image) */
  nullable?: boolean;
  max?: number;
  placeholder?: string;
  help?: string;
  options?: ReadonlyArray<{ value: string; label: string }>;
  /** span both columns of the form grid */
  wide?: boolean;
}

export type Row = Record<string, unknown> & { id: string };

export interface EntityDef {
  table: ContentTable;
  title: string;
  singular: string;
  description: string;
  /** rows have a sort_order column that the admin can reorder */
  orderable: boolean;
  fields: FieldDef[];
  listTitle: (row: Row) => string;
  listSubtitle?: (row: Row) => string;
  listBadge?: (row: Row) => { label: string; tone: "green" | "amber" | "accent" } | null;
  listImage?: string;
  /** cross-field validation, returns errors keyed by field name */
  validate?: (data: Record<string, unknown>) => Partial<Record<string, string>>;
}

export const ENTITIES: Record<ContentTable, EntityDef> = {
  socials: {
    table: "socials",
    title: "Social Links",
    singular: "Social link",
    description: "Where people can find you. Shown in the hero and footer.",
    orderable: true,
    fields: [
      { name: "platform", label: "Platform name", type: "text", required: true, max: 60, placeholder: "GitHub" },
      { name: "icon", label: "Icon", type: "select", required: true, options: SOCIAL_ICON_OPTIONS },
      {
        name: "url",
        label: "URL",
        type: "url",
        required: true,
        wide: true,
        placeholder: "https://github.com/username",
        help: "For email use mailto:you@example.com",
      },
    ],
    listTitle: (r) => String(r.platform),
    listSubtitle: (r) => String(r.url),
  },

  projects: {
    table: "projects",
    title: "Projects",
    singular: "Project",
    description: "Featured projects appear first on the homepage.",
    orderable: true,
    listImage: "thumbnail_url",
    fields: [
      { name: "name", label: "Project name", type: "text", required: true, max: 120 },
      { name: "featured", label: "Featured project", type: "toggle" },
      {
        name: "short_description",
        label: "Short description",
        type: "textarea",
        required: true,
        max: 300,
        wide: true,
        help: "One or two sentences shown on the project card.",
      },
      { name: "tech_stack", label: "Tech stack", type: "tags", wide: true, placeholder: "Next.js, TypeScript…" },
      { name: "live_url", label: "Live demo URL", type: "url", placeholder: "https://…" },
      { name: "source_url", label: "Source code URL", type: "url", placeholder: "https://github.com/…" },
      { name: "thumbnail_url", label: "Thumbnail image", type: "image", wide: true },
      {
        name: "description",
        label: "Detailed description",
        type: "markdown",
        wide: true,
        help: "Markdown. Shown on the project's own page.",
      },
    ],
    listTitle: (r) => String(r.name),
    listSubtitle: (r) => ((r.tech_stack as string[]) ?? []).join(" · "),
    listBadge: (r) => (r.featured ? { label: "Featured", tone: "accent" } : null),
  },

  experience: {
    table: "experience",
    title: "Experience",
    singular: "Experience",
    description: "Your work history, shown as a timeline.",
    orderable: true,
    fields: [
      { name: "role", label: "Role / title", type: "text", required: true, max: 120 },
      { name: "company", label: "Company", type: "text", required: true, max: 120 },
      { name: "location", label: "Location", type: "text", nullable: true, max: 120, placeholder: "Remote" },
      { name: "start_date", label: "Start date", type: "date", required: true },
      { name: "end_date", label: "End date", type: "date", help: "Leave empty for “Present”." },
      {
        name: "description",
        label: "Description",
        type: "markdown",
        wide: true,
        help: "Markdown. Use “- ” for bullet points.",
      },
    ],
    validate: (d) =>
      d.end_date && d.start_date && String(d.end_date) < String(d.start_date)
        ? { end_date: "End date must be after the start date" }
        : {},
    listTitle: (r) => `${r.role} · ${r.company}`,
    listSubtitle: (r) =>
      `${formatMonthYear(String(r.start_date))} – ${r.end_date ? formatMonthYear(String(r.end_date)) : "Present"}`,
  },

  education: {
    table: "education",
    title: "Education",
    singular: "Education",
    description: "Degrees, certifications and courses.",
    orderable: true,
    fields: [
      { name: "institution", label: "Institution", type: "text", required: true, max: 160 },
      { name: "degree", label: "Degree / field of study", type: "text", required: true, max: 160 },
      { name: "start_year", label: "Start year", type: "number", required: true, placeholder: "2020" },
      { name: "end_year", label: "End year", type: "number", placeholder: "2024", help: "Leave empty for “Present”." },
      {
        name: "details",
        label: "Grade / details",
        type: "textarea",
        nullable: true,
        wide: true,
        max: 1000,
        placeholder: "CGPA 8.9 / 10",
      },
    ],
    validate: (d) =>
      d.end_year != null && d.start_year != null && Number(d.end_year) < Number(d.start_year)
        ? { end_year: "End year must be after the start year" }
        : {},
    listTitle: (r) => String(r.institution),
    listSubtitle: (r) => `${r.degree} · ${r.start_year} – ${r.end_year ?? "Present"}`,
  },

  blogs: {
    table: "blogs",
    title: "Blog Posts",
    singular: "Blog post",
    description: "Drafts are only visible to you. Published posts appear on /blog.",
    orderable: false,
    listImage: "cover_url",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 160, wide: true },
      {
        name: "slug",
        label: "URL slug",
        type: "slug",
        max: 80,
        placeholder: "auto-generated-from-title",
        help: "Lowercase letters, numbers and dashes. Leave empty to generate from the title.",
      },
      { name: "tags", label: "Tags", type: "tags", placeholder: "nextjs, career…" },
      { name: "excerpt", label: "Summary / excerpt", type: "textarea", max: 400, wide: true },
      { name: "cover_url", label: "Cover image", type: "image", wide: true },
      { name: "content", label: "Content", type: "markdown", required: true, wide: true },
      { name: "published", label: "Published", type: "toggle", help: "Off = draft." },
      {
        name: "published_at",
        label: "Published date",
        type: "date",
        help: "Defaults to today when you publish.",
      },
    ],
    listTitle: (r) => String(r.title),
    listSubtitle: (r) => `/blog/${r.slug}`,
    listBadge: (r) =>
      r.published ? { label: "Published", tone: "green" } : { label: "Draft", tone: "amber" },
  },
};

export function isContentTable(value: string): value is ContentTable {
  return value in ENTITIES;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fieldSchema(f: FieldDef): z.ZodType {
  switch (f.type) {
    case "toggle":
      return z.boolean();
    case "tags":
      return z.array(z.string().trim().min(1).max(40)).max(30, "Too many tags");
    case "select":
      return z
        .string()
        .refine((v) => f.options?.some((o) => o.value === v), `Choose a valid ${f.label.toLowerCase()}`);
    case "number": {
      const n = z.number({ error: `${f.label} must be a number` }).int().min(1900).max(2100);
      return z.preprocess(
        (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
        f.required ? n.nullable().refine((v) => v !== null, `${f.label} is required`) : n.nullable(),
      );
    }
    default: {
      const emptyAsNull =
        f.nullable || f.type === "url" || f.type === "date" || f.type === "image" || f.type === "email";
      let s = z.string().trim().max(f.max ?? 100_000, `${f.label} must be at most ${f.max} characters`);
      if (f.type === "url") s = s.refine((v) => !v || isValidUrl(v), "Enter a valid URL (https://…)");
      if (f.type === "image") s = s.refine((v) => !v || isValidUrl(v), "Invalid image URL");
      if (f.type === "date") s = s.refine((v) => !v || DATE_RE.test(v), "Enter a valid date");
      if (f.type === "slug") s = s.refine((v) => !v || SLUG_RE.test(v), "Only lowercase letters, numbers and dashes");
      if (f.type === "email") s = s.refine((v) => !v || EMAIL_RE.test(v), "Enter a valid email");
      if (f.required) return s.refine((v) => v.length > 0, `${f.label} is required`);
      return emptyAsNull ? s.transform((v) => v || null) : s;
    }
  }
}

export type ValidationResult =
  | { success: true; data: Record<string, unknown> }
  | { success: false; errors: Record<string, string> };

export function validateFields(fields: FieldDef[], input: Record<string, unknown>, extra?: EntityDef["validate"]): ValidationResult {
  const shape = Object.fromEntries(fields.map((f) => [f.name, fieldSchema(f)]));
  const result = z.object(shape).safeParse(input);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? "_form");
      errors[key] ??= issue.message;
    }
    return { success: false, errors };
  }
  const crossErrors = Object.fromEntries(
    Object.entries(extra?.(result.data) ?? {}).filter((e): e is [string, string] => Boolean(e[1])),
  );
  if (Object.keys(crossErrors).length) return { success: false, errors: crossErrors };
  return { success: true, data: result.data };
}

export function validateEntity(table: ContentTable, input: Record<string, unknown>) {
  const def = ENTITIES[table];
  return validateFields(def.fields, input, def.validate);
}

/** Empty form values for a new row. */
export function emptyValues(fields: FieldDef[]) {
  return Object.fromEntries(
    fields.map((f) => [
      f.name,
      f.type === "toggle" ? false : f.type === "tags" ? [] : f.type === "select" ? (f.options?.[0]?.value ?? "") : "",
    ]),
  );
}

/** Convert a DB row to form values (nulls → ""). */
export function rowToValues(fields: FieldDef[], row: Record<string, unknown>) {
  return Object.fromEntries(
    fields.map((f) => {
      const v = row[f.name];
      if (f.type === "toggle") return [f.name, Boolean(v)];
      if (f.type === "tags") return [f.name, Array.isArray(v) ? v : []];
      if (f.type === "date") return [f.name, v ? String(v).slice(0, 10) : ""];
      return [f.name, v === null || v === undefined ? "" : String(v)];
    }),
  );
}

/** Fields for the single-row profile form. */
export const PROFILE_FIELDS: FieldDef[] = [
  { name: "full_name", label: "Full name", type: "text", required: true, max: 100 },
  { name: "headline", label: "Headline / tagline", type: "text", required: true, max: 160 },
  { name: "location", label: "Location", type: "text", nullable: true, max: 100, placeholder: "Bengaluru, India" },
  {
    name: "availability",
    label: "Availability status",
    type: "text",
    nullable: true,
    max: 100,
    placeholder: "Open to full-time roles",
    help: "Leave empty to hide the status badge.",
  },
  { name: "email", label: "Contact email", type: "email", nullable: true, max: 200, placeholder: "you@example.com" },
  { name: "bio", label: "Short bio", type: "textarea", max: 2000, wide: true },
];
