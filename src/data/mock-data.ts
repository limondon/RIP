import type {
  Brigade, Client, Document, InstallationTask, InventoryItem, Master, Material, Order, OrderItem, OrderService,
  OrderStatus, Payment, ProductionTask, StatusDictionary, User,
} from "@/types/crm";

export const clients: Client[] = [
  ["client-001", "Иванов Сергей Петрович", "+7 (999) 123-45-67", "+7 (916) 555-20-18", "г. Москва, ул. Лесная, д. 12", "Рекомендация", "Предпочитает звонки после 12:00.", "2024-05-12"],
  ["client-002", "Соколова Марина Игоревна", "+7 (916) 842-19-03", "Не указан", "г. Москва, ул. Садовая, д. 18", "Яндекс", "Макет согласовывает дочь заказчика.", "2026-06-03"],
  ["client-003", "Петров Алексей Николаевич", "+7 (903) 455-62-18", "+7 (903) 455-62-19", "г. Москва, ул. Центральная, д. 7", "Повторный клиент", "Нужна установка до годовщины.", "2022-04-21"],
  ["client-004", "Кузнецова Ольга Викторовна", "+7 (985) 333-71-20", "Не указан", "г. Москва, Новая ул., д. 26", "Сайт", "Позвонить перед выездом на кладбище.", "2026-05-30"],
  ["client-005", "Васильев Дмитрий Иванович", "+7 (925) 104-55-90", "+7 (985) 114-52-20", "г. Химки, Молодежная ул., д. 8", "Авито", "Интересуется красным гранитом.", "2026-06-05"],
  ["client-006", "Попова Наталья Сергеевна", "+7 (977) 621-04-88", "Не указан", "г. Москва, Речная ул., д. 41", "Рекомендация", "Документы отправлять в мессенджер.", "2025-03-11"],
  ["client-007", "Михайлов Игорь Павлович", "+7 (909) 876-44-12", "+7 (901) 211-07-62", "г. Москва, ул. Академика Королева, д. 19", "Яндекс", "Требуется звонок руководителя.", "2026-05-26"],
  ["client-008", "Федорова Анна Михайловна", "+7 (915) 287-36-51", "Не указан", "г. Москва, Профсоюзная ул., д. 64", "Социальные сети", "Ожидает два варианта макета.", "2026-06-02"],
  ["client-009", "Смирнов Павел Андреевич", "+7 (926) 540-11-76", "+7 (926) 540-11-75", "г. Одинцово, Можайское ш., д. 102", "Повторный клиент", "Корпоративный семейный заказ.", "2023-09-09"],
  ["client-010", "Орлова Елена Викторовна", "+7 (968) 735-02-42", "Не указан", "г. Москва, Волгоградский пр-т, д. 91", "Сайт", "Присылать документы на email.", "2026-05-18"],
  ["client-011", "Новикова Анна Львовна", "+7 (901) 411-90-05", "Не указан", "г. Балашиха, Советская ул., д. 33", "Авито", "Просит фото камня до начала работ.", "2026-06-08"],
  ["client-012", "Козлов Виктор Юрьевич", "+7 (999) 602-18-47", "+7 (999) 602-18-48", "г. Мытищи, Олимпийский пр-т, д. 16", "Другое", "Срочная установка при готовности.", "2026-06-10"],
].map(([id, fullName, phone, additionalPhone, address, source, comment, createdAt]) => ({ id, fullName, phone, additionalPhone, address, source, comment, createdAt }));

export const materials: Material[] = [
  { id: "mat-001", name: "Габбро-диабаз", color: "черный", type: "гранит", price: 12000, active: true },
  { id: "mat-002", name: "Гранит серый", color: "серый", type: "гранит", price: 10500, active: true },
  { id: "mat-003", name: "Гранит красный", color: "красный", type: "гранит", price: 14000, active: true },
  { id: "mat-004", name: "Мрамор белый", color: "белый", type: "мрамор", price: 11000, active: true },
  { id: "mat-005", name: "Искусственный камень", color: "разный", type: "искусственный", price: 7500, active: false },
  { id: "mat-006", name: "Гранит дымовский", color: "коричневый", type: "гранит", price: 13500, active: true },
];

