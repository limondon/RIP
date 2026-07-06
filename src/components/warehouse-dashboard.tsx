"use client";

import {
  AlertTriangle, CheckCircle2, ChevronDown, ClipboardList,
  Package, PackageCheck, Plus, RotateCcw, Search,
  ShoppingCart, Trash2, X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  cancelStoredInventoryReservation,
  getStoredInventoryAvailable,
  getStoredInventoryItems,
  getStoredInventoryMovements,
  getStoredInventoryReservations,
  getStoredOrders,
  receiveStoredInventoryItem,
  reserveStoredInventoryForOrder,
  writeOffStoredInventoryReservation,
} from "@/lib/storage";
import type { InventoryItem, InventoryMovement, InventoryReservation, Order } from "@/types/crm";

const money = (value: number) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
const formatDate = (value: string) => new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

function stockTone(item: InventoryItem, available: number) {
  if (available <= 0) return "bg-red-50 text-red-700 ring-red-200";
  if (available <= item.minStock) return "bg-orange-50 text-orange-700 ring-orange-200";
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

function stockLabel(item: InventoryItem, available: number) {
  if (available <= 0) return "Нет в наличии";
  if (available <= item.minStock) return "Нужно докупить";
  return "Достаточно";
}

export function WarehouseDashboard() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [reservations, setReservations] = useState<InventoryReservation[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [mode, setMode] = useState<"reserve" | "receive">("reserve");
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedOrder, setSelectedOrder] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [comment, setComment] = useState("");
  const [toast, setToast] = useState("");

  const refresh = () => {
    const nextItems = getStoredInventoryItems();
    const nextOrders = getStoredOrders();
    setItems(nextItems);
    setReservations(getStoredInventoryReservations());
    setMovements(getStoredInventoryMovements());
    setOrders(nextOrders);
    setSelectedItem((current) => current || nextItems[0]?.id || "");
    setSelectedOrder((current) => current || nextOrders[0]?.id || "");
  };

  useEffect(() => {
    refresh();
  }, []);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery = !normalized || [item.name, item.color, item.supplier, item.location].some((value) => value.toLowerCase().includes(normalized));
      const matchesCategory = !category || item.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [category, items, query]);

  const activeReservations = reservations.filter((reservation) => reservation.status === "Активен");
  const reservedTotal = activeReservations.reduce((sum, reservation) => sum + reservation.quantity, 0);
  const stockValue = items.reduce((sum, item) => sum + item.onHand * item.cost, 0);
  const lowStock = items.filter((item) => getStoredInventoryAvailable(item.id) <= item.minStock);
  const categories = Array.from(new Set(items.map((item) => item.category)));

  const submitAction = () => {
    if (!selectedItem) return notify("Выберите материал");
    const amount = Number(quantity) || 0;
    const result = mode === "receive"
      ? receiveStoredInventoryItem(selectedItem, amount, comment)
      : reserveStoredInventoryForOrder({ itemId: selectedItem, orderId: selectedOrder, quantity: amount, comment });
    if (!result.ok) return notify(result.error);
    refresh();
    setComment("");
    notify(mode === "receive" ? "Поступление сохранено" : "Резерв создан");
  };

  const closeReservation = (reservationId: string, action: "writeOff" | "cancel") => {
    const result = action === "writeOff" ? writeOffStoredInventoryReservation(reservationId) : cancelStoredInventoryReservation(reservationId);
    if (!result.ok) return notify(result.error);
    refresh();
    notify(action === "writeOff" ? "Материал списан" : "Резерв снят");
  };

  return (
    <>
      <AppShell
        active="Склад"
        title="Склад"
        subtitle="Остатки камня, резервы под заказы, поступления и списания"
        eyebrow={<><Link href="/" className="font-medium hover:text-brand-700">Главная</Link> <span className="mx-2">/</span> <span className="text-slate-800">Склад</span></>}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Поиск по материалу, поставщику, ячейке..."
        primaryAction={<Link href="/orders/new" className="btn-primary hidden md:inline-flex"><Plus className="h-4 w-4" />Создать заказ</Link>}
        badges={{ Склад: items.length }}
      >

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Позиций", value: items.length, Icon: Package, color: "bg-blue-50 text-blue-600" },
              { label: "Низкий остаток", value: lowStock.length, Icon: AlertTriangle, color: "bg-orange-50 text-orange-600" },
              { label: "Активных резервов", value: activeReservations.length, Icon: ClipboardList, color: "bg-violet-50 text-violet-600" },
              { label: "Зарезервировано", value: reservedTotal, Icon: PackageCheck, color: "bg-cyan-50 text-cyan-600" },
              { label: "Оценка склада", value: money(stockValue), Icon: ShoppingCart, color: "bg-emerald-50 text-emerald-600" },
            ].map(({ label, value, Icon, color }) => <section key={label} className="card flex items-start justify-between p-5"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div><span className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span></section>)}
          </div>

          <section className="card mb-6 p-5">
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
              <label className="lg:col-span-2"><span className="field-label">Действие</span><select className="input" value={mode} onChange={(event) => setMode(event.target.value as "reserve" | "receive")}><option value="reserve">Резерв под заказ</option><option value="receive">Поступление на склад</option></select></label>
              <label><span className="field-label">Материал</span><select className="input" value={selectedItem} onChange={(event) => setSelectedItem(event.target.value)}>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              {mode === "reserve" && <label><span className="field-label">Заказ</span><select className="input" value={selectedOrder} onChange={(event) => setSelectedOrder(event.target.value)}>{orders.map((order) => <option key={order.id} value={order.id}>{order.orderNumber}</option>)}</select></label>}
              <label><span className="field-label">Количество</span><input className="input" inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
              <label><span className="field-label">Комментарий</span><input className="input" value={comment} onChange={(event) => setComment(event.target.value)} placeholder={mode === "receive" ? "Поставка, накладная" : "Под какой элемент заказа"} /></label>
              <button className="btn-primary self-end whitespace-nowrap" onClick={submitAction}>{mode === "receive" ? <ShoppingCart className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}{mode === "receive" ? "Принять" : "Зарезервировать"}</button>
            </div>
          </section>

          <section className="card mb-6 p-5">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="relative md:col-span-2"><Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Материал, поставщик, ячейка" /></label>
              <label className="relative"><select className="input appearance-none pr-9" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Все категории</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" /></label>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(420px,0.75fr)]">
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
              <div className="border-b px-5 py-4"><h2 className="font-bold text-slate-900">Остатки материалов</h2><p className="mt-0.5 text-sm text-slate-500">Найдено: {filteredItems.length}</p></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead><tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">{["Материал", "Категория", "На складе", "Резерв", "Доступно", "Минимум", "Себестоимость", "Поставщик", "Ячейка", "Статус"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{filteredItems.map((item) => { const reserved = activeReservedQuantityFor(item.id, reservations); const available = Math.max(0, item.onHand - reserved); return <tr key={item.id} className="border-b last:border-0"><td className="px-4 py-4"><p className="font-semibold text-slate-900">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.color}</p></td><td className="px-4 py-4 text-slate-600">{item.category}</td><td className="px-4 py-4 font-semibold">{item.onHand} {item.unit}</td><td className="px-4 py-4 text-slate-600">{reserved} {item.unit}</td><td className="px-4 py-4 font-bold text-brand-700">{available} {item.unit}</td><td className="px-4 py-4">{item.minStock} {item.unit}</td><td className="px-4 py-4">{money(item.cost)}</td><td className="px-4 py-4 text-slate-600">{item.supplier}</td><td className="px-4 py-4 text-slate-600">{item.location}</td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${stockTone(item, available)}`}>{stockLabel(item, available)}</span></td></tr>; })}</tbody></table></div>
            </section>

            <div className="space-y-6">
              <section className="card">
                <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Активные резервы</h2><p className="mt-0.5 text-sm text-slate-500">Материал закреплен за заказом</p></div><button className="icon-button" title="Обновить" onClick={refresh}><RotateCcw className="h-4 w-4" /></button></div>
                <div className="space-y-3">{activeReservations.map((reservation) => { const item = items.find((row) => row.id === reservation.itemId); const order = orders.find((row) => row.id === reservation.orderId); return <div key={reservation.id} className="rounded-xl border bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><Link href={`/orders/${reservation.orderId}`} className="font-semibold text-brand-700 hover:underline">{order?.orderNumber ?? reservation.orderId}</Link><p className="mt-1 text-sm text-slate-700">{item?.name ?? "Материал"}</p><p className="mt-1 text-xs text-slate-500">{reservation.quantity} {item?.unit ?? "шт."} · {reservation.comment}</p></div><div className="flex gap-1"><button className="icon-button text-emerald-600" title="Списать в заказ" onClick={() => closeReservation(reservation.id, "writeOff")}><CheckCircle2 className="h-4 w-4" /></button><button className="icon-button text-red-600" title="Снять резерв" onClick={() => closeReservation(reservation.id, "cancel")}><Trash2 className="h-4 w-4" /></button></div></div></div>; })}{!activeReservations.length && <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-400">Активных резервов нет</div>}</div>
              </section>

              <section className="card">
                <h2 className="font-bold text-slate-900">Журнал движений</h2>
                <div className="mt-4 space-y-3">{movements.slice(0, 8).map((movement) => { const item = items.find((row) => row.id === movement.itemId); return <div key={movement.id} className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"><div><p className="font-semibold text-slate-800">{movement.type}</p><p className="mt-1 text-sm text-slate-500">{item?.name ?? "Материал"} · {movement.quantity} {item?.unit ?? "шт."}</p><p className="mt-1 text-xs text-slate-400">{movement.comment}</p></div><span className="text-xs text-slate-400">{formatDate(movement.createdAt)}</span></div>; })}{!movements.length && <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-400">Движений пока нет</div>}</div>
              </section>
            </div>
          </div>
      </AppShell>

      {toast && <div role="status" className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl"><CheckCircle2 className="h-5 w-5 text-emerald-400" />{toast}<button aria-label="Закрыть уведомление" onClick={() => setToast("")}><X className="h-4 w-4 text-slate-400" /></button></div>}
    </>
  );
}

function activeReservedQuantityFor(itemId: string, reservations: InventoryReservation[]) {
  return reservations
    .filter((reservation) => reservation.itemId === itemId && reservation.status === "Активен")
    .reduce((sum, reservation) => sum + reservation.quantity, 0);
}
