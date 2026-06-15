"use client";

import {
  Bell, CalendarDays, Check, ChevronDown, CircleHelp, ClipboardList,
  FileText, HandCoins, HardHat, LayoutDashboard, Menu, PackageCheck, Pencil,
  Plus, Search, Settings, Trash2, UploadCloud, UsersRound, X,
} from "lucide-react";
import { ChangeEvent, ReactNode, useMemo, useState } from "react";
import type { OrderFormData, OrderItem, ServiceItem } from "@/types/order";
import { calculateOrderTotals, toNonNegativeNumber, updateOrderItem } from "@/lib/order/calculations";
import { createInitialOrderData } from "@/lib/order/defaults";
import {
  createOrderSnapshot,
  DRAFT_STORAGE_KEY,
  LAST_ORDER_STORAGE_KEY,
  saveOrderLocally,
} from "@/lib/order/storage";
import { type OrderFormErrors, validateOrder } from "@/lib/order/validation";

const money = (value: number) => new Intl.NumberFormat("ru-RU").format(value) + " ₽";

const nav = [
  [ClipboardList, "Заказы"], [UsersRound, "Клиенты"], [HardHat, "Производство"],
  [PackageCheck, "Установка"], [HandCoins, "Финансы"], [FileText, "Документы"], [Settings, "Настройки"],
] as const;

