# 樂樂雞 線上點餐系統

為「樂樂雞健康雞湯」打造的掃碼點餐系統。客人掃描桌上的 QR code 就能用手機點餐，訂單即時出現在櫃台，老闆可以在後台管理菜單、桌號，並查看營業報表。

### 🍲 [立即體驗 → lele-order-system.vercel.app/order/1](https://lele-order-system.vercel.app/order/1)

點開就是第 1 桌的點餐頁，不用安裝、不用登入。網站和資料庫都在雲端運作，不需要任何一台電腦開著。

| 頁面 | 網址 | 誰用 |
| --- | --- | --- |
| 點餐頁 | [`/order/1`](https://lele-order-system.vercel.app/order/1)（數字換成桌號） | 客人 |
| 櫃台訂單 | [`/counter`](https://lele-order-system.vercel.app/counter) | 店員（需登入） |
| 後台管理 | [`/admin`](https://lele-order-system.vercel.app/admin) | 老闆（需登入） |

## 使用流程

```
客人掃桌上 QR code → 手機點餐、送出 → 櫃台即時看到訂單 → 客人到櫃台結帳 → 櫃台標記已付款
```

## 功能

### 🍲 客人點餐頁

- 每一桌有專屬 QR code，掃描後直接進入該桌的點餐頁
- 單點、套餐兩種價格；魚類與肉類以套餐為主，單點顯示為折扣選項
- 今日特餐：每天的湯品、青菜口味由店家在後台設定，客人點餐時從當日選項中挑選
- 加點選項（例如換麵線）、每道菜都能寫備註
- 料理標籤：調（調理）、強（強身）、孕（孕期）、產（產後）、復（復原），點一下就能看說明
- 停售品項以灰色顯示「暫停供應」，不會直接消失
- 時價品項顯示「請洽櫃台」
- 每台裝置會記住這一桌的點餐紀錄

### 🧾 櫃台訂單

- 每 5 秒自動更新，新訂單即時出現
- 標記訂單為已付款或取消
- 顯示當日銷售統計

### 🛠️ 後台管理

- **菜單管理**：新增和編輯分類與品項、調整排序、設定價格與標籤、暫停或恢復販售
- **桌號 / QR code**：管理桌號並自動產生每桌的 QR code，QR code 會使用網站目前的網址，可直接列印貼在桌上
- **營業報表**：依時間間隔把訂單分成來客批次，用圓餅圖顯示各品項銷售額佔比，點一下可以看細項
- **店家設定**：店名、電話、地址、營業時間、公休日、點餐須知

## 技術架構

```
客人 / 店員的手機或電腦
        │
        ▼
   Vercel（Next.js 網站）
        │
        ▼
   Supabase（PostgreSQL 資料庫，新加坡機房）
```

- **框架**：[Next.js 16](https://nextjs.org/)（App Router）+ React 19 + TypeScript
- **樣式**：Tailwind CSS 4
- **資料庫**：[Supabase](https://supabase.com/) PostgreSQL + [Prisma](https://www.prisma.io/) ORM
- **QR code**：[qrcode](https://github.com/soldair/node-qrcode)
- **登入驗證**：以 `ADMIN_PASSWORD` 登入，簽章過的 session cookie 保護櫃台與後台頁面
- **部署**：[Vercel](https://vercel.com/)（Hobby 免費方案）

## 資料模型

| 資料表 | 說明 |
| --- | --- |
| `Category` | 菜單分類，其中一個可以標記為「今日特餐」 |
| `MenuItem` | 品項：單點價、套餐價、時價、標籤、加點選項、每日選擇類型、是否販售中 |
| `RestaurantTable` | 桌號 |
| `Order` / `OrderItem` | 訂單與明細。明細會保存下單當下的品名與價格快照，之後改菜單也不影響舊訂單 |
| `Setting` | 店家設定（店名、營業時間、今日湯品與青菜選項等） |

## 維運注意事項

### Supabase 免費方案會自動暫停

Supabase 免費方案的專案如果 7 天內資料庫活動太少，就會被暫停，這時網站會顯示伺服器錯誤，Vercel 紀錄裡會出現 `Can't reach database server`。

- **恢復方式**：登入 [Supabase Dashboard](https://supabase.com/dashboard)，選擇這個專案，按 **Resume project**，等幾分鐘就會恢復，資料不會遺失。
- **預防方式**：正式營業後每天都有訂單就不會被暫停；Supabase 在暫停前約一週會寄信提醒。也可以升級成付費方案。

### 更新網站

這個 Vercel 專案目前是用 `vercel deploy` 指令手動部署，**沒有連接 GitHub**。修改程式碼後有兩種更新方式：

- 在專案資料夾執行 `vercel --prod`
- 或在 Vercel 專案頁面點「連接 Git」接上這個 repo，之後推到 GitHub 就會自動重新部署（建議）

每次部署都會自動執行 `vercel-build`（`prisma generate` → `prisma migrate deploy` → `next build`），資料表結構會自動更新。

### ⚠️ 不要對正式資料庫執行 seed

`npx prisma db seed` 會**先清空所有資料（包含訂單與後台改過的菜單）**再匯入預設資料，只能在全新的資料庫上執行一次。

## 自己架設

需要 Node.js 20 以上版本和一個 PostgreSQL 資料庫（例如 [Supabase](https://supabase.com/) 免費方案）。

```bash
git clone https://github.com/Sandyo-O/lele-order-system.git
cd lele-order-system
npm install
```

在專案根目錄建立 `.env`：

```env
DATABASE_URL="postgresql://..."   # 連線池網址（Supabase 的 Transaction pooler，port 6543）
DIRECT_URL="postgresql://..."     # 直連網址（Supabase 的 Session pooler 或 Direct connection），migrate 時使用
ADMIN_PASSWORD="後台登入密碼"
APP_SECRET="一串 32 字元以上的隨機字串，用來簽章登入 session"
```

建立資料表並匯入預設菜單、桌號和店家資料（僅限全新資料庫）：

```bash
npx prisma migrate deploy
npx prisma db seed
```

啟動開發伺服器：

```bash
npm run dev
```

打開 <http://localhost:3000/order/1> 就能看到第 1 桌的點餐頁。

部署到自己的 Vercel 時，在專案的 Environment Variables 填入上面四個變數即可。
