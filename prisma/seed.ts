import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SOUP_NOODLE_ADDON = JSON.stringify([{ name: "換麵線", price: 30 }]);
const LIMITED_SOUP_ADDON = JSON.stringify([{ name: "套餐加購限定雞湯", price: 100 }]);

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.restaurantTable.deleteMany();
  await prisma.setting.deleteMany();

  await prisma.category.create({
    data: {
      name: "頭好壯壯魚餐",
      sortOrder: 3,
      items: {
        create: [
          {
            name: "營養煎鮭魚飯",
            singlePrice: 350,
            isMarketPrice: true,
            addOns: LIMITED_SOUP_ADDON,
            note: "時價，實際價格請店家於後台確認調整",
            sortOrder: 1,
          },
          {
            name: "酥煎鱈魚飯",
            singlePrice: 330,
            isMarketPrice: true,
            addOns: LIMITED_SOUP_ADDON,
            note: "時價，實際價格請店家於後台確認調整",
            sortOrder: 2,
          },
          {
            name: "煎/紅燒虱目魚飯",
            singlePrice: 280,
            isMarketPrice: true,
            addOns: LIMITED_SOUP_ADDON,
            note: "時價，實際價格請店家於後台確認調整",
            sortOrder: 3,
          },
          {
            name: "煎/紅燒鱸魚飯(片)",
            singlePrice: 250,
            addOns: LIMITED_SOUP_ADDON,
            sortOrder: 4,
          },
          {
            name: "薄鹽鯖魚飯(片)",
            singlePrice: 190,
            isMarketPrice: true,
            addOns: LIMITED_SOUP_ADDON,
            note: "菜單手寫字跡不易辨識，請店家於後台確認正確價格",
            sortOrder: 5,
          },
          {
            name: "煎の午仔魚飯",
            singlePrice: null,
            isMarketPrice: true,
            addOns: LIMITED_SOUP_ADDON,
            note: "時價，請店家於後台補上目前價格",
            sortOrder: 6,
          },
        ],
      },
    },
  });

  await prisma.category.create({
    data: {
      name: "私房肉肉餐",
      sortOrder: 4,
      items: {
        create: [
          {
            name: "鹹香炒鹹豬肉飯",
            singlePrice: 180,
            comboPrice: 230,
            addOns: LIMITED_SOUP_ADDON,
            sortOrder: 1,
          },
          {
            name: "紅燒三層肉飯",
            singlePrice: 150,
            comboPrice: 200,
            addOns: LIMITED_SOUP_ADDON,
            sortOrder: 2,
          },
          {
            name: "古早味梅乾扣肉飯",
            singlePrice: 150,
            comboPrice: 200,
            addOns: LIMITED_SOUP_ADDON,
            sortOrder: 3,
          },
          {
            name: "無骨炸雞腿排飯",
            singlePrice: 120,
            comboPrice: 170,
            addOns: LIMITED_SOUP_ADDON,
            sortOrder: 4,
          },
          {
            name: "中式炸豬排飯",
            singlePrice: 100,
            comboPrice: 150,
            addOns: LIMITED_SOUP_ADDON,
            sortOrder: 5,
          },
          {
            name: "小雞湯特餐",
            singlePrice: 100,
            comboPrice: 150,
            requiresDailySoupChoice: true,
            sortOrder: 6,
          },
        ],
      },
    },
  });

  await prisma.category.create({
    data: {
      name: "想要加個菜",
      sortOrder: 5,
      items: {
        create: [
          { name: "現炒時蔬", singlePrice: 100, sortOrder: 1 },
          { name: "麻油(乾)麵線", singlePrice: 50, sortOrder: 2 },
          {
            name: "煎個蔥仔蛋",
            singlePrice: 100,
            note: "菜單手寫字跡不易辨識(可能是100或120)，請店家於後台確認正確價格",
            sortOrder: 3,
          },
          { name: "瘦瘦雞絲飯", singlePrice: 50, sortOrder: 4 },
          {
            name: "各式滷味",
            singlePrice: null,
            isMarketPrice: true,
            note: "依選擇項目計價，請洽櫃台",
            sortOrder: 5,
          },
          { name: "香香滷肉飯", singlePrice: 40, sortOrder: 6 },
        ],
      },
    },
  });

  await prisma.category.create({
    data: {
      name: "我想喝補湯",
      sortOrder: 1,
      items: {
        create: [
          {
            name: "剝皮辣椒雞",
            singlePrice: 210,
            comboPrice: 260,
            tags: "強",
            addOns: SOUP_NOODLE_ADDON,
            sortOrder: 1,
          },
          {
            name: "抗老菜脯雞",
            singlePrice: 210,
            comboPrice: 260,
            tags: "強",
            addOns: SOUP_NOODLE_ADDON,
            sortOrder: 2,
          },
          {
            name: "醉香麻油雞",
            singlePrice: 210,
            comboPrice: 260,
            tags: "調,產",
            addOns: SOUP_NOODLE_ADDON,
            sortOrder: 3,
          },
          {
            name: "十全大補雞",
            singlePrice: 210,
            comboPrice: 260,
            tags: "調,產",
            addOns: SOUP_NOODLE_ADDON,
            sortOrder: 4,
          },
          {
            name: "人蔘枸杞雞",
            singlePrice: 210,
            comboPrice: 260,
            tags: "調",
            addOns: SOUP_NOODLE_ADDON,
            sortOrder: 5,
          },
        ],
      },
    },
  });

  await prisma.category.create({
    data: {
      name: "媽媽小孩最愛喝",
      sortOrder: 2,
      items: {
        create: [
          {
            name: "元氣香菇雞",
            singlePrice: 180,
            comboPrice: 230,
            tags: "孕,復",
            addOns: SOUP_NOODLE_ADDON,
            sortOrder: 1,
          },
          {
            name: "九尾草雞",
            singlePrice: 180,
            comboPrice: 230,
            tags: "強,孕,產",
            addOns: SOUP_NOODLE_ADDON,
            sortOrder: 2,
          },
          {
            name: "山葡萄雞",
            singlePrice: 180,
            comboPrice: 230,
            tags: "強",
            addOns: SOUP_NOODLE_ADDON,
            sortOrder: 3,
          },
          {
            name: "何首烏雞",
            singlePrice: 180,
            comboPrice: 230,
            tags: "調,強",
            addOns: SOUP_NOODLE_ADDON,
            sortOrder: 4,
          },
          {
            name: "藥燉排骨",
            singlePrice: 180,
            comboPrice: 230,
            tags: "調,強",
            addOns: SOUP_NOODLE_ADDON,
            sortOrder: 5,
          },
          {
            name: "清香鱸魚湯",
            singlePrice: 200,
            comboPrice: 250,
            tags: "產,孕",
            addOns: SOUP_NOODLE_ADDON,
            sortOrder: 6,
          },
        ],
      },
    },
  });

  await prisma.category.create({
    data: {
      name: "今日特餐",
      sortOrder: 6,
      isDaily: true,
      items: { create: [] },
    },
  });

  await prisma.restaurantTable.createMany({
    data: Array.from({ length: 12 }, (_, i) => ({ number: i + 1 })),
  });

  await prisma.setting.createMany({
    data: [
      { key: "storeName", value: "樂樂雞" },
      { key: "phone", value: "(03)212-3521" },
      { key: "address", value: "桃園縣龜山區南上路47號" },
      { key: "hours", value: "AM11:00-14:00 | 17:00-21:00" },
      { key: "closedDays", value: "每周日及國定假日" },
      { key: "orderNote", value: "掃描桌上 QR code 線上點餐，送出後請至櫃台結帳" },
      { key: "dailySoupOptions", value: "" },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
