/*
  Warnings:

  - Added the required column `barangaysId` to the `Quota` table without a default value. This is not possible if the table is not empty.
  - Added the required column `femaleSize` to the `Quota` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maleSize` to the `Quota` table without a default value. This is not possible if the table is not empty.
  - Added the required column `population` to the `Quota` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sampleSize` to the `Quota` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surveyId` to the `Quota` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quota" ADD COLUMN     "barangaysId" TEXT NOT NULL,
ADD COLUMN     "femaleSize" INTEGER NOT NULL,
ADD COLUMN     "maleSize" INTEGER NOT NULL,
ADD COLUMN     "population" INTEGER NOT NULL,
ADD COLUMN     "sampleSize" INTEGER NOT NULL,
ADD COLUMN     "surveyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Survey" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Title_';

-- AddForeignKey
ALTER TABLE "Quota" ADD CONSTRAINT "Quota_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quota" ADD CONSTRAINT "Quota_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
