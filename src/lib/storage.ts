import { clients, documents, installationTasks, inventoryItems, orders, payments, productionTasks } from "@/data/mock-data";
import { brigades } from "@/data/mock-data";
import type { Client, CrmEvent, CrmEventType, Document, DocumentType, InstallationTask, InventoryItem, InventoryMovement, InventoryMovementType, InventoryReservation, Order, OrderStatus, Payment, PaymentMethod, PaymentType, ProductionStage, ProductionTask } from "@/types/crm";

const ORDERS_KEY = "pamyat-crm-orders";
const CLIENTS_KEY = "pamyat-crm-clients";
const PAYMENTS_KEY = "pamyat-crm-payments";
const PRODUCTION_KEY = "pamyat-crm-production";
const INSTALLATION_KEY = "pamyat-crm-installation";
const EVENTS_KEY = "pamyat-crm-events";
const DOCUMENTS_KEY = "pamyat-crm-documents";
const INVENTORY_KEY = "pamyat-crm-inventory";
const INVENTORY_RESERVATIONS_KEY = "pamyat-crm-inventory-reservations";
const INVENTORY_MOVEMENTS_KEY = "pamyat-crm-inventory-movements";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function read<T>(key: string, fallback: T[]): T[] {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T[] : fallback;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
}

function write<T>(key: string, value: T[]) {
  if (canUseStorage()) window.localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredOrders() { return read<Order>(ORDERS_KEY, orders); }
export function saveStoredOrders(value: Order[]) { write(ORDERS_KEY, value); }
export function addStoredOrder(order: Order) { saveStoredOrders([order, ...getStoredOrders()]); }

export function getStoredClients() { return read<Client>(CLIENTS_KEY, clients); }
export function saveStoredClients(value: Client[]) { write(CLIENTS_KEY, value); }
export function addStoredClient(client: Client) { saveStoredClients([client, ...getStoredClients()]); }

export function getStoredPayments() { return read<Payment>(PAYMENTS_KEY, payments); }
export function saveStoredPayments(value: Payment[]) { write(PAYMENTS_KEY, value); }
export function addStoredPayment(payment: Payment) { saveStoredPayments([payment, ...getStoredPayments()]); }

export function getStoredProductionTasks() { return read<ProductionTask>(PRODUCTION_KEY, productionTasks); }
export function saveStoredProductionTasks(value: ProductionTask[]) { write(PRODUCTION_KEY, value); }
export function addStoredProductionTask(task: ProductionTask) { saveStoredProductionTasks([task, ...getStoredProductionTasks()]); }

export function getStoredInstallationTasks() { return read<InstallationTask>(INSTALLATION_KEY, installationTasks); }
export function saveStoredInstallationTasks(value: InstallationTask[]) { write(INSTALLATION_KEY, value); }
export function addStoredInstallationTask(task: InstallationTask) { saveStoredInstallationTasks([task, ...getStoredInstallationTasks()]); }

export function getStoredEvents() { return read<CrmEvent>(EVENTS_KEY, []); }
export function saveStoredEvents(value: CrmEvent[]) { write(EVENTS_KEY, value); }

export function getStoredDocuments() { return read<Document>(DOCUMENTS_KEY, documents); }
export function saveStoredDocuments(value: Document[]) { write(DOCUMENTS_KEY, value); }

export function getStoredInventoryItems() { return read<InventoryItem>(INVENTORY_KEY, inventoryItems); }
export function saveStoredInventoryItems(value: InventoryItem[]) { write(INVENTORY_KEY, value); }
export function getStoredInventoryReservations() { return read<InventoryReservation>(INVENTORY_RESERVATIONS_KEY, []); }
export function saveStoredInventoryReservations(value: InventoryReservation[]) { write(INVENTORY_RESERVATIONS_KEY, value); }
export function getStoredInventoryMovements() { return read<InventoryMovement>(INVENTORY_MOVEMENTS_KEY, []); }
export function saveStoredInventoryMovements(value: InventoryMovement[]) { write(INVENTORY_MOVEMENTS_KEY, value); }

export function recordCrmEvent(input: {
  orderId: string;
  clientId?: string;
  type: CrmEventType;
  title: string;
  detail: string;
  actor?: string;
}) {
  const orderId = findOrderId(input.orderId);
  const event: CrmEvent = {
    id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    orderId,
    clientId: input.clientId,
    type: input.type,
    title: input.title,
    detail: input.detail,
    actor: input.actor ?? "Тимофеев И.",
    createdAt: new Date().toISOString(),
  };
  saveStoredEvents([event, ...getStoredEvents()]);
  return event;
}

export function getStoredEventsByOrderId(orderId: string) {
  const normalized = findOrderId(orderId);
  return getStoredEvents()
    .filter((event) => event.orderId === normalized)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

export function getStoredDocumentsByOrderId(orderId: string) {
  const normalized = findOrderId(orderId);
  return getStoredDocuments()
    .filter((document) => document.orderId === normalized)
    .sort((first, second) => second.date.localeCompare(first.date) || second.number.localeCompare(first.number));
}

const normalizeOrderId = (value: string) => decodeURIComponent(value).toLowerCase().replace(/^зк-/, "zk-");

function findOrderId(value: string) {
  const normalized = normalizeOrderId(value);
  return getStoredOrders().find((order) => order.id === normalized || order.orderNumber.toLowerCase() === decodeURIComponent(value).toLowerCase())?.id ?? normalized;
}

export function updateStoredOrderStatus(orderId: string, status: OrderStatus) {
  const normalized = findOrderId(orderId);
  const order = getStoredOrders().find((item) => item.id === normalized);
  const previousStatus = order?.status;
  saveStoredOrders(getStoredOrders().map((item) => item.id === normalized ? { ...item, status } : item));
  if (order && previousStatus !== status) {
    recordCrmEvent({
      orderId: normalized,
      clientId: order.clientId,
      type: "order",
      title: "Статус заказа изменен",
      detail: `${previousStatus} → ${status}`,
    });
  }
}

function calculateStoredPaidAmount(orderId: string) {
  return getStoredPayments()
    .filter((payment) => payment.orderId === orderId)
    .reduce((sum, payment) => sum + (payment.type === "Возврат" ? -payment.amount : payment.amount), 0);
}

function syncStoredOrderPaymentTotals(orderId: string) {
  const paidAmount = calculateStoredPaidAmount(orderId);
  saveStoredOrders(getStoredOrders().map((order) => order.id === orderId ? {
    ...order,
    paidAmount,
    remainingAmount: Math.max(0, order.totalAmount - paidAmount),
  } : order));
}

export function addStoredPaymentForOrder(input: {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  type: PaymentType;
  date: string;
  comment?: string;
}): { ok: true; payment: Payment; order: Order; paidAmount: number; remainingAmount: number } | { ok: false; error: string } {
  const normalizedOrderId = findOrderId(input.orderId);
  const order = getStoredOrders().find((item) => item.id === normalizedOrderId);
  if (!order) return { ok: false, error: "Заказ не найден" };

  const currentPaid = calculateStoredPaidAmount(order.id);
  const currentRemaining = Math.max(0, order.totalAmount - currentPaid);
  const amount = input.type === "Полная оплата" ? currentRemaining : Math.max(0, Number(input.amount) || 0);

  if (amount <= 0) return { ok: false, error: input.type === "Полная оплата" ? "Заказ уже полностью оплачен" : "Сумма платежа должна быть больше 0" };
  if (input.type === "Возврат" && amount > currentPaid) return { ok: false, error: "Возврат не может быть больше оплаченной суммы" };

  const payment: Payment = {
    id: `pay-${Date.now()}`,
    orderId: order.id,
    clientId: order.clientId,
    date: input.date || new Date().toISOString().slice(0, 10),
    amount,
    method: input.method,
    type: input.type,
    comment: input.comment?.trim() || (input.type === "Возврат" ? "Возврат по заказу" : input.type === "Полная оплата" ? "Полная оплата заказа" : "Платеж по заказу"),
  };

  addStoredPayment(payment);
  syncStoredOrderPaymentTotals(order.id);
  recordCrmEvent({
    orderId: order.id,
    clientId: order.clientId,
    type: "payment",
    title: input.type === "Возврат" ? "Оформлен возврат" : "Добавлен платеж",
    detail: `${input.type}: ${new Intl.NumberFormat("ru-RU").format(amount)} ₽, ${input.method}`,
  });

  const paidAmount = calculateStoredPaidAmount(order.id);
  return {
    ok: true,
    payment,
    order: { ...order, paidAmount, remainingAmount: Math.max(0, order.totalAmount - paidAmount) },
    paidAmount,
    remainingAmount: Math.max(0, order.totalAmount - paidAmount),
  };
}

function generateDocumentNumber(type: DocumentType, existingDocuments = getStoredDocuments()) {
  const prefixes: Record<DocumentType, string> = {
    "Наряд-заказ": "NZ",
    "Договор": "DOG",
    "Квитанция": "KV",
    "Акт выполненных работ": "AKT",
  };
  const year = new Date().getFullYear();
  const prefix = `${prefixes[type]}-${year}`;
  const max = existingDocuments.reduce((highest, document) => {
    const match = document.number.match(new RegExp(`^${prefix}-(\\d+)$`));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

export function addStoredDocumentForOrder(input: {
  orderId: string;
  type: DocumentType;
  date?: string;
  comment?: string;
}): { ok: true; document: Document } | { ok: false; error: string } {
  const orderId = findOrderId(input.orderId);
  const order = getStoredOrders().find((item) => item.id === orderId);
  if (!order) return { ok: false, error: "Заказ не найден" };

  const amount = input.type === "Квитанция"
    ? Math.min(calculateStoredPaidAmount(order.id), order.totalAmount)
    : order.totalAmount;
  const document: Document = {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    orderId: order.id,
    clientId: order.clientId,
    type: input.type,
    number: generateDocumentNumber(input.type),
    date: input.date || new Date().toISOString().slice(0, 10),
    status: "Сформирован",
    amount,
    comment: input.comment?.trim() || `Сформирован документ: ${input.type}`,
  };
  saveStoredDocuments([document, ...getStoredDocuments()]);
  recordCrmEvent({
    orderId: order.id,
    clientId: order.clientId,
    type: "document",
    title: "Документ сформирован",
    detail: `${document.type}: ${document.number}`,
  });
  return { ok: true, document };
}

export function updateStoredProductionTask(orderId: string, values: Partial<Pick<ProductionTask, "stage" | "masterId" | "plannedReadyAt" | "comment">>) {
  const normalized = findOrderId(orderId);
  const tasks = getStoredProductionTasks();
  const current = tasks.find((task) => task.orderId === normalized);
  const order = getStoredOrders().find((item) => item.id === normalized);
  if (current) {
    saveStoredProductionTasks(tasks.map((task) => task.orderId === normalized ? { ...task, ...values } : task));
    if (order) {
      const changes = [
        values.stage && values.stage !== current.stage ? `этап: ${current.stage} → ${values.stage}` : "",
        values.masterId && values.masterId !== current.masterId ? "мастер обновлен" : "",
        values.plannedReadyAt && values.plannedReadyAt !== current.plannedReadyAt ? `готовность: ${current.plannedReadyAt || "не назначена"} → ${values.plannedReadyAt}` : "",
        values.comment && values.comment !== current.comment ? "комментарий обновлен" : "",
      ].filter(Boolean);
      if (changes.length) {
        recordCrmEvent({
          orderId: normalized,
          clientId: order.clientId,
          type: "production",
          title: values.stage && values.stage !== current.stage ? "Этап производства изменен" : "Производство обновлено",
          detail: changes.join(", "),
        });
      }
    }
    return;
  }

  if (!order) return;
  addStoredProductionTask({
    id: `prod-${Date.now()}`,
    orderId: normalized,
    stage: values.stage ?? "Ожидает макет",
    masterId: values.masterId ?? "master-005",
    startedAt: order.createdAt,
    plannedReadyAt: values.plannedReadyAt ?? order.deadline,
    comment: values.comment ?? "Создано автоматически при планировании производства",
  });
  recordCrmEvent({
    orderId: normalized,
    clientId: order.clientId,
    type: "production",
    title: "Создана задача производства",
    detail: `Этап: ${values.stage ?? "Ожидает макет"}`,
  });
}

export function updateStoredProductionStage(orderId: string, stage: ProductionStage) {
  updateStoredProductionTask(orderId, { stage });
}

function brigadeIdFromLabel(label: string) {
  return brigades.find((brigade) => `${brigade.name} — ${brigade.members}` === label || brigade.name === label)?.id ?? "brigade-001";
}

export function updateStoredInstallationTask(orderOrTaskId: string, values: Partial<Pick<InstallationTask, "date" | "time" | "status" | "comment">> & { crew?: string; brigadeId?: string }) {
  const normalizedOrderId = findOrderId(orderOrTaskId);
  const tasks = getStoredInstallationTasks();
  const current = tasks.find((task) => task.id === orderOrTaskId || task.orderId === normalizedOrderId);
  const nextValues: Partial<InstallationTask> = {
    ...values,
    brigadeId: values.brigadeId ?? (values.crew ? brigadeIdFromLabel(values.crew) : undefined),
  };
  delete (nextValues as { crew?: string }).crew;

  if (current) {
    saveStoredInstallationTasks(tasks.map((task) => task.id === current.id ? { ...task, ...nextValues } : task));
    const order = getStoredOrders().find((item) => item.id === current.orderId);
    if (order) {
      const changes = [
        nextValues.status && nextValues.status !== current.status ? `статус: ${current.status} → ${nextValues.status}` : "",
        nextValues.date && nextValues.date !== current.date ? `дата: ${current.date || "не назначена"} → ${nextValues.date}` : "",
        nextValues.time && nextValues.time !== current.time ? `время: ${current.time || "не назначено"} → ${nextValues.time}` : "",
        nextValues.brigadeId && nextValues.brigadeId !== current.brigadeId ? "бригада обновлена" : "",
      ].filter(Boolean);
      if (changes.length) {
        recordCrmEvent({
          orderId: current.orderId,
          clientId: order.clientId,
          type: "installation",
          title: "Установка обновлена",
          detail: changes.join(", "),
        });
      }
    }
    return;
  }

  const order = getStoredOrders().find((item) => item.id === normalizedOrderId);
  if (!order) return;
  addStoredInstallationTask({
    id: `install-${Date.now()}`,
    orderId: normalizedOrderId,
    brigadeId: nextValues.brigadeId ?? "brigade-001",
    date: nextValues.date ?? "",
    time: nextValues.time ?? "",
    status: nextValues.status ?? "Не назначена",
    comment: nextValues.comment ?? "Установка будет назначена после готовности изделия",
  });
  recordCrmEvent({
    orderId: normalizedOrderId,
    clientId: order.clientId,
    type: "installation",
    title: "Создана задача установки",
    detail: nextValues.status ? `Статус: ${nextValues.status}` : "Установка будет назначена после готовности изделия",
  });
}

function activeReservedQuantity(itemId: string, excludeReservationId?: string) {
  return getStoredInventoryReservations()
    .filter((reservation) => reservation.itemId === itemId && reservation.status === "Активен" && reservation.id !== excludeReservationId)
    .reduce((sum, reservation) => sum + reservation.quantity, 0);
}

export function getStoredInventoryAvailable(itemId: string, excludeReservationId?: string) {
  const item = getStoredInventoryItems().find((row) => row.id === itemId);
  return Math.max(0, (item?.onHand ?? 0) - activeReservedQuantity(itemId, excludeReservationId));
}

function addInventoryMovement(input: {
  itemId: string;
  orderId?: string;
  type: InventoryMovementType;
  quantity: number;
  comment?: string;
}) {
  const movement: InventoryMovement = {
    id: `move-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemId: input.itemId,
    orderId: input.orderId ? findOrderId(input.orderId) : undefined,
    type: input.type,
    quantity: input.quantity,
    comment: input.comment?.trim() || input.type,
    createdAt: new Date().toISOString(),
  };
  saveStoredInventoryMovements([movement, ...getStoredInventoryMovements()]);
  return movement;
}

export function receiveStoredInventoryItem(itemId: string, quantity: number, comment?: string) {
  const amount = Math.max(0, Number(quantity) || 0);
  if (amount <= 0) return { ok: false as const, error: "Количество должно быть больше 0" };
  const item = getStoredInventoryItems().find((row) => row.id === itemId);
  if (!item) return { ok: false as const, error: "Материал не найден" };
  saveStoredInventoryItems(getStoredInventoryItems().map((row) => row.id === itemId ? { ...row, onHand: row.onHand + amount } : row));
  addInventoryMovement({ itemId, type: "Поступление", quantity: amount, comment });
  return { ok: true as const };
}

export function reserveStoredInventoryForOrder(input: { itemId: string; orderId: string; quantity: number; comment?: string }) {
  const amount = Math.max(0, Number(input.quantity) || 0);
  if (amount <= 0) return { ok: false as const, error: "Количество должно быть больше 0" };
  const item = getStoredInventoryItems().find((row) => row.id === input.itemId);
  if (!item) return { ok: false as const, error: "Материал не найден" };
  const orderId = findOrderId(input.orderId);
  const order = getStoredOrders().find((row) => row.id === orderId);
  if (!order) return { ok: false as const, error: "Заказ не найден" };
  const available = getStoredInventoryAvailable(item.id);
  if (amount > available) return { ok: false as const, error: `Доступно только ${available} ${item.unit}` };

  const reservation: InventoryReservation = {
    id: `reserve-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    orderId,
    itemId: item.id,
    quantity: amount,
    status: "Активен",
    comment: input.comment?.trim() || "Резерв под заказ",
    createdAt: new Date().toISOString(),
  };
  saveStoredInventoryReservations([reservation, ...getStoredInventoryReservations()]);
  addInventoryMovement({ itemId: item.id, orderId, type: "Резерв", quantity: amount, comment: reservation.comment });
  recordCrmEvent({
    orderId,
    clientId: order.clientId,
    type: "inventory",
    title: "Материал зарезервирован",
    detail: `${item.name}: ${amount} ${item.unit}`,
  });
  return { ok: true as const, reservation };
}

export function writeOffStoredInventoryReservation(reservationId: string, comment?: string) {
  const reservation = getStoredInventoryReservations().find((row) => row.id === reservationId);
  if (!reservation) return { ok: false as const, error: "Резерв не найден" };
  if (reservation.status !== "Активен") return { ok: false as const, error: "Резерв уже закрыт" };
  const item = getStoredInventoryItems().find((row) => row.id === reservation.itemId);
  if (!item) return { ok: false as const, error: "Материал не найден" };
  if (reservation.quantity > item.onHand) return { ok: false as const, error: "На складе недостаточно материала для списания" };
  saveStoredInventoryItems(getStoredInventoryItems().map((row) => row.id === item.id ? { ...row, onHand: row.onHand - reservation.quantity } : row));
  saveStoredInventoryReservations(getStoredInventoryReservations().map((row) => row.id === reservationId ? { ...row, status: "Списан", comment: comment?.trim() || row.comment } : row));
  addInventoryMovement({ itemId: item.id, orderId: reservation.orderId, type: "Списание", quantity: reservation.quantity, comment: comment || reservation.comment });
  const order = getStoredOrders().find((row) => row.id === reservation.orderId);
  if (order) {
    recordCrmEvent({
      orderId: order.id,
      clientId: order.clientId,
      type: "inventory",
      title: "Материал списан со склада",
      detail: `${item.name}: ${reservation.quantity} ${item.unit}`,
    });
  }
  return { ok: true as const };
}

export function cancelStoredInventoryReservation(reservationId: string, comment?: string) {
  const reservation = getStoredInventoryReservations().find((row) => row.id === reservationId);
  if (!reservation) return { ok: false as const, error: "Резерв не найден" };
  if (reservation.status !== "Активен") return { ok: false as const, error: "Резерв уже закрыт" };
  const item = getStoredInventoryItems().find((row) => row.id === reservation.itemId);
  saveStoredInventoryReservations(getStoredInventoryReservations().map((row) => row.id === reservationId ? { ...row, status: "Отменен", comment: comment?.trim() || row.comment } : row));
  addInventoryMovement({ itemId: reservation.itemId, orderId: reservation.orderId, type: "Снятие резерва", quantity: reservation.quantity, comment: comment || reservation.comment });
  const order = getStoredOrders().find((row) => row.id === reservation.orderId);
  if (order && item) {
    recordCrmEvent({
      orderId: order.id,
      clientId: order.clientId,
      type: "inventory",
      title: "Резерв материала снят",
      detail: `${item.name}: ${reservation.quantity} ${item.unit}`,
    });
  }
  return { ok: true as const };
}

export function clearCrmStorage() {
  if (!canUseStorage()) return;
  [ORDERS_KEY, CLIENTS_KEY, PAYMENTS_KEY, PRODUCTION_KEY, INSTALLATION_KEY, EVENTS_KEY, DOCUMENTS_KEY, INVENTORY_KEY, INVENTORY_RESERVATIONS_KEY, INVENTORY_MOVEMENTS_KEY, "pamyat-order-draft", "pamyat-last-order"].forEach((key) => window.localStorage.removeItem(key));
}

export function generateOrderNumber(existingOrders = getStoredOrders()) {
  const year = new Date().getFullYear();
  const max = existingOrders.reduce((highest, order) => {
    const match = order.orderNumber.match(/^ЗК-\d{4}-(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `ЗК-${year}-${String(max + 1 || 1).padStart(4, "0")}`;
}
