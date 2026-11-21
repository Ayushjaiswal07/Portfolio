"use client";

import { ArrowDown, ArrowLeft, ArrowUp, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteEntity, reorderEntity, saveEntity } from "@/app/admin/actions";
import { ENTITIES, emptyValues, rowToValues, validateEntity, type Row } from "@/lib/admin/entities";
import type { ContentTable } from "@/lib/types";
import { cn, slugify } from "@/lib/utils";
import { FormFields } from "./form-fields";

const BADGE_TONES = {
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  accent: "bg-accent/10 text-accent",
};

export function CrudManager({ table, initialRows }: { table: ContentTable; initialRows: Row[] }) {
  const def = ENTITIES[table];
  const [rows, setRows] = useState(initialRows);
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Server re-renders (after revalidation) hand us fresh rows.
  useEffect(() => setRows(initialRows), [initialRows]);

  if (editing) {
    return (
      <EntityForm
        table={table}
        row={editing === "new" ? null : editing}
        onDone={() => setEditing(null)}
      />
    );
  }

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    const previous = rows;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
    startTransition(async () => {
      const res = await reorderEntity(table, next.map((r) => r.id));
      if (!res.ok) {
        setRows(previous);
        toast.error("Could not reorder", { description: res.error });
      }
    });
  };

  const remove = (row: Row) => {
    setBusyId(row.id);
    startTransition(async () => {
      const res = await deleteEntity(table, row.id);
      setBusyId(null);
      setConfirmId(null);
      if (res.ok) {
        setRows((r) => r.filter((x) => x.id !== row.id));
        toast.success(`${def.singular} deleted`);
      } else {
        toast.error("Could not delete", { description: res.error });
      }
    });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{def.title}</h1>
          <p className="mt-1 text-sm text-muted">{def.description}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>
          <Plus className="size-4" /> Add {def.singular.toLowerCase()}
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-muted">No {def.title.toLowerCase()} yet.</p>
          <button type="button" className="btn btn-secondary" onClick={() => setEditing("new")}>
            <Plus className="size-4" /> Add your first {def.singular.toLowerCase()}
          </button>
        </div>
      ) : (
        <ul className="card divide-y divide-border">
          {rows.map((row, i) => {
            const badge = def.listBadge?.(row);
            const image = def.listImage ? (row[def.listImage] as string | null) : null;
            return (
              <li key={row.id} className="flex items-center gap-3 p-3 sm:p-4">
                {def.orderable && (
                  <div className="flex flex-col">
                    <button
                      type="button"
                      className="btn-icon size-6"
                      aria-label="Move up"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      className="btn-icon size-6"
                      aria-label="Move down"
                      disabled={i === rows.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                  </div>
                )}
                {def.listImage &&
                  (image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="hidden h-12 w-20 shrink-0 rounded-md border border-border object-cover sm:block" />
                  ) : (
                    <div className="hidden h-12 w-20 shrink-0 rounded-md bg-subtle sm:block" />
                  ))}
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setEditing(row)}>
                  <p className="flex items-center gap-2 font-medium">
                    <span className="truncate">{def.listTitle(row)}</span>
                    {badge && (
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", BADGE_TONES[badge.tone])}>
                        {badge.label}
                      </span>
                    )}
                  </p>
                  {def.listSubtitle && <p className="truncate text-sm text-muted">{def.listSubtitle(row)}</p>}
                </button>

                {confirmId === row.id ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden text-sm text-muted sm:inline">Delete?</span>
                    <button
                      type="button"
                      className="btn btn-danger px-3 py-1.5"
                      disabled={busyId === row.id}
                      onClick={() => remove(row)}
                    >
                      {busyId === row.id ? <Loader2 className="size-4 animate-spin" /> : "Delete"}
                    </button>
                    <button type="button" className="btn btn-ghost px-3 py-1.5" onClick={() => setConfirmId(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center">
                    <button type="button" className="btn-icon" aria-label="Edit" onClick={() => setEditing(row)}>
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="btn-icon hover:text-danger"
                      aria-label="Delete"
                      onClick={() => setConfirmId(row.id)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EntityForm({ table, row, onDone }: { table: ContentTable; row: Row | null; onDone: () => void }) {
  const def = ENTITIES[table];
  const initial = useMemo(() => (row ? rowToValues(def.fields, row) : emptyValues(def.fields)), [def, row]);
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  const onChange = (name: string, value: unknown) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors(({ [name]: _removed, ...rest }) => rest);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateEntity(table, values);
    if (!check.success) {
      setErrors(check.errors);
      toast.error("Please fix the highlighted fields");
      document.getElementById(`${table}-${Object.keys(check.errors)[0]}`)?.focus();
      return;
    }
    startTransition(async () => {
      const res = await saveEntity(table, row?.id ?? null, values);
      if (res.ok) {
        toast.success(row ? `${def.singular} updated` : `${def.singular} created`);
        onDone();
      } else {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error("Could not save", { description: res.error });
      }
    });
  };

  const cancel = () => {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    onDone();
  };

  const placeholders =
    table === "blogs" && values.title ? { slug: slugify(String(values.title)) || "auto-generated" } : undefined;

  return (
    <form onSubmit={submit} noValidate>
      <button type="button" onClick={cancel} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to {def.title.toLowerCase()}
      </button>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        {row ? `Edit ${def.singular.toLowerCase()}` : `New ${def.singular.toLowerCase()}`}
      </h1>

      <div className="card p-5 sm:p-6">
        <FormFields
          fields={def.fields}
          values={values}
          errors={errors}
          onChange={onChange}
          idPrefix={table}
          placeholders={placeholders}
        />
      </div>

      <div className="sticky bottom-0 -mx-4 mt-6 flex justify-end gap-3 border-t border-border bg-background/90 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-b-xl sm:px-0">
        <button type="button" className="btn btn-secondary" onClick={cancel} disabled={pending}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {row ? "Save changes" : `Create ${def.singular.toLowerCase()}`}
        </button>
      </div>
    </form>
  );
}