export const inventoryItems: InventoryItem[] = [
  { id: "inv-001", materialId: "mat-001", name: "Габбро-диабаз 100×60×7", category: "стела", color: "черный", unit: "шт.", onHand: 8, minStock: 3, cost: 26000, supplier: "Карелия Камень", location: "Склад А-1" },
  { id: "inv-002", materialId: "mat-001", name: "Габбро-диабаз 120×60×8", category: "стела", color: "черный", unit: "шт.", onHand: 5, minStock: 2, cost: 33500, supplier: "Карелия Камень", location: "Склад А-2" },
  { id: "inv-003", materialId: "mat-002", name: "Серый гранит 120×60×8", category: "стела", color: "серый", unit: "шт.", onHand: 2, minStock: 2, cost: 31000, supplier: "Урал Гранит", location: "Склад B-1" },
  { id: "inv-004", materialId: "mat-003", name: "Красный гранит 100×60×7", category: "стела", color: "красный", unit: "шт.", onHand: 1, minStock: 2, cost: 42000, supplier: "Урал Гранит", location: "Склад B-2" },
  { id: "inv-005", materialId: "mat-004", name: "Мрамор белый плита", category: "плита", color: "белый", unit: "шт.", onHand: 3, minStock: 1, cost: 28000, supplier: "Мрамор-Сервис", location: "Склад C-1" },
  { id: "inv-006", materialId: "mat-001", name: "Подставка 80×14×15", category: "подставка", color: "черный", unit: "шт.", onHand: 14, minStock: 5, cost: 4500, supplier: "Карелия Камень", location: "Склад А-3" },
  { id: "inv-007", materialId: "mat-001", name: "Цветник 120×60×8", category: "цветник", color: "черный", unit: "шт.", onHand: 11, minStock: 4, cost: 6500, supplier: "Карелия Камень", location: "Склад А-4" },
  { id: "inv-008", materialId: "mat-006", name: "Дымовский гранит 120×60×8", category: "стела", color: "коричневый", unit: "шт.", onHand: 2, minStock: 1, cost: 39000, supplier: "Север Гранит", location: "Склад B-3" },
];

export const serviceCatalog = [
  { id: "svc-001", name: "Доставка", category: "логистика", price: 3000, active: true },
  { id: "svc-002", name: "Установка", category: "монтаж", price: 8000, active: true },
  { id: "svc-003", name: "Демонтаж", category: "монтаж", price: 5000, active: true },
  { id: "svc-004", name: "Заливка основания", category: "монтаж", price: 7000, active: true },
  { id: "svc-005", name: "Укладка плитки", category: "благоустройство", price: 12000, active: true },
  { id: "svc-006", name: "Уборка места", category: "благоустройство", price: 2000, active: true },
  { id: "svc-007", name: "Ограда", category: "изделие", price: 15000, active: true },
];

export const masters: Master[] = [
  { id: "master-001", fullName: "Смирнов А.В.", specialization: "полировка", phone: "+7 (925) 104-55-90", active: true },
  { id: "master-002", fullName: "Козлов П.И.", specialization: "гравировка", phone: "+7 (903) 455-62-18", active: true },
  { id: "master-003", fullName: "Орлов Д.С.", specialization: "резка", phone: "+7 (926) 502-11-74", active: true },
  { id: "master-004", fullName: "Васильев М.Н.", specialization: "сборка", phone: "+7 (916) 733-04-18", active: true },
  { id: "master-005", fullName: "Белова Е.С.", specialization: "макеты", phone: "+7 (985) 441-29-16", active: false },
];

export const brigades: Brigade[] = [
  { id: "brigade-001", name: "Бригада 1", members: "Иванов / Петров", phone: "+7 (999) 700-10-11", status: "Загружена" },
  { id: "brigade-002", name: "Бригада 2", members: "Смирнов / Козлов", phone: "+7 (999) 700-10-12", status: "Свободна" },
  { id: "brigade-003", name: "Бригада 3", members: "Орлов / Васильев", phone: "+7 (999) 700-10-13", status: "В работе" },
];

export const statuses: StatusDictionary = {
  orders: ["Новый", "Макет", "В производстве", "Готов", "Установка", "Завершен", "Проблема"],
  production: ["Ожидает макет", "Макет согласован", "Резка", "Полировка", "Гравировка", "Сборка", "Готов"],
  installation: ["Не назначена", "Запланирована", "Выехали", "Установлено", "Перенос", "Проблема"],
};

export const users: User[] = [
  { id: "user-001", name: "Тимофеев И.", phone: "+7 (999) 100-10-10", email: "timofeev@pamyat-crm.ru", role: "Администратор", status: "Активен" },
  { id: "user-002", name: "Иванова М.", phone: "+7 (916) 842-19-03", email: "ivanova@pamyat-crm.ru", role: "Менеджер", status: "Активен" },
  { id: "user-003", name: "Смирнов А.", phone: "+7 (925) 104-55-90", email: "smirnov@pamyat-crm.ru", role: "Мастер", status: "Активен" },
  { id: "user-004", name: "Козлов П.", phone: "+7 (903) 455-62-18", email: "kozlov@pamyat-crm.ru", role: "Установщик", status: "Активен" },
  { id: "user-005", name: "Орлова Е.", phone: "+7 (985) 333-71-20", email: "orlova@pamyat-crm.ru", role: "Бухгалтер", status: "Неактивен" },
];

