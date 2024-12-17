-- DropForeignKey
ALTER TABLE "TeamRecords" DROP CONSTRAINT "TeamRecords_usersUid_fkey";

-- DropForeignKey
ALTER TABLE "VoterRecords" DROP CONSTRAINT "VoterRecords_usersUid_fkey";

-- AlterTable
ALTER TABLE "Option" ADD COLUMN     "customizable" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "QueryAnswer" ADD COLUMN     "customOptionId" TEXT;

-- AlterTable
ALTER TABLE "TeamRecords" ALTER COLUMN "usersUid" DROP NOT NULL;

-- AlterTable
ALTER TABLE "VoterRecords" ALTER COLUMN "votersId" DROP NOT NULL,
ALTER COLUMN "usersUid" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "QueryAnswer" ADD CONSTRAINT "QueryAnswer_customOptionId_fkey" FOREIGN KEY ("customOptionId") REFERENCES "CustomOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRecords" ADD CONSTRAINT "TeamRecords_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoterRecords" ADD CONSTRAINT "VoterRecords_usersUid_fkey" FOREIGN KEY ("usersUid") REFERENCES "Users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
