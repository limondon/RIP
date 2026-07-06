"use client";

import {
  CheckCircle2, ChevronDown, Download,
  Plus, Receipt, RotateCcw, Search, Send, TrendingUp,
  WalletCards, X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { financeDebts, FinancePayment, getFinanceDebts, getFinancePayments, getFinancePrepayments, initialFinancePayments, PaymentMethod, PaymentType, calculateFinanceStats } from "@/lib/finance/mock-finance";
import { getMockClients, mockClients } from "@/lib/clients/mock-clients";
import { getMockOrders, mockOrders } from "@/lib/order/mock-orders";
import { addStoredPaymentForOrder } from "@/lib/storage";

const tabs = ["Обзор", "Платежи", "Долги", "Предоплаты", "Отчеты"] as const;
const methods: PaymentMethod[] = ["Наличные", "Карта", "Перевод", "Расчетный счет"];
const paymentTypes: PaymentType[] = ["Предоплата", "Доплата", "Полная оплата", "Возврат"];
const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;

export function FinanceDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const [payments, setPayments] = useState(initialFinancePayments);
  const [debts, setDebts] = useState(financeDebts);
  const [prepayments, setPrepayments] = useState(getFinancePrepayments());
  const [tab, setTab] = useState<(typeof tabs)[number]>("Обзор");
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState("");
  const [availableOrders, setAvailableOrders] = useState(mockOrders);
  const [availableClients, setAvailableClients] = useState(mockClients);
  const [form, setForm] = useState({ orderId: mockOrders[0].id, clientId: mockClients[0].id, amount: "", method: "Перевод" as PaymentMethod, type: "Доплата" as PaymentType, date: today, comment: "" });

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
  const openPaymentModal = (orderId = form.orderId, type: PaymentType = "Доплата") => {
    const order = availableOrders.find((item) => item.id === orderId) ?? availableOrders[0];
    const client = availableClients.find((item) => item.name === order?.client) ?? availableClients[0];
    const remaining = order ? Math.max(0, order.amount - order.paid) : 0;
    setForm({
      orderId: order?.id ?? form.orderId,
      clientId: client?.id ?? form.clientId,
      amount: remaining ? String(remaining) : "",
      method: "Перевод",
      type,
      date: new Date().toISOString().slice(0, 10),
      comment: "",
    });
    setModal(true);
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
    <>
      <AppShell
        active="Финансы"
        title="Финансы"
        subtitle="Оплаты, предоплаты и остатки по заказам"
        eyebrow={<><Link href="/" className="font-medium hover:text-brand-700">Главная</Link> <span className="mx-2">/</span> <span className="text-slate-800">Финансы</span></>}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Поиск по заказам, клиентам, телефонам..."
        primaryAction={<button className="btn-primary hidden md:inline-flex" onClick={() => openPaymentModal()}><Plus className="h-4 w-4" />Принять оплату</button>}
        mobileAction={<button className="btn-primary md:hidden" onClick={() => openPaymentModal()}><Plus className="h-4 w-4" />Принять оплату</button>}
      >

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
          {tab === "Долги" && <DebtsTable debts={filteredDebts} onRemind={() => notify("Напоминание подготовлено")} onAddPayment={(orderId) => openPaymentModal(orderId)} />}
          {tab === "Предоплаты" && <PrepaymentsTable payments={prepayments} />}
          {tab === "Отчеты" && <Reports stats={stats} payments={payments} />}
      </AppShell>

      {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-xl font-bold text-slate-950">{form.type === "Возврат" ? "Оформить возврат" : "Принять оплату"}</h2><p className="mt-1 text-sm text-slate-500">Платеж сохранится в localStorage и обновит заказ, финансы и карточку клиента.</p></div><button className="icon-button text-slate-400 hover:bg-slate-100" onClick={() => setModal(false)}><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-2 sm:grid-cols-3"><button className={`btn-secondary justify-center ${form.type === "Доплата" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}`} onClick={() => setForm({ ...form, type: "Доплата", method: "Перевод" })}>Клиент перевел</button><button className={`btn-secondary justify-center ${form.type === "Полная оплата" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}`} onClick={() => { const order = availableOrders.find((item) => item.id === form.orderId); setForm({ ...form, type: "Полная оплата", amount: order ? String(Math.max(0, order.amount - order.paid)) : form.amount, method: "Перевод" }); }}>Оплатить остаток</button><button className={`btn-secondary justify-center ${form.type === "Возврат" ? "border-red-200 bg-red-50 text-red-700" : ""}`} onClick={() => setForm({ ...form, type: "Возврат", amount: "", method: form.method })}>Вернуть деньги</button></div><div className="mt-6 grid gap-4 md:grid-cols-2"><label><span className="field-label">Заказ</span><select className="input" value={form.orderId} onChange={(event) => { const order = availableOrders.find((item) => item.id === event.target.value); const client = availableClients.find((item) => item.name === order?.client); const remaining = order ? Math.max(0, order.amount - order.paid) : 0; setForm({ ...form, orderId: event.target.value, clientId: client?.id ?? form.clientId, amount: remaining ? String(remaining) : "" }); }}>{availableOrders.map((order) => <option key={order.id}>{order.id}</option>)}</select></label><label><span className="field-label">Клиент</span><select className="input" value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>{availableClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label><label><span className="field-label">Сумма платежа</span><input className="input" inputMode="numeric" placeholder={form.type === "Возврат" ? "Сколько вернуть" : "Сколько пришло"} disabled={form.type === "Полная оплата"} value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label><label><span className="field-label">Способ оплаты</span><select className="input" value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value as PaymentMethod })}>{methods.map((item) => <option key={item}>{item}</option>)}</select></label><label><span className="field-label">Тип платежа</span><select className="input" value={form.type} onChange={(event) => { const type = event.target.value as PaymentType; const order = availableOrders.find((item) => item.id === form.orderId); setForm({ ...form, type, amount: type === "Полная оплата" && order ? String(Math.max(0, order.amount - order.paid)) : "" }); }}>{paymentTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label><span className="field-label">Дата платежа</span><input className="input" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label className="md:col-span-2"><span className="field-label">Комментарий</span><textarea className="textarea" placeholder="Например: перевод от клиента" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} /></label></div><div className="mt-6 flex justify-end gap-2"><button className="btn-secondary" onClick={() => setModal(false)}>Отмена</button><button className="btn-primary" onClick={savePayment}>{form.type === "Возврат" ? "Сохранить возврат" : "Принять деньги"}</button></div></div></div>}
      {toast && <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl"><CheckCircle2 className="h-5 w-5 text-emerald-400" />{toast}<button aria-label="Закрыть уведомление" onClick={() => setToast("")}><X className="h-4 w-4 text-slate-400" /></button></div>}
    </>
  );
}

