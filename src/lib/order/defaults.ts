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
  { id: "1", name: "Стела", size: "100×60×7", material: "Габбро-диабаз", quantity: 1, price: 66000, total: 66000 },
  { id: "2", name: "Подставка", size: "80×14×15", material: "Габбро-диабаз", quantity: 1, price: 8500, total: 8500 },
  { id: "3", name: "Цветник", size: "120×60×8", material: "Габбро-диабаз", quantity: 1, price: 12000, total: 12000 },
  { id: "4", name: "Портрет", size: "9×12", material: "Керамика", quantity: 1, price: 4500, total: 4500 },
];

export function createInitialOrderData(): OrderFormData {
  return {
    customer: {
      fullName: "",
      phone: "",
      additionalPhone: "",
      address: "",
      orderDate: new Date().toISOString().slice(0, 10),
      manager: "Тимофеев И.",
      source: "",
      comment: "",
    },
    burialPlace: {
      cemetery: "",
      section: "",
      row: "",
      place: "",
      deceasedFullName: "",
      birthDate: "",
      deathDate: "",
      demolitionRequired: false,
      comment: "",
    },
    product: {
      monumentType: "",
      material: "",
      color: "",
      shape: "",
      polishing: "",
      steleSize: { height: "100", width: "60", thickness: "7" },
      baseSize: { length: "80", width: "14", height: "15" },
      flowerBedSize: { length: "120", width: "60", thickness: "8" },
      sketchFile: null,
    },
    decoration: {
      portraitType: "",
      portraitSize: "",
      inscription: "",
      dates: "",
      epitaph: "",
      decor: "",
      font: "",
      approveLayoutWithClient: true,
    },
    services: initialServices.map((service) => ({ ...service })),
    items: initialItems.map((item) => ({ ...item })),
    payment: {
      productPrice: 86500,
      decorationPrice: 4500,
      discount: 0,
      prepayment: 0,
      paymentMethod: "",
      total: 0,
      paid: 0,
      remaining: 0,
    },
    files: {},
    status: "draft",
    createdAt: new Date().toISOString(),
  };
}
