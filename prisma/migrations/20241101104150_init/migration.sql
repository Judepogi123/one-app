/*
  Warnings:

  - You are about to drop the column `barangayCoorId` on the `QRcode` table. All the data in the column will be lost.
  - You are about to drop the column `barangaysId` on the `QRcode` table. All the data in the column will be lost.
  - You are about to drop the column `municipalsId` on the `QRcode` table. All the data in the column will be lost.
  - You are about to drop the column `purokCoorId` on the `QRcode` table. All the data in the column will be lost.
  - You are about to drop the column `purokId` on the `QRcode` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `QRcode` table. All the data in the column will be lost.
  - You are about to drop the column `teamLeaderId` on the `QRcode` table. All the data in the column will be lost.
  - Added the required column `base64` to the `QRcode` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "QRcode" DROP CONSTRAINT "QRcode_barangayCoorId_fkey";

-- DropForeignKey
ALTER TABLE "QRcode" DROP CONSTRAINT "QRcode_barangaysId_fkey";

-- DropForeignKey
ALTER TABLE "QRcode" DROP CONSTRAINT "QRcode_municipalsId_fkey";

-- DropForeignKey
ALTER TABLE "QRcode" DROP CONSTRAINT "QRcode_purokCoorId_fkey";

-- DropForeignKey
ALTER TABLE "QRcode" DROP CONSTRAINT "QRcode_purokId_fkey";

-- DropForeignKey
ALTER TABLE "QRcode" DROP CONSTRAINT "QRcode_teamId_fkey";

-- DropForeignKey
ALTER TABLE "QRcode" DROP CONSTRAINT "QRcode_teamLeaderId_fkey";

-- DropForeignKey
ALTER TABLE "QRcode" DROP CONSTRAINT "QRcode_votersId_fkey";

-- AlterTable
ALTER TABLE "QRcode" DROP COLUMN "barangayCoorId",
DROP COLUMN "barangaysId",
DROP COLUMN "municipalsId",
DROP COLUMN "purokCoorId",
DROP COLUMN "purokId",
DROP COLUMN "teamId",
DROP COLUMN "teamLeaderId",
ADD COLUMN     "base64" TEXT NOT NULL,
ADD COLUMN     "scannedDateTime" TEXT DEFAULT 'Unknown',
ALTER COLUMN "stamp" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "QRcode" ADD CONSTRAINT "QRcode_votersId_fkey" FOREIGN KEY ("votersId") REFERENCES "Voters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
