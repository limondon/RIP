import type { OrderFormData, OrderItem, ServiceItem } from "@/types/order";

export interface OrderTotals {
  serviceTotal: number;
  total: number;
  paid: number;
  remaining: number;
}

export function toNonNegativeNumber(value: string | number): number {
  return Math.max(0, Number(value) || 0);
}

export function calculateServiceTotal(services: ServiceItem[]): number {
  return services.reduce((sum, service) => sum + (service.selected ? toNonNegativeNumber(service.price) : 0), 0);
}

export function calculateItemTotal(quantity: number, price: number): number {
  return toNonNegativeNumber(quantity) * toNonNegativeNumber(price);
}

export function calculateOrderTotals(order: OrderFormData): OrderTotals {
  const serviceTotal = calculateServiceTotal(order.services);
  const total = Math.max(
    0,
    toNonNegativeNumber(order.payment.productPrice) +
      toNonNegativeNumber(order.payment.decorationPrice) +
      serviceTotal -
      toNonNegativeNumber(order.payment.discount),
  );
  const paid = toNonNegativeNumber(order.payment.prepayment);

  return { serviceTotal, total, paid, remaining: Math.max(0, total - paid) };
}

export function updateOrderItem(item: OrderItem, values: Partial<OrderItem>): OrderItem {
  const next = { ...item, ...values };
  return { ...next, total: calculateItemTotal(next.quantity, next.price) };
}
