/*
  Warnings:

  - Added the required column `draftID` to the `Purok` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Purok" ADD COLUMN     "draftID" TEXT NOT NULL;
