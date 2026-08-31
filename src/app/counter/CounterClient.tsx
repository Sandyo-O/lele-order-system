"use client";

import { useEffect, useState, useCallback } from "react";
import { parseAddOns } from "@/lib/menu";

type OrderItemView = {
  id: string;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  selectedAddOns: string | null;
  variant: string | null;
  note: string | null;
};

type OrderView = {
  id: string;
  status: string;
  totalPrice: number;
  note: string | null;
  createdAt: string;
  table: { number: number; label: string | null };
  items: OrderItemView[];
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });
}

function OrderCard({ order, onUpdate }: { order: OrderView; onUpdate: (id: string, status: string) => void }) {
  const isPending = order.status === "pending";
  return (
    <div
      className={`rounded-xl border p-4 ${
        isPending ? "border-amber-400 bg-amber-50" : "border-neutral-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-lg">
          桌號 {order.table.number}
          {order.table.label ? `（${order.table.label}）` : ""}
        </div>
        <div className="text-xs text-neutral-500">{formatTime(order.createdAt)}</div>
      </div>

      <ul className="space-y-1 mb-3">
        {order.items.map((item) => {
          const addOns = parseAddOns(item.selectedAddOns);
          return (
            <li key={item.id} className="text-sm flex justify-between gap-2">
              <span>
                {item.nameSnapshot}
                {item.variant === "combo" ? "（套餐）" : item.variant === "single" ? "（單點）" : ""}
                {addOns.length > 0 && ` +${addOns.map((a) => a.name).join("、")}`}
                {item.note ? `（${item.note}）` : ""}
                {" x"}
                {item.quantity}
              </span>
              <span>${item.priceSnapshot * item.quantity}</span>
            </li>
          );
        })}
      </ul>

      {order.note && <p className="text-xs text-neutral-500 mb-2">備註：{order.note}</p>}

      <div className="flex items-center justify-between">
        <div className="font-semibold">總計 ${order.totalPrice}</div>
        <div className="flex gap-2">
          {isPending ? (
            <button
              className="bg-green-600 text-white text-sm px-3 py-1.5 rounded-full"
              onClick={() => onUpdate(order.id, "paid")}
            >
              已結帳
            </button>
          ) : (
            <button
              className="bg-neutral-600 text-white text-sm px-3 py-1.5 rounded-full"
              onClick={() => onUpdate(order.id, "done")}
            >
              完成移除
            </button>
          )}
          <button
            className="border border-neutral-300 text-neutral-600 text-sm px-3 py-1.5 rounded-full"
            onClick={() => onUpdate(order.id, "cancelled")}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CounterClient({ initialOrders }: { initialOrders: OrderView[] }) {
  const [orders, setOrders] = useState<OrderView[]>(initialOrders);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) return;
      const data = await res.json();
      setOrders(data.orders);
    } catch {
      // ignore transient network errors, next poll will retry
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function updateStatus(id: string, status: string) {
    setOrders((prev) =>
      prev
        .map((o) => (o.id === id ? { ...o, status } : o))
        .filter((o) => o.status === "pending" || o.status === "paid")
    );
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
  }

  const pending = orders.filter((o) => o.status === "pending");
  const paid = orders.filter((o) => o.status === "paid");

  return (
    <div className="flex-1 p-4 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">櫃台訂單</h1>
        <a href="/admin" className="text-sm text-amber-700 underline">
          後台管理
        </a>
      </div>

      <section className="mb-6">
        <h2 className="font-medium text-neutral-700 mb-2">待結帳（{pending.length}）</h2>
        {pending.length === 0 ? (
          <p className="text-neutral-400 text-sm">目前沒有待結帳訂單</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((o) => (
              <OrderCard key={o.id} order={o} onUpdate={updateStatus} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-medium text-neutral-700 mb-2">已結帳（{paid.length}）</h2>
        {paid.length === 0 ? (
          <p className="text-neutral-400 text-sm">尚無已結帳訂單</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {paid.map((o) => (
              <OrderCard key={o.id} order={o} onUpdate={updateStatus} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
