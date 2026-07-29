"use client";

import { Bell, CalendarDays, CircleHelp, ClipboardList, HardHat, PackageCheck, Settings, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Tool = "calendar" | "notifications" | "help";

const toolLabels: Record<Tool, string> = {
  calendar: "Календарь",
  notifications: "Уведомления",
  help: "Быстрые ссылки",
};

export function HeaderTools() {
  const [active, setActive] = useState<Tool | null>(null);

  const toggle = (tool: Tool) => setActive((current) => current === tool ? null : tool);

  return (
    <div className="relative flex shrink-0 items-center gap-1">
      <button
        type="button"
        aria-label="Календарь"
        aria-expanded={active === "calendar"}
        className="header-tool hidden md:grid"
        onClick={() => toggle("calendar")}
      >
        <CalendarDays className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Уведомления"
        aria-expanded={active === "notifications"}
        className="header-tool relative hidden sm:grid"
        onClick={() => toggle("notifications")}
      >
        <Bell className="h-5 w-5" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
      </button>
      <button
        type="button"
        aria-label="Быстрые ссылки"
        aria-expanded={active === "help"}
        className="header-tool hidden md:grid"
        onClick={() => toggle("help")}
      >
        <CircleHelp className="h-5 w-5" />
      </button>

      {active && (
        <>
          <button
            type="button"
            aria-label="Закрыть панель"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setActive(null)}
          />
          <section className="absolute right-0 top-12 z-40 w-72 rounded-xl border bg-white p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between px-2">
              <h2 className="text-sm font-bold text-slate-900">{toolLabels[active]}</h2>
              <button type="button" className="icon-button text-slate-400 hover:bg-slate-100" aria-label="Закрыть" onClick={() => setActive(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {active === "calendar" && (
              <div className="space-y-1">
                <ToolLink href="/installation" icon={PackageCheck} title="Календарь установок" subtitle="Выезды и назначенные бригады" />
                <ToolLink href="/production" icon={HardHat} title="План производства" subtitle="Сроки готовности заказов" />
              </div>
            )}
            {active === "notifications" && (
              <div className="space-y-1">
                <ToolLink href="/orders" icon={ClipboardList} title="Заказы требуют внимания" subtitle="Проверьте сроки, оплаты и статусы" />
                <ToolLink href="/installation" icon={PackageCheck} title="Ближайшие установки" subtitle="Расписание доступно в разделе установки" />
              </div>
            )}
            {active === "help" && (
              <div className="space-y-1">
                <ToolLink href="/orders" icon={ClipboardList} title="Заказы" subtitle="Карточки, оплаты и документы" />
                <ToolLink href="/settings" icon={Settings} title="Настройки CRM" subtitle="Сотрудники и справочники" />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function ToolLink({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: typeof CalendarDays;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} className="flex items-start gap-3 rounded-lg p-2.5 transition hover:bg-slate-50">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-800">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-slate-500">{subtitle}</span>
      </span>
    </Link>
  );
}
