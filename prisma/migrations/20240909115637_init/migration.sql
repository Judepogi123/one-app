/*
  Warnings:

  - You are about to drop the column `quotaId` on the `GenderSize` table. All the data in the column will be lost.
  - You are about to drop the column `activeSurveyor` on the `Quota` table. All the data in the column will be lost.
  - You are about to drop the column `municipalsId` on the `Quota` table. All the data in the column will be lost.
  - Added the required column `genderId` to the `Quota` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `Quota` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "GenderSize" DROP CONSTRAINT "GenderSize_quotaId_fkey";

-- DropForeignKey
ALTER TABLE "Quota" DROP CONSTRAINT "Quota_municipalsId_fkey";

-- AlterTable
ALTER TABLE "GenderSize" DROP COLUMN "quotaId";

-- AlterTable
ALTER TABLE "Quota" DROP COLUMN "activeSurveyor",
DROP COLUMN "municipalsId",
ADD COLUMN     "genderId" TEXT NOT NULL,
ADD COLUMN     "size" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Quota" ADD CONSTRAINT "Quota_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
