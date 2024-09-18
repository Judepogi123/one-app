/*
  Warnings:

  - Added the required column `ageBracketId` to the `Quota` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quota" ADD COLUMN     "ageBracketId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Quota" ADD CONSTRAINT "Quota_ageBracketId_fkey" FOREIGN KEY ("ageBracketId") REFERENCES "AgeBracket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
