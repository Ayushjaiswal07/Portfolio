"use client";

import type { FieldDef } from "@/lib/admin/entities";
import { cn } from "@/lib/utils";
import { Field, FileUpload, MarkdownEditor, TagsInput, Toggle } from "./fields";

type Values = Record<string, unknown>;

/** Renders a grid of inputs from field definitions. */
export function FormFields({
  fields,
  values,
  errors,
  onChange,
  idPrefix,
  placeholders,
}: {
  fields: FieldDef[];
  values: Values;
  errors: Record<string, string>;
  onChange: (name: string, value: unknown) => void;
  idPrefix: string;
  placeholders?: Record<string, string>;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {fields.map((f) => {
        const id = `${idPrefix}-${f.name}`;
        const error = errors[f.name];
        const invalid = Boolean(error);
        const common = {
          id,
          "aria-invalid": invalid || undefined,
          "aria-describedby": invalid ? `${id}-error` : undefined,
        };
        const str = (values[f.name] as string) ?? "";
        const wide = f.wide || f.type === "markdown" || f.type === "image";

        let input: React.ReactNode;
        switch (f.type) {
          case "textarea":
            input = (
              <textarea
                {...common}
                className="input min-h-24 resize-y"
                value={str}
                maxLength={f.max}
                placeholder={f.placeholder}
                onChange={(e) => onChange(f.name, e.target.value)}
              />
            );
            break;
          case "markdown":
            input = <MarkdownEditor id={id} value={str} invalid={invalid} onChange={(v) => onChange(f.name, v)} />;
            break;
          case "tags":
            input = (
              <TagsInput
                id={id}
                value={(values[f.name] as string[]) ?? []}
                invalid={invalid}
                placeholder={f.placeholder}
                onChange={(v) => onChange(f.name, v)}
              />
            );
            break;
          case "toggle":
            input = (
              <div className="flex h-10 items-center">
                <Toggle
                  id={id}
                  label={f.label}
                  checked={Boolean(values[f.name])}
                  onChange={(v) => onChange(f.name, v)}
                />
              </div>
            );
            break;
          case "image":
            input = (
              <FileUpload
                id={id}
                bucket="media"
                kind="image"
                folder={idPrefix}
                value={str}
                onChange={(url) => onChange(f.name, url ?? "")}
              />
            );
            break;
          case "select":
            input = (
              <select {...common} className="input" value={str} onChange={(e) => onChange(f.name, e.target.value)}>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            );
            break;
          default:
            input = (
              <input
                {...common}
                className="input"
                type={f.type === "url" ? "url" : f.type === "email" ? "email" : f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                inputMode={f.type === "number" ? "numeric" : undefined}
                value={str}
                maxLength={f.max}
                placeholder={placeholders?.[f.name] ?? f.placeholder}
                onChange={(e) => onChange(f.name, e.target.value)}
              />
            );
        }

        return (
          <Field
            key={f.name}
            id={id}
            label={f.label}
            required={f.required}
            help={f.help}
            error={error}
            className={cn(wide && "sm:col-span-2")}
          >
            {input}
          </Field>
        );
      })}
    </div>
  );
}
