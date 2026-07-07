"use client";

import {
  ArrowLeft, Bell, CalendarDays, CircleHelp, ClipboardList, FileImage, FileText, HandCoins, HardHat,
  LayoutDashboard, Menu, PackageCheck, PhoneCall, Plus, Search, Send, Settings, UsersRound, WalletCards, X, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { StaffMenu } from "@/components/staff-menu";
import { getStoredStaffMember, type StaffMember } from "@/lib/auth/staff";
import type { MockClient } from "@/lib/clients/mock-clients";
import { getClientById, getClientTotals } from "@/lib/clients/mock-clients";
import { statusStyles } from "@/lib/order/mock-orders";

const tabs = ["Информация", "Заказы", "Платежи", "Комментарии", "Файлы"] as const;
type Tab = (typeof tabs)[number];

const nav = [
  [LayoutDashboard, "Главная", "/"],
  [ClipboardList, "Заказы", "/orders"],
  [UsersRound, "Клиенты", "/clients"],
  [HardHat, "Производство", "/production"],
  [PackageCheck, "Установка", "/installation"],
  [HandCoins, "Финансы", "/finance"],
  [FileText, "Документы", "/documents"],
  [Settings, "Настройки", "/settings"],
] satisfies ReadonlyArray<readonly [LucideIcon, string, string]>;

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="card">
      <div className="mb-5"><h2 className="text-lg font-bold text-slate-900">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>
      {children}
    </section>
  );
}

