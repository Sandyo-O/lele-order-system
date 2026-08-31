"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseAddOns, parseTags, TAG_LABELS, formatPrice, type AddOn } from "@/lib/menu";

type MenuItemView = {
  id: string;
  name: string;
  singlePrice: number | null;
  comboPrice: number | null;
  isMarketPrice: boolean;
  tags: string | null;
  addOns: string | null;
  note: string | null;
};

type CategoryView = { id: string; name: string; items: MenuItemView[] };

type CartLine = {
  key: string;
  menuItemId: string;
  name: string;
  variant: "single" | "combo" | null;
  unitPrice: number;
  selectedAddOns: AddOn[];
  quantity: number;
};

function lineKey(itemId: string, variant: string | null, addOns: AddOn[]) {
  const addOnPart = addOns
    .map((a) => a.name)
    .sort()
    .join(",");
  return `${itemId}|${variant}|${addOnPart}`;
}

function categoryIcon(name: string) {
  if (name.includes("魚")) return "🐟";
  if (name.includes("肉")) return "🥩";
  if (name.includes("菜") || name.includes("加")) return "🥗";
  if (name.includes("特餐")) return "⭐";
  if (name.includes("湯") || name.includes("雞")) return "🍲";
  return "🍽️";
}

function TagBadges({ tags }: { tags: string | null }) {
  const list = parseTags(tags);
  if (list.length === 0) return null;
  return (
    <span className="flex gap-1 flex-wrap">
      {list.map((t) => {
        const info = TAG_LABELS[t];
        return (
          <span
            key={t}
            title={info?.label ?? t}
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white leading-none"
            style={{ backgroundColor: info?.color ?? "#6b7280" }}
          >
            {t}
          </span>
        );
      })}
    </span>
  );
}

function PriceLine({ item }: { item: MenuItemView }) {
  const hasCombo = item.comboPrice !== null && item.comboPrice !== undefined;
  const orderable = item.singlePrice !== null || item.comboPrice !== null;
  if (!orderable) return <p className="text-neutral-400 text-sm mt-1">請洽櫃台</p>;
  if (hasCombo) {
    return (
      <p className="text-amber-700 font-semibold text-sm mt-1">
        單點 {formatPrice(item.singlePrice)} ・ 套餐 {formatPrice(item.comboPrice)}
      </p>
    );
  }
  return <p className="text-amber-700 font-semibold text-sm mt-1">{formatPrice(item.singlePrice)}</p>;
}

function Stepper({
  quantity,
  onIncrement,
  onDecrement,
}: {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-amber-600 rounded-full px-1 py-1 shrink-0">
      <button
        className="w-7 h-7 rounded-full bg-white text-amber-700 text-lg leading-none flex items-center justify-center"
        onClick={onDecrement}
        aria-label="減少"
      >
        −
      </button>
      <span className="w-4 text-center text-white font-medium text-sm">{quantity}</span>
      <button
        className="w-7 h-7 rounded-full bg-white text-amber-700 text-lg leading-none flex items-center justify-center"
        onClick={onIncrement}
        aria-label="增加"
      >
        +
      </button>
    </div>
  );
}

