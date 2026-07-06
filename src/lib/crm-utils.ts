import { brigades, documents, masters } from "@/data/mock-data";
import { getStoredClients, getStoredInstallationTasks, getStoredOrders, getStoredPayments, getStoredProductionTasks } from "@/lib/storage";

const normalize = (id: string) => decodeURIComponent(id).toLowerCase().replace(/^зк-/, "zk-");

export function getClientById(clientId: string) {
  return getStoredClients().find((client) => client.id.toLowerCase() === normalize(clientId)) ?? null;
}

export function getOrderById(orderId: string) {
  const normalized = normalize(orderId);
  return getStoredOrders().find((order) => order.id === normalized || order.orderNumber.toLowerCase() === decodeURIComponent(orderId).toLowerCase()) ?? null;
}

export function getOrdersByClientId(clientId: string) {
  return getStoredOrders().filter((order) => order.clientId === clientId);
}

export function getPaymentsByOrderId(orderId: string) {
  const order = getOrderById(orderId);
  return order ? getStoredPayments().filter((payment) => payment.orderId === order.id) : [];
}

export function getPaymentsByClientId(clientId: string) {
  return getStoredPayments().filter((payment) => payment.clientId === clientId);
}

export function getProductionByOrderId(orderId: string) {
  const order = getOrderById(orderId);
  return order ? getStoredProductionTasks().find((task) => task.orderId === order.id) ?? null : null;
}

export function getInstallationByOrderId(orderId: string) {
  const order = getOrderById(orderId);
  return order ? getStoredInstallationTasks().find((task) => task.orderId === order.id) ?? null : null;
}

export function getDocumentsByOrderId(orderId: string) {
  const order = getOrderById(orderId);
  return order ? documents.filter((document) => document.orderId === order.id) : [];
}

export function calculateOrderPaidAmount(orderId: string) {
  return getPaymentsByOrderId(orderId).reduce((sum, payment) => sum + (payment.type === "Возврат" ? -payment.amount : payment.amount), 0);
}

export function calculateOrderRemainingAmount(orderId: string) {
  const order = getOrderById(orderId);
  return order ? Math.max(0, order.totalAmount - calculateOrderPaidAmount(order.id)) : 0;
}

export function formatCurrency(amount: number) {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ₽`;
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}

export function getMasterById(masterId: string) {
  return masters.find((master) => master.id === masterId) ?? null;
}

export function getBrigadeById(brigadeId: string) {
  return brigades.find((brigade) => brigade.id === brigadeId) ?? null;
}
