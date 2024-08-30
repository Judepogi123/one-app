-- DropForeignKey
ALTER TABLE "MediaUrl" DROP CONSTRAINT "MediaUrl_optionId_fkey";

-- AlterTable
ALTER TABLE "MediaUrl" ALTER COLUMN "optionId" DROP NOT NULL,
ALTER COLUMN "optionId" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "MediaUrl" ADD CONSTRAINT "MediaUrl_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE SET NULL ON UPDATE CASCADE;
