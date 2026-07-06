import type { OrderFormData } from "@/types/order";
import { calculateOrderTotals } from "./calculations";
import {
  addStoredClient,
  addStoredInstallationTask,
  addStoredOrder,
  addStoredPayment,
  addStoredProductionTask,
  generateOrderNumber,
  getStoredClients,
  getStoredInstallationTasks,
  getStoredOrders,
  getStoredPayments,
  getStoredProductionTasks,
  recordCrmEvent,
  saveStoredClients,
  saveStoredInstallationTasks,
  saveStoredOrders,
  saveStoredPayments,
  saveStoredProductionTasks,
} from "@/lib/storage";
import type { Client, InstallationTask, Order, OrderItem as CrmOrderItem, OrderService as CrmOrderService, Payment, PaymentMethod, ProductionTask } from "@/types/crm";

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

const orderNumberToId = (value: string) => value.replace(/^ЗК/, "zk").toLowerCase();
const size = (parts: Record<string, string>) => Object.values(parts).filter(Boolean).join("×") + (Object.values(parts).some(Boolean) ? " см" : "");
const paymentMethods: PaymentMethod[] = ["Наличные", "Карта", "Перевод", "Расчетный счет"];
const normalizeOrderId = (value: string) => decodeURIComponent(value).toLowerCase().replace(/^зк-/, "zk-");
const normalizePhone = (value: string) => value.replace(/\D/g, "");
const normalizePaymentMethod = (value: string): PaymentMethod => {
  const normalized = value.replace(/ё/g, "е");
  return paymentMethods.includes(normalized as PaymentMethod) ? normalized as PaymentMethod : "Наличные";
};

function findStoredOrder(orderId: string) {
  const normalized = normalizeOrderId(orderId);
  return getStoredOrders().find((order) => order.id === normalized || order.orderNumber.toLowerCase() === decodeURIComponent(orderId).toLowerCase()) ?? null;
}

function parseSize(value: string, keys: string[]) {
  const parts = value.match(/\d+(?:[.,]\d+)?/g) ?? [];
  return keys.reduce<Record<string, string>>((result, key, index) => ({ ...result, [key]: parts[index] ?? "" }), {});
}

function serviceFormId(service: CrmOrderService) {
  const byName: Record<string, string> = {
    "Доставка": "delivery",
    "Установка": "installation",
    "Демонтаж": "demolition",
    "Заливка основания": "foundation",
    "Ограда": "fence",
    "Укладка плитки": "tile",
    "Уборка места": "cleanup",
    "Дополнительные услуги": "extra",
  };
  return byName[service.name] ?? service.id.split("-").pop() ?? service.id;
}

function calculatePaidAmount(orderId: string) {
  return getStoredPayments()
    .filter((payment) => payment.orderId === orderId)
    .reduce((sum, payment) => sum + (payment.type === "Возврат" ? -payment.amount : payment.amount), 0);
}

function syncOrderPayment(order: Order, paidAmount: number, method: PaymentMethod) {
  const otherPayments = getStoredPayments().filter((payment) => payment.orderId !== order.id);
  const payment = paidAmount > 0 ? [{
    id: `pay-${order.id}`,
    orderId: order.id,
    clientId: order.clientId,
    date: order.createdAt,
    amount: paidAmount,
    method,
    type: paidAmount >= order.totalAmount ? "Полная оплата" as const : "Предоплата" as const,
    comment: "Платеж обновлен из карточки заказа",
  }] : [];
  saveStoredPayments([...payment, ...otherPayments]);
}

export function createFormFromStoredOrder(orderId: string): OrderFormData | null {
  const order = findStoredOrder(orderId);
  if (!order) return null;

  const client = getStoredClients().find((item) => item.id === order.clientId);
  const payments = getStoredPayments().filter((payment) => payment.orderId === order.id);
  const servicesTotal = order.services.filter((service) => service.selected).reduce((sum, service) => sum + service.price, 0);
  const decorationPrice = order.items.find((item) => item.name === "Портрет")?.total ?? 0;
  const paidAmount = calculatePaidAmount(order.id);
  const paymentMethod = payments[0]?.method ?? "Наличные";

  return {
    customer: {
      fullName: client?.fullName ?? "",
      phone: client?.phone ?? "",
      additionalPhone: client?.additionalPhone === "Не указан" ? "" : client?.additionalPhone ?? "",
      address: client?.address ?? "",
      orderDate: order.createdAt,
      manager: "Тимофеев И.",
      source: client?.source ?? "",
      comment: client?.comment ?? "",
    },
    burialPlace: {
      cemetery: order.cemetery,
      section: order.section,
      row: order.row,
      place: order.place,
      deceasedFullName: order.deceasedFullName,
      birthDate: "",
      deathDate: "",
      demolitionRequired: false,
      comment: "",
    },
    product: {
      monumentType: order.monumentType,
      material: order.material,
      color: order.color,
      shape: order.shape,
      polishing: order.polishing,
      steleSize: parseSize(order.steleSize, ["height", "width", "thickness"]) as OrderFormData["product"]["steleSize"],
      baseSize: parseSize(order.baseSize, ["length", "width", "height"]) as OrderFormData["product"]["baseSize"],
      flowerBedSize: parseSize(order.flowerBedSize, ["length", "width", "thickness"]) as OrderFormData["product"]["flowerBedSize"],
      sketchFile: null,
    },
    decoration: {
      portraitType: order.decoration.portrait,
      portraitSize: order.decoration.portraitSize,
      inscription: order.decoration.inscription,
      dates: order.decoration.dates,
      epitaph: order.decoration.epitaph,
      decor: order.decoration.decor,
      font: order.decoration.font,
      approveLayoutWithClient: order.decoration.layoutApproval !== "Макет согласован",
    },
    services: order.services.map((service) => ({ id: serviceFormId(service), name: service.name, selected: service.selected, price: service.price })),
    items: order.items.map((item) => ({ id: item.id, name: item.name, size: item.size.replace(/\sсм$/, ""), material: item.material, quantity: item.quantity, price: item.price, total: item.total })),
    payment: {
      productPrice: Math.max(0, order.totalAmount - servicesTotal - decorationPrice),
      decorationPrice,
      discount: 0,
      prepayment: paidAmount,
      paymentMethod,
      total: order.totalAmount,
      paid: paidAmount,
      remaining: Math.max(0, order.totalAmount - paidAmount),
    },
    files: {},
    status: "draft",
    createdAt: order.createdAt,
  };
}

