/*
  Warnings:

  - You are about to drop the column `teamId` on the `Voters` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NewBatchDraft" ADD COLUMN     "drafted" BOOLEAN DEFAULT true;

-- AlterTable
ALTER TABLE "Voters" DROP COLUMN "teamId",
ALTER COLUMN "hubId" DROP DEFAULT;