function PlusButton({ onClick, badge }: { onClick: () => void; badge?: number }) {
  return (
    <button
      className="relative w-9 h-9 rounded-full bg-amber-600 text-white text-2xl leading-none flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform"
      onClick={onClick}
      aria-label="加入購物車"
    >
      <span className="-mt-0.5">+</span>
      {!!badge && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] w-[18px] h-[18px] rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function ItemRow({
  item,
  quantityInCart,
  onQuickAdd,
  onQuickRemove,
  onOpen,
}: {
  item: MenuItemView;
  quantityInCart: number;
  onQuickAdd: () => void;
  onQuickRemove: () => void;
  onOpen: () => void;
}) {
  const availableAddOns = useMemo(() => parseAddOns(item.addOns), [item.addOns]);
  const hasCombo = item.comboPrice !== null && item.comboPrice !== undefined;
  const isSimple = !hasCombo && availableAddOns.length === 0;
  const orderable = item.singlePrice !== null || item.comboPrice !== null;

  return (
    <div
      className={`flex items-center gap-3 py-3.5 border-b border-neutral-100 last:border-0 ${
        orderable && !isSimple ? "cursor-pointer" : ""
      }`}
      onClick={() => orderable && !isSimple && onOpen()}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-neutral-900">{item.name}</span>
          <TagBadges tags={item.tags} />
        </div>
        {item.note && <p className="text-xs text-neutral-400 mt-0.5">{item.note}</p>}
        <PriceLine item={item} />
      </div>

      {orderable &&
        (isSimple ? (
          quantityInCart > 0 ? (
            <Stepper quantity={quantityInCart} onIncrement={onQuickAdd} onDecrement={onQuickRemove} />
          ) : (
            <PlusButton onClick={onQuickAdd} />
          )
        ) : (
          <PlusButton onClick={onOpen} badge={quantityInCart} />
        ))}
    </div>
  );
}

function ItemSheet({
  item,
  onClose,
  onAdd,
}: {
  item: MenuItemView;
  onClose: () => void;
  onAdd: (line: Omit<CartLine, "key" | "quantity">, quantity: number) => void;
}) {
  const availableAddOns = useMemo(() => parseAddOns(item.addOns), [item.addOns]);
  const hasCombo = item.comboPrice !== null && item.comboPrice !== undefined;
  const [variant, setVariant] = useState<"single" | "combo">(item.singlePrice !== null ? "single" : "combo");
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [quantity, setQuantity] = useState(1);

  const basePrice = variant === "combo" ? item.comboPrice : item.singlePrice;
  const unitPrice = (basePrice ?? 0) + selectedAddOns.reduce((s, a) => s + a.price, 0);

  function toggleAddOn(addOn: AddOn) {
    setSelectedAddOns((prev) =>
      prev.some((a) => a.name === addOn.name)
        ? prev.filter((a) => a.name !== addOn.name)
        : [...prev, addOn]
    );
  }

  function handleAdd() {
    if (basePrice === null || basePrice === undefined) return;
    onAdd(
      {
        menuItemId: item.id,
        name: item.name,
        variant: hasCombo ? variant : null,
        unitPrice,
        selectedAddOns,
      },
      quantity
    );
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-neutral-200 rounded-full mx-auto mb-4" />
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-lg font-semibold text-neutral-900">{item.name}</h3>
          <button
            className="text-neutral-400 text-xl leading-none w-7 h-7 flex items-center justify-center shrink-0"
            onClick={onClose}
            aria-label="關閉"
          >
            ×
          </button>
        </div>
        <TagBadges tags={item.tags} />
        {item.note && <p className="text-xs text-neutral-400 mt-2">{item.note}</p>}

        <div className="mt-4 space-y-4">
          {hasCombo && (
            <div className="flex gap-2">
              <button
                className={`flex-1 px-3 py-2.5 rounded-xl text-sm border font-medium ${
                  variant === "single"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "border-neutral-300 text-neutral-700"
                }`}
                onClick={() => setVariant("single")}
              >
                單點 {formatPrice(item.singlePrice)}
              </button>
              <button
                className={`flex-1 px-3 py-2.5 rounded-xl text-sm border font-medium ${
                  variant === "combo"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "border-neutral-300 text-neutral-700"
                }`}
                onClick={() => setVariant("combo")}
              >
                套餐 {formatPrice(item.comboPrice)}
              </button>
            </div>
          )}

          {hasCombo && variant === "combo" && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              套餐內容：白飯、兩樣配菜、開胃小菜、例湯
            </p>
          )}

          {availableAddOns.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-neutral-800 mb-2">加購選項</p>
              <div className="space-y-2">
                {availableAddOns.map((a) => {
                  const checked = selectedAddOns.some((s) => s.name === a.name);
                  return (
                    <label
                      key={a.name}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 text-sm font-medium cursor-pointer ${
                        checked
                          ? "border-amber-500 bg-amber-50 text-amber-900"
                          : "border-neutral-300 bg-white text-neutral-800"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAddOn(a)}
                          className="accent-amber-600 w-4 h-4"
                        />
                        {a.name}
                      </span>
                      <span className="text-neutral-700 font-semibold">+${a.price}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-neutral-800">數量</span>
            <div className="flex items-center gap-3">
              <button
                className="w-9 h-9 rounded-full border-2 border-amber-300 bg-amber-50 text-amber-800 text-lg font-semibold leading-none flex items-center justify-center"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="w-6 text-center font-semibold text-neutral-900">{quantity}</span>
              <button
                className="w-9 h-9 rounded-full border-2 border-amber-300 bg-amber-50 text-amber-800 text-lg font-semibold leading-none flex items-center justify-center"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              >
                +
              </button>
            </div>
          </div>

          <button
            className="w-full bg-amber-600 text-white text-base font-semibold py-3.5 rounded-full mt-2"
            onClick={handleAdd}
          >
            加入購物車 ・ ${unitPrice * quantity}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderClient({
  tableNumber,
  tableLabel,
  storeName,
  orderNote,
  categories,
}: {
  tableNumber: number;
  tableLabel: string | null;
  storeName: string;
  orderNote: string;
  categories: CategoryView[];
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [view, setView] = useState<"menu" | "cart" | "success">("menu");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successTotal, setSuccessTotal] = useState<number | null>(null);
  const [orderNoteInput, setOrderNoteInput] = useState("");
  const [modalItem, setModalItem] = useState<MenuItemView | null>(null);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const scrollingRef = useRef(false);
  const scrollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const itemCount = cart.reduce((sum, l) => sum + l.quantity, 0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollingRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-cat-id");
            if (id) setActiveCategory(id);
          }
        }
      },
      { rootMargin: "-140px 0px -65% 0px", threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [categories]);

  useEffect(() => {
    if (activeCategory) {
      pillRefs.current[activeCategory]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeCategory]);

  function addToCart(line: Omit<CartLine, "key" | "quantity">, quantity: number) {
    const key = lineKey(line.menuItemId, line.variant, line.selectedAddOns);
    setCart((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + quantity } : l));
      }
      return [...prev, { ...line, key, quantity }];
    });
  }

  function updateQuantity(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  function quickAdd(item: MenuItemView) {
    addToCart(
      {
        menuItemId: item.id,
        name: item.name,
        variant: null,
        unitPrice: item.singlePrice ?? 0,
        selectedAddOns: [],
      },
      1
    );
  }

  function quickRemove(item: MenuItemView) {
    updateQuantity(lineKey(item.id, null, []), -1);
  }

  function scrollToCategory(id: string) {
    scrollingRef.current = true;
    if (scrollingTimeoutRef.current) clearTimeout(scrollingTimeoutRef.current);
    setActiveCategory(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    scrollingTimeoutRef.current = setTimeout(() => {
      scrollingRef.current = false;
    }, 700);
  }

  async function submitOrder() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber,
          note: orderNoteInput || undefined,
          items: cart.map((l) => ({
            menuItemId: l.menuItemId,
            quantity: l.quantity,
            variant: l.variant,
            selectedAddOns: l.selectedAddOns,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "送出失敗，請重試");
        return;
      }
      setSuccessTotal(data.order.totalPrice);
      setCart([]);
      setOrderNoteInput("");
      setView("success");
    } catch {
      setError("網路連線失敗，請重試");
    } finally {
      setSubmitting(false);
    }
  }

  if (view === "success") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 bg-gradient-to-b from-amber-50 to-white">
        <div className="text-6xl">✅</div>
        <h1 className="text-xl font-semibold">訂單已送出！</h1>
        <p className="text-neutral-600">
          桌號 {tableNumber}，消費金額 <span className="font-semibold text-amber-700">${successTotal}</span>
        </p>
        <p className="text-neutral-500 text-sm">請至櫃台結帳，謝謝！</p>
        <button
          className="mt-4 bg-amber-600 text-white px-6 py-2.5 rounded-full font-medium shadow-sm"
          onClick={() => setView("menu")}
        >
          繼續加點
        </button>
      </div>
    );
  }

  if (view === "cart") {
    return (
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <header className="sticky top-0 bg-white border-b border-neutral-200 px-4 py-3 flex items-center gap-3 z-20">
          <button className="text-neutral-600 text-sm" onClick={() => setView("menu")}>
            ← 返回菜單
          </button>
          <h1 className="font-semibold">購物車</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {cart.length === 0 ? (
            <p className="text-neutral-400 text-center mt-10">購物車是空的</p>
          ) : (
            <ul className="space-y-3">
              {cart.map((l) => (
                <li
                  key={l.key}
                  className="flex items-center justify-between border border-neutral-100 rounded-xl px-3 py-3"
                >
                  <div>
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-neutral-500">
                      {l.variant === "combo" ? "套餐" : l.variant === "single" ? "單點" : ""}
                      {l.selectedAddOns.length > 0 &&
                        ` ・ ${l.selectedAddOns.map((a) => a.name).join("、")}`}
                    </div>
                    <div className="text-sm text-amber-700 font-medium">
                      ${l.unitPrice} x {l.quantity}
                    </div>
                  </div>
                  <Stepper
                    quantity={l.quantity}
                    onIncrement={() => updateQuantity(l.key, 1)}
                    onDecrement={() => updateQuantity(l.key, -1)}
                  />
                </li>
              ))}
            </ul>
          )}

          {cart.length > 0 && (
            <div className="mt-4">
              <label className="text-sm text-neutral-600 block mb-1">備註（例如：不辣、加湯）</label>
              <textarea
                className="w-full border border-neutral-300 rounded-lg p-2 text-sm"
                rows={2}
                value={orderNoteInput}
                onChange={(e) => setOrderNoteInput(e.target.value)}
              />
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-neutral-200 p-4 space-y-2">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex items-center justify-between font-semibold">
              <span>總計</span>
              <span className="text-amber-700">${total}</span>
            </div>
            <button
              className="w-full bg-amber-600 text-white py-3 rounded-full font-medium disabled:opacity-50"
              onClick={submitOrder}
              disabled={submitting}
            >
              {submitting ? "送出中..." : "送出訂單"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full pb-28 bg-neutral-50">
      <header className="sticky top-0 bg-gradient-to-r from-amber-600 to-orange-500 text-white px-4 pt-4 pb-3 z-20 shadow-sm">
        <h1 className="font-bold text-lg">{storeName}</h1>
        <p className="text-sm text-amber-50/90">
          桌號 {tableNumber}
          {tableLabel ? `（${tableLabel}）` : ""}
        </p>
        {orderNote && <p className="text-xs text-amber-50/70 mt-1">{orderNote}</p>}
      </header>

      <nav className="sticky top-[76px] bg-neutral-50/95 backdrop-blur border-b border-neutral-200 z-10 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-4 py-2 w-max">
          {categories.map((cat) => (
            <button
              key={cat.id}
              ref={(el) => {
                pillRefs.current[cat.id] = el;
              }}
              onClick={() => scrollToCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? "bg-amber-600 text-white"
                  : "bg-white text-neutral-600 border border-neutral-200"
              }`}
            >
              {categoryIcon(cat.name)} {cat.name}
            </button>
          ))}
        </div>
      </nav>

      <div className="px-4">
        {categories.map((cat) => (
          <section
            key={cat.id}
            data-cat-id={cat.id}
            ref={(el) => {
              sectionRefs.current[cat.id] = el;
            }}
            className="mt-4 scroll-mt-[132px]"
          >
            <h2 className="text-neutral-800 font-bold mb-1 flex items-center gap-1.5">
              <span>{categoryIcon(cat.name)}</span> {cat.name}
            </h2>
            <div className="bg-white rounded-2xl px-3 shadow-sm border border-neutral-100">
              {cat.items.map((item) => {
                const simpleKey = lineKey(item.id, null, []);
                const cartLine = cart.find((l) => l.key === simpleKey);
                const totalQtyForItem = cart
                  .filter((l) => l.menuItemId === item.id)
                  .reduce((s, l) => s + l.quantity, 0);
                return (
                  <ItemRow
                    key={item.id}
                    item={item}
                    quantityInCart={cartLine ? cartLine.quantity : totalQtyForItem}
                    onQuickAdd={() => quickAdd(item)}
                    onQuickRemove={() => quickRemove(item)}
                    onOpen={() => setModalItem(item)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {modalItem && (
        <ItemSheet key={modalItem.id} item={modalItem} onClose={() => setModalItem(null)} onAdd={addToCart} />
      )}

      {itemCount > 0 && (
        <button
          className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-amber-600 text-white py-3.5 rounded-full font-medium shadow-lg flex items-center justify-between px-5 z-30"
          onClick={() => setView("cart")}
        >
          <span>🛒 {itemCount} 項</span>
          <span>查看購物車 ・ ${total}</span>
        </button>
      )}
    </div>
  );
}
