-- DropForeignKey
ALTER TABLE "BarangayCoor" DROP CONSTRAINT "BarangayCoor_barangaysId_fkey";

-- DropForeignKey
ALTER TABLE "BarangayCoor" DROP CONSTRAINT "BarangayCoor_municipalsId_fkey";

-- DropForeignKey
ALTER TABLE "BarangayCoor" DROP CONSTRAINT "BarangayCoor_votersId_fkey";

-- DropForeignKey
ALTER TABLE "Barangays" DROP CONSTRAINT "Barangays_municipalId_fkey";

-- DropForeignKey
ALTER TABLE "CandidateBatch" DROP CONSTRAINT "CandidateBatch_waveId_fkey";

-- DropForeignKey
ALTER TABLE "Candidates" DROP CONSTRAINT "Candidates_candidateBatchId_fkey";

-- DropForeignKey
ALTER TABLE "DeviceLogs" DROP CONSTRAINT "DeviceLogs_adminUserUid_fkey";

-- DropForeignKey
ALTER TABLE "DeviceLogs" DROP CONSTRAINT "DeviceLogs_surveyId_fkey";

-- DropForeignKey
ALTER TABLE "DeviceLogs" DROP CONSTRAINT "DeviceLogs_usersUid_fkey";

-- DropForeignKey
ALTER TABLE "GenderSize" DROP CONSTRAINT "GenderSize_genderId_fkey";

-- DropForeignKey
ALTER TABLE "GenderSize" DROP CONSTRAINT "GenderSize_quotaId_fkey";

-- DropForeignKey
ALTER TABLE "GenderTotal" DROP CONSTRAINT "GenderTotal_genderId_fkey";

-- DropForeignKey
ALTER TABLE "HouseHold" DROP CONSTRAINT "HouseHold_barangaysId_fkey";

-- DropForeignKey
ALTER TABLE "HouseHold" DROP CONSTRAINT "HouseHold_municipalsId_fkey";

-- DropForeignKey
ALTER TABLE "HouseHold" DROP CONSTRAINT "HouseHold_purokId_fkey";

-- DropForeignKey
ALTER TABLE "Hub" DROP CONSTRAINT "Hub_barangaysId_fkey";

-- DropForeignKey
ALTER TABLE "Hub" DROP CONSTRAINT "Hub_municipalsId_fkey";

-- DropForeignKey
ALTER TABLE "Hub" DROP CONSTRAINT "Hub_teamLeaderId_fkey";

-- DropForeignKey
ALTER TABLE "MediaUrl" DROP CONSTRAINT "MediaUrl_optionId_fkey";

-- DropForeignKey
ALTER TABLE "MediaUrl" DROP CONSTRAINT "MediaUrl_surveyId_fkey";

-- DropForeignKey
ALTER TABLE "NewBatchDraft" DROP CONSTRAINT "NewBatchDraft_barangayId_fkey";

-- DropForeignKey
ALTER TABLE "NewBatchDraft" DROP CONSTRAINT "NewBatchDraft_municipalId_fkey";

-- DropForeignKey
ALTER TABLE "Option" DROP CONSTRAINT "Option_queryId_fkey";

-- DropForeignKey
ALTER TABLE "Precents" DROP CONSTRAINT "Precents_barangayId_fkey";

-- DropForeignKey
ALTER TABLE "Precents" DROP CONSTRAINT "Precents_municipalsId_fkey";

-- DropForeignKey
ALTER TABLE "Purok" DROP CONSTRAINT "Purok_barangaysId_fkey";

-- DropForeignKey
ALTER TABLE "Purok" DROP CONSTRAINT "Purok_municipalsId_fkey";

-- DropForeignKey
ALTER TABLE "PurokCoor" DROP CONSTRAINT "PurokCoor_barangayCoorId_fkey";

-- DropForeignKey
ALTER TABLE "PurokCoor" DROP CONSTRAINT "PurokCoor_barangaysId_fkey";

-- DropForeignKey
ALTER TABLE "PurokCoor" DROP CONSTRAINT "PurokCoor_municipalsId_fkey";

