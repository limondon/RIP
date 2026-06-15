import type { OrderFormData, OrderItem, ServiceItem } from "@/types/order";

export const initialServices: ServiceItem[] = [
  { id: "delivery", name: "Доставка", selected: true, price: 3000 },
  { id: "installation", name: "Установка", selected: true, price: 8000 },
  { id: "demolition", name: "Демонтаж", selected: true, price: 5000 },
  { id: "foundation", name: "Заливка основания", selected: true, price: 7000 },
  { id: "fence", name: "Ограда", selected: false, price: 0 },
  { id: "tile", name: "Укладка плитки", selected: false, price: 0 },
  { id: "cleanup", name: "Уборка места", selected: false, price: 0 },
  { id: "extra", name: "Дополнительные услуги", selected: false, price: 0 },
];

export const initialItems: OrderItem[] = [
  { id: "1", name: "Стела", size: "100 × 60 × 7", material: "Габбро-диабаз", quantity: 1, price: 66000, total: 66000 },
  { id: "2", name: "Подставка", size: "80 × 14 × 15", material: "Габбро-диабаз", quantity: 1, price: 8500, total: 8500 },
  { id: "3", name: "Цветник", size: "120 × 60 × 8", material: "Габбро-диабаз", quantity: 1, price: 12000, total: 12000 },
  { id: "4", name: "Портрет", size: "9 × 12", material: "Керамика", quantity: 1, price: 4500, total: 4500 },
];

export function createInitialOrderData(): OrderFormData {
  return {
    customer: { fullName: "Иванов Сергей Петрович", phone: "+7 (999) 123-45-67", additionalPhone: "", address: "г. Москва, ул. Лесная, д. 24", orderDate: "2025-05-12", manager: "Тимофеев И.", source: "Рекомендация", comment: "" },
    burialPlace: { cemetery: "Кунцевское", section: "10", row: "14", place: "8", deceasedFullName: "Иванова Мария Ивановна", birthDate: "1940-03-14", deathDate: "2025-04-01", demolitionRequired: true, comment: "Подъезд возможен, место ровное." },
    product: { monumentType: "Одинарный памятник", material: "Гранит, габбро-диабаз", color: "Черный", shape: "Фигурная, волна", polishing: "Главная сторона и торцы", steleSize: { height: "100", width: "60", thickness: "7" }, baseSize: { length: "80", width: "14", height: "15" }, flowerBedSize: { length: "120", width: "60", thickness: "8" }, sketchFile: null },
    decoration: { portraitType: "Керамика на граните", portraitSize: "9 × 12", inscription: "Иванова Мария Ивановна", dates: "14.03.1940 — 01.04.2025", epitaph: "Помним, любим, скорбим", decor: "Православный крест", font: "Классический", approveLayoutWithClient: true },
    services: initialServices.map((service) => ({ ...service })),
    items: initialItems.map((item) => ({ ...item })),
    payment: { productPrice: 79000, decorationPrice: 12500, discount: 2000, prepayment: 50000, paymentMethod: "Наличные", total: 0, paid: 50000, remaining: 0 },
    files: {},
    status: "draft",
    createdAt: new Date().toISOString(),
  };
}
