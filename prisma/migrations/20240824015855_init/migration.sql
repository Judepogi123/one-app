-- DropForeignKey
ALTER TABLE "Option" DROP CONSTRAINT "Option_mediaUrlId_fkey";

-- AlterTable
ALTER TABLE "MediaUrl" ADD COLUMN     "optionId" TEXT NOT NULL DEFAULT '--/--';

-- AddForeignKey
ALTER TABLE "MediaUrl" ADD CONSTRAINT "MediaUrl_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