function InfoGrid({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-x-8 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map(([label, value]) => <div key={label} className="border-b border-slate-100 pb-4"><dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1.5 text-sm font-semibold leading-6 text-slate-800">{value}</dd></div>)}
    </dl>
  );
}

export function ClientDetails({ client }: { client: MockClient | null }) {
  const [currentClient, setCurrentClient] = useState(client);
  const [activeTab, setActiveTab] = useState<Tab>("Информация");
  const [sidebar, setSidebar] = useState(false);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState(["Клиент просит присылать документы в мессенджер.", "Перед установкой обязательно согласовать время выезда."]);
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [toast, setToast] = useState("");

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  useEffect(() => {
    const id = window.location.pathname.split("/").pop();
    const found = id ? getClientById(id) : null;
    if (found) setCurrentClient(found);
    setStaff(getStoredStaffMember());
  }, []);

  client = currentClient;

  if (!client) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f6f9] p-6">
        <section className="card w-full max-w-lg text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600"><UsersRound className="h-7 w-7" /></span>
          <h1 className="mt-5 text-2xl font-bold text-slate-950">Клиент не найден</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Проверьте ссылку или вернитесь к базе клиентов.</p>
          <Link href="/clients" className="btn-primary mt-6"><ArrowLeft className="h-4 w-4" />Вернуться к клиентам</Link>
        </section>
      </main>
    );
  }

  const totals = getClientTotals(client);

  const addNote = () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    setNotes((current) => [trimmed, ...current]);
    setNote("");
    notify("Комментарий добавлен");
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      {sidebar && <button aria-label="Закрыть меню" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebar(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-navy-950 text-white transition-transform lg:translate-x-0 ${sidebar ? "translate-x-0" : "-translate-x-full"}`}>
        <Link href="/" className="flex h-[82px] items-center border-b border-white/10 px-6"><div className="mr-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-600"><LayoutDashboard className="h-5 w-5" /></div><div><div className="font-bold tracking-[0.18em]">ПАМЯТЬ</div><div className="text-xs text-slate-400">ритуальная мастерская</div></div></Link>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map(([Icon, label, href]) => href ? <Link key={label} href={href} className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${label === "Клиенты" ? "bg-brand-600 text-white shadow-lg shadow-blue-950/20" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}><Icon className="h-[18px] w-[18px]" />{label}</Link> : <button key={label} className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"><Icon className="h-[18px] w-[18px]" />{label}</button>)}
        </nav>
        <div className="border-t border-white/10 p-4"><StaffMenu /></div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[70px] min-w-0 items-center gap-2 border-b bg-white/95 px-4 backdrop-blur md:gap-3 md:px-7">
          <button aria-label="Открыть меню" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border lg:hidden" onClick={() => setSidebar(true)}><Menu className="h-5 w-5" /></button>
          <div className="relative min-w-0 max-w-xl flex-1"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><input className="input bg-slate-50 pl-10" placeholder="Поиск по клиентам, телефонам, адресам..." /></div>
          <Link href="/orders/new" className="btn-primary hidden md:inline-flex"><Plus className="h-4 w-4" />Создать заказ</Link>
          {[CalendarDays, Bell, CircleHelp].map((Icon, index) => <button key={index} aria-label={["Календарь", "Уведомления", "Помощь"][index]} className={`relative h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 ${index === 1 ? "hidden sm:grid" : "hidden md:grid"}`}><Icon className="h-5 w-5" />{index === 1 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />}</button>)}
        </header>

        <main className="mx-auto max-w-[1600px] p-4 md:p-7 xl:p-8">
          <div className="mb-5 text-sm text-slate-500"><Link href="/clients" className="hover:text-brand-600">Клиенты</Link><span className="mx-2">/</span><span className="text-slate-800">{client.name}</span></div>

          <section className="mb-6 overflow-hidden rounded-2xl border bg-white shadow-card">
            <div className="border-b p-5 md:p-6">
              <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
                <div><h1 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">{client.name}</h1><div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500"><span>{client.phone}</span><span>{client.address}</span><span>Источник: <b className="text-slate-700">{client.source}</b></span></div></div>
                <div className="flex flex-wrap gap-2"><Link href={`/orders/new?client=${client.id}`} className="btn-primary"><Plus className="h-4 w-4" />Создать заказ для клиента</Link><button className="btn-secondary" onClick={() => notify(`Набор номера: ${client.phone}`)}><PhoneCall className="h-4 w-4" />Позвонить</button><Link href="/clients" className="btn-secondary"><ArrowLeft className="h-4 w-4" />Назад к клиентам</Link></div>
              </div>
            </div>
            <div className="grid divide-y bg-slate-50/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
              {[["Кол-во заказов", client.orders.length.toString(), "text-slate-950"], ["Общая сумма", money(totals.amount), "text-slate-950"], ["Оплачено", money(totals.paid), "text-emerald-600"], ["Остаток", money(totals.remaining), totals.remaining ? "text-orange-600" : "text-emerald-600"]].map(([label, value, color]) => <div key={label} className="px-5 py-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-1 text-xl font-bold ${color}`}>{value}</p></div>)}
            </div>
          </section>

          <div className="mb-6 overflow-x-auto rounded-2xl border bg-white px-2 shadow-card"><div className="flex min-w-max">{tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`relative px-4 py-4 text-sm font-semibold transition ${activeTab === tab ? "text-brand-700" : "text-slate-500 hover:text-slate-800"}`}>{tab}{activeTab === tab && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-600" />}</button>)}</div></div>

          {activeTab === "Информация" && <Section title="Информация о клиенте"><InfoGrid items={[["ФИО", client.name], ["Телефон", client.phone], ["Дополнительный телефон", client.additionalPhone], ["Адрес", client.address], ["Источник клиента", client.source], ["Комментарий", client.comment], ["Дата первого обращения", client.firstContact], ["Количество заказов", client.orders.length], ["Общая сумма заказов", money(totals.amount)], ["Оплачено", money(totals.paid)], ["Остаток", <span key="remaining" className={totals.remaining ? "text-orange-600" : "text-emerald-600"}>{money(totals.remaining)}</span>]]} /></Section>}

          {activeTab === "Заказы" && <Section title="Заказы клиента" subtitle="История обращений и текущие работы"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{["№ заказа", "Дата", "Тип изделия", "Статус", "Сумма", "Оплачено", "Остаток", "Действие"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{client.orders.map((order) => { const remaining = Math.max(0, order.amount - order.paid); return <tr key={order.id} className="border-b last:border-0"><td className="px-4 py-4 font-semibold text-brand-700">{order.id}</td><td className="px-4 py-4">{order.date}</td><td className="px-4 py-4">{order.product}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[order.status]}`}>{order.status}</span></td><td className="px-4 py-4 font-semibold">{money(order.amount)}</td><td className="px-4 py-4">{money(order.paid)}</td><td className={`px-4 py-4 font-bold ${remaining ? "text-orange-600" : "text-emerald-600"}`}>{money(remaining)}</td><td className="px-4 py-4"><Link href={`/orders/${order.id}`} className="btn-secondary h-9">Открыть заказ</Link></td></tr>; })}</tbody></table></div></Section>}

          {activeTab === "Платежи" && <Section title="История платежей клиента"><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{["Дата", "Заказ", "Тип", "Сумма", "Способ оплаты", "Комментарий"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{client.payments.map((payment) => <tr key={payment.id} className="border-b last:border-0"><td className="px-4 py-4">{payment.date}</td><td className="px-4 py-4"><Link href={`/orders/${payment.orderId}`} className="font-semibold text-brand-700">{payment.orderId}</Link></td><td className="px-4 py-4">{payment.type}</td><td className={`px-4 py-4 font-bold ${payment.type === "Возврат" ? "text-red-600" : "text-emerald-600"}`}>{money(payment.amount)}</td><td className="px-4 py-4">{payment.method}</td><td className="px-4 py-4 text-slate-500">{payment.comment}</td></tr>)}{!client.payments.length && <tr><td className="px-4 py-8 text-center text-slate-400" colSpan={6}>Платежей пока нет</td></tr>}</tbody></table></div></Section>}

          {activeTab === "Комментарии" && <div className="grid gap-5 xl:grid-cols-[1fr_420px]"><Section title="Заметки по клиенту">{notes.map((item, index) => <div key={`${item}-${index}`} className="mb-3 rounded-xl border bg-slate-50 p-4 last:mb-0"><p className="text-sm text-slate-700">{item}</p><p className="mt-2 text-xs text-slate-400">Сегодня, {staff?.name ?? "сотрудник CRM"}</p></div>)}</Section><Section title="Добавить комментарий"><textarea className="textarea" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Введите новую заметку по клиенту..." /><button className="btn-primary mt-4 w-full" onClick={addNote}><Send className="h-4 w-4" />Добавить комментарий</button></Section></div>}

          {activeTab === "Файлы" && <Section title="Файлы клиента" subtitle="Заглушки для будущего хранилища документов"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Договоры", "2 файла", FileText], ["Документы", "Паспортные данные", FileText], ["Фото", "5 изображений", FileImage], ["Чеки", "3 платежа", WalletCards]].map(([label, note, Icon]) => <div key={String(label)} className="rounded-xl border bg-slate-50 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-600 shadow-sm"><Icon className="h-5 w-5" /></span><p className="mt-4 text-sm font-semibold text-slate-800">{label as string}</p><p className="mt-1 text-xs text-slate-500">{note as string}</p></div>)}</div></Section>}
        </main>
      </div>

      {toast && <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl"><PhoneCall className="h-5 w-5 text-emerald-400" />{toast}<button aria-label="Закрыть уведомление" onClick={() => setToast("")}><X className="h-4 w-4 text-slate-400" /></button></div>}
    </div>
  );
}
