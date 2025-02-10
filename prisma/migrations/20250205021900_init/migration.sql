/*
  Warnings:

  - You are about to drop the column `timstamp` on the `UntrackedVoter` table. All the data in the column will be lost.
  - Added the required column `method` to the `UserActivityLogs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `barangaysId` to the `ValidationResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `municipalsId` to the `ValidationResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CandidateBatch" ADD COLUMN     "year" INTEGER,
ALTER COLUMN "waveId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Candidates" ADD COLUMN     "municipalsId" INTEGER,
ALTER COLUMN "candidateBatchId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UntrackedVoter" DROP COLUMN "timstamp",
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "UserActivityLogs" ADD COLUMN     "method" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ValidationResult" ADD COLUMN     "barangaysId" TEXT NOT NULL,
ADD COLUMN     "municipalsId" INTEGER NOT NULL,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Voters" ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "TeamJoinDate" (
    "id" TEXT NOT NULL,
    "votersId" TEXT,
    "teamId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" INTEGER DEFAULT 1,

    CONSTRAINT "TeamJoinDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValdilatedMembers" (
    "id" TEXT NOT NULL,
    "votersId" TEXT,
    "teamId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValdilatedMembers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReport" (
    "id" TEXT NOT NULL,
    "section" TEXT,
    "subject" TEXT,
    "message" TEXT,
    "usersUid" TEXT,
    "timestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportFeedback" (
    "id" TEXT NOT NULL,
    "userReportId" TEXT,
    "feedback" TEXT,
    "timestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamUpdateArchive" (
    "id" TEXT NOT NULL,
    "desc" TEXT,
    "level" INTEGER NOT NULL,
    "result" INTEGER NOT NULL,
    "method" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "teamId" TEXT,

    CONSTRAINT "TeamUpdateArchive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMembersTransac" (
    "id" TEXT NOT NULL,
    "votersId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "teamUpdateArchiveId" TEXT,

    CONSTRAINT "TeamMembersTransac_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Candidates" ADD CONSTRAINT "Candidates_candidateBatchId_fkey" FOREIGN KEY ("candidateBatchId") REFERENCES "CandidateBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidates" ADD CONSTRAINT "Candidates_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamJoinDate" ADD CONSTRAINT "TeamJoinDate_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamJoinDate" ADD CONSTRAINT "TeamJoinDate_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValdilatedMembers" ADD CONSTRAINT "ValdilatedMembers_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValdilatedMembers" ADD CONSTRAINT "ValdilatedMembers_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationResult" ADD CONSTRAINT "ValidationResult_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationResult" ADD CONSTRAINT "ValidationResult_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportFeedback" ADD CONSTRAINT "ReportFeedback_userReportId_fkey" FOREIGN KEY ("userReportId") REFERENCES "UserReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamUpdateArchive" ADD CONSTRAINT "TeamUpdateArchive_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembersTransac" ADD CONSTRAINT "TeamMembersTransac_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMembersTransac" ADD CONSTRAINT "TeamMembersTransac_teamUpdateArchiveId_fkey" FOREIGN KEY ("teamUpdateArchiveId") REFERENCES "TeamUpdateArchive"("id") ON DELETE SET NULL ON UPDATE CASCADE;