const orderSeed: Array<[string, string, string, string, string, OrderStatus, string, number, number]> = [
  ["zk-2026-0128", "ЗК-2026-0128", "client-001", "Одинарный памятник", "Габбро-диабаз", "Макет", "2026-06-28", 114000, 65000],
  ["zk-2026-0129", "ЗК-2026-0129", "client-002", "Двойной памятник", "Габбро-диабаз", "В производстве", "2026-06-24", 186500, 100000],
  ["zk-2026-0130", "ЗК-2026-0130", "client-003", "Мемориальный комплекс", "Гранит серый", "Готов", "2026-06-18", 247000, 247000],
  ["zk-2026-0131", "ЗК-2026-0131", "client-004", "Надгробная плита", "Мрамор белый", "Установка", "2026-06-16", 89000, 69000],
  ["zk-2026-0132", "ЗК-2026-0132", "client-005", "Одинарный памятник", "Гранит красный", "Новый", "2026-07-05", 132000, 30000],
  ["zk-2026-0133", "ЗК-2026-0133", "client-006", "Стела", "Габбро-диабаз", "Завершен", "2026-06-10", 78500, 78500],
  ["zk-2026-0134", "ЗК-2026-0134", "client-007", "Двойной памятник", "Гранит серый", "Проблема", "2026-06-14", 169000, 80000],
  ["zk-2026-0135", "ЗК-2026-0135", "client-008", "Одинарный памятник", "Габбро-диабаз", "Макет", "2026-07-02", 106000, 40000],
  ["zk-2026-0136", "ЗК-2026-0136", "client-009", "Мемориальный комплекс", "Гранит красный", "В производстве", "2026-07-12", 315000, 230000],
  ["zk-2026-0137", "ЗК-2026-0137", "client-010", "Надгробная плита", "Мрамор белый", "Готов", "2026-06-20", 94000, 64000],
  ["zk-2026-0138", "ЗК-2026-0138", "client-011", "Одинарный памятник", "Искусственный камень", "Установка", "2026-06-17", 72000, 52000],
  ["zk-2026-0139", "ЗК-2026-0139", "client-012", "Стела", "Габбро-диабаз", "Завершен", "2026-06-08", 82500, 82500],
  ["zk-2026-0140", "ЗК-2026-0140", "client-001", "Ограда и благоустройство", "Гранит серый", "Завершен", "2025-08-18", 68500, 68500],
  ["zk-2026-0141", "ЗК-2026-0141", "client-003", "Цветник", "Габбро-диабаз", "Завершен", "2025-07-14", 42000, 42000],
  ["zk-2026-0142", "ЗК-2026-0142", "client-009", "Памятник", "Габбро-диабаз", "Завершен", "2025-06-05", 148000, 148000],
];

const cemeteries = ["Кунцевское", "Хованское", "Домодедовское", "Митинское", "Перепечинское"];
const shapes = ["Фигурная, волна", "Арка", "Прямая", "Индивидуальная"];

function makeItems(orderId: string, material: string, total: number): OrderItem[] {
  const rows = [
    ["Стела", "100×60×7", material, 1, Math.round(total * 0.58)],
    ["Подставка", "80×14×15", material, 1, Math.round(total * 0.08)],
    ["Цветник", "120×60×8", material, 1, Math.round(total * 0.12)],
    ["Портрет", "9×12", "Керамика", 1, 4500],
    ["Декор", "ветвь", material, 1, Math.max(3000, Math.round(total * 0.04))],
  ] as const;
  return rows.map(([name, size, rowMaterial, quantity, price], index) => ({ id: `${orderId}-item-${index + 1}`, orderId, name, size, material: rowMaterial, quantity, price, total: quantity * price }));
}

function makeServices(orderId: string): OrderService[] {
  return [
    ["delivery", "Доставка", true, 3000],
    ["install", "Установка", true, 8000],
    ["dismantling", "Демонтаж", true, 5000],
    ["foundation", "Заливка основания", true, 7000],
    ["fence", "Ограда", false, 15000],
    ["tile", "Укладка плитки", false, 12000],
    ["cleaning", "Уборка места", true, 2000],
  ].map(([id, name, selected, price]) => ({ id: `${orderId}-${id}`, orderId, name: String(name), selected: Boolean(selected), price: Number(price) }));
}

