-- AlterTable
ALTER TABLE "Team" ALTER COLUMN "purokId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ValidatedTeams" ALTER COLUMN "purokId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TeamRecordsLogs" (
    "id" TEXT NOT NULL,
    "timstamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" INTEGER NOT NULL,
    "municipalsId" INTEGER NOT NULL,
    "barangaysId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "TeamRecordsLogs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TeamRecordsLogs" ADD CONSTRAINT "TeamRecordsLogs_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRecordsLogs" ADD CONSTRAINT "TeamRecordsLogs_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRecordsLogs" ADD CONSTRAINT "TeamRecordsLogs_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