export function updateStoredOrderFromForm(orderId: string, form: OrderFormData) {
  const existingOrder = findStoredOrder(orderId);
  if (!existingOrder) return null;

  const totals = calculateOrderTotals(form);
  const clients = getStoredClients();
  const existingClient = clients.find((client) => client.id === existingOrder.clientId);
  const samePhoneClient = clients.find((client) => client.id !== existingOrder.clientId && normalizePhone(client.phone) === normalizePhone(form.customer.phone));
  const client: Client = {
    id: samePhoneClient?.id ?? existingClient?.id ?? existingOrder.clientId,
    fullName: form.customer.fullName.trim(),
    phone: form.customer.phone.trim(),
    additionalPhone: form.customer.additionalPhone.trim() || "Не указан",
    address: form.customer.address.trim(),
    source: form.customer.source || "Другое",
    comment: form.customer.comment,
    createdAt: existingClient?.createdAt ?? form.customer.orderDate ?? existingOrder.createdAt,
  };
  saveStoredClients([client, ...clients.filter((item) => item.id !== client.id && item.id !== existingOrder.clientId)]);

  const paidAmount = Math.max(0, Number(form.payment.prepayment) || 0);
  const services: CrmOrderService[] = form.services.map((service) => ({
    id: service.id.startsWith(existingOrder.id) ? service.id : `${existingOrder.id}-${service.id}`,
    orderId: existingOrder.id,
    name: service.name,
    selected: service.selected,
    price: service.price,
  }));
  const items: CrmOrderItem[] = form.items.map((item, index) => ({
    id: item.id.startsWith(existingOrder.id) ? item.id : `${existingOrder.id}-item-${index + 1}`,
    orderId: existingOrder.id,
    name: item.name,
    size: item.size,
    material: item.material,
    quantity: item.quantity,
    price: item.price,
    total: item.total,
  }));
  const order: Order = {
    ...existingOrder,
    clientId: client.id,
    deceasedFullName: form.burialPlace.deceasedFullName.trim(),
    cemetery: form.burialPlace.cemetery,
    section: form.burialPlace.section,
    row: form.burialPlace.row,
    place: form.burialPlace.place,
    monumentType: form.product.monumentType,
    material: form.product.material,
    color: form.product.color,
    shape: form.product.shape,
    polishing: form.product.polishing,
    steleSize: size(form.product.steleSize),
    baseSize: size(form.product.baseSize),
    flowerBedSize: size(form.product.flowerBedSize),
    decoration: {
      portrait: form.decoration.portraitType,
      portraitSize: form.decoration.portraitSize,
      inscription: form.decoration.inscription,
      dates: form.decoration.dates,
      epitaph: form.decoration.epitaph,
      decor: form.decoration.decor,
      font: form.decoration.font,
      layoutApproval: form.decoration.approveLayoutWithClient ? "Ожидает согласования" : "Макет согласован",
    },
    services,
    items,
    totalAmount: totals.total,
    paidAmount,
    remainingAmount: Math.max(0, totals.total - paidAmount),
    deadline: form.customer.orderDate || existingOrder.deadline,
  };
  saveStoredOrders(getStoredOrders().map((item) => item.id === existingOrder.id ? order : item));
  syncOrderPayment(order, paidAmount, normalizePaymentMethod(form.payment.paymentMethod));
  recordCrmEvent({
    orderId: order.id,
    clientId: client.id,
    type: "order",
    title: "Заказ отредактирован",
    detail: "Обновлены данные заказа из формы редактирования",
  });

  if (!getStoredProductionTasks().some((task) => task.orderId === order.id)) {
    saveStoredProductionTasks([{ id: `prod-${Date.now()}`, orderId: order.id, stage: "Ожидает макет", masterId: "master-005", startedAt: order.createdAt, plannedReadyAt: order.deadline, comment: "Создано автоматически при редактировании заказа" }, ...getStoredProductionTasks()]);
  }
  if (!getStoredInstallationTasks().some((task) => task.orderId === order.id)) {
    saveStoredInstallationTasks([{ id: `install-${Date.now()}`, orderId: order.id, brigadeId: "brigade-001", date: "", time: "", status: "Не назначена", comment: "Установка будет назначена после готовности изделия" }, ...getStoredInstallationTasks()]);
  }

  return { order, client, paymentCreated: paidAmount > 0 };
}

