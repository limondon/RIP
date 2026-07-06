import { orders } from "@/data/mock-data";
import { calculateOrderPaidAmount, calculateOrderRemainingAmount, formatDate, getBrigadeById, getClientById, getInstallationByOrderId, getMasterById, getOrderById as findCrmOrderById, getPaymentsByOrderId, getProductionByOrderId } from "@/lib/crm-utils";
import { getStoredOrders } from "@/lib/storage";
import type { OrderStatus as CrmOrderStatus, PaymentMethod, PaymentType } from "@/types/crm";

export type OrderStatus = CrmOrderStatus;

export interface MockOrder {
  id: string;
  client: string;
  phone: string;
  product: string;
  material: string;
  status: OrderStatus;
  deadline: string;
  deadlineLabel: string;
  amount: number;
  paid: number;
}

export interface OrderDetails extends MockOrder {
  additionalPhone: string;
  address: string;
  source: string;
  customerComment: string;
  cemetery: string;
  section: string;
  row: string;
  place: string;
  deceased: string;
  color: string;
  shape: string;
  polishing: string;
  steleSize: string;
  baseSize: string;
  flowerBedSize: string;
  portrait: string;
  portraitSize: string;
  inscription: string;
  dates: string;
  epitaph: string;
  decor: string;
  font: string;
  layoutApproval: string;
  productPrice: number;
  decorationPrice: number;
  servicesPrice: number;
  discount: number;
  paymentMethod: string;
  payments: Array<{
    id: string;
    date: string;
    amount: number;
    method: PaymentMethod;
    type: PaymentType;
    comment: string;
  }>;
  master: string;
  masterId: string;
  productionDate: string;
  productionDeadline: string;
  productionStage: string;
  productionStatus: string;
  productionComment: string;
  installationDate: string;
  installationRawDate: string;
  installationTime: string;
  crew: string;
  brigadeId: string;
  installationStatus: string;
  installerComment: string;
}

export const orderStatuses: OrderStatus[] = ["Новый", "Макет", "В производстве", "Готов", "Установка", "Завершен", "Проблема"];

export const statusStyles: Record<OrderStatus, string> = {
  "Новый": "bg-blue-50 text-blue-700 ring-blue-200",
  "Макет": "bg-violet-50 text-violet-700 ring-violet-200",
  "В производстве": "bg-amber-50 text-amber-700 ring-amber-200",
  "Готов": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Установка": "bg-cyan-50 text-cyan-700 ring-cyan-200",
  "Завершен": "bg-slate-100 text-slate-600 ring-slate-200",
  "Проблема": "bg-red-50 text-red-700 ring-red-200",
};

function toMockOrder(orderId: string): MockOrder {
  const order = findCrmOrderById(orderId)!;
  const client = getClientById(order.clientId)!;
  const paid = calculateOrderPaidAmount(order.id);
  return {
    id: order.orderNumber,
    client: client.fullName,
    phone: client.phone,
    product: order.monumentType,
    material: order.material,
    status: order.status,
    deadline: order.deadline,
    deadlineLabel: formatDate(order.deadline).replace(/\sг\.$/, ""),
    amount: order.totalAmount,
    paid,
  };
}

export function getMockOrders(): MockOrder[] {
  return getStoredOrders().map((order) => toMockOrder(order.id));
}

export const mockOrders: MockOrder[] = getMockOrders();

export function getOrderById(id: string): OrderDetails | null {
  const order = findCrmOrderById(id);
  if (!order) return null;

  const base = toMockOrder(order.id);
  const client = getClientById(order.clientId)!;
  const production = getProductionByOrderId(order.id);
  const installation = getInstallationByOrderId(order.id);
  const master = production ? getMasterById(production.masterId) : null;
  const brigade = installation ? getBrigadeById(installation.brigadeId) : null;
  const servicesPrice = order.services.filter((service) => service.selected).reduce((sum, service) => sum + service.price, 0);
  const decorationPrice = order.items.find((item) => item.name === "Портрет")?.total ?? 0;
  const productPrice = Math.max(0, order.totalAmount - servicesPrice - decorationPrice);
  const payments = getPaymentsByOrderId(order.id);

  return {
    ...base,
    additionalPhone: client.additionalPhone,
    address: client.address,
    source: client.source,
    customerComment: client.comment,
    cemetery: order.cemetery,
    section: order.section,
    row: order.row,
    place: order.place,
    deceased: order.deceasedFullName,
    color: order.color,
    shape: order.shape,
    polishing: order.polishing,
    steleSize: order.steleSize,
    baseSize: order.baseSize,
    flowerBedSize: order.flowerBedSize,
    portrait: order.decoration.portrait,
    portraitSize: order.decoration.portraitSize,
    inscription: order.decoration.inscription,
    dates: order.decoration.dates,
    epitaph: order.decoration.epitaph,
    decor: order.decoration.decor,
    font: order.decoration.font,
    layoutApproval: order.decoration.layoutApproval,
    productPrice,
    decorationPrice,
    servicesPrice,
    discount: 0,
    paymentMethod: payments[0]?.method ?? "Наличные",
    payments: payments.map((payment) => ({
      id: payment.id,
      date: payment.date,
      amount: payment.amount,
      method: payment.method,
      type: payment.type,
      comment: payment.comment,
    })),
    master: master?.fullName ?? "Не назначен",
    masterId: production?.masterId ?? "master-005",
    productionDate: production ? formatDate(production.startedAt).replace(/\sг\.$/, "") : "Не передан",
    productionDeadline: production?.plannedReadyAt ?? order.deadline,
    productionStage: production?.stage ?? "Ожидает макет",
    productionStatus: production?.stage === "Готов" ? "Завершено" : production ? "В работе" : "Ожидает запуска",
    productionComment: production?.comment ?? "Комментарий появится после планирования производства.",
    installationDate: installation?.date ? `${formatDate(installation.date).replace(/\sг\.$/, "")}, ${installation.time || "время не назначено"}` : "Не назначена",
    installationRawDate: installation?.date ?? "",
    installationTime: installation?.time ?? "",
    crew: brigade ? `${brigade.name} — ${brigade.members}` : "Не назначена",
    brigadeId: installation?.brigadeId ?? "brigade-001",
    installationStatus: installation?.status ?? "Не назначена",
    installerComment: installation?.comment ?? "Комментарий появится после назначения установки.",
    paid: calculateOrderPaidAmount(order.id),
    amount: order.totalAmount,
  };
}
