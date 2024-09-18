/*
  Warnings:

  - You are about to drop the column `femaleSize` on the `Quota` table. All the data in the column will be lost.
  - You are about to drop the column `maleSize` on the `Quota` table. All the data in the column will be lost.
  - You are about to drop the column `surveyor` on the `Quota` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quota" DROP COLUMN "femaleSize",
DROP COLUMN "maleSize",
DROP COLUMN "surveyor";

-- CreateTable
CREATE TABLE "GenderTotal" (
    "id" TEXT NOT NULL,
    "total" INTEGER DEFAULT 0,
    "genderId" TEXT NOT NULL,

    CONSTRAINT "GenderTotal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenderSize" (
    "id" TEXT NOT NULL,
    "genderId" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "quotaId" TEXT,

    CONSTRAINT "GenderSize_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GenderTotal" ADD CONSTRAINT "GenderTotal_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenderSize" ADD CONSTRAINT "GenderSize_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenderSize" ADD CONSTRAINT "GenderSize_quotaId_fkey" FOREIGN KEY ("quotaId") REFERENCES "Quota"("id") ON DELETE SET NULL ON UPDATE CASCADE;