export function createStoredOrderFromForm(form: OrderFormData) {
  const totals = calculateOrderTotals(form);
  const existingClient = getStoredClients().find((client) => normalizePhone(client.phone) === normalizePhone(form.customer.phone));
  const client: Client = existingClient ?? {
    id: `client-${Date.now()}`,
    fullName: form.customer.fullName.trim(),
    phone: form.customer.phone.trim(),
    additionalPhone: form.customer.additionalPhone.trim() || "Не указан",
    address: form.customer.address.trim(),
    source: form.customer.source || "Другое",
    comment: form.customer.comment,
    createdAt: form.customer.orderDate || new Date().toISOString().slice(0, 10),
  };
  if (!existingClient) addStoredClient(client);

  const orderNumber = generateOrderNumber();
  const orderId = orderNumberToId(orderNumber);
  const services: CrmOrderService[] = form.services.map((service) => ({ id: `${orderId}-${service.id}`, orderId, name: service.name, selected: service.selected, price: service.price }));
  const items: CrmOrderItem[] = form.items.map((item, index) => ({ id: `${orderId}-item-${index + 1}`, orderId, name: item.name, size: item.size, material: item.material, quantity: item.quantity, price: item.price, total: item.total }));
  const paidAmount = Math.max(0, Number(form.payment.prepayment) || 0);
  const order: Order = {
    id: orderId,
    orderNumber,
    clientId: client.id,
    deceasedFullName: form.burialPlace.deceasedFullName.trim(),
    cemetery: form.burialPlace.cemetery,
    section: form.burialPlace.section,
    row: form.burialPlace.row,
    place: form.burialPlace.place,
    monumentType: form.product.monumentType,
    material: form.product.material,
    color: form.product.color,
    shape: form.product.shape,
    polishing: form.product.polishing,
    steleSize: size(form.product.steleSize),
    baseSize: size(form.product.baseSize),
    flowerBedSize: size(form.product.flowerBedSize),
    decoration: {
      portrait: form.decoration.portraitType,
      portraitSize: form.decoration.portraitSize,
      inscription: form.decoration.inscription,
      dates: form.decoration.dates,
      epitaph: form.decoration.epitaph,
      decor: form.decoration.decor,
      font: form.decoration.font,
      layoutApproval: form.decoration.approveLayoutWithClient ? "Ожидает согласования" : "Макет согласован",
    },
    services,
    items,
    totalAmount: totals.total,
    paidAmount,
    remainingAmount: Math.max(0, totals.total - paidAmount),
    status: "Новый",
    deadline: form.customer.orderDate || new Date().toISOString().slice(0, 10),
    createdAt: form.customer.orderDate || new Date().toISOString().slice(0, 10),
  };
  addStoredOrder(order);
  recordCrmEvent({
    orderId,
    clientId: client.id,
    type: "order",
    title: "Заказ создан",
    detail: `Создан заказ ${orderNumber}`,
  });

  if (paidAmount > 0) {
    const method = normalizePaymentMethod(form.payment.paymentMethod);
    const payment: Payment = { id: `pay-${Date.now()}`, orderId, clientId: client.id, date: order.createdAt, amount: paidAmount, method, type: "Предоплата", comment: "Предоплата при создании заказа" };
    addStoredPayment(payment);
    recordCrmEvent({
      orderId,
      clientId: client.id,
      type: "payment",
      title: "Получена предоплата",
      detail: `${new Intl.NumberFormat("ru-RU").format(paidAmount)} ₽, ${method}`,
    });
  }

  const production: ProductionTask = { id: `prod-${Date.now()}`, orderId, stage: "Ожидает макет", masterId: "master-005", startedAt: order.createdAt, plannedReadyAt: order.deadline, comment: "Создано автоматически при оформлении заказа" };
  const installation: InstallationTask = { id: `install-${Date.now()}`, orderId, brigadeId: "brigade-001", date: "", time: "", status: "Не назначена", comment: "Установка будет назначена после готовности изделия" };
  addStoredProductionTask(production);
  addStoredInstallationTask(installation);
  recordCrmEvent({
    orderId,
    clientId: client.id,
    type: "production",
    title: "Создана задача производства",
    detail: "Этап: Ожидает макет",
  });
  recordCrmEvent({
    orderId,
    clientId: client.id,
    type: "installation",
    title: "Создана задача установки",
    detail: "Статус: Не назначена",
  });

  return { order, client, paymentCreated: paidAmount > 0 };
}
