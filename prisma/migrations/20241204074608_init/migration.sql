-- DropForeignKey
ALTER TABLE "ValidatedTeamMembers" DROP CONSTRAINT "ValidatedTeamMembers_barangayId_fkey";

-- DropForeignKey
ALTER TABLE "ValidatedTeamMembers" DROP CONSTRAINT "ValidatedTeamMembers_municipalsId_fkey";

-- DropForeignKey
ALTER TABLE "ValidatedTeamMembers" DROP CONSTRAINT "ValidatedTeamMembers_validatedTeamsId_fkey";

-- DropForeignKey
ALTER TABLE "ValidatedTeams" DROP CONSTRAINT "ValidatedTeams_barangaysId_fkey";

-- DropForeignKey
ALTER TABLE "ValidatedTeams" DROP CONSTRAINT "ValidatedTeams_municipalsId_fkey";

-- AddForeignKey
ALTER TABLE "ValidatedTeams" ADD CONSTRAINT "ValidatedTeams_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatedTeams" ADD CONSTRAINT "ValidatedTeams_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatedTeams" ADD CONSTRAINT "ValidatedTeams_purokId_fkey" FOREIGN KEY ("purokId") REFERENCES "Purok"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatedTeamMembers" ADD CONSTRAINT "ValidatedTeamMembers_barangayId_fkey" FOREIGN KEY ("barangayId") REFERENCES "Barangays"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatedTeamMembers" ADD CONSTRAINT "ValidatedTeamMembers_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidatedTeamMembers" ADD CONSTRAINT "ValidatedTeamMembers_validatedTeamsId_fkey" FOREIGN KEY ("validatedTeamsId") REFERENCES "ValidatedTeams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
