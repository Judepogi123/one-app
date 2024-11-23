/*
  Warnings:

  - You are about to drop the column `base64` on the `QRcode` table. All the data in the column will be lost.
  - Added the required column `qrCode` to the `QRcode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "QRcode" DROP COLUMN "base64",
ADD COLUMN     "qrCode" TEXT NOT NULL,
ALTER COLUMN "scannedDateTime" SET DEFAULT 'N/A';