function Field({ label, required, error, children, className = "" }: { label: string; required?: boolean; error?: string; children: ReactNode; className?: string }) {
  return <label className={className}><span className="field-label">{label}{required && <span className="ml-1 text-red-500">*</span>}</span>{children}{error && <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span>}</label>;
}
function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <section className="card"><div className="mb-5"><h2 className="text-lg font-bold text-slate-900">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>{children}</section>;
}
function Select({ value, onChange, options, error }: { value: string; onChange: (value: string) => void; options: string[]; error?: boolean }) {
  return <div className="relative"><select className={`input appearance-none pr-10 ${error ? "border-red-400" : ""}`} value={value} onChange={e => onChange(e.target.value)}><option value="">Выберите...</option>{options.map(x => <option key={x}>{x}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" /></div>;
}
function SizeGroup({ values, labels, onChange }: { values: string[]; labels: string[]; onChange: (index: number, value: string) => void }) {
  return <div className="grid grid-cols-3 gap-2">{values.map((value, i) => <div key={labels[i]} className="relative"><input className="input pr-9" value={value} onChange={e => onChange(i, e.target.value)} inputMode="decimal"/><span className="absolute right-3 top-3 text-sm text-slate-400">см</span><span className="mt-1 block text-xs text-slate-400">{labels[i]}</span></div>)}</div>;
}

export function OrderForm() {
  const [data, setData] = useState<OrderFormData>(createInitialOrderData);
  const [errors, setErrors] = useState<OrderFormErrors>({});
  const [toast, setToast] = useState("");
  const [sidebar, setSidebar] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const { serviceTotal, total, remaining } = useMemo(() => calculateOrderTotals(data), [data]);

  const patch = <K extends keyof OrderFormData>(section: K, values: Partial<OrderFormData[K]>) =>
    setData(prev => ({
      ...prev,
      [section]: { ...(prev[section] as object), ...(values as object) },
    } as OrderFormData));
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2800); };
  const saveDraft = () => {
    saveOrderLocally(DRAFT_STORAGE_KEY, createOrderSnapshot(data, "draft"));
    notify("Черновик сохранен");
  };
  const createOrder = () => {
    const next = validateOrder(data);
    setErrors(next);
    if (Object.keys(next).length) { notify("Проверьте обязательные поля"); document.querySelector(".border-red-400")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    const order = createOrderSnapshot(data, "created");
    saveOrderLocally(LAST_ORDER_STORAGE_KEY, order);
    console.log("Заказ создан", order);
    notify("Заказ создан");
  };
  const updateService = (id: string, values: Partial<ServiceItem>) => setData(p => ({ ...p, services: p.services.map(s => s.id === id ? { ...s, ...values } : s) }));
  const updateItem = (id: string, values: Partial<OrderItem>) => setData(p => ({ ...p, items: p.items.map(item => item.id === id ? updateOrderItem(item, values) : item) }));
  const addItem = () => { const id = crypto.randomUUID(); setData(p => ({ ...p, items: [...p.items, { id, name: "Новый элемент", size: "", material: "", quantity: 1, price: 0, total: 0 }] })); setEditing(id); };
  const addFiles = (key: string, event: ChangeEvent<HTMLInputElement>) => { const files = Array.from(event.target.files ?? []); if (files.length) setData(p => ({ ...p, files: { ...p.files, [key]: [...(p.files[key] ?? []), ...files] } })); };

  return <div className="min-h-screen bg-[#f4f6f9]">
    {sidebar && <button aria-label="Закрыть меню" className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setSidebar(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-navy-950 text-white transition-transform lg:translate-x-0 ${sidebar ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-[82px] items-center border-b border-white/10 px-6"><div className="mr-3 grid h-10 w-10 place-items-center rounded-xl bg-brand-600"><LayoutDashboard className="h-5 w-5" /></div><div><div className="font-bold tracking-[0.18em]">ПАМЯТЬ</div><div className="text-xs text-slate-400">ритуальная мастерская</div></div></div>
      <nav className="flex-1 space-y-1 p-4">{nav.map(([Icon, label]) => <button key={label} className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${label === "Заказы" ? "bg-brand-600 text-white shadow-lg shadow-blue-950/20" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}><Icon className="h-[18px] w-[18px]" />{label}{label === "Заказы" && <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-xs">24</span>}</button>)}</nav>
      <div className="border-t border-white/10 p-4"><div className="flex items-center gap-3 rounded-xl bg-white/5 p-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-sm font-semibold">ТИ</div><div><div className="text-sm font-semibold">Тимофеев И.</div><div className="text-xs text-slate-400">Менеджер</div></div></div></div>
    </aside>

    <div className="lg:pl-[252px]">
      <header className="sticky top-0 z-20 flex h-[70px] items-center gap-3 border-b bg-white/95 px-4 backdrop-blur md:px-7">
        <button className="grid h-10 w-10 place-items-center rounded-lg border lg:hidden" onClick={() => setSidebar(true)}><Menu className="h-5 w-5" /></button>
        <div className="relative max-w-xl flex-1"><Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400"/><input className="input bg-slate-50 pl-10" placeholder="Поиск по заказам, клиентам, телефонам..." /></div>
        <button className="btn-primary hidden md:inline-flex"><Plus className="h-4 w-4"/>Создать заказ</button>
        {[CalendarDays, Bell, CircleHelp].map((Icon, i) => <button key={i} aria-label={["Календарь", "Уведомления", "Помощь"][i]} className="relative grid h-10 w-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><Icon className="h-5 w-5"/>{i === 1 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500"/>}</button>)}
      </header>

      <main className="mx-auto max-w-[1540px] p-4 md:p-7 xl:p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div><div className="mb-2 text-sm text-slate-500"><span>Заказы</span><span className="mx-2">/</span><span className="text-slate-800">Новый заказ</span></div><h1 className="text-3xl font-bold tracking-tight text-slate-950">Новый заказ</h1><p className="mt-1 text-slate-500">Заполните данные заказа</p></div>
          <div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={saveDraft}>Сохранить как черновик</button><button className="btn-primary" onClick={createOrder}><Check className="h-4 w-4"/>Создать заказ</button><button className="btn-secondary" onClick={() => setData(createInitialOrderData())}>Отмена</button></div>
        </div>

        <div className="mb-6 overflow-x-auto rounded-2xl border bg-white px-6 py-5 shadow-card"><div className="flex min-w-[650px] items-center">{["Клиент", "Изделие", "Оформление", "Оплата", "Подтверждение"].map((step, i) => <div key={step} className={`flex items-center ${i < 4 ? "flex-1" : ""}`}><div className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${i === 0 ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span><span className={`text-sm font-semibold ${i === 0 ? "text-brand-700" : "text-slate-500"}`}>{step}</span></div>{i < 4 && <div className="mx-4 h-px flex-1 bg-slate-200"/>}</div>)}</div></div>

        <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="space-y-6">
            <Card title="1. Данные клиента" subtitle="Контактная информация заказчика">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Field label="ФИО заказчика" required error={errors.fullName} className="xl:col-span-2"><input className={`input ${errors.fullName ? "border-red-400" : ""}`} value={data.customer.fullName} onChange={e => patch("customer", { fullName: e.target.value })}/></Field>
                <Field label="Телефон" required error={errors.phone}><input className={`input ${errors.phone ? "border-red-400" : ""}`} type="tel" value={data.customer.phone} onChange={e => patch("customer", { phone: e.target.value })}/></Field>
                <Field label="Доп. телефон"><input className="input" type="tel" placeholder="+7 (___) ___-__-__" value={data.customer.additionalPhone} onChange={e => patch("customer", { additionalPhone: e.target.value })}/></Field>
                <Field label="Адрес" className="xl:col-span-2"><input className="input" value={data.customer.address} onChange={e => patch("customer", { address: e.target.value })}/></Field>
                <Field label="Дата приема заказа"><input className="input" type="date" value={data.customer.orderDate} onChange={e => patch("customer", { orderDate: e.target.value })}/></Field>
                <Field label="Менеджер"><Select value={data.customer.manager} onChange={manager => patch("customer", { manager })} options={["Тимофеев И.", "Волкова А.", "Смирнов П."]}/></Field>
                <Field label="Источник клиента" className="md:col-span-2"><Select value={data.customer.source} onChange={source => patch("customer", { source })} options={["Рекомендация", "Яндекс", "Авито", "Сайт", "Социальные сети", "Повторный клиент", "Другое"]}/></Field>
                <Field label="Комментарий" className="md:col-span-2"><textarea className="textarea" placeholder="Дополнительная информация о клиенте" value={data.customer.comment} onChange={e => patch("customer", { comment: e.target.value })}/></Field>
              </div>
            </Card>

            <Card title="2. Данные захоронения / место установки" subtitle="Адрес и особенности проведения работ">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Кладбище" className="xl:col-span-2"><input className="input" value={data.burialPlace.cemetery} onChange={e => patch("burialPlace", { cemetery: e.target.value })}/></Field>
                {(["section", "row", "place"] as const).map((key, i) => <Field key={key} label={["Участок", "Ряд", "Место"][i]}><input className="input" value={data.burialPlace[key]} onChange={e => patch("burialPlace", { [key]: e.target.value })}/></Field>)}
                <Field label="ФИО захороненного" className="xl:col-span-2"><input className="input" value={data.burialPlace.deceasedFullName} onChange={e => patch("burialPlace", { deceasedFullName: e.target.value })}/></Field>
                <Field label="Дата рождения"><input className="input" type="date" value={data.burialPlace.birthDate} onChange={e => patch("burialPlace", { birthDate: e.target.value })}/></Field>
                <Field label="Дата смерти"><input className="input" type="date" value={data.burialPlace.deathDate} onChange={e => patch("burialPlace", { deathDate: e.target.value })}/></Field>
                <div><span className="field-label">Нужен демонтаж</span><button type="button" onClick={() => patch("burialPlace", { demolitionRequired: !data.burialPlace.demolitionRequired })} className={`flex h-11 w-full items-center justify-between rounded-lg border px-3.5 text-sm font-medium ${data.burialPlace.demolitionRequired ? "border-brand-200 bg-brand-50 text-brand-700" : "bg-white text-slate-600"}`}><span>{data.burialPlace.demolitionRequired ? "Да, требуется" : "Нет"}</span><span className={`relative h-6 w-11 rounded-full transition ${data.burialPlace.demolitionRequired ? "bg-brand-600" : "bg-slate-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${data.burialPlace.demolitionRequired ? "left-6" : "left-1"}`}/></span></button></div>
                <Field label="Комментарий по месту установки" className="md:col-span-2 xl:col-span-3"><textarea className="textarea" value={data.burialPlace.comment} onChange={e => patch("burialPlace", { comment: e.target.value })}/></Field>
              </div>
            </Card>

            <Card title="3. Изделие" subtitle="Характеристики памятника и размеры деталей">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Тип памятника" required error={errors.monumentType}><Select error={!!errors.monumentType} value={data.product.monumentType} onChange={monumentType => patch("product", { monumentType })} options={["Одинарный памятник", "Двойной памятник", "Комплекс", "Стела", "Цветник", "Надгробная плита", "Ограда", "Другое"]}/></Field>
                <Field label="Материал" required error={errors.material}><Select error={!!errors.material} value={data.product.material} onChange={material => patch("product", { material })} options={["Гранит, габбро-диабаз", "Гранит серый", "Гранит красный", "Мрамор", "Искусственный камень", "Другое"]}/></Field>
                <Field label="Цвет"><Select value={data.product.color} onChange={color => patch("product", { color })} options={["Черный", "Серый", "Красный", "Коричневый", "Белый", "Другой"]}/></Field>
                <Field label="Форма"><Select value={data.product.shape} onChange={shape => patch("product", { shape })} options={["Прямая", "Волна", "Арка", "Сердце", "Крест", "Фигурная", "Фигурная, волна", "Индивидуальная"]}/></Field>
                <Field label="Полировка" className="md:col-span-2"><Select value={data.product.polishing} onChange={polishing => patch("product", { polishing })} options={["Главная сторона", "Главная сторона и торцы", "Две стороны", "Полная полировка"]}/></Field>
                <Field label="Размер стелы"><SizeGroup labels={["Высота", "Ширина", "Толщина"]} values={Object.values(data.product.steleSize)} onChange={(i, value) => patch("product", { steleSize: { ...data.product.steleSize, [["height", "width", "thickness"][i]]: value } })}/></Field>
                <Field label="Размер подставки"><SizeGroup labels={["Длина", "Ширина", "Высота"]} values={Object.values(data.product.baseSize)} onChange={(i, value) => patch("product", { baseSize: { ...data.product.baseSize, [["length", "width", "height"][i]]: value } })}/></Field>
                <Field label="Размер цветника"><SizeGroup labels={["Длина", "Ширина", "Толщина"]} values={Object.values(data.product.flowerBedSize)} onChange={(i, value) => patch("product", { flowerBedSize: { ...data.product.flowerBedSize, [["length", "width", "thickness"][i]]: value } })}/></Field>
                <Field label="Эскиз изделия" className="md:col-span-2 xl:col-span-3"><label className="flex min-h-28 cursor-pointer items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-brand-400 hover:bg-brand-50"><UploadCloud className="h-7 w-7 text-brand-600"/><span><span className="block text-sm font-semibold text-slate-700">{data.product.sketchFile?.name ?? "Перетащите эскиз или выберите файл"}</span><span className="mt-1 block text-xs text-slate-500">JPG, PNG или PDF до 20 МБ</span></span><input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={e => patch("product", { sketchFile: e.target.files?.[0] ?? null })}/></label></Field>
              </div>
            </Card>

            <Card title="4. Оформление" subtitle="Портрет, надписи и декоративные элементы">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Портрет"><Select value={data.decoration.portraitType} onChange={portraitType => patch("decoration", { portraitType })} options={["Нет", "Гравировка", "Керамика на граните", "Фотокерамика", "Стекло"]}/></Field>
                <Field label="Размер портрета"><input className="input" value={data.decoration.portraitSize} onChange={e => patch("decoration", { portraitSize: e.target.value })}/></Field>
                <Field label="Крест / декор"><input className="input" value={data.decoration.decor} onChange={e => patch("decoration", { decor: e.target.value })}/></Field>
                <Field label="Шрифт"><Select value={data.decoration.font} onChange={font => patch("decoration", { font })} options={["Классический", "Рукописный", "Строгий", "Современный"]}/></Field>
                <Field label="Надпись" className="md:col-span-2"><textarea className="textarea" value={data.decoration.inscription} onChange={e => patch("decoration", { inscription: e.target.value })}/></Field>
                <Field label="Даты" className="md:col-span-2"><input className="input" value={data.decoration.dates} onChange={e => patch("decoration", { dates: e.target.value })}/></Field>
                <Field label="Эпитафия" className="md:col-span-2"><textarea className="textarea" value={data.decoration.epitaph} onChange={e => patch("decoration", { epitaph: e.target.value })}/></Field>
                <label className="flex cursor-pointer items-center gap-3 self-center rounded-xl border bg-slate-50 p-4 md:col-span-2"><input type="checkbox" className="h-5 w-5 rounded border-slate-300 accent-brand-600" checked={data.decoration.approveLayoutWithClient} onChange={e => patch("decoration", { approveLayoutWithClient: e.target.checked })}/><span><span className="block text-sm font-semibold text-slate-800">Макет согласовать с клиентом</span><span className="text-xs text-slate-500">Потребуется подтверждение перед производством</span></span></label>
              </div>
            </Card>

            <Card title="5. Услуги" subtitle="Выберите дополнительные работы и укажите стоимость">
              <div className="grid gap-3 md:grid-cols-2">{data.services.map(service => <div key={service.id} className={`flex items-center gap-3 rounded-xl border p-3 transition ${service.selected ? "border-brand-200 bg-brand-50/60" : "bg-white"}`}><input type="checkbox" className="h-5 w-5 shrink-0 accent-brand-600" checked={service.selected} onChange={e => updateService(service.id, { selected: e.target.checked })}/><span className="min-w-0 flex-1 text-sm font-medium">{service.name}</span><div className="relative w-32"><input aria-label={`Цена: ${service.name}`} className="input h-9 pr-8 text-right" inputMode="numeric" disabled={!service.selected} value={service.price || ""} onChange={e => updateService(service.id, { price: toNonNegativeNumber(e.target.value) })}/><span className="absolute right-3 top-2 text-sm text-slate-400">₽</span></div></div>)}</div>
            </Card>

            <Card title="7. Комплектация / детали заказа" subtitle="Состав изделия и расчет по позициям">
              <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">{["Наименование", "Размеры", "Материал", "Кол-во", "Цена", "Сумма", "Действия"].map(x => <th key={x} className="px-3 py-3 font-semibold">{x}</th>)}</tr></thead><tbody>{data.items.map(item => <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50/70">{editing === item.id ? <><td className="p-2"><input className="input h-9" value={item.name} onChange={e => updateItem(item.id, { name: e.target.value })}/></td><td className="p-2"><input className="input h-9" value={item.size} onChange={e => updateItem(item.id, { size: e.target.value })}/></td><td className="p-2"><input className="input h-9" value={item.material} onChange={e => updateItem(item.id, { material: e.target.value })}/></td><td className="p-2"><input className="input h-9 w-20" type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, { quantity: toNonNegativeNumber(e.target.value) })}/></td><td className="p-2"><input className="input h-9 w-28" type="number" min="0" value={item.price} onChange={e => updateItem(item.id, { price: toNonNegativeNumber(e.target.value) })}/></td></> : <><td className="px-3 py-4 font-semibold text-slate-800">{item.name}</td><td className="px-3 py-4 text-slate-600">{item.size}</td><td className="px-3 py-4 text-slate-600">{item.material}</td><td className="px-3 py-4">{item.quantity} шт.</td><td className="px-3 py-4">{money(item.price)}</td></>}<td className="px-3 py-4 font-semibold">{money(item.total)}</td><td className="px-3 py-4"><div className="flex gap-1"><button aria-label="Редактировать" onClick={() => setEditing(editing === item.id ? null : item.id)} className="grid h-8 w-8 place-items-center rounded-lg text-brand-600 hover:bg-brand-50">{editing === item.id ? <Check className="h-4 w-4"/> : <Pencil className="h-4 w-4"/>}</button><button aria-label="Удалить" onClick={() => setData(p => ({ ...p, items: p.items.filter(x => x.id !== item.id) }))} className="grid h-8 w-8 place-items-center rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4"/></button></div></td></tr>)}</tbody></table></div>
              <button className="btn-secondary mt-5" onClick={addItem}><Plus className="h-4 w-4"/>Добавить элемент</button>
            </Card>

            <Card title="8. Файлы" subtitle="Прикрепите материалы и документы к заказу">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[["site", "Фото участка"], ["portrait", "Фото для портрета"], ["sketch", "Эскиз"], ["documents", "Документы"], ["contract", "Договор"]].map(([key, label]) => <label key={key} className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-slate-50 p-4 text-center transition hover:border-brand-400 hover:bg-brand-50"><span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-600 shadow-sm"><UploadCloud className="h-5 w-5"/></span><span className="text-sm font-semibold text-slate-700">{label}</span><span className="mt-1 max-w-full truncate text-xs text-slate-500">{data.files[key]?.length ? `${data.files[key].length} файл(а)` : "Выбрать файл"}</span><input multiple type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={e => addFiles(key, e)}/></label>)}</div><p className="mt-4 text-xs text-slate-500">Поддерживаемые форматы: JPG, PNG, PDF. Максимальный размер файла — 20 МБ.</p>
            </Card>
          </div>

          <aside className="space-y-6 2xl:sticky 2xl:top-[94px]">
            <Card title="6. Оплата" subtitle="Финальный расчет заказа">
              <div className="space-y-4">
                {["productPrice", "decorationPrice", "discount", "prepayment"].map((key, i) => <Field key={key} label={["Стоимость изделия", "Стоимость оформления", "Скидка", "Предоплата"][i]} error={key === "prepayment" ? errors.prepayment : undefined}><div className="relative"><input className={`input pr-10 text-right font-medium ${key === "prepayment" && errors.prepayment ? "border-red-400" : ""}`} inputMode="numeric" value={data.payment[key as keyof typeof data.payment] as number || ""} onChange={e => patch("payment", { [key]: toNonNegativeNumber(e.target.value) })}/><span className="absolute right-3.5 top-3 text-slate-400">₽</span></div></Field>)}
                <Field label="Способ оплаты"><Select value={data.payment.paymentMethod} onChange={paymentMethod => patch("payment", { paymentMethod })} options={["Наличные", "Карта", "Перевод", "Расчетный счет"]}/></Field>
                <div className="rounded-xl bg-slate-50 p-4"><div className="mb-2 flex justify-between text-sm text-slate-500"><span>Услуги</span><span>{money(serviceTotal)}</span></div><div className="mb-3 flex justify-between text-sm text-slate-500"><span>Оплачено</span><span>{money(data.payment.prepayment)}</span></div><div className="border-t pt-3"><div className="flex items-center justify-between"><span className="font-semibold text-slate-700">Итоговая сумма</span><span className="text-2xl font-bold text-emerald-600">{money(total)}</span></div></div></div>
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4"><div className="flex items-center justify-between"><span className="font-semibold text-orange-900">Остаток</span><span className="text-2xl font-bold text-orange-600">{money(remaining)}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-orange-200"><div className="h-full rounded-full bg-orange-500" style={{ width: `${total ? Math.min(100, data.payment.prepayment / total * 100) : 0}%` }}/></div><p className="mt-2 text-xs text-orange-700">Оплачено {total ? Math.round(data.payment.prepayment / total * 100) : 0}% от суммы заказа</p></div>
                <button className="btn-primary w-full" onClick={createOrder}><Check className="h-4 w-4"/>Создать заказ</button>
              </div>
            </Card>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><div className="flex gap-3"><CircleHelp className="h-5 w-5 shrink-0 text-brand-600"/><div><div className="text-sm font-semibold text-blue-950">Нужна помощь?</div><p className="mt-1 text-xs leading-5 text-blue-700">Обязательные поля отмечены звездочкой. Черновик сохранится на этом устройстве.</p></div></div></div>
          </aside>
        </div>
      </main>
    </div>
    {toast && <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500"><Check className="h-4 w-4"/></span>{toast}<button onClick={() => setToast("")}><X className="h-4 w-4 text-slate-400"/></button></div>}
  </div>;
}
