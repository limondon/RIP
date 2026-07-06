"use client";

import {
  ChevronDown, Eye, PhoneCall, Plus, RotateCcw, Search, UserPlus, UsersRound, WalletCards, X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getClientTotals, getMockClients, mockClients } from "@/lib/clients/mock-clients";

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;

export function ClientsList() {
  const [clients, setClients] = useState(mockClients);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  const [ordersCount, setOrdersCount] = useState("");
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
    <>
      <AppShell
        active="Клиенты"
        title="Клиенты"
        subtitle="База заказчиков и история обращений"
        eyebrow={<><Link href="/" className="font-medium hover:text-brand-700">Главная</Link> <span className="mx-2">/</span> <span className="text-slate-800">Клиенты</span></>}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Поиск по клиентам, телефонам, адресам..."
        primaryAction={<Link href="/orders/new" className="btn-primary hidden md:inline-flex"><Plus className="h-4 w-4" />Создать заказ</Link>}
        badges={{ Клиенты: clients.length }}
      >

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
      </AppShell>

      {toast && <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl"><PhoneCall className="h-5 w-5 text-emerald-400" />{toast}<button aria-label="Закрыть уведомление" onClick={() => setToast("")}><X className="h-4 w-4 text-slate-400" /></button></div>}
    </>
  );
}