-- DropForeignKey
ALTER TABLE "PurokCoor" DROP CONSTRAINT "PurokCoor_votersId_fkey";

-- DropForeignKey
ALTER TABLE "Queries" DROP CONSTRAINT "Queries_surveyId_fkey";

-- DropForeignKey
ALTER TABLE "QueryAnswer" DROP CONSTRAINT "QueryAnswer_optionId_fkey";

-- DropForeignKey
ALTER TABLE "QueryAnswer" DROP CONSTRAINT "QueryAnswer_queriesId_fkey";

-- DropForeignKey
ALTER TABLE "QueryAnswer" DROP CONSTRAINT "QueryAnswer_responseId_fkey";

-- DropForeignKey
ALTER TABLE "Quota" DROP CONSTRAINT "Quota_ageBracketId_fkey";

-- DropForeignKey
ALTER TABLE "Quota" DROP CONSTRAINT "Quota_barangaysId_fkey";

-- DropForeignKey
ALTER TABLE "RespondentResponse" DROP CONSTRAINT "RespondentResponse_ageBracketId_fkey";

-- DropForeignKey
ALTER TABLE "RespondentResponse" DROP CONSTRAINT "RespondentResponse_barangaysId_fkey";

-- DropForeignKey
ALTER TABLE "RespondentResponse" DROP CONSTRAINT "RespondentResponse_genderId_fkey";

-- DropForeignKey
ALTER TABLE "RespondentResponse" DROP CONSTRAINT "RespondentResponse_municipalsId_fkey";

-- DropForeignKey
ALTER TABLE "RespondentResponse" DROP CONSTRAINT "RespondentResponse_surveyId_fkey";

-- DropForeignKey
ALTER TABLE "RespondentResponse" DROP CONSTRAINT "RespondentResponse_surveyResponseId_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_ageBracketId_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_barangaysId_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_genderId_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_municipalsId_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_optionId_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_queryId_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_respondentResponseId_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_surveyId_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_surveyResponseId_fkey";

-- DropForeignKey
ALTER TABLE "Survey" DROP CONSTRAINT "Survey_adminUserUid_fkey";

-- DropForeignKey
ALTER TABLE "SurveyResponse" DROP CONSTRAINT "SurveyResponse_barangaysId_fkey";

-- DropForeignKey
ALTER TABLE "SurveyResponse" DROP CONSTRAINT "SurveyResponse_municipalsId_fkey";

-- DropForeignKey
ALTER TABLE "SurveyResponse" DROP CONSTRAINT "SurveyResponse_surveyId_fkey";

-- DropForeignKey
ALTER TABLE "SurveyResponse" DROP CONSTRAINT "SurveyResponse_usersUid_fkey";

-- DropForeignKey
ALTER TABLE "TeamLeader" DROP CONSTRAINT "TeamLeader_purokCoorId_fkey";

-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_barangaysId_fkey";

-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_houseHoldId_fkey";

-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_hubId_fkey";

-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_municipalsId_fkey";

-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_newBatchDraftId_fkey";

-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_precintsId_fkey";

-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_purokId_fkey";

-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_teamLeaderId_fkey";

