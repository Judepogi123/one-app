-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_newBatchDraftId_fkey";

-- AlterTable
ALTER TABLE "Voters" ALTER COLUMN "houseHoldId" SET DEFAULT 'Unknown',
ALTER COLUMN "mobileNumber" SET DEFAULT 'Unknown',
ALTER COLUMN "newBatchDraftId" DROP NOT NULL,
ALTER COLUMN "newBatchDraftId" SET DEFAULT 'Unknown',
ALTER COLUMN "precintsId" SET DEFAULT 'Unknown',
ALTER COLUMN "teamLeaderId" SET DEFAULT 'Unknown',
ALTER COLUMN "hubId" SET DEFAULT 'Unknown';

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_newBatchDraftId_fkey" FOREIGN KEY ("newBatchDraftId") REFERENCES "NewBatchDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;
