"use client";

import {
  Bell, CalendarDays, CheckCircle2, ChevronDown, CircleHelp, ClipboardList, Download, FileText, HandCoins,
  HardHat, LayoutDashboard, Menu, Package, PackageCheck, Plus, Receipt, RotateCcw, Search, Send, Settings, TrendingUp,
  UsersRound, WalletCards, X, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { financeDebts, FinancePayment, getFinanceDebts, getFinancePayments, getFinancePrepayments, initialFinancePayments, PaymentMethod, PaymentType, calculateFinanceStats } from "@/lib/finance/mock-finance";
import { getMockClients, mockClients } from "@/lib/clients/mock-clients";
import { getMockOrders, mockOrders } from "@/lib/order/mock-orders";
import { addStoredPaymentForOrder } from "@/lib/storage";

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
const tabs = ["Обзор", "Платежи", "Долги", "Предоплаты", "Отчеты"] as const;
const methods: PaymentMethod[] = ["Наличные", "Карта", "Перевод", "Расчетный счет"];
const paymentTypes: PaymentType[] = ["Предоплата", "Доплата", "Полная оплата", "Возврат"];
const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;

export function FinanceDashboard() {
  const [payments, setPayments] = useState(initialFinancePayments);
  const [debts, setDebts] = useState(financeDebts);
  const [prepayments, setPrepayments] = useState(getFinancePrepayments());
  const [tab, setTab] = useState<(typeof tabs)[number]>("Обзор");
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [sidebar, setSidebar] = useState(false);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState("");
  const [availableOrders, setAvailableOrders] = useState(mockOrders);
  const [availableClients, setAvailableClients] = useState(mockClients);
  const [form, setForm] = useState({ orderId: mockOrders[0].id, clientId: mockClients[0].id, amount: "10000", method: "Наличные" as PaymentMethod, type: "Доплата" as PaymentType, date: "2026-06-16", comment: "" });

  const refreshFinance = () => {
    setPayments(getFinancePayments());
    setDebts(getFinanceDebts());
    setPrepayments(getFinancePrepayments());
    setAvailableOrders(getMockOrders());
    setAvailableClients(getMockClients());
  };

  useEffect(() => {
    refreshFinance();
  }, []);

  const stats = useMemo(() => calculateFinanceStats(payments), [payments]);
  const filteredPayments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return payments.filter((payment) => {
      const matchesQuery = !normalized || [payment.orderId, payment.client, payment.phone].some((value) => value.toLowerCase().includes(normalized));
      const matchesMethod = !method || payment.method === method;
      const matchesStatus = !paymentStatus || payment.type === paymentStatus;
      const matchesDate = !paymentDate || payment.date === paymentDate;
      return matchesQuery && matchesMethod && matchesStatus && matchesDate;
    });
  }, [method, paymentDate, paymentStatus, payments, query]);
  const filteredDebts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return debts.filter((debt) => !normalized || [debt.orderId, debt.client, debt.phone].some((value) => value.toLowerCase().includes(normalized)));
  }, [debts, query]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };
  const resetFilters = () => {
    setQuery("");
    setMethod("");
    setPaymentStatus("");
    setPaymentDate("");
  };
  const savePayment = () => {
    const result = addStoredPaymentForOrder({ orderId: form.orderId, amount: Number(form.amount) || 0, method: form.method, type: form.type, date: form.date, comment: form.comment || "Ручное добавление платежа" });
    if (!result.ok) {
      notify(result.error);
      return;
    }
    refreshFinance();
    setModal(false);
    notify("Платеж добавлен");
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      {sidebar && <button aria-label="Закрыть меню" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebar(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-navy-950 text-white transition-transform lg:translate-x-0 ${sidebar ? "translate-x-0" : "-translate-x-full"}`}>
        <Link href="/" className="flex h-[82px] items-center border-b border-white/10 px-6"><div className="mr-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-600"><LayoutDashboard className="h-5 w-5" /></div><div><div className="font-bold tracking-[0.18em]">ПАМЯТЬ</div><div className="text-xs text-slate-400">ритуальная мастерская</div></div></Link>
        <nav className="flex-1 space-y-1 p-4">{nav.map(([Icon, label, href]) => href ? <Link key={label} href={href} className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${label === "Финансы" ? "bg-brand-600 text-white shadow-lg shadow-blue-950/20" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}><Icon className="h-[18px] w-[18px]" />{label}</Link> : <button key={label} className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"><Icon className="h-[18px] w-[18px]" />{label}</button>)}</nav>
        <div className="border-t border-white/10 p-4"><div className="flex items-center gap-3 rounded-xl bg-white/5 p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-sm font-semibold">ТИ</div><div><div className="text-sm font-semibold">Тимофеев И.</div><div className="text-xs text-slate-400">Менеджер</div></div></div></div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[70px] min-w-0 items-center gap-2 border-b bg-white/95 px-4 backdrop-blur md:gap-3 md:px-7">
          <button aria-label="Открыть меню" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border lg:hidden" onClick={() => setSidebar(true)}><Menu className="h-5 w-5" /></button>
          <div className="relative min-w-0 max-w-xl flex-1"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><input className="input bg-slate-50 pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по заказам, клиентам, телефонам..." /></div>
          <button className="btn-primary hidden md:inline-flex" onClick={() => setModal(true)}><Plus className="h-4 w-4" />Добавить платеж</button>
          {[CalendarDays, Bell, CircleHelp].map((Icon, index) => <button key={index} aria-label={["Календарь", "Уведомления", "Помощь"][index]} className={`relative h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 ${index === 1 ? "hidden sm:grid" : "hidden md:grid"}`}><Icon className="h-5 w-5" />{index === 1 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />}</button>)}
        </header>

        <main className="mx-auto max-w-[1700px] p-4 md:p-7 xl:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 text-sm text-slate-500"><Link href="/" className="font-medium hover:text-brand-700">Главная</Link> <span className="mx-2">/</span> <span className="text-slate-800">Финансы</span></div><h1 className="text-3xl font-bold tracking-tight text-slate-950">Финансы</h1><p className="mt-1 text-slate-500">Оплаты, предоплаты и остатки по заказам</p></div><button className="btn-primary md:hidden" onClick={() => setModal(true)}><Plus className="h-4 w-4" />Добавить платеж</button></div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[
            { label: "Общая сумма заказов", value: stats.totalOrdersAmount, Icon: WalletCards, color: "text-slate-950" },
            { label: "Оплачено", value: stats.paid, Icon: CheckCircle2, color: "text-emerald-600" },
            { label: "Остаток к оплате", value: stats.remaining, Icon: Receipt, color: "text-orange-600" },
            { label: "Просроченные долги", value: stats.overdue, Icon: X, color: "text-red-600" },
            { label: "Средний чек", value: stats.averageCheck, Icon: TrendingUp, color: "text-brand-700" },
          ].map(({ label, value, Icon, color }) => <section key={label} className="card p-5"><div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><Icon className="h-5 w-5 text-slate-400" /></div><p className={`mt-3 text-2xl font-bold ${color}`}>{money(value)}</p></section>)}</div>

          <section className="card mb-6 p-5"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(320px,1.5fr)_1fr_1fr_1fr_auto]"><label className="relative"><Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="№ заказа, клиент или телефон" /></label><label className="relative"><select className="input appearance-none pr-9" value={method} onChange={(event) => setMethod(event.target.value)}><option value="">Все способы оплаты</option>{methods.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" /></label><label className="relative"><select className="input appearance-none pr-9" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}><option value="">Все типы платежа</option>{paymentTypes.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" /></label><input className="input" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} /><button className="btn-secondary whitespace-nowrap" onClick={resetFilters}><RotateCcw className="h-4 w-4" />Сбросить фильтры</button></div></section>

          <div className="mb-6 overflow-x-auto rounded-2xl border bg-white px-2 shadow-card"><div className="flex min-w-max">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`relative px-4 py-4 text-sm font-semibold ${tab === item ? "text-brand-700" : "text-slate-500 hover:text-slate-800"}`}>{item}{tab === item && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-600" />}</button>)}</div></div>

          {tab === "Обзор" && <div className="space-y-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[["Выручка за месяц", stats.paid, "text-emerald-600"], ["Полученные предоплаты", filteredPayments.filter((p) => p.type === "Предоплата").reduce((s, p) => s + p.amount, 0), "text-brand-700"], ["Остатки к оплате", stats.remaining, "text-orange-600"], ["Количество неоплаченных заказов", stats.noPaid, "text-red-600"], ["Заказы с полной оплатой", stats.fullPaid, "text-emerald-600"], ["Заказы с частичной оплатой", stats.partialPaid, "text-orange-600"]].map(([label, value, color]) => <section key={String(label)} className="card p-5"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${color as string}`}>{typeof value === "number" && value > 20 ? money(value) : value}</p></section>)}</div><section className="card"><h2 className="mb-5 text-lg font-bold">Финансовое соотношение</h2>{[["Оплачено", stats.paid, "bg-emerald-500"], ["Осталось", stats.remaining, "bg-orange-500"], ["Просрочено", stats.overdue, "bg-red-500"]].map(([label, value, color]) => <div key={String(label)} className="mb-4 last:mb-0"><div className="mb-2 flex justify-between text-sm"><span>{label}</span><b>{money(Number(value))}</b></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color as string}`} style={{ width: `${Math.min(100, Number(value) / stats.totalOrdersAmount * 100)}%` }} /></div></div>)}</section></div>}

          {tab === "Платежи" && <PaymentsTable payments={filteredPayments} onReceipt={() => notify("Чек подготовлен к скачиванию")} />}
          {tab === "Долги" && <DebtsTable debts={filteredDebts} onRemind={() => notify("Напоминание подготовлено")} onAddPayment={() => setModal(true)} />}
          {tab === "Предоплаты" && <PrepaymentsTable payments={prepayments} />}
          {tab === "Отчеты" && <Reports stats={stats} payments={payments} />}
        </main>
      </div>

      {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-xl font-bold text-slate-950">Добавить платеж</h2><p className="mt-1 text-sm text-slate-500">Платеж сохранится в localStorage и обновит связанные разделы.</p></div><button className="icon-button text-slate-400 hover:bg-slate-100" onClick={() => setModal(false)}><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-4 md:grid-cols-2"><label><span className="field-label">Заказ</span><select className="input" value={form.orderId} onChange={(event) => { const order = availableOrders.find((item) => item.id === event.target.value); const client = availableClients.find((item) => item.name === order?.client); setForm({ ...form, orderId: event.target.value, clientId: client?.id ?? form.clientId, amount: form.type === "Полная оплата" && order ? String(Math.max(0, order.amount - order.paid)) : form.amount }); }}>{availableOrders.map((order) => <option key={order.id}>{order.id}</option>)}</select></label><label><span className="field-label">Клиент</span><select className="input" value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>{availableClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label><label><span className="field-label">Сумма платежа</span><input className="input" inputMode="numeric" disabled={form.type === "Полная оплата"} value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label><label><span className="field-label">Способ оплаты</span><select className="input" value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value as PaymentMethod })}>{methods.map((item) => <option key={item}>{item}</option>)}</select></label><label><span className="field-label">Тип платежа</span><select className="input" value={form.type} onChange={(event) => { const type = event.target.value as PaymentType; const order = availableOrders.find((item) => item.id === form.orderId); setForm({ ...form, type, amount: type === "Полная оплата" && order ? String(Math.max(0, order.amount - order.paid)) : "" }); }}>{paymentTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label><span className="field-label">Дата платежа</span><input className="input" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label className="md:col-span-2"><span className="field-label">Комментарий</span><textarea className="textarea" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} /></label></div><div className="mt-6 flex justify-end gap-2"><button className="btn-secondary" onClick={() => setModal(false)}>Отмена</button><button className="btn-primary" onClick={savePayment}>Сохранить платеж</button></div></div></div>}
      {toast && <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl"><CheckCircle2 className="h-5 w-5 text-emerald-400" />{toast}<button aria-label="Закрыть уведомление" onClick={() => setToast("")}><X className="h-4 w-4 text-slate-400" /></button></div>}
    </div>
  );
}

function PaymentsTable({ payments, onReceipt }: { payments: FinancePayment[]; onReceipt: () => void }) {
  return <section className="overflow-hidden rounded-2xl border bg-white shadow-card"><div className="border-b px-5 py-4"><h2 className="font-bold">Платежи</h2><p className="text-sm text-slate-500">Найдено: {payments.length}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[1200px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{["Дата", "№ заказа", "Клиент", "Телефон", "Сумма платежа", "Способ оплаты", "Тип платежа", "Комментарий", "Действия"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{payments.map((payment) => <tr key={payment.id} className="border-b last:border-0"><td className="px-4 py-4">{payment.date}</td><td className="px-4 py-4"><Link href={`/orders/${payment.orderId}`} className="font-semibold text-brand-700">{payment.orderId}</Link></td><td className="px-4 py-4">{payment.client}</td><td className="px-4 py-4">{payment.phone}</td><td className={`px-4 py-4 font-bold ${payment.type === "Возврат" ? "text-red-600" : "text-emerald-600"}`}>{money(payment.amount)}</td><td className="px-4 py-4">{payment.method}</td><td className="px-4 py-4">{payment.type}</td><td className="px-4 py-4 text-slate-500">{payment.comment}</td><td className="px-4 py-4"><div className="flex gap-2"><Link href={`/orders/${payment.orderId}`} className="btn-secondary h-9">Заказ</Link><Link href={`/clients/${payment.clientId}`} className="btn-secondary h-9">Клиент</Link><button className="btn-secondary h-9" onClick={onReceipt}><Download className="h-4 w-4" />Чек</button></div></td></tr>)}</tbody></table></div></section>;
}

function DebtsTable({ debts, onRemind, onAddPayment }: { debts: typeof financeDebts; onRemind: () => void; onAddPayment: () => void }) {
  return <section className="overflow-hidden rounded-2xl border bg-white shadow-card"><div className="border-b px-5 py-4"><h2 className="font-bold">Долги</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{["№ заказа", "Клиент", "Телефон", "Сумма заказа", "Оплачено", "Остаток", "Срок оплаты", "Просрочка", "Статус", "Действия"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{debts.map((debt) => { const remaining = Math.max(0, debt.amount - debt.paid); return <tr key={debt.orderId} className={`border-b last:border-0 ${debt.status === "Просрочено" ? "bg-red-50/50" : debt.status === "Скоро оплата" ? "bg-orange-50/50" : ""}`}><td className="px-4 py-4 font-semibold text-brand-700">{debt.orderId}</td><td className="px-4 py-4">{debt.client}</td><td className="px-4 py-4">{debt.phone}</td><td className="px-4 py-4">{money(debt.amount)}</td><td className="px-4 py-4">{money(debt.paid)}</td><td className="px-4 py-4 font-bold text-orange-600">{money(remaining)}</td><td className="px-4 py-4">{debt.dueDate}</td><td className={`px-4 py-4 font-semibold ${debt.overdueDays > 0 ? "text-red-600" : "text-slate-500"}`}>{debt.overdueDays > 0 ? `${debt.overdueDays} дн.` : "нет"}</td><td className="px-4 py-4">{debt.status}</td><td className="px-4 py-4"><div className="flex gap-2"><Link href={`/orders/${debt.orderId}`} className="btn-secondary h-9">Открыть заказ</Link><button className="btn-secondary h-9" onClick={onRemind}>Напомнить</button><button className="btn-primary h-9" onClick={onAddPayment}>Добавить платеж</button></div></td></tr>; })}</tbody></table></div></section>;
}

function PrepaymentsTable({ payments }: { payments: ReturnType<typeof getFinancePrepayments> }) {
  return <section className="overflow-hidden rounded-2xl border bg-white shadow-card"><div className="border-b px-5 py-4"><h2 className="font-bold">Предоплаты</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{["Дата", "№ заказа", "Клиент", "Сумма предоплаты", "Итого по заказу", "Процент оплаты", "Остаток", "Способ оплаты", "Действия"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{payments.map((payment) => <tr key={payment.id} className="border-b last:border-0"><td className="px-4 py-4">{payment.date}</td><td className="px-4 py-4 font-semibold text-brand-700">{payment.orderId}</td><td className="px-4 py-4">{payment.client}</td><td className="px-4 py-4 font-bold text-emerald-600">{money(payment.amount)}</td><td className="px-4 py-4">{money(payment.orderTotal)}</td><td className="px-4 py-4"><div className="mb-1 text-xs font-semibold">{payment.percent}%</div><div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${payment.percent}%` }} /></div></td><td className="px-4 py-4 font-bold text-orange-600">{money(payment.remaining)}</td><td className="px-4 py-4">{payment.method}</td><td className="px-4 py-4"><Link href={`/orders/${payment.orderId}`} className="btn-secondary h-9">Открыть заказ</Link></td></tr>)}</tbody></table></div></section>;
}

function Reports({ stats, payments }: { stats: ReturnType<typeof calculateFinanceStats>; payments: FinancePayment[] }) {
  return <div className="space-y-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[["Выручка за сегодня", payments.slice(0, 2).reduce((s, p) => s + p.amount, 0)], ["Выручка за неделю", payments.slice(0, 7).reduce((s, p) => s + p.amount, 0)], ["Выручка за месяц", stats.paid], ["Новые платежи", payments.length], ["Долги к получению", stats.remaining], ["Средний чек", stats.averageCheck]].map(([label, value]) => <section key={String(label)} className="card p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{Number(value) > 20 ? money(Number(value)) : value}</p></section>)}</div><section className="card"><h2 className="mb-5 text-lg font-bold">Финансовая сводка</h2><div className="grid gap-4 md:grid-cols-5">{[["Всего заказов", getMockOrders().length], ["Полностью оплачены", stats.fullPaid], ["Частично оплачены", stats.partialPaid], ["Без оплаты", stats.noPaid], ["Просрочены", getFinanceDebts().filter((d) => d.status === "Просрочено").length]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}</div></section></div>;
}
