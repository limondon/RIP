import { clients } from "@/data/mock-data";
import { calculateOrderPaidAmount, formatDate, getOrderById, getOrdersByClientId, getPaymentsByClientId } from "@/lib/crm-utils";
import { getStoredClients } from "@/lib/storage";
import type { OrderStatus } from "@/lib/order/mock-orders";
import type { PaymentMethod, PaymentType } from "@/types/crm";

export interface ClientOrder {
  id: string;
  date: string;
  product: string;
  status: OrderStatus;
  amount: number;
  paid: number;
}

export interface MockClient {
  id: string;
  name: string;
  phone: string;
  additionalPhone: string;
  address: string;
  source: string;
  comment: string;
  firstContact: string;
  isNewThisMonth: boolean;
  orders: ClientOrder[];
  payments: Array<{
    id: string;
    date: string;
    orderId: string;
    amount: number;
    method: PaymentMethod;
    type: PaymentType;
    comment: string;
  }>;
}

function toClientOrder(clientId: string): ClientOrder[] {
  return getOrdersByClientId(clientId).map((order) => ({
    id: order.orderNumber,
    date: formatDate(order.createdAt).replace(/\sг\.$/, ""),
    product: order.monumentType,
    status: order.status,
    amount: order.totalAmount,
    paid: calculateOrderPaidAmount(order.id),
  }));
}

export function getMockClients(): MockClient[] {
  return getStoredClients().map((client) => ({
  id: client.id,
  name: client.fullName,
  phone: client.phone,
  additionalPhone: client.additionalPhone,
  address: client.address,
  source: client.source,
  comment: client.comment,
  firstContact: formatDate(client.createdAt).replace(/\sг\.$/, ""),
  isNewThisMonth: client.createdAt.startsWith("2026-06"),
  orders: toClientOrder(client.id),
  payments: getPaymentsByClientId(client.id).map((payment) => ({
    id: payment.id,
    date: payment.date,
    orderId: getOrderById(payment.orderId)?.orderNumber ?? payment.orderId,
    amount: payment.amount,
    method: payment.method,
    type: payment.type,
    comment: payment.comment,
  })),
  }));
}

export const mockClients: MockClient[] = getMockClients();

export function getClientTotals(client: MockClient) {
  const amount = client.orders.reduce((sum, order) => sum + order.amount, 0);
  const paid = client.orders.reduce((sum, order) => sum + order.paid, 0);
  return { amount, paid, remaining: Math.max(0, amount - paid) };
}

export function getClientById(id: string): MockClient | null {
  return getMockClients().find((client) => client.id.toLowerCase() === decodeURIComponent(id).toLowerCase()) ?? null;
}
