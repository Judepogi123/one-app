/*
  Warnings:

  - You are about to drop the column `population` on the `Quota` table. All the data in the column will be lost.
  - You are about to drop the column `sampleSize` on the `Quota` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quota" DROP COLUMN "population",
DROP COLUMN "sampleSize";
