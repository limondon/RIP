"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getMockOrders, mockOrders, orderStatuses, statusStyles } from "@/lib/order/mock-orders";
import { updateStoredOrderStatus } from "@/lib/storage";

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;

export function OrdersList() {
  const [orders, setOrders] = useState(mockOrders);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [material, setMaterial] = useState("");
  const [date, setDate] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    setOrders(getMockOrders());
  }, []);

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery = !normalized || [order.id, order.client, order.phone].some((value) => value.toLowerCase().includes(normalized));
      const matchesStatus = !status || order.status === status;
      const matchesMaterial = !material || order.material === material;
      const matchesDate = !date || order.deadline === date;
      return matchesQuery && matchesStatus && matchesMaterial && matchesDate;
    });
  }, [date, material, orders, query, status]);

  const stats = useMemo(() => {
    const active = orders.filter((order) => ["Новый", "Макет", "В производстве"].includes(order.status)).length;
    const ready = orders.filter((order) => ["Готов", "Установка"].includes(order.status)).length;
    const remaining = orders.reduce((sum, order) => sum + Math.max(0, order.amount - order.paid), 0);
    return { total: orders.length, active, ready, remaining };
  }, [orders]);

  const resetFilters = () => {
    setQuery("");
    setStatus("");
    setMaterial("");
    setDate("");
  };

  const advanceStatus = (id: string) => {
    const order = orders.find((item) => item.id === id);
    if (!order) return;
    const currentIndex = orderStatuses.indexOf(order.status);
    const nextStatus = orderStatuses[(currentIndex + 1) % orderStatuses.length];
    updateStoredOrderStatus(id, nextStatus);
    setOrders(getMockOrders());
    setToast(`${id}: статус изменён на «${nextStatus}»`);
    window.setTimeout(() => setToast(""), 2400);
  };

  return (
    <>
      <AppShell
        active="Заказы"
        title="Заказы"
        subtitle="Все заказы на изготовление и установку памятников"
        eyebrow={<>Раздел CRM: <span className="font-medium text-slate-800">Заказы</span></>}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Поиск по заказам, клиентам, телефонам..."
        primaryAction={<Link href="/orders/new" className="btn-primary hidden md:inline-flex"><Plus className="h-4 w-4" />Создать заказ</Link>}
        mobileAction={<Link href="/orders/new" className="btn-primary sm:hidden"><Plus className="h-4 w-4" />Создать заказ</Link>}
        badges={{ Заказы: orders.length }}
      >

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Всего заказов", value: stats.total.toString(), note: "в текущем реестре", Icon: ClipboardList, color: "bg-blue-50 text-blue-600" },
              { label: "В работе", value: stats.active.toString(), note: "требуют внимания", Icon: Clock3, color: "bg-amber-50 text-amber-600" },
              { label: "Готовы к установке", value: stats.ready.toString(), note: "готовы или назначены", Icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
              { label: "Остаток к оплате", value: money(stats.remaining), note: "по всем заказам", Icon: WalletCards, color: "bg-violet-50 text-violet-600" },
            ].map(({ label, value, note, Icon, color }) => (
              <section key={label} className="card flex items-start justify-between p-5">
                <div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span>
              </section>
            ))}
          </div>

          <section className="card mb-6 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(280px,1.5fr)_1fr_1fr_1fr_auto]">
              <label className="relative">
                <span className="sr-only">Поиск заказов</span>
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ФИО, телефон или номер заказа" />
              </label>
              <label className="relative">
                <span className="sr-only">Статус</span>
                <select className="input appearance-none pr-9" value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="">Все статусы</option>{orderStatuses.map((item) => <option key={item}>{item}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
              </label>
              <label className="relative">
                <span className="sr-only">Материал</span>
                <select className="input appearance-none pr-9" value={material} onChange={(event) => setMaterial(event.target.value)}>
                  <option value="">Все материалы</option>
                  {Array.from(new Set(orders.map((order) => order.material))).map((item) => <option key={item}>{item}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
              </label>
              <label><span className="sr-only">Срок заказа</span><input className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
              <button className="btn-secondary whitespace-nowrap" onClick={resetFilters}><RotateCcw className="h-4 w-4" />Сбросить фильтры</button>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div><h2 className="font-bold text-slate-900">Реестр заказов</h2><p className="mt-0.5 text-sm text-slate-500">Найдено: {filteredOrders.length}</p></div>
              <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex"><TrendingUp className="h-4 w-4" />Данные обновлены сегодня</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1380px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {["№ заказа", "Клиент", "Телефон", "Тип изделия", "Материал", "Статус", "Срок", "Сумма", "Оплачено", "Остаток", "Действия"].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3.5">{heading}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const remaining = Math.max(0, order.amount - order.paid);
                    return (
                      <tr key={order.id} className="border-b last:border-0 hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-brand-700">{order.id}</td>
                        <td className="max-w-[220px] px-4 py-4 font-medium text-slate-800">{order.client}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">{order.phone}</td>
                        <td className="px-4 py-4 text-slate-600">{order.product}</td>
                        <td className="px-4 py-4 text-slate-600">{order.material}</td>
                        <td className="px-4 py-4"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[order.status]}`}>{order.status}</span></td>
                        <td className="whitespace-nowrap px-4 py-4"><span className={order.status === "Проблема" ? "font-semibold text-red-600" : "text-slate-600"}>{order.deadlineLabel}</span></td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-800">{money(order.amount)}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">{money(order.paid)}</td>
                        <td className={`whitespace-nowrap px-4 py-4 font-bold ${remaining ? "text-orange-600" : "text-emerald-600"}`}>{money(remaining)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <Link href={`/orders/${order.id}`} title="Открыть" className="icon-button text-slate-500 hover:bg-slate-100 hover:text-brand-600"><Eye className="h-4 w-4" /></Link>
                            <Link href={`/orders/new?edit=${order.id}`} title="Редактировать" className="icon-button text-slate-500 hover:bg-slate-100 hover:text-brand-600"><Pencil className="h-4 w-4" /></Link>
                            <button title="Изменить статус" onClick={() => advanceStatus(order.id)} className="icon-button text-slate-500 hover:bg-slate-100 hover:text-brand-600"><RotateCcw className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!filteredOrders.length && (
                <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-500"><Search className="h-5 w-5" /></span>
                  <h3 className="mt-4 font-semibold text-slate-800">Заказы не найдены</h3>
                  <p className="mt-1 text-sm text-slate-500">Измените параметры поиска или сбросьте фильтры.</p>
                  <button className="btn-secondary mt-4" onClick={resetFilters}>Сбросить фильтры</button>
                </div>
              )}
            </div>
          </section>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Данные на странице демонстрационные. После подключения базы здесь будут отображаться реальные заказы мастерской.</p>
          </div>
      </AppShell>

      {toast && (
        <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />{toast}
          <button aria-label="Закрыть уведомление" onClick={() => setToast("")}><X className="h-4 w-4 text-slate-400" /></button>
        </div>
      )}
    </>
  );
}
