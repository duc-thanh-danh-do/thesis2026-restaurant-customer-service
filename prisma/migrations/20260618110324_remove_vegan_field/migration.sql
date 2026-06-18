/*
  Warnings:

  - You are about to drop the column `is_vegan` on the `menu_items` table. All the data in the column will be lost.
  - You are about to drop the column `is_vegetarian` on the `menu_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "menu_items" DROP COLUMN "is_vegan",
DROP COLUMN "is_vegetarian";