-- AddForeignKey
ALTER TABLE "Candidates" ADD CONSTRAINT "Candidates_candidateBatchId_fkey" FOREIGN KEY ("candidateBatchId") REFERENCES "CandidateBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateBatch" ADD CONSTRAINT "CandidateBatch_waveId_fkey" FOREIGN KEY ("waveId") REFERENCES "Wave"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_precintsId_fkey" FOREIGN KEY ("precintsId") REFERENCES "Precents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_newBatchDraftId_fkey" FOREIGN KEY ("newBatchDraftId") REFERENCES "NewBatchDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_houseHoldId_fkey" FOREIGN KEY ("houseHoldId") REFERENCES "HouseHold"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_purokId_fkey" FOREIGN KEY ("purokId") REFERENCES "Purok"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "TeamLeader"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purok" ADD CONSTRAINT "Purok_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purok" ADD CONSTRAINT "Purok_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Barangays" ADD CONSTRAINT "Barangays_municipalId_fkey" FOREIGN KEY ("municipalId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseHold" ADD CONSTRAINT "HouseHold_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseHold" ADD CONSTRAINT "HouseHold_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseHold" ADD CONSTRAINT "HouseHold_purokId_fkey" FOREIGN KEY ("purokId") REFERENCES "Purok"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hub" ADD CONSTRAINT "Hub_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hub" ADD CONSTRAINT "Hub_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hub" ADD CONSTRAINT "Hub_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "TeamLeader"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Precents" ADD CONSTRAINT "Precents_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Precents" ADD CONSTRAINT "Precents_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewBatchDraft" ADD CONSTRAINT "NewBatchDraft_municipalId_fkey" FOREIGN KEY ("municipalId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewBatchDraft" ADD CONSTRAINT "NewBatchDraft_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLeader" ADD CONSTRAINT "TeamLeader_purokCoorId_fkey" FOREIGN KEY ("purokCoorId") REFERENCES "PurokCoor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurokCoor" ADD CONSTRAINT "PurokCoor_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurokCoor" ADD CONSTRAINT "PurokCoor_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurokCoor" ADD CONSTRAINT "PurokCoor_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurokCoor" ADD CONSTRAINT "PurokCoor_barangayCoorId_fkey" FOREIGN KEY ("barangayCoorId") REFERENCES "BarangayCoor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangayCoor" ADD CONSTRAINT "BarangayCoor_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangayCoor" ADD CONSTRAINT "BarangayCoor_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangayCoor" ADD CONSTRAINT "BarangayCoor_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_adminUserUid_fkey" FOREIGN KEY ("adminUserUid") REFERENCES "AdminUser"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenderTotal" ADD CONSTRAINT "GenderTotal_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenderSize" ADD CONSTRAINT "GenderSize_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GenderSize" ADD CONSTRAINT "GenderSize_quotaId_fkey" FOREIGN KEY ("quotaId") REFERENCES "Quota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quota" ADD CONSTRAINT "Quota_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quota" ADD CONSTRAINT "Quota_ageBracketId_fkey" FOREIGN KEY ("ageBracketId") REFERENCES "AgeBracket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Queries" ADD CONSTRAINT "Queries_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "Queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaUrl" ADD CONSTRAINT "MediaUrl_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaUrl" ADD CONSTRAINT "MediaUrl_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentResponse" ADD CONSTRAINT "RespondentResponse_ageBracketId_fkey" FOREIGN KEY ("ageBracketId") REFERENCES "AgeBracket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentResponse" ADD CONSTRAINT "RespondentResponse_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentResponse" ADD CONSTRAINT "RespondentResponse_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentResponse" ADD CONSTRAINT "RespondentResponse_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentResponse" ADD CONSTRAINT "RespondentResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespondentResponse" ADD CONSTRAINT "RespondentResponse_surveyResponseId_fkey" FOREIGN KEY ("surveyResponseId") REFERENCES "SurveyResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "Queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_ageBracketId_fkey" FOREIGN KEY ("ageBracketId") REFERENCES "AgeBracket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_genderId_fkey" FOREIGN KEY ("genderId") REFERENCES "Gender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_surveyResponseId_fkey" FOREIGN KEY ("surveyResponseId") REFERENCES "SurveyResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_respondentResponseId_fkey" FOREIGN KEY ("respondentResponseId") REFERENCES "RespondentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryAnswer" ADD CONSTRAINT "QueryAnswer_queriesId_fkey" FOREIGN KEY ("queriesId") REFERENCES "Queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryAnswer" ADD CONSTRAINT "QueryAnswer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueryAnswer" ADD CONSTRAINT "QueryAnswer_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "Response"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceLogs" ADD CONSTRAINT "DeviceLogs_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceLogs" ADD CONSTRAINT "DeviceLogs_adminUserUid_fkey" FOREIGN KEY ("adminUserUid") REFERENCES "AdminUser"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceLogs" ADD CONSTRAINT "DeviceLogs_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
