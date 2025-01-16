-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "forMunicipal" INTEGER;

-- CreateTable
CREATE TABLE "DuplicateteamMembers" (
    "id" TEXT NOT NULL,
    "votersId" TEXT,
    "timstamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teamId" TEXT,
    "foundTeamId" TEXT,
    "barangaysId" TEXT NOT NULL,
    "municipalsId" INTEGER NOT NULL,

    CONSTRAINT "DuplicateteamMembers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DuplicateteamMembers" ADD CONSTRAINT "DuplicateteamMembers_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateteamMembers" ADD CONSTRAINT "DuplicateteamMembers_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateteamMembers" ADD CONSTRAINT "DuplicateteamMembers_foundTeamId_fkey" FOREIGN KEY ("foundTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateteamMembers" ADD CONSTRAINT "DuplicateteamMembers_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateteamMembers" ADD CONSTRAINT "DuplicateteamMembers_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
