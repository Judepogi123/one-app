/*
  Warnings:

  - You are about to drop the `OptionResponse` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `optionId` to the `Response` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OptionResponse" DROP CONSTRAINT "OptionResponse_optionId_fkey";

-- DropForeignKey
ALTER TABLE "OptionResponse" DROP CONSTRAINT "OptionResponse_responseId_fkey";

-- AlterTable
ALTER TABLE "Barangays" ADD COLUMN     "population" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sampleSizeId" TEXT;

-- AlterTable
ALTER TABLE "Response" ADD COLUMN     "optionId" TEXT NOT NULL;

-- DropTable
DROP TABLE "OptionResponse";

-- CreateTable
CREATE TABLE "SampleSize" (
    "id" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "population" INTEGER NOT NULL,

    CONSTRAINT "SampleSize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgeBracket" (
    "id" TEXT NOT NULL,
    "segment" TEXT NOT NULL,

    CONSTRAINT "AgeBracket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gender" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Gender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quota" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Quota_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Barangays" ADD CONSTRAINT "Barangays_sampleSizeId_fkey" FOREIGN KEY ("sampleSizeId") REFERENCES "SampleSize"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
