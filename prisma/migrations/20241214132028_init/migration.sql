/*
  Warnings:

  - You are about to drop the column `number` on the `SurveyorNumber` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `firstname` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `lastname` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `Users` table. All the data in the column will be lost.
  - The `status` column on the `Users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[teamlLeaderQRcodesId]` on the table `TeamLeader` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userQRCodeId]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `password` to the `SurveyorNumber` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `SurveyorNumber` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `SurveyorNumber` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `Users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Queries" ADD COLUMN     "withCustomOption" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "RespondentResponse" ADD COLUMN     "usersUid" TEXT,
ALTER COLUMN "valid" SET DEFAULT true;

-- AlterTable
ALTER TABLE "SurveyorNumber" DROP COLUMN "number",
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "role" INTEGER NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TeamLeader" ADD COLUMN     "barangayCoorId" TEXT,
ADD COLUMN     "purokCoorsId" TEXT,
ADD COLUMN     "teamLeaderId" TEXT,
ADD COLUMN     "teamlLeaderQRcodesId" TEXT;

-- AlterTable
ALTER TABLE "TeamRecordsLogs" ADD COLUMN     "method" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "value" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Users" DROP COLUMN "address",
DROP COLUMN "firstname",
DROP COLUMN "lastname",
DROP COLUMN "phoneNumber",
ADD COLUMN     "privilege" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9]::INTEGER[],
ADD COLUMN     "purpose" INTEGER NOT NULL DEFAULT 1234,
ADD COLUMN     "role" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "timstamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userQRCodeId" TEXT,
ADD COLUMN     "username" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ValidatedTeams" ADD COLUMN     "issues" INTEGER DEFAULT 0,
ADD COLUMN     "usersUid" TEXT;

-- AlterTable
ALTER TABLE "Voters" ADD COLUMN     "witnessId" TEXT;

-- CreateTable
CREATE TABLE "UserQRCode" (
    "id" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,

    CONSTRAINT "UserQRCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "uid" TEXT NOT NULL,
    "fromUid" TEXT NOT NULL,
    "targetUid" TEXT NOT NULL,
    "viewed" BOOLEAN NOT NULL DEFAULT false,
    "path" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "UserActivityLogs" (
    "id" TEXT NOT NULL,
    "activity" TEXT DEFAULT 'None',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usersUid" TEXT,

    CONSTRAINT "UserActivityLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamlLeaderQRcodes" (
    "id" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,

    CONSTRAINT "TeamlLeaderQRcodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamLeaderAttendance" (
    "id" TEXT NOT NULL,
    "for" INTEGER NOT NULL DEFAULT 1,
    "teamLeaderId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "usersUid" TEXT,

    CONSTRAINT "TeamLeaderAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomOption" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "queriesId" TEXT,

    CONSTRAINT "CustomOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamRecords" (
    "id" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3),
    "teamId" TEXT NOT NULL,
    "usersUid" TEXT NOT NULL,

    CONSTRAINT "TeamRecords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamDistributions" (
    "id" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3),
    "status" INTEGER DEFAULT 0,
    "teamId" TEXT NOT NULL,
    "usersUid" TEXT,

    CONSTRAINT "TeamDistributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Witness" (
    "id" TEXT NOT NULL,
    "votersId" TEXT NOT NULL,
    "timstamp" TIMESTAMP(3) NOT NULL,
    "teamDistributionsId" TEXT,

    CONSTRAINT "Witness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoterRecords" (
    "id" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "questionable" BOOLEAN NOT NULL DEFAULT true,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "votersId" TEXT NOT NULL,
    "usersUid" TEXT NOT NULL,

    CONSTRAINT "VoterRecords_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Witness_votersId_key" ON "Witness"("votersId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamLeader_teamlLeaderQRcodesId_key" ON "TeamLeader"("teamlLeaderQRcodesId");

-- CreateIndex
CREATE UNIQUE INDEX "Users_userQRCodeId_key" ON "Users"("userQRCodeId");

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_userQRCodeId_fkey" FOREIGN KEY ("userQRCodeId") REFERENCES "UserQRCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_fromUid_fkey" FOREIGN KEY ("fromUid") REFERENCES "Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_targetUid_fkey" FOREIGN KEY ("targetUid") REFERENCES "Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivityLogs" ADD CONSTRAINT "UserActivityLogs_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLeader" ADD CONSTRAINT "TeamLeader_teamlLeaderQRcodesId_fkey" FOREIGN KEY ("teamlLeaderQRcodesId") REFERENCES "TeamlLeaderQRcodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLeader" ADD CONSTRAINT "TeamLeader_barangayCoorId_fkey" FOREIGN KEY ("barangayCoorId") REFERENCES "TeamLeader"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLeader" ADD CONSTRAINT "TeamLeader_purokCoorsId_fkey" FOREIGN KEY ("purokCoorsId") REFERENCES "TeamLeader"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLeader" ADD CONSTRAINT "TeamLeader_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "TeamLeader"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLeaderAttendance" ADD CONSTRAINT "TeamLeaderAttendance_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "TeamLeader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLeaderAttendance" ADD CONSTRAINT "TeamLeaderAttendance_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatedTeams" ADD CONSTRAINT "ValidatedTeams_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomOption" ADD CONSTRAINT "CustomOption_queriesId_fkey" FOREIGN KEY ("queriesId") REFERENCES "Queries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentResponse" ADD CONSTRAINT "RespondentResponse_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRecords" ADD CONSTRAINT "TeamRecords_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRecords" ADD CONSTRAINT "TeamRecords_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamDistributions" ADD CONSTRAINT "TeamDistributions_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamDistributions" ADD CONSTRAINT "TeamDistributions_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Witness" ADD CONSTRAINT "Witness_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Witness" ADD CONSTRAINT "Witness_teamDistributionsId_fkey" FOREIGN KEY ("teamDistributionsId") REFERENCES "TeamDistributions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoterRecords" ADD CONSTRAINT "VoterRecords_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoterRecords" ADD CONSTRAINT "VoterRecords_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
