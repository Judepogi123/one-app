/*
  Warnings:

  - You are about to drop the column `purokId` on the `Precents` table. All the data in the column will be lost.
  - The primary key for the `Voters` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `ageRange` on the `Voters` table. All the data in the column will be lost.
  - You are about to drop the column `batchYearId` on the `Voters` table. All the data in the column will be lost.
  - You are about to drop the column `tagID` on the `Voters` table. All the data in the column will be lost.
  - You are about to drop the column `uid` on the `Voters` table. All the data in the column will be lost.
  - Added the required column `waveId` to the `CandidateBatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Candidates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `desc` to the `Candidates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `calcAge` to the `Voters` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `Voters` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Precents" DROP CONSTRAINT "Precents_purokId_fkey";

-- AlterTable
ALTER TABLE "CandidateBatch" ADD COLUMN     "waveId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Candidates" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "desc" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Municipals" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "municipals_id_seq";

-- AlterTable
ALTER TABLE "Precents" DROP COLUMN "purokId";

-- AlterTable
ALTER TABLE "Voters" DROP CONSTRAINT "Voters_pkey",
DROP COLUMN "ageRange",
DROP COLUMN "batchYearId",
DROP COLUMN "tagID",
DROP COLUMN "uid",
ADD COLUMN     "calcAge" INTEGER NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "teamLeaderId" TEXT NOT NULL DEFAULT 'Unknown',
ALTER COLUMN "houseHoldId" SET DEFAULT 'Unknown',
ALTER COLUMN "mobileNumber" SET DEFAULT 'Unknown',
ALTER COLUMN "precintsId" SET DEFAULT 'Unknown',
ALTER COLUMN "saveStatus" SET DEFAULT 'drafted',
ADD CONSTRAINT "Voters_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "Wave" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hub" (
    "id" TEXT NOT NULL,
    "barangaysId" TEXT NOT NULL,
    "municipalsId" INTEGER NOT NULL,
    "voterUid" TEXT NOT NULL,

    CONSTRAINT "Hub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CutstomList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wave" TEXT NOT NULL,
    "municipalId" INTEGER NOT NULL,
    "barangayId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CutstomList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamLeader" (
    "id" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "purokCoorId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,

    CONSTRAINT "TeamLeader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurokCoor" (
    "id" TEXT NOT NULL,
    "municipalsId" INTEGER NOT NULL,
    "barangaysId" TEXT NOT NULL,
    "barangayCoorId" TEXT NOT NULL,
    "votersId" TEXT NOT NULL,

    CONSTRAINT "PurokCoor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarangayCoor" (
    "id" TEXT NOT NULL,
    "municipalsId" INTEGER NOT NULL,
    "barangaysId" TEXT NOT NULL,
    "votersId" TEXT NOT NULL,

    CONSTRAINT "BarangayCoor_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CandidateBatch" ADD CONSTRAINT "CandidateBatch_waveId_fkey" FOREIGN KEY ("waveId") REFERENCES "Wave"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voters" ADD CONSTRAINT "Voters_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "TeamLeader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hub" ADD CONSTRAINT "Hub_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hub" ADD CONSTRAINT "Hub_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hub" ADD CONSTRAINT "Hub_voterUid_fkey" FOREIGN KEY ("voterUid") REFERENCES "Voters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLeader" ADD CONSTRAINT "TeamLeader_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLeader" ADD CONSTRAINT "TeamLeader_purokCoorId_fkey" FOREIGN KEY ("purokCoorId") REFERENCES "PurokCoor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurokCoor" ADD CONSTRAINT "PurokCoor_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurokCoor" ADD CONSTRAINT "PurokCoor_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurokCoor" ADD CONSTRAINT "PurokCoor_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurokCoor" ADD CONSTRAINT "PurokCoor_barangayCoorId_fkey" FOREIGN KEY ("barangayCoorId") REFERENCES "BarangayCoor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangayCoor" ADD CONSTRAINT "BarangayCoor_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangayCoor" ADD CONSTRAINT "BarangayCoor_municipalsId_fkey" FOREIGN KEY ("municipalsId") REFERENCES "Municipals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangayCoor" ADD CONSTRAINT "BarangayCoor_barangaysId_fkey" FOREIGN KEY ("barangaysId") REFERENCES "Barangays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
