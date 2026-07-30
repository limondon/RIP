export interface OrderIdentifier {
  id: string;
  orderNumber: string;
}

export function normalizeOrderReference(value: string) {
  return decodeURIComponent(value).trim().toLocaleLowerCase("ru-RU").replace(/^зк-/, "zk-");
}

export function resolveOrderRecordId(value: string, orders: readonly OrderIdentifier[]) {
  const normalized = normalizeOrderReference(value);
  return orders.find((order) => (
    normalizeOrderReference(order.id) === normalized
    || normalizeOrderReference(order.orderNumber) === normalized
  ))?.id ?? normalized;
}
