/*
  Warnings:

  - You are about to drop the column `voterUid` on the `Hub` table. All the data in the column will be lost.
  - Added the required column `teamLeaderId` to the `Hub` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Hub" DROP CONSTRAINT "Hub_voterUid_fkey";

-- DropForeignKey
ALTER TABLE "TeamLeader" DROP CONSTRAINT "TeamLeader_hubId_fkey";

-- AlterTable
ALTER TABLE "Hub" DROP COLUMN "voterUid",
ADD COLUMN     "teamLeaderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Voters" ADD COLUMN     "hubId" TEXT;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hub" ADD CONSTRAINT "Hub_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "TeamLeader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
