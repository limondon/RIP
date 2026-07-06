"use client";

import {
  Bell,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  FileText,
  HandCoins,
  HardHat,
  LayoutDashboard,
  Menu,
  Package,
  PackageCheck,
  Search,
  Settings,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { ReactNode, useState } from "react";

const navItems = [
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

type AppShellProps = {
  active: string;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  eyebrow?: ReactNode;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  primaryAction?: ReactNode;
  mobileAction?: ReactNode;
  badges?: Partial<Record<string, ReactNode>>;
};

export function AppShell({
  active,
  children,
  title,
  subtitle,
  eyebrow,
  searchValue,
  searchPlaceholder = "Поиск...",
  onSearchChange,
  primaryAction,
  mobileAction,
  badges = {},
}: AppShellProps) {
  const [sidebar, setSidebar] = useState(false);
  const hasSearch = typeof searchValue === "string" && onSearchChange;

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      {sidebar && <button aria-label="Закрыть меню" className="app-chrome fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebar(false)} />}

      <aside className={`app-chrome fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-navy-950 text-white transition-transform lg:translate-x-0 ${sidebar ? "translate-x-0" : "-translate-x-full"}`}>
        <Link href="/" className="flex h-[82px] items-center border-b border-white/10 px-6">
          <div className="mr-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-600"><LayoutDashboard className="h-5 w-5" /></div>
          <div><div className="font-bold tracking-[0.18em]">ПАМЯТЬ</div><div className="text-xs text-slate-400">ритуальная мастерская</div></div>
        </Link>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(([Icon, label, href]) => {
            const isActive = label === active;
            return (
              <Link key={label} href={href} className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${isActive ? "bg-brand-600 text-white shadow-lg shadow-blue-950/20" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}>
                <Icon className="h-[18px] w-[18px]" />{label}
                {badges[label] && <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-xs">{badges[label]}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-sm font-semibold">ТИ</div>
            <div><div className="text-sm font-semibold">Тимофеев И.</div><div className="text-xs text-slate-400">Менеджер</div></div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="app-chrome sticky top-0 z-20 flex h-[70px] min-w-0 items-center gap-2 border-b bg-white/95 px-4 backdrop-blur md:gap-3 md:px-7">
          <button aria-label="Открыть меню" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border lg:hidden" onClick={() => setSidebar(true)}><Menu className="h-5 w-5" /></button>
          {hasSearch ? (
            <div className="relative min-w-0 max-w-xl flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input className="input bg-slate-50 pl-10" value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchPlaceholder} />
            </div>
          ) : <div className="min-w-0 flex-1" />}
          {primaryAction}
          {[CalendarDays, Bell, CircleHelp].map((Icon, index) => (
            <button key={index} aria-label={["Календарь", "Уведомления", "Помощь"][index]} className={`relative h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 ${index === 1 ? "hidden sm:grid" : "hidden md:grid"}`}>
              <Icon className="h-5 w-5" />{index === 1 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />}
            </button>
          ))}
        </header>

        <main className="mx-auto max-w-[1700px] p-4 md:p-7 xl:p-8">
          {(title || subtitle || eyebrow || mobileAction) && (
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                {eyebrow && <div className="mb-2 text-sm text-slate-500">{eyebrow}</div>}
                {title && <h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1>}
                {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
              </div>
              {mobileAction}
            </div>
          )}
          {children}
        </main>
      </div>

      {sidebar && <button aria-label="Закрыть меню" className="app-chrome fixed right-4 top-4 z-50 grid h-10 w-10 place-items-center rounded-lg bg-white text-slate-700 shadow-lg lg:hidden" onClick={() => setSidebar(false)}><X className="h-5 w-5" /></button>}
    </div>
  );
}
