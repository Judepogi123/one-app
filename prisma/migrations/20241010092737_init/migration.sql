-- AlterTable
ALTER TABLE "Voters" ADD COLUMN     "candidatesId" TEXT,
ADD COLUMN     "senior" BOOLEAN,
ADD COLUMN     "teamId" TEXT,
ADD COLUMN     "youth" BOOLEAN,
ALTER COLUMN "qrCode" SET DEFAULT 'None';

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "teamLeaderId" TEXT NOT NULL,
    "votersId" TEXT DEFAULT 'Unknown',
    "purokId" TEXT NOT NULL,
    "barangaysId" TEXT NOT NULL,
    "municipalsId" INTEGER NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlackList" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "municipalsId" INTEGER NOT NULL,
    "barangaysId" TEXT NOT NULL,
    "votersId" TEXT NOT NULL,

    CONSTRAINT "BlackList_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_candidatesId_fkey" FOREIGN KEY ("candidatesId") REFERENCES "Candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "TeamLeader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_purokId_fkey" FOREIGN KEY ("purokId") REFERENCES "Purok"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlackList" ADD CONSTRAINT "BlackList_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlackList" ADD CONSTRAINT "BlackList_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlackList" ADD CONSTRAINT "BlackList_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
