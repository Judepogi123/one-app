/*
  Warnings:

  - You are about to drop the column `zipCode` on the `Municipals` table. All the data in the column will be lost.
  - You are about to drop the column `precentsId` on the `Voters` table. All the data in the column will be lost.
  - You are about to drop the column `purok` on the `Voters` table. All the data in the column will be lost.
  - You are about to drop the `BatchYear` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `purokId` to the `Precents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `houseHoldId` to the `Voters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mobileNumber` to the `Voters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `newBatchDraftId` to the `Voters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precintsId` to the `Voters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purokId` to the `Voters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saveStatus` to the `Voters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tagID` to the `Voters` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Voters` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_batchYearId_fkey";

-- DropForeignKey
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_precentsId_fkey";

-- AlterTable
ALTER TABLE "Municipals" DROP COLUMN "zipCode";

-- AlterTable
ALTER TABLE "Precents" ADD COLUMN     "purokId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Voters" DROP COLUMN "precentsId",
DROP COLUMN "purok",
ADD COLUMN     "houseHoldId" TEXT NOT NULL,
ADD COLUMN     "mobileNumber" TEXT NOT NULL,
ADD COLUMN     "newBatchDraftId" TEXT NOT NULL,
ADD COLUMN     "precintsId" TEXT NOT NULL,
ADD COLUMN     "purokId" INTEGER NOT NULL,
ADD COLUMN     "saveStatus" TEXT NOT NULL,
ADD COLUMN     "tagID" TEXT NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL;

-- DropTable
DROP TABLE "BatchYear";

-- CreateTable
CREATE TABLE "Candidates" (
    "id" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "candidateBatchId" TEXT NOT NULL,

    CONSTRAINT "Candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateBatch" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purok" (
    "id" SERIAL NOT NULL,
    "purokNumber" TEXT NOT NULL,
    "barangaysId" TEXT NOT NULL,
    "municipalsId" INTEGER NOT NULL,

    CONSTRAINT "Purok_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseHold" (
    "id" TEXT NOT NULL,
    "houseHoldNumber" TEXT NOT NULL,
    "barangaysId" TEXT NOT NULL,
    "municipalsId" INTEGER NOT NULL,
    "purokId" INTEGER NOT NULL,

    CONSTRAINT "HouseHold_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Candidates" ADD CONSTRAINT "Candidates_candidateBatchId_fkey" FOREIGN KEY ("candidateBatchId") REFERENCES "CandidateBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_precintsId_fkey" FOREIGN KEY ("precintsId") REFERENCES "Precents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_newBatchDraftId_fkey" FOREIGN KEY ("newBatchDraftId") REFERENCES "NewBatchDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_houseHoldId_fkey" FOREIGN KEY ("houseHoldId") REFERENCES "HouseHold"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_purokId_fkey" FOREIGN KEY ("purokId") REFERENCES "Purok"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purok" ADD CONSTRAINT "Purok_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purok" ADD CONSTRAINT "Purok_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseHold" ADD CONSTRAINT "HouseHold_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseHold" ADD CONSTRAINT "HouseHold_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseHold" ADD CONSTRAINT "HouseHold_purokId_fkey" FOREIGN KEY ("purokId") REFERENCES "Purok"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Precents" ADD CONSTRAINT "Precents_purokId_fkey" FOREIGN KEY ("purokId") REFERENCES "Purok"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
