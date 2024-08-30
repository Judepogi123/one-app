/*
  Warnings:

  - Added the required column `respondentResponseId` to the `Response` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surveyResponseId` to the `Response` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surveyId` to the `SurveyResponse` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SurveyResponse" DROP CONSTRAINT "SurveyResponse_usersUid_fkey";

-- AlterTable
ALTER TABLE "Response" ADD COLUMN     "respondentResponseId" TEXT NOT NULL,
ADD COLUMN     "surveyResponseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SurveyResponse" ADD COLUMN     "surveyId" TEXT NOT NULL,
ALTER COLUMN "usersUid" DROP NOT NULL;

-- CreateTable
CREATE TABLE "RespondentResponse" (
    "id" TEXT NOT NULL,
    "ageBracketId" TEXT NOT NULL,
    "genderId" TEXT NOT NULL,
    "municipalsId" INTEGER NOT NULL,
    "barangaysId" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "surveyResponseId" TEXT NOT NULL,

    CONSTRAINT "RespondentResponse_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentResponse" ADD CONSTRAINT "RespondentResponse_ageBracketId_fkey" FOREIGN KEY ("ageBracketId") REFERENCES "AgeBracket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentResponse" ADD CONSTRAINT "RespondentResponse_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentResponse" ADD CONSTRAINT "RespondentResponse_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentResponse" ADD CONSTRAINT "RespondentResponse_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentResponse" ADD CONSTRAINT "RespondentResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentResponse" ADD CONSTRAINT "RespondentResponse_surveyResponseId_fkey" FOREIGN KEY ("surveyResponseId") REFERENCES "SurveyResponse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_surveyResponseId_fkey" FOREIGN KEY ("surveyResponseId") REFERENCES "SurveyResponse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_respondentResponseId_fkey" FOREIGN KEY ("respondentResponseId") REFERENCES "RespondentResponse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
