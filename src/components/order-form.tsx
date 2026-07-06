"use client";

import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  FileText,
  HandCoins,
  HardHat,
  LayoutDashboard,
  Menu,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  UploadCloud,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { calculateOrderTotals, toNonNegativeNumber, updateOrderItem } from "@/lib/order/calculations";
import { createInitialOrderData } from "@/lib/order/defaults";
import {
  createOrderSnapshot,
  DRAFT_STORAGE_KEY,
  LAST_ORDER_STORAGE_KEY,
  createFormFromStoredOrder,
  createStoredOrderFromForm,
  saveOrderLocally,
  updateStoredOrderFromForm,
} from "@/lib/order/storage";
import { type OrderFormErrors, validateOrder } from "@/lib/order/validation";
import type { OrderFormData, OrderItem, ServiceItem } from "@/types/order";

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
const nav = [
  [LayoutDashboard, "Главная"],
  [ClipboardList, "Заказы"],
  [UsersRound, "Клиенты"],
  [HardHat, "Производство"],
  [PackageCheck, "Установка"],
  [HandCoins, "Финансы"],
  [FileText, "Документы"],
  [Settings, "Настройки"],
] satisfies ReadonlyArray<readonly [LucideIcon, string]>;

function Field({
  label,
  required,
  error,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="field-label">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="card">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Select({
  value,
  onChange,
  options,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  error?: boolean;
}) {
  return (
    <div className="relative">
      <select
        className={`input appearance-none pr-10 ${error ? "border-red-400" : ""}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Выберите...</option>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
    </div>
  );
}

function SizeGroup({
  values,
  labels,
  onChange,
}: {
  values: string[];
  labels: string[];
  onChange: (index: number, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {values.map((value, index) => (
        <div key={labels[index]} className="relative">
          <input
            className="input pr-9"
            value={value}
            inputMode="decimal"
            onChange={(event) => onChange(index, event.target.value)}
          />
          <span className="absolute right-3 top-3 text-sm text-slate-400">см</span>
          <span className="mt-1 block text-xs text-slate-400">{labels[index]}</span>
        </div>
      ))}
    </div>
  );
}

export function OrderForm({ editOrderId = null }: { editOrderId?: string | null }) {
  const router = useRouter();
  const [data, setData] = useState<OrderFormData>(createInitialOrderData);
  const [errors, setErrors] = useState<OrderFormErrors>({});
  const [toast, setToast] = useState("");
  const [sidebar, setSidebar] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<OrderFormData | null>(null);
  const { serviceTotal, total, remaining } = useMemo(() => calculateOrderTotals(data), [data]);
  const isEditMode = Boolean(editOrderId);
  const pageTitle = isEditMode ? `Редактирование ${editOrderId}` : "Новый заказ";
  const submitLabel = isEditMode ? "Сохранить изменения" : "Создать заказ";

  useEffect(() => {
    if (editOrderId) {
      const orderForm = createFormFromStoredOrder(editOrderId);
      if (orderForm) {
        setData(orderForm);
        setDraft(null);
      } else {
        notify("Заказ для редактирования не найден");
      }
      return;
    }

    try {
      const saved = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) setDraft(JSON.parse(saved) as OrderFormData);
    } catch {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, [editOrderId]);

  const patch = <K extends keyof OrderFormData>(section: K, values: Partial<OrderFormData[K]>) => {
    setData((previous) => ({
      ...previous,
      [section]: { ...(previous[section] as object), ...(values as object) },
    } as OrderFormData));
    setErrors((previous) => ({ ...previous, ...(section === "customer" ? { fullName: undefined, phone: undefined } : {}), ...(section === "burialPlace" ? { deceasedFullName: undefined } : {}), ...(section === "product" ? { monumentType: undefined, material: undefined } : {}), ...(section === "payment" ? { prepayment: undefined, total: undefined } : {}) }));
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  };

  const saveDraft = () => {
    if (isEditMode) {
      notify("Черновики доступны только для нового заказа");
      return;
    }
    saveOrderLocally(DRAFT_STORAGE_KEY, createOrderSnapshot(data, "draft"));
    notify("Черновик сохранён");
  };

  const submitOrder = () => {
    const nextErrors = validateOrder(data);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      notify("Проверьте обязательные поля");
      window.setTimeout(() => document.querySelector(".border-red-400")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
      return;
    }

    if (editOrderId) {
      const updated = updateStoredOrderFromForm(editOrderId, createOrderSnapshot(data, "created"));
      if (!updated) {
        notify("Заказ для редактирования не найден");
        return;
      }
      saveOrderLocally(LAST_ORDER_STORAGE_KEY, createOrderSnapshot(data, "created"));
      notify("Изменения сохранены");
      window.setTimeout(() => router.push(`/orders/${updated.order.id}`), 500);
      return;
    }

    const created = createStoredOrderFromForm(createOrderSnapshot(data, "created"));
    saveOrderLocally(LAST_ORDER_STORAGE_KEY, createOrderSnapshot(data, "created"));
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    setDraft(null);
    notify("Заказ создан");
    window.setTimeout(() => router.push(`/orders/${created.order.id}`), 500);
  };

  const resetForm = () => {
    const hasData = data.customer.fullName || data.customer.phone || data.burialPlace.deceasedFullName || data.product.monumentType || data.product.material || data.payment.prepayment;
    if (hasData && !window.confirm("Очистить форму? Введенные данные будут удалены.")) return;
    setData(createInitialOrderData());
    setErrors({});
    setEditing(null);
    notify(isEditMode ? "Форма сброшена" : "Форма очищена");
  };

  const updateService = (id: string, values: Partial<ServiceItem>) => {
    setData((previous) => ({
      ...previous,
      services: previous.services.map((service) => service.id === id ? { ...service, ...values } : service),
    }));
  };

  const updateItem = (id: string, values: Partial<OrderItem>) => {
    setData((previous) => ({
      ...previous,
      items: previous.items.map((item) => item.id === id ? updateOrderItem(item, values) : item),
    }));
  };

  const addItem = () => {
    const id = crypto.randomUUID();
    setData((previous) => ({
      ...previous,
      items: [...previous.items, { id, name: "Новый элемент", size: "", material: "", quantity: 1, price: 0, total: 0 }],
    }));
    setEditing(id);
  };

  const addFiles = (key: string, event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    if (!selected.length) return;
    setData((previous) => ({
      ...previous,
      files: { ...previous.files, [key]: [...(previous.files[key] ?? []), ...selected] },
    }));
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      {sidebar && (
        <button
          aria-label="Закрыть меню"
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebar(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-navy-950 text-white transition-transform lg:translate-x-0 ${sidebar ? "translate-x-0" : "-translate-x-full"}`}>
        <Link href="/" className="flex h-[82px] items-center border-b border-white/10 px-6">
          <div className="mr-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-600">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold tracking-[0.18em]">ПАМЯТЬ</div>
            <div className="text-xs text-slate-400">ритуальная мастерская</div>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map(([Icon, label]) => label === "Главная" ? (
            <Link key={label} href="/" className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Icon className="h-[18px] w-[18px]" />{label}
            </Link>
          ) : label === "Заказы" ? (
            <Link
              key={label}
              href="/orders"
              className="flex h-11 w-full items-center gap-3 rounded-lg bg-brand-600 px-3 text-sm font-medium text-white shadow-lg shadow-blue-950/20"
            >
              <Icon className="h-[18px] w-[18px]" />{label}
              <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-xs">12</span>
            </Link>
          ) : label === "Клиенты" ? (
            <Link key={label} href="/clients" className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Icon className="h-[18px] w-[18px]" />{label}
            </Link>
          ) : label === "Производство" ? (
            <Link key={label} href="/production" className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Icon className="h-[18px] w-[18px]" />{label}
            </Link>
          ) : label === "Установка" ? (
            <Link key={label} href="/installation" className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Icon className="h-[18px] w-[18px]" />{label}
            </Link>
          ) : label === "Финансы" ? (
            <Link key={label} href="/finance" className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Icon className="h-[18px] w-[18px]" />{label}
            </Link>
          ) : label === "Документы" ? (
            <Link key={label} href="/documents" className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Icon className="h-[18px] w-[18px]" />{label}
            </Link>
          ) : label === "Настройки" ? (
            <Link key={label} href="/settings" className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Icon className="h-[18px] w-[18px]" />{label}
            </Link>
          ) : (
            <button key={label} className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Icon className="h-[18px] w-[18px]" />{label}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-sm font-semibold">ТИ</div>
            <div>
              <div className="text-sm font-semibold">Тимофеев И.</div>
              <div className="text-xs text-slate-400">Менеджер</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[70px] min-w-0 items-center gap-2 border-b bg-white/95 px-4 backdrop-blur md:gap-3 md:px-7">
          <button className="grid h-10 w-10 place-items-center rounded-lg border lg:hidden" onClick={() => setSidebar(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative min-w-0 max-w-xl flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input className="input bg-slate-50 pl-10" placeholder="Поиск по заказам, клиентам, телефонам..." />
          </div>
          <Link href="/orders/new" className="btn-primary hidden md:inline-flex"><Plus className="h-4 w-4" />Создать заказ</Link>
          {[CalendarDays, Bell, CircleHelp].map((Icon, index) => (
            <button
              key={index}
              aria-label={["Календарь", "Уведомления", "Помощь"][index]}
              className={`relative h-10 w-10 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 ${index === 1 ? "hidden sm:grid" : "hidden md:grid"}`}
            >
              <Icon className="h-5 w-5" />
              {index === 1 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />}
            </button>
          ))}
        </header>

        <main className="mx-auto max-w-[1540px] p-4 md:p-7 xl:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <div className="mb-2 text-sm text-slate-500"><Link href="/orders" className="hover:text-brand-600">Заказы</Link> <span className="mx-2">/</span> <span className="text-slate-800">{pageTitle}</span></div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">{pageTitle}</h1>
              <p className="mt-1 text-slate-500">{isEditMode ? "Внесите изменения и сохраните карточку заказа" : "Заполните данные заказа"}</p>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
              {!isEditMode && <button className="btn-secondary" onClick={saveDraft}>Сохранить как черновик</button>}
              <button className="btn-primary" onClick={submitOrder}><Check className="h-4 w-4" />{submitLabel}</button>
              <button className="btn-secondary" onClick={resetForm}>{isEditMode ? "Сбросить форму" : "Очистить форму"}</button>
            </div>
          </div>

          <div className="mb-6 overflow-x-auto rounded-2xl border bg-white px-6 py-5 shadow-card">
            <div className="flex min-w-[650px] items-center">
              {["Клиент", "Изделие", "Оформление", "Оплата", "Подтверждение"].map((step, index) => (
                <div key={step} className={`flex items-center ${index < 4 ? "flex-1" : ""}`}>
                  <div className="flex items-center gap-3">
                    <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${index === 0 ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"}`}>{index + 1}</span>
                    <span className={`text-sm font-semibold ${index === 0 ? "text-brand-700" : "text-slate-500"}`}>{step}</span>
                  </div>
                  {index < 4 && <div className="mx-4 h-px flex-1 bg-slate-200" />}
                </div>
              ))}
            </div>
          </div>

          <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_430px]">
            <div className="space-y-6">
              <Card title="1. Данные клиента" subtitle="Контактная информация заказчика">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="ФИО заказчика" required error={errors.fullName} className="xl:col-span-2">
                    <input className={`input ${errors.fullName ? "border-red-400" : ""}`} value={data.customer.fullName} onChange={(event) => patch("customer", { fullName: event.target.value })} />
                  </Field>
                  <Field label="Телефон" required error={errors.phone}>
                    <input className={`input ${errors.phone ? "border-red-400" : ""}`} type="tel" placeholder="+7 (___) ___-__-__" value={data.customer.phone} onChange={(event) => patch("customer", { phone: event.target.value })} />
                  </Field>
                  <Field label="Доп. телефон">
                    <input className="input" type="tel" placeholder="+7 (___) ___-__-__" value={data.customer.additionalPhone} onChange={(event) => patch("customer", { additionalPhone: event.target.value })} />
                  </Field>
                  <Field label="Адрес" className="xl:col-span-2">
                    <input className="input" value={data.customer.address} onChange={(event) => patch("customer", { address: event.target.value })} />
                  </Field>
                  <Field label="Дата приёма заказа">
                    <input className="input" type="date" value={data.customer.orderDate} onChange={(event) => patch("customer", { orderDate: event.target.value })} />
                  </Field>
                  <Field label="Менеджер">
                    <Select value={data.customer.manager} onChange={(manager) => patch("customer", { manager })} options={["Тимофеев И.", "Волкова А.", "Смирнов П."]} />
                  </Field>
                  <Field label="Источник клиента" className="md:col-span-2">
                    <Select value={data.customer.source} onChange={(source) => patch("customer", { source })} options={["Рекомендация", "Яндекс", "Авито", "Сайт", "Социальные сети", "Повторный клиент", "Другое"]} />
                  </Field>
                  <Field label="Комментарий" className="md:col-span-2">
                    <textarea className="textarea" placeholder="Дополнительная информация о клиенте" value={data.customer.comment} onChange={(event) => patch("customer", { comment: event.target.value })} />
                  </Field>
                </div>
              </Card>

              <Card title="2. Данные захоронения / место установки" subtitle="Адрес и особенности проведения работ">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Кладбище" className="xl:col-span-2">
                    <input className="input" value={data.burialPlace.cemetery} onChange={(event) => patch("burialPlace", { cemetery: event.target.value })} />
                  </Field>
                  {(["section", "row", "place"] as const).map((key, index) => (
                    <Field key={key} label={["Участок", "Ряд", "Место"][index]}>
                      <input className="input" value={data.burialPlace[key]} onChange={(event) => patch("burialPlace", { [key]: event.target.value })} />
                    </Field>
                  ))}
                  <Field label="ФИО захороненного" required error={errors.deceasedFullName} className="xl:col-span-2">
                    <input className={`input ${errors.deceasedFullName ? "border-red-400" : ""}`} value={data.burialPlace.deceasedFullName} onChange={(event) => patch("burialPlace", { deceasedFullName: event.target.value })} />
                  </Field>
                  <Field label="Дата рождения">
                    <input className="input" type="date" value={data.burialPlace.birthDate} onChange={(event) => patch("burialPlace", { birthDate: event.target.value })} />
                  </Field>
                  <Field label="Дата смерти">
                    <input className="input" type="date" value={data.burialPlace.deathDate} onChange={(event) => patch("burialPlace", { deathDate: event.target.value })} />
                  </Field>
                  <div>
                    <span className="field-label">Нужен демонтаж</span>
                    <button
                      type="button"
                      onClick={() => patch("burialPlace", { demolitionRequired: !data.burialPlace.demolitionRequired })}
                      className={`flex h-11 w-full items-center justify-between rounded-lg border px-3.5 text-sm font-medium ${data.burialPlace.demolitionRequired ? "border-brand-200 bg-brand-50 text-brand-700" : "bg-white text-slate-600"}`}
                    >
                      <span>{data.burialPlace.demolitionRequired ? "Да, требуется" : "Нет"}</span>
                      <span className={`relative h-6 w-11 rounded-full transition ${data.burialPlace.demolitionRequired ? "bg-brand-600" : "bg-slate-300"}`}>
                        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${data.burialPlace.demolitionRequired ? "left-6" : "left-1"}`} />
                      </span>
                    </button>
                  </div>
                  <Field label="Комментарий по месту установки" className="md:col-span-2 xl:col-span-3">
                    <textarea className="textarea" value={data.burialPlace.comment} onChange={(event) => patch("burialPlace", { comment: event.target.value })} />
                  </Field>
                </div>
              </Card>

              <Card title="3. Изделие" subtitle="Характеристики памятника и размеры деталей">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="Тип памятника" required error={errors.monumentType}>
                    <Select error={!!errors.monumentType} value={data.product.monumentType} onChange={(monumentType) => patch("product", { monumentType })} options={["Одинарный памятник", "Двойной памятник", "Мемориальный комплекс", "Стела", "Надгробная плита", "Другое"]} />
                  </Field>
                  <Field label="Материал" required error={errors.material}>
                    <Select error={!!errors.material} value={data.product.material} onChange={(material) => patch("product", { material })} options={["Габбро-диабаз", "Серый гранит", "Красный гранит", "Мрамор", "Искусственный камень", "Другое"]} />
                  </Field>
                  <Field label="Цвет">
                    <Select value={data.product.color} onChange={(color) => patch("product", { color })} options={["Чёрный", "Серый", "Красный", "Коричневый", "Белый", "Другой"]} />
                  </Field>
                  <Field label="Форма">
                    <Select value={data.product.shape} onChange={(shape) => patch("product", { shape })} options={["Прямая", "Волна", "Арка", "Сердце", "Крест", "Фигурная", "Индивидуальная"]} />
                  </Field>
                  <Field label="Полировка" className="md:col-span-2">
                    <Select value={data.product.polishing} onChange={(polishing) => patch("product", { polishing })} options={["Главная сторона", "Главная сторона и торцы", "Две стороны", "Полная полировка"]} />
                  </Field>
                  <Field label="Размеры стелы">
                    <SizeGroup labels={["Высота", "Ширина", "Толщина"]} values={Object.values(data.product.steleSize)} onChange={(index, value) => patch("product", { steleSize: { ...data.product.steleSize, [["height", "width", "thickness"][index]]: value } })} />
                  </Field>
                  <Field label="Размеры подставки">
                    <SizeGroup labels={["Длина", "Ширина", "Высота"]} values={Object.values(data.product.baseSize)} onChange={(index, value) => patch("product", { baseSize: { ...data.product.baseSize, [["length", "width", "height"][index]]: value } })} />
                  </Field>
                  <Field label="Размеры цветника">
                    <SizeGroup labels={["Длина", "Ширина", "Толщина"]} values={Object.values(data.product.flowerBedSize)} onChange={(index, value) => patch("product", { flowerBedSize: { ...data.product.flowerBedSize, [["length", "width", "thickness"][index]]: value } })} />
                  </Field>
                  <Field label="Загрузка эскиза" className="md:col-span-2 xl:col-span-3">
                    <label className="upload-zone">
                      <UploadCloud className="h-7 w-7 text-brand-600" />
                      <span>
                        <span className="block text-sm font-semibold text-slate-700">{data.product.sketchFile?.name ?? "Перетащите эскиз или выберите файл"}</span>
                        <span className="mt-1 block text-xs text-slate-500">JPG, PNG или PDF до 20 МБ</span>
                      </span>
                      <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(event) => patch("product", { sketchFile: event.target.files?.[0] ?? null })} />
                    </label>
                  </Field>
                </div>
              </Card>

              <Card title="4. Оформление" subtitle="Портрет, надписи и декоративные элементы">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <Field label="Портрет">
                    <Select value={data.decoration.portraitType} onChange={(portraitType) => patch("decoration", { portraitType })} options={["Нет", "Гравировка", "Керамика", "Фотокерамика", "Стекло"]} />
                  </Field>
                  <Field label="Размер портрета">
                    <input className="input" placeholder="9×12" value={data.decoration.portraitSize} onChange={(event) => patch("decoration", { portraitSize: event.target.value })} />
                  </Field>
                  <Field label="Крест / декор">
                    <input className="input" value={data.decoration.decor} onChange={(event) => patch("decoration", { decor: event.target.value })} />
                  </Field>
                  <Field label="Шрифт">
                    <Select value={data.decoration.font} onChange={(font) => patch("decoration", { font })} options={["Классический", "Рукописный", "Строгий", "Современный"]} />
                  </Field>
                  <Field label="Надпись" className="md:col-span-2">
                    <textarea className="textarea" value={data.decoration.inscription} onChange={(event) => patch("decoration", { inscription: event.target.value })} />
                  </Field>
                  <Field label="Даты" className="md:col-span-2">
                    <input className="input" placeholder="01.01.1940 — 01.01.2026" value={data.decoration.dates} onChange={(event) => patch("decoration", { dates: event.target.value })} />
                  </Field>
                  <Field label="Эпитафия" className="md:col-span-2">
                    <textarea className="textarea" value={data.decoration.epitaph} onChange={(event) => patch("decoration", { epitaph: event.target.value })} />
                  </Field>
                  <label className="flex cursor-pointer items-center gap-3 self-center rounded-xl border bg-slate-50 p-4 md:col-span-2">
                    <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={data.decoration.approveLayoutWithClient} onChange={(event) => patch("decoration", { approveLayoutWithClient: event.target.checked })} />
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">Макет согласовать с клиентом</span>
                      <span className="text-xs text-slate-500">Нужно подтверждение перед производством</span>
                    </span>
                  </label>
                </div>
              </Card>

              <Card title="5. Услуги" subtitle="Выберите дополнительные работы и укажите стоимость">
                <div className="grid gap-3 md:grid-cols-2">
                  {data.services.map((service) => (
                    <div key={service.id} className={`flex items-center gap-3 rounded-xl border p-3 transition ${service.selected ? "border-brand-200 bg-brand-50/60" : "bg-white"}`}>
                      <input type="checkbox" className="h-5 w-5 shrink-0 accent-brand-600" checked={service.selected} onChange={(event) => updateService(service.id, { selected: event.target.checked })} />
                      <span className="min-w-0 flex-1 text-sm font-medium">{service.name}</span>
                      <div className="relative w-32">
                        <input aria-label={`Цена: ${service.name}`} className="input h-9 pr-8 text-right" inputMode="numeric" disabled={!service.selected} value={service.price || ""} onChange={(event) => updateService(service.id, { price: toNonNegativeNumber(event.target.value) })} />
                        <span className="absolute right-3 top-2 text-sm text-slate-400">₽</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="7. Комплектация / детали заказа" subtitle="Состав изделия и расчёт по позициям">
                {errors.items && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{errors.items}</p>}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        {["Наименование", "Размеры", "Материал", "Кол-во", "Цена", "Сумма", "Действия"].map((heading) => <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item) => (
                        <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50/70">
                          {editing === item.id ? (
                            <>
                              <td className="p-2"><input className="input h-9" value={item.name} onChange={(event) => updateItem(item.id, { name: event.target.value })} /></td>
                              <td className="p-2"><input className="input h-9" value={item.size} onChange={(event) => updateItem(item.id, { size: event.target.value })} /></td>
                              <td className="p-2"><input className="input h-9" value={item.material} onChange={(event) => updateItem(item.id, { material: event.target.value })} /></td>
                              <td className="p-2"><input className="input h-9 w-20" type="number" min="1" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: toNonNegativeNumber(event.target.value) })} /></td>
                              <td className="p-2"><input className="input h-9 w-28" type="number" min="0" value={item.price} onChange={(event) => updateItem(item.id, { price: toNonNegativeNumber(event.target.value) })} /></td>
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-4 font-semibold text-slate-800">{item.name}</td>
                              <td className="px-3 py-4 text-slate-600">{item.size}</td>
                              <td className="px-3 py-4 text-slate-600">{item.material}</td>
                              <td className="px-3 py-4">{item.quantity} шт.</td>
                              <td className="px-3 py-4">{money(item.price)}</td>
                            </>
                          )}
                          <td className="px-3 py-4 font-semibold">{money(item.total)}</td>
                          <td className="px-3 py-4">
                            <div className="flex gap-1">
                              <button aria-label="Редактировать" onClick={() => setEditing(editing === item.id ? null : item.id)} className="icon-button text-brand-600 hover:bg-brand-50">{editing === item.id ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}</button>
                              <button aria-label="Удалить" onClick={() => setData((previous) => ({ ...previous, items: previous.items.filter((current) => current.id !== item.id) }))} className="icon-button text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="btn-secondary mt-5" onClick={addItem}><Plus className="h-4 w-4" />Добавить элемент</button>
              </Card>

              <Card title="8. Файлы" subtitle="Прикрепите материалы и документы к заказу">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  {[
                    ["site", "Фото участка"],
                    ["portrait", "Фото для портрета"],
                    ["sketch", "Эскиз"],
                    ["documents", "Документы"],
                    ["contract", "Договор"],
                  ].map(([key, label]) => (
                    <label key={key} className="file-tile">
                      <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-600 shadow-sm"><UploadCloud className="h-5 w-5" /></span>
                      <span className="text-sm font-semibold text-slate-700">{label}</span>
                      <span className="mt-1 max-w-full truncate text-xs text-slate-500">{data.files[key]?.length ? `${data.files[key].length} файл(а)` : "Выбрать файл"}</span>
                      <input multiple type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(event) => addFiles(key, event)} />
                    </label>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-500">Поддерживаются JPG, PNG и PDF. Максимальный размер файла — 20 МБ.</p>
              </Card>
            </div>

            <aside className="space-y-6 2xl:sticky 2xl:top-[94px]">
              <Card title="6. Оплата" subtitle="Финальный расчёт заказа">
                <div className="space-y-4">
                  {errors.total && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{errors.total}</p>}
                  {(["productPrice", "decorationPrice", "discount", "prepayment"] as const).map((key, index) => (
                    <Field key={key} label={["Стоимость изделия", "Стоимость оформления", "Скидка", "Предоплата"][index]} error={key === "prepayment" ? errors.prepayment : undefined}>
                      <div className="relative">
                        <input className={`input pr-10 text-right font-medium ${key === "prepayment" && errors.prepayment ? "border-red-400" : ""}`} inputMode="numeric" value={data.payment[key] || ""} onChange={(event) => patch("payment", { [key]: toNonNegativeNumber(event.target.value) })} />
                        <span className="absolute right-3.5 top-3 text-slate-400">₽</span>
                      </div>
                    </Field>
                  ))}
                  <Field label="Способ оплаты">
                    <Select value={data.payment.paymentMethod} onChange={(paymentMethod) => patch("payment", { paymentMethod })} options={["Наличные", "Карта", "Перевод", "Расчётный счёт"]} />
                  </Field>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="mb-2 flex justify-between text-sm text-slate-500"><span>Услуги</span><span>{money(serviceTotal)}</span></div>
                    <div className="mb-3 flex justify-between text-sm text-slate-500"><span>Оплачено</span><span>{money(data.payment.prepayment)}</span></div>
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-700">Итого</span>
                        <span className="text-2xl font-bold text-emerald-600">{money(total)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-orange-900">Остаток</span>
                      <span className="text-2xl font-bold text-orange-600">{money(remaining)}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-orange-200">
                      <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${total ? Math.min(100, data.payment.prepayment / total * 100) : 0}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-orange-700">Оплачено {total ? Math.round(data.payment.prepayment / total * 100) : 0}% от суммы заказа</p>
                  </div>
                  <button className="btn-primary w-full" onClick={submitOrder}><Check className="h-4 w-4" />{submitLabel}</button>
                </div>
              </Card>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex gap-3">
                  <CircleHelp className="h-5 w-5 shrink-0 text-brand-600" />
                  <div>
                    <div className="text-sm font-semibold text-blue-950">Подсказка</div>
                    <p className="mt-1 text-xs leading-5 text-blue-700">{isEditMode ? "Изменения сохраняются в локальные данные CRM и сразу отражаются в связанных разделах." : "Обязательные поля отмечены звёздочкой. Черновик хранится только на этом устройстве."}</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      {draft && !isEditMode && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600"><ClipboardList className="h-6 w-6" /></div>
            <h2 className="mt-5 text-xl font-bold text-slate-950">Восстановить черновик?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">На этом устройстве найден ранее сохранённый заказ. Можно продолжить заполнение с того же места.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => { window.localStorage.removeItem(DRAFT_STORAGE_KEY); setDraft(null); }}>Удалить</button>
              <button className="btn-primary" onClick={() => { setData(draft); setDraft(null); notify("Черновик восстановлен"); }}>Восстановить</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500"><Check className="h-4 w-4" /></span>
          {toast}
          <button aria-label="Закрыть уведомление" onClick={() => setToast("")}><X className="h-4 w-4 text-slate-400" /></button>
        </div>
      )}
    </div>
  );
}
