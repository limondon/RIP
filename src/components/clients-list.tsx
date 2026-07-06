"use client";

import {
  Bell, CalendarDays, ChevronDown, CircleHelp, ClipboardList, Eye, FileText, HandCoins, HardHat,
  LayoutDashboard, Menu, PackageCheck, PhoneCall, Plus, RotateCcw, Search, Settings, UserPlus, UsersRound, WalletCards, X, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getClientTotals, getMockClients, mockClients } from "@/lib/clients/mock-clients";

const nav = [
  [ClipboardList, "Заказы", "/orders"],
  [UsersRound, "Клиенты", "/clients"],
  [HardHat, "Производство", "/production"],
  [PackageCheck, "Установка", "/installation"],
  [HandCoins, "Финансы", "/finance"],
  [FileText, "Документы", "/documents"],
  [Settings, "Настройки", "/settings"],
] satisfies ReadonlyArray<readonly [LucideIcon, string, string]>;

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;

export function ClientsList() {
  const [clients, setClients] = useState(mockClients);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  const [ordersCount, setOrdersCount] = useState("");
  const [sidebar, setSidebar] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setClients(getMockClients());
  }, []);

  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesQuery = !normalized || [client.name, client.phone, client.address].some((value) => value.toLowerCase().includes(normalized));
      const matchesSource = !source || client.source === source;
      const count = client.orders.length;
      const matchesCount = !ordersCount || (ordersCount === "1" ? count === 1 : ordersCount === "2-3" ? count >= 2 && count <= 3 : count >= 4);
      return matchesQuery && matchesSource && matchesCount;
    });
  }, [clients, ordersCount, query, source]);

  const stats = useMemo(() => {
    const totalAmount = clients.reduce((sum, client) => sum + getClientTotals(client).amount, 0);
    return {
      total: clients.length,
      newThisMonth: clients.filter((client) => client.isNewThisMonth).length,
      repeated: clients.filter((client) => client.orders.length > 1).length,
      totalAmount,
    };
  }, [clients]);

  const resetFilters = () => {
    setQuery("");
    setSource("");
    setOrdersCount("");
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      {sidebar && <button aria-label="Закрыть меню" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebar(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-navy-950 text-white transition-transform lg:translate-x-0 ${sidebar ? "translate-x-0" : "-translate-x-full"}`}>
        <Link href="/orders" className="flex h-[82px] items-center border-b border-white/10 px-6">
          <div className="mr-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-600"><LayoutDashboard className="h-5 w-5" /></div>
          <div><div className="font-bold tracking-[0.18em]">ПАМЯТЬ</div><div className="text-xs text-slate-400">ритуальная мастерская</div></div>
        </Link>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map(([Icon, label, href]) => href ? (
            <Link key={label} href={href} className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${label === "Клиенты" ? "bg-brand-600 text-white shadow-lg shadow-blue-950/20" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
              <Icon className="h-[18px] w-[18px]" />{label}{label === "Клиенты" && <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-xs">{clients.length}</span>}
            </Link>
          ) : (
            <button key={label} className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"><Icon className="h-[18px] w-[18px]" />{label}</button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4"><div className="flex items-center gap-3 rounded-xl bg-white/5 p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-sm font-semibold">ТИ</div><div><div className="text-sm font-semibold">Тимофеев И.</div><div className="text-xs text-slate-400">Менеджер</div></div></div></div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[70px] min-w-0 items-center gap-2 border-b bg-white/95 px-4 backdrop-blur md:gap-3 md:px-7">
          <button aria-label="Открыть меню" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border lg:hidden" onClick={() => setSidebar(true)}><Menu className="h-5 w-5" /></button>
          <div className="relative min-w-0 max-w-xl flex-1"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><input className="input bg-slate-50 pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по клиентам, телефонам, адресам..." /></div>
          <Link href="/orders/new" className="btn-primary hidden md:inline-flex"><Plus className="h-4 w-4" />Создать заказ</Link>
          {[CalendarDays, Bell, CircleHelp].map((Icon, index) => <button key={index} aria-label={["Календарь", "Уведомления", "Помощь"][index]} className={`relative h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 ${index === 1 ? "hidden sm:grid" : "hidden md:grid"}`}><Icon className="h-5 w-5" />{index === 1 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />}</button>)}
        </header>

        <main className="mx-auto max-w-[1700px] p-4 md:p-7 xl:p-8">
          <div className="mb-6">
            <div className="mb-2 text-sm text-slate-500">Главная <span className="mx-2">/</span> <span className="text-slate-800">Клиенты</span></div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Клиенты</h1>
            <p className="mt-1 text-slate-500">База заказчиков и история обращений</p>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Всего клиентов", value: stats.total.toString(), note: "активная база", Icon: UsersRound, color: "bg-blue-50 text-blue-600" },
              { label: "Новые за месяц", value: stats.newThisMonth.toString(), note: "первое обращение", Icon: UserPlus, color: "bg-emerald-50 text-emerald-600" },
              { label: "Повторные клиенты", value: stats.repeated.toString(), note: "2+ заказов", Icon: RotateCcw, color: "bg-amber-50 text-amber-600" },
              { label: "Общая сумма заказов", value: money(stats.totalAmount), note: "по всей базе", Icon: WalletCards, color: "bg-violet-50 text-violet-600" },
            ].map(({ label, value, note, Icon, color }) => (
              <section key={label} className="card flex items-start justify-between p-5">
                <div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span>
              </section>
            ))}
          </div>

          <section className="card mb-6 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(320px,1.6fr)_1fr_1fr_auto]">
              <label className="relative"><span className="sr-only">Поиск клиентов</span><Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ФИО, телефон или адрес" /></label>
              <label className="relative"><span className="sr-only">Источник клиента</span><select className="input appearance-none pr-9" value={source} onChange={(event) => setSource(event.target.value)}><option value="">Все источники</option>{Array.from(new Set(clients.map((client) => client.source))).map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" /></label>
              <label className="relative"><span className="sr-only">Количество заказов</span><select className="input appearance-none pr-9" value={ordersCount} onChange={(event) => setOrdersCount(event.target.value)}><option value="">Любое кол-во заказов</option><option value="1">1 заказ</option><option value="2-3">2-3 заказа</option><option value="4+">4+ заказа</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" /></label>
              <button className="btn-secondary whitespace-nowrap" onClick={resetFilters}><RotateCcw className="h-4 w-4" />Сбросить фильтры</button>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
            <div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="font-bold text-slate-900">База клиентов</h2><p className="mt-0.5 text-sm text-slate-500">Найдено: {filteredClients.length}</p></div></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] text-left text-sm">
                <thead><tr className="border-b bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">{["Клиент", "Телефон", "Адрес", "Источник", "Кол-во заказов", "Последний заказ", "Общая сумма", "Остаток к оплате", "Действия"].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3.5">{heading}</th>)}</tr></thead>
                <tbody>
                  {filteredClients.map((client) => {
                    const totals = getClientTotals(client);
                    const lastOrder = client.orders[0];
                    return (
                      <tr key={client.id} className="border-b last:border-0 hover:bg-slate-50/70">
                        <td className="max-w-[230px] px-4 py-4 font-semibold">
                          <Link href={`/clients/${client.id}`} className="text-slate-800 hover:text-brand-700 hover:underline">
                            {client.name}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">{client.phone}</td>
                        <td className="max-w-[260px] px-4 py-4 text-slate-600">{client.address}</td>
                        <td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{client.source}</span></td>
                        <td className="px-4 py-4 font-semibold">{client.orders.length}</td>
                        <td className="whitespace-nowrap px-4 py-4"><Link href={`/orders/${lastOrder.id}`} className="font-semibold text-brand-700 hover:underline">{lastOrder.id}</Link></td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold">{money(totals.amount)}</td>
                        <td className={`whitespace-nowrap px-4 py-4 font-bold ${totals.remaining ? "text-orange-600" : "text-emerald-600"}`}>{money(totals.remaining)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Link href={`/clients/${client.id}`} className="btn-secondary h-9 px-3">
                              <Eye className="h-4 w-4" />Открыть
                            </Link>
                            <Link href={`/orders/new?client=${client.id}`} title="Создать заказ" className="icon-button text-slate-500 hover:bg-slate-100 hover:text-brand-600"><Plus className="h-4 w-4" /></Link>
                            <button title="Позвонить" onClick={() => notify(`Набор номера: ${client.phone}`)} className="icon-button text-slate-500 hover:bg-slate-100 hover:text-brand-600"><PhoneCall className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!filteredClients.length && <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center"><Search className="h-8 w-8 text-slate-300" /><h3 className="mt-3 font-semibold text-slate-800">Клиенты не найдены</h3><p className="mt-1 text-sm text-slate-500">Измените поиск или сбросьте фильтры.</p><button className="btn-secondary mt-4" onClick={resetFilters}>Сбросить фильтры</button></div>}
            </div>
          </section>
        </main>
      </div>

      {toast && <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl"><PhoneCall className="h-5 w-5 text-emerald-400" />{toast}<button aria-label="Закрыть уведомление" onClick={() => setToast("")}><X className="h-4 w-4 text-slate-400" /></button></div>}
    </div>
  );
}
