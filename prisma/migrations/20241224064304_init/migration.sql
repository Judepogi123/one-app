-- AlterTable
ALTER TABLE "CustomOption" ADD COLUMN     "respondentResponseId" TEXT;

-- AlterTable
ALTER TABLE "Response" ADD COLUMN     "customOptionId" TEXT,
ALTER COLUMN "optionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CustomOption" ADD CONSTRAINT "CustomOption_respondentResponseId_fkey" FOREIGN KEY ("respondentResponseId") REFERENCES "RespondentResponse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_customOptionId_fkey" FOREIGN KEY ("customOptionId") REFERENCES "CustomOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
