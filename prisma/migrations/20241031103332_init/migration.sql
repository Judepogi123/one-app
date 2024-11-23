/*
  Warnings:

  - You are about to drop the column `teamLeaderId` on the `Voters` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Hub" DROP CONSTRAINT "Hub_teamLeaderId_fkey";

-- DropForeignKey
ALTER TABLE "PurokCoor" DROP CONSTRAINT "PurokCoor_barangayCoorId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_teamLeaderId_fkey";

-- DropForeignKey
ALTER TABLE "TeamLeader" DROP CONSTRAINT "TeamLeader_purokCoorId_fkey";

-- AlterTable
ALTER TABLE "HouseHold" ALTER COLUMN "purokId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PurokCoor" ALTER COLUMN "barangayCoorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "QRcode" ADD COLUMN     "number" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "Team" ALTER COLUMN "teamLeaderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TeamLeader" ALTER COLUMN "purokCoorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Voters" DROP COLUMN "teamLeaderId";

-- AddForeignKey
ALTER TABLE "Hub" ADD CONSTRAINT "Hub_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "TeamLeader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "TeamLeader"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLeader" ADD CONSTRAINT "TeamLeader_purokCoorId_fkey" FOREIGN KEY ("purokCoorId") REFERENCES "PurokCoor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurokCoor" ADD CONSTRAINT "PurokCoor_barangayCoorId_fkey" FOREIGN KEY ("barangayCoorId") REFERENCES "BarangayCoor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
