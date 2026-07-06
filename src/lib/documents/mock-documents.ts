import { clients, documents, orders, payments } from "@/data/mock-data";
import { calculateOrderPaidAmount, getClientById, getOrderById } from "@/lib/crm-utils";
import { getStoredDocuments } from "@/lib/storage";
import type { DocumentStatus, DocumentType } from "@/types/crm";

export type { DocumentStatus, DocumentType };

export interface CrmDocument {
  id: string;
  type: DocumentType;
  orderId: string;
  clientId: string;
  client: string;
  phone: string;
  createdAt: string;
  amount: number;
  status: DocumentStatus;
  comment: string;
}

export const documentTypes: DocumentType[] = ["Наряд-заказ", "Договор", "Квитанция", "Акт выполненных работ"];
export const documentStatuses: DocumentStatus[] = ["Черновик", "Сформирован", "Отправлен клиенту", "Подписан", "Архив"];

export const documentStatusStyles: Record<DocumentStatus, string> = {
  "Черновик": "bg-slate-100 text-slate-600 ring-slate-200",
  "Сформирован": "bg-blue-50 text-blue-700 ring-blue-200",
  "Отправлен клиенту": "bg-cyan-50 text-cyan-700 ring-cyan-200",
  "Подписан": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Архив": "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

function toCrmDocument(document: (typeof documents)[number]): CrmDocument {
  const order = getOrderById(document.orderId)!;
  const client = getClientById(document.clientId)!;
  return {
    id: document.number,
    type: document.type,
    orderId: order.orderNumber,
    clientId: client.id,
    client: client.fullName,
    phone: client.phone,
    createdAt: document.date,
    amount: document.amount,
    status: document.status,
    comment: document.comment ?? "",
  };
}

export function getMockDocuments(): CrmDocument[] {
  return getStoredDocuments().map(toCrmDocument);
}

export const mockDocuments: CrmDocument[] = documents.map(toCrmDocument);

export const documentTemplates = [
  { type: "Наряд-заказ" as DocumentType, title: "Наряд-заказ", description: "Производственное задание для цеха и монтажной бригады." },
  { type: "Договор" as DocumentType, title: "Договор", description: "Договор на изготовление и установку памятника." },
  { type: "Квитанция" as DocumentType, title: "Квитанция", description: "Подтверждение оплаты или предоплаты по заказу." },
  { type: "Акт выполненных работ" as DocumentType, title: "Акт выполненных работ", description: "Подтверждение выполненных работ и установки." },
];

export function createDocumentDraft(type: DocumentType, orderId: string, clientId: string, createdAt: string, comment: string): CrmDocument {
  const order = getOrderById(orderId) ?? orders[0];
  const client = getClientById(clientId) ?? clients.find((item) => item.id === order.clientId)!;
  return {
    id: `DOC-${Date.now()}`,
    type,
    orderId: "orderNumber" in order ? order.orderNumber : orders[0].orderNumber,
    clientId: client.id,
    client: client.fullName,
    phone: client.phone,
    createdAt,
    amount: type === "Квитанция" ? Math.min(calculateOrderPaidAmount(order.id), order.totalAmount) : order.totalAmount,
    status: "Сформирован",
    comment,
  };
}

export function getDocumentContext(document: CrmDocument) {
  const order = getOrderById(document.orderId) ?? orders[0];
  const client = getClientById(document.clientId) ?? clients.find((item) => item.id === order.clientId)!;
  const payment = payments.find((item) => item.orderId === order.id);
  const paid = calculateOrderPaidAmount(order.id);
  return {
    order: {
      id: order.orderNumber,
      amount: order.totalAmount,
      paid,
      deceased: order.deceasedFullName,
      cemetery: order.cemetery,
      section: order.section,
      row: order.row,
      place: order.place,
      product: order.monumentType,
      material: order.material,
      color: order.color,
      shape: order.shape,
      steleSize: order.steleSize,
      baseSize: order.baseSize,
      flowerBedSize: order.flowerBedSize,
      portrait: order.decoration.portrait,
      portraitSize: order.decoration.portraitSize,
      epitaph: order.decoration.epitaph,
      decor: order.decoration.decor,
      installationDate: order.deadline,
      deadlineLabel: new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date(`${order.deadline}T00:00:00`)),
    },
    client: {
      id: client.id,
      name: client.fullName,
      phone: client.phone,
      address: client.address,
    },
    payment,
  };
}
