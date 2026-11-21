"use client";

import { Eye, FileText, ImagePlus, Loader2, PenLine, Columns2, Trash2, Upload, X } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Markdown } from "@/components/markdown";
import { uploadFile, type Bucket } from "@/lib/admin/upload";
import { cn } from "@/lib/utils";

export function Field({
  id,
  label,
  required,
  help,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : help ? (
        <p className="text-xs text-muted">{help}</p>
      ) : null}
    </div>
  );
}

export function Toggle({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border transition-colors",
        checked ? "bg-accent" : "bg-subtle",
      )}
    >
      <span
        className={cn(
          "inline-block size-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

export function TagsInput({
  id,
  value,
  onChange,
  placeholder,
  invalid,
}: {
  id: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const next = raw
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t && !value.some((v) => v.toLowerCase() === t.toLowerCase()));
    if (next.length) onChange([...value, ...next]);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div
      className={cn("input flex min-h-10 flex-wrap items-center gap-1.5 py-1.5", invalid && "border-danger")}
      onClick={() => document.getElementById(id)?.focus()}
    >
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-subtle px-2 py-0.5 text-xs">
          {tag}
          <button
            type="button"
            className="text-muted hover:text-foreground"
            aria-label={`Remove ${tag}`}
            onClick={() => onChange(value.filter((t) => t !== tag))}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => draft && add(draft)}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text");
          if (text.includes(",")) {
            e.preventDefault();
            add(text);
          }
        }}
        placeholder={value.length ? "" : placeholder ?? "Type and press Enter"}
        className="min-w-24 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted/70"
      />
    </div>
  );
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];

export function FileUpload({
  id,
  value,
  onChange,
  bucket,
  kind,
  folder,
  maxMb = kind === "pdf" ? 10 : 5,
  className,
}: {
  id?: string;
  value: string;
  onChange: (url: string | null) => void | Promise<void>;
  bucket: Bucket;
  kind: "image" | "pdf";
  folder?: string;
  maxMb?: number;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const accept = kind === "pdf" ? "application/pdf" : IMAGE_TYPES.join(",");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const okType = kind === "pdf" ? file.type === "application/pdf" : IMAGE_TYPES.includes(file.type);
    if (!okType) return toast.error(kind === "pdf" ? "Please choose a PDF file" : "Please choose a PNG, JPG, WebP, GIF or AVIF image");
    if (file.size > maxMb * 1024 * 1024) return toast.error(`File is too large (max ${maxMb} MB)`);

    setUploading(true);
    try {
      const url = await uploadFile(bucket, file, folder);
      await onChange(url);
    } catch (e) {
      toast.error("Upload failed", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-dashed border-border p-3 transition-colors sm:flex-row sm:items-center",
        dragging && "border-accent bg-accent/5",
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
    >
      {value ? (
        kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary uploads
          <img src={value} alt="" className="h-20 w-32 shrink-0 rounded-md border border-border object-cover" />
        ) : (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-20 w-32 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-border bg-subtle text-xs text-muted hover:text-foreground"
          >
            <FileText className="size-6" /> Open PDF
          </a>
        )
      ) : (
        <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-md bg-subtle text-muted">
          {kind === "image" ? <ImagePlus className="size-6" /> : <FileText className="size-6" />}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2">
        <p className="text-xs text-muted">
          Drag & drop or choose a {kind === "pdf" ? "PDF" : "image"} (max {maxMb} MB)
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            className="btn btn-secondary py-1.5"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
          </button>
          {value && (
            <button
              type="button"
              className="btn btn-ghost py-1.5 text-danger"
              disabled={uploading}
              onClick={() => onChange(null)}
            >
              <Trash2 className="size-4" /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type EditorView = "write" | "preview" | "split";

export function MarkdownEditor({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
}) {
  const [view, setView] = useState<EditorView>("write");
  const tabs: { key: EditorView; label: string; icon: typeof Eye; className?: string }[] = [
    { key: "write", label: "Write", icon: PenLine },
    { key: "preview", label: "Preview", icon: Eye },
    { key: "split", label: "Split", icon: Columns2, className: "hidden lg:inline-flex" },
  ];

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border", invalid && "border-danger")}>
      <div className="flex items-center gap-1 border-b border-border bg-subtle px-2 py-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setView(t.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              view === t.key ? "bg-card shadow-sm" : "text-muted hover:text-foreground",
              t.className,
            )}
          >
            <t.icon className="size-3.5" /> {t.label}
          </button>
        ))}
        <span className="ml-auto hidden text-xs text-muted sm:block">Markdown supported</span>
      </div>
      <div className={cn("grid", view === "split" && "lg:grid-cols-2")}>
        {view !== "preview" && (
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck
            aria-invalid={invalid || undefined}
            className="min-h-80 w-full resize-y bg-card p-3 font-mono text-sm leading-relaxed outline-none"
            placeholder={"## Heading\n\nWrite **Markdown** here. Code blocks get syntax highlighting:\n\n```ts\nconst hello = 'world';\n```"}
          />
        )}
        {view !== "write" && (
          <div className={cn("min-h-80 overflow-auto bg-background p-4", view === "split" && "lg:border-l lg:border-border")}>
            {value.trim() ? (
              <Markdown className="prose-sm">{value}</Markdown>
            ) : (
              <p className="text-sm text-muted">Nothing to preview yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
