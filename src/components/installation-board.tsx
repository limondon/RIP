"use client";

import {
  AlertTriangle, Bell, CalendarDays, CheckCircle2, ChevronDown, CircleHelp, ClipboardList, FileText,
  HandCoins, HardHat, LayoutDashboard, Menu, Package, PackageCheck, Plus, RotateCcw, Search, Settings, Truck, UsersRound, X, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { brigades } from "@/data/mock-data";
import { getInstallationPeriod, getMockInstallations, InstallationJob, mockInstallations, installationStatuses, InstallationStatus, installationStatusStyles } from "@/lib/installation/mock-installations";
import { updateStoredInstallationTask } from "@/lib/storage";

const nav = [
  [ClipboardList, "Заказы", "/orders"],
  [UsersRound, "Клиенты", "/clients"],
  [HardHat, "Производство", "/production"],
  [PackageCheck, "Установка", "/installation"],
  [Package, "Склад", "/warehouse"],
  [HandCoins, "Финансы", "/finance"],
  [FileText, "Документы", "/documents"],
  [Settings, "Настройки", "/settings"],
] satisfies ReadonlyArray<readonly [LucideIcon, string, string]>;

const periods = ["Сегодня", "Завтра", "Эта неделя", "Следующая неделя"] as const;

function StatusBadge({ status }: { status: InstallationStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${installationStatusStyles[status]}`}>{status}</span>;
}

function CalendarCard({ job, onStatusChange, onDateChange, onTimeChange, onBrigadeChange, onCommentChange }: { job: InstallationJob; onStatusChange: (id: string, status: InstallationStatus) => void; onDateChange: (id: string, date: string) => void; onTimeChange: (id: string, time: string) => void; onBrigadeChange: (id: string, brigadeId: string) => void; onCommentChange: (id: string, comment: string) => void }) {
  return (
    <article className={`rounded-xl border p-4 shadow-sm ${job.status === "Проблема" ? "border-red-200 bg-red-50/70" : job.status === "Перенос" ? "border-orange-200 bg-orange-50/70" : "bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{job.time}</p><Link href={`/orders/${job.orderId}`} className="mt-1 block font-bold text-brand-700 hover:underline">Заказ {job.orderId}</Link></div>
        <StatusBadge status={job.status} />
      </div>
      <p className="mt-3 font-semibold text-slate-800">{job.client}</p>
      <p className="mt-1 text-sm text-slate-500">{job.phone}</p>
      <div className="mt-3 space-y-1 text-sm text-slate-600"><p><b>Кладбище:</b> {job.cemetery}</p><p><b>Бригада:</b> {job.crew}</p></div>
      <div className="mt-4 grid gap-2">
        <select className="input h-9 text-sm" value={job.status} onChange={(event) => onStatusChange(job.id, event.target.value as InstallationStatus)}>{installationStatuses.map((status) => <option key={status}>{status}</option>)}</select>
        <input className="input h-9 text-sm" type="date" value={job.date} onChange={(event) => onDateChange(job.id, event.target.value)} />
        <input className="input h-9 text-sm" type="time" value={job.time} onChange={(event) => onTimeChange(job.id, event.target.value)} />
        <select className="input h-9 text-sm" value={job.brigadeId} onChange={(event) => onBrigadeChange(job.id, event.target.value)}>{brigades.map((brigade) => <option key={brigade.id} value={brigade.id}>{brigade.name} — {brigade.members}</option>)}</select>
        <textarea className="input min-h-20 resize-none text-sm" value={job.comment} onChange={(event) => onCommentChange(job.id, event.target.value)} />
      </div>
      <Link href={`/orders/${job.orderId}`} className="btn-secondary mt-3 w-full">Открыть заказ</Link>
    </article>
  );
}

export function InstallationBoard() {
  const [jobs, setJobs] = useState(mockInstallations);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [crew, setCrew] = useState("");
  const [date, setDate] = useState("");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [sidebar, setSidebar] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setJobs(getMockInstallations());
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesQuery = !normalized || [job.orderId, job.client, job.phone, job.cemetery].some((value) => value.toLowerCase().includes(normalized));
      const matchesStatus = !status || job.status === status;
      const matchesCrew = !crew || job.brigadeId === crew;
      const matchesDate = !date || job.date === date;
      return matchesQuery && matchesStatus && matchesCrew && matchesDate;
    });
  }, [crew, date, jobs, query, status]);

  const stats = useMemo(() => ({
    total: jobs.length,
    planned: jobs.filter((job) => job.status === "Запланирована").length,
    today: jobs.filter((job) => job.date === "2026-06-16").length,
    done: jobs.filter((job) => job.status === "Установлено").length,
    problem: jobs.filter((job) => ["Проблема", "Перенос"].includes(job.status)).length,
  }), [jobs]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const updateJob = (id: string, values: Parameters<typeof updateStoredInstallationTask>[1], message: string) => {
    updateStoredInstallationTask(id, values);
    setJobs(getMockInstallations());
    notify(message);
  };

  const resetFilters = () => {
    setQuery("");
    setStatus("");
    setCrew("");
    setDate("");
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      {sidebar && <button aria-label="Закрыть меню" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebar(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-navy-950 text-white transition-transform lg:translate-x-0 ${sidebar ? "translate-x-0" : "-translate-x-full"}`}>
        <Link href="/orders" className="flex h-[82px] items-center border-b border-white/10 px-6"><div className="mr-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-600"><LayoutDashboard className="h-5 w-5" /></div><div><div className="font-bold tracking-[0.18em]">ПАМЯТЬ</div><div className="text-xs text-slate-400">ритуальная мастерская</div></div></Link>
        <nav className="flex-1 space-y-1 p-4">{nav.map(([Icon, label, href]) => href ? <Link key={label} href={href} className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${label === "Установка" ? "bg-brand-600 text-white shadow-lg shadow-blue-950/20" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}><Icon className="h-[18px] w-[18px]" />{label}{label === "Установка" && <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-xs">{jobs.length}</span>}</Link> : <button key={label} className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"><Icon className="h-[18px] w-[18px]" />{label}</button>)}</nav>
        <div className="border-t border-white/10 p-4"><div className="flex items-center gap-3 rounded-xl bg-white/5 p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-sm font-semibold">ТИ</div><div><div className="text-sm font-semibold">Тимофеев И.</div><div className="text-xs text-slate-400">Менеджер</div></div></div></div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[70px] min-w-0 items-center gap-2 border-b bg-white/95 px-4 backdrop-blur md:gap-3 md:px-7">
          <button aria-label="Открыть меню" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border lg:hidden" onClick={() => setSidebar(true)}><Menu className="h-5 w-5" /></button>
          <div className="relative min-w-0 max-w-xl flex-1"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><input className="input bg-slate-50 pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по установкам, клиентам, кладбищам..." /></div>
          <Link href="/orders/new" className="btn-primary hidden md:inline-flex"><Plus className="h-4 w-4" />Создать заказ</Link>
          {[CalendarDays, Bell, CircleHelp].map((Icon, index) => <button key={index} aria-label={["Календарь", "Уведомления", "Помощь"][index]} className={`relative h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 ${index === 1 ? "hidden sm:grid" : "hidden md:grid"}`}><Icon className="h-5 w-5" />{index === 1 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />}</button>)}
        </header>

        <main className="mx-auto max-w-[1800px] p-4 md:p-7 xl:p-8">
          <div className="mb-6"><div className="mb-2 text-sm text-slate-500">Главная <span className="mx-2">/</span> <span className="text-slate-800">Установка</span></div><h1 className="text-3xl font-bold tracking-tight text-slate-950">Установка</h1><p className="mt-1 text-slate-500">Планирование и контроль выездов на кладбища</p></div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[
            { label: "Всего установок", value: stats.total, Icon: PackageCheck, color: "bg-blue-50 text-blue-600" },
            { label: "Запланировано", value: stats.planned, Icon: CalendarDays, color: "bg-violet-50 text-violet-600" },
            { label: "Сегодня", value: stats.today, Icon: Truck, color: "bg-cyan-50 text-cyan-600" },
            { label: "Выполнено", value: stats.done, Icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
            { label: "Проблемные", value: stats.problem, Icon: AlertTriangle, color: "bg-red-50 text-red-600" },
          ].map(({ label, value, Icon, color }) => <section key={label} className="card flex items-start justify-between p-5"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div><span className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span></section>)}</div>

          <section className="card mb-6 p-5"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(320px,1.5fr)_1fr_1fr_1fr_auto]"><label className="relative"><Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="№ заказа, клиент, телефон или кладбище" /></label><label className="relative"><select className="input appearance-none pr-9" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Все статусы</option>{installationStatuses.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" /></label><label className="relative"><select className="input appearance-none pr-9" value={crew} onChange={(event) => setCrew(event.target.value)}><option value="">Все бригады</option>{brigades.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.members}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" /></label><input className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} /><button className="btn-secondary whitespace-nowrap" onClick={resetFilters}><RotateCcw className="h-4 w-4" />Сбросить фильтры</button></div></section>

          <div className="mb-6 flex rounded-2xl border bg-white p-1 shadow-card"><button className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${view === "list" ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50"}`} onClick={() => setView("list")}>Список</button><button className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${view === "calendar" ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50"}`} onClick={() => setView("calendar")}>Календарь</button></div>

          {view === "list" && <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card"><div className="border-b px-5 py-4"><h2 className="font-bold text-slate-900">Список установок</h2><p className="mt-0.5 text-sm text-slate-500">Найдено: {filtered.length}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[1700px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{["№ заказа", "Клиент", "Телефон", "Кладбище", "Участок / ряд / место", "Тип изделия", "Дата", "Время", "Бригада", "Статус", "Комментарий", "Действия"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{filtered.map((job) => <tr key={job.id} className={`border-b last:border-0 ${job.status === "Проблема" ? "bg-red-50/50" : job.status === "Перенос" ? "bg-orange-50/50" : ""}`}><td className="px-4 py-4 font-semibold text-brand-700">{job.orderId}</td><td className="px-4 py-4 font-medium">{job.client}</td><td className="px-4 py-4">{job.phone}</td><td className="px-4 py-4">{job.cemetery}</td><td className="px-4 py-4 text-slate-600">{job.place}</td><td className="px-4 py-4 text-slate-600">{job.product}</td><td className="px-4 py-4"><input className="input h-9 min-w-36" type="date" value={job.date} onChange={(event) => updateJob(job.id, { date: event.target.value }, "Дата установки изменена")} /></td><td className="px-4 py-4"><input className="input h-9 min-w-28" type="time" value={job.time} onChange={(event) => updateJob(job.id, { time: event.target.value }, "Время установки изменено")} /></td><td className="px-4 py-4"><select className="input h-9 min-w-56" value={job.brigadeId} onChange={(event) => updateJob(job.id, { brigadeId: event.target.value }, "Бригада назначена")}>{brigades.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.members}</option>)}</select></td><td className="px-4 py-4"><select className="input h-9 min-w-36" value={job.status} onChange={(event) => updateJob(job.id, { status: event.target.value as InstallationStatus }, "Статус установки изменён")}>{installationStatuses.map((item) => <option key={item}>{item}</option>)}</select><div className="mt-2"><StatusBadge status={job.status} /></div></td><td className="px-4 py-4"><input className="input h-9 min-w-64" value={job.comment} onChange={(event) => updateJob(job.id, { comment: event.target.value }, "Комментарий установки обновлен")} /></td><td className="px-4 py-4"><Link href={`/orders/${job.orderId}`} className="btn-secondary h-9">Открыть заказ</Link></td></tr>)}</tbody></table></div></section>}

          {view === "calendar" && <div className="space-y-5">{periods.map((period) => { const periodJobs = filtered.filter((job) => getInstallationPeriod(job) === period); return <section key={period} className="card"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">{period}</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{periodJobs.length}</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{periodJobs.map((job) => <CalendarCard key={job.id} job={job} onStatusChange={(id, nextStatus) => updateJob(id, { status: nextStatus }, "Статус установки изменён")} onDateChange={(id, nextDate) => updateJob(id, { date: nextDate }, "Дата установки изменена")} onTimeChange={(id, nextTime) => updateJob(id, { time: nextTime }, "Время установки изменено")} onBrigadeChange={(id, nextBrigadeId) => updateJob(id, { brigadeId: nextBrigadeId }, "Бригада назначена")} onCommentChange={(id, nextComment) => updateJob(id, { comment: nextComment }, "Комментарий установки обновлен")} />)}{!periodJobs.length && <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-400">Нет выездов</div>}</div></section>; })}</div>}

          <section className="card mt-6"><div className="mb-5"><h2 className="text-lg font-bold text-slate-900">Бригады</h2><p className="mt-1 text-sm text-slate-500">Загрузка монтажных бригад</p></div><div className="grid gap-4 md:grid-cols-3">{brigades.map((brigade) => { const crewName = `${brigade.name} — ${brigade.members}`; const crewJobs = jobs.filter((job) => job.brigadeId === brigade.id); const nearest = crewJobs.sort((a, b) => a.date.localeCompare(b.date))[0]; const load = crewJobs.length >= 5 ? "Высокая загрузка" : crewJobs.length >= 3 ? "Нормальная загрузка" : "Свободна"; return <div key={brigade.id} className="rounded-xl border bg-slate-50 p-4"><h3 className="font-bold text-slate-900">{crewName}</h3><p className="mt-3 text-sm text-slate-500">Назначено: <b className="text-slate-800">{crewJobs.length}</b></p><p className="mt-1 text-sm text-slate-500">Ближайший выезд: <b className="text-slate-800">{nearest ? `${nearest.dateLabel}, ${nearest.time}` : "нет"}</b></p><p className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${load === "Высокая загрузка" ? "bg-orange-50 text-orange-700" : load === "Нормальная загрузка" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>{load}</p></div>; })}</div></section>
        </main>
      </div>

      {toast && <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl"><CheckCircle2 className="h-5 w-5 text-emerald-400" />{toast}<button aria-label="Закрыть уведомление" onClick={() => setToast("")}><X className="h-4 w-4 text-slate-400" /></button></div>}
    </div>
  );
}
