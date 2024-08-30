/*
  Warnings:

  - You are about to drop the column `default` on the `Queries` table. All the data in the column will be lost.
  - You are about to drop the column `surveyResponseId` on the `Response` table. All the data in the column will be lost.
  - Added the required column `surveyId` to the `Response` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DefaultQuery" DROP CONSTRAINT "DefaultQuery_queriesId_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_surveyResponseId_fkey";

-- AlterTable
ALTER TABLE "Queries" DROP COLUMN "default";

-- AlterTable
ALTER TABLE "Response" DROP COLUMN "surveyResponseId",
ADD COLUMN     "surveyId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
