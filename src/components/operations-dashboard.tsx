"use client";

import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  HandCoins,
  HardHat,
  LayoutDashboard,
  Menu,
  Package,
  PackageCheck,
  Plus,
  Receipt,
  Search,
  Settings,
  ShieldAlert,
  TrendingUp,
  UsersRound,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { brigades, statuses } from "@/data/mock-data";
import {
  getStoredClients,
  getStoredDocuments,
  getStoredInstallationTasks,
  getStoredInventoryItems,
  getStoredOrders,
  getStoredPayments,
  getStoredProductionTasks,
} from "@/lib/storage";
import type { Client, Document, InstallationTask, InventoryItem, Order, OrderStatus, Payment, ProductionTask } from "@/types/crm";

const nav = [
  [LayoutDashboard, "Главная", "/"],
  [ClipboardList, "Заказы", "/orders"],
  [UsersRound, "Клиенты", "/clients"],
  [HardHat, "Производство", "/production"],
  [PackageCheck, "Установка", "/installation"],
  [Package, "Склад", "/warehouse"],
  [HandCoins, "Финансы", "/finance"],
  [FileText, "Документы", "/documents"],
  [Settings, "Настройки", "/settings"],
] satisfies ReadonlyArray<readonly [LucideIcon, string, string]>;

const quickActions = [
  [Plus, "Новый заказ", "/orders/new"],
  [Search, "Найти клиента", "/clients"],
  [WalletCards, "Принять оплату", "/finance"],
  [FileText, "Создать документ", "/documents"],
  [PackageCheck, "Назначить установку", "/installation"],
] satisfies ReadonlyArray<readonly [LucideIcon, string, string]>;

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;

const statusStyles: Record<OrderStatus, string> = {
  "Новый": "bg-blue-50 text-blue-700 ring-blue-200",
  "Макет": "bg-violet-50 text-violet-700 ring-violet-200",
  "В производстве": "bg-amber-50 text-amber-700 ring-amber-200",
  "Готов": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Установка": "bg-cyan-50 text-cyan-700 ring-cyan-200",
  "Завершен": "bg-slate-100 text-slate-600 ring-slate-200",
  "Проблема": "bg-red-50 text-red-700 ring-red-200",
};

type DashboardData = {
  orders: Order[];
  clients: Client[];
  payments: Payment[];
  production: ProductionTask[];
  installation: InstallationTask[];
  documents: Document[];
  inventory: InventoryItem[];
};

type AttentionItem = {
  id: string;
  tone: "danger" | "warning" | "info";
  title: string;
  detail: string;
  href: string;
  meta: string;
};

type WorkItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  label: string;
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function toTime(date: string) {
  return new Date(`${date}T00:00:00`).getTime();
}

