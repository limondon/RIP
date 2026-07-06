import { calculateOrderPaidAmount, getClientById, getOrderById } from "@/lib/crm-utils";
import { getStoredOrders, getStoredPayments } from "@/lib/storage";
import type { PaymentMethod, PaymentType } from "@/types/crm";

export type { PaymentMethod, PaymentType };
export type DebtStatus = "Нормально" | "Скоро оплата" | "Просрочено" | "Частично оплачено";

export interface FinancePayment {
  id: string;
  date: string;
  orderId: string;
  clientId: string;
  client: string;
  phone: string;
  amount: number;
  method: PaymentMethod;
  type: PaymentType;
  comment: string;
}

export interface FinanceDebt {
  orderId: string;
  clientId: string;
  client: string;
  phone: string;
  amount: number;
  paid: number;
  dueDate: string;
  overdueDays: number;
  status: DebtStatus;
}

export function getFinancePayments(): FinancePayment[] {
  return getStoredPayments().map((payment) => {
  const order = getOrderById(payment.orderId)!;
  const client = getClientById(payment.clientId)!;
  return {
    ...payment,
    orderId: order.orderNumber,
    client: client.fullName,
    phone: client.phone,
  };
  });
}

export const initialFinancePayments: FinancePayment[] = getFinancePayments();

export function getFinanceDebts(): FinanceDebt[] {
  return getStoredOrders()
  .map((order, index) => ({ order, paid: calculateOrderPaidAmount(order.id), index }))
  .filter(({ order, paid }) => order.totalAmount > paid)
  .slice(0, 8)
  .map(({ order, paid, index }) => {
    const client = getClientById(order.clientId)!;
    const overdueDays = [-4, -1, 0, 2, 5, 7, 0, 3][index % 8];
    const status: DebtStatus = overdueDays > 3 ? "Просрочено" : overdueDays > 0 ? "Скоро оплата" : paid > 0 ? "Частично оплачено" : "Нормально";
    return {
      orderId: order.orderNumber,
      clientId: client.id,
      client: client.fullName,
      phone: client.phone,
      amount: order.totalAmount,
      paid,
      dueDate: `2026-06-${String(18 + index).padStart(2, "0")}`,
      overdueDays,
      status,
    };
  });
}

export const financeDebts: FinanceDebt[] = getFinanceDebts();

export function getFinancePrepayments() {
  return getFinancePayments()
    .filter((payment) => payment.type === "Предоплата" || payment.type === "Доплата")
    .slice(0, 8)
    .map((payment) => {
    const order = getOrderById(payment.orderId)!;
    const paid = calculateOrderPaidAmount(order.id);
    return { ...payment, orderTotal: order.totalAmount, remaining: Math.max(0, order.totalAmount - paid), percent: Math.round((paid / order.totalAmount) * 100) };
  });
}

export const financePrepayments = getFinancePrepayments();

export function calculateFinanceStats(currentPayments: FinancePayment[]) {
  const currentOrders = getStoredOrders();
  const currentDebts = getFinanceDebts();
  const totalOrdersAmount = currentOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const paid = currentPayments.reduce((sum, payment) => sum + (payment.type === "Возврат" ? -payment.amount : payment.amount), 0);
  const remaining = currentOrders.reduce((sum, order) => sum + Math.max(0, order.totalAmount - calculateOrderPaidAmount(order.id)), 0);
  const overdue = currentDebts.filter((debt) => debt.status === "Просрочено").reduce((sum, debt) => sum + Math.max(0, debt.amount - debt.paid), 0);
  return {
    totalOrdersAmount,
    paid,
    remaining,
    overdue,
    averageCheck: currentOrders.length ? Math.round(totalOrdersAmount / currentOrders.length) : 0,
    fullPaid: currentOrders.filter((order) => calculateOrderPaidAmount(order.id) >= order.totalAmount).length,
    partialPaid: currentOrders.filter((order) => calculateOrderPaidAmount(order.id) > 0 && calculateOrderPaidAmount(order.id) < order.totalAmount).length,
    noPaid: currentOrders.filter((order) => calculateOrderPaidAmount(order.id) === 0).length,
    clientsTotalAmount: totalOrdersAmount,
  };
}