function PaymentsTable({ payments, onReceipt }: { payments: FinancePayment[]; onReceipt: () => void }) {
  return <section className="overflow-hidden rounded-2xl border bg-white shadow-card"><div className="border-b px-5 py-4"><h2 className="font-bold">Платежи</h2><p className="text-sm text-slate-500">Найдено: {payments.length}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[1200px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{["Дата", "№ заказа", "Клиент", "Телефон", "Сумма платежа", "Способ оплаты", "Тип платежа", "Комментарий", "Действия"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{payments.map((payment) => <tr key={payment.id} className="border-b last:border-0"><td className="px-4 py-4">{payment.date}</td><td className="px-4 py-4"><Link href={`/orders/${payment.orderId}`} className="font-semibold text-brand-700">{payment.orderId}</Link></td><td className="px-4 py-4">{payment.client}</td><td className="px-4 py-4">{payment.phone}</td><td className={`px-4 py-4 font-bold ${payment.type === "Возврат" ? "text-red-600" : "text-emerald-600"}`}>{money(payment.amount)}</td><td className="px-4 py-4">{payment.method}</td><td className="px-4 py-4">{payment.type}</td><td className="px-4 py-4 text-slate-500">{payment.comment}</td><td className="px-4 py-4"><div className="flex gap-2"><Link href={`/orders/${payment.orderId}`} className="btn-secondary h-9">Заказ</Link><Link href={`/clients/${payment.clientId}`} className="btn-secondary h-9">Клиент</Link><button className="btn-secondary h-9" onClick={onReceipt}><Download className="h-4 w-4" />Чек</button></div></td></tr>)}</tbody></table></div></section>;
}

function DebtsTable({ debts, onRemind, onAddPayment }: { debts: typeof financeDebts; onRemind: () => void; onAddPayment: (orderId: string) => void }) {
  return <section className="overflow-hidden rounded-2xl border bg-white shadow-card"><div className="border-b px-5 py-4"><h2 className="font-bold">Долги</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{["№ заказа", "Клиент", "Телефон", "Сумма заказа", "Оплачено", "Остаток", "Срок оплаты", "Просрочка", "Статус", "Действия"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{debts.map((debt) => { const remaining = Math.max(0, debt.amount - debt.paid); return <tr key={debt.orderId} className={`border-b last:border-0 ${debt.status === "Просрочено" ? "bg-red-50/50" : debt.status === "Скоро оплата" ? "bg-orange-50/50" : ""}`}><td className="px-4 py-4 font-semibold text-brand-700">{debt.orderId}</td><td className="px-4 py-4">{debt.client}</td><td className="px-4 py-4">{debt.phone}</td><td className="px-4 py-4">{money(debt.amount)}</td><td className="px-4 py-4">{money(debt.paid)}</td><td className="px-4 py-4 font-bold text-orange-600">{money(remaining)}</td><td className="px-4 py-4">{debt.dueDate}</td><td className={`px-4 py-4 font-semibold ${debt.overdueDays > 0 ? "text-red-600" : "text-slate-500"}`}>{debt.overdueDays > 0 ? `${debt.overdueDays} дн.` : "нет"}</td><td className="px-4 py-4">{debt.status}</td><td className="px-4 py-4"><div className="flex gap-2"><Link href={`/orders/${debt.orderId}`} className="btn-secondary h-9">Открыть заказ</Link><button className="btn-secondary h-9" onClick={onRemind}>Напомнить</button><button className="btn-primary h-9" onClick={() => onAddPayment(debt.orderId)}>Добавить платеж</button></div></td></tr>; })}</tbody></table></div></section>;
}

function PrepaymentsTable({ payments }: { payments: ReturnType<typeof getFinancePrepayments> }) {
  return <section className="overflow-hidden rounded-2xl border bg-white shadow-card"><div className="border-b px-5 py-4"><h2 className="font-bold">Предоплаты</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{["Дата", "№ заказа", "Клиент", "Сумма предоплаты", "Итого по заказу", "Процент оплаты", "Остаток", "Способ оплаты", "Действия"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{payments.map((payment) => <tr key={payment.id} className="border-b last:border-0"><td className="px-4 py-4">{payment.date}</td><td className="px-4 py-4 font-semibold text-brand-700">{payment.orderId}</td><td className="px-4 py-4">{payment.client}</td><td className="px-4 py-4 font-bold text-emerald-600">{money(payment.amount)}</td><td className="px-4 py-4">{money(payment.orderTotal)}</td><td className="px-4 py-4"><div className="mb-1 text-xs font-semibold">{payment.percent}%</div><div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${payment.percent}%` }} /></div></td><td className="px-4 py-4 font-bold text-orange-600">{money(payment.remaining)}</td><td className="px-4 py-4">{payment.method}</td><td className="px-4 py-4"><Link href={`/orders/${payment.orderId}`} className="btn-secondary h-9">Открыть заказ</Link></td></tr>)}</tbody></table></div></section>;
}

function Reports({ stats, payments }: { stats: ReturnType<typeof calculateFinanceStats>; payments: FinancePayment[] }) {
  return <div className="space-y-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[["Выручка за сегодня", payments.slice(0, 2).reduce((s, p) => s + p.amount, 0)], ["Выручка за неделю", payments.slice(0, 7).reduce((s, p) => s + p.amount, 0)], ["Выручка за месяц", stats.paid], ["Новые платежи", payments.length], ["Долги к получению", stats.remaining], ["Средний чек", stats.averageCheck]].map(([label, value]) => <section key={String(label)} className="card p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{Number(value) > 20 ? money(Number(value)) : value}</p></section>)}</div><section className="card"><h2 className="mb-5 text-lg font-bold">Финансовая сводка</h2><div className="grid gap-4 md:grid-cols-5">{[["Всего заказов", getMockOrders().length], ["Полностью оплачены", stats.fullPaid], ["Частично оплачены", stats.partialPaid], ["Без оплаты", stats.noPaid], ["Просрочены", getFinanceDebts().filter((d) => d.status === "Просрочено").length]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>)}</div></section></div>;
}
