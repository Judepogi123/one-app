/*
  Warnings:

  - Added the required column `municipalsId` to the `Quota` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quota" ADD COLUMN     "municipalsId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Quota" ADD CONSTRAINT "Quota_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
