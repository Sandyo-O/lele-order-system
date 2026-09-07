import { prisma } from "@/lib/prisma";
import { parseTags, addOnsToText, formatPrice } from "@/lib/menu";
import {
  createCategory,
  deleteCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  moveMenuItem,
} from "../actions";
import { SavableForm } from "../SavableForm";

export const dynamic = "force-dynamic";

const TAG_OPTIONS = [
  { code: "調", label: "調理氣血" },
  { code: "強", label: "顧筋骨、增強免疫力" },
  { code: "孕", label: "孕期媽咪" },
  { code: "產", label: "坐月子媽咪" },
  { code: "復", label: "術後病後" },
];

export default async function AdminMenuPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold mb-1">菜單管理</h1>
        <p className="text-sm text-neutral-500">
          品項的「單品價格」留空表示沒有單點選項，「套餐價格」留空表示沒有套餐選項；兩者都要留給客人選就都填。勾選「時價」只是在點餐頁顯示提醒，仍會用你填的價格計算金額。
        </p>
      </div>

      {categories.map((category) => (
        <section key={category.id} className="border border-neutral-200 rounded-xl p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-amber-700">
              {category.name} {category.isDaily && "（每日異動）"}
            </h2>
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={category.id} />
              <button className="text-xs text-red-500 underline">刪除整個分類</button>
            </form>
          </div>

          <div className="space-y-2">
            {category.items.map((item, index) => {
              const currentTags = parseTags(item.tags);
              return (
                <div key={item.id} className="flex items-center gap-1.5">
                  <div className="flex flex-col shrink-0">
                    <form action={moveMenuItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        type="submit"
                        disabled={index === 0}
                        className="block leading-none text-xs px-1.5 py-0.5 text-neutral-500 disabled:opacity-20"
                        title="往上移"
                      >
                        ▲
                      </button>
                    </form>
                    <form action={moveMenuItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        type="submit"
                        disabled={index === category.items.length - 1}
                        className="block leading-none text-xs px-1.5 py-0.5 text-neutral-500 disabled:opacity-20"
                        title="往下移"
                      >
                        ▼
                      </button>
                    </form>
                  </div>
                <details className="border border-neutral-200 rounded-lg flex-1 min-w-0">
                  <summary className="px-3 py-2 cursor-pointer flex items-center justify-between text-sm gap-2">
                    <span className="truncate">
                      {!item.isAvailable && "🚫 "}
                      {item.name}
                    </span>
                    <span className="text-neutral-500 shrink-0">
                      {formatPrice(item.singlePrice)}
                      {item.comboPrice ? ` / 套 ${formatPrice(item.comboPrice)}` : ""}
                    </span>
                  </summary>
                  <div className="px-3 pb-3">
                    <SavableForm action={updateMenuItem} className="space-y-2 text-sm">
                      <input type="hidden" name="id" value={item.id} />
                      <label className="block">
                        品名
                        <input
                          name="name"
                          defaultValue={item.name}
                          required
                          className="w-full border border-neutral-300 rounded px-2 py-1 mt-0.5"
                        />
                      </label>
                      <div className="flex gap-2">
                        <label className="block flex-1">
                          單品價格
                          <input
                            type="number"
                            name="singlePrice"
                            defaultValue={item.singlePrice ?? ""}
                            className="w-full border border-neutral-300 rounded px-2 py-1 mt-0.5"
                          />
                        </label>
                        <label className="block flex-1">
                          套餐價格
                          <input
                            type="number"
                            name="comboPrice"
                            defaultValue={item.comboPrice ?? ""}
                            className="w-full border border-neutral-300 rounded px-2 py-1 mt-0.5"
                          />
                        </label>
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isMarketPrice"
                          defaultChecked={item.isMarketPrice}
                        />
                        時價（提醒用，不影響計算）
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isAvailable"
                          defaultChecked={item.isAvailable}
                        />
                        上架中（取消勾選 = 菜單上會反灰顯示「暫停供應」，客人看得到但點不了）
                      </label>
                      <div className="flex gap-2">
                        <label className="block flex-1">
                          單點/套餐怎麼呈現
                          <select
                            name="singleVariantStyle"
                            defaultValue={item.singleVariantStyle}
                            className="w-full border border-neutral-300 rounded px-2 py-1 mt-0.5"
                          >
                            <option value="toggle">兩個按鈕平等選（像雞湯）</option>
                            <option value="discount">預設套餐，單點用打勾折抵（像魚/肉）</option>
                          </select>
                        </label>
                        <label className="block flex-1">
                          今日選項
                          <select
                            name="dailyChoiceType"
                            defaultValue={item.dailyChoiceType ?? ""}
                            className="w-full border border-neutral-300 rounded px-2 py-1 mt-0.5"
                          >
                            <option value="">不需要</option>
                            <option value="soup">今日雞湯口味</option>
                            <option value="vegetable">今日蔬菜</option>
                          </select>
                          <span className="text-xs text-neutral-400">
                            今天實際有哪些口味/蔬菜，去「店家設定」勾選
                          </span>
                        </label>
                      </div>
                      <div>
                        <span className="block mb-1">標籤</span>
                        <div className="flex flex-wrap gap-3">
                          {TAG_OPTIONS.map((t) => (
                            <label key={t.code} className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                name="tags"
                                value={t.code}
                                defaultChecked={currentTags.includes(t.code)}
                              />
                              {t.code} {t.label}
                            </label>
                          ))}
                        </div>
                      </div>
                      <label className="block">
                        加價選項（每行一個，格式：名稱=價格，例如 加麵線=30）
                        <textarea
                          name="addOnsText"
                          defaultValue={addOnsToText(item.addOns)}
                          rows={2}
                          className="w-full border border-neutral-300 rounded px-2 py-1 mt-0.5"
                        />
                      </label>
                      <label className="block">
                        備註
                        <input
                          name="note"
                          defaultValue={item.note ?? ""}
                          className="w-full border border-neutral-300 rounded px-2 py-1 mt-0.5"
                        />
                      </label>
                      <button className="bg-amber-600 text-white px-3 py-1.5 rounded-full text-sm">
                        儲存
                      </button>
                    </SavableForm>
                    <form action={deleteMenuItem} className="mt-2">
                      <input type="hidden" name="id" value={item.id} />
                      <button className="text-xs text-red-500 underline">刪除此品項</button>
                    </form>
                  </div>
                </details>
                </div>
              );
            })}
          </div>

          <details className="mt-3">
            <summary className="text-sm text-amber-700 cursor-pointer">+ 新增品項</summary>
            <SavableForm action={createMenuItem} className="space-y-2 text-sm mt-2">
              <input type="hidden" name="categoryId" value={category.id} />
              <label className="block">
                品名
                <input
                  name="name"
                  required
                  className="w-full border border-neutral-300 rounded px-2 py-1 mt-0.5"
                />
              </label>
              <div className="flex gap-2">
                <label className="block flex-1">
                  單品價格
                  <input
                    type="number"
                    name="singlePrice"
                    className="w-full border border-neutral-300 rounded px-2 py-1 mt-0.5"
                  />
                </label>
                <label className="block flex-1">
                  套餐價格
                  <input
                    type="number"
                    name="comboPrice"
                    className="w-full border border-neutral-300 rounded px-2 py-1 mt-0.5"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="isMarketPrice" />
                時價（提醒用，不影響計算）
              </label>
              <div className="flex gap-2">
                <label className="block flex-1">
                  單點/套餐怎麼呈現
                  <select
                    name="singleVariantStyle"
                    defaultValue="toggle"
                    className="w-full border border-neutral-300 rounded px-2 py-1 mt-0.5"
                  >
                    <option value="toggle">兩個按鈕平等選（像雞湯）</option>
                    <option value="discount">預設套餐，單點用打勾折抵（像魚/肉）</option>
                  </select>
                </label>
                <label className="block flex-1">
                  今日選項
                  <select
                    name="dailyChoiceType"
                    defaultValue=""
                    className="w-full border border-neutral-300 rounded px-2 py-1 mt-0.5"
                  >
                    <option value="">不需要</option>
                    <option value="soup">今日雞湯口味</option>
                    <option value="vegetable">今日蔬菜</option>
                  </select>
                  <span className="text-xs text-neutral-400">
                    今天實際有哪些口味/蔬菜，去「店家設定」勾選
                  </span>
                </label>
              </div>
              <div>
                <span className="block mb-1">標籤</span>
                <div className="flex flex-wrap gap-3">
                  {TAG_OPTIONS.map((t) => (
                    <label key={t.code} className="flex items-center gap-1">
                      <input type="checkbox" name="tags" value={t.code} />
                      {t.code} {t.label}
                    </label>
                  ))}
                </div>
              </div>
              <label className="block">
                加價選項（每行一個，格式：名稱=價格）
                <textarea
                  name="addOnsText"
                  rows={2}
                  className="w-full border border-neutral-300 rounded px-2 py-1 mt-0.5"
                />
              </label>
              <label className="block">
                備註
                <input
                  name="note"
                  className="w-full border border-neutral-300 rounded px-2 py-1 mt-0.5"
                />
              </label>
              <button className="bg-amber-600 text-white px-3 py-1.5 rounded-full text-sm">
                新增
              </button>
            </SavableForm>
          </details>
        </section>
      ))}

      <section className="border border-dashed border-neutral-300 rounded-xl p-4">
        <h2 className="font-medium mb-2">+ 新增分類</h2>
        <SavableForm action={createCategory} className="flex gap-2 items-center">
          <input
            name="name"
            placeholder="例如：每日湯品"
            required
            className="flex-1 border border-neutral-300 rounded px-2 py-1.5 text-sm"
          />
          <button className="bg-amber-600 text-white px-3 py-1.5 rounded-full text-sm">
            新增分類
          </button>
        </SavableForm>
      </section>
    </div>
  );
}
