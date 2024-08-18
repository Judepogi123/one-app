-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_houseHoldId_fkey";

-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_precintsId_fkey";

-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_purokId_fkey";

-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_teamLeaderId_fkey";

-- AlterTable
ALTER TABLE "Voters" ALTER COLUMN "houseHoldId" DROP NOT NULL,
ALTER COLUMN "mobileNumber" DROP NOT NULL,
ALTER COLUMN "precintsId" DROP NOT NULL,
ALTER COLUMN "precintsId" DROP DEFAULT,
ALTER COLUMN "purokId" DROP NOT NULL,
ALTER COLUMN "teamLeaderId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_precintsId_fkey" FOREIGN KEY ("precintsId") REFERENCES "Precents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_houseHoldId_fkey" FOREIGN KEY ("houseHoldId") REFERENCES "HouseHold"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_purokId_fkey" FOREIGN KEY ("purokId") REFERENCES "Purok"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "TeamLeader"("id") ON DELETE SET NULL ON UPDATE CASCADE;
