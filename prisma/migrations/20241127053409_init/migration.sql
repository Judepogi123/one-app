-- AlterTable
ALTER TABLE "QRcode" ADD COLUMN     "voterNumber" TEXT;

-- AlterTable
ALTER TABLE "Queries" ADD COLUMN     "style" INTEGER DEFAULT 1;

-- AlterTable
ALTER TABLE "Voters" ADD COLUMN     "idNumber" TEXT DEFAULT 'none';

-- CreateTable
CREATE TABLE "ValidatedTeams" (
    "id" TEXT NOT NULL,
    "votersId" TEXT NOT NULL,
    "teamLeaderId" TEXT,
    "barangaysId" TEXT NOT NULL,
    "municipalsId" INTEGER NOT NULL,
    "purokId" TEXT NOT NULL,

    CONSTRAINT "ValidatedTeams_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ValidatedTeams" ADD CONSTRAINT "ValidatedTeams_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatedTeams" ADD CONSTRAINT "ValidatedTeams_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "TeamLeader"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatedTeams" ADD CONSTRAINT "ValidatedTeams_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatedTeams" ADD CONSTRAINT "ValidatedTeams_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
