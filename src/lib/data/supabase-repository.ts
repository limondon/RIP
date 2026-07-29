import type { CrmDataSnapshot } from "@/lib/data/repository";
import { crmCloudTables, type CrmCloudMutation, type CrmCloudRow, type CrmCloudTable } from "@/lib/data/cloud-sync-events";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

type SnapshotKey = keyof CrmDataSnapshot["entities"];

const tablesWithCreatedAt = new Set<CrmCloudTable>(["clients", "orders", "payments", "documents", "inventory_items"]);
const tablesWithUpdatedAt = new Set<CrmCloudTable>(["clients", "orders", "inventory_items"]);

const snapshotKeys: Record<CrmCloudTable, SnapshotKey> = {
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

export function isCloudSyncEnabled() {
  return typeof window !== "undefined" && window.localStorage.getItem("pamyat-cloud-sync-enabled") === "true";
}

export function enableCloudSync() {
  if (typeof window !== "undefined") window.localStorage.setItem("pamyat-cloud-sync-enabled", "true");
}

function prepareRowsForTable(table: CrmCloudTable, rows: CrmCloudRow[]) {
  const timestamp = new Date().toISOString();
  return rows.map((record) => ({
    ...record,
    ...(tablesWithCreatedAt.has(table) ? { created_at: record.created_at || timestamp } : {}),
    ...(tablesWithUpdatedAt.has(table) ? { updated_at: timestamp } : {}),
  }));
}

function normalizePaymentTotals(snapshot: CrmDataSnapshot) {
  const paidByOrder = new Map<string, number>();
  for (const payment of snapshot.entities.payments) {
    const signedAmount = payment.type === "Возврат" ? -payment.amount : payment.amount;
    paidByOrder.set(payment.orderId, (paidByOrder.get(payment.orderId) ?? 0) + signedAmount);
  }
  snapshot.entities.orders = snapshot.entities.orders.map((order) => {
    const paidAmount = Math.max(0, paidByOrder.get(order.id) ?? 0);
    return { ...order, paidAmount, remainingAmount: Math.max(0, order.totalAmount - paidAmount) };
  });
  return snapshot;
}

export async function downloadSupabaseSnapshot() {
  const supabase = getBrowserSupabaseClient();
  if (!supabase) return { ok: false as const, error: "Supabase не настроен" };

  const entities = {} as CrmDataSnapshot["entities"];
  const results: Array<{ table: CrmCloudTable; data: unknown[] | null; error: { message: string } | null }> = await Promise.all(crmCloudTables.map(async (table) => {
    const { data, error } = await (supabase.from(table) as any).select("*");
    return { table, data, error };
  }));
  for (const { table, data, error } of results) {
    if (error) return { ok: false as const, error: `Ошибка Supabase (${table}): ${error.message}` };
    entities[snapshotKeys[table]] = (data ?? []) as never;
  }

  const snapshot = normalizePaymentTotals({ schemaVersion: 1 as const, exportedAt: new Date().toISOString(), entities });
  return { ok: true as const, snapshot };
}

export async function applySupabaseMutation(mutation: CrmCloudMutation) {
  const supabase = getBrowserSupabaseClient();
  if (!supabase) return { ok: false as const, error: "Supabase не настроен" };

  if (mutation.upserts.length) {
    const rows = prepareRowsForTable(mutation.table, mutation.upserts);
    const { error } = await (supabase.from(mutation.table) as any).upsert(rows, { onConflict: "id" });
    if (error) return { ok: false as const, error: `Ошибка Supabase (${mutation.table}): ${error.message}` };
  }

  if (mutation.deletes.length) {
    const { error } = await (supabase.from(mutation.table) as any).delete().in("id", mutation.deletes);
    if (error) return { ok: false as const, error: `Ошибка Supabase (${mutation.table}): ${error.message}` };
  }

  return { ok: true as const };
}
