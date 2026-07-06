"use client";

import {
  AlertTriangle, Bell, CalendarDays, CheckCircle2, ChevronDown, CircleHelp, ClipboardList, Clock3,
  FileText, HandCoins, HardHat, LayoutDashboard, Menu, Package, PackageCheck, Plus, RotateCcw, Search, Settings, UsersRound, X, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { masters } from "@/data/mock-data";
import { deadlineTone, daysUntil, getMockProductionOrders, mockProductionOrders, ProductionOrder, productionStages, ProductionStage } from "@/lib/production/mock-production";
import { updateStoredProductionStage, updateStoredProductionTask } from "@/lib/storage";

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

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;

const toneStyles = {
  normal: "border-slate-200 bg-white",
  soon: "border-orange-200 bg-orange-50/60",
  overdue: "border-red-200 bg-red-50/70",
  ready: "border-emerald-200 bg-emerald-50/70",
};

const toneText = {
  normal: "text-slate-500",
  soon: "text-orange-700",
  overdue: "text-red-700",
  ready: "text-emerald-700",
};

function OrderCard({ order, onStageChange, onMasterChange, onDeadlineChange }: { order: ProductionOrder; onStageChange: (id: string, stage: ProductionStage) => void; onMasterChange: (id: string, masterId: string) => void; onDeadlineChange: (id: string, deadline: string) => void }) {
  const tone = deadlineTone(order);
  return (
    <article className={`rounded-xl border p-4 shadow-sm ${toneStyles[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/orders/${order.id}`} className="font-bold text-brand-700 hover:underline">Заказ {order.id}</Link>
          <p className="mt-1 text-sm font-semibold text-slate-800">{order.client}</p>
          <p className="mt-0.5 text-xs text-slate-500">{order.phone}</p>
        </div>
        {tone === "overdue" && <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />}
        {tone === "ready" && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <p><span className="text-slate-400">Изделие:</span> <span className="font-medium text-slate-700">{order.product}</span></p>
        <p><span className="text-slate-400">Материал:</span> <span className="font-medium text-slate-700">{order.material}, {order.steleSize.replace(" см", "")}</span></p>
        <p><span className="text-slate-400">Мастер:</span> <span className="font-medium text-slate-700">{order.master}</span></p>
        <p className={toneText[tone]}><span>Срок:</span> <span className="font-bold">{order.deadlineLabel}</span></p>
        <p><span className="text-slate-400">Оплата:</span> <span className="font-semibold text-slate-800">{money(order.paid)} / {money(order.amount)}</span></p>
      </div>
      <p className="mt-4 rounded-lg bg-white/70 p-3 text-xs leading-5 text-slate-500">{order.comment}</p>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Изменить этап</span>
        <select className="input h-9 text-sm" value={order.stage} onChange={(event) => onStageChange(order.id, event.target.value as ProductionStage)}>
          {productionStages.map((stage) => <option key={stage}>{stage}</option>)}
        </select>
      </label>
      <div className="mt-3 grid gap-2">
        <label><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Мастер</span><select className="input h-9 text-sm" value={order.masterId} onChange={(event) => onMasterChange(order.id, event.target.value)}>{masters.map((master) => <option key={master.id} value={master.id}>{master.fullName}</option>)}</select></label>
        <label><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Готовность</span><input className="input h-9 text-sm" type="date" value={order.deadline} onChange={(event) => onDeadlineChange(order.id, event.target.value)} /></label>
      </div>
      <Link href={`/orders/${order.id}`} className="btn-secondary mt-3 w-full">Открыть заказ</Link>
    </article>
  );
}

export function ProductionBoard() {
  const [orders, setOrders] = useState(mockProductionOrders);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [master, setMaster] = useState("");
  const [deadline, setDeadline] = useState("");
  const [sidebar, setSidebar] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setOrders(getMockProductionOrders());
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery = !normalized || [order.id, order.client, order.phone].some((value) => value.toLowerCase().includes(normalized));
      const matchesStage = !stage || order.stage === stage;
      const matchesMaster = !master || order.master === master;
      const matchesDeadline = !deadline || order.deadline === deadline;
      return matchesQuery && matchesStage && matchesMaster && matchesDeadline;
    });
  }, [deadline, master, orders, query, stage]);

  const stats = useMemo(() => ({
    total: orders.length,
    waiting: orders.filter((order) => order.stage === "Ожидает макет").length,
    active: orders.filter((order) => !["Ожидает макет", "Готов"].includes(order.stage)).length,
    ready: orders.filter((order) => order.stage === "Готов").length,
    overdue: orders.filter((order) => deadlineTone(order) === "overdue").length,
  }), [orders]);

  const resetFilters = () => {
    setQuery("");
    setStage("");
    setMaster("");
    setDeadline("");
  };

  const changeStage = (id: string, nextStage: ProductionStage) => {
    updateStoredProductionStage(id, nextStage);
    setOrders(getMockProductionOrders());
    setToast(`${id}: этап изменён на «${nextStage}»`);
    window.setTimeout(() => setToast(""), 2400);
  };

  const updateProduction = (id: string, values: Parameters<typeof updateStoredProductionTask>[1], message: string) => {
    updateStoredProductionTask(id, values);
    setOrders(getMockProductionOrders());
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      {sidebar && <button aria-label="Закрыть меню" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebar(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-navy-950 text-white transition-transform lg:translate-x-0 ${sidebar ? "translate-x-0" : "-translate-x-full"}`}>
        <Link href="/" className="flex h-[82px] items-center border-b border-white/10 px-6"><div className="mr-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-600"><LayoutDashboard className="h-5 w-5" /></div><div><div className="font-bold tracking-[0.18em]">ПАМЯТЬ</div><div className="text-xs text-slate-400">ритуальная мастерская</div></div></Link>
        <nav className="flex-1 space-y-1 p-4">{nav.map(([Icon, label, href]) => href ? <Link key={label} href={href} className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${label === "Производство" ? "bg-brand-600 text-white shadow-lg shadow-blue-950/20" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}><Icon className="h-[18px] w-[18px]" />{label}{label === "Производство" && <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-xs">{orders.length}</span>}</Link> : <button key={label} className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"><Icon className="h-[18px] w-[18px]" />{label}</button>)}</nav>
        <div className="border-t border-white/10 p-4"><div className="flex items-center gap-3 rounded-xl bg-white/5 p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-sm font-semibold">ТИ</div><div><div className="text-sm font-semibold">Тимофеев И.</div><div className="text-xs text-slate-400">Менеджер</div></div></div></div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[70px] min-w-0 items-center gap-2 border-b bg-white/95 px-4 backdrop-blur md:gap-3 md:px-7">
          <button aria-label="Открыть меню" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border lg:hidden" onClick={() => setSidebar(true)}><Menu className="h-5 w-5" /></button>
          <div className="relative min-w-0 max-w-xl flex-1"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><input className="input bg-slate-50 pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по заказам, клиентам, телефонам..." /></div>
          <Link href="/orders/new" className="btn-primary hidden md:inline-flex"><Plus className="h-4 w-4" />Создать заказ</Link>
          {[CalendarDays, Bell, CircleHelp].map((Icon, index) => <button key={index} aria-label={["Календарь", "Уведомления", "Помощь"][index]} className={`relative h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 ${index === 1 ? "hidden sm:grid" : "hidden md:grid"}`}><Icon className="h-5 w-5" />{index === 1 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />}</button>)}
        </header>

        <main className="mx-auto max-w-[1800px] p-4 md:p-7 xl:p-8">
          <div className="mb-6"><div className="mb-2 text-sm text-slate-500"><Link href="/" className="font-medium hover:text-brand-700">Главная</Link> <span className="mx-2">/</span> <span className="text-slate-800">Производство</span></div><h1 className="text-3xl font-bold tracking-tight text-slate-950">Производство</h1><p className="mt-1 text-slate-500">Контроль этапов изготовления памятников</p></div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Всего в производстве", value: stats.total, Icon: ClipboardList, color: "bg-blue-50 text-blue-600" },
              { label: "Ожидают макет", value: stats.waiting, Icon: Clock3, color: "bg-violet-50 text-violet-600" },
              { label: "В работе", value: stats.active, Icon: HardHat, color: "bg-amber-50 text-amber-600" },
              { label: "Готовы", value: stats.ready, Icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
              { label: "Просрочены", value: stats.overdue, Icon: AlertTriangle, color: "bg-red-50 text-red-600" },
            ].map(({ label, value, Icon, color }) => <section key={label} className="card flex items-start justify-between p-5"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div><span className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span></section>)}
          </div>

          <section className="card mb-6 p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(300px,1.4fr)_1fr_1fr_1fr_auto]">
              <label className="relative"><Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="№ заказа, клиент или телефон" /></label>
              <label className="relative"><select className="input appearance-none pr-9" value={stage} onChange={(event) => setStage(event.target.value)}><option value="">Все этапы</option>{productionStages.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" /></label>
              <label className="relative"><select className="input appearance-none pr-9" value={master} onChange={(event) => setMaster(event.target.value)}><option value="">Все мастера</option>{Array.from(new Set(orders.map((order) => order.master))).map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" /></label>
              <input className="input" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
              <button className="btn-secondary whitespace-nowrap" onClick={resetFilters}><RotateCcw className="h-4 w-4" />Сбросить фильтры</button>
            </div>
          </section>

          <section className="mb-6 overflow-x-auto pb-2">
            <div className="grid min-w-[2100px] grid-cols-7 gap-4">
              {productionStages.map((column) => {
                const columnOrders = filtered.filter((order) => order.stage === column);
                return <div key={column} className="rounded-2xl border bg-white p-3 shadow-card"><div className="mb-3 flex items-center justify-between px-1"><h2 className="font-bold text-slate-900">{column}</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{columnOrders.length}</span></div><div className="space-y-3">{columnOrders.map((order) => <OrderCard key={order.id} order={order} onStageChange={changeStage} onMasterChange={(id, masterId) => updateProduction(id, { masterId }, "Мастер назначен")} onDeadlineChange={(id, plannedReadyAt) => updateProduction(id, { plannedReadyAt }, "Плановая готовность изменена")} />)}{!columnOrders.length && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-400">Нет заказов</div>}</div></div>;
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
            <div className="border-b px-5 py-4"><h2 className="font-bold text-slate-900">Производственный реестр</h2><p className="mt-0.5 text-sm text-slate-500">Найдено: {filtered.length}</p></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[1400px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{["№ заказа", "Клиент", "Тип изделия", "Материал", "Текущий этап", "Мастер", "Дата передачи", "Плановая готовность", "Осталось дней", "Комментарий", "Действия"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{filtered.map((order) => { const days = daysUntil(order.deadline); return <tr key={order.id} className="border-b last:border-0"><td className="px-4 py-4 font-semibold text-brand-700">{order.id}</td><td className="px-4 py-4 font-medium">{order.client}</td><td className="px-4 py-4 text-slate-600">{order.product}</td><td className="px-4 py-4 text-slate-600">{order.material}</td><td className="px-4 py-4"><select className="input h-9 min-w-40" value={order.stage} onChange={(event) => changeStage(order.id, event.target.value as ProductionStage)}>{productionStages.map((item) => <option key={item}>{item}</option>)}</select></td><td className="px-4 py-4"><select className="input h-9 min-w-44" value={order.masterId} onChange={(event) => updateProduction(order.id, { masterId: event.target.value }, "Мастер назначен")}>{masters.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></td><td className="px-4 py-4">{order.transferDate}</td><td className="px-4 py-4"><input className="input h-9 min-w-36" type="date" value={order.deadline} onChange={(event) => updateProduction(order.id, { plannedReadyAt: event.target.value }, "Плановая готовность изменена")} /></td><td className={`px-4 py-4 font-bold ${days < 0 ? "text-red-600" : days <= 3 ? "text-orange-600" : "text-slate-700"}`}>{days < 0 ? `${Math.abs(days)} дн. просрочено` : `${days} дн.`}</td><td className="px-4 py-4"><input className="input h-9 min-w-64" value={order.comment} onChange={(event) => updateProduction(order.id, { comment: event.target.value }, "Комментарий производства обновлен")} /></td><td className="px-4 py-4"><Link href={`/orders/${order.id}`} className="btn-secondary h-9">Открыть заказ</Link></td></tr>; })}</tbody></table></div>
          </section>
        </main>
      </div>

      {toast && <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl"><CheckCircle2 className="h-5 w-5 text-emerald-400" />{toast}<button aria-label="Закрыть уведомление" onClick={() => setToast("")}><X className="h-4 w-4 text-slate-400" /></button></div>}
    </div>
  );
}
