-- AlterTable
ALTER TABLE "RespondentResponse" ADD COLUMN     "mediaUrlId" TEXT,
ADD COLUMN     "valid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "validatedResponseId" TEXT;

-- AlterTable
ALTER TABLE "ValidatedTeams" ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ValidatedTeamMembers" (
    "id" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "votersId" TEXT,
    "barangayId" TEXT NOT NULL,
    "municipalsId" INTEGER,
    "purokId" TEXT NOT NULL,
    "teamLeaderId" TEXT,
    "validatedTeamsId" TEXT,
    "remark" TEXT DEFAULT 'OK',

    CONSTRAINT "ValidatedTeamMembers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyorNumber" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,

    CONSTRAINT "SurveyorNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidatedResponse" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "surveyorNumberId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidatedResponse_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ValidatedTeamMembers" ADD CONSTRAINT "ValidatedTeamMembers_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatedTeamMembers" ADD CONSTRAINT "ValidatedTeamMembers_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatedTeamMembers" ADD CONSTRAINT "ValidatedTeamMembers_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatedTeamMembers" ADD CONSTRAINT "ValidatedTeamMembers_purokId_fkey" FOREIGN KEY ("purokId") REFERENCES "Purok"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatedTeamMembers" ADD CONSTRAINT "ValidatedTeamMembers_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "TeamLeader"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatedTeamMembers" ADD CONSTRAINT "ValidatedTeamMembers_validatedTeamsId_fkey" FOREIGN KEY ("validatedTeamsId") REFERENCES "ValidatedTeams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentResponse" ADD CONSTRAINT "RespondentResponse_validatedResponseId_fkey" FOREIGN KEY ("validatedResponseId") REFERENCES "ValidatedResponse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentResponse" ADD CONSTRAINT "RespondentResponse_mediaUrlId_fkey" FOREIGN KEY ("mediaUrlId") REFERENCES "MediaUrl"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatedResponse" ADD CONSTRAINT "ValidatedResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatedResponse" ADD CONSTRAINT "ValidatedResponse_surveyorNumberId_fkey" FOREIGN KEY ("surveyorNumberId") REFERENCES "SurveyorNumber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
