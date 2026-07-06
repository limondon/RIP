"use client";

import {
  Download, Eye, FileCheck2, Plus, Printer, RotateCcw, Search, Send, X,
} from "lucide-react";
import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { mockClients } from "@/lib/clients/mock-clients";
import { createDocumentDraft, CrmDocument, documentStatusStyles, documentStatuses, documentTemplates, DocumentType, documentTypes, getDocumentContext, getMockDocuments, mockDocuments } from "@/lib/documents/mock-documents";
import { mockOrders } from "@/lib/order/mock-orders";
import { addStoredDocumentForOrder } from "@/lib/storage";

const tabs = ["Все документы", "Наряд-заказы", "Договоры", "Квитанции", "Акты", "Шаблоны"] as const;
const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;

function StatusBadge({ status }: { status: CrmDocument["status"] }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${documentStatusStyles[status]}`}>{status}</span>;
}

function Paper({ document }: { document: CrmDocument }) {
  const { order, client, payment } = getDocumentContext(document);
  const remaining = Math.max(0, order.amount - order.paid);
  const row = (label: string, value: ReactNode) => <div className="grid grid-cols-[190px_1fr] gap-4 border-b border-slate-200 py-2 text-sm"><span className="font-semibold text-slate-500">{label}</span><span>{value}</span></div>;

  return (
    <article className="print-document mx-auto min-h-[940px] max-w-[760px] bg-white p-10 text-slate-950 shadow-card ring-1 ring-slate-200">
      {document.type === "Наряд-заказ" && <>
        <h1 className="text-center text-2xl font-black tracking-[0.18em]">НАРЯД-ЗАКАЗ</h1>
        <p className="mt-2 text-center text-sm text-slate-500">{document.id} от {document.createdAt}</p>
        <div className="mt-8">{row("Номер заказа", order.id)}{row("Дата заказа", document.createdAt)}{row("ФИО заказчика", client.name)}{row("Телефон", client.phone)}{row("Адрес", client.address)}{row("ФИО захороненного", order.deceased)}{row("Кладбище", order.cemetery)}{row("Участок / ряд / место", `${order.section} / ${order.row} / ${order.place}`)}{row("Тип памятника", order.product)}{row("Материал", order.material)}{row("Цвет", order.color)}{row("Форма", order.shape)}{row("Размеры", `Стела ${order.steleSize}, подставка ${order.baseSize}, цветник ${order.flowerBedSize}`)}{row("Оформление", `${order.portrait}, ${order.epitaph}, ${order.decor}`)}{row("Услуги", "Доставка, установка, демонтаж, заливка основания")}{row("Комплектация", "Стела, подставка, цветник, портрет, декор")}{row("Сумма заказа", money(order.amount))}{row("Предоплата", money(order.paid))}{row("Остаток", money(remaining))}{row("Срок изготовления", order.deadlineLabel)}</div>
        <Signatures />
      </>}
      {document.type === "Договор" && <>
        <h1 className="text-center text-xl font-black">ДОГОВОР НА ИЗГОТОВЛЕНИЕ И УСТАНОВКУ ПАМЯТНИКА</h1>
        <p className="mt-2 text-center text-sm text-slate-500">{document.id} от {document.createdAt}</p>
        <div className="mt-8 space-y-4 text-sm leading-6">
          <p><b>Исполнитель:</b> ритуальная мастерская «ПАМЯТЬ».</p>
          <p><b>Заказчик:</b> {client.name}, телефон {client.phone}, адрес {client.address}.</p>
          <p><b>Предмет договора:</b> изготовление и установка памятника по заказу {order.id}.</p>
          <p><b>Описание изделия:</b> {order.product}, материал {order.material}, форма {order.shape}, размеры {order.steleSize}.</p>
          <p><b>Стоимость:</b> {money(order.amount)}. <b>Порядок оплаты:</b> предоплата {money(order.paid)}, остаток {money(remaining)} до установки.</p>
          <p><b>Сроки изготовления:</b> до {order.deadlineLabel}. <b>Условия установки:</b> кладбище {order.cemetery}, участок {order.section}, ряд {order.row}, место {order.place}.</p>
          <p><b>Ответственность сторон:</b> стороны обязуются своевременно предоставить материалы, согласовать макет и выполнить оплату согласно условиям договора.</p>
        </div>
        <Signatures left="Заказчик" right="Исполнитель" />
      </>}
      {document.type === "Квитанция" && <>
        <h1 className="text-center text-2xl font-black tracking-[0.12em]">КВИТАНЦИЯ ОБ ОПЛАТЕ</h1>
        <div className="mt-8">{row("Номер квитанции", document.id)}{row("Дата платежа", payment?.date ?? document.createdAt)}{row("Заказ", order.id)}{row("Клиент", client.name)}{row("Сумма платежа", money(document.amount))}{row("Способ оплаты", payment?.method ?? "Наличные")}{row("Назначение платежа", payment?.type ?? "Оплата по заказу")}{row("Остаток по заказу", money(remaining))}{row("Подпись кассира", "______________________")}</div>
      </>}
      {document.type === "Акт выполненных работ" && <>
        <h1 className="text-center text-2xl font-black tracking-[0.08em]">АКТ ВЫПОЛНЕННЫХ РАБОТ</h1>
        <div className="mt-8">{row("Номер акта", document.id)}{row("Дата", document.createdAt)}{row("Заказчик", client.name)}{row("Заказ", order.id)}{row("Перечень выполненных работ", "Изготовление, доставка и установка памятника; благоустройство места.")}{row("Дата установки", order.installationDate)}{row("Кладбище", order.cemetery)}{row("Сумма", money(order.amount))}{row("Претензий нет", "Заказчик подтверждает отсутствие претензий к объему и качеству работ.")}</div>
        <Signatures />
      </>}
    </article>
  );
}

function Signatures({ left = "Подпись заказчика", right = "Подпись исполнителя" }: { left?: string; right?: string }) {
  return <div className="mt-12 grid grid-cols-2 gap-10 text-sm"><div><div className="border-b border-slate-400 pb-8" /><p className="mt-2 text-center">{left}</p></div><div><div className="border-b border-slate-400 pb-8" /><p className="mt-2 text-center">{right}</p></div></div>;
}

export function DocumentsDashboard() {
  const [documents, setDocuments] = useState(mockDocuments);
  const [selected, setSelected] = useState<CrmDocument>(mockDocuments[0]);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Все документы");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({ type: "Наряд-заказ" as DocumentType, orderId: mockOrders[0].id, clientId: mockClients[0].id, date: "2026-06-16", comment: "" });

  const refreshDocuments = () => {
    const nextDocuments = getMockDocuments();
    setDocuments(nextDocuments);
    setSelected((current) => nextDocuments.find((document) => document.id === current.id) ?? nextDocuments[0] ?? current);
  };

  useEffect(() => {
    refreshDocuments();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const tabType = tab === "Наряд-заказы" ? "Наряд-заказ" : tab === "Договоры" ? "Договор" : tab === "Квитанции" ? "Квитанция" : tab === "Акты" ? "Акт выполненных работ" : "";
    return documents.filter((doc) => {
      const matchesQuery = !normalized || [doc.orderId, doc.client, doc.phone].some((value) => value.toLowerCase().includes(normalized));
      return matchesQuery && (!type || doc.type === type) && (!status || doc.status === status) && (!date || doc.createdAt === date) && (!tabType || doc.type === tabType);
    });
  }, [date, documents, query, status, tab, type]);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2400); };
  const resetFilters = () => { setQuery(""); setType(""); setStatus(""); setDate(""); };
  const createDocument = () => {
    const result = addStoredDocumentForOrder({ type: form.type, orderId: form.orderId, date: form.date, comment: form.comment });
    if (!result.ok) return notify(result.error);
    const nextDocuments = getMockDocuments();
    const doc = nextDocuments.find((document) => document.id === result.document.number) ?? createDocumentDraft(form.type, form.orderId, result.document.clientId, result.document.date, result.document.comment ?? "");
    setDocuments(nextDocuments);
    setSelected(doc);
    setModal(false);
    notify("Документ сформирован");
  };
  const printDocument = () => window.print();

  return (
    <>
      <AppShell
        active="Документы"
        title="Документы"
        subtitle="Формирование наряд-заказов, договоров, квитанций и актов"
        eyebrow={<><Link href="/" className="font-medium hover:text-brand-700">Главная</Link> <span className="mx-2">/</span> <span className="text-slate-800">Документы</span></>}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Поиск по документам, заказам, клиентам..."
        primaryAction={<button className="btn-primary hidden md:inline-flex" onClick={() => setModal(true)}><Plus className="h-4 w-4" />Сформировать документ</button>}
        mobileAction={<button className="btn-primary md:hidden" onClick={() => setModal(true)}><Plus className="h-4 w-4" />Сформировать документ</button>}
      >

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{[["Всего документов", documents.length], ["Наряд-заказы", documents.filter((d) => d.type === "Наряд-заказ").length], ["Договоры", documents.filter((d) => d.type === "Договор").length], ["Квитанции", documents.filter((d) => d.type === "Квитанция").length], ["Акты", documents.filter((d) => d.type === "Акт выполненных работ").length], ["Ожидают подписи", documents.filter((d) => ["Сформирован", "Отправлен клиенту"].includes(d.status)).length]].map(([label, value]) => <section key={String(label)} className="card p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></section>)}</div>
          <section className="card mb-6 p-5"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(320px,1.5fr)_1fr_1fr_1fr_auto]"><label className="relative"><Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="№ заказа, клиент или телефон" /></label><select className="input" value={type} onChange={(event) => setType(event.target.value)}><option value="">Все типы</option>{documentTypes.map((item) => <option key={item}>{item}</option>)}</select><select className="input" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Все статусы</option>{documentStatuses.map((item) => <option key={item}>{item}</option>)}</select><input className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} /><button className="btn-secondary" onClick={resetFilters}><RotateCcw className="h-4 w-4" />Сбросить фильтры</button></div></section>
          <div className="mb-6 overflow-x-auto rounded-2xl border bg-white px-2 shadow-card"><div className="flex min-w-max">{tabs.map((item) => <button key={item} className={`relative px-4 py-4 text-sm font-semibold ${tab === item ? "text-brand-700" : "text-slate-500"}`} onClick={() => setTab(item)}>{item}{tab === item && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-brand-600" />}</button>)}</div></div>

          {tab === "Шаблоны" ? <Templates onPreview={(docType) => { const doc = createDocumentDraft(docType, mockOrders[0].id, mockClients[0].id, "2026-06-16", "Предпросмотр шаблона"); setSelected(doc); }} onUse={(docType) => { setForm({ ...form, type: docType }); setModal(true); }} /> : <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.8fr)]"><DocumentsTable documents={filtered} onSelect={setSelected} onPrint={printDocument} onStub={notify} /><section className="card document-preview"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Предпросмотр документа</h2><button className="btn-primary" onClick={printDocument}><Printer className="h-4 w-4" />Печать документа</button></div><Paper document={selected} /></section></div>}
      </AppShell>

      <div className="print-only"><Paper document={selected} /></div>
      {modal && <div className="app-chrome fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"><div className="flex justify-between"><div><h2 className="text-xl font-bold">Сформировать документ</h2><p className="text-sm text-slate-500">После формирования откроется предпросмотр.</p></div><button className="icon-button" onClick={() => setModal(false)}><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-4 md:grid-cols-2"><label><span className="field-label">Тип документа</span><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DocumentType })}>{documentTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label><span className="field-label">Заказ</span><select className="input" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}>{mockOrders.map((order) => <option key={order.id}>{order.id}</option>)}</select></label><label><span className="field-label">Клиент</span><select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>{mockClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label><label><span className="field-label">Дата</span><input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label><label className="md:col-span-2"><span className="field-label">Комментарий</span><textarea className="textarea" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} /></label></div><div className="mt-6 flex justify-end gap-2"><button className="btn-secondary" onClick={() => setModal(false)}>Отмена</button><button className="btn-primary" onClick={createDocument}>Сформировать</button></div></div></div>}
      {toast && <div className="app-chrome fixed bottom-6 right-6 z-50 rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl">{toast}</div>}
    </>
  );
}

function DocumentsTable({ documents, onSelect, onPrint, onStub }: { documents: CrmDocument[]; onSelect: (doc: CrmDocument) => void; onPrint: () => void; onStub: (message: string) => void }) {
  return <section className="overflow-hidden rounded-2xl border bg-white shadow-card"><div className="border-b px-5 py-4"><h2 className="font-bold">Документы</h2><p className="text-sm text-slate-500">Найдено: {documents.length}</p></div><div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{["№ документа", "Тип документа", "№ заказа", "Клиент", "Телефон", "Дата создания", "Сумма", "Статус", "Действия"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{documents.map((doc) => <tr key={doc.id} className="border-b last:border-0"><td className="px-4 py-4 font-semibold text-brand-700">{doc.id}</td><td className="px-4 py-4">{doc.type}</td><td className="px-4 py-4"><Link href={`/orders/${doc.orderId}`} className="text-brand-700">{doc.orderId}</Link></td><td className="px-4 py-4">{doc.client}</td><td className="px-4 py-4">{doc.phone}</td><td className="px-4 py-4">{doc.createdAt}</td><td className="px-4 py-4 font-semibold">{money(doc.amount)}</td><td className="px-4 py-4"><StatusBadge status={doc.status} /></td><td className="px-4 py-4"><div className="flex gap-1"><button className="icon-button" title="Открыть" onClick={() => onSelect(doc)}><Eye className="h-4 w-4" /></button><button className="icon-button" title="Печать" onClick={() => { onSelect(doc); window.setTimeout(onPrint, 0); }}><Printer className="h-4 w-4" /></button><button className="icon-button" title="Скачать PDF" onClick={() => onStub("PDF подготовлен к скачиванию")}><Download className="h-4 w-4" /></button><button className="icon-button" title="Отправить клиенту" onClick={() => onStub("Документ подготовлен к отправке клиенту")}><Send className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div></section>;
}

function Templates({ onPreview, onUse }: { onPreview: (type: DocumentType) => void; onUse: (type: DocumentType) => void }) {
  return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{documentTemplates.map((template) => <section key={template.type} className="card"><span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600"><FileCheck2 className="h-6 w-6" /></span><h2 className="mt-5 text-lg font-bold">{template.title}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{template.description}</p><div className="mt-5 flex gap-2"><button className="btn-secondary flex-1" onClick={() => onPreview(template.type)}>Предпросмотр</button><button className="btn-primary flex-1" onClick={() => onUse(template.type)}>Использовать</button></div></section>)}</div>;
}
