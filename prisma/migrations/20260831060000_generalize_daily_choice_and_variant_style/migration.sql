-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN "dailyChoiceType" TEXT;
ALTER TABLE "MenuItem" ADD COLUMN "singleVariantStyle" TEXT NOT NULL DEFAULT 'toggle';

-- Backfill: items that required a daily soup choice now use dailyChoiceType = 'soup'
UPDATE "MenuItem" SET "dailyChoiceType" = 'soup' WHERE "requiresDailySoupChoice" = true;

-- Drop old column now that its meaning has been migrated
ALTER TABLE "MenuItem" DROP COLUMN "requiresDailySoupChoice";
