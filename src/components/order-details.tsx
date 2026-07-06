"use client";

import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Download,
  FileImage,
  FileText,
  HandCoins,
  HardHat,
  LayoutDashboard,
  Menu,
  Package,
  PackageCheck,
  Pencil,
  Plus,
  Printer,
  Search,
  Send,
  Settings,
  UploadCloud,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { brigades, masters } from "@/data/mock-data";
import type { OrderDetails as OrderDetailsData, OrderStatus } from "@/lib/order/mock-orders";
import { getOrderById, orderStatuses, statusStyles } from "@/lib/order/mock-orders";
import {
  addStoredPaymentForOrder,
  addStoredDocumentForOrder,
  cancelStoredInventoryReservation,
  getStoredDocumentsByOrderId,
  getStoredEventsByOrderId,
  getStoredInventoryAvailable,
  getStoredInventoryItems,
  getStoredInventoryReservations,
  reserveStoredInventoryForOrder,
  updateStoredInstallationTask,
  updateStoredOrderStatus,
  updateStoredProductionStage,
  updateStoredProductionTask,
  writeOffStoredInventoryReservation,
} from "@/lib/storage";
import type { CrmEvent, Document, DocumentType, InstallationStatus, InventoryItem, InventoryReservation, PaymentMethod, PaymentType, ProductionStage, ProductionTask } from "@/types/crm";

const tabs = ["Общая информация", "Клиент", "Изделие", "Оформление", "Услуги", "Оплата", "Производство", "Установка", "Склад", "Документы", "Файлы", "История"] as const;
type Tab = (typeof tabs)[number];

const nav = [
  [LayoutDashboard, "Главная"], [ClipboardList, "Заказы"], [UsersRound, "Клиенты"], [HardHat, "Производство"],
  [PackageCheck, "Установка"], [Package, "Склад"], [HandCoins, "Финансы"], [FileText, "Документы"], [Settings, "Настройки"],
] satisfies ReadonlyArray<readonly [LucideIcon, string]>;

const productionStages: ProductionStage[] = ["Ожидает макет", "Макет согласован", "Резка", "Полировка", "Гравировка", "Сборка", "Готов"];
const installationStatuses: InstallationStatus[] = ["Не назначена", "Запланирована", "Выехали", "Установлено", "Перенос", "Проблема"];
const paymentMethods: PaymentMethod[] = ["Наличные", "Карта", "Перевод", "Расчетный счет"];
const paymentTypes: PaymentType[] = ["Предоплата", "Доплата", "Полная оплата", "Возврат"];
const documentTypes: DocumentType[] = ["Наряд-заказ", "Договор", "Квитанция", "Акт выполненных работ"];
const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;

