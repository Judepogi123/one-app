/*
  Warnings:

  - You are about to drop the column `votersId` on the `ValidatedTeams` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ValidatedTeams" DROP CONSTRAINT "ValidatedTeams_votersId_fkey";

-- AlterTable
ALTER TABLE "ValidatedTeams" DROP COLUMN "votersId";
