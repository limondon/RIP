export type OrderStatus = "Новый" | "Макет" | "В производстве" | "Готов" | "Установка" | "Завершен" | "Проблема";
export type PaymentMethod = "Наличные" | "Карта" | "Перевод" | "Расчетный счет";
export type PaymentType = "Предоплата" | "Доплата" | "Полная оплата" | "Возврат";
export type ProductionStage = "Ожидает макет" | "Макет согласован" | "Резка" | "Полировка" | "Гравировка" | "Сборка" | "Готов";
export type InstallationStatus = "Не назначена" | "Запланирована" | "Выехали" | "Установлено" | "Перенос" | "Проблема";
export type DocumentType = "Наряд-заказ" | "Договор" | "Квитанция" | "Акт выполненных работ";
export type DocumentStatus = "Черновик" | "Сформирован" | "Отправлен клиенту" | "Подписан" | "Архив";
export type CrmEventType = "order" | "payment" | "production" | "installation" | "inventory" | "document" | "comment";
export type InventoryMovementType = "Поступление" | "Списание" | "Резерв" | "Снятие резерва";
export type InventoryReservationStatus = "Активен" | "Списан" | "Отменен";

export interface Client {
  id: string;
  fullName: string;
  phone: string;
  additionalPhone: string;
  address: string;
  source: string;
  comment: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  name: string;
  size: string;
  material: string;
  quantity: number;
  price: number;
  total: number;
}

export interface OrderService {
  id: string;
  orderId: string;
  name: string;
  selected: boolean;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  deceasedFullName: string;
  cemetery: string;
  section: string;
  row: string;
  place: string;
  monumentType: string;
  material: string;
  color: string;
  shape: string;
  polishing: string;
  steleSize: string;
  baseSize: string;
  flowerBedSize: string;
  decoration: {
    portrait: string;
    portraitSize: string;
    inscription: string;
    dates: string;
    epitaph: string;
    decor: string;
    font: string;
    layoutApproval: string;
  };
  services: OrderService[];
  items: OrderItem[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: OrderStatus;
  deadline: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  clientId: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  type: PaymentType;
  comment: string;
}

export interface ProductionTask {
  id: string;
  orderId: string;
  stage: ProductionStage;
  masterId: string;
  startedAt: string;
  plannedReadyAt: string;
  comment: string;
}

export interface InstallationTask {
  id: string;
  orderId: string;
  brigadeId: string;
  date: string;
  time: string;
  status: InstallationStatus;
  comment: string;
}

export interface Document {
  id: string;
  orderId: string;
  clientId: string;
  type: DocumentType;
  number: string;
  date: string;
  status: DocumentStatus;
  amount: number;
  comment?: string;
}

export interface InventoryItem {
  id: string;
  materialId: string;
  name: string;
  category: string;
  color: string;
  unit: string;
  onHand: number;
  minStock: number;
  cost: number;
  supplier: string;
  location: string;
}

export interface InventoryReservation {
  id: string;
  orderId: string;
  itemId: string;
  quantity: number;
  status: InventoryReservationStatus;
  comment: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  orderId?: string;
  type: InventoryMovementType;
  quantity: number;
  comment: string;
  createdAt: string;
}

export interface CrmEvent {
  id: string;
  orderId: string;
  clientId?: string;
  type: CrmEventType;
  title: string;
  detail: string;
  actor: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  status: "Активен" | "Неактивен";
}

export interface Material {
  id: string;
  name: string;
  color: string;
  type: string;
  price: number;
  active: boolean;
}

export interface Brigade {
  id: string;
  name: string;
  members: string;
  phone: string;
  status: string;
}

export interface Master {
  id: string;
  fullName: string;
  specialization: string;
  phone: string;
  active: boolean;
}

export interface StatusDictionary {
  orders: OrderStatus[];
  production: ProductionStage[];
  installation: InstallationStatus[];
}
