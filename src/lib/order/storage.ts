import type { OrderFormData } from "@/types/order";
import { calculateOrderTotals } from "./calculations";

export const DRAFT_STORAGE_KEY = "pamyat-order-draft";
export const LAST_ORDER_STORAGE_KEY = "pamyat-last-order";

export function createOrderSnapshot(order: OrderFormData, status: OrderFormData["status"]): OrderFormData {
  const totals = calculateOrderTotals(order);
  return {
    ...order,
    status,
    product: { ...order.product, sketchFile: null },
    files: {},
    payment: { ...order.payment, total: totals.total, paid: totals.paid, remaining: totals.remaining },
    createdAt: new Date().toISOString(),
  };
}

export function saveOrderLocally(key: string, order: OrderFormData): void {
  window.localStorage.setItem(key, JSON.stringify(order));
}