function formatShortDate(date: string) {
  if (!date) return "без даты";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00`));
}

function readDashboardData(): DashboardData {
  return {
    orders: getStoredOrders(),
    clients: getStoredClients(),
    payments: getStoredPayments(),
    production: getStoredProductionTasks(),
    installation: getStoredInstallationTasks(),
    documents: getStoredDocuments(),
    inventory: getStoredInventoryItems(),
  };
}

function clientName(clients: Client[], clientId: string) {
  return clients.find((client) => client.id === clientId)?.fullName ?? "Клиент не найден";
}

function orderById(orders: Order[], orderId: string) {
  return orders.find((order) => order.id === orderId);
}

function installationCrew(task: InstallationTask) {
  const brigade = brigades.find((item) => item.id === task.brigadeId);
  return brigade ? `${brigade.name}: ${brigade.members}` : "бригада не назначена";
}

function buildAttention(data: DashboardData, todayKey: string): AttentionItem[] {
  const today = toTime(todayKey);
  const items: AttentionItem[] = [];

  data.orders
    .filter((order) => order.status === "Проблема")
    .forEach((order) => items.push({
      id: `problem-${order.id}`,
      tone: "danger",
      title: `${order.orderNumber}: проблема по заказу`,
      detail: `${clientName(data.clients, order.clientId)} · остаток ${money(order.remainingAmount)}`,
      href: `/orders/${order.orderNumber}`,
      meta: formatShortDate(order.deadline),
    }));

  data.orders
    .filter((order) => order.status !== "Завершен" && order.remainingAmount > 0 && toTime(order.deadline) <= today)
    .forEach((order) => items.push({
      id: `payment-${order.id}`,
      tone: "warning",
      title: `${order.orderNumber}: нужна доплата`,
      detail: `${clientName(data.clients, order.clientId)} · ${money(order.remainingAmount)}`,
      href: `/orders/${order.orderNumber}`,
      meta: `срок ${formatShortDate(order.deadline)}`,
    }));

  data.production
    .filter((task) => task.stage !== "Готов" && task.plannedReadyAt && toTime(task.plannedReadyAt) < today)
    .forEach((task) => {
      const order = orderById(data.orders, task.orderId);
      if (!order) return;
      items.push({
        id: `production-${task.id}`,
        tone: "danger",
        title: `${order.orderNumber}: производство просрочено`,
        detail: `${task.stage} · ${order.monumentType}`,
        href: `/orders/${order.orderNumber}`,
        meta: formatShortDate(task.plannedReadyAt),
      });
    });

  data.installation
    .filter((task) => ["Проблема", "Перенос"].includes(task.status) || (task.date && task.status !== "Установлено" && toTime(task.date) < today))
    .forEach((task) => {
      const order = orderById(data.orders, task.orderId);
      if (!order) return;
      items.push({
        id: `install-${task.id}`,
        tone: task.status === "Проблема" ? "danger" : "warning",
        title: `${order.orderNumber}: установка требует решения`,
        detail: `${task.status} · ${installationCrew(task)}`,
        href: `/orders/${order.orderNumber}`,
        meta: formatShortDate(task.date),
      });
    });

  data.inventory
    .filter((item) => item.onHand <= item.minStock)
    .forEach((item) => items.push({
      id: `stock-${item.id}`,
      tone: "info",
      title: `Склад: ${item.name}`,
      detail: `остаток ${item.onHand} ${item.unit}, минимум ${item.minStock}`,
      href: "/warehouse",
      meta: item.location,
    }));

  data.documents
    .filter((document) => !["Подписан", "Архив"].includes(document.status))
    .slice(0, 4)
    .forEach((document) => {
      const order = orderById(data.orders, document.orderId);
      items.push({
        id: `doc-${document.id}`,
        tone: "info",
        title: `${document.type}: не закрыт документ`,
        detail: `${order?.orderNumber ?? document.orderId} · ${document.status}`,
        href: "/documents",
        meta: formatShortDate(document.date),
      });
    });

  const toneRank = { danger: 0, warning: 1, info: 2 };
  return items.sort((first, second) => toneRank[first.tone] - toneRank[second.tone]).slice(0, 9);
}

function buildTodayWork(data: DashboardData, todayKey: string, tomorrowKey: string): WorkItem[] {
  const work: WorkItem[] = [];

  data.installation
    .filter((task) => [todayKey, tomorrowKey].includes(task.date) && task.status !== "Установлено")
    .forEach((task) => {
      const order = orderById(data.orders, task.orderId);
      if (!order) return;
      work.push({
        id: `today-install-${task.id}`,
        title: `${task.time || "время не указано"} · ${order.cemetery}`,
        detail: `${order.orderNumber}, ${clientName(data.clients, order.clientId)} · ${installationCrew(task)}`,
        href: `/orders/${order.orderNumber}`,
        label: task.date === todayKey ? "сегодня" : "завтра",
      });
    });

  data.production
    .filter((task) => [todayKey, tomorrowKey].includes(task.plannedReadyAt) && task.stage !== "Готов")
    .forEach((task) => {
      const order = orderById(data.orders, task.orderId);
      if (!order) return;
      work.push({
        id: `today-production-${task.id}`,
        title: `Производство: ${task.stage}`,
        detail: `${order.orderNumber}, ${order.monumentType} · готовность ${formatShortDate(task.plannedReadyAt)}`,
        href: `/orders/${order.orderNumber}`,
        label: task.plannedReadyAt === todayKey ? "сегодня" : "завтра",
      });
    });

  data.orders
    .filter((order) => [todayKey, tomorrowKey].includes(order.deadline) && order.status !== "Завершен")
    .forEach((order) => work.push({
      id: `today-order-${order.id}`,
      title: `${order.orderNumber}: срок заказа`,
      detail: `${clientName(data.clients, order.clientId)} · ${order.status}`,
      href: `/orders/${order.orderNumber}`,
      label: order.deadline === todayKey ? "сегодня" : "завтра",
    }));

  if (work.length) return work.slice(0, 7);

  return data.orders
    .filter((order) => order.status !== "Завершен")
    .sort((first, second) => toTime(first.deadline) - toTime(second.deadline))
    .slice(0, 5)
    .map((order) => ({
      id: `fallback-${order.id}`,
      title: `${order.orderNumber}: ближайший контроль`,
      detail: `${clientName(data.clients, order.clientId)} · ${order.status} · остаток ${money(order.remainingAmount)}`,
      href: `/orders/${order.orderNumber}`,
      label: formatShortDate(order.deadline),
    }));
}

export function OperationsDashboard() {
  const [data, setData] = useState<DashboardData>(() => ({
    orders: [],
    clients: [],
    payments: [],
    production: [],
    installation: [],
    documents: [],
    inventory: [],
  }));
  const [sidebar, setSidebar] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const refresh = () => setData(readDashboardData());
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const today = useMemo(() => new Date(), []);
  const todayKey = formatDateKey(today);
  const tomorrowKey = formatDateKey(addDays(today, 1));

  const clientById = useMemo(() => new Map(data.clients.map((client) => [client.id, client])), [data.clients]);
  const activeOrders = data.orders.filter((order) => order.status !== "Завершен");
  const remainingTotal = activeOrders.reduce((sum, order) => sum + Math.max(0, order.remainingAmount), 0);
  const paidToday = data.payments
    .filter((payment) => payment.date === todayKey)
    .reduce((sum, payment) => sum + (payment.type === "Возврат" ? -payment.amount : payment.amount), 0);
  const overdueOrders = activeOrders.filter((order) => toTime(order.deadline) < toTime(todayKey));
  const productionInWork = data.production.filter((task) => task.stage !== "Готов");
  const installationTodayTomorrow = data.installation.filter((task) => [todayKey, tomorrowKey].includes(task.date) && task.status !== "Установлено");
  const attention = buildAttention(data, todayKey);
  const todayWork = buildTodayWork(data, todayKey, tomorrowKey);
  const pipeline = statuses.orders.map((status) => {
    const orders = data.orders.filter((order) => order.status === status);
    return { status, count: orders.length, amount: orders.reduce((sum, order) => sum + order.totalAmount, 0) };
  });
  const maxPipeline = Math.max(1, ...pipeline.map((item) => item.count));
  const filteredOrders = query.trim()
    ? data.orders.filter((order) => {
      const client = clientById.get(order.clientId);
      const normalized = query.trim().toLowerCase();
      return [order.orderNumber, client?.fullName, client?.phone, order.monumentType, order.material].some((value) => value?.toLowerCase().includes(normalized));
    }).slice(0, 6)
    : activeOrders.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      {sidebar && <button aria-label="Закрыть меню" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebar(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-navy-950 text-white transition-transform lg:translate-x-0 ${sidebar ? "translate-x-0" : "-translate-x-full"}`}>
        <Link href="/" className="flex h-[82px] items-center border-b border-white/10 px-6">
          <div className="mr-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-600"><LayoutDashboard className="h-5 w-5" /></div>
          <div><div className="font-bold tracking-[0.18em]">ПАМЯТЬ</div><div className="text-xs text-slate-400">ритуальная мастерская</div></div>
        </Link>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map(([Icon, label, href]) => (
            <Link key={label} href={href} className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${href === "/" ? "bg-brand-600 text-white shadow-lg shadow-blue-950/20" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
              <Icon className="h-[18px] w-[18px]" />{label}
              {label === "Главная" && attention.length > 0 && <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-xs">{attention.length}</span>}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-sm font-semibold">ТИ</div>
            <div><div className="text-sm font-semibold">Тимофеев И.</div><div className="text-xs text-slate-400">Менеджер</div></div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[70px] min-w-0 items-center gap-2 border-b bg-white/95 px-4 backdrop-blur md:gap-3 md:px-7">
          <button aria-label="Открыть меню" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border lg:hidden" onClick={() => setSidebar(true)}><Menu className="h-5 w-5" /></button>
          <div className="relative min-w-0 max-w-xl flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input className="input bg-slate-50 pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Быстрый поиск заказа, клиента или телефона..." />
          </div>
          <Link href="/orders/new" className="btn-primary hidden md:inline-flex"><Plus className="h-4 w-4" />Новый заказ</Link>
          {[CalendarDays, Bell].map((Icon, index) => (
            <button key={index} aria-label={["Календарь", "Уведомления"][index]} className="relative hidden h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 sm:grid">
              <Icon className="h-5 w-5" />{index === 1 && attention.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />}
            </button>
          ))}
        </header>

        <main className="mx-auto max-w-[1700px] p-4 md:p-7 xl:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 text-sm text-slate-500"><span className="font-medium text-slate-800">Главная</span> <span className="mx-2">/</span> <span className="text-slate-800">Рабочий пульт</span></div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">Рабочий пульт CRM</h1>
              <p className="mt-1 max-w-3xl text-slate-500">Заказы, деньги, производство и установки в одном экране. Данные берутся из localStorage и пересчитываются после изменений в связанных разделах.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/orders/new" className="btn-primary md:hidden"><Plus className="h-4 w-4" />Новый заказ</Link>
              <Link href="/finance" className="btn-secondary"><WalletCards className="h-4 w-4" />Финансы</Link>
              <Link href="/production" className="btn-secondary"><HardHat className="h-4 w-4" />Производство</Link>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Заказы в работе", value: activeOrders.length.toString(), note: `${data.orders.length} всего`, Icon: ClipboardList, color: "bg-blue-50 text-blue-600" },
              { label: "Требует внимания", value: attention.length.toString(), note: "проблемы, долги, сроки", Icon: ShieldAlert, color: "bg-red-50 text-red-600" },
              { label: "Остаток к оплате", value: money(remainingTotal), note: "по активным заказам", Icon: Receipt, color: "bg-orange-50 text-orange-600" },
              { label: "Производство", value: productionInWork.length.toString(), note: "задач в работе", Icon: HardHat, color: "bg-amber-50 text-amber-600" },
              { label: "Установки", value: installationTodayTomorrow.length.toString(), note: "сегодня и завтра", Icon: PackageCheck, color: "bg-cyan-50 text-cyan-600" },
            ].map(({ label, value, note, Icon, color }) => (
              <section key={label} className="card flex items-start justify-between p-5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950">{value}</p>
                  <p className="mt-1 text-xs text-slate-400">{note}</p>
                </div>
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span>
              </section>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <section className="card p-0">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h2 className="font-bold text-slate-950">Требует внимания</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Очередь решений по срокам, оплатам, установке и складу</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="divide-y">
                {attention.length ? attention.map((item) => (
                  <Link key={item.id} href={item.href} className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.tone === "danger" ? "bg-red-500" : item.tone === "warning" ? "bg-orange-500" : "bg-blue-500"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-0.5 truncate text-sm text-slate-500">{item.detail}</p>
                    </div>
                    <span className="hidden whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 sm:inline-flex">{item.meta}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </Link>
                )) : (
                  <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    <h3 className="mt-3 font-semibold text-slate-900">Критичных задач нет</h3>
                    <p className="mt-1 text-sm text-slate-500">Можно спокойно пройти ближайшие заказы и план производства.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="card p-0">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h2 className="font-bold text-slate-950">Сегодня и завтра</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Ближайшие действия по заказам</p>
                </div>
                <CalendarDays className="h-5 w-5 text-brand-600" />
              </div>
              <div className="divide-y">
                {todayWork.map((item) => (
                  <Link key={item.id} href={item.href} className="block px-5 py-4 transition hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.detail}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{item.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <section className="card">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-bold text-slate-950">Воронка заказов</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Количество и сумма по статусам</p>
                </div>
                <TrendingUp className="h-5 w-5 text-brand-600" />
              </div>
              <div className="space-y-4">
                {pipeline.map((item) => (
                  <div key={item.status}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[item.status]}`}>{item.status}</span>
                      <span className="font-semibold text-slate-700">{item.count} · {money(item.amount)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.max(7, item.count / maxPipeline * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card p-0">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h2 className="font-bold text-slate-950">{query.trim() ? "Результаты поиска" : "Активные заказы"}</h2>
                  <p className="mt-0.5 text-sm text-slate-500">{query.trim() ? `Запрос: ${query}` : "Быстрый переход в карточку заказа"}</p>
                </div>
                <Link href="/orders" className="btn-secondary h-9">Все заказы</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                      {["Заказ", "Клиент", "Статус", "Срок", "Остаток"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      const client = clientById.get(order.clientId);
                      return (
                        <tr key={order.id} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="px-4 py-4"><Link href={`/orders/${order.orderNumber}`} className="font-semibold text-brand-700">{order.orderNumber}</Link></td>
                          <td className="px-4 py-4"><div className="font-medium text-slate-800">{client?.fullName ?? "Клиент не найден"}</div><div className="text-xs text-slate-500">{client?.phone}</div></td>
                          <td className="px-4 py-4"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[order.status]}`}>{order.status}</span></td>
                          <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatShortDate(order.deadline)}</td>
                          <td className={`whitespace-nowrap px-4 py-4 font-bold ${order.remainingAmount > 0 ? "text-orange-600" : "text-emerald-600"}`}>{money(order.remainingAmount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <section className="card">
              <h2 className="font-bold text-slate-950">Быстрые действия</h2>
              <div className="mt-4 grid gap-2">
                {quickActions.map(([Icon, label, href]) => (
                  <Link key={label} href={href} className="flex h-11 items-center gap-3 rounded-lg border px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    <Icon className="h-4 w-4 text-brand-600" />{label}<ArrowRight className="ml-auto h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </section>

            <section className="card">
              <h2 className="font-bold text-slate-950">Деньги</h2>
              <div className="mt-4 space-y-4">
                {[
                  ["Оплачено сегодня", paidToday],
                  ["Всего оплачено", data.payments.reduce((sum, payment) => sum + (payment.type === "Возврат" ? -payment.amount : payment.amount), 0)],
                  ["Ожидаем доплат", remainingTotal],
                  ["Просроченные заказы", overdueOrders.length],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className="text-right font-bold text-slate-950">{typeof value === "number" && value > 20 ? money(value) : value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <h2 className="font-bold text-slate-950">Производство и установка</h2>
              <div className="mt-4 space-y-4">
                {[
                  ["В производстве", productionInWork.length],
                  ["Готово изделий", data.production.filter((task) => task.stage === "Готов").length],
                  ["Установки назначены", data.installation.filter((task) => task.status === "Запланирована").length],
                  ["Установки с проблемой", data.installation.filter((task) => ["Проблема", "Перенос"].includes(task.status)).length],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className="text-right font-bold text-slate-950">{value}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>

      {sidebar && <button aria-label="Закрыть меню" className="fixed right-4 top-4 z-50 grid h-10 w-10 place-items-center rounded-lg bg-white text-slate-700 shadow-lg lg:hidden" onClick={() => setSidebar(false)}><X className="h-5 w-5" /></button>}
    </div>
  );
}
