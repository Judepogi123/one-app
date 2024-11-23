/*
  Warnings:

  - You are about to drop the column `votersId` on the `Team` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_votersId_fkey";

-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_teamLeaderId_fkey";

-- AlterTable
ALTER TABLE "PurokCoor" ADD COLUMN     "handle" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "votersId",
ADD COLUMN     "hubId" TEXT;

-- AlterTable
ALTER TABLE "TeamLeader" ADD COLUMN     "votersId" TEXT,
ALTER COLUMN "voterId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Voters" ADD COLUMN     "teamId" TEXT;

-- CreateTable
CREATE TABLE "QRcode" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "barangaysId" TEXT NOT NULL,
    "purokId" TEXT NOT NULL,
    "municipalsId" INTEGER NOT NULL,
    "votersId" TEXT NOT NULL,
    "stamp" INTEGER NOT NULL DEFAULT 1,
    "barangayCoorId" TEXT,
    "purokCoorId" TEXT,
    "teamId" TEXT NOT NULL,
    "teamLeaderId" TEXT NOT NULL,

    CONSTRAINT "QRcode_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLeader" ADD CONSTRAINT "TeamLeader_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRcode" ADD CONSTRAINT "QRcode_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRcode" ADD CONSTRAINT "QRcode_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRcode" ADD CONSTRAINT "QRcode_purokId_fkey" FOREIGN KEY ("purokId") REFERENCES "Purok"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRcode" ADD CONSTRAINT "QRcode_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRcode" ADD CONSTRAINT "QRcode_barangayCoorId_fkey" FOREIGN KEY ("barangayCoorId") REFERENCES "BarangayCoor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRcode" ADD CONSTRAINT "QRcode_purokCoorId_fkey" FOREIGN KEY ("purokCoorId") REFERENCES "PurokCoor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRcode" ADD CONSTRAINT "QRcode_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "TeamLeader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRcode" ADD CONSTRAINT "QRcode_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
