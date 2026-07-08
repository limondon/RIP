"use client";

import {
  AlertTriangle, CheckCircle2, Plus, Save, ShieldCheck, Trash2, UploadCloud, X,
} from "lucide-react";
import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { brigades as crmBrigades, masters as crmMasters, materials as crmMaterials, serviceCatalog, statuses as crmStatuses, users as crmUsers } from "@/data/mock-data";
import { clearCrmStorage } from "@/lib/storage";

type Tab = "Общие" | "Сотрудники" | "Роли" | "Материалы" | "Услуги" | "Статусы" | "Мастера и бригады" | "Источники клиентов" | "Компания";
type ModalType = "user" | "material" | "service" | "master" | "crew" | "source" | "status" | null;
type StaffAdminItem = { id: string; name: string; phone: string; email: string; status: "Активен" | "Неактивен"; lastLogin: string; source: "demo" | "supabase" };

const tabs: Tab[] = ["Общие", "Сотрудники", "Роли", "Материалы", "Услуги", "Статусы", "Мастера и бригады", "Источники клиентов", "Компания"];
const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;

const initialUsers: StaffAdminItem[] = crmUsers.map((user, index) => ({ id: user.id, name: user.name, phone: user.phone, email: user.email, status: user.status, lastLogin: ["сегодня, 09:20", "вчера, 18:05", "15.06.2026", "14.06.2026", "01.06.2026"][index] ?? "не входил", source: "demo" }));
const initialMaterials = crmMaterials.map(({ name, color, type, price, active }) => ({ name, color, type, price, active }));
const initialServices = serviceCatalog.map(({ name, category, price, active }) => ({ name, category, price, active }));
const roleAccess = {
  Администратор: ["Заказы", "Клиенты", "Производство", "Установка", "Финансы", "Документы", "Настройки"],
  Менеджер: ["Заказы", "Клиенты", "Документы"],
  Мастер: ["Заказы: просмотр", "Производство"],
  Установщик: ["Заказы: просмотр", "Установка"],
  Бухгалтер: ["Клиенты: просмотр", "Финансы", "Документы"],
};
const permissions = ["Заказы", "Клиенты", "Производство", "Установка", "Финансы", "Документы", "Настройки"];
const statusGroups = [
  { title: "Статусы заказов", items: crmStatuses.orders },
  { title: "Статусы производства", items: crmStatuses.production },
  { title: "Статусы установки", items: crmStatuses.installation },
];
const masters = [
  ...crmMasters.map((master, index) => [master.fullName, master.specialization, master.phone, master.active, [6, 4, 5, 2, 1][index] ?? 0] as const),
];
const crews = [
  ...crmBrigades.map((brigade, index) => [brigade.name, brigade.members, brigade.phone, [5, 4, 3][index] ?? 0, brigade.status] as const),
];
const sources = [
  ["Рекомендация", 34, 41, 3840000, true],
  ["Яндекс", 18, 22, 1960000, true],
  ["Авито", 14, 17, 1420000, true],
  ["Сайт", 21, 26, 2310000, true],
  ["Социальные сети", 12, 15, 1180000, true],
  ["Повторный клиент", 9, 13, 1370000, true],
  ["Другое", 6, 7, 520000, false],
];

