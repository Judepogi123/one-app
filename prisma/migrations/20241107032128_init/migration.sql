-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_teamLeaderId_fkey";

-- AlterTable
ALTER TABLE "Team" ALTER COLUMN "teamLeaderId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "TeamLeader"("id") ON DELETE SET NULL ON UPDATE CASCADE;
