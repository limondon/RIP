import { importCrmData } from "@/lib/data/repository";
import type { CrmCloudRow } from "@/lib/data/cloud-sync-events";
import {
  applySupabaseMutation,
  downloadSupabaseSnapshot,
} from "@/lib/data/supabase-repository";
import {
  addStoredPaymentForOrder,
  cancelStoredInventoryReservation,
  getStoredOrders,
  receiveStoredInventoryItem,
  reserveStoredInventoryForOrder,
  writeOffStoredInventoryReservation,
} from "@/lib/storage";
import { resolveOrderRecordId } from "@/lib/order/identifiers";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Client, Order, PaymentMethod, PaymentType } from "@/types/crm";

export function createOperationId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function shouldUseLocalCriticalFallback(hasSupabaseClient: boolean) {
  return !hasSupabaseClient;
}

async function refreshLocalSnapshotFromCloud() {
  const snapshot = await downloadSupabaseSnapshot();
  if (!snapshot.ok) {
    console.error("Не удалось обновить локальные данные из Supabase", snapshot.error);
    return;
  }
  importCrmData(snapshot.snapshot, { notifyCloud: false });
}

export async function executeServerOperation<T>(
  execute: () => Promise<T>,
  reconcile: () => Promise<void>,
) {
  const result = await execute();
  await reconcile();
  return result;
}

async function callTransaction<T>(
  functionName:
    | "add_order_payment"
    | "receive_inventory"
    | "reserve_inventory_for_order"
    | "write_off_inventory_reservation"
    | "cancel_inventory_reservation",
  args: Record<string, string | number>,
  localFallback: () => T,
): Promise<T | { ok: false; error: string }> {
  const supabase = getBrowserSupabaseClient();
  if (shouldUseLocalCriticalFallback(Boolean(supabase))) return localFallback();
  if (!supabase) return localFallback();

  const { data, error } = await executeServerOperation(
    async () => {
      const response = await supabase.rpc(functionName, args as never);
      return response as {
        data: unknown;
        error: { code?: string; message: string } | null;
      };
    },
    refreshLocalSnapshotFromCloud,
  );
  if (error) {
    const missingFunction = error.code === "PGRST202" || /function .* does not exist/i.test(error.message);
    return {
      ok: false,
      error: missingFunction
        ? "Серверные операции еще не установлены в Supabase. Примените SQL-миграцию."
        : error.message,
    };
  }

  if (!data || typeof data !== "object") {
    return { ok: false, error: "Supabase вернул некорректный результат операции" };
  }
  return data as T;
}

export async function addOrderPaymentTransaction(input: {
  operationId: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  type: PaymentType;
  date: string;
  comment?: string;
}) {
  const orderId = resolveOrderRecordId(input.orderId, getStoredOrders());
  return callTransaction(
    "add_order_payment",
    {
      p_operation_id: input.operationId,
      p_order_id: orderId,
      p_amount: input.amount,
      p_method: input.method,
      p_type: input.type,
      p_date: input.date,
      p_comment: input.comment ?? "",
    },
    () => addStoredPaymentForOrder({ ...input, orderId }),
  );
}

export async function receiveInventoryTransaction(input: {
  operationId: string;
  itemId: string;
  quantity: number;
  comment?: string;
}) {
  return callTransaction(
    "receive_inventory",
    {
      p_operation_id: input.operationId,
      p_item_id: input.itemId,
      p_quantity: input.quantity,
      p_comment: input.comment ?? "",
    },
    () => receiveStoredInventoryItem(input.itemId, input.quantity, input.comment),
  );
}

export async function reserveInventoryTransaction(input: {
  operationId: string;
  itemId: string;
  orderId: string;
  quantity: number;
  comment?: string;
}) {
  const orderId = resolveOrderRecordId(input.orderId, getStoredOrders());
  return callTransaction(
    "reserve_inventory_for_order",
    {
      p_operation_id: input.operationId,
      p_item_id: input.itemId,
      p_order_id: orderId,
      p_quantity: input.quantity,
      p_comment: input.comment ?? "",
    },
    () => reserveStoredInventoryForOrder({ ...input, orderId }),
  );
}

export async function writeOffInventoryReservationTransaction(input: {
  operationId: string;
  reservationId: string;
  comment?: string;
}) {
  return callTransaction(
    "write_off_inventory_reservation",
    {
      p_operation_id: input.operationId,
      p_reservation_id: input.reservationId,
      p_comment: input.comment ?? "",
    },
    () => writeOffStoredInventoryReservation(input.reservationId, input.comment),
  );
}

export async function cancelInventoryReservationTransaction(input: {
  operationId: string;
  reservationId: string;
  comment?: string;
}) {
  return callTransaction(
    "cancel_inventory_reservation",
    {
      p_operation_id: input.operationId,
      p_reservation_id: input.reservationId,
      p_comment: input.comment ?? "",
    },
    () => cancelStoredInventoryReservation(input.reservationId, input.comment),
  );
}

export async function ensureCloudOrderForPayment(order: Order, client: Client) {
  if (shouldUseLocalCriticalFallback(Boolean(getBrowserSupabaseClient()))) return { ok: true as const };

  const clientResult = await applySupabaseMutation({
    table: "clients",
    upserts: [client as unknown as CrmCloudRow],
    deletes: [],
  });
  if (!clientResult.ok) return clientResult;

  return applySupabaseMutation({
    table: "orders",
    upserts: [order as unknown as CrmCloudRow],
    deletes: [],
  });
}