export const orders: Order[] = orderSeed.map(([id, orderNumber, clientId, monumentType, material, status, deadline, totalAmount, paidAmount], index) => {
  const services = makeServices(id);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  return {
    id,
    orderNumber,
    clientId,
    deceasedFullName: ["Иванова Мария Ивановна", "Соколов Андрей Петрович", "Петрова Анна Николаевна", "Кузнецов Виктор Сергеевич"][index % 4],
    cemetery: cemeteries[index % cemeteries.length],
    section: String(10 + index),
    row: String(4 + index),
    place: String(8 + index),
    monumentType,
    material,
    color: material.includes("Мрамор") ? "белый" : material.includes("красный") ? "красный" : material.includes("серый") ? "серый" : "черный",
    shape: shapes[index % shapes.length],
    polishing: "Главная сторона и торцы",
    steleSize: index % 2 ? "120×60×8 см" : "100×60×7 см",
    baseSize: "80×14×15 см",
    flowerBedSize: "120×60×8 см",
    decoration: {
      portrait: "Фотокерамика",
      portraitSize: "9×12 см",
      inscription: clients.find((client) => client.id === clientId)?.fullName ?? "",
      dates: "14.03.1940 — 01.04.2025",
      epitaph: "Помним, любим, скорбим",
      decor: "Православный крест, ветвь",
      font: "Классический",
      layoutApproval: ["Новый", "Макет"].includes(status) ? "Ожидает согласования" : "Макет согласован",
    },
    services,
    items: makeItems(id, material, totalAmount),
    totalAmount,
    paidAmount,
    remainingAmount,
    status,
    deadline,
    createdAt: `2026-06-${String(Math.max(1, 15 - index)).padStart(2, "0")}`,
  };
});

export const payments: Payment[] = [
  ...orders.slice(0, 12).map((order, index) => ({
    id: `pay-${index + 1}`,
    orderId: order.id,
    clientId: order.clientId,
    date: `2026-06-${String(index + 1).padStart(2, "0")}`,
    amount: order.paidAmount,
    method: (["Наличные", "Карта", "Перевод", "Расчетный счет"] as const)[index % 4],
    type: order.paidAmount >= order.totalAmount ? "Полная оплата" as const : "Предоплата" as const,
    comment: order.paidAmount >= order.totalAmount ? "Закрывающий платеж по заказу" : "Первичная предоплата",
  })),
  { id: "pay-13", orderId: "zk-2026-0128", clientId: "client-001", date: "2026-06-13", amount: 15000, method: "Перевод", type: "Доплата" as const, comment: "Доплата после согласования макета" },
  { id: "pay-14", orderId: "zk-2026-0136", clientId: "client-009", date: "2026-06-14", amount: 50000, method: "Расчетный счет", type: "Доплата" as const, comment: "Платеж по этапу производства" },
  { id: "pay-15", orderId: "zk-2026-0134", clientId: "client-007", date: "2026-06-15", amount: 10000, method: "Карта", type: "Возврат" as const, comment: "Корректировка стоимости услуги" },
];

export const productionTasks: ProductionTask[] = orders.slice(0, 10).map((order, index) => ({
  id: `prod-${index + 1}`,
  orderId: order.id,
  stage: statuses.production[index % statuses.production.length],
  masterId: masters[index % masters.length].id,
  startedAt: `2026-06-${String(10 + index).padStart(2, "0")}`,
  plannedReadyAt: order.deadline,
  comment: ["Ожидаем финальное согласование портрета.", "Камень зарезервирован, макет принят.", "Резка запланирована на первую половину дня.", "Полировка лицевой стороны.", "Гравировка текста и дат."][index % 5],
}));

export const installationTasks: InstallationTask[] = orders.slice(0, 10).map((order, index) => ({
  id: `install-${index + 1}`,
  orderId: order.id,
  brigadeId: brigades[index % brigades.length].id,
  date: `2026-06-${String(16 + index).padStart(2, "0")}`,
  time: ["09:30", "13:00", "10:00", "11:30", "15:00"][index % 5],
  status: statuses.installation[index % statuses.installation.length],
  comment: index % 4 === 0 ? "Проверить подъезд к участку заранее." : "Стандартная установка, материалы готовы.",
}));

export const documents: Document[] = orders.slice(0, 12).map((order, index) => ({
  id: `doc-${index + 1}`,
  orderId: order.id,
  clientId: order.clientId,
  type: (["Договор", "Наряд-заказ", "Квитанция", "Акт выполненных работ"] as const)[index % 4],
  number: `DOC-2026-${String(index + 1).padStart(4, "0")}`,
  date: `2026-06-${String(index + 1).padStart(2, "0")}`,
  status: (["Сформирован", "Отправлен клиенту", "Подписан", "Архив"] as const)[index % 4],
  amount: index % 4 === 2 ? order.paidAmount : order.totalAmount,
  comment: "Документ сформирован из единого набора mock-данных",
}));
