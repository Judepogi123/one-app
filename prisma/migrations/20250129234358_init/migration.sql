-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "timestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "VoterRecords" ADD COLUMN     "type" INTEGER DEFAULT 0;

-- CreateTable
CREATE TABLE "AccountHandleTeam" (
    "id" TEXT NOT NULL,
    "usersUid" TEXT,
    "teamId" TEXT,
    "municipalsId" INTEGER,
    "barangaysId" TEXT,
    "accountValidateTeamId" TEXT,

    CONSTRAINT "AccountHandleTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountValidateTeam" (
    "id" TEXT NOT NULL,
    "usersUid" TEXT,
    "teamId" TEXT,
    "municipalsId" INTEGER,
    "barangaysId" TEXT,
    "timstamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountValidateTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationResult" (
    "id" TEXT NOT NULL,
    "props" TEXT,
    "type" TEXT,
    "value" TEXT,
    "votersId" TEXT,
    "action" INTEGER,
    "count" INTEGER DEFAULT 0,
    "teamId" TEXT,

    CONSTRAINT "ValidationResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountHandleTeam_accountValidateTeamId_key" ON "AccountHandleTeam"("accountValidateTeamId");

-- AddForeignKey
ALTER TABLE "AccountHandleTeam" ADD CONSTRAINT "AccountHandleTeam_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountHandleTeam" ADD CONSTRAINT "AccountHandleTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountHandleTeam" ADD CONSTRAINT "AccountHandleTeam_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountHandleTeam" ADD CONSTRAINT "AccountHandleTeam_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountHandleTeam" ADD CONSTRAINT "AccountHandleTeam_accountValidateTeamId_fkey" FOREIGN KEY ("accountValidateTeamId") REFERENCES "AccountValidateTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountValidateTeam" ADD CONSTRAINT "AccountValidateTeam_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountValidateTeam" ADD CONSTRAINT "AccountValidateTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountValidateTeam" ADD CONSTRAINT "AccountValidateTeam_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountValidateTeam" ADD CONSTRAINT "AccountValidateTeam_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationResult" ADD CONSTRAINT "ValidationResult_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationResult" ADD CONSTRAINT "ValidationResult_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
