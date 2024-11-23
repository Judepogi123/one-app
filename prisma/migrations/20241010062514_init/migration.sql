/*
  Warnings:

  - Added the required column `info` to the `Hub` table without a default value. This is not possible if the table is not empty.
  - Added the required column `barangaysId` to the `TeamLeader` table without a default value. This is not possible if the table is not empty.
  - Added the required column `municipalsId` to the `TeamLeader` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_houseHoldId_fkey";

-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_hubId_fkey";

-- AlterTable
ALTER TABLE "Hub" ADD COLUMN     "info" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TeamLeader" ADD COLUMN     "barangaysId" TEXT NOT NULL,
ADD COLUMN     "municipalsId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_houseHoldId_fkey" FOREIGN KEY ("houseHoldId") REFERENCES "HouseHold"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLeader" ADD CONSTRAINT "TeamLeader_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLeader" ADD CONSTRAINT "TeamLeader_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;
