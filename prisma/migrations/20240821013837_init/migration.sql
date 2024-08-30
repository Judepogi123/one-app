/*
  Warnings:

  - You are about to drop the column `votersId` on the `Response` table. All the data in the column will be lost.
  - Added the required column `ageBracketId` to the `Response` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genderId` to the `Response` table without a default value. This is not possible if the table is not empty.
  - Added the required column `municipalsId` to the `Response` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_votersId_fkey";

-- AlterTable
ALTER TABLE "AgeBracket" ADD COLUMN     "order" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "MediaUrl" ADD COLUMN     "surveyId" TEXT;

-- AlterTable
ALTER TABLE "Response" DROP COLUMN "votersId",
ADD COLUMN     "ageBracketId" TEXT NOT NULL,
ADD COLUMN     "genderId" TEXT NOT NULL,
ADD COLUMN     "municipalsId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "MediaUrl" ADD CONSTRAINT "MediaUrl_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_ageBracketId_fkey" FOREIGN KEY ("ageBracketId") REFERENCES "AgeBracket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