function Badge({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "red" | "gray" | "orange" }) {
  const styles = {
    blue: "bg-brand-50 text-brand-700 ring-brand-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    gray: "bg-slate-100 text-slate-600 ring-slate-200",
    orange: "bg-orange-50 text-orange-700 ring-orange-200",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[tone]}`}>{children}</span>;
}

function Modal({ title, children, onClose, onSave }: { title: string; children: ReactNode; onClose: () => void; onSave: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div><h2 className="text-xl font-bold text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-500">Данные сохраняются в текущем сеансе CRM.</p></div>
          <button className="icon-button text-slate-400 hover:bg-slate-100" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">{children}</div>
        <div className="mt-6 flex justify-end gap-2"><button className="btn-secondary" onClick={onClose}>Отмена</button><button className="btn-primary" onClick={onSave}>Сохранить</button></div>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label><span className="field-label">{label}</span><input className="input" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

export function SettingsDashboard() {
  const [tab, setTab] = useState<Tab>("Общие");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<ModalType>(null);
  const [users, setUsers] = useState(initialUsers);
  const [staffConnection, setStaffConnection] = useState<"checking" | "demo" | "connected">("checking");
  const [materials, setMaterials] = useState(initialMaterials);
  const [services, setServices] = useState(initialServices);
  const [settings, setSettings] = useState({
    crmName: "ПАМЯТЬ", companyType: "ритуальная мастерская", currency: "₽", timezone: "Europe/Moscow",
    language: "русский", dateFormat: "дд.мм.гггг", orderPrefix: "ЗК", year: "2026", nextNumber: "128",
  });
  const [company, setCompany] = useState({
    name: "Ритуальная мастерская «ПАМЯТЬ»", inn: "7700000000", ogrn: "1267700000000", address: "г. Москва, ул. Лесная, д. 12",
    phone: "+7 (999) 123-45-67", email: "info@pamyat-crm.ru", site: "pamyat-crm.ru", director: "Тимофеев Игорь Сергеевич",
    bank: "р/с 40702810000000000000, БИК 044525000, АО Банк",
  });
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", adminToken: "", role: "Менеджер", status: "Активен", color: "", type: "", price: "", category: "", active: true });
  const [access, setAccess] = useState<Record<string, string[]>>(roleAccess);

  useEffect(() => {
    const saved = localStorage.getItem("pamyat-settings");
    if (saved) setSettings(JSON.parse(saved));
    fetch("/api/staff")
      .then(async (response) => {
        if (!response.ok) throw new Error("Supabase staff API is not configured");
        const payload = await response.json() as { ok: boolean; staff?: StaffAdminItem[] };
        if (payload.ok && payload.staff) {
          setUsers(payload.staff.map((member) => ({ ...member, source: "supabase" })));
          setStaffConnection("connected");
        } else {
          setStaffConnection("demo");
        }
      })
      .catch(() => setStaffConnection("demo"));
  }, []);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };
  const openModal = (type: ModalType) => {
    setForm({ name: "", phone: "", email: "", password: "", adminToken: "", role: "Менеджер", status: "Активен", color: "", type: "", price: "", category: "", active: true });
    setModal(type);
  };
  const saveSettings = () => {
    localStorage.setItem("pamyat-settings", JSON.stringify(settings));
    notify("Настройки сохранены");
  };
  const saveCompany = () => notify("Реквизиты сохранены");
  const resetDemoData = () => {
    if (!window.confirm("Сбросить демо-данные? Все созданные в браузере заказы, клиенты и платежи будут удалены.")) return;
    clearCrmStorage();
    notify("Демо-данные сброшены");
    window.setTimeout(() => window.location.reload(), 600);
  };
  const saveModal = async () => {
    if (modal === "user") {
      const fallbackUser: StaffAdminItem = { id: `staff-${Date.now()}`, name: form.name || "Новый сотрудник", phone: form.phone || "+7 (000) 000-00-00", email: form.email || "staff@pamyat-crm.ru", status: form.status as "Активен" | "Неактивен", lastLogin: "еще не входил", source: "demo" };
      try {
        const response = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-staff-admin-token": form.adminToken },
          body: JSON.stringify({ name: form.name, phone: form.phone, email: form.email, password: form.password, active: form.status === "Активен" }),
        });
        const payload = await response.json() as { ok: boolean; configured?: boolean; staff?: StaffAdminItem; error?: string };
        const created = payload.staff;
        if (payload.ok && created) {
          setUsers((current) => [{ id: created.id, name: created.name, phone: created.phone, email: created.email, status: created.status, lastLogin: created.lastLogin, source: "supabase" }, ...current]);
          setStaffConnection("connected");
          setModal(null);
          notify("Сотрудник создан в Supabase Auth");
          return;
        }
        if (payload.configured !== false) throw new Error(payload.error || "Не удалось создать сотрудника");
      } catch (error) {
        notify(error instanceof Error ? error.message : "Не удалось создать сотрудника");
        return;
      }
      setUsers((current) => [fallbackUser, ...current]);
      setStaffConnection("demo");
      setModal(null);
      notify("Supabase admin key не настроен: сотрудник добавлен только в демо-список");
      return;
    }
    if (modal === "material") setMaterials((current) => [{ name: form.name || "Новый материал", color: form.color || "не указан", type: form.type || "материал", price: Number(form.price) || 0, active: form.active }, ...current]);
    if (modal === "service") setServices((current) => [{ name: form.name || "Новая услуга", category: form.category || "прочее", price: Number(form.price) || 0, active: form.active }, ...current]);
    setModal(null);
    notify("Запись добавлена");
  };
  const exampleNumber = `${settings.orderPrefix}-${settings.year}-${String(settings.nextNumber).padStart(4, "0")}`;
  const filteredUsers = useMemo(() => users.filter((user) => !query || [user.name, user.phone, user.email, user.status].some((value) => value.toLowerCase().includes(query.toLowerCase()))), [query, users]);

  return (
    <>
      <AppShell
        active="Настройки"
        title="Настройки"
        subtitle="Сотрудники, справочники и параметры CRM"
        eyebrow={<><Link href="/" className="font-medium hover:text-brand-700">Главная</Link> <span className="mx-2">/</span> <span className="text-slate-800">Настройки</span></>}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Поиск по настройкам, пользователям, справочникам..."
      >
          <div className="mb-6 overflow-x-auto rounded-2xl border bg-white px-2 shadow-card"><div className="flex min-w-max">{tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`relative px-4 py-4 text-sm font-semibold ${tab === item ? "text-brand-700" : "text-slate-500 hover:text-slate-800"}`}>{item}{tab === item && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-600" />}</button>)}</div></div>

          {tab === "Общие" && <section className="card"><h2 className="text-lg font-bold">Общие настройки CRM</h2><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[
            ["Название CRM", "crmName"], ["Тип компании", "companyType"], ["Валюта", "currency"], ["Часовой пояс", "timezone"], ["Язык интерфейса", "language"], ["Формат даты", "dateFormat"],
          ].map(([label, key]) => <TextField key={key} label={label} value={settings[key as keyof typeof settings]} onChange={(value) => setSettings({ ...settings, [key]: value })} />)}</div><div className="mt-8 rounded-2xl border bg-slate-50 p-5"><h3 className="font-bold">Нумерация заказов</h3><div className="mt-4 grid gap-4 md:grid-cols-4"><TextField label="Префикс заказа" value={settings.orderPrefix} onChange={(value) => setSettings({ ...settings, orderPrefix: value })} /><TextField label="Текущий год" value={settings.year} onChange={(value) => setSettings({ ...settings, year: value })} /><TextField label="Следующий номер заказа" value={settings.nextNumber} onChange={(value) => setSettings({ ...settings, nextNumber: value })} /><div><span className="field-label">Пример номера</span><div className="flex h-11 items-center rounded-lg border bg-white px-3.5 font-bold text-brand-700">{exampleNumber}</div></div></div></div><div className="mt-6 flex flex-wrap gap-2"><button className="btn-primary" onClick={saveSettings}><Save className="h-4 w-4" />Сохранить настройки</button><button className="btn-secondary border-red-200 text-red-700 hover:bg-red-50" onClick={resetDemoData}>Сбросить демо-данные</button></div></section>}

          {tab === "Сотрудники" && <section className="card"><div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Сотрудники</h2><p className="text-sm text-slate-500">Один тип доступа: сотрудник CRM</p></div><button className="btn-primary" onClick={() => openModal("user")}><Plus className="h-4 w-4" />Добавить сотрудника</button></div>{staffConnection !== "connected" && <div className="mb-5 flex gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><b>Supabase admin key пока не подключен.</b><br />Добавление работает в демо-список. Для реального создания нужны `SUPABASE_SERVICE_ROLE_KEY` и `STAFF_ADMIN_SETUP_TOKEN` в Vercel.</div></div>}<Table headers={["Имя", "Телефон", "Email", "Статус", "Источник", "Последний вход", "Действия"]}>{filteredUsers.map((user) => <tr key={user.email} className="border-b last:border-0"><Td strong>{user.name}</Td><Td>{user.phone}</Td><Td>{user.email}</Td><Td><Badge tone={user.status === "Активен" ? "green" : "gray"}>{user.status}</Badge></Td><Td><Badge tone={user.source === "supabase" ? "blue" : "orange"}>{user.source === "supabase" ? "Supabase" : "Демо"}</Badge></Td><Td>{user.lastLogin}</Td><Td><Actions /></Td></tr>)}</Table></section>}

          {tab === "Роли" && <section className="grid gap-5 xl:grid-cols-2">{Object.entries(access).map(([role, rights]) => <div key={role} className="card"><div className="mb-4 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><ShieldCheck className="h-5 w-5" /></span><div><h2 className="font-bold">{role}</h2><p className="text-sm text-slate-500">Права доступа</p></div></div><div className="grid gap-3 sm:grid-cols-2">{permissions.map((permission) => <label key={permission} className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3 text-sm font-medium"><input type="checkbox" checked={rights.includes(permission) || rights.includes(`${permission}: просмотр`)} onChange={(event) => setAccess((current) => ({ ...current, [role]: event.target.checked ? Array.from(new Set([...current[role], permission])) : current[role].filter((item) => item !== permission && item !== `${permission}: просмотр`) }))} />{permission}</label>)}</div><button className="btn-primary mt-5" onClick={() => notify("Права сохранены")}><Save className="h-4 w-4" />Сохранить права</button></div>)}</section>}

          {tab === "Материалы" && <Directory title="Материалы" button="Добавить материал" onAdd={() => openModal("material")} headers={["Название материала", "Цвет", "Тип", "Цена за единицу", "Активен", "Действия"]}>{materials.map((item) => <tr key={String(item.name)} className="border-b last:border-0"><Td strong>{item.name}</Td><Td>{item.color}</Td><Td>{item.type}</Td><Td>{money(item.price)}</Td><Td><Badge tone={item.active ? "green" : "gray"}>{item.active ? "Да" : "Нет"}</Badge></Td><Td><Actions /></Td></tr>)}</Directory>}

          {tab === "Услуги" && <Directory title="Услуги" button="Добавить услугу" onAdd={() => openModal("service")} headers={["Услуга", "Категория", "Базовая цена", "Активна", "Действия"]}>{services.map((item) => <tr key={String(item.name)} className="border-b last:border-0"><Td strong>{item.name}</Td><Td>{item.category}</Td><Td>{money(item.price)}</Td><Td><Badge tone={item.active ? "green" : "gray"}>{item.active ? "Да" : "Нет"}</Badge></Td><Td><Actions /></Td></tr>)}</Directory>}

          {tab === "Статусы" && <div className="space-y-5">{statusGroups.map((group) => <section key={group.title} className="card"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold">{group.title}</h2><button className="btn-secondary" onClick={() => openModal("status")}><Plus className="h-4 w-4" />Добавить статус</button></div><Table headers={["Название", "Цвет", "Порядок", "Активен"]}>{group.items.map((item, index) => <tr key={item} className="border-b last:border-0"><Td strong>{item}</Td><Td><Badge tone={item.includes("Проблема") || item.includes("Перенос") ? "red" : item.includes("Готов") || item.includes("Завершен") || item.includes("Установлено") ? "green" : "blue"}>{item}</Badge></Td><Td>{index + 1}</Td><Td><Badge tone="green">Да</Badge></Td></tr>)}</Table></section>)}</div>}

          {tab === "Мастера и бригады" && <div className="grid gap-6 xl:grid-cols-2"><Directory title="Мастера производства" button="Добавить мастера" onAdd={() => openModal("master")} headers={["ФИО", "Специализация", "Телефон", "Активен", "Заказов", "Действия"]}>{masters.map(([name, spec, phone, active, count]) => <tr key={String(name)} className="border-b last:border-0"><Td strong>{name}</Td><Td>{spec}</Td><Td>{phone}</Td><Td><Badge tone={active ? "green" : "gray"}>{active ? "Да" : "Нет"}</Badge></Td><Td>{count}</Td><Td><Actions /></Td></tr>)}</Directory><Directory title="Бригады установки" button="Добавить бригаду" onAdd={() => openModal("crew")} headers={["Название", "Состав", "Телефон", "Установок", "Статус", "Действия"]}>{crews.map(([name, people, phone, count, status]) => <tr key={String(name)} className="border-b last:border-0"><Td strong>{name}</Td><Td>{people}</Td><Td>{phone}</Td><Td>{count}</Td><Td><Badge tone={status === "Свободна" ? "green" : status === "Загружена" ? "orange" : "blue"}>{status}</Badge></Td><Td><Actions /></Td></tr>)}</Directory></div>}

          {tab === "Источники клиентов" && <Directory title="Источники клиентов" button="Добавить источник" onAdd={() => openModal("source")} headers={["Источник", "Клиентов", "Заказов", "Сумма заказов", "Активен", "Действия"]}>{sources.map(([name, clients, orders, sum, active]) => <tr key={String(name)} className="border-b last:border-0"><Td strong>{name}</Td><Td>{clients}</Td><Td>{orders}</Td><Td>{money(Number(sum))}</Td><Td><Badge tone={active ? "green" : "gray"}>{active ? "Да" : "Нет"}</Badge></Td><Td><Actions /></Td></tr>)}</Directory>}

          {tab === "Компания" && <section className="card"><h2 className="text-lg font-bold">Реквизиты компании</h2><div className="mt-6 grid gap-4 md:grid-cols-2">{Object.entries({ name: "Название компании", inn: "ИНН", ogrn: "ОГРН", address: "Адрес", phone: "Телефон", email: "Email", site: "Сайт", director: "Руководитель", bank: "Банковские реквизиты" }).map(([key, label]) => <TextField key={key} label={label} value={company[key as keyof typeof company]} onChange={(value) => setCompany({ ...company, [key]: value })} />)}</div><label className="upload-zone mt-6"><UploadCloud className="h-7 w-7 text-brand-600" /><span><b>Загрузить логотип или печать</b><br /><span className="text-sm text-slate-500">PNG, JPG или PDF для будущих документов</span></span><input type="file" className="hidden" onChange={() => notify("Файл выбран")} /></label><button className="btn-primary mt-6" onClick={saveCompany}><Save className="h-4 w-4" />Сохранить реквизиты</button></section>}
      </AppShell>

      {modal && <Modal title={modalTitle(modal)} onClose={() => setModal(null)} onSave={saveModal}>
        {modal === "user" && <><TextField label="Имя" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><TextField label="Телефон" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /><TextField label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} type="email" /><TextField label="Временный пароль" value={form.password} onChange={(value) => setForm({ ...form, password: value })} type="password" /><TextField label="Код администратора" value={form.adminToken} onChange={(value) => setForm({ ...form, adminToken: value })} type="password" /><label><span className="field-label">Статус</span><select className="input" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Активен</option><option>Неактивен</option></select></label></>}
        {modal === "material" && <><TextField label="Название материала" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><TextField label="Цвет" value={form.color} onChange={(value) => setForm({ ...form, color: value })} /><TextField label="Тип" value={form.type} onChange={(value) => setForm({ ...form, type: value })} /><TextField label="Цена за единицу" value={form.price} onChange={(value) => setForm({ ...form, price: value })} /><Check value={form.active} onChange={(value) => setForm({ ...form, active: value })}>Активен</Check></>}
        {modal === "service" && <><TextField label="Название" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><TextField label="Категория" value={form.category} onChange={(value) => setForm({ ...form, category: value })} /><TextField label="Базовая цена" value={form.price} onChange={(value) => setForm({ ...form, price: value })} /><Check value={form.active} onChange={(value) => setForm({ ...form, active: value })}>Активна</Check></>}
        {["master", "crew", "source", "status"].includes(modal) && <><TextField label="Название / ФИО" value={form.name} onChange={(value) => setForm({ ...form, name: value })} /><TextField label="Описание" value={form.category} onChange={(value) => setForm({ ...form, category: value })} /><Check value={form.active} onChange={(value) => setForm({ ...form, active: value })}>Активен</Check></>}
      </Modal>}
      {toast && <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl"><CheckCircle2 className="h-5 w-5 text-emerald-400" />{toast}<button onClick={() => setToast("")}><X className="h-4 w-4 text-slate-400" /></button></div>}
    </>
  );
}

function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
function Td({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return <td className={`px-4 py-4 ${strong ? "font-semibold text-slate-900" : ""}`}>{children}</td>;
}
function Actions() {
  return <div className="flex gap-1"><button className="btn-secondary h-8 px-3 text-xs">Редактировать</button><button className="btn-secondary h-8 px-3 text-xs">Отключить</button><button className="icon-button text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div>;
}
function Directory({ title, button, onAdd, headers, children }: { title: string; button: string; onAdd: () => void; headers: string[]; children: ReactNode }) {
  return <section className="card"><div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">{title}</h2><p className="text-sm text-slate-500">Справочник CRM</p></div><button className="btn-primary" onClick={onAdd}><Plus className="h-4 w-4" />{button}</button></div><Table headers={headers}>{children}</Table></section>;
}
function Check({ value, onChange, children }: { value: boolean; onChange: (value: boolean) => void; children: ReactNode }) {
  return <label className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3 text-sm font-medium"><input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />{children}</label>;
}
function modalTitle(type: Exclude<ModalType, null>) {
  const titles = { user: "Добавить сотрудника", material: "Добавить материал", service: "Добавить услугу", master: "Добавить мастера", crew: "Добавить бригаду", source: "Добавить источник", status: "Добавить статус" };
  return titles[type];
}
