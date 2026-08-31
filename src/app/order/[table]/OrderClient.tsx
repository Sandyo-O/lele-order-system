"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  parseAddOns,
  parseTags,
  TAG_LABELS,
  formatPrice,
  STAPLE_SWAP_ADDON_NAME,
  DAILY_SOUP_ADDON_MARKER,
  DAILY_CHOICE_LABELS,
  type AddOn,
} from "@/lib/menu";

type DailyChoiceType = "soup" | "vegetable" | null;

type MenuItemView = {
  id: string;
  name: string;
  singlePrice: number | null;
  comboPrice: number | null;
  isMarketPrice: boolean;
  tags: string | null;
  addOns: string | null;
  note: string | null;
  dailyChoiceType: DailyChoiceType;
  singleVariantStyle: string;
};

type CategoryView = { id: string; name: string; items: MenuItemView[] };

type CartLine = {
  key: string;
  menuItemId: string;
  name: string;
  variant: "single" | "combo" | null;
  unitPrice: number;
  selectedAddOns: AddOn[];
  note: string;
  quantity: number;
};

function lineKey(itemId: string, variant: string | null, addOns: AddOn[], note?: string) {
  const addOnPart = addOns
    .map((a) => a.name)
    .sort()
    .join(",");
  return `${itemId}|${variant}|${addOnPart}|${note ?? ""}`;
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
  if (!orderable) return <p className="text-stone-400 text-sm mt-1">請洽櫃台</p>;
  if (hasCombo) {
    return (
      <p className="text-red-700 font-semibold text-sm mt-1">
        單點 {formatPrice(item.singlePrice)} ・ 套餐 {formatPrice(item.comboPrice)}
      </p>
    );
  }
  return <p className="text-red-700 font-semibold text-sm mt-1">{formatPrice(item.singlePrice)}</p>;
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
    <div className="flex items-center gap-2 bg-red-600 rounded-full px-1 py-1 shrink-0">
      <button
        className="w-7 h-7 rounded-full bg-white text-red-700 text-lg leading-none flex items-center justify-center"
        onClick={onDecrement}
        aria-label="減少"
      >
        −
      </button>
      <span className="w-4 text-center text-white font-medium text-sm">{quantity}</span>
      <button
        className="w-7 h-7 rounded-full bg-white text-red-700 text-lg leading-none flex items-center justify-center"
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
      className="relative w-9 h-9 rounded-full bg-red-600 text-white text-2xl leading-none flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform"
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
  const isSimple = !hasCombo && !item.dailyChoiceType && availableAddOns.length === 0;
  const orderable = item.singlePrice !== null || item.comboPrice !== null;

  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-stone-100 last:border-0">
      <div
        className={`flex-1 min-w-0 ${orderable ? "cursor-pointer" : ""}`}
        onClick={() => orderable && onOpen()}
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-stone-900">{item.name}</span>
          <TagBadges tags={item.tags} />
        </div>
        {item.note && <p className="text-xs text-stone-400 mt-0.5">{item.note}</p>}
        <PriceLine item={item} />
        {orderable && <p className="text-[11px] text-stone-400 mt-0.5">點一下可加備註</p>}
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

const STAPLE_OPTIONS = ["白飯", "滷肉飯"];
const DAILY_CHOICE_NOTE_PREFIX: Record<string, string> = {
  soup: "口味",
  vegetable: "今日蔬菜",
};

function ItemSheet({
  item,
  dailyOptionsByType,
  onClose,
  onAdd,
}: {
  item: MenuItemView;
  dailyOptionsByType: Record<"soup" | "vegetable", string[]>;
  onClose: () => void;
  onAdd: (line: Omit<CartLine, "key" | "quantity">, quantity: number) => void;
}) {
  const allAddOns = useMemo(() => parseAddOns(item.addOns), [item.addOns]);
  const stapleSwapAddOn = allAddOns.find((a) => a.name === STAPLE_SWAP_ADDON_NAME);
  const dailySoupAddOn = allAddOns.find((a) => a.name.includes(DAILY_SOUP_ADDON_MARKER));
  const regularAddOns = allAddOns.filter(
    (a) => a.name !== STAPLE_SWAP_ADDON_NAME && a.name !== dailySoupAddOn?.name
  );
  const itemDailyOptions = item.dailyChoiceType ? dailyOptionsByType[item.dailyChoiceType] : [];

  const hasCombo = item.comboPrice !== null && item.comboPrice !== undefined;
  const isDiscountStyle = hasCombo && item.singleVariantStyle === "discount";
  const [variant, setVariant] = useState<"single" | "combo">(hasCombo ? "combo" : "single");
  const [staple, setStaple] = useState<string>(STAPLE_OPTIONS[0]);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [wantsDailySoup, setWantsDailySoup] = useState(false);
  const [dailySoupFlavor, setDailySoupFlavor] = useState(dailyOptionsByType.soup[0] ?? "");
  const [itemDailyChoice, setItemDailyChoice] = useState(itemDailyOptions[0] ?? "");
  const [customNote, setCustomNote] = useState("");
  const [quantity, setQuantity] = useState(1);

  const showAddOnsSection = !hasCombo || variant === "combo";
  const showStaplePicker = !!stapleSwapAddOn && variant === "combo";
  const singleDiscount = hasCombo ? (item.comboPrice ?? 0) - (item.singlePrice ?? 0) : 0;

  const basePrice = variant === "combo" ? item.comboPrice : item.singlePrice;
  const staplePrice = showStaplePicker && staple === stapleSwapAddOn?.name ? stapleSwapAddOn.price : 0;
  const dailySoupPrice = wantsDailySoup && dailySoupAddOn ? dailySoupAddOn.price : 0;
  const addOnsPrice = selectedAddOns.reduce((s, a) => s + a.price, 0);
  const unitPrice = (basePrice ?? 0) + staplePrice + dailySoupPrice + addOnsPrice;

  function toggleAddOn(addOn: AddOn) {
    setSelectedAddOns((prev) =>
      prev.some((a) => a.name === addOn.name)
        ? prev.filter((a) => a.name !== addOn.name)
        : [...prev, addOn]
    );
  }

  function handleAdd() {
    if (basePrice === null || basePrice === undefined) return;

    const finalAddOns = [...selectedAddOns];
    if (showStaplePicker && staple === stapleSwapAddOn?.name) finalAddOns.push(stapleSwapAddOn);
    if (wantsDailySoup && dailySoupAddOn) finalAddOns.push(dailySoupAddOn);

    const noteParts: string[] = [];
    if (showStaplePicker && staple === "滷肉飯") noteParts.push("主食：滷肉飯");
    if (wantsDailySoup && dailyOptionsByType.soup.length > 0)
      noteParts.push(`雞湯口味：${dailySoupFlavor}`);
    if (item.dailyChoiceType) {
      const prefix = DAILY_CHOICE_NOTE_PREFIX[item.dailyChoiceType] ?? "選擇";
      noteParts.push(
        itemDailyOptions.length > 0 ? `${prefix}：${itemDailyChoice}` : `${prefix}：請跟店員確認今日選項`
      );
    }
    if (customNote.trim()) noteParts.push(customNote.trim());
    const note = noteParts.join("；");

    onAdd(
      {
        menuItemId: item.id,
        name: item.name,
        variant: hasCombo ? variant : null,
        unitPrice,
        selectedAddOns: finalAddOns,
        note,
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
        <div className="w-10 h-1.5 bg-stone-200 rounded-full mx-auto mb-4" />
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-lg font-semibold text-stone-900">{item.name}</h3>
          <button
            className="text-stone-400 text-xl leading-none w-7 h-7 flex items-center justify-center shrink-0"
            onClick={onClose}
            aria-label="關閉"
          >
            ×
          </button>
        </div>
        <TagBadges tags={item.tags} />
        {item.note && <p className="text-xs text-stone-400 mt-2">{item.note}</p>}

        <div className="mt-4 space-y-4">
          {hasCombo && !isDiscountStyle && (
            <div className="flex gap-2">
              <button
                className={`flex-1 px-3 py-2.5 rounded-xl text-sm border font-medium ${
                  variant === "single"
                    ? "bg-red-600 text-white border-red-600"
                    : "border-stone-300 text-stone-700"
                }`}
                onClick={() => setVariant("single")}
              >
                單點 {formatPrice(item.singlePrice)}
              </button>
              <button
                className={`flex-1 px-3 py-2.5 rounded-xl text-sm border font-medium ${
                  variant === "combo"
                    ? "bg-red-600 text-white border-red-600"
                    : "border-stone-300 text-stone-700"
                }`}
                onClick={() => setVariant("combo")}
              >
                套餐 {formatPrice(item.comboPrice)}
              </button>
            </div>
          )}

          {hasCombo && isDiscountStyle && (
            <label
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 text-sm font-medium cursor-pointer ${
                variant === "single"
                  ? "border-red-500 bg-red-50 text-red-900"
                  : "border-stone-300 bg-white text-stone-800"
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={variant === "single"}
                  onChange={(e) => setVariant(e.target.checked ? "single" : "combo")}
                  className="accent-red-600 w-4 h-4"
                />
                單點（不附白飯/小菜/湯）
              </span>
              <span className="text-stone-700 font-semibold">－${singleDiscount}</span>
            </label>
          )}

          {hasCombo && variant === "combo" && (
            <p className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              套餐內容：白飯、兩樣配菜、開胃小菜、例湯
            </p>
          )}

          {showStaplePicker && stapleSwapAddOn && (
            <div>
              <p className="text-sm font-semibold text-stone-800 mb-2">主食（白飯／滷肉飯免費，換麵線加價）</p>
              <div className="flex gap-2 flex-wrap">
                {[...STAPLE_OPTIONS, stapleSwapAddOn.name].map((name) => {
                  const active = staple === name;
                  const extra = name === stapleSwapAddOn.name ? stapleSwapAddOn.price : 0;
                  return (
                    <button
                      key={name}
                      className={`px-3 py-2 rounded-xl text-sm font-medium border-2 ${
                        active
                          ? "border-red-500 bg-red-50 text-red-900"
                          : "border-stone-300 bg-white text-stone-800"
                      }`}
                      onClick={() => setStaple(name)}
                    >
                      {name}
                      {extra > 0 ? `（+$${extra}）` : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {showAddOnsSection && dailySoupAddOn && (
            <div>
              <label
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 text-sm font-medium cursor-pointer ${
                  wantsDailySoup
                    ? "border-red-500 bg-red-50 text-red-900"
                    : "border-stone-300 bg-white text-stone-800"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={wantsDailySoup}
                    onChange={(e) => setWantsDailySoup(e.target.checked)}
                    className="accent-red-600 w-4 h-4"
                  />
                  {dailySoupAddOn.name}
                </span>
                <span className="text-stone-700 font-semibold">+${dailySoupAddOn.price}</span>
              </label>
              {wantsDailySoup && (
                <div className="mt-2 pl-2">
                  {dailyOptionsByType.soup.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {dailyOptionsByType.soup.map((flavor) => (
                        <button
                          key={flavor}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 ${
                            dailySoupFlavor === flavor
                              ? "border-red-500 bg-red-100 text-red-900"
                              : "border-stone-300 bg-white text-stone-700"
                          }`}
                          onClick={() => setDailySoupFlavor(flavor)}
                        >
                          {flavor}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400">今日雞湯口味尚未設定，送出後請跟店員確認</p>
                  )}
                </div>
              )}
            </div>
          )}

          {item.dailyChoiceType && (
            <div>
              <p className="text-sm font-semibold text-stone-800 mb-2">
                {DAILY_CHOICE_LABELS[item.dailyChoiceType] ?? "請選擇"}
              </p>
              {itemDailyOptions.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                  {itemDailyOptions.map((option) => (
                    <button
                      key={option}
                      className={`px-3 py-2 rounded-xl text-sm font-medium border-2 ${
                        itemDailyChoice === option
                          ? "border-red-500 bg-red-50 text-red-900"
                          : "border-stone-300 bg-white text-stone-800"
                      }`}
                      onClick={() => setItemDailyChoice(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400">今日選項尚未設定，送出後請跟店員確認</p>
              )}
            </div>
          )}

          {showAddOnsSection && regularAddOns.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-stone-800 mb-2">加購選項</p>
              <div className="space-y-2">
                {regularAddOns.map((a) => {
                  const checked = selectedAddOns.some((s) => s.name === a.name);
                  return (
                    <label
                      key={a.name}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 text-sm font-medium cursor-pointer ${
                        checked
                          ? "border-red-500 bg-red-50 text-red-900"
                          : "border-stone-300 bg-white text-stone-800"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAddOn(a)}
                          className="accent-red-600 w-4 h-4"
                        />
                        {a.name}
                      </span>
                      <span className="text-stone-700 font-semibold">+${a.price}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-stone-800 mb-2 block">
              備註（例如：不辣、少油）
            </label>
            <textarea
              className="w-full border-2 border-stone-300 rounded-xl p-2.5 text-sm text-stone-900"
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="輸入這道菜的特別要求..."
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-stone-800">數量</span>
            <div className="flex items-center gap-3">
              <button
                className="w-9 h-9 rounded-full border-2 border-red-300 bg-red-50 text-red-800 text-lg font-semibold leading-none flex items-center justify-center"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="w-6 text-center font-semibold text-stone-900">{quantity}</span>
              <button
                className="w-9 h-9 rounded-full border-2 border-red-300 bg-red-50 text-red-800 text-lg font-semibold leading-none flex items-center justify-center"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              >
                +
              </button>
            </div>
          </div>

          <button
            className="w-full bg-red-600 text-white text-base font-semibold py-3.5 rounded-full mt-2"
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
  dailyOptionsByType,
}: {
  tableNumber: number;
  tableLabel: string | null;
  storeName: string;
  orderNote: string;
  categories: CategoryView[];
  dailyOptionsByType: Record<"soup" | "vegetable", string[]>;
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
  const stickyRef = useRef<HTMLDivElement>(null);
  const [stickyHeight, setStickyHeight] = useState(140);

  const total = cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const itemCount = cart.reduce((sum, l) => sum + l.quantity, 0);

  useLayoutEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const update = () => setStickyHeight(el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
      { rootMargin: `-${stickyHeight}px 0px -65% 0px`, threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [categories, stickyHeight]);

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
    const key = lineKey(line.menuItemId, line.variant, line.selectedAddOns, line.note);
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
        note: "",
      },
      1
    );
  }

  function quickRemove(item: MenuItemView) {
    updateQuantity(lineKey(item.id, null, [], ""), -1);
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
            note: l.note || undefined,
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
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 bg-gradient-to-b from-red-50 to-white">
        <div className="text-6xl">✅</div>
        <h1 className="text-xl font-semibold">訂單已送出！</h1>
        <p className="text-stone-600">
          桌號 {tableNumber}，消費金額 <span className="font-semibold text-red-700">${successTotal}</span>
        </p>
        <p className="text-stone-500 text-sm">請至櫃台結帳，謝謝！</p>
        <button
          className="mt-4 bg-red-600 text-white px-6 py-2.5 rounded-full font-medium shadow-sm"
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
        <header className="sticky top-0 bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3 z-20">
          <button className="text-stone-600 text-sm" onClick={() => setView("menu")}>
            ← 返回菜單
          </button>
          <h1 className="font-semibold">購物車</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {cart.length === 0 ? (
            <p className="text-stone-400 text-center mt-10">購物車是空的</p>
          ) : (
            <ul className="space-y-3">
              {cart.map((l) => (
                <li
                  key={l.key}
                  className="flex items-center justify-between border border-stone-100 rounded-xl px-3 py-3"
                >
                  <div>
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-stone-500">
                      {l.variant === "combo" ? "套餐" : l.variant === "single" ? "單點" : ""}
                      {l.selectedAddOns.length > 0 &&
                        ` ・ ${l.selectedAddOns.map((a) => a.name).join("、")}`}
                    </div>
                    {l.note && <div className="text-xs text-red-700 mt-0.5">備註：{l.note}</div>}
                    <div className="text-sm text-red-700 font-medium">
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
              <label className="text-sm text-stone-600 block mb-1">備註（例如：不辣、加湯）</label>
              <textarea
                className="w-full border border-stone-300 rounded-lg p-2 text-sm"
                rows={2}
                value={orderNoteInput}
                onChange={(e) => setOrderNoteInput(e.target.value)}
              />
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-stone-200 p-4 space-y-2">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex items-center justify-between font-semibold">
              <span>總計</span>
              <span className="text-red-700">${total}</span>
            </div>
            <button
              className="w-full bg-red-600 text-white py-3 rounded-full font-medium disabled:opacity-50"
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
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full pb-28 bg-stone-50">
      <div ref={stickyRef} className="sticky top-0 z-20 shadow-sm">
        <header className="bg-gradient-to-r from-red-900 to-red-700 text-white px-4 pt-4 pb-3">
          <h1 className="font-bold text-lg">{storeName}</h1>
          <p className="text-sm text-red-50/90">
            桌號 {tableNumber}
            {tableLabel ? `（${tableLabel}）` : ""}
          </p>
          {orderNote && <p className="text-xs text-red-50/70 mt-1">{orderNote}</p>}
        </header>

        <nav className="bg-stone-50/95 backdrop-blur border-b border-stone-200 overflow-x-auto no-scrollbar">
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
                  ? "bg-red-600 text-white"
                  : "bg-white text-stone-600 border border-stone-200"
              }`}
            >
              {categoryIcon(cat.name)} {cat.name}
            </button>
          ))}
        </div>
        </nav>
      </div>

      <div className="px-4">
        {categories.map((cat) => (
          <section
            key={cat.id}
            data-cat-id={cat.id}
            ref={(el) => {
              sectionRefs.current[cat.id] = el;
            }}
            className="mt-4"
            style={{ scrollMarginTop: stickyHeight + 8 }}
          >
            <h2 className="text-stone-800 font-bold mb-1 flex items-center gap-1.5">
              <span>{categoryIcon(cat.name)}</span> {cat.name}
            </h2>
            <div className="bg-white rounded-2xl px-3 shadow-sm border border-stone-100">
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
        <ItemSheet
          key={modalItem.id}
          item={modalItem}
          dailyOptionsByType={dailyOptionsByType}
          onClose={() => setModalItem(null)}
          onAdd={addToCart}
        />
      )}

      {itemCount > 0 && (
        <button
          className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-red-600 text-white py-3.5 rounded-full font-medium shadow-lg flex items-center justify-between px-5 z-30"
          onClick={() => setView("cart")}
        >
          <span>🛒 {itemCount} 項</span>
          <span>查看購物車 ・ ${total}</span>
        </button>
      )}
    </div>
  );
}
