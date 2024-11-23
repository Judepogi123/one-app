/*
  Warnings:

  - You are about to drop the column `position` on the `Candidates` table. All the data in the column will be lost.
  - Made the column `teamLeaderId` on table `Team` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Candidates" DROP CONSTRAINT "Candidates_candidateBatchId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_teamLeaderId_fkey";

-- AlterTable
ALTER TABLE "BarangayCoor" ADD COLUMN     "candidatesId" TEXT;

-- AlterTable
ALTER TABLE "Candidates" DROP COLUMN "position",
ADD COLUMN     "mediaUrlId" TEXT,
ADD COLUMN     "positionId" TEXT,
ALTER COLUMN "code" DROP NOT NULL,
ALTER COLUMN "desc" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PurokCoor" ADD COLUMN     "candidatesId" TEXT;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "candidatesId" TEXT,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "teamLeaderId" SET NOT NULL;

-- AlterTable
ALTER TABLE "TeamLeader" ADD COLUMN     "candidatesId" TEXT,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Candidates" ADD CONSTRAINT "Candidates_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidates" ADD CONSTRAINT "Candidates_mediaUrlId_fkey" FOREIGN KEY ("mediaUrlId") REFERENCES "MediaUrl"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "TeamLeader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_candidatesId_fkey" FOREIGN KEY ("candidatesId") REFERENCES "Candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLeader" ADD CONSTRAINT "TeamLeader_candidatesId_fkey" FOREIGN KEY ("candidatesId") REFERENCES "Candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurokCoor" ADD CONSTRAINT "PurokCoor_candidatesId_fkey" FOREIGN KEY ("candidatesId") REFERENCES "Candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangayCoor" ADD CONSTRAINT "BarangayCoor_candidatesId_fkey" FOREIGN KEY ("candidatesId") REFERENCES "Candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
