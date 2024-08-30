/*
  Warnings:

  - You are about to drop the column `sampleSizeId` on the `Barangays` table. All the data in the column will be lost.
  - You are about to drop the column `population` on the `SampleSize` table. All the data in the column will be lost.
  - Added the required column `rate` to the `SampleSize` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Barangays" DROP CONSTRAINT "Barangays_sampleSizeId_fkey";

-- AlterTable
ALTER TABLE "Barangays" DROP COLUMN "sampleSizeId",
ADD COLUMN     "sampleRate" INTEGER DEFAULT 10,
ADD COLUMN     "sampleSize" INTEGER DEFAULT 0,
ALTER COLUMN "population" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SampleSize" DROP COLUMN "population",
ADD COLUMN     "rate" INTEGER NOT NULL;
