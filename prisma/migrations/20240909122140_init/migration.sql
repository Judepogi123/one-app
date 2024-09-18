/*
  Warnings:

  - You are about to drop the column `surveyId` on the `Quota` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Quota" DROP CONSTRAINT "Quota_surveyId_fkey";

-- AlterTable
ALTER TABLE "Quota" DROP COLUMN "surveyId";
