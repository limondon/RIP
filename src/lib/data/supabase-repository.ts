import { exportCrmData, type CrmDataSnapshot } from "@/lib/data/repository";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

const tableOrder = [
  "clients",
  "orders",
  "payments",
  "production_tasks",
  "installation_tasks",
  "crm_events",
  "documents",
  "inventory_items",
  "inventory_reservations",
  "inventory_movements",
] as const;

type SupabaseTable = (typeof tableOrder)[number];
type SnapshotKey = keyof CrmDataSnapshot["entities"];

const snapshotKeys: Record<SupabaseTable, SnapshotKey> = {
  clients: "clients",
  orders: "orders",
  payments: "payments",
  production_tasks: "productionTasks",
  installation_tasks: "installationTasks",
  crm_events: "events",
  documents: "documents",
  inventory_items: "inventoryItems",
  inventory_reservations: "inventoryReservations",
  inventory_movements: "inventoryMovements",
};

export function canUseSupabaseData() {
  return Boolean(getBrowserSupabaseClient());
}

export async function uploadLocalSnapshotToSupabase(snapshot = exportCrmData()) {
  const supabase = getBrowserSupabaseClient();
  if (!supabase) return { ok: false as const, error: "Supabase не настроен: добавьте URL и publishable key" };

  for (const table of tableOrder) {
    const rows = snapshot.entities[snapshotKeys[table]];
    if (!rows.length) continue;
    const { error } = await supabase.from(table).upsert(rows as never[], { onConflict: "id" });
    if (error) return { ok: false as const, error: `Ошибка Supabase (${table}): ${error.message}` };
  }

  return { ok: true as const };
}
