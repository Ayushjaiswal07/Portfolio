import { notFound } from "next/navigation";
import { CrudManager } from "@/components/admin/crud-manager";
import { ENTITIES, isContentTable, type Row } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";

export default async function AdminEntityPage({ params }: PageProps<"/admin/[entity]">) {
  const { entity } = await params;
  if (!isContentTable(entity)) notFound();

  const supabase = await createClient();
  let query = supabase.from(entity).select("*");
  query = ENTITIES[entity].orderable
    ? query.order("sort_order", { ascending: true }).order("created_at", { ascending: true })
    : query.order("created_at", { ascending: false });
  const { data, error } = await query;

  if (error) {
    return <p className="text-danger">Could not load {entity}: {error.message}</p>;
  }

  return <CrudManager key={entity} table={entity} initialRows={(data ?? []) as Row[]} />;
}