function Section({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function InfoGrid({ items, columns = 3 }: { items: Array<[string, ReactNode]>; columns?: 2 | 3 | 4 }) {
  const grid = columns === 4 ? "lg:grid-cols-4" : columns === 2 ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3";
  return (
    <dl className={`grid gap-x-8 gap-y-5 ${grid}`}>
      {items.map(([label, value]) => (
        <div key={label} className="border-b border-slate-100 pb-4 last:border-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
          <dd className="mt-1.5 text-sm font-semibold leading-6 text-slate-800">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${statusStyles[status]}`}>{status}</span>;
}

export function OrderDetails({ order }: { order: OrderDetailsData | null }) {
  const [currentOrder, setCurrentOrder] = useState(order);
  const [activeTab, setActiveTab] = useState<Tab>("Общая информация");
  const [sidebar, setSidebar] = useState(false);
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? "Новый");
  const [statusMenu, setStatusMenu] = useState(false);
  const [events, setEvents] = useState<CrmEvent[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryReservations, setInventoryReservations] = useState<InventoryReservation[]>([]);
  const [inventoryForm, setInventoryForm] = useState({ itemId: "", quantity: "1", comment: "" });
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    type: "Доплата" as PaymentType,
    amount: "",
    method: "Наличные" as PaymentMethod,
    date: new Date().toISOString().slice(0, 10),
    comment: "",
  });
  const [toast, setToast] = useState("");

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const refreshOrder = useCallback(() => {
    const id = window.location.pathname.split("/").pop();
    const found = id ? getOrderById(id) : null;
    if (found) {
      setCurrentOrder(found);
      setStatus(found.status);
      setEvents(getStoredEventsByOrderId(found.id));
      setDocuments(getStoredDocumentsByOrderId(found.id));
      const nextItems = getStoredInventoryItems();
      setInventoryItems(nextItems);
      setInventoryReservations(getStoredInventoryReservations().filter((reservation) => reservation.orderId === found.id));
      setInventoryForm((form) => ({ ...form, itemId: form.itemId || nextItems[0]?.id || "" }));
    }
    return found;
  }, []);

  useEffect(() => {
    refreshOrder();
  }, [refreshOrder]);

  const changeOrderStatus = (nextStatus: OrderStatus) => {
    if (!order) return;
    updateStoredOrderStatus(order.id, nextStatus);
    setStatus(nextStatus);
    setStatusMenu(false);
    refreshOrder();
    notify(`Статус заказа изменён на «${nextStatus}»`);
  };

  const changeProductionStage = (nextStage: ProductionStage) => {
    if (!order) return;
    updateStoredProductionStage(order.id, nextStage);
    refreshOrder();
    notify(`Этап производства изменён на «${nextStage}»`);
  };

  const updateProductionPlanning = (values: Partial<Pick<ProductionTask, "masterId" | "plannedReadyAt" | "comment">>) => {
    if (!order) return;
    updateStoredProductionTask(order.id, values);
    refreshOrder();
    notify("План производства обновлён");
  };

  const changeInstallationStatus = (nextStatus: InstallationStatus) => {
    if (!order) return;
    updateStoredInstallationTask(order.id, { status: nextStatus });
    refreshOrder();
    notify(`Статус установки изменён на «${nextStatus}»`);
  };

  const updateInstallationPlanning = (values: Parameters<typeof updateStoredInstallationTask>[1]) => {
    if (!order) return;
    updateStoredInstallationTask(order.id, values);
    refreshOrder();
    notify("План установки обновлён");
  };

  const openPaymentModal = (type: PaymentType = "Доплата", method: PaymentMethod = "Перевод") => {
    const found = refreshOrder();
    const nextRemaining = found ? Math.max(0, found.amount - found.paid) : 0;
    setPaymentForm({
      type,
      amount: type === "Полная оплата" ? String(nextRemaining) : "",
      method,
      date: new Date().toISOString().slice(0, 10),
      comment: "",
    });
    setPaymentModal(true);
  };

  const savePayment = () => {
    if (!order) return;
    const result = addStoredPaymentForOrder({
      orderId: order.id,
      amount: Number(paymentForm.amount) || 0,
      method: paymentForm.method,
      type: paymentForm.type,
      date: paymentForm.date,
      comment: paymentForm.comment,
    });
    if (!result.ok) {
      notify(result.error);
      return;
    }
    refreshOrder();
    setPaymentModal(false);
    notify(`${paymentForm.type}: ${money(result.payment.amount)} сохранено`);
  };

  const reserveInventory = () => {
    if (!order) return;
    const result = reserveStoredInventoryForOrder({
      orderId: order.id,
      itemId: inventoryForm.itemId,
      quantity: Number(inventoryForm.quantity) || 0,
      comment: inventoryForm.comment,
    });
    if (!result.ok) return notify(result.error);
    refreshOrder();
    setInventoryForm((form) => ({ ...form, comment: "", quantity: "1" }));
    notify("Материал зарезервирован под заказ");
  };

  const closeInventoryReservation = (reservationId: string, action: "writeOff" | "cancel") => {
    const result = action === "writeOff" ? writeOffStoredInventoryReservation(reservationId) : cancelStoredInventoryReservation(reservationId);
    if (!result.ok) return notify(result.error);
    refreshOrder();
    notify(action === "writeOff" ? "Материал списан в заказ" : "Резерв снят");
  };

  const createOrderDocument = (type: DocumentType) => {
    if (!order) return;
    const result = addStoredDocumentForOrder({ orderId: order.id, type, comment: `Сформировано из карточки заказа ${order.id}` });
    if (!result.ok) return notify(result.error);
    refreshOrder();
    notify(`${type} сформирован`);
  };

  order = currentOrder;

  if (!order) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f6f9] p-6">
        <section className="card w-full max-w-lg text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600"><ClipboardList className="h-7 w-7" /></span>
          <h1 className="mt-5 text-2xl font-bold text-slate-950">Заказ не найден</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Проверьте номер заказа или вернитесь к общему списку.</p>
          <Link href="/orders" className="btn-primary mt-6"><ArrowLeft className="h-4 w-4" />Вернуться к списку</Link>
        </section>
      </main>
    );
  }

  const remaining = Math.max(0, order.amount - order.paid);
  const paymentProgress = order.amount ? Math.min(100, Math.round((order.paid / order.amount) * 100)) : 0;
  const services = [
    ["Доставка", 3000, true], ["Установка", 8000, true], ["Демонтаж", 5000, true], ["Заливка основания", 7000, true],
    ["Ограда", 0, false], ["Укладка плитки", 0, false], ["Уборка места", 0, false], ["Дополнительные услуги", 0, false],
  ] as const;
  const files = [
    ["Фото участка", "uchastok-01.jpg", "JPG"], ["Фото для портрета", "portrait-original.jpg", "JPG"],
    ["Эскиз", "eskiz-v2.pdf", "PDF"], ["Макет", "maket-soglasovan.pdf", "PDF"],
    ["Договор", `dogovor-${order.id}.pdf`, "PDF"], ["Наряд-заказ", `naryad-${order.id}.pdf`, "PDF"],
    ["Фото после установки", order.installationStatus === "Установлено" ? "result-01.jpg" : "Ожидается", "JPG"],
  ];
  const fallbackHistory: Array<[string, string, string]> = [
    [order.deadlineLabel, "Заказ создан", order.client],
    [order.paymentMethod, "Оплата по заказу", money(order.paid)],
    [order.productionStage, "Текущий этап производства", order.master],
    [order.installationStatus, "Статус установки", order.installationDate],
  ];
  const formatEventDate = (value: string) => new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  const selectedInventoryItem = inventoryItems.find((item) => item.id === inventoryForm.itemId);
  const activeInventoryReservations = inventoryReservations.filter((reservation) => reservation.status === "Активен");
  const reservedInventoryQuantity = activeInventoryReservations.reduce((sum, reservation) => sum + reservation.quantity, 0);
  const inventoryCost = inventoryReservations.reduce((sum, reservation) => {
    const item = inventoryItems.find((row) => row.id === reservation.itemId);
    return sum + reservation.quantity * (item?.cost ?? 0);
  }, 0);

  const summaryCards = [
    ["Данные клиента", [["Заказчик", order.client], ["Телефон", order.phone], ["Адрес", order.address]]],
    ["Место установки", [["Кладбище", order.cemetery], ["Участок", `${order.section}, ряд ${order.row}, место ${order.place}`], ["Захороненный", order.deceased]]],
    ["Изделие", [["Тип", order.product], ["Материал", order.material], ["Размер стелы", order.steleSize]]],
    ["Оформление", [["Портрет", `${order.portrait}, ${order.portraitSize}`], ["Эпитафия", order.epitaph], ["Макет", order.layoutApproval]]],
    ["Услуги", [["Выбрано", "4 услуги"], ["Стоимость", money(order.servicesPrice)], ["Установка", order.installationStatus]]],
    ["Оплата", [["Итого", money(order.amount)], ["Оплачено", money(order.paid)], ["Остаток", money(remaining)]]],
    ["Производство", [["Мастер", order.master], ["Этап", order.productionStage], ["Статус", order.productionStatus]]],
    ["Склад", [["Активные резервы", `${activeInventoryReservations.length}`], ["Зарезервировано", `${reservedInventoryQuantity} шт.`], ["Себестоимость", money(inventoryCost)]]],
    ["Документы", [["Всего", `${documents.length}`], ["Сформировано", `${documents.filter((document) => document.status === "Сформирован").length}`], ["Последний", documents[0]?.type ?? "нет"]]],
    ["Файлы", [["Загружено", "6 файлов"], ["Последний", "Макет согласован"], ["Договор", "Подписан"]]],
  ] as const;

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      {sidebar && <button aria-label="Закрыть меню" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebar(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-navy-950 text-white transition-transform lg:translate-x-0 ${sidebar ? "translate-x-0" : "-translate-x-full"}`}>
        <Link href="/" className="flex h-[82px] items-center border-b border-white/10 px-6">
          <div className="mr-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-600"><LayoutDashboard className="h-5 w-5" /></div>
          <div><div className="font-bold tracking-[0.18em]">ПАМЯТЬ</div><div className="text-xs text-slate-400">ритуальная мастерская</div></div>
        </Link>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map(([Icon, label]) => label === "Главная" ? (
            <Link key={label} href="/" className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Icon className="h-[18px] w-[18px]" />{label}
            </Link>
          ) : label === "Заказы" ? (
            <Link key={label} href="/orders" className="flex h-11 w-full items-center gap-3 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white shadow-lg shadow-blue-950/20">
              <Icon className="h-[18px] w-[18px]" />{label}<span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-xs">12</span>
            </Link>
          ) : label === "Клиенты" ? (
            <Link key={label} href="/clients" className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Icon className="h-[18px] w-[18px]" />{label}
            </Link>
          ) : label === "Производство" ? (
            <Link key={label} href="/production" className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Icon className="h-[18px] w-[18px]" />{label}
            </Link>
          ) : label === "Установка" ? (
            <Link key={label} href="/installation" className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Icon className="h-[18px] w-[18px]" />{label}
            </Link>
          ) : label === "Склад" ? (
            <Link key={label} href="/warehouse" className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Icon className="h-[18px] w-[18px]" />{label}
            </Link>
          ) : label === "Финансы" ? (
            <Link key={label} href="/finance" className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Icon className="h-[18px] w-[18px]" />{label}
            </Link>
          ) : label === "Документы" ? (
            <Link key={label} href="/documents" className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Icon className="h-[18px] w-[18px]" />{label}
            </Link>
          ) : label === "Настройки" ? (
            <Link key={label} href="/settings" className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Icon className="h-[18px] w-[18px]" />{label}
            </Link>
          ) : (
            <button key={label} className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"><Icon className="h-[18px] w-[18px]" />{label}</button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-sm font-semibold">ТИ</div><div><div className="text-sm font-semibold">Тимофеев И.</div><div className="text-xs text-slate-400">Менеджер</div></div></div>
        </div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[70px] min-w-0 items-center gap-2 border-b bg-white/95 px-4 backdrop-blur md:gap-3 md:px-7">
          <button aria-label="Открыть меню" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border lg:hidden" onClick={() => setSidebar(true)}><Menu className="h-5 w-5" /></button>
          <div className="relative min-w-0 max-w-xl flex-1"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><input className="input bg-slate-50 pl-10" placeholder="Поиск по заказам, клиентам, телефонам..." /></div>
          <button className="btn-primary hidden md:inline-flex" onClick={() => openPaymentModal("Доплата", "Перевод")}><HandCoins className="h-4 w-4" />Принять оплату</button>
          <Link href="/orders/new" className="btn-secondary hidden md:inline-flex"><Plus className="h-4 w-4" />Создать заказ</Link>
          {[CalendarDays, Bell, CircleHelp].map((Icon, index) => <button key={index} aria-label={["Календарь", "Уведомления", "Помощь"][index]} className={`relative h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 ${index === 1 ? "hidden sm:grid" : "hidden md:grid"}`}><Icon className="h-5 w-5" />{index === 1 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />}</button>)}
        </header>

        <main className="mx-auto max-w-[1600px] p-4 md:p-7 xl:p-8">
          <div className="mb-5 text-sm text-slate-500"><Link href="/orders" className="hover:text-brand-600">Заказы</Link><span className="mx-2">/</span><span className="text-slate-800">{order.id}</span></div>

          <section className="mb-6 overflow-hidden rounded-2xl border bg-white shadow-card">
            <div className="border-b p-5 md:p-6">
              <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">Заказ {order.id}</h1><StatusBadge status={status} /></div>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                    <span><b className="text-slate-700">{order.client}</b></span><span>{order.phone}</span><span>Срок: <b className="text-slate-700">{order.deadlineLabel}</b></span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/orders/new?edit=${order.id}`} className="btn-secondary"><Pencil className="h-4 w-4" />Редактировать</Link>
                  <button className="btn-secondary" onClick={() => createOrderDocument("Наряд-заказ")}><Printer className="h-4 w-4" />Сформировать наряд-заказ</button>
                  <button className="btn-secondary" onClick={() => notify("Документы подготовлены к отправке клиенту")}><Send className="h-4 w-4" />Отправить клиенту</button>
                  <div className="relative">
                    <button className="btn-primary" onClick={() => setStatusMenu((value) => !value)}>Изменить статус<ChevronDown className="h-4 w-4" /></button>
                    {statusMenu && <div className="absolute right-0 top-12 z-20 w-52 rounded-xl border bg-white p-2 shadow-xl">{orderStatuses.map((item) => <button key={item} className="flex w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => changeOrderStatus(item)}>{item}</button>)}</div>}
                  </div>
                  <Link href="/orders" className="btn-secondary"><ArrowLeft className="h-4 w-4" />Назад к списку</Link>
                </div>
              </div>
            </div>
            <div className="grid divide-y bg-slate-50/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
              {[["Итоговая сумма", money(order.amount), "text-slate-950"], ["Оплачено", money(order.paid), "text-emerald-600"], ["Остаток", money(remaining), remaining ? "text-orange-600" : "text-emerald-600"], ["Срок изготовления", order.deadlineLabel, "text-brand-700"]].map(([label, value, color]) => <div key={label} className="px-5 py-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-1 text-xl font-bold ${color}`}>{value}</p></div>)}
            </div>
          </section>

          <section className="mb-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-card">
            <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Касса заказа</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">{remaining > 0 ? `Осталось принять ${money(remaining)}` : "Заказ полностью оплачен"}</h2>
                <p className="mt-1 text-sm text-slate-500">Если клиент перевел деньги, нажми “Принять оплату”, введи сумму и способ оплаты.</p>
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm"><span className="text-slate-500">Оплачено</span><b className="text-slate-900">{paymentProgress}%</b></div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${paymentProgress}%` }} /></div>
                <div className="mt-2 flex justify-between text-xs text-slate-500"><span>{money(order.paid)}</span><span>{money(order.amount)}</span></div>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <button className="btn-primary" onClick={() => openPaymentModal("Доплата", "Перевод")}><HandCoins className="h-4 w-4" />Принять оплату</button>
                {remaining > 0 && <button className="btn-secondary" onClick={() => openPaymentModal("Полная оплата", "Перевод")}>Оплатить остаток</button>}
                <button className="btn-secondary border-red-200 text-red-700 hover:bg-red-50" onClick={() => openPaymentModal("Возврат", order.paymentMethod as PaymentMethod)}>Возврат</button>
              </div>
            </div>
          </section>

          <div className="mb-6 overflow-x-auto rounded-2xl border bg-white px-2 shadow-card">
            <div className="flex min-w-max">
              {tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`relative px-4 py-4 text-sm font-semibold transition ${activeTab === tab ? "text-brand-700" : "text-slate-500 hover:text-slate-800"}`}>{tab}{activeTab === tab && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-600" />}</button>)}
            </div>
          </div>

          {activeTab === "Общая информация" && <div className="grid gap-5 xl:grid-cols-2">{summaryCards.map(([title, items]) => <Section key={title} title={title}><InfoGrid columns={3} items={items.map(([label, value]) => [label, value])} /></Section>)}</div>}

          {activeTab === "Клиент" && <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <Section title="Данные клиента" subtitle="Контактная информация заказчика"><InfoGrid items={[["ФИО заказчика", order.client], ["Телефон", order.phone], ["Дополнительный телефон", order.additionalPhone], ["Адрес", order.address], ["Источник клиента", order.source], ["Комментарий", order.customerComment]]} /></Section>
            <Section title="История заказов клиента" subtitle="Предыдущие обращения"><div className="space-y-3">{[[order.id, order.product, status], ["ЗК-2024-0084", "Ограда и благоустройство", "Завершен"]].map(([id, product, state]) => <div key={id} className="flex items-center justify-between rounded-xl border p-4"><div><p className="font-semibold text-brand-700">{id}</p><p className="mt-1 text-sm text-slate-500">{product}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{state}</span></div>)}</div></Section>
          </div>}

          {activeTab === "Изделие" && <div className="space-y-5">
            <Section title="Характеристики изделия"><InfoGrid columns={4} items={[["Тип памятника", order.product], ["Материал", order.material], ["Цвет", order.color], ["Форма", order.shape], ["Полировка", order.polishing], ["Размеры стелы", order.steleSize], ["Размеры подставки", order.baseSize], ["Размеры цветника", order.flowerBedSize]]} /></Section>
            <Section title="Комплектация"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{["Наименование", "Размеры", "Материал", "Кол-во", "Цена"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{[["Стела", order.steleSize, order.material, "1 шт.", 66000], ["Подставка", order.baseSize, order.material, "1 шт.", 8500], ["Цветник", order.flowerBedSize, order.material, "1 шт.", 12000], ["Портрет", order.portraitSize, "Керамика", "1 шт.", 4500], ["Декор", "Стандарт", "Бронза", "1 шт.", 3000]].map((row) => <tr key={String(row[0])} className="border-b last:border-0">{row.map((cell, index) => <td key={index} className={`px-4 py-4 ${index === 0 ? "font-semibold" : "text-slate-600"}`}>{index === 4 ? money(Number(cell)) : cell}</td>)}</tr>)}</tbody></table></div></Section>
          </div>}

          {activeTab === "Оформление" && <Section title="Оформление памятника" subtitle="Текст, портрет и декоративные элементы"><InfoGrid items={[["Портрет", order.portrait], ["Размер портрета", order.portraitSize], ["Надпись", order.inscription], ["Даты", order.dates], ["Эпитафия", order.epitaph], ["Крест / декор", order.decor], ["Шрифт", order.font], ["Согласование макета", <span key="approval" className={`rounded-full px-2.5 py-1 text-xs ${order.layoutApproval === "Макет согласован" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{order.layoutApproval}</span>]]} /></Section>}

          {activeTab === "Услуги" && <Section title="Услуги по заказу" subtitle="Выбранные и доступные работы"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{services.map(([name, price, selected]) => <div key={name} className={`rounded-xl border p-4 ${selected ? "border-brand-200 bg-brand-50/50" : "bg-slate-50 opacity-65"}`}><div className="flex items-center justify-between"><span className={`grid h-6 w-6 place-items-center rounded-full ${selected ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-400"}`}>{selected && <Check className="h-4 w-4" />}</span><span className="font-bold text-slate-800">{price ? money(price) : "Не выбрано"}</span></div><p className="mt-4 text-sm font-semibold text-slate-700">{name}</p></div>)}</div></Section>}

          {activeTab === "Оплата" && <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[["Стоимость изделия", order.productPrice, "text-slate-950"], ["Стоимость оформления", order.decorationPrice, "text-slate-950"], ["Стоимость услуг", order.servicesPrice, "text-slate-950"], ["Скидка", order.discount, "text-red-600"], ["Итоговая сумма", order.amount, "text-emerald-600"], ["Предоплата", order.paid, "text-brand-700"], ["Остаток", remaining, "text-orange-600"]].map(([label, value, color]) => <div key={String(label)} className="card p-5"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${color}`}>{money(Number(value))}</p></div>)}</div>
            <Section title="Управление оплатой" subtitle="Платежи сохраняются в финансах и сразу пересчитывают остаток">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <button className="btn-primary justify-center" onClick={() => openPaymentModal("Доплата", "Перевод")}><HandCoins className="h-4 w-4" />Принять оплату</button>
                <button className="btn-secondary justify-center" onClick={() => openPaymentModal("Возврат", order.paymentMethod as PaymentMethod)}>Оформить возврат</button>
                <button className="btn-secondary justify-center" onClick={() => openPaymentModal("Полная оплата", "Перевод")}>Оплатить остаток</button>
                <Link href="/finance" className="btn-secondary justify-center"><HandCoins className="h-4 w-4" />Открыть финансы</Link>
              </div>
            </Section>
            <Section title="История платежей" subtitle={`Последний способ оплаты: ${order.paymentMethod}`}>
              <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{["Дата", "Тип", "Сумма", "Способ оплаты", "Комментарий"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{order.payments.map((payment) => <tr key={payment.id} className="border-b last:border-0"><td className="px-4 py-4">{payment.date}</td><td className="px-4 py-4">{payment.type}</td><td className={`px-4 py-4 font-bold ${payment.type === "Возврат" ? "text-red-600" : "text-emerald-600"}`}>{money(payment.amount)}</td><td className="px-4 py-4">{payment.method}</td><td className="px-4 py-4 text-slate-500">{payment.comment}</td></tr>)}{!order.payments.length && <tr><td className="px-4 py-8 text-center text-slate-400" colSpan={5}>Платежей пока нет</td></tr>}</tbody></table></div>
            </Section>
          </div>}

          {activeTab === "Производство" && <div className="space-y-5">
            <Section title="Производство"><InfoGrid items={[["Ответственный мастер", order.master], ["Передан в производство", order.productionDate], ["Плановая дата готовности", order.deadlineLabel], ["Текущий этап", order.productionStage], ["Статус производства", order.productionStatus], ["Комментарий", order.productionComment]]} /></Section>
            <Section title="Планирование производства" subtitle="Мастер, плановая готовность и комментарий сохраняются в производственной доске">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label><span className="field-label">Мастер</span><select className="input" value={order.masterId} onChange={(event) => updateProductionPlanning({ masterId: event.target.value })}>{masters.map((master) => <option key={master.id} value={master.id}>{master.fullName} — {master.specialization}</option>)}</select></label>
                <label><span className="field-label">Плановая готовность</span><input className="input" type="date" value={order.productionDeadline} onChange={(event) => updateProductionPlanning({ plannedReadyAt: event.target.value })} /></label>
                <label className="md:col-span-2"><span className="field-label">Комментарий производства</span><textarea className="textarea min-h-[46px]" value={order.productionComment} onChange={(event) => updateProductionPlanning({ comment: event.target.value })} /></label>
              </div>
            </Section>
            <Section title="Этапы производства" subtitle="Нажмите на этап, чтобы сохранить его в заказе и производственной доске"><div className="flex min-w-max items-center overflow-x-auto pb-2">{productionStages.map((stage, index) => { const current = productionStages.indexOf(order.productionStage as ProductionStage); const done = index <= Math.max(current, 0); return <div key={stage} className="flex items-center"><button className="text-center" onClick={() => changeProductionStage(stage)}><span className={`mx-auto grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${done ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400"}`}>{done ? <Check className="h-4 w-4" /> : index + 1}</span><p className={`mt-2 w-28 text-xs font-medium ${done ? "text-brand-700" : "text-slate-400"}`}>{stage}</p></button>{index < productionStages.length - 1 && <div className={`mb-5 h-0.5 w-8 ${index < current ? "bg-brand-500" : "bg-slate-200"}`} />}</div>; })}</div></Section>
          </div>}

          {activeTab === "Установка" && <div className="space-y-5">
            <Section title="Установка" subtitle="Планирование и результат выезда"><InfoGrid items={[["Дата установки", order.installationDate], ["Кладбище", order.cemetery], ["Участок", order.section], ["Ряд", order.row], ["Место", order.place], ["Бригада", order.crew], ["Статус установки", <span key="install" className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs text-cyan-700">{order.installationStatus}</span>], ["Комментарий установщика", order.installerComment]]} /></Section>
            <Section title="Планирование установки" subtitle="Дата, время, бригада и комментарий сохраняются в календаре установки">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label><span className="field-label">Дата</span><input className="input" type="date" value={order.installationRawDate} onChange={(event) => updateInstallationPlanning({ date: event.target.value })} /></label>
                <label><span className="field-label">Время</span><input className="input" type="time" value={order.installationTime} onChange={(event) => updateInstallationPlanning({ time: event.target.value })} /></label>
                <label><span className="field-label">Бригада</span><select className="input" value={order.brigadeId} onChange={(event) => updateInstallationPlanning({ brigadeId: event.target.value })}>{brigades.map((brigade) => <option key={brigade.id} value={brigade.id}>{brigade.name} — {brigade.members}</option>)}</select></label>
                <label><span className="field-label">Статус</span><select className="input" value={order.installationStatus} onChange={(event) => changeInstallationStatus(event.target.value as InstallationStatus)}>{installationStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label className="md:col-span-2 xl:col-span-4"><span className="field-label">Комментарий установки</span><textarea className="textarea min-h-[46px]" value={order.installerComment} onChange={(event) => updateInstallationPlanning({ comment: event.target.value })} /></label>
              </div>
            </Section>
            <Section title="Статусы установки" subtitle="Статус сохраняется и отображается в разделе установки"><div className="flex flex-wrap gap-2">{installationStatuses.map((item) => <button key={item} onClick={() => changeInstallationStatus(item)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${item === order.installationStatus ? "bg-cyan-50 text-cyan-700 ring-cyan-200" : "bg-slate-50 text-slate-500 ring-slate-200 hover:bg-slate-100"}`}>{item}</button>)}</div></Section>
          </div>}

          {activeTab === "Склад" && <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              {[["Активные резервы", activeInventoryReservations.length], ["Зарезервировано", `${reservedInventoryQuantity} шт.`], ["Себестоимость резерва", money(inventoryCost)]].map(([label, value]) => <div key={String(label)} className="card p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>)}
            </div>
            <Section title="Резерв материала" subtitle="Материал закрепляется за заказом и сразу отображается в общем складе">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.3fr_0.6fr_1fr_auto]">
                <label><span className="field-label">Материал</span><select className="input" value={inventoryForm.itemId} onChange={(event) => setInventoryForm((form) => ({ ...form, itemId: event.target.value }))}>{inventoryItems.map((item) => <option key={item.id} value={item.id}>{item.name} · доступно {getStoredInventoryAvailable(item.id)} {item.unit}</option>)}</select></label>
                <label><span className="field-label">Количество</span><input className="input" inputMode="decimal" value={inventoryForm.quantity} onChange={(event) => setInventoryForm((form) => ({ ...form, quantity: event.target.value }))} /></label>
                <label><span className="field-label">Комментарий</span><input className="input" value={inventoryForm.comment} onChange={(event) => setInventoryForm((form) => ({ ...form, comment: event.target.value }))} placeholder="Например: стела или цветник" /></label>
                <button className="btn-primary self-end" onClick={reserveInventory}><PackageCheck className="h-4 w-4" />Зарезервировать</button>
              </div>
              {selectedInventoryItem && <p className="mt-3 text-sm text-slate-500">Выбрано: <b className="text-slate-800">{selectedInventoryItem.name}</b>, доступно {getStoredInventoryAvailable(selectedInventoryItem.id)} {selectedInventoryItem.unit}, ячейка {selectedInventoryItem.location}.</p>}
            </Section>
            <Section title="Резервы заказа" subtitle="Активный резерв можно списать в заказ или снять со склада без списания">
              <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{["Материал", "Количество", "Статус", "Комментарий", "Создан", "Действия"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{inventoryReservations.map((reservation) => { const item = inventoryItems.find((row) => row.id === reservation.itemId); return <tr key={reservation.id} className="border-b last:border-0"><td className="px-4 py-4"><p className="font-semibold text-slate-900">{item?.name ?? "Материал"}</p><p className="mt-1 text-xs text-slate-500">{item?.location ?? "Склад"}</p></td><td className="px-4 py-4 font-semibold">{reservation.quantity} {item?.unit ?? "шт."}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${reservation.status === "Активен" ? "bg-blue-50 text-blue-700" : reservation.status === "Списан" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{reservation.status}</span></td><td className="px-4 py-4 text-slate-600">{reservation.comment}</td><td className="px-4 py-4 text-slate-500">{formatEventDate(reservation.createdAt)}</td><td className="px-4 py-4"><div className="flex gap-2">{reservation.status === "Активен" ? <><button className="btn-secondary h-9" onClick={() => closeInventoryReservation(reservation.id, "writeOff")}>Списать</button><button className="btn-secondary h-9 border-red-200 text-red-700 hover:bg-red-50" onClick={() => closeInventoryReservation(reservation.id, "cancel")}>Снять</button></> : <span className="text-xs text-slate-400">Закрыт</span>}</div></td></tr>; })}{!inventoryReservations.length && <tr><td className="px-4 py-8 text-center text-slate-400" colSpan={6}>Резервов по заказу пока нет</td></tr>}</tbody></table></div>
              <Link href="/warehouse" className="btn-secondary mt-5"><Package className="h-4 w-4" />Открыть общий склад</Link>
            </Section>
          </div>}

          {activeTab === "Документы" && <div className="space-y-5">
            <Section title="Сформировать документ" subtitle="Документ сохраняется в общий раздел документов и в историю заказа">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {documentTypes.map((type) => <button key={type} className="btn-secondary justify-center" onClick={() => createOrderDocument(type)}><FileText className="h-4 w-4" />{type}</button>)}
              </div>
            </Section>
            <Section title="Документы заказа" subtitle="Все документы, созданные по текущему заказу">
              <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{["№ документа", "Тип", "Дата", "Сумма", "Статус", "Комментарий"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{documents.map((document) => <tr key={document.id} className="border-b last:border-0"><td className="px-4 py-4 font-semibold text-brand-700">{document.number}</td><td className="px-4 py-4">{document.type}</td><td className="px-4 py-4 text-slate-600">{document.date}</td><td className="px-4 py-4 font-semibold">{money(document.amount)}</td><td className="px-4 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{document.status}</span></td><td className="px-4 py-4 text-slate-500">{document.comment}</td></tr>)}{!documents.length && <tr><td className="px-4 py-8 text-center text-slate-400" colSpan={6}>Документы по заказу пока не сформированы</td></tr>}</tbody></table></div>
              <Link href="/documents" className="btn-secondary mt-5"><FileText className="h-4 w-4" />Открыть общий раздел документов</Link>
            </Section>
          </div>}

          {activeTab === "Файлы" && <Section title="Файлы заказа" subtitle="Фотографии, макеты и документы"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{files.map(([label, name, type]) => <div key={label} className="rounded-xl border bg-slate-50 p-4"><div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-600 shadow-sm">{type === "JPG" ? <FileImage className="h-5 w-5" /> : <FileText className="h-5 w-5" />}</span><button className="icon-button text-slate-400 hover:bg-white hover:text-brand-600" onClick={() => notify(`Файл «${label}» подготовлен к скачиванию`)}><Download className="h-4 w-4" /></button></div><p className="mt-4 text-sm font-semibold text-slate-800">{label}</p><p className="mt-1 truncate text-xs text-slate-500">{name}</p></div>)}</div><button className="btn-secondary mt-5" onClick={() => notify("Загрузка файлов доступна в режиме редактирования")}><UploadCloud className="h-4 w-4" />Добавить файл</button></Section>}

          {activeTab === "История" && <Section title="История заказа" subtitle="Все важные события в хронологическом порядке"><div className="relative ml-2 border-l-2 border-slate-200 pl-7">{events.length ? events.map((event, index) => <div key={event.id} className="relative pb-7 last:pb-0"><span className={`absolute -left-[37px] top-0 grid h-5 w-5 place-items-center rounded-full border-4 border-white ${index === 0 ? "bg-brand-600" : "bg-emerald-500"}`} /><p className="text-xs font-medium text-slate-400">{formatEventDate(event.createdAt)} · {event.actor}</p><h3 className="mt-1 font-semibold text-slate-800">{event.title}</h3><p className="mt-1 text-sm text-slate-500">{event.detail}</p></div>) : fallbackHistory.map(([date, title, detail], index) => <div key={title} className="relative pb-7 last:pb-0"><span className={`absolute -left-[37px] top-0 grid h-5 w-5 place-items-center rounded-full border-4 border-white ${index === 0 ? "bg-brand-600" : "bg-emerald-500"}`} /><p className="text-xs font-medium text-slate-400">{date}</p><h3 className="mt-1 font-semibold text-slate-800">{title}</h3><p className="mt-1 text-sm text-slate-500">{detail}</p></div>)}</div></Section>}
        </main>
      </div>

      {paymentModal && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="text-xl font-bold text-slate-950">{paymentForm.type === "Возврат" ? "Оформить возврат" : "Принять оплату"}</h2><p className="mt-1 text-sm text-slate-500">Заказ {order.id}, остаток {money(remaining)}</p></div>
            <button className="icon-button text-slate-400 hover:bg-slate-100" onClick={() => setPaymentModal(false)}><X className="h-5 w-5" /></button>
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <button className={`btn-secondary justify-center ${paymentForm.type === "Доплата" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}`} onClick={() => setPaymentForm((form) => ({ ...form, type: "Доплата", amount: "", method: "Перевод" }))}>Клиент перевел</button>
            <button className={`btn-secondary justify-center ${paymentForm.type === "Полная оплата" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}`} onClick={() => setPaymentForm((form) => ({ ...form, type: "Полная оплата", amount: String(remaining), method: "Перевод" }))}>Оплатить остаток</button>
            <button className={`btn-secondary justify-center ${paymentForm.type === "Возврат" ? "border-red-200 bg-red-50 text-red-700" : ""}`} onClick={() => setPaymentForm((form) => ({ ...form, type: "Возврат", amount: "", method: order.paymentMethod as PaymentMethod }))}>Вернуть деньги</button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label><span className="field-label">Тип платежа</span><select className="input" value={paymentForm.type} onChange={(event) => { const type = event.target.value as PaymentType; setPaymentForm((form) => ({ ...form, type, amount: type === "Полная оплата" ? String(remaining) : "" })); }}>{paymentTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span className="field-label">Сумма</span><input className="input" inputMode="numeric" placeholder={paymentForm.type === "Возврат" ? "Сколько вернуть" : "Сколько пришло"} value={paymentForm.amount} disabled={paymentForm.type === "Полная оплата"} onChange={(event) => setPaymentForm((form) => ({ ...form, amount: event.target.value }))} /></label>
            <label><span className="field-label">Способ оплаты</span><select className="input" value={paymentForm.method} onChange={(event) => setPaymentForm((form) => ({ ...form, method: event.target.value as PaymentMethod }))}>{paymentMethods.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span className="field-label">Дата</span><input className="input" type="date" value={paymentForm.date} onChange={(event) => setPaymentForm((form) => ({ ...form, date: event.target.value }))} /></label>
            <label className="md:col-span-2"><span className="field-label">Комментарий</span><textarea className="textarea" value={paymentForm.comment} onChange={(event) => setPaymentForm((form) => ({ ...form, comment: event.target.value }))} placeholder="Например: доплата после согласования макета" /></label>
          </div>
          <div className="mt-6 flex justify-end gap-2"><button className="btn-secondary" onClick={() => setPaymentModal(false)}>Отмена</button><button className="btn-primary" onClick={savePayment}>{paymentForm.type === "Возврат" ? "Сохранить возврат" : "Принять деньги"}</button></div>
        </div>
      </div>}
      {toast && <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500"><Check className="h-4 w-4" /></span>{toast}<button aria-label="Закрыть уведомление" onClick={() => setToast("")}><X className="h-4 w-4 text-slate-400" /></button></div>}
    </div>
  );
}
