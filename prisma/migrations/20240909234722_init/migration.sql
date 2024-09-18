/*
  Warnings:

  - You are about to drop the column `genderId` on the `Quota` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `Quota` table. All the data in the column will be lost.
  - Added the required column `surveyId` to the `Quota` table without a default value. This is not possible if the table is not empty.
  - Made the column `barangaysId` on table `Quota` required. This step will fail if there are existing NULL values in that column.
  - Made the column `population` on table `Quota` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sampleSize` on table `Quota` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Quota" DROP CONSTRAINT "Quota_barangaysId_fkey";

-- DropForeignKey
ALTER TABLE "Quota" DROP CONSTRAINT "Quota_genderId_fkey";

-- AlterTable
ALTER TABLE "GenderSize" ADD COLUMN     "quotaId" TEXT;

-- AlterTable
ALTER TABLE "Quota" DROP COLUMN "genderId",
DROP COLUMN "size",
ADD COLUMN     "activeSurveyor" INTEGER DEFAULT 0,
ADD COLUMN     "surveyId" TEXT NOT NULL,
ALTER COLUMN "barangaysId" SET NOT NULL,
ALTER COLUMN "population" SET NOT NULL,
ALTER COLUMN "sampleSize" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "GenderSize" ADD CONSTRAINT "GenderSize_quotaId_fkey" FOREIGN KEY ("quotaId") REFERENCES "Quota"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quota" ADD CONSTRAINT "Quota_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quota" ADD CONSTRAINT "Quota_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
